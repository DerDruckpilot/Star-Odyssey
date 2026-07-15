from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "assets" / "source" / "ui" / "menu" / "raw"
SOURCE_REVIEW_DIR = ROOT / "assets" / "source" / "ui" / "menu" / "review"
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
    AssetSpec("menu_reference_render", "start-menu-target-design-reference.jpg", "reference", "menu_reference_render.png", "opaque", "reviewNeeded", "Retained outside the web root as a design reference for menu tuning."),
]


def ensure_dirs() -> None:
    SOURCE_REVIEW_DIR.mkdir(parents=True, exist_ok=True)
    for category in ["background", "title", "frame", "buttons", "icons", "effects"]:
        (PROCESSED_DIR / category).mkdir(parents=True, exist_ok=True)


def validate_sources() -> None:
    missing_sources = sorted({spec.source for spec in ASSETS if not (SOURCE_DIR / spec.source).is_file()})
    if missing_sources:
        raise FileNotFoundError(f"Missing menu source assets: {', '.join(missing_sources)}")


PRESERVE_ENCLOSED_LIGHT_KEYS = {
    "logo_space_odyssey",
    "bg_planet_bottom_left",
    "bg_galaxy_bottom_right",
}


def build_light_alpha(image: Image.Image, preserve_enclosed_light: bool = False) -> Image.Image:
    rgba = image.convert("RGBA")
    bg_mask = find_connected_light_background(rgba)
    pixels = rgba.load()
    mask_pixels = bg_mask.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            remove_pixel = mask_pixels[x, y] == 128
            if not preserve_enclosed_light and is_light_background_pixel((r, g, b, 255)):
                remove_pixel = True
            if remove_pixel:
                pixels[x, y] = (r, g, b, 0)
            else:
                pixels[x, y] = (r, g, b, 255)
    rgba = soften_alpha_edge(rgba, bg_mask)
    return crop_alpha(rgba)


def find_connected_light_background(image: Image.Image) -> Image.Image:
    hsv = image.convert("HSV")
    _, saturation, value = hsv.split()
    low_sat = saturation.point(lambda pixel: 255 if pixel < 45 else 0)
    high_value = value.point(lambda pixel: 255 if pixel > 210 else 0)
    very_low_sat = saturation.point(lambda pixel: 255 if pixel < 24 else 0)
    medium_value = value.point(lambda pixel: 255 if pixel > 188 else 0)
    candidate = ImageChops.lighter(ImageChops.multiply(low_sat, high_value), ImageChops.multiply(very_low_sat, medium_value))
    mask = candidate.convert("L")
    width, height = mask.size
    pixels = mask.load()
    for x in range(width):
        if pixels[x, 0] == 255:
            ImageDraw.floodfill(mask, (x, 0), 128, thresh=0)
        if pixels[x, height - 1] == 255:
            ImageDraw.floodfill(mask, (x, height - 1), 128, thresh=0)
    for y in range(height):
        if pixels[0, y] == 255:
            ImageDraw.floodfill(mask, (0, y), 128, thresh=0)
        if pixels[width - 1, y] == 255:
            ImageDraw.floodfill(mask, (width - 1, y), 128, thresh=0)
    return mask


def is_light_background_pixel(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, _ = pixel
    mean = (r + g + b) / 3
    neutral = max(r, g, b) - min(r, g, b)
    return (mean > 210 and neutral < 42) or (mean > 188 and neutral < 24)


def soften_alpha_edge(image: Image.Image, bg_mask: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    softened = alpha.filter(ImageFilter.GaussianBlur(0.38))
    pixels = image.load()
    alpha_pixels = softened.load()
    mask_pixels = bg_mask.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, _ = pixels[x, y]
            alpha_value = 0 if mask_pixels[x, y] == 128 else alpha_pixels[x, y]
            if alpha_value < 210 and is_light_background_pixel((r, g, b, 255)):
                alpha_value = 0
            pixels[x, y] = (r, g, b, max(0, min(255, alpha_value)))
    return image


def polish_foreground(image: Image.Image, key: str) -> Image.Image:
    if key == "logo_space_odyssey":
        image = ImageEnhance.Contrast(image).enhance(1.18)
        image = ImageEnhance.Sharpness(image).enhance(1.12)
    elif key == "bg_planet_bottom_left":
        image = remove_planet_outer_halo(image)
    elif key == "bg_galaxy_bottom_right":
        image = soften_galaxy_outer_edge(image)
    return image


def remove_planet_outer_halo(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    bbox = alpha.point(lambda value: 255 if value > 16 else 0).getbbox()
    if not bbox:
        return image
    left, top, right, bottom = bbox
    cx = (left + right) / 2
    cy = (top + bottom) / 2
    radius = min(right - left, bottom - top) * 0.475
    fade = max(8, min(right - left, bottom - top) * 0.012)
    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            distance = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if distance > radius + fade:
                a = 0
            elif distance > radius:
                a = int(a * (1 - ((distance - radius) / fade)))
            pixels[x, y] = (r, g, b, max(0, min(255, a)))
    return crop_alpha(image)


def soften_galaxy_outer_edge(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")
    alpha = image.getchannel("A")
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.55))
    image.putalpha(alpha)
    return crop_alpha(image)


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
    source_path = SOURCE_DIR / spec.source
    output_root = SOURCE_REVIEW_DIR if spec.category == "reference" else PROCESSED_DIR
    output_path = output_root / spec.output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    record = {
        "assetKey": spec.key,
        "finalPath": to_repo_path(output_path),
        "sourceRawFile": to_repo_path(source_path),
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
                processed = build_light_alpha(source, preserve_enclosed_light=spec.key in PRESERVE_ENCLOSED_LIGHT_KEYS)
            processed = polish_foreground(processed, spec.key)
            processed.save(output_path)
            record["width"], record["height"] = processed.size
            record["hasAlpha"] = processed.mode == "RGBA"
    except Exception as exc:
        record["status"] = "failed"
        record["notes"] = f"{record['notes']} Processing failed: {exc}".strip()
    return record


def to_repo_path(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def write_manifest(records: list[dict]) -> None:
    manifest_path = PROCESSED_DIR / "menu-assets.manifest.json"
    manifest_path.write_text(json.dumps({"assets": records}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def write_default_layout() -> None:
    def layer(x: float, y: float, width: float, height: float, **overrides: object) -> dict:
        values = {
            "x": x,
            "y": y,
            "width": width,
            "height": height,
            "scale": 1,
            "opacity": 1,
            "rotation": 0,
            "mirrorX": False,
            "mirrorY": False,
            "visible": True,
        }
        values.update(overrides)
        return values

    layout = {
        "background": layer(52.2, 47.1, 99.9, 100, scale=1.06, rotation=1),
        "stars_overlay": layer(50, 50, 100, 100, opacity=0.72),
        "planet": layer(9, 88.5, 34, 46, opacity=0.82),
        "galaxy": layer(82, 76, 22, 22, opacity=0.92),
        "frame_corner_top_left": layer(7.9, 11.2, 14, 20, scale=1.31),
        "frame_corner_top_right": layer(92.3, 11.2, 14, 20, scale=1.31, mirrorX=True),
        "frame_corner_bottom_left": layer(7.9, 88.8, 14, 20, scale=1.31, mirrorY=True),
        "frame_corner_bottom_right": layer(92.3, 88.8, 14, 20, scale=1.31, mirrorX=True, mirrorY=True),
        "frame_top_edge": layer(50, 3.2, 29, 10),
        "frame_bottom_edge": layer(50, 95.9, 51.5, 13.5, mirrorY=True),
        "frame_left_edge": layer(1.6, 50, 4.6, 60, scale=0.85),
        "frame_right_edge": layer(98.4, 50, 4.6, 60, scale=0.85, mirrorX=True),
        "frame_top_deco": layer(26, 3.2, 20, 7.5, opacity=0.85, visible=False),
        "frame_bottom_deco": layer(74, 96.8, 20, 7.5, mirrorY=True, opacity=0.85, visible=False),
        "logo": layer(73, 26.3, 42, 16, scale=3.36),
        "title_compass_emblem": layer(24.6, 24.6, 18, 27),
        "title_ring_overlay": layer(50, 16, 21, 30, opacity=0.35, visible=False),
        "buttons_group": layer(50, 61, 42, 42, scale=0.92, spacing=20),
    }
    (PROCESSED_DIR / "menu-preview-layout.json").write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")


def write_default_button_layout() -> None:
    layout = {
        "basis": {"width": 1920, "height": 1080},
        "component": {"x": 452, "y": 180, "width": 760, "height": 118, "scale": 1},
        "plate": {"x": 380, "y": 59, "width": 760, "height": 118, "opacity": 1},
        "hoverPlate": {"x": 380, "y": 59, "width": 760, "height": 118, "opacity": 0},
        "iconRing": {"x": 63, "y": 66, "width": 86, "height": 86, "scale": 1.48, "opacity": 0.92},
        "icon": {"x": 63, "y": 66, "width": 44, "height": 44, "scale": 1.77, "opacity": 0.95},
        "text": {"x": 379, "y": 69, "fontSize": 32, "fontWeight": 600, "color": "#fff7ed", "glow": 0.7},
        "sideGemLeft": {"x": -15, "y": 66, "width": 50, "height": 66, "scale": 2, "opacity": 0.88},
        "sideGemRight": {"x": 693, "y": 65, "width": 50, "height": 66, "scale": 1.49, "opacity": 0.88},
        "separatorGlow": {"x": 380, "y": -6, "width": 540, "height": 16, "scaleX": 1.14, "scaleY": 1.56, "opacity": 0.84},
    }
    (PROCESSED_DIR / "menu-button-layout.json").write_text(json.dumps(layout, indent=2) + "\n", encoding="utf-8")


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
    sheet.save(SOURCE_REVIEW_DIR / "menu-assets-contact-sheet.png")


def main() -> None:
    ensure_dirs()
    validate_sources()
    records = [process_asset(spec) for spec in ASSETS]
    write_manifest(records)
    write_default_layout()
    write_default_button_layout()
    write_contact_sheet(records)
    print(f"Processed {len(records)} menu assets")
    print(PROCESSED_DIR / "menu-assets.manifest.json")


if __name__ == "__main__":
    main()
