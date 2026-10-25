from io import BytesIO
from typing import Tuple
from PIL import Image, ImageOps

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


def validate_and_optimize_image(
    raw_bytes: bytes,
    max_dimension: int = 1600,
    quality: int = 86,
) -> Tuple[bytes, dict[str, int | str]]:
    """Validate uploaded product imagery and convert to web-ready WebP."""
    if not raw_bytes:
        raise ValueError("Image payload is empty")
    if len(raw_bytes) > MAX_IMAGE_BYTES:
        raise ValueError("Image exceeds maximum 10 MB size limit")

    with Image.open(BytesIO(raw_bytes)) as img:
        fmt = (img.format or "").upper()
        if fmt not in ALLOWED_FORMATS:
            raise ValueError(f"Unsupported image format: {fmt or 'unknown'}")

        transposed = ImageOps.exif_transpose(img)
        if transposed.mode not in ("RGB", "RGBA"):
            transposed = transposed.convert("RGBA" if "A" in transposed.getbands() else "RGB")

        transposed.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
        width, height = transposed.size

        output = BytesIO()
        transposed.save(output, format="WEBP", quality=quality, method=4)
        optimized_bytes = output.getvalue()

    return optimized_bytes, {
        "width": width,
        "height": height,
        "format": "WEBP",
        "size_bytes": len(optimized_bytes),
    }
