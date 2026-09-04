import re


def validate_coordinates(lat, lng):
    try:
        lat = float(lat)
        lng = float(lng)
        if 6.0 <= lat <= 38.0 and 68.0 <= lng <= 98.0:
            return True, None
        return False, "Coordinates fall outside India's geographic bounding box."
    except (ValueError, TypeError):
        return False, "Invalid numeric latitude or longitude."


def validate_gstin(gstin: str) -> bool:
    if not gstin:
        return False
    return bool(re.match(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$", gstin))


def is_select_only(sql: str) -> bool:
    if not sql:
        return False
    stripped = sql.strip().rstrip(";").lower()
    banned = ("insert", "update", "delete", "drop", "alter", "pragma", "attach", "detach", "create", "replace")
    if not stripped.startswith("select"):
        return False
    return not any(f" {w} " in f" {stripped} " or stripped.startswith(w + " ") for w in banned)
