from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import re
import json
from google import genai
import uuid
from dotenv import load_dotenv

# Tải biến môi trường
load_dotenv()

app = Flask(__name__)

# --- CẤU HÌNH ĐƯỜNG DẪN ---
BASE_DIR = os.getcwd()
MAP_DATA_FOLDER = os.path.join(BASE_DIR, 'Mapdata')
HISTORY_DATA_FOLDER = os.path.join(BASE_DIR, 'HistoryData')
GEO_DATA_FOLDER = os.path.join(BASE_DIR, 'GeoData')
MERGE_DATA_FOLDER = os.path.join(BASE_DIR, 'HistoryData', 'MergeData')

# Đảm bảo các thư mục tồn tại
for folder in [MAP_DATA_FOLDER, HISTORY_DATA_FOLDER, GEO_DATA_FOLDER, MERGE_DATA_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)

# Cấu hình Gemini AI
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
gemini_client = None
if GOOGLE_API_KEY:
    # Khởi tạo client theo chuẩn thư viện google-genai mới
    gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
else:
    print("⚠️ CẢNH BÁO: Chưa cấu hình GOOGLE_API_KEY")

# Lưu trữ session chat
chat_sessions = {}

# --- CACHE DỮ LIỆU SÁP NHẬP ĐỂ CUNG CẤP CHO AI ---
MERGER_CONTEXT_CACHE = ""

def load_merger_context():
    """Tải và format dữ liệu sáp nhập để đưa vào System Prompt của AI"""
    global MERGER_CONTEXT_CACHE
    if MERGER_CONTEXT_CACHE:
        return MERGER_CONTEXT_CACHE

    context = "DỮ LIỆU THAM KHẢO VỀ SÁP NHẬP ĐỊA GIỚI HÀNH CHÍNH (Áp dụng từ 1/7/2025):\n\n"

    # 1. Thông tin sáp nhập Tỉnh (từ timeline_index.json)
    timeline_path = os.path.join(HISTORY_DATA_FOLDER, 'timeline_index.json')
    if os.path.exists(timeline_path):
        try:
            with open(timeline_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # Tìm mục năm 2025
                merger_2025 = next((item for item in data if item.get('year') == 2025), None)
                if merger_2025 and 'changes' in merger_2025:
                    context += "1. Sáp nhập cấp Tỉnh:\n"
                    for change in merger_2025['changes']:
                        # change có dạng {from: [...], to: [...]}
                        if isinstance(change, dict) and 'from' in change and 'to' in change:
                            src = ", ".join(change['from'])
                            dst = ", ".join(change['to'])
                            context += f"   - Các tỉnh cũ [{src}] đã sáp nhập thành [{dst}]\n"
                    context += "\n"
        except Exception as e:
            print(f"Lỗi đọc timeline_index.json: {e}")

    # 2. Thông tin sáp nhập Xã (từ folder MergeData)
    context += "2. Sáp nhập cấp Xã (Chi tiết):\n"
    if os.path.exists(MERGE_DATA_FOLDER):
        for filename in os.listdir(MERGE_DATA_FOLDER):
            if filename.endswith('.json'):
                file_path = os.path.join(MERGE_DATA_FOLDER, filename)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        prov_data = json.load(f)
                        # prov_data thường có key là tên tỉnh, value là list thay đổi
                        for province, changes in prov_data.items():
                            context += f"   * Tỉnh {province}:\n"
                            for change in changes:
                                # change có dạng {from: [{commune, district...}], to: {commune...}}
                                src_names = []
                                if isinstance(change.get('from'), list):
                                    src_names = [f"{item.get('commune', '')} ({item.get('district', '')})" for item in change['from']]
                                
                                dst_name = change.get('to', {}).get('commune', 'Mới')
                                context += f"      - [{', '.join(src_names)}] -> Thành [{dst_name}]\n"
                except Exception as e:
                    print(f"Lỗi đọc file {filename}: {e}")
    
    MERGER_CONTEXT_CACHE = context
    return context

def scan_map_files():
    """Quét thư mục Mapdata để tìm file theo năm."""
    config = {
        'years': set(),
        'files': {
            'province': [],
            'district': [],
            'ward': []
        }
    }
    
    if not os.path.exists(MAP_DATA_FOLDER):
        return config

    files = os.listdir(MAP_DATA_FOLDER)
    
    p_prov = re.compile(r'provinces_(\d+)(?:_.*)?\.geojson', re.IGNORECASE)
    p_dist = re.compile(r'districts_(\d+)(?:_.*)?\.geojson', re.IGNORECASE)
    p_ward = re.compile(r'wards_(\d+)(?:_.*)?\.geojson', re.IGNORECASE)

    for f in files:
        m_prov = p_prov.match(f)
        if m_prov:
            year = int(m_prov.group(1))
            config['years'].add(year)
            config['files']['province'].append({'year': year, 'file': f})
            continue

        m_dist = p_dist.match(f)
        if m_dist:
            year = int(m_dist.group(1))
            config['years'].add(year)
            config['files']['district'].append({'year': year, 'file': f})
            continue

        m_ward = p_ward.match(f)
        if m_ward:
            year = int(m_ward.group(1))
            config['years'].add(year)
            config['files']['ward'].append({'year': year, 'file': f})
            continue

    config['years'] = sorted(list(config['years']))
    return config

def load_all_commune_merger_data():
    """Đọc và gộp tất cả file json trong HistoryData/MergeData"""
    combined_data = {}
    if not os.path.exists(MERGE_DATA_FOLDER):
        return combined_data

    for filename in os.listdir(MERGE_DATA_FOLDER):
        if filename.endswith('.json'):
            file_path = os.path.join(MERGE_DATA_FOLDER, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        combined_data.update(data)
            except Exception as e:
                print(f"Lỗi đọc file merger {filename}: {e}")
    return combined_data

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config')
def get_config():
    config = scan_map_files()
    return jsonify(config)

@app.route('/api/map/<filename>')
def get_map_data(filename):
    if not filename.endswith('.geojson'): return jsonify({"error": "Invalid type"}), 400
    return send_from_directory(MAP_DATA_FOLDER, filename)

@app.route('/api/history/<filename>')
def get_history_data(filename):
    if not filename.endswith('.json'): return jsonify({"error": "Invalid type"}), 400
    return send_from_directory(HISTORY_DATA_FOLDER, filename)

@app.route('/api/geodata/<filename>')
def get_geo_data(filename):
    if not filename.endswith('.json'): return jsonify({"error": "Invalid type"}), 400
    return send_from_directory(GEO_DATA_FOLDER, filename)

@app.route('/api/merger/communes')
def get_commune_merger_data():
    data = load_all_commune_merger_data()
    return jsonify(data)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('session_id')
    reset = data.get('reset', False)
    
    if not session_id: return jsonify({"error": "Missing session_id"}), 400

    # Kiểm tra xem client Gemini đã được khởi tạo chưa
    if not gemini_client:
        print(f"Lỗi: Google API Key chưa được cấu hình trên server.")
        return jsonify({"response": "Lỗi từ nhà phát triển, vui lòng thử lại vào lần dùng sau."}), 500

    try:
        if reset or session_id not in chat_sessions:
            # Tải ngữ cảnh sáp nhập để đưa vào system prompt
            merger_context = load_merger_context()
            
            system_prompt = f"""Bạn là Viemacle, chuyên gia Lịch sử và Địa lý Việt Nam.
            
            QUY TẮC TRẢ LỜI QUAN TRỌNG:
            1. Trả lời rõ ràng, chính xác các câu hỏi.
            2. XỬ LÝ CÂU HỎI VỀ ĐỊA ĐIỂM CŨ (TRƯỚC 1/7/2025):
               - Nếu người dùng hỏi về địa điểm vào thời gian trước 1/7/2025.
               - Hãy trả lời theo cấu trúc: "Vào năm [Năm], địa điểm là [Thông tin lịch sử/địa lý của bạn]..."
               - Sau đó, TRA CỨU DỮ LIỆU SÁP NHẬP DƯỚI ĐÂY. Nếu tìm thấy địa danh đó đã bị thay đổi/sáp nhập, hãy nói tiếp: "Nơi đó hiện nay là [Tên địa danh mới]..."
               - Nếu không có trong danh sách thay đổi, không cần bịa thêm thông tin.

            DƯỚI ĐÂY LÀ DỮ LIỆU SÁP NHẬP 2025 ĐỂ BẠN THAM KHẢO:
            {merger_context}
            """
            
            history = [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": "Tôi đã hiểu quy tắc. Tôi sẽ đối chiếu địa danh cũ với dữ liệu sáp nhập 2025 khi trả lời."}]}
            ]
            
            # Tạo session chat với model mới (gemini-2.5-flash hoặc gemini-1.5-flash)
            chat_sessions[session_id] = gemini_client.chats.create(model='gemini-2.5-flash', history=history)
            
            if reset: return jsonify({"response": "Đã bắt đầu cuộc trò chuyện mới."})

        if not user_message: return jsonify({"response": "..."})

        response = chat_sessions[session_id].send_message(user_message)
        return jsonify({"response": response.text})
    except Exception as e:
        print(f"Chat Error: {e}")
        if session_id in chat_sessions: del chat_sessions[session_id]
        return jsonify({"response": f"Lỗi! Vui lòng thử lại sau vài phút"})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050) 