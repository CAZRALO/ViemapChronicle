from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import re
import json
import unicodedata
from datetime import datetime
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
MERGE_DICT_CACHE = {}
RAG_DOCS_CACHE = {}
CHAT_RAG_MEMORY = {}

STOPWORDS = {
    "a", "ai", "anh", "bao", "bi", "biet", "cac", "cai", "can", "cau", "cho", "co",
    "cua", "cung", "da", "dang", "de", "den", "di", "do", "duoc", "gi", "giup",
    "ha", "hay", "hoi", "la", "lam", "lay", "ma", "minh", "mot", "muon", "nao",
    "nay", "neu", "nhung", "noi", "nua", "o", "qua", "ra", "rang", "roi", "sao",
    "se", "tai", "the", "thi", "thong", "toi", "trong", "tu", "ve", "va", "vay",
    "voi", "xin"
}

RAG_INTENT_KEYWORDS = {
    "history": (
        "lich su", "su kien", "dien bien", "khoi nghia", "chien tranh", "tran danh",
        "nhan vat", "trieu dai", "xua", "truoc day", "timeline", "moc thoi gian"
    ),
    "geo_site": (
        "dia diem", "di tich", "danh lam", "thang canh", "du lich", "tham quan",
        "noi tieng", "canh dep", "van hoa", "chua", "den", "khu luu niem",
        "thien nhien", "song", "nui", "bien"
    ),
    "admin_change": (
        "sap nhap", "chia tach", "hanh chinh", "dia gioi", "doi ten", "tai lap",
        "hien nay", "bay gio", "thuoc tinh nao", "thuoc ve dau", "tinh nao",
        "xa nao", "phuong nao", "sau 2025", "truoc 2025", "1 7 2025"
    ),
    "overview": (
        "gioi thieu", "tong quan", "thong tin", "ke ve", "noi ve", "tom tat",
        "khai quat"
    ),
}

RAG_KIND_LABELS = {
    "history_event": "Sự kiện lịch sử địa phương",
    "geo_site": "Địa danh/di tích/danh thắng",
    "province_admin_change": "Biến động hành chính cấp tỉnh",
    "commune_merge": "Sáp nhập xã/phường",
}

RAG_KIND_INTENTS = {
    "history_event": {"history", "overview"},
    "geo_site": {"geo_site", "history", "overview"},
    "province_admin_change": {"admin_change", "history", "overview"},
    "commune_merge": {"admin_change"},
}

CHITCHAT_NORMALIZED = {
    "chao", "xin chao", "hello", "hi", "ok", "cam on", "thank you", "thanks",
    "tam biet"
}

CONTEXT_REFERENCE_KEYWORDS = (
    "day", "o day", "noi nay", "cho nay", "vung nay", "dia phuong nay",
    "tinh nay", "huyen nay", "xa nay", "phuong nay", "no", "do"
)

def choose_localized_file(candidates, lang=None):
    if not candidates:
        return None

    lang = (lang or 'vi').lower()

    def suffix_of(filename):
        stem = os.path.splitext(filename)[0].lower()
        match = re.search(r'[_-](vi|en)$', stem)
        return match.group(1) if match else ''

    for suffix in (lang, 'vi', ''):
        for filename in candidates:
            if suffix_of(filename) == suffix:
                return filename
    return candidates[0]

def load_all_commune_merger_data(lang='vi'):
    combined_data = {}
    if not os.path.exists(MERGE_DATA_FOLDER):
        return combined_data

    groups = {}
    for filename in os.listdir(MERGE_DATA_FOLDER):
        if not filename.endswith('.json'):
            continue
        stem = os.path.splitext(filename)[0]
        stem_no_lang = re.sub(r'(_|-)(vi|en)$', '', stem, flags=re.IGNORECASE)
        key = re.sub(r'[^A-Za-z0-9]', '', stem_no_lang).lower()
        groups.setdefault(key, []).append(filename)

    for candidates in groups.values():
        filename = choose_localized_file(candidates, lang=lang)
        file_path = os.path.join(MERGE_DATA_FOLDER, filename)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, dict):
                    combined_data.update(data)
        except Exception as e:
            print(f"Lỗi đọc file merger {filename}: {e}")
    return combined_data

def get_merge_dict(lang='vi'):
    """Tải và cache dữ liệu sáp nhập dưới dạng Dictionary để dễ tìm kiếm"""
    global MERGE_DICT_CACHE
    lang = (lang or 'vi').lower()
    if lang in MERGE_DICT_CACHE:
        return MERGE_DICT_CACHE[lang]

    MERGE_DICT_CACHE[lang] = load_all_commune_merger_data(lang=lang)
    return MERGE_DICT_CACHE[lang]

def strip_accents(text):
    text = str(text or "").replace("Đ", "D").replace("đ", "d")
    return "".join(
        char for char in unicodedata.normalize("NFD", text)
        if unicodedata.category(char) != "Mn"
    )

def normalize_search_text(text):
    text = strip_accents(text).lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def contains_normalized_phrase(normalized_text, phrase):
    phrase_norm = normalize_search_text(phrase)
    if not phrase_norm:
        return False
    return f" {phrase_norm} " in f" {normalized_text} "

def tokenize_search_text(text):
    return [
        token for token in normalize_search_text(text).split()
        if len(token) > 1 and token not in STOPWORDS
    ]

def is_blank_value(value):
    if value is None:
        return True
    text = str(value).strip()
    return not text or text.lower() == "null"

def join_non_empty(values, separator=", "):
    return separator.join(str(value).strip() for value in values if not is_blank_value(value))

def compact_text(text, max_len=900):
    text = re.sub(r"\s+", " ", str(text or "")).strip()
    if len(text) <= max_len:
        return text
    clipped = text[:max_len].rsplit(" ", 1)[0].rstrip()
    return f"{clipped}..."

def data_file_updated_date(path):
    try:
        return datetime.fromtimestamp(os.path.getmtime(path)).strftime("%Y-%m-%d")
    except OSError:
        return None

def make_source_meta(label, url, path=None, confidence="Nội bộ - cần đối chiếu khi dùng chính thức"):
    return {
        "label": label,
        "url": url,
        "confidence": confidence,
        "updated_at": data_file_updated_date(path) if path else None,
    }

def normalize_file_stem(value):
    text = strip_accents(value)
    text = re.sub(r"^(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa)\s+", "", text, flags=re.IGNORECASE)
    return re.sub(r"[^A-Za-z0-9]", "", text).lower()

def resolve_json_file(folder, province_name, lang=None):
    """Resolve a JSON filename under `folder` for a given province/base name.
    If `lang` provided ('vi' or 'en'), prefer files with that suffix (e.g., AnGiang_en.json).
    Falls back to any matching variant when preferred language is not present.
    """
    target = normalize_file_stem(province_name)
    if not target or not os.path.exists(folder):
        return None

    candidates = []
    for filename in os.listdir(folder):
        if not filename.endswith('.json'):
            continue
        stem = os.path.splitext(filename)[0]
        # remove trailing language suffix like _vi or _en or -vi/-en
        stem_no_lang = re.sub(r'(_|-)(vi|en)$', '', stem, flags=re.IGNORECASE)
        norm = re.sub(r'[^A-Za-z0-9]', '', stem_no_lang).lower()
        if norm == target:
            candidates.append(filename)

    if not candidates:
        return None

    # prefer requested language
    if lang:
        lang = str(lang).lower()
        for f in candidates:
            if re.search(r'(_|-)'+re.escape(lang)+r'$', os.path.splitext(f)[0], re.IGNORECASE):
                return f

    # prefer Vietnamese when no lang specified
    for f in candidates:
        if re.search(r'(_|-)(vi)$', os.path.splitext(f)[0], re.IGNORECASE):
            return f

    # otherwise return the first candidate
    return candidates[0]

def flatten_values(values):
    flattened = []
    for value in values:
        if is_blank_value(value):
            continue
        if isinstance(value, (list, tuple, set)):
            flattened.extend(flatten_values(value))
        else:
            flattened.append(str(value).strip())
    return flattened

def normalize_alias_list(values):
    aliases = []
    seen = set()
    for value in flatten_values(values):
        variants = {value}
        cleaned = clean_prefix(value)
        if cleaned:
            variants.add(cleaned)
        for variant in variants:
            normalized = normalize_search_text(variant)
            if len(normalized) < 2 or normalized in seen:
                continue
            seen.add(normalized)
            aliases.append(variant)
    return aliases

def format_location(location):
    if not isinstance(location, dict):
        return ""
    return join_non_empty([
        location.get("hamlet"),
        location.get("commune"),
        location.get("district"),
        location.get("province"),
    ])

def make_rag_doc(kind, title, content, source, aliases=None, province=None, district=None,
                 commune=None, year=None, extra_text=None, source_meta=None):
    aliases = normalize_alias_list([
        title, province, district, commune, aliases or []
    ])
    searchable_text = " ".join(flatten_values([
        title, content, source, aliases, province, district, commune, year, extra_text
    ]))
    title_tokens = set(tokenize_search_text(title))
    norm_aliases = sorted(
        {normalize_search_text(alias) for alias in aliases if len(normalize_search_text(alias)) >= 2},
        key=len,
        reverse=True
    )
    return {
        "kind": kind,
        "title": str(title or "").strip(),
        "content": compact_text(content),
        "source": source,
        "source_meta": source_meta or make_source_meta(source, source),
        "province": province,
        "district": district,
        "commune": commune,
        "year": year,
        "intents": RAG_KIND_INTENTS.get(kind, set()),
        "norm_text": normalize_search_text(searchable_text),
        "tokens": set(tokenize_search_text(searchable_text)),
        "title_tokens": title_tokens,
        "aliases_norm": norm_aliases,
    }

def load_json_safely(path):
    try:
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)
    except Exception as exc:
        print(f"JSON read error {path}: {exc}")
        return None

def build_history_rag_docs(lang=None):
    docs = []
    if not os.path.exists(HISTORY_DATA_FOLDER):
        return docs

    excluded = {"timeline_index.json", "meta_provinces.json"}
    # group files by base normalized stem (strip _vi/_en)
    files = [f for f in os.listdir(HISTORY_DATA_FOLDER) if f.endswith('.json') and f not in excluded]
    groups = {}
    for filename in files:
        stem = os.path.splitext(filename)[0]
        stem_no_lang = re.sub(r'(_|-)(vi|en)$', '', stem, flags=re.IGNORECASE)
        key = re.sub(r'[^A-Za-z0-9]', '', stem_no_lang).lower()
        groups.setdefault(key, []).append(filename)

    chosen_files = []
    for key, flist in groups.items():
        sel = None
        if lang:
            for f in flist:
                if f.lower().endswith(f'_{lang}.json'):
                    sel = f; break
        if not sel:
            for f in flist:
                if f.lower().endswith('_vi.json'):
                    sel = f; break
        if not sel:
            sel = flist[0]
        chosen_files.append(sel)

    for filename in chosen_files:
        file_path = os.path.join(HISTORY_DATA_FOLDER, filename)
        if not os.path.isfile(file_path):
            continue
        file_source_meta = make_source_meta(
            f"HistoryData/{filename}",
            f"/api/history/{filename}",
            file_path,
            "Dữ liệu lịch sử nội bộ"
        )
        data = load_json_safely(file_path)
        events = data.get("events") if isinstance(data, dict) else None
        if not isinstance(events, list):
            continue

        for event in events:
            if not isinstance(event, dict):
                continue
            location = event.get("location") if isinstance(event.get("location"), dict) else {}
            year = event.get("year")
            title = event.get("title") or event.get("id") or "Sự kiện lịch sử"
            location_text = format_location(location)
            figures = event.get("related_figures") if isinstance(event.get("related_figures"), list) else []
            tags = event.get("tags") if isinstance(event.get("tags"), list) else []

            lines = [f"{year}: {title}" if year else title]
            if location_text:
                lines.append(f"Địa điểm: {location_text}")
            if event.get("description"):
                lines.append(f"Mô tả: {event.get('description')}")
            if figures:
                lines.append(f"Nhân vật liên quan: {', '.join(flatten_values(figures))}")
            if tags:
                lines.append(f"Chủ đề: {', '.join(flatten_values(tags))}")

            docs.append(make_rag_doc(
                "history_event",
                title,
                "\n".join(lines),
                f"HistoryData/{filename}",
                aliases=[event.get("id"), figures, tags],
                province=location.get("province"),
                district=location.get("district"),
                commune=location.get("commune"),
                year=year,
                source_meta={
                    **file_source_meta,
                    "url": f"/api/history/{filename}#{event.get('id') or normalize_file_stem(title)}",
                    "label": f"HistoryData/{filename}#{event.get('id') or title}",
                },
            ))
    return docs

def build_geo_rag_docs(lang=None):
    def _build_for_files(file_list):
        docs_local = []
        type_labels = {
            "historical": "lịch sử/văn hóa",
            "natural": "tự nhiên/danh thắng",
        }
        for filename in file_list:
            file_path = os.path.join(GEO_DATA_FOLDER, filename)
            if not os.path.isfile(file_path):
                continue
            file_source_meta = make_source_meta(
                f"GeoData/{filename}",
                f"/api/geodata/{filename}",
                file_path,
                "Dữ liệu địa danh nội bộ"
            )
            data = load_json_safely(file_path)
            sites = data.get("sites") if isinstance(data, dict) else None
            if not isinstance(sites, list):
                continue

            for idx, site in enumerate(sites):
                if not isinstance(site, dict):
                    continue
                place = site.get("place") if isinstance(site.get("place"), dict) else {}
                name = site.get("name") or "Địa danh"
                place_type = site.get("type_of_place") or ""
                type_label = type_labels.get(place_type, place_type or "địa danh")
                location_text = format_location(place)

                lines = [f"{name} ({type_label})"]
                if location_text:
                    lines.append(f"Địa điểm: {location_text}")
                if site.get("event"):
                    lines.append(f"Thông tin: {site.get('event')}")

                docs_local.append(make_rag_doc(
                    "geo_site",
                    name,
                    "\n".join(lines),
                    f"GeoData/{filename}",
                    aliases=[type_label, place_type],
                    province=place.get("province"),
                    district=place.get("district"),
                    commune=place.get("commune"),
                    extra_text=site.get("event"),
                    source_meta={
                        **file_source_meta,
                        "url": f"/api/geodata/{filename}#site-{idx}",
                        "label": f"GeoData/{filename}#site-{idx}",
                    },
                ))
        return docs_local

    # choose best file per base name similar to history behavior
    if not os.path.exists(GEO_DATA_FOLDER):
        return []
    files = [f for f in os.listdir(GEO_DATA_FOLDER) if f.endswith('.json')]
    groups = {}
    for filename in files:
        stem = os.path.splitext(filename)[0]
        stem_no_lang = re.sub(r'(_|-)(vi|en)$', '', stem, flags=re.IGNORECASE)
        key = re.sub(r'[^A-Za-z0-9]', '', stem_no_lang).lower()
        groups.setdefault(key, []).append(filename)

    # For geo data we will prefer the same lang selection logic used for history
    chosen_files = []
    for key, flist in groups.items():
        sel = None
        if lang:
            for f in flist:
                if f.lower().endswith(f'_{lang}.json'):
                    sel = f; break
        if not sel:
            for f in flist:
                if f.lower().endswith('_vi.json'):
                    sel = f; break
        if not sel:
            sel = flist[0]
        chosen_files.append(sel)

    return _build_for_files(chosen_files)

def format_change_list(changes):
    if not isinstance(changes, list):
        return ""
    lines = []
    for change in changes:
        if not isinstance(change, dict):
            continue
        from_values = change.get("from") if isinstance(change.get("from"), list) else []
        to_values = change.get("to") if isinstance(change.get("to"), list) else []
        if from_values or to_values:
            lines.append(f"{', '.join(flatten_values(from_values))} -> {', '.join(flatten_values(to_values))}")
    return "; ".join(lines)

def build_timeline_rag_docs():
    docs = []
    timeline_path = os.path.join(HISTORY_DATA_FOLDER, "timeline_index.json")
    data = load_json_safely(timeline_path)
    if not isinstance(data, list):
        return docs
    file_source_meta = make_source_meta(
        "HistoryData/timeline_index.json",
        "/api/history/timeline_index.json",
        timeline_path,
        "Dữ liệu biến động hành chính nội bộ"
    )

    for idx, event in enumerate(data):
        if not isinstance(event, dict):
            continue
        year = event.get("year")
        title = event.get("title") or f"Biến động hành chính {year or ''}".strip()
        changes_text = format_change_list(event.get("changes"))
        lines = [f"{year}: {title}" if year else title]
        if event.get("description"):
            lines.append(f"Mô tả: {event.get('description')}")
        if changes_text:
            lines.append(f"Thay đổi: {changes_text}")

        aliases = [event.get("type"), changes_text]
        docs.append(make_rag_doc(
            "province_admin_change",
            title,
            "\n".join(lines),
            "HistoryData/timeline_index.json",
            aliases=aliases,
            year=year,
            extra_text=changes_text,
            source_meta={
                **file_source_meta,
                "url": f"/api/history/timeline_index.json#timeline-{year or idx}",
                "label": f"HistoryData/timeline_index.json#timeline-{year or idx}",
            },
        ))
    return docs

def build_commune_merge_rag_docs(lang='vi'):
    docs = []
    merge_data = get_merge_dict(lang=lang)
    if not isinstance(merge_data, dict):
        return docs

    for province, changes in merge_data.items():
        if not isinstance(changes, list):
            continue
        for idx, change in enumerate(changes):
            if not isinstance(change, dict):
                continue
            from_items = change.get("from") if isinstance(change.get("from"), list) else []
            to_item = change.get("to") if isinstance(change.get("to"), dict) else {}
            from_units = []
            from_aliases = []
            for item in from_items:
                if not isinstance(item, dict):
                    continue
                unit_text = join_non_empty([item.get("commune"), item.get("district"), item.get("province")])
                if unit_text:
                    from_units.append(unit_text)
                from_aliases.extend([item.get("commune"), item.get("district"), item.get("province")])

            to_text = join_non_empty([to_item.get("commune"), to_item.get("province")])
            to_commune = to_item.get("commune") or "đơn vị mới"
            title = f"Sáp nhập thành {to_commune}"
            lines = [
                f"Tỉnh/Thành liên quan: {province}",
                f"Từ: {', '.join(from_units)}" if from_units else "Từ: chưa rõ",
                f"Thành: {to_text or to_commune}",
            ]

            docs.append(make_rag_doc(
                "commune_merge",
                title,
                "\n".join(lines),
                f"HistoryData/MergeData#{province}#{idx}",
                aliases=[province, from_aliases, to_item.get("commune"), to_item.get("province")],
                province=province,
                district=", ".join(flatten_values([item.get("district") for item in from_items if isinstance(item, dict)])),
                commune=", ".join(flatten_values([item.get("commune") for item in from_items if isinstance(item, dict)])),
                year=2025,
                extra_text=to_text,
                source_meta=make_source_meta(
                    f"HistoryData/MergeData#{province}#{idx}",
                    f"/api/merger/communes#{normalize_file_stem(province)}-{idx}",
                    None,
                    "Dữ liệu sáp nhập cấp xã nội bộ"
                ),
            ))
    return docs

def get_rag_documents(lang='vi'):
    global RAG_DOCS_CACHE
    lang = (lang or 'vi').lower()
    if lang in RAG_DOCS_CACHE:
        return RAG_DOCS_CACHE[lang]

    docs = []
    docs.extend(build_history_rag_docs(lang=lang))
    docs.extend(build_geo_rag_docs(lang=lang))
    docs.extend(build_timeline_rag_docs())
    docs.extend(build_commune_merge_rag_docs(lang=lang))
    RAG_DOCS_CACHE[lang] = docs
    print(f"Loaded {len(RAG_DOCS_CACHE[lang])} internal RAG documents for lang={lang}")
    return RAG_DOCS_CACHE[lang]

def infer_query_intents(user_message):
    norm = normalize_search_text(user_message)
    intents = set()
    for intent, keywords in RAG_INTENT_KEYWORDS.items():
        for keyword in keywords:
            if normalize_search_text(keyword) in norm:
                intents.add(intent)
                break
    return intents

def extract_years(text):
    years = set()
    for match in re.findall(r"\b(1[0-9]{3}|20[0-9]{2})\b", str(text or "")):
        try:
            years.add(int(match))
        except ValueError:
            pass
    return years

def map_context_to_search_text(map_context):
    if not isinstance(map_context, dict):
        return ""
    return " ".join(flatten_values([
        map_context.get("display_name"),
        map_context.get("province"),
        map_context.get("district"),
        map_context.get("ward"),
        map_context.get("year"),
    ]))

def should_include_recent_history(user_message):
    norm = normalize_search_text(user_message)
    tokens = tokenize_search_text(user_message)
    follow_up_markers = ("con", "the con", "vay", "tiep", "them")
    has_reference = any(contains_normalized_phrase(norm, keyword) for keyword in CONTEXT_REFERENCE_KEYWORDS)
    is_short_follow_up = len(tokens) <= 6 and any(contains_normalized_phrase(norm, marker) for marker in follow_up_markers)
    return has_reference or is_short_follow_up

def is_map_reference_query(user_message):
    norm = normalize_search_text(user_message)
    return any(contains_normalized_phrase(norm, keyword) for keyword in CONTEXT_REFERENCE_KEYWORDS)

def infer_admin_level(user_message, map_context=None):
    norm = normalize_search_text(user_message)
    wants_commune_level = any(contains_normalized_phrase(norm, word) for word in ("xa", "phuong", "thi tran", "thon", "ap"))
    wants_province_level = any(contains_normalized_phrase(norm, word) for word in ("tinh", "thanh pho", "cap tinh"))
    if isinstance(map_context, dict):
        level = map_context.get("level")
        if level == "ward":
            wants_commune_level = True
        elif level == "province" and is_map_reference_query(user_message):
            wants_province_level = True
    return wants_commune_level, wants_province_level

def normalized_name_matches(doc_value, target_value):
    doc_norm = normalize_search_text(doc_value)
    target_norm = normalize_search_text(target_value)
    if len(doc_norm) < 3 or len(target_norm) < 3:
        return False
    return target_norm in doc_norm or doc_norm in target_norm

def doc_matches_map_context(doc, map_context):
    if not isinstance(map_context, dict):
        return False
    structured_pairs = (
        ("ward", "commune"),
        ("district", "district"),
        ("province", "province"),
    )
    for map_field, doc_field in structured_pairs:
        if normalized_name_matches(doc.get(doc_field), map_context.get(map_field)):
            return True
    province_norm = normalize_search_text(map_context.get("province"))
    return doc["kind"] == "province_admin_change" and len(province_norm) >= 3 and province_norm in doc["norm_text"]
    return False

def get_recent_rag_memory_text(session_id):
    turns = CHAT_RAG_MEMORY.get(session_id, [])
    if not turns:
        return ""
    parts = []
    for turn in turns[-3:]:
        parts.append(turn.get("message", ""))
        parts.append(map_context_to_search_text(turn.get("map_context")))
    return " ".join(flatten_values(parts))

def remember_rag_turn(session_id, user_message, map_context):
    if not session_id or not str(user_message or "").strip():
        return
    turns = CHAT_RAG_MEMORY.setdefault(session_id, [])
    turns.append({"message": user_message, "map_context": map_context})
    if len(turns) > 8:
        del turns[:-8]

def score_rag_doc(doc, query_text, user_message, map_context, intents):
    query_norm = normalize_search_text(query_text)
    user_norm = normalize_search_text(user_message)
    query_tokens = set(tokenize_search_text(query_text))
    user_tokens = set(tokenize_search_text(user_message))
    years = extract_years(query_text)

    score = 0.0
    overlap = query_tokens & doc["tokens"]
    user_overlap = user_tokens & doc["tokens"]
    score += len(overlap) * 1.2
    score += len(user_overlap) * 1.6
    score += len(user_tokens & doc["title_tokens"]) * 2.8

    if intents & doc["intents"]:
        score += 7.0
    if "history" in intents and doc["kind"] == "history_event":
        score += 7.0
    if "geo_site" in intents and doc["kind"] == "geo_site":
        score += 8.0
    if "admin_change" in intents and doc["kind"] == "province_admin_change":
        score += 7.0
    if "admin_change" in intents and doc["kind"] == "commune_merge":
        score += 5.0

    wants_commune_level, wants_province_level = infer_admin_level(user_message, map_context)
    if "admin_change" in intents:
        if wants_province_level and not wants_commune_level:
            if doc["kind"] == "province_admin_change":
                score += 12.0
            elif doc["kind"] == "commune_merge":
                score -= 14.0
        elif wants_commune_level and not wants_province_level:
            if doc["kind"] == "commune_merge":
                score += 10.0
            elif doc["kind"] == "province_admin_change":
                score -= 6.0
    elif doc["kind"] == "commune_merge":
        score -= 18.0

    if "geo_site" in intents:
        if doc["kind"] == "province_admin_change":
            score -= 10.0
        elif doc["kind"] == "history_event":
            score += 2.0

    if doc["year"] in years:
        score += 9.0

    padded_query = f" {query_norm} "
    for alias_norm in doc["aliases_norm"][:24]:
        if len(alias_norm) < 3:
            continue
        padded_alias = f" {alias_norm} "
        if padded_alias in padded_query:
            score += min(18.0, 5.0 + len(alias_norm.split()) * 2.2)
        elif len(alias_norm) >= 8 and alias_norm in query_norm:
            score += min(10.0, 3.0 + len(alias_norm.split()) * 1.5)

    if doc["title"] and normalize_search_text(doc["title"]) in user_norm:
        score += 14.0

    if isinstance(map_context, dict):
        for map_field, doc_field, boost in (
            ("ward", "commune", 18.0),
            ("district", "district", 13.0),
            ("province", "province", 10.0),
        ):
            if normalized_name_matches(doc.get(doc_field), map_context.get(map_field)):
                score += boost
        province_norm = normalize_search_text(map_context.get("province"))
        if doc["kind"] == "province_admin_change" and len(province_norm) >= 3 and province_norm in doc["norm_text"]:
            score += 8.0

        level = map_context.get("level")
        if level == "ward" and doc["kind"] == "commune_merge":
            score += 4.0
        elif level == "province" and doc["kind"] in {"history_event", "geo_site", "province_admin_change"}:
            score += 2.0

    if doc["kind"] == "commune_merge" and "admin_change" not in intents:
        score -= 4.0

    return score

def kind_limits_for_query(user_message, map_context, intents):
    wants_commune_level, wants_province_level = infer_admin_level(user_message, map_context)

    limits = {
        "history_event": 5,
        "geo_site": 5,
        "province_admin_change": 4,
        "commune_merge": 4,
    }
    if "admin_change" in intents:
        limits["commune_merge"] = 8 if wants_commune_level else 0
        limits["province_admin_change"] = 5 if wants_province_level or not wants_commune_level else 3
        limits["history_event"] = 2
        limits["geo_site"] = 2
    if "history" in intents and "geo_site" not in intents:
        limits["history_event"] = 7
        limits["geo_site"] = 2
    if "geo_site" in intents and "history" not in intents:
        limits["geo_site"] = 7
        limits["history_event"] = 2
    return limits

def retrieve_rag_context(user_message, map_context=None, session_history_text="", include_sources=False, lang='vi'):
    norm_message = normalize_search_text(user_message)
    if not norm_message or norm_message in CHITCHAT_NORMALIZED:
        return ("", []) if include_sources else ""

    intents = infer_query_intents(user_message)
    query_parts = [user_message, map_context_to_search_text(map_context)]
    if session_history_text and should_include_recent_history(user_message):
        query_parts.append(session_history_text)
    query_text = " ".join(flatten_values(query_parts))

    scored = []
    for doc in get_rag_documents(lang=lang):
        score = score_rag_doc(doc, query_text, user_message, map_context, intents)
        if score >= 7.0:
            scored.append((score, doc))
    if not scored:
        return ("", []) if include_sources else ""

    scored.sort(key=lambda item: item[0], reverse=True)
    if isinstance(map_context, dict) and is_map_reference_query(user_message):
        map_scored = [(score, doc) for score, doc in scored if doc_matches_map_context(doc, map_context)]
        if map_scored:
            scored = map_scored

    top_score = scored[0][0]
    limits = kind_limits_for_query(user_message, map_context, intents)
    wants_commune_level, _ = infer_admin_level(user_message, map_context)
    relative_floor = 0.35
    if "admin_change" in intents and wants_commune_level and top_score >= 40:
        relative_floor = 0.65
    elif isinstance(map_context, dict) and is_map_reference_query(user_message):
        relative_floor = 0.5

    selected = []
    kind_counts = {}
    for score, doc in scored:
        if len(selected) >= 14:
            break
        if score < max(7.0, top_score * relative_floor):
            break
        kind = doc["kind"]
        if kind_counts.get(kind, 0) >= limits.get(kind, 3):
            continue
        selected.append((score, doc))
        kind_counts[kind] = kind_counts.get(kind, 0) + 1

    if not selected:
        return ("", []) if include_sources else ""

    intent_labels = {
        "history": "lịch sử",
        "geo_site": "địa danh/du lịch",
        "admin_change": "hành chính/sáp nhập",
        "overview": "tổng quan",
    }
    header_intents = ", ".join(intent_labels.get(intent, intent) for intent in sorted(intents)) or "không rõ; ưu tiên khớp địa danh"
    lines = [
        "Kết quả truy xuất từ dữ liệu nội bộ của Viemap. Chỉ dùng các mục dưới đây nếu chúng thật sự liên quan đến câu hỏi.",
        f"Ý định suy luận: {header_intents}.",
    ]
    total_len = sum(len(line) for line in lines)
    for idx, (score, doc) in enumerate(selected, start=1):
        item = (
            f"\nLoại: {RAG_KIND_LABELS.get(doc['kind'], doc['kind'])}; "
            f"Độ khớp: {score:.1f}\n{doc['content']}"
        )
        if total_len + len(item) > 12000:
            break
        lines.append(item)
        total_len += len(item)
    if not include_sources:
        return "\n".join(lines)

    sources = []
    seen_urls = set()
    for idx, (score, doc) in enumerate(selected, start=1):
        source_meta = doc.get("source_meta") or {}
        url = source_meta.get("url") or doc.get("source")
        if url in seen_urls:
            continue
        seen_urls.add(url)
        sources.append({
            "id": f"S{idx}",
            "title": doc.get("title"),
            "kind": doc.get("kind"),
            "label": source_meta.get("label") or doc.get("source"),
            "url": url,
            "confidence": source_meta.get("confidence") or "Nội bộ",
            "updated_at": source_meta.get("updated_at"),
            "score": round(score, 1),
        })
    return "\n".join(lines), sources

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

    interaction = (map_context.get("interaction") or "click").strip().lower()
    if interaction == "hover":
        intro = "Người dùng đang DI CHUỘT chuột (chỉ vào) một vùng trên bản đồ trước khi hỏi."
        action_label = "đang chỉ vào"
        level_label = "Cấp đơn vị đang được chỉ"
    else:
        intro = "Người dùng đang xem bản đồ Viemap và đã CHỌN (click) một vùng trên bản đồ trước khi hỏi."
        action_label = "đang chọn"
        level_label = "Cấp đơn vị được click"

    lines = [
        intro,
        f"- Địa điểm {action_label}: {display}",
        f"- {level_label}: {level_vi}",
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

def map_file_lang_score(filename, requested_lang):
    stem = os.path.splitext(filename)[0].lower()
    match = re.search(r'[_-](vi|en)$', stem)
    suffix = match.group(1) if match else ''
    if suffix == requested_lang:
        return 3
    if suffix == 'vi':
        return 2
    if suffix == '':
        return 1
    return 0

def scan_map_files(lang='vi'):
    lang = (lang or 'vi').lower()
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
            candidate = {
                'year': year,
                'file': f,
                'format': fmt,
                '_lang_score': map_file_lang_score(f, lang)
            }
            should_replace = (
                current is None
                or candidate['_lang_score'] > current.get('_lang_score', 0)
                or (
                    candidate['_lang_score'] == current.get('_lang_score', 0)
                    and fmt == 'topojson'
                    and current.get('format') != 'topojson'
                )
            )

            config['years'].add(year)
            if should_replace:
                config['files'][level][year] = candidate
            break

    config['years'] = sorted(list(config['years']))
    for level in config['files']:
        items = sorted(config['files'][level].values(), key=lambda item: item['year'])
        for item in items:
            item.pop('_lang_score', None)
        config['files'][level] = items
    return config

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                               'favicon.ico', mimetype='image/vnd.microsoft.icon')

@app.route('/api/config')
def get_config():
    config = scan_map_files(lang=request.args.get('lang', 'vi'))
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
    lang = request.args.get('lang')
    if not filename.endswith('.json'): return jsonify({"error": "Invalid type"}), 400
    if os.path.basename(filename) != filename: return jsonify({"error": "Invalid path"}), 400
    path = os.path.join(HISTORY_DATA_FOLDER, filename)
    if lang and not re.search(r'(_|-)(vi|en)\.json$', filename, re.IGNORECASE):
        candidate = resolve_json_file(HISTORY_DATA_FOLDER, os.path.splitext(filename)[0], lang=lang)
        if candidate:
            path = os.path.join(HISTORY_DATA_FOLDER, candidate)
    if not os.path.exists(path):
        # try to resolve by base name using language preference
        base = os.path.splitext(filename)[0]
        candidate = resolve_json_file(HISTORY_DATA_FOLDER, base, lang=lang)
        if candidate:
            path = os.path.join(HISTORY_DATA_FOLDER, candidate)
        else:
            return jsonify({"error": "Not found"}), 404
    data = load_json_safely(path)
    if data is None:
        return jsonify({"error": "Not found"}), 404
    if isinstance(data, dict):
        data = {
            **data,
            "source": make_source_meta(
                f"HistoryData/{filename}",
                f"/api/history/{os.path.basename(path)}",
                path,
                "Dữ liệu lịch sử nội bộ"
            )
        }
        return jsonify(data)
    return jsonify(data)

@app.route('/api/geodata/<filename>')
def get_geo_data(filename):
    lang = request.args.get('lang')
    if not filename.endswith('.json'): return jsonify({"error": "Invalid type"}), 400
    if os.path.basename(filename) != filename: return jsonify({"error": "Invalid path"}), 400
    path = os.path.join(GEO_DATA_FOLDER, filename)
    if lang and not re.search(r'(_|-)(vi|en)\.json$', filename, re.IGNORECASE):
        candidate = resolve_json_file(GEO_DATA_FOLDER, os.path.splitext(filename)[0], lang=lang)
        if candidate:
            path = os.path.join(GEO_DATA_FOLDER, candidate)
    if not os.path.exists(path):
        base = os.path.splitext(filename)[0]
        candidate = resolve_json_file(GEO_DATA_FOLDER, base, lang=lang)
        if candidate:
            path = os.path.join(GEO_DATA_FOLDER, candidate)
        else:
            return jsonify({"error": "Not found"}), 404
    data = load_json_safely(path)
    if data is None:
        return jsonify({"error": "Not found"}), 404
    if isinstance(data, dict):
        data = {
            **data,
            "source": make_source_meta(
                f"GeoData/{os.path.basename(path)}",
                f"/api/geodata/{os.path.basename(path)}",
                path,
                "Dữ liệu địa danh nội bộ"
            )
        }
    return jsonify(data)

@app.route('/api/merger/communes')
def get_commune_merger_data():
    data = get_merge_dict(lang=request.args.get('lang', 'vi'))
    return jsonify(data)

@app.route('/api/search')
def search_internal_data():
    query = request.args.get("q", "").strip()
    lang = request.args.get("lang", "vi")
    try:
        limit = min(int(request.args.get("limit", 12) or 12), 30)
    except ValueError:
        limit = 12
    if not query:
        return jsonify({"query": query, "results": []})

    intents = infer_query_intents(query)
    scored = []
    for doc in get_rag_documents(lang=lang):
        score = score_rag_doc(doc, query, query, None, intents)
        if score >= 6.5:
            scored.append((score, doc))
    scored.sort(key=lambda item: item[0], reverse=True)

    results = []
    seen = set()
    for score, doc in scored:
        source_meta = doc.get("source_meta") or {}
        key = (doc.get("kind"), doc.get("title"), source_meta.get("url"))
        if key in seen:
            continue
        seen.add(key)
        results.append({
            "title": doc.get("title"),
            "kind": doc.get("kind"),
            "kind_label": RAG_KIND_LABELS.get(doc.get("kind"), doc.get("kind")),
            "province": doc.get("province"),
            "district": doc.get("district"),
            "commune": doc.get("commune"),
            "year": doc.get("year"),
            "url": source_meta.get("url"),
            "source": source_meta,
            "score": round(score, 1),
            "excerpt": compact_text(doc.get("content"), 180),
        })
        if len(results) >= limit:
            break
    return jsonify({"query": query, "results": results})

@app.route('/api/report/province')
def get_province_report():
    province_name = request.args.get("name", "").strip()
    lang = request.args.get('lang', 'vi')
    if not province_name:
        return jsonify({"error": "Missing province name"}), 400

    history_filename = resolve_json_file(HISTORY_DATA_FOLDER, province_name, lang=lang)
    geo_filename = resolve_json_file(GEO_DATA_FOLDER, province_name, lang=lang)
    report = {
        "province": province_name,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "events": [],
        "sites": [],
        "admin_changes": [],
        "sources": [],
    }

    if history_filename:
        path = os.path.join(HISTORY_DATA_FOLDER, history_filename)
        source = make_source_meta(
            f"HistoryData/{history_filename}",
            f"/api/history/{history_filename}",
            path,
            "Dữ liệu lịch sử nội bộ"
        )
        data = load_json_safely(path)
        if isinstance(data, dict) and isinstance(data.get("events"), list):
            for event in data["events"]:
                if not isinstance(event, dict):
                    continue
                report["events"].append({
                    **event,
                    "source": {
                        **source,
                        "url": f"/api/history/{history_filename}#{event.get('id') or normalize_file_stem(event.get('title'))}",
                    }
                })
            report["sources"].append(source)

    if geo_filename:
        path = os.path.join(GEO_DATA_FOLDER, geo_filename)
        source = make_source_meta(
            f"GeoData/{geo_filename}",
            f"/api/geodata/{geo_filename}",
            path,
            "Dữ liệu địa danh nội bộ"
        )
        data = load_json_safely(path)
        if isinstance(data, dict) and isinstance(data.get("sites"), list):
            for idx, site in enumerate(data["sites"]):
                if not isinstance(site, dict):
                    continue
                report["sites"].append({
                    **site,
                    "source": {
                        **source,
                        "url": f"/api/geodata/{geo_filename}#site-{idx}",
                    }
                })
            report["sources"].append(source)

    timeline_path = os.path.join(HISTORY_DATA_FOLDER, "timeline_index.json")
    timeline_data = load_json_safely(timeline_path)
    province_norm = normalize_search_text(province_name)
    if isinstance(timeline_data, list):
        source = make_source_meta(
            "HistoryData/timeline_index.json",
            "/api/history/timeline_index.json",
            timeline_path,
            "Dữ liệu biến động hành chính nội bộ"
        )
        for idx, item in enumerate(timeline_data):
            if not isinstance(item, dict):
                continue
            changes_text = format_change_list(item.get("changes"))
            searchable = normalize_search_text(" ".join(flatten_values([
                item.get("title"), item.get("description"), changes_text
            ])))
            if province_norm and province_norm in searchable:
                report["admin_changes"].append({
                    **item,
                    "source": {
                        **source,
                        "url": f"/api/history/timeline_index.json#timeline-{item.get('year') or idx}",
                    }
                })
        if report["admin_changes"]:
            report["sources"].append(source)

    if not report["events"] and not report["sites"] and not report["admin_changes"]:
        return jsonify({"error": "No report data found", "report": report}), 404
    return jsonify(report)

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')
    session_id = data.get('session_id')
    reset = data.get('reset', False)
    map_context = data.get('map_context')
    lang = data.get('lang', 'vi')
    
    if not session_id: return jsonify({"error": "Missing session_id"}), 400

    if not gemini_client:
        return jsonify({"response": "Lỗi từ nhà phát triển, vui lòng thử lại vào lần dùng sau."}), 500

    try:
        if reset or session_id not in chat_sessions:
            if reset:
                CHAT_RAG_MEMORY.pop(session_id, None)
            system_prompt = """Bạn là Viemacle, chuyên gia Lịch sử và Địa lý Việt Nam.
            QUY TẮC:
            - Trả lời rõ ràng, chính xác.
            - Nếu người dùng hỏi về địa danh trước 1/7/2025, hãy trả lời về lịch sử của nó.
            - Nếu hệ thống cung cấp [NGỮ CẢNH BẢN ĐỒ], người dùng đã chọn một vùng trên bản đồ; hãy hiểu "đây", "nơi này", "chỗ này" là vùng đó và trả lời tập trung vào địa phương đó.
            - Nếu hệ thống cung cấp [NGỮ CẢNH RAG TỪ DỮ LIỆU NỘI BỘ], hãy dùng nó làm nguồn ưu tiên để trả lời đúng trọng tâm, đủ ý, không liệt kê lan man.
            - Nếu ngữ cảnh RAG có nhiều mục, hãy tổng hợp những mục khớp nhất với câu hỏi; bỏ qua mục có vẻ không liên quan.
            - Nếu người dùng hỏi sáp nhập/địa giới hiện nay mà RAG có dữ liệu tương ứng, hãy nói rõ đơn vị cũ hiện nay thuộc/tạo thành đơn vị nào.
            - Nếu dữ liệu nội bộ không đủ để khẳng định một chi tiết, hãy nói rõ "trong dữ liệu hệ thống hiện chưa có thông tin này" thay vì bịa thêm."""
            if str(lang).lower() == 'en':
                system_prompt = """You are Viemacle, an expert on Vietnamese history and geography.
            RULES:
            - Answer clearly and accurately in English.
            - If the user asks about a place before July 1, 2025, answer based on that historical context.
            - If [MAP CONTEXT] is provided, the user selected an area on the map; understand "here", "this place", and similar references as that selected area.
            - If [INTERNAL RAG CONTEXT] is provided, use it as the priority reference and answer only with relevant details.
            - If internal data is not enough to confirm a detail, say that the system data does not currently contain that information instead of inventing it."""
            
            if str(lang).lower() == 'en':
                system_prompt += "\n- When using RAG items, answer naturally and do not add source lists or citation codes."
            else:
                system_prompt += "\n- Khi dùng mục RAG, hãy trả lời tự nhiên, không tự thêm danh sách nguồn hoặc mã trích dẫn."

            history = [
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": "I understand the rules and am ready." if str(lang).lower() == 'en' else "Tôi đã hiểu quy tắc. Tôi đã sẵn sàng."}]}
            ]

            chat_sessions[session_id] = gemini_client.chats.create(model='gemini-2.5-flash', history=history)
            
            if reset:
                reset_text = "Started a new conversation." if str(lang).lower() == 'en' else "Đã bắt đầu cuộc trò chuyện mới."
                return jsonify({"response": reset_text})

        if not user_message: return jsonify({"response": "..."})

        session_history_text = get_recent_rag_memory_text(session_id)
        dynamic_context, rag_sources = retrieve_rag_context(
            user_message,
            map_context,
            session_history_text,
            include_sources=True,
            lang=lang
        )
        map_context_text = format_map_selection_context(map_context)

        final_message = user_message
        if map_context_text:
            map_header = "[MAP CONTEXT - USER SELECTED AREA]" if str(lang).lower() == 'en' else "[NGỮ CẢNH BẢN ĐỒ - VÙNG NGƯỜI DÙNG ĐANG CHỌN]"
            final_message += f"\n\n{map_header}:\n{map_context_text}"
        if dynamic_context:
            rag_header = "[INTERNAL RAG CONTEXT FOR ANSWERING]" if str(lang).lower() == 'en' else "[NGỮ CẢNH RAG TỪ DỮ LIỆU NỘI BỘ ĐỂ THAM KHẢO TRẢ LỜI]"
            final_message += f"\n\n{rag_header}:\n{dynamic_context}"

        response = chat_sessions[session_id].send_message(final_message)
        remember_rag_turn(session_id, user_message, map_context)
        response_text = response.text
        return jsonify({"response": response_text, "sources": []})
        
    except Exception as e:
        print(f"Chat Error: {e}")
        if session_id in chat_sessions: del chat_sessions[session_id]
        return jsonify({"response": f"Lỗi! Vui lòng thử lại sau vài phút"})
    
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5050)))
