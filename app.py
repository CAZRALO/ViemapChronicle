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
# --- CACHE DỮ LIỆU DICT ĐỂ TÌM KIẾM ---
MERGE_DICT_CACHE = None

def get_merge_dict():
    """Tải và cache dữ liệu sáp nhập dưới dạng Dictionary để dễ tìm kiếm"""
    global MERGE_DICT_CACHE
    if MERGE_DICT_CACHE is not None:
        return MERGE_DICT_CACHE
        
    MERGE_DICT_CACHE = load_all_commune_merger_data() # Gọi lại hàm đọc JSON của bạn
    return MERGE_DICT_CACHE

def extract_relevant_context(user_message):
    """Lọc các thông tin sáp nhập khớp với từ khóa trong câu hỏi"""
    merge_data = get_merge_dict()
    if not merge_data:
        return ""

    relevant_context = ""
    user_msg_lower = user_message.lower()

    for province, changes in merge_data.items():
        prov_context = ""
        # Nếu người dùng nhắc đến tên tỉnh
        province_in_query = province.lower() in user_msg_lower
        
        for change in changes:
            is_relevant = province_in_query
            src_names = []
            
            if isinstance(change.get('from'), list):
                for item in change['from']:
                    commune = item.get('commune', '')
                    district = item.get('district', '')
                    src_names.append(f"{commune} ({district})")
                    
                    # Kiểm tra xem tên xã/huyện cũ có nằm trong câu hỏi không
                    if commune.lower() in user_msg_lower or district.lower() in user_msg_lower:
                        is_relevant = True

            dst_name = change.get('to', {}).get('commune', 'Mới')
            # Kiểm tra xem tên xã mới có nằm trong câu hỏi không
            if dst_name.lower() in user_msg_lower:
                is_relevant = True

            if is_relevant:
                prov_context += f"      - [{', '.join(src_names)}] -> Thành [{dst_name}]\n"
        
        # Nếu có dữ liệu liên quan của tỉnh này, thêm vào context
        if prov_context:
            relevant_context += f"   * Tỉnh {province}:\n{prov_context}"
    
    return relevant_context 

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

    if not gemini_client:
        return jsonify({"response": "Lỗi từ nhà phát triển, vui lòng thử lại vào lần dùng sau."}), 500

    try:
        # 1. KHỞI TẠO SESSION VỚI SYSTEM PROMPT RẤT NGẮN GỌN (Tiết kiệm token đầu vào)
        if reset or session_id not in chat_sessions:
            system_prompt = """Bạn là Viemacle, chuyên gia Lịch sử và Địa lý Việt Nam.
            QUY TẮC:
            - Trả lời rõ ràng, chính xác.
            - Nếu người dùng hỏi về địa danh trước 1/7/2025, hãy trả lời về lịch sử của nó. 
            - Nếu hệ thống cung cấp [DỮ LIỆU SÁP NHẬP LIÊN QUAN], hãy cập nhật thêm cho người dùng là "Nơi đó hiện nay là [Tên địa danh mới]".
            - Nếu hệ thống không cung cấp thông tin sáp nhập cho địa danh đó, hãy trả lời bình thường và không bịa thêm."""
            
            history = [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": "Tôi đã hiểu quy tắc. Tôi đã sẵn sàng."}]}
            ]
            
            chat_sessions[session_id] = gemini_client.chats.create(model='gemini-2.5-flash', history=history)
            
            if reset: return jsonify({"response": "Đã bắt đầu cuộc trò chuyện mới."})

        if not user_message: return jsonify({"response": "..."})

        # 2. LỌC DỮ LIỆU ĐỘNG DỰA TRÊN CÂU HỎI
        dynamic_context = extract_relevant_context(user_message)
        
        # 3. GẮN DỮ LIỆU VÀO CÂU HỎI NẾU CÓ TÌM THẤY
        final_message = user_message
        if dynamic_context:
            final_message += f"\n\n[DỮ LIỆU SÁP NHẬP LIÊN QUAN TỪ HỆ THỐNG ĐỂ BẠN THAM KHẢO TRẢ LỜI]:\n{dynamic_context}"

        # Gửi tin nhắn đã được "bơm" thêm context cho AI
        response = chat_sessions[session_id].send_message(final_message)
        return jsonify({"response": response.text})
        
    except Exception as e:
        print(f"Chat Error: {e}")
        if session_id in chat_sessions: del chat_sessions[session_id]
        return jsonify({"response": f"Lỗi! Vui lòng thử lại sau vài phút"})
    
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5050) 