#!/usr/bin/env python3
"""Inspect a PDF by extracting text and rendering pages as PNG files."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import fitz


DEFAULT_DPI = 220
OUTPUT_ROOT = Path(".tmp") / "pdf-inspection"


def safe_name(value: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._-]+", "-", value.strip())
    return name.strip(".-") or "pdf"


def ensure_inside(child: Path, parent: Path) -> None:
    resolved_child = child.resolve()
    resolved_parent = parent.resolve()
    if resolved_child != resolved_parent and resolved_parent not in resolved_child.parents:
        raise ValueError(f"Refusing to write outside {resolved_parent}: {resolved_child}")


def write_summary(pdf_path: Path, page_count: int, output_dir: Path, page_files: list[Path]) -> None:
    lines = [
        f"# PDF Inspection Summary",
        "",
        f"- PDF file: `{pdf_path.name}`",
        f"- Page count: {page_count}",
        f"- Output directory: `{output_dir.as_posix()}`",
        "",
        "These files are temporary analysis artifacts and must not be committed.",
        "",
        "## Rendered Pages",
        "",
    ]

    for page_file in page_files:
        lines.append(f"- `{page_file.as_posix()}`")

    (output_dir / "summary.md").write_text("\n".join(lines) + "\n", encoding="utf-8")


def inspect_pdf(pdf_path: Path, dpi: int) -> Path:
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    output_root = OUTPUT_ROOT.resolve()
    output_dir = (output_root / safe_name(pdf_path.stem)).resolve()
    ensure_inside(output_dir, output_root)
    output_dir.mkdir(parents=True, exist_ok=True)

    document = fitz.open(pdf_path)
    page_count = document.page_count
    page_files: list[Path] = []
    zoom = dpi / 72
    matrix = fitz.Matrix(zoom, zoom)

    for index, page in enumerate(document, start=1):
        text_path = output_dir / f"page-{index:03}.txt"
        image_path = output_dir / f"page-{index:03}.png"
        ensure_inside(text_path, output_dir)
        ensure_inside(image_path, output_dir)

        text_path.write_text(page.get_text("text"), encoding="utf-8")
        pixmap = page.get_pixmap(matrix=matrix, alpha=False)
        pixmap.save(image_path)
        page_files.append(image_path)

    document.close()
    write_summary(pdf_path, page_count, output_dir, page_files)

    print(f"PDF: {pdf_path}")
    print(f"Pages: {page_count}")
    print(f"Output: {output_dir}")
    print(f"Summary: {output_dir / 'summary.md'}")
    return output_dir


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Extract PDF text and render each page into .tmp/pdf-inspection/."
    )
    parser.add_argument("pdf", help="Path to the PDF file to inspect.")
    parser.add_argument("--dpi", type=int, default=DEFAULT_DPI, help=f"PNG render DPI. Default: {DEFAULT_DPI}.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        inspect_pdf(Path(args.pdf), args.dpi)
    except Exception as error:
        print(f"PDF inspection failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
