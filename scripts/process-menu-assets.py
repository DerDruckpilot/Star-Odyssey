from __future__ import annotations

import json
import shutil
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
INCOMING_DIR = ROOT / "assets" / "incoming" / "start-menu"
RAW_DIR = ROOT / "public" / "assets" / "ui" / "menu" / "raw"
PROCESSED_DIR = ROOT / "public" / "assets" / "ui" / "menu" / "processed"


@dataclass(frozen=True)
class AssetSpec:
    key: str
    source: str
    category: str
    output: str
    mode: str = "light-alpha"
    status: str = "ok"
    notes: str = ""


ASSETS: list[AssetSpec] = [
    AssetSpec("bg_space_base_4k", "start-menu-ref-01.jpg", "background", "background/bg_space_base_4k.png", "opaque", "reviewNeeded", "Uploaded source is 1280x720; replace with true 4K if a matching final background is desired."),
    AssetSpec("bg_planet_bottom_left", "start-menu-ref-02.jpg", "background", "background/bg_planet_bottom_left.png", "light-alpha"),
    AssetSpec("bg_galaxy_bottom_right", "start-menu-ref-03.jpg", "background", "background/bg_galaxy_bottom_right.png", "light-alpha"),
    AssetSpec("bg_stars_overlay", "start-menu-ref-04.jpg", "background", "background/bg_stars_overlay.png", "dark-overlay"),
    AssetSpec("logo_space_odyssey", "start-menu-ref-05.jpg", "title", "title/logo_space_odyssey.png", "light-alpha"),
    AssetSpec("title_compass_emblem", "start-menu-ref-06.jpg", "title", "title/title_compass_emblem.png", "light-alpha"),
    AssetSpec("title_ring_overlay", "start-menu-ref-06.jpg", "title", "title/title_ring_overlay.png", "light-alpha", "reviewNeeded", "Derived from the compass emblem because no separate title ring asset was uploaded."),
    AssetSpec("frame_corner_master", "start-menu-ref-07.jpg", "frame", "frame/frame_corner_master.png", "light-alpha"),
    AssetSpec("frame_top_edge", "start-menu-ref-08.jpg", "frame", "frame/frame_top_edge.png", "light-alpha"),
    AssetSpec("frame_bottom_edge", "start-menu-ref-09.jpg", "frame", "frame/frame_bottom_edge.png", "light-alpha"),
    AssetSpec("frame_left_edge", "start-menu-ref-10.jpg", "frame", "frame/frame_left_edge.png", "light-alpha"),
    AssetSpec("frame_right_edge", "start-menu-ref-11.jpg", "frame", "frame/frame_right_edge.png", "light-alpha"),
    AssetSpec("frame_top_deco_left", "start-menu-ref-12.jpg", "frame", "frame/frame_top_deco_left.png", "light-alpha", "reviewNeeded", "Decorative edge role inferred from visual orientation."),
    AssetSpec("frame_top_deco_right", "start-menu-ref-13.jpg", "frame", "frame/frame_top_deco_right.png", "light-alpha", "reviewNeeded", "Decorative edge role inferred from visual orientation."),
    AssetSpec("frame_bottom_deco_left", "start-menu-ref-14.jpg", "frame", "frame/frame_bottom_deco_left.png", "light-alpha", "reviewNeeded", "Decorative edge role inferred from visual orientation."),
    AssetSpec("frame_bottom_deco_right", "start-menu-ref-15.jpg", "frame", "frame/frame_bottom_deco_right.png", "light-alpha", "reviewNeeded", "Decorative edge role inferred from visual orientation."),
    AssetSpec("button_main_master", "start-menu-ref-16.jpg", "buttons", "buttons/button_main_master.png", "light-alpha"),
    AssetSpec("button_main_hover", "start-menu-ref-17.jpg", "buttons", "buttons/button_main_hover.png", "light-alpha"),
    AssetSpec("button_main_pressed", "start-menu-ref-18.jpg", "buttons", "buttons/button_main_pressed.png", "light-alpha"),
    AssetSpec("button_main_disabled", "start-menu-ref-19.jpg", "buttons", "buttons/button_main_disabled.png", "light-alpha"),
    AssetSpec("button_icon_ring", "start-menu-ref-20.jpg", "buttons", "buttons/button_icon_ring.png", "light-alpha", "reviewNeeded", "Large ring asset is scaled down in preview; verify final button-icon framing."),
    AssetSpec("button_side_gem_left", "start-menu-ref-21.jpg", "buttons", "buttons/button_side_gem_left.png", "light-alpha"),
    AssetSpec("button_side_gem_right", "start-menu-ref-22.jpg", "buttons", "buttons/button_side_gem_right.png", "light-alpha"),
    AssetSpec("button_separator_glow", "start-menu-ref-23.jpg", "buttons", "buttons/button_separator_glow.png", "light-alpha"),
    AssetSpec("icon_new_game", "start-menu-ref-24.jpg", "icons", "icons/icon_new_game.png", "light-alpha"),
    AssetSpec("icon_load_game", "start-menu-ref-25.jpg", "icons", "icons/icon_load_game.png", "light-alpha"),
    AssetSpec("icon_quit_game", "start-menu-ref-26.jpg", "icons", "icons/icon_quit_game.png", "light-alpha"),
    AssetSpec("icon_settings", "start-menu-ref-27.jpg", "icons", "icons/icon_settings.png", "light-alpha"),
    AssetSpec("menu_reference_render", "start-menu-target-design-reference.jpg", "reference", "reference/menu_reference_render.png", "opaque"),
]


def ensure_dirs() -> None:
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    for category in ["background", "title", "frame", "buttons", "icons", "effects", "reference"]:
        (PROCESSED_DIR / category).mkdir(parents=True, exist_ok=True)


def copy_raw_files() -> None:
    for source in sorted(INCOMING_DIR.glob("*.jpg")):
        shutil.copy2(source, RAW_DIR / source.name)


def build_light_alpha(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            mean = (r + g + b) / 3
            neutral = max(r, g, b) - min(r, g, b)
            if mean > 224 and neutral < 28:
                alpha = 0
            elif mean > 205 and neutral < 18:
                alpha = int((224 - mean) * 8)
            else:
                alpha = 255
            pixels[x, y] = (r, g, b, max(0, min(255, alpha)))
    alpha = rgba.getchannel("A").filter(ImageFilter.GaussianBlur(0.45))
    rgba.putalpha(alpha)
    return crop_alpha(rgba)


def build_dark_overlay(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b)
            alpha = int(max(0, min(210, (luminance - 22) * 3.2)))
            pixels[x, y] = (r, g, b, alpha)
    return rgba


def crop_alpha(image: Image.Image, padding: int = 8) -> Image.Image:
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 8 else 0).getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def process_asset(spec: AssetSpec) -> dict:
    source_path = INCOMING_DIR / spec.source
    output_path = PROCESSED_DIR / spec.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "assetKey": spec.key,
        "finalPath": to_public_path(output_path),
        "sourceRawFile": to_public_path(RAW_DIR / spec.source),
        "width": 0,
        "height": 0,
        "hasAlpha": False,
        "category": spec.category,
        "status": spec.status,
        "notes": spec.notes,
    }
    try:
        with Image.open(source_path) as source:
            if spec.mode == "opaque":
                processed = source.convert("RGB")
            elif spec.mode == "dark-overlay":
                processed = build_dark_overlay(source)
            else:
                processed = build_light_alpha(source)
            processed.save(output_path)
            record["width"], record["height"] = processed.size
            record["hasAlpha"] = processed.mode == "RGBA"
    except Exception as exc:
        record["status"] = "failed"
        record["notes"] = f"{record['notes']} Processing failed: {exc}".strip()
    return record


def to_public_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_manifest(records: list[dict]) -> None:
    manifest_path = PROCESSED_DIR / "menu-assets.manifest.json"
    manifest_path.write_text(json.dumps({"assets": records}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_default_layout() -> None:
    layout = {
        "logo": {"x": 50, "y": 18.0, "scale": 0.62},
        "buttons": {"x": 50, "y": 57.0, "scale": 0.74, "spacing": 2.1},
        "frame": {"inset": 1.35, "scale": 1.0},
        "planet": {"x": 9, "y": 78, "scale": 0.58, "opacity": 0.82},
        "galaxy": {"x": 84, "y": 73, "scale": 0.34, "opacity": 0.92},
        "titleOrnament": {"x": 50, "y": 17.5, "scale": 0.68, "opacity": 0.46},
        "stars": {"opacity": 0.72},
    }
    (PROCESSED_DIR / "menu-preview-layout.json").write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")


def write_contact_sheet(records: list[dict]) -> None:
    ok_records = [record for record in records if record["status"] != "failed"]
    cell_w, cell_h = 280, 220
    cols = 4
    rows = max(1, (len(ok_records) + cols - 1) // cols)
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#101827")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("arial.ttf", 14)
        small_font = ImageFont.truetype("arial.ttf", 11)
    except OSError:
        font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    for index, record in enumerate(ok_records):
        col = index % cols
        row = index // cols
        x = col * cell_w
        y = row * cell_h
        draw.rectangle((x + 8, y + 8, x + cell_w - 8, y + cell_h - 8), outline="#334155", fill="#172033")
        path = ROOT / record["finalPath"]
        with Image.open(path) as image:
            preview = image.convert("RGBA")
            preview.thumbnail((cell_w - 40, cell_h - 70), Image.Resampling.LANCZOS)
            px = x + (cell_w - preview.width) // 2
            py = y + 16
            checker = Image.new("RGB", preview.size, "#243044")
            checker_draw = ImageDraw.Draw(checker)
            tile = 12
            for cy in range(0, preview.height, tile):
                for cx in range(0, preview.width, tile):
                    if (cx // tile + cy // tile) % 2 == 0:
                        checker_draw.rectangle((cx, cy, cx + tile - 1, cy + tile - 1), fill="#1b2538")
            checker.paste(preview, mask=preview.getchannel("A") if preview.mode == "RGBA" else None)
            sheet.paste(checker, (px, py))
        label = record["assetKey"]
        status = record["status"]
        draw.text((x + 16, y + cell_h - 44), label, fill="#f8fafc", font=font)
        draw.text((x + 16, y + cell_h - 24), f"{record['width']}x{record['height']} · {status}", fill="#bae6fd" if status == "ok" else "#fde68a", font=small_font)
    sheet.save(PROCESSED_DIR / "menu-assets-contact-sheet.png")


def main() -> None:
    ensure_dirs()
    copy_raw_files()
    records = [process_asset(spec) for spec in ASSETS]
    write_manifest(records)
    write_default_layout()
    write_contact_sheet(records)
    print(f"Processed {len(records)} menu assets")
    print(PROCESSED_DIR / "menu-assets.manifest.json")


if __name__ == "__main__":
    main()
