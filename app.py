from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import re
import json
from google import genai
import uuid
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

BASE_DIR = os.getcwd()
MAP_DATA_FOLDER = os.path.join(BASE_DIR, 'MapData')
HISTORY_DATA_FOLDER = os.path.join(BASE_DIR, 'HistoryData')
GEO_DATA_FOLDER = os.path.join(BASE_DIR, 'GeoData')
MERGE_DATA_FOLDER = os.path.join(BASE_DIR, 'HistoryData', 'MergeData')

for folder in [MAP_DATA_FOLDER, HISTORY_DATA_FOLDER, GEO_DATA_FOLDER, MERGE_DATA_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder, exist_ok=True)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
gemini_client = None
if GOOGLE_API_KEY:
    gemini_client = genai.Client(api_key=GOOGLE_API_KEY)
else:
    print("⚠️ CẢNH BÁO: Chưa cấu hình GOOGLE_API_KEY")

chat_sessions = {}

MERGER_CONTEXT_CACHE = ""
MERGE_DICT_CACHE = None

def load_all_commune_merger_data():
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

def get_merge_dict():
    """Tải và cache dữ liệu sáp nhập dưới dạng Dictionary để dễ tìm kiếm"""
    global MERGE_DICT_CACHE
    if MERGE_DICT_CACHE is not None:
        return MERGE_DICT_CACHE
        
    MERGE_DICT_CACHE = load_all_commune_merger_data() 
    return MERGE_DICT_CACHE

def clean_prefix(name):
    if not name: return ""
    name = str(name).lower().strip()
    prefixes = ["thành phố ", "tỉnh ", "thị xã ", "huyện ", "quận ", "thị trấn ", "phường ", "xã "]
    for p in prefixes:
        if name.startswith(p):
            return name[len(p):].strip()
    return name

def is_exact_match(keyword, text):
    if not keyword: return False
    text_clean = re.sub(r'[^\w\s]', ' ', text)
    return f" {keyword} " in f" {text_clean} "

def extract_relevant_context(user_message, session_history_text=""):
    merge_data = get_merge_dict()
    if not merge_data:
        return ""

    relevant_context = ""
    search_text = (session_history_text + " " + user_message).lower()

    for province, changes in merge_data.items():
        province_core = clean_prefix(province)
        include_whole_province = False
        
        if is_exact_match(province_core, search_text):
            include_whole_province = True
        
        if not include_whole_province:
            for change in changes:
                if isinstance(change.get('from'), list):
                    for item in change['from']:
                        c_core = clean_prefix(item.get('commune', ''))
                        d_core = clean_prefix(item.get('district', ''))
                        
                        if is_exact_match(c_core, search_text) or is_exact_match(d_core, search_text):
                            include_whole_province = True
                            break 
            
                dst_core = clean_prefix(change.get('to', {}).get('commune', ''))
                if is_exact_match(dst_core, search_text):
                    include_whole_province = True
                    
                if include_whole_province:
                    break 
                    
        if include_whole_province:
            prov_context = ""
            for change in changes:
                src_names = []
                if isinstance(change.get('from'), list):
                    for item in change['from']:
                        commune = item.get('commune', '')
                        district = item.get('district', '')
                        src_names.append(f"{commune} ({district})")
                
                dst_name = change.get('to', {}).get('commune', 'Mới')
                prov_context += f"      - [{', '.join(src_names)}] -> Thành [{dst_name}]\n"
            
            relevant_context += f"   * Tỉnh {province}:\n{prov_context}\n"
    
    return relevant_context

def format_map_selection_context(map_context):
    """Chuyển ngữ cảnh vùng đang chọn trên bản đồ thành hướng dẫn cho Gemini."""
    if not map_context or not isinstance(map_context, dict):
        return ""

    display = (map_context.get("display_name") or "").strip()
    if not display:
        parts = []
        for key, label_key in (
            ("ward", "ward_type"),
            ("district", "district_type"),
            ("province", "province_type"),
        ):
            name = (map_context.get(key) or "").strip()
            if name:
                admin_label = (map_context.get(label_key) or "").strip()
                parts.append(f"{admin_label} {name}".strip() if admin_label else name)
        display = ", ".join(parts)
    if not display:
        return ""

    year = map_context.get("year")
    level = map_context.get("level") or "province"
    level_vi = {"province": "tỉnh/thành", "district": "huyện/quận", "ward": "xã/phường"}.get(level, level)

    lines = [
        "Người dùng đang xem bản đồ Viemap và đã CHỌN một vùng trên bản đồ trước khi hỏi.",
        f"- Địa điểm đang chọn: {display}",
        f"- Cấp đơn vị được click: {level_vi}",
    ]
    if year is not None:
        lines.append(f"- Năm dữ liệu bản đồ đang hiển thị: {year}")

    province = (map_context.get("province") or "").strip()
    district = (map_context.get("district") or "").strip()
    ward = (map_context.get("ward") or "").strip()
    if province:
        lines.append(f"- Tỉnh/Thành: {province}")
    if district:
        lines.append(f"- Huyện/Quận: {district}")
    if ward:
        lines.append(f"- Xã/Phường: {ward}")

    lines.append(
        'Khi người dùng dùng từ "đây", "nơi này", "chỗ này", "vùng này" hoặc hỏi không nêu rõ tên địa danh, '
        f'hãy hiểu họ đang nói về: {display}. Trả lời tập trung vào địa phương đó.'
    )
    return "\n".join(lines)

def scan_map_files():
    config = {
        'years': set(),
        'files': {
            'province': {},
            'district': {},
            'ward': {}
        }
    }
    
    if not os.path.exists(MAP_DATA_FOLDER):
        return config

    files = os.listdir(MAP_DATA_FOLDER)
    
    patterns = {
        'province': re.compile(r'provinces_(\d+)(?:_.*)?\.(geojson|topojson)$', re.IGNORECASE),
        'district': re.compile(r'districts_(\d+)(?:_.*)?\.(geojson|topojson)$', re.IGNORECASE),
        'ward': re.compile(r'wards_(\d+)(?:_.*)?\.(geojson|topojson)$', re.IGNORECASE),
    }

    for f in files:
        for level, pattern in patterns.items():
            match = pattern.match(f)
            if not match:
                continue

            year = int(match.group(1))
            fmt = match.group(2).lower()
            current = config['files'][level].get(year)
            should_replace = current is None or (fmt == 'topojson' and current.get('format') != 'topojson')

            config['years'].add(year)
            if should_replace:
                config['files'][level][year] = {'year': year, 'file': f, 'format': fmt}
            break

    config['years'] = sorted(list(config['years']))
    for level in config['files']:
        config['files'][level] = sorted(config['files'][level].values(), key=lambda item: item['year'])
    return config

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/config')
def get_config():
    config = scan_map_files()
    return jsonify(config)

@app.route('/api/map/<filename>')
def get_map_data(filename):
    if not filename.lower().endswith(('.geojson', '.topojson')):
        return jsonify({"error": "Invalid type"}), 400
    response = send_from_directory(MAP_DATA_FOLDER, filename)
    response.mimetype = 'application/json'
    return response

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
    data = get_merge_dict()
    return jsonify(data)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('session_id')
    reset = data.get('reset', False)
    map_context = data.get('map_context')
    
    if not session_id: return jsonify({"error": "Missing session_id"}), 400

    if not gemini_client:
        return jsonify({"response": "Lỗi từ nhà phát triển, vui lòng thử lại vào lần dùng sau."}), 500

    try:
        if reset or session_id not in chat_sessions:
            system_prompt = """Bạn là Viemacle, chuyên gia Lịch sử và Địa lý Việt Nam.
            QUY TẮC:
            - Trả lời rõ ràng, chính xác.
            - Nếu người dùng hỏi về địa danh trước 1/7/2025, hãy trả lời về lịch sử của nó.
            - Nếu hệ thống cung cấp [NGỮ CẢNH BẢN ĐỒ], người dùng đã chọn một vùng trên bản đồ; hãy hiểu "đây", "nơi này", "chỗ này" là vùng đó và trả lời tập trung vào địa phương đó.
            - Nếu hệ thống cung cấp [DỮ LIỆU SÁP NHẬP LIÊN QUAN], hãy cập nhật thêm cho người dùng là "Nơi đó hiện nay là [Tên địa danh mới]".
            - Nếu hệ thống không cung cấp thông tin sáp nhập cho địa danh đó, hãy trả lời bình thường và không bịa thêm."""
            
            history = [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": "Tôi đã hiểu quy tắc. Tôi đã sẵn sàng."}]}
            ]

            chat_sessions[session_id] = gemini_client.chats.create(model='gemini-2.5-flash', history=history)
            
            if reset: return jsonify({"response": "Đã bắt đầu cuộc trò chuyện mới."})

        if not user_message: return jsonify({"response": "..."})

        context_search = user_message
        if map_context:
            for field in ("province", "district", "ward", "display_name"):
                val = (map_context.get(field) or "").strip()
                if val:
                    context_search += f" {val}"
        dynamic_context = extract_relevant_context(context_search)
        map_context_text = format_map_selection_context(map_context)

        final_message = user_message
        if map_context_text:
            final_message += f"\n\n[NGỮ CẢNH BẢN ĐỒ - VÙNG NGƯỜI DÙNG ĐANG CHỌN]:\n{map_context_text}"
        if dynamic_context:
            final_message += f"\n\n[DỮ LIỆU SÁP NHẬP LIÊN QUAN TỪ HỆ THỐNG ĐỂ BẠN THAM KHẢO TRẢ LỜI]:\n{dynamic_context}"

        response = chat_sessions[session_id].send_message(final_message)
        return jsonify({"response": response.text})
        
    except Exception as e:
        print(f"Chat Error: {e}")
        if session_id in chat_sessions: del chat_sessions[session_id]
        return jsonify({"response": f"Lỗi! Vui lòng thử lại sau vài phút"})
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5050)))
