from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "assets" / "source" / "ui"
OUTPUT_ROOT = ROOT / "assets" / "generated" / "ui"
UPGRADE_SOURCE_ROOT = SOURCE_ROOT / "upgrades" / "raw"
UPGRADE_OUTPUT_ROOT = OUTPUT_ROOT / "upgrades"

UPGRADE_OVERLAY_EXPORTS = {
    "cannon-left-source.jpg": "cannon-left.png",
    "cannon-center-source.jpg": "cannon-center.png",
    "cannon-right-source.jpg": "cannon-right.png",
    "cargo-left-source.jpg": "cargo-left.png",
    "cargo-center-source.jpg": "cargo-center.png",
    "cargo-right-source.jpg": "cargo-right.png",
    "cargo-left-rear-source.jpg": "cargo-left-rear.png",
    "cargo-right-rear-source.jpg": "cargo-right-rear.png",
    "drive-left-front-source.jpg": "drive-left-front.png",
    "drive-left-rear-source.jpg": "drive-left-rear.png",
    "drive-right-front-source.jpg": "drive-right-front.png",
    "drive-right-rear-source.jpg": "drive-right-rear.png",
}


def rgba(pixel):
    if len(pixel) == 4:
        return pixel
    return (*pixel, 255)


def is_light_background(pixel):
    r, g, b, a = rgba(pixel)
    return a > 0 and r >= 235 and g >= 235 and b >= 235 and max(r, g, b) - min(r, g, b) <= 18


def is_checker_background(pixel):
    r, g, b, a = rgba(pixel)
    color_spread = max(r, g, b) - min(r, g, b)
    return a > 0 and r >= 218 and g >= 218 and b >= 218 and color_spread <= 28


def flood_transparent(image, is_background):
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    queue = deque()
    seen = set()

    def enqueue(x, y):
        if x < 0 or y < 0 or x >= width or y >= height:
            return
        key = (x, y)
        if key in seen:
            return
        if not is_background(pixels[x, y]):
            return
        seen.add(key)
        queue.append(key)

    for x in range(width):
        enqueue(x, 0)
        enqueue(x, height - 1)
    for y in range(height):
        enqueue(0, y)
        enqueue(width - 1, y)

    while queue:
        x, y = queue.popleft()
        pixels[x, y] = (0, 0, 0, 0)
        for offset_x in (-1, 0, 1):
            for offset_y in (-1, 0, 1):
                if offset_x or offset_y:
                    enqueue(x + offset_x, y + offset_y)

    return image


def crop_to_alpha(image, padding=20):
    alpha = image.getchannel("A")
    box = alpha.getbbox()
    if not box:
        return image

    left, top, right, bottom = box
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(image.width, right + padding)
    bottom = min(image.height, bottom + padding)
    return image.crop((left, top, right, bottom))


def resize_inside_square(image, size):
    image = image.convert("RGBA")
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    x = (size - image.width) // 2
    y = (size - image.height) // 2
    canvas.alpha_composite(image, (x, y))
    return canvas


def resize_to_max_side(image, size):
    image = image.convert("RGBA")
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    return image


def create_mothership():
    source = SOURCE_ROOT / "ship" / "mothership-source.jpg"
    image = Image.open(source).convert("RGBA")
    image = flood_transparent(image, is_light_background)
    image = crop_to_alpha(image, padding=18)
    image = resize_inside_square(image, 768)
    image.save(OUTPUT_ROOT / "mothership.png")


def create_blueprint(source_name, output_name, strong=False):
    source = SOURCE_ROOT / "blueprints" / source_name
    image = Image.open(source).convert("RGBA")
    output = Image.new("RGBA", image.size, (0, 0, 0, 0))
    source_pixels = image.load()
    output_pixels = output.load()

    for y in range(image.height):
        for x in range(image.width):
            r, g, b, _ = rgba(source_pixels[x, y])
            brightness = max(r, g, b)
            color_spread = max(r, g, b) - min(r, g, b)
            blue_bias = b - min(r, g)

            if brightness >= 125 and color_spread <= 70 and blue_bias <= 38:
                alpha = 255 if strong else min(255, max(190, int((brightness - 58) * 3.2)))
                output_pixels[x, y] = (255, 255, 255, alpha)

    if strong:
        alpha = output.getchannel("A").filter(ImageFilter.MaxFilter(3))
        output = Image.new("RGBA", output.size, (255, 255, 255, 0))
        output.putalpha(alpha)
    else:
        output = output.filter(ImageFilter.GaussianBlur(radius=0.15))
    output = crop_to_alpha(output, padding=18)
    output = resize_inside_square(output, 256)
    output.save(OUTPUT_ROOT / output_name)


def create_upgrade_overlay(source_name, output_name):
    source = UPGRADE_SOURCE_ROOT / source_name
    image = Image.open(source).convert("RGBA")
    image = flood_transparent(image, is_checker_background)
    image = crop_to_alpha(image, padding=18)
    image = resize_to_max_side(image, 512)
    image.save(UPGRADE_OUTPUT_ROOT / output_name)


def create_upgrade_overlays():
    UPGRADE_OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    for source_name, output_name in UPGRADE_OVERLAY_EXPORTS.items():
        create_upgrade_overlay(source_name, output_name)


def main():
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    create_mothership()
    create_blueprint("blueprint-cannon-source.jpg", "blueprint-cannon.png")
    create_blueprint("blueprint-cargo-source.jpg", "blueprint-cargo.png")
    create_blueprint("blueprint-drive-source.jpg", "blueprint-drive.png")
    create_blueprint("blueprint-build-colony-ship-source.jpg", "blueprint-build-colony-ship.png", strong=True)
    create_blueprint("blueprint-build-trade-ship-source.jpg", "blueprint-build-trade-ship.png", strong=True)
    create_blueprint("blueprint-build-spaceport-source.jpg", "blueprint-build-spaceport.png", strong=True)
    create_upgrade_overlays()


if __name__ == "__main__":
    main()
