from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = ROOT / "assets" / "source"
OUTPUT_ROOT = ROOT / "assets" / "generated"

EXPORTS = [
    ("player-ships/raw/player-ship-yellow-variant-01-source.jpg", "player-ships/player-ship-yellow-variant-01.png", 512),
    ("player-ships/raw/player-ship-yellow-variant-02-source.jpg", "player-ships/player-ship-yellow-variant-02.png", 512),
    ("player-ships/raw/player-ship-yellow-variant-03-source.jpg", "player-ships/player-ship-yellow-variant-03.png", 512),
    ("player-ships/raw/player-ship-red-variant-01-source.jpg", "player-ships/player-ship-red-variant-01.png", 512),
    ("player-ships/raw/player-ship-red-variant-02-source.jpg", "player-ships/player-ship-red-variant-02.png", 512),
    ("player-ships/raw/player-ship-red-variant-03-source.jpg", "player-ships/player-ship-red-variant-03.png", 512),
    ("player-ships/raw/player-ship-blue-variant-01-source.jpg", "player-ships/player-ship-blue-variant-01.png", 512),
    ("player-ships/raw/player-ship-blue-variant-02-source.jpg", "player-ships/player-ship-blue-variant-02.png", 512),
    ("player-ships/raw/player-ship-blue-variant-03-source.jpg", "player-ships/player-ship-blue-variant-03.png", 512),
    ("player-ships/raw/player-ship-green-variant-01-source.jpg", "player-ships/player-ship-green-variant-01.png", 512),
    ("player-ships/raw/player-ship-green-variant-02-source.jpg", "player-ships/player-ship-green-variant-02.png", 512),
    ("player-ships/raw/player-ship-green-variant-03-source.jpg", "player-ships/player-ship-green-variant-03.png", 512),
    ("player-colonies/raw/player-colony-yellow-source.jpg", "player-colonies/player-colony-yellow.png", 640),
    ("player-colonies/raw/player-colony-red-source.jpg", "player-colonies/player-colony-red.png", 640),
    ("player-colonies/raw/player-colony-blue-source.jpg", "player-colonies/player-colony-blue.png", 640),
    ("player-colonies/raw/player-colony-green-source.jpg", "player-colonies/player-colony-green.png", 640),
    ("player-spaceports/raw/player-spaceport-yellow-source.jpg", "player-spaceports/player-spaceport-yellow.png", 768),
    ("player-spaceports/raw/player-spaceport-red-source.jpg", "player-spaceports/player-spaceport-red.png", 768),
    ("player-spaceports/raw/player-spaceport-blue-source.jpg", "player-spaceports/player-spaceport-blue.png", 768),
    ("player-spaceports/raw/player-spaceport-green-source.jpg", "player-spaceports/player-spaceport-green.png", 768),
]


def rgba(pixel):
    if len(pixel) == 4:
        return pixel
    return (*pixel, 255)


def is_background(pixel):
    r, g, b, a = rgba(pixel)
    if a == 0:
        return False
    color_spread = max(r, g, b) - min(r, g, b)
    return min(r, g, b) >= 218 and color_spread <= 42


def is_strict_background(pixel):
    r, g, b, a = rgba(pixel)
    if a == 0:
        return False
    color_spread = max(r, g, b) - min(r, g, b)
    return min(r, g, b) >= 238 and color_spread <= 28


def flood_transparent(image):
    image = image.convert("RGBA")
    width, height = image.size
    seeds = [
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
        (width // 2, 0),
        (width // 2, height - 1),
        (0, height // 2),
        (width - 1, height // 2),
    ]

    for seed in seeds:
        if is_background(image.getpixel(seed)):
            ImageDraw.floodfill(image, seed, (0, 0, 0, 0), thresh=72)

    return image


def remove_strict_background_pixels(image):
    image = image.convert("RGBA")
    pixels = image.get_flattened_data() if hasattr(image, "get_flattened_data") else image.getdata()
    image.putdata([
        (0, 0, 0, 0) if is_strict_background(pixel) else pixel
        for pixel in pixels
    ])
    return image


def cleanup_edge_halo(image):
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.load()
    to_clear = []

    for y in range(height):
        for x in range(width):
            if not is_background(pixels[x, y]):
                continue
            for offset_x, offset_y in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                next_x = x + offset_x
                next_y = y + offset_y
                if next_x < 0 or next_y < 0 or next_x >= width or next_y >= height:
                    continue
                if pixels[next_x, next_y][3] == 0:
                    to_clear.append((x, y))
                    break

    for x, y in to_clear:
        pixels[x, y] = (0, 0, 0, 0)

    return image


def crop_to_alpha(image, padding=24):
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


def resize_to_max_side(image, max_side):
    image = image.convert("RGBA")
    image.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return image


def process_asset(source_name, output_name, max_side):
    source = SOURCE_ROOT / source_name
    output = OUTPUT_ROOT / output_name
    output.parent.mkdir(parents=True, exist_ok=True)

    image = Image.open(source).convert("RGBA")
    image = flood_transparent(image)
    image = remove_strict_background_pixels(image)
    image = crop_to_alpha(image)
    image = resize_to_max_side(image, max_side)
    image.save(output)
    print(f"{source.relative_to(ROOT)} -> {output.relative_to(ROOT)} {image.width}x{image.height}", flush=True)


def main():
    for source_name, output_name, max_side in EXPORTS:
        process_asset(source_name, output_name, max_side)


if __name__ == "__main__":
    main()
