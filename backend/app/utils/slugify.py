import re
import uuid
from unidecode import unidecode


def generate_slug(text: str, allow_unicode: bool = False) -> str:
    """Create a URL-safe slug from Persian or English titles."""
    value = (text or "").strip()
    if not value:
        return uuid.uuid4().hex[:8]
    if not allow_unicode:
        value = unidecode(value)
    value = value.lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[-\s]+", "-", value).strip("-_")
    return value or uuid.uuid4().hex[:8]


def ensure_unique_slug(base_slug: str, existing_slugs: set[str]) -> str:
    candidate = base_slug
    counter = 2
    while candidate in existing_slugs:
        candidate = f"{base_slug}-{counter}"
        counter += 1
    return candidate
