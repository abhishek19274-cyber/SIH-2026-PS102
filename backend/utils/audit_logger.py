import datetime
from backend.models import db, AuditLog
from backend.utils.hashing import compute_block_hash


class AuditLogger:
    @staticmethod
    def log_event(entity_type: str, entity_id: int, action: str, actor: str, details: dict = None):
        details = details or {}
        now = datetime.datetime.utcnow()
        now_str = now.isoformat()
        last_log = AuditLog.query.order_by(AuditLog.log_id.desc()).first()
        prev_hash = (
            last_log.current_hash
            if last_log
            else "0" * 64
        )
        current_hash = compute_block_hash(prev_hash, now_str, action, details)
        entry = AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            actor=actor,
            timestamp=now,
            prev_hash=prev_hash,
            current_hash=current_hash,
            details=details,
        )
        db.session.add(entry)
        db.session.commit()
        return entry
