from __future__ import annotations

import argparse
import fnmatch
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - lets dry-run work without optional deps.
    def load_dotenv() -> None:
        return None


DEFAULT_MODEL = os.getenv("GEMINI_TRANSLATE_MODEL") or os.getenv("GEMINI_MODEL") or "gemini-3.5-flash"
DEFAULT_FOLDERS = ("GeoData", "HistoryData")
SKIP_KEYS = {
    "id",
    "date",
    "year",
    "type",
    "type_of_place",
    "url",
    "href",
    "src",
    "source",
    "filename",
    "file",
    "thumbnail",
}
NULL_LIKE = {"", "null", "none", "n/a", "na"}
URL_RE = re.compile(r"^(https?://|mailto:|tel:)", re.IGNORECASE)


PathTuple = tuple[str | int, ...]
TextItem = tuple[PathTuple, str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Translate *_vi.json files to *_en.json while preserving JSON structure."
    )
    parser.add_argument(
        "--folders",
        nargs="+",
        default=list(DEFAULT_FOLDERS),
        help="Folders to scan. Defaults to GeoData and HistoryData.",
    )
    parser.add_argument(
        "--include-merge-data",
        action="store_true",
        help="Also scan HistoryData/MergeData.",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=[],
        help="Only process files whose name or relative path matches this glob/substring. Can be repeated.",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="Re-translate and overwrite existing *_en.json files. By default, existing translations are not queued.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List files and translatable string counts without calling Gemini or writing files.",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Process at most this many source files.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=80,
        help="Maximum strings per translation request.",
    )
    parser.add_argument(
        "--max-batch-chars",
        type=int,
        default=12000,
        help="Maximum approximate source characters per translation request.",
    )
    parser.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"Gemini model to use. Default: {DEFAULT_MODEL}",
    )
    parser.add_argument(
        "--sleep",
        type=float,
        default=0.2,
        help="Seconds to sleep between Gemini requests.",
    )
    return parser.parse_args()


def repo_root() -> Path:
    return Path(__file__).resolve().parents[1]


def output_path_for(source_path: Path) -> Path:
    return source_path.with_name(re.sub(r"_vi\.json$", "_en.json", source_path.name, flags=re.IGNORECASE))


def should_include(path: Path, root: Path, patterns: list[str]) -> bool:
    if not patterns:
        return True
    rel = path.relative_to(root).as_posix()
    name = path.name
    for pattern in patterns:
        if fnmatch.fnmatch(name, pattern) or fnmatch.fnmatch(rel, pattern):
            return True
        if pattern.lower() in name.lower() or pattern.lower() in rel.lower():
            return True
    return False


def find_source_files(root: Path, args: argparse.Namespace) -> list[Path]:
    folders = [Path(folder) for folder in args.folders]
    if args.include_merge_data:
        folders.append(Path("HistoryData") / "MergeData")

    files: list[Path] = []
    seen: set[Path] = set()
    for folder in folders:
        absolute = (root / folder).resolve()
        if not absolute.exists():
            print(f"Skip missing folder: {folder}", file=sys.stderr)
            continue
        for path in sorted(absolute.glob("*_vi.json")):
            if path in seen:
                continue
            seen.add(path)
            if output_path_for(path).exists() and not args.overwrite:
                continue
            if should_include(path, root, args.only):
                files.append(path)

    if args.limit is not None:
        return files[: args.limit]
    return files


def is_translatable_string(path: PathTuple, value: str) -> bool:
    if value.strip().lower() in NULL_LIKE:
        return False
    if URL_RE.match(value.strip()):
        return False
    key_parts = [part for part in path if isinstance(part, str)]
    if key_parts and key_parts[-1].lower() in SKIP_KEYS:
        return False
    if any(part.lower() in {"video", "videos"} for part in key_parts):
        return False
    return True


def collect_strings(node: Any, path: PathTuple = ()) -> list[TextItem]:
    if isinstance(node, dict):
        items: list[TextItem] = []
        for key, value in node.items():
            items.extend(collect_strings(value, path + (str(key),)))
        return items
    if isinstance(node, list):
        items = []
        for index, value in enumerate(node):
            items.extend(collect_strings(value, path + (index,)))
        return items
    if isinstance(node, str) and is_translatable_string(path, node):
        return [(path, node)]
    return []


def set_value(node: Any, path: PathTuple, value: str) -> None:
    cursor = node
    for part in path[:-1]:
        cursor = cursor[part]
    cursor[path[-1]] = value


def chunks(items: list[TextItem], max_items: int, max_chars: int) -> list[list[TextItem]]:
    batches: list[list[TextItem]] = []
    current: list[TextItem] = []
    current_chars = 0
    for item in items:
        item_chars = len(item[1])
        if current and (len(current) >= max_items or current_chars + item_chars > max_chars):
            batches.append(current)
            current = []
            current_chars = 0
        current.append(item)
        current_chars += item_chars
    if current:
        batches.append(current)
    return batches


def get_api_key() -> str:
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("Missing GOOGLE_API_KEY. Add it to .env or the environment.")
    return api_key


def strip_json_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
        text = re.sub(r"\s*```$", "", text)
    return text.strip()


def parse_translation_response(text: str) -> dict[int, str]:
    payload = json.loads(strip_json_fence(text))
    rows = payload.get("translations") if isinstance(payload, dict) else payload
    if not isinstance(rows, list):
        raise ValueError("Translation response does not contain a translations list.")

    result: dict[int, str] = {}
    for row in rows:
        if not isinstance(row, dict) or "i" not in row or "text" not in row:
            raise ValueError("Translation row must contain i and text.")
        result[int(row["i"])] = str(row["text"])
    return result


def call_gemini(api_key: str, model: str, prompt: str, timeout: int = 120) -> str:
    model_name = model if model.startswith("models/") else f"models/{model}"
    encoded_model = urllib.parse.quote(model_name, safe="/")
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"{encoded_model}:generateContent?key={urllib.parse.quote(api_key)}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0,
            "responseMimeType": "application/json",
        },
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json; charset=utf-8"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"Gemini HTTP {exc.code}: {detail}") from exc

    candidates = response_payload.get("candidates") or []
    if not candidates:
        raise RuntimeError(f"Gemini returned no candidates: {response_payload}")
    parts = candidates[0].get("content", {}).get("parts") or []
    text_parts = [part.get("text", "") for part in parts if isinstance(part, dict)]
    text = "".join(text_parts).strip()
    if not text:
        raise RuntimeError(f"Gemini returned an empty text response: {response_payload}")
    return text


def translate_batch(api_key: str, model: str, batch: list[TextItem], retries: int = 3) -> list[str]:
    request_rows = [{"i": index, "text": text} for index, (_, text) in enumerate(batch)]
    prompt = (
        "Translate these Vietnamese app-data strings into natural English.\n"
        "Return only valid JSON in this exact shape: "
        '{"translations":[{"i":0,"text":"..."}]}.\n'
        "Rules:\n"
        "- Preserve meaning, numbers, dates, punctuation, and quoted official names.\n"
        "- Use Vietnamese proper names without diacritics unless there is a common English form "
        "(for example Hanoi, Hue, Ho Chi Minh City, Mekong River).\n"
        "- Translate administrative words naturally: tinh=Province, thanh pho=City, thi xa=Town, "
        "huyen=District, xa=Commune, phuong=Ward, thi tran=Town, ap/thon=Hamlet, "
        "khom/khu pho=Quarter, dac khu=Special Zone.\n"
        "- Keep placeholder strings like null, N/A, and empty text unchanged.\n"
        "- Do not add explanations or markdown.\n\n"
        f"Input JSON:\n{json.dumps(request_rows, ensure_ascii=False)}"
    )

    last_error: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            text = call_gemini(api_key, model, prompt)
            translated = parse_translation_response(text)
            missing = [index for index in range(len(batch)) if index not in translated]
            if missing:
                raise ValueError(f"Missing translation indexes: {missing[:10]}")
            return [translated[index] for index in range(len(batch))]
        except Exception as exc:  # pragma: no cover - depends on remote API.
            last_error = exc
            if attempt == retries:
                break
            time.sleep(1.5 * attempt)
    raise RuntimeError(f"Gemini translation failed after {retries} attempts: {last_error}")


def translate_items(api_key: str, model: str, items: list[TextItem], args: argparse.Namespace) -> list[str]:
    translated: list[str] = []
    all_batches = chunks(items, args.batch_size, args.max_batch_chars)
    for index, batch in enumerate(all_batches, start=1):
        print(f"    batch {index}/{len(all_batches)} ({len(batch)} strings)")
        translated.extend(translate_batch(api_key, model, batch))
        if args.sleep:
            time.sleep(args.sleep)
    return translated


def same_shape(left: Any, right: Any) -> bool:
    if type(left) is not type(right):
        return False
    if isinstance(left, dict):
        return list(left.keys()) == list(right.keys()) and all(same_shape(left[key], right[key]) for key in left)
    if isinstance(left, list):
        return len(left) == len(right) and all(same_shape(a, b) for a, b in zip(left, right))
    return True


def process_file(path: Path, root: Path, args: argparse.Namespace, api_key: str | None) -> tuple[str, int]:
    output_path = output_path_for(path)
    relative = path.relative_to(root)

    if output_path.exists() and not args.overwrite:
        return ("skipped", 0)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Skip invalid JSON: {relative} ({exc})", file=sys.stderr)
        return ("invalid", 0)
    items = collect_strings(data)
    if args.dry_run:
        print(f"DRY {relative}: {len(items)} translatable strings -> {output_path.name}")
        return ("dry", len(items))

    if api_key is None:
        raise RuntimeError("Internal error: api_key is required outside dry-run mode.")

    print(f"Translating {relative}: {len(items)} strings -> {output_path.name}")
    translated_values = translate_items(api_key, args.model, items, args)
    translated_data = json.loads(json.dumps(data, ensure_ascii=False))
    for (path_tuple, _), translated in zip(items, translated_values):
        set_value(translated_data, path_tuple, translated)

    if not same_shape(data, translated_data):
        raise RuntimeError(f"Shape check failed for {relative}")

    output_path.write_text(json.dumps(translated_data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return ("written", len(items))


def main() -> int:
    args = parse_args()
    load_dotenv()
    root = repo_root()
    files = find_source_files(root, args)

    if not files:
        print("No *_vi.json files matched.")
        return 0

    suffix = " source files" if args.overwrite else " source files without *_en.json"
    print(f"Matched {len(files)}{suffix}.")
    if args.dry_run:
        api_key = None
    else:
        print(f"Using model: {args.model}")
        api_key = get_api_key()

    totals = {"written": 0, "skipped": 0, "dry": 0, "invalid": 0}
    total_strings = 0
    for path in files:
        status, count = process_file(path, root, args, api_key)
        totals[status] = totals.get(status, 0) + 1
        total_strings += count
        if status == "skipped":
            print(f"Skip existing: {output_path_for(path).relative_to(root)}")

    print(
        "Done: "
        f"{totals.get('written', 0)} written, "
        f"{totals.get('skipped', 0)} skipped, "
        f"{totals.get('invalid', 0)} invalid, "
        f"{totals.get('dry', 0)} dry-run files, "
        f"{total_strings} strings counted."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
