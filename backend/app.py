"""
app.py
------
Main entry point for the Flask backend.
This file initializes the Flask application, sets up CORS (Cross-Origin Resource Sharing) 
so the Next.js frontend can communicate with it, and registers the API endpoints.
"""
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Allow frontend requests from different ports (e.g., localhost:3000)
CORS(app)

@app.route('/api/health', methods=['GET'])
def health_check():
    # Simple health check endpoint to verify the backend is running
    return jsonify({"status": "SIH-102 API is running securely."})

if __name__ == '__main__':
    # Run the server on port 5000 in debug mode for local development
    app.run(debug=True, port=5000)
