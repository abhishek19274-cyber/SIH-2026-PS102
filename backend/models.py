"""
models.py
---------
Database schema definitions using SQLAlchemy (ORM).
This file maps Python classes to PostgreSQL/SQLite database tables.
For SIH 102, we track Projects (MPLAD works), Vendors (contractors), and Transactions.
"""
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# Example Schema for MPLAD Projects (Uncomment and expand)
# class Project(db.Model):
#     __tablename__ = 'projects'
#     project_id = db.Column(db.String(50), primary_key=True)
#     title = db.Column(db.String(255), nullable=False)
#     sanctioned_amount = db.Column(db.Float, nullable=False)
#     # Add latitude, longitude for GIS tracking here...
