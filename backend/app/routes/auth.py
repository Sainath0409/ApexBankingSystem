from datetime import datetime, timezone
import bcrypt
from flask import Blueprint, request, jsonify
from ..database import get_db
from ..middleware import generate_token, token_required, log_audit
from ..config import Config

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    raw_role = data.get("role", "customer").strip().lower()
    phone = data.get("phone", "").strip()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required"}), 400

    role = "customer" if raw_role in ["customer", "client"] else "manager" if raw_role == "manager" else None
    if not role:
        return jsonify({"error": "Role must be either 'customer' or 'manager'"}), 400

    db = get_db()
    existing_user = db.users.find_one({"email": email})
    if existing_user:
        return jsonify({"error": "An account with this email address already exists"}), 409

    hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    new_user = {
        "name": name,
        "email": email,
        "password_hash": hashed_password,
        "role": role,
        "phone": phone,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    result = db.users.insert_one(new_user)
    user_id = str(result.inserted_id)

    token, expires_in = generate_token(user_id, email, role, name)

    log_audit("USER_REGISTER", {"email": email, "role": role}, {"user_id": user_id, "email": email, "role": role})

    return jsonify({
        "message": "User registered successfully",
        "token": token,
        "expires_in": expires_in,
        "user": {
            "user_id": user_id,
            "name": name,
            "email": email,
            "role": role,
            "phone": phone,
            "status": "active"
        }
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    if user.get("status") == "frozen":
        return jsonify({"error": "Your profile has been frozen. Please contact a bank manager."}), 403

    password_match = bcrypt.checkpw(password.encode("utf-8"), user["password_hash"].encode("utf-8"))
    if not password_match:
        return jsonify({"error": "Invalid email or password"}), 401

    user_id = str(user["_id"])
    raw_role = user.get("role", "customer")
    role = "customer" if raw_role in ["customer", "client"] else "manager"
    name = user.get("name")

    token, expires_in = generate_token(user_id, email, role, name)

    user_info = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "role": role,
        "phone": user.get("phone", ""),
        "status": user.get("status", "active")
    }

    log_audit("USER_LOGIN", {"email": email, "role": role}, user_info)

    return jsonify({
        "message": "Login successful",
        "token": token,
        "expires_in": expires_in,
        "user": user_info
    }), 200

@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    return jsonify({
        "user": request.current_user
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
@token_required
def refresh_token():
    user = request.current_user
    token, expires_in = generate_token(user["user_id"], user["email"], user["role"], user["name"])
    
    return jsonify({
        "message": "Session refreshed",
        "token": token,
        "expires_in": expires_in,
        "user": user
    }), 200

@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    log_audit("USER_LOGOUT", {}, request.current_user)
    return jsonify({"message": "Logged out successfully"}), 200
