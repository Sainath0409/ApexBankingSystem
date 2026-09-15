from functools import wraps
from datetime import datetime, timezone, timedelta
import jwt
from flask import request, jsonify
from bson import ObjectId
from .config import Config
from .database import get_db

def generate_token(user_id: str, email: str, role: str, name: str) -> tuple[str, int]:
    """
    Generates a JWT token with role-specific expiration.
    Customers have a strict 5-minute session lifetime.
    Managers have a 24-hour administrative session lifetime.
    """
    norm_role = "customer" if role in ["customer", "client"] else "manager"
    
    if norm_role == "customer":
        expires_in_seconds = Config.CUSTOMER_SESSION_TIMEOUT_MINUTES * 60
    else:
        expires_in_seconds = Config.MANAGER_SESSION_TIMEOUT_HOURS * 3600
        
    exp = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    payload = {
        "user_id": str(user_id),
        "email": email,
        "role": norm_role,
        "name": name,
        "exp": exp,
        "iat": datetime.now(timezone.utc)
    }
    
    token = jwt.encode(payload, Config.JWT_SECRET, algorithm="HS256")
    return token, expires_in_seconds

def decode_token(token: str) -> dict:
    return jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization")
        
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                
        if not token:
            return jsonify({"error": "Authorization token is missing"}), 401
            
        try:
            payload = decode_token(token)
            db = get_db()
            user_id = payload.get("user_id")
            
            # Query user
            user = None
            try:
                user = db.users.find_one({"_id": ObjectId(user_id)})
            except Exception:
                user = db.users.find_one({"_id": user_id})
                
            if not user:
                return jsonify({"error": "User account not found"}), 401
                
            if user.get("status") == "frozen":
                return jsonify({"error": "Account is suspended/frozen. Contact bank manager."}), 403
                
            raw_role = user.get("role", "customer")
            norm_role = "customer" if raw_role in ["customer", "client"] else "manager"

            # Attach user info to request
            request.current_user = {
                "user_id": str(user["_id"]),
                "name": user.get("name"),
                "email": user.get("email"),
                "role": norm_role,
                "phone": user.get("phone", ""),
                "status": user.get("status", "active")
            }
        except jwt.ExpiredSignatureError:
            return jsonify({
                "error": "Session has expired due to 5-minute inactivity window. Please log in again.",
                "code": "SESSION_EXPIRED"
            }), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"Invalid authentication token: {str(e)}"}), 401
            
        return f(*args, **kwargs)
    return decorated

def role_required(allowed_roles: list):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(request, "current_user") or not request.current_user:
                return jsonify({"error": "Authentication required"}), 401
                
            user_role = request.current_user.get("role")
            # Normalize customer / client
            normalized_allowed = ["customer" if r in ["customer", "client"] else r for r in allowed_roles]
            
            if user_role not in normalized_allowed:
                return jsonify({
                    "error": f"Access denied. Required role: {', '.join(allowed_roles)}. Your role: {user_role}"
                }), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def log_audit(action: str, details: dict, user: dict = None):
    try:
        db = get_db()
        ip_addr = request.remote_addr if request else "internal"
        log_entry = {
            "action": action,
            "details": details,
            "user_id": user.get("user_id") if user else "anonymous",
            "user_email": user.get("email") if user else "anonymous",
            "role": user.get("role") if user else "anonymous",
            "ip_address": ip_addr,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        db.audit_logs.insert_one(log_entry)
    except Exception as err:
        print(f"[AUDIT LOG ERROR] {err}")
