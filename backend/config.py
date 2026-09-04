import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "satark-mplad-secret-key-2026")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "sqlite:///" + os.path.join(BASE_DIR, "data", "satark_demo.db"),
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEMO_MODE = True
    H3_RESOLUTION_DEFAULT = 9
    H3_RESOLUTION_PRECISE = 10
    SCRUTINY_THRESHOLD_INR = 500000.0
