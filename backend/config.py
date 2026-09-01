"""
config.py
---------
Configuration variables for the Flask environment.
Stores database connection strings, secret keys, and environment toggles.
Never hardcode sensitive passwords here; use os.getenv() to pull from .env files.
"""
import os

class Config:
    # Default to a local SQLite database if no PostgreSQL URL is provided
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///mplad.db')

    # Disable modification tracking to save memory
    SQLALCHEMY_TRACK_MODIFICATIONS = False
