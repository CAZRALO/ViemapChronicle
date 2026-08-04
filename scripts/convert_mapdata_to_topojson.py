import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MAP_DIR = ROOT_DIR / "MapData"
DEFAULT_QUANTIZATION = 100000


def find_geo2topo_command():
    local_bins = [
        ROOT_DIR / "node_modules" / ".bin" / "geo2topo.cmd",
        ROOT_DIR / "node_modules" / ".bin" / "geo2topo",
    ]
    for candidate in local_bins:
        if candidate.exists():
            return [str(candidate)]

    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx:
        raise RuntimeError("Cannot find npx. Install Node.js or run npm install to use local geo2topo.")

    return [npx, "-y", "topojson-server"]


def validate_topology(path):
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if data.get("type") != "Topology" or "objects" not in data:
        raise ValueError(f"{path} is not a valid TopoJSON topology")


def convert_file(src, quantization, force, dry_run):
    out = src.with_suffix(".topojson")
    if out.exists() and out.stat().st_mtime >= src.stat().st_mtime and not force:
        return {"status": "skip", "src": src, "out": out}

    command = find_geo2topo_command() + [
        "-q",
        str(quantization),
        "-o",
        str(out),
        f"map={src}",
    ]

    if dry_run:
        return {"status": "dry-run", "src": src, "out": out, "command": command}

    subprocess.run(command, cwd=ROOT_DIR, check=True)
    validate_topology(out)

    before = src.stat().st_size
    after = out.stat().st_size
    saved = 0 if before == 0 else (1 - after / before) * 100
    return {
        "status": "converted",
        "src": src,
        "out": out,
        "before": before,
        "after": after,
        "saved": saved,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Convert MapData GeoJSON files to TopoJSON for smaller map payloads."
    )
    parser.add_argument("--map-dir", default=str(DEFAULT_MAP_DIR), help="Directory containing .geojson files.")
    parser.add_argument(
        "-q",
        "--quantization",
        type=int,
        default=DEFAULT_QUANTIZATION,
        help="TopoJSON pre-quantization count. Higher preserves more detail; default: 100000.",
    )
    parser.add_argument("--force", action="store_true", help="Rebuild .topojson files even when up to date.")
    parser.add_argument("--dry-run", action="store_true", help="Print planned conversions without writing files.")
    args = parser.parse_args()

    map_dir = Path(args.map_dir)
    if not map_dir.is_absolute():
        map_dir = ROOT_DIR / map_dir

    if not map_dir.exists():
        print(f"MapData directory not found: {map_dir}", file=sys.stderr)
        return 1

    sources = sorted(map_dir.glob("*.geojson"), key=lambda p: p.name.lower())
    if not sources:
        print(f"No .geojson files found in {map_dir}")
        return 0

    failures = []
    converted = 0
    skipped = 0

    for src in sources:
        try:
            result = convert_file(src, args.quantization, args.force, args.dry_run)
            status = result["status"]

            if status == "converted":
                converted += 1
                print(
                    f"[converted] {src.name} -> {result['out'].name} "
                    f"({result['before']:,} -> {result['after']:,} bytes, saved {result['saved']:.1f}%)"
                )
            elif status == "skip":
                skipped += 1
                print(f"[skip] {src.name} already has an up-to-date TopoJSON file")
            else:
                print("[dry-run] " + " ".join(result["command"]))
        except Exception as exc:
            failures.append((src, exc))
            print(f"[error] {src.name}: {exc}", file=sys.stderr)

    print(f"Done. Converted: {converted}, skipped: {skipped}, failed: {len(failures)}")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
