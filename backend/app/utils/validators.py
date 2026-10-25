import re
from typing import Optional

IRAN_MOBILE_REGEX = re.compile(r"^(?:\+98|0098|0)?9\d{9}$")
POSTAL_CODE_REGEX = re.compile(r"^\d{10}$")
SKU_REGEX = re.compile(r"^[A-Z0-9][A-Z0-9\-_]{2,31}$")


def normalize_iran_phone(phone: Optional[str]) -> Optional[str]:
    if phone is None:
        return None
    cleaned = re.sub(r"[\s\-()]", "", phone.strip())
    if not cleaned:
        return None
    if not IRAN_MOBILE_REGEX.match(cleaned):
        raise ValueError("Invalid Iranian mobile number format")
    if cleaned.startswith("+98"):
        return "0" + cleaned[3:]
    if cleaned.startswith("0098"):
        return "0" + cleaned[4:]
    if cleaned.startswith("9"):
        return "0" + cleaned
    return cleaned


def validate_postal_code(code: str) -> str:
    cleaned = re.sub(r"[\s\-]", "", code.strip())
    if not POSTAL_CODE_REGEX.match(cleaned):
        raise ValueError("Postal code must be a 10-digit numeric string")
    return cleaned


def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    return password


def normalize_sku(sku: str) -> str:
    upper = sku.strip().upper()
    if not SKU_REGEX.match(upper):
        raise ValueError("SKU must contain 3-32 uppercase alphanumeric, hyphen, or underscore characters")
    return upper
