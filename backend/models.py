import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Project(db.Model):
    __tablename__ = "projects"

    project_id = db.Column(db.Integer, primary_key=True)
    constituency = db.Column(db.String(120), nullable=False)
    district = db.Column(db.String(120), nullable=False)
    state = db.Column(db.String(120), nullable=False)
    mp_name = db.Column(db.String(120), nullable=False)
    house_type = db.Column(db.String(50), default="Lok Sabha")
    work_description = db.Column(db.Text, nullable=False)
    work_category = db.Column(db.String(100), nullable=False)
    sanctioned_amount = db.Column(db.Float, default=0.0)
    disbursed_amount = db.Column(db.Float, default=0.0)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    h3_index = db.Column(db.String(80), nullable=True)
    project_status = db.Column(db.String(50), default="Sanctioned")
    sanction_date = db.Column(db.Date, nullable=True)
    expected_completion = db.Column(db.Date, nullable=True)
    actual_completion = db.Column(db.Date, nullable=True)
    composite_risk_score = db.Column(db.Float, default=0.0)
    implementing_agency = db.Column(db.String(150), nullable=True)
    sc_area = db.Column(db.Boolean, default=False)
    st_area = db.Column(db.Boolean, default=False)
    photo_uploaded = db.Column(db.Boolean, default=True)
    delay_probability = db.Column(db.Float, default=0.0)
    zone_flag = db.Column(db.String(80), nullable=True)

    transactions = db.relationship("Transaction", backref="project", lazy=True)
    alerts = db.relationship("Alert", backref="project", lazy=True)
    documents = db.relationship("Document", backref="project", lazy=True)

    def to_dict(self):
        return {
            "project_id": self.project_id,
            "constituency": self.constituency,
            "district": self.district,
            "state": self.state,
            "mp_name": self.mp_name,
            "house_type": self.house_type,
            "work_description": self.work_description,
            "work_category": self.work_category,
            "sanctioned_amount": self.sanctioned_amount,
            "disbursed_amount": self.disbursed_amount,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "h3_index": self.h3_index,
            "project_status": self.project_status,
            "sanction_date": self.sanction_date.isoformat() if self.sanction_date else None,
            "expected_completion": self.expected_completion.isoformat() if self.expected_completion else None,
            "actual_completion": self.actual_completion.isoformat() if self.actual_completion else None,
            "composite_risk_score": round(self.composite_risk_score or 0, 3),
            "implementing_agency": self.implementing_agency,
            "sc_area": self.sc_area,
            "st_area": self.st_area,
            "photo_uploaded": self.photo_uploaded,
            "delay_probability": round(self.delay_probability or 0, 3),
            "zone_flag": self.zone_flag,
        }


class Vendor(db.Model):
    __tablename__ = "vendors"

    vendor_id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(150), nullable=False)
    gstin_number = db.Column(db.String(50), nullable=False)
    pan_hash = db.Column(db.String(64), nullable=False)
    bank_account_hash = db.Column(db.String(64), nullable=False)
    registered_address = db.Column(db.String(255), nullable=False)
    registered_phone_hash = db.Column(db.String(64), nullable=False)
    lifetime_risk_score = db.Column(db.Float, default=0.0)
    cartel_group_id = db.Column(db.String(50), nullable=True)
    state = db.Column(db.String(80), nullable=True)

    transactions = db.relationship("Transaction", backref="vendor", lazy=True)
    alerts = db.relationship("Alert", backref="vendor", lazy=True)

    def to_dict(self):
        return {
            "vendor_id": self.vendor_id,
            "business_name": self.business_name,
            "gstin_number": self.gstin_number,
            "pan_hash": (self.pan_hash[:10] + "…") if self.pan_hash else None,
            "bank_account_hash": (self.bank_account_hash[:10] + "…") if self.bank_account_hash else None,
            "registered_address": self.registered_address,
            "lifetime_risk_score": round(self.lifetime_risk_score or 0, 3),
            "cartel_group_id": self.cartel_group_id,
            "state": self.state,
        }


class Transaction(db.Model):
    __tablename__ = "transactions"

    transaction_id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.project_id"), nullable=False)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendors.vendor_id"), nullable=False)
    invoice_number = db.Column(db.String(100), nullable=True)
    invoice_amount = db.Column(db.Float, nullable=False)
    material_category = db.Column(db.String(100), nullable=False)
    unit_cost = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Float, default=1.0)
    unit_measure = db.Column(db.String(50), default="unit")
    transaction_date = db.Column(db.Date, nullable=False)
    payment_stage = db.Column(db.String(50), default="Milestone 1")
    is_flagged = db.Column(db.Boolean, default=False)
    flag_reason = db.Column(db.String(255), nullable=True)
    anomaly_score = db.Column(db.Float, default=0.0)

    documents = db.relationship("Document", backref="transaction", lazy=True)

    def to_dict(self):
        return {
            "transaction_id": self.transaction_id,
            "project_id": self.project_id,
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor.business_name if self.vendor else None,
            "invoice_number": self.invoice_number,
            "invoice_amount": self.invoice_amount,
            "material_category": self.material_category,
            "unit_cost": self.unit_cost,
            "quantity": self.quantity,
            "unit_measure": self.unit_measure,
            "transaction_date": self.transaction_date.isoformat() if self.transaction_date else None,
            "payment_stage": self.payment_stage,
            "is_flagged": self.is_flagged,
            "flag_reason": self.flag_reason,
            "anomaly_score": round(self.anomaly_score or 0, 3),
        }


class Document(db.Model):
    __tablename__ = "documents"

    document_id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey("transactions.transaction_id"), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.project_id"), nullable=True)
    document_type = db.Column(db.String(50), default="Invoice")
    storage_uri = db.Column(db.String(255), nullable=True)
    extracted_text = db.Column(db.Text, nullable=True)
    extracted_entities = db.Column(db.JSON, nullable=True)
    ocr_confidence = db.Column(db.Float, default=0.95)
    discrepancy_detected = db.Column(db.Boolean, default=False)
    discrepancy_details = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "document_id": self.document_id,
            "transaction_id": self.transaction_id,
            "project_id": self.project_id,
            "document_type": self.document_type,
            "ocr_confidence": round(self.ocr_confidence or 0, 3),
            "discrepancy_detected": self.discrepancy_detected,
            "discrepancy_details": self.discrepancy_details,
            "extracted_entities": self.extracted_entities,
            "extracted_text": self.extracted_text,
        }


class Alert(db.Model):
    __tablename__ = "alerts"

    alert_id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.project_id"), nullable=True)
    vendor_id = db.Column(db.Integer, db.ForeignKey("vendors.vendor_id"), nullable=True)
    alert_type = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(20), default="HIGH")
    shap_explanation = db.Column(db.JSON, nullable=True)
    natural_language_summary = db.Column(db.Text, nullable=False)
    disposition = db.Column(db.String(50), default="PENDING")
    reviewed_by = db.Column(db.String(100), nullable=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    review_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "alert_id": self.alert_id,
            "project_id": self.project_id,
            "project_desc": self.project.work_description if self.project else None,
            "constituency": self.project.constituency if self.project else None,
            "district": self.project.district if self.project else None,
            "state": self.project.state if self.project else None,
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor.business_name if self.vendor else None,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "shap_explanation": self.shap_explanation,
            "natural_language_summary": self.natural_language_summary,
            "disposition": self.disposition,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "review_notes": self.review_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    log_id = db.Column(db.Integer, primary_key=True)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    action = db.Column(db.String(100), nullable=False)
    actor = db.Column(db.String(100), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    prev_hash = db.Column(db.String(64), nullable=False)
    current_hash = db.Column(db.String(64), nullable=False)
    details = db.Column(db.JSON, nullable=True)

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "action": self.action,
            "actor": self.actor,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "prev_hash": self.prev_hash,
            "current_hash": self.current_hash,
            "details": self.details,
        }
