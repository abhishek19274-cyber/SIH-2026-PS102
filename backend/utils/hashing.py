import hashlib
import json


def hash_pii(value: str) -> str:
    """Salted SHA-256 for privacy-preserving PII identifiers."""
    if not value:
        return ""
    salt = "satark_mplad_privacy_salt_2026_"
    return hashlib.sha256((salt + str(value).strip().upper()).encode("utf-8")).hexdigest()


def compute_block_hash(prev_hash: str, timestamp_str: str, action: str, details_dict: dict) -> str:
    """Hash-chain a ledger entry so later edits are detectable."""
    payload = f"{prev_hash}|{timestamp_str}|{action}|{json.dumps(details_dict or {}, sort_keys=True, default=str)}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
