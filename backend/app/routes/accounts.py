import random
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from ..database import get_db
from ..middleware import token_required, role_required, log_audit
from ..config import Config

accounts_bp = Blueprint("accounts", __name__, url_prefix="/api/accounts")

def generate_unique_account_number(db) -> str:
    while True:
        acc_num = f"{random.randint(100000, 999999)}"
        if not db.accounts.find_one({"account_number": acc_num}):
            return acc_num

@accounts_bp.route("/create", methods=["POST"])
@token_required
def create_account():
    data = request.get_json() or {}
    account_type = data.get("account_type", "savings").strip().lower()
    try:
        initial_deposit = float(data.get("initial_deposit", 0.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Initial deposit must be a valid number"}), 400

    if initial_deposit < 0:
        return jsonify({"error": "Initial deposit cannot be negative"}), 400

    # Only 2 account types allowed: Savings and Business
    if account_type not in ["savings", "business"]:
        return jsonify({"error": "Account type must be either 'savings' or 'business'"}), 400

    if account_type == "savings" and initial_deposit < Config.SAVINGS_MINIMUM_BALANCE:
        return jsonify({
            "error": f"Savings accounts require a minimum initial deposit of ₹{Config.SAVINGS_MINIMUM_BALANCE:,.2f}"
        }), 400

    db = get_db()
    user = request.current_user
    acc_num = generate_unique_account_number(db)

    # 6% for Savings, 9% for Business
    interest_rate = Config.SAVINGS_INTEREST_RATE if account_type == "savings" else Config.BUSINESS_INTEREST_RATE
    minimum_balance = Config.SAVINGS_MINIMUM_BALANCE if account_type == "savings" else 0.0
    transaction_fee = Config.BUSINESS_WITHDRAWAL_FEE if account_type == "business" else 0.0

    account_doc = {
        "account_number": acc_num,
        "user_id": user["user_id"],
        "owner_name": user["name"],
        "owner_email": user["email"],
        "account_type": account_type.capitalize(),
        "balance": initial_deposit,
        "interest_rate": interest_rate,
        "minimum_balance": minimum_balance,
        "transaction_fee": transaction_fee,
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    db.accounts.insert_one(account_doc)

    if initial_deposit > 0:
        txn_id = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        db.transactions.insert_one({
            "transaction_id": txn_id,
            "account_number": acc_num,
            "user_id": user["user_id"],
            "type": "deposit",
            "amount": initial_deposit,
            "fee": 0.0,
            "balance_after": initial_deposit,
            "reference": "Initial account opening deposit",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    log_audit("ACCOUNT_CREATED", {
        "account_number": acc_num,
        "account_type": account_type,
        "initial_deposit": initial_deposit,
        "interest_rate": interest_rate
    }, user)

    return jsonify({
        "message": f"{account_type.capitalize()} account created successfully!",
        "account": {
            "account_number": acc_num,
            "owner_name": user["name"],
            "account_type": account_type.capitalize(),
            "balance": initial_deposit,
            "interest_rate": interest_rate,
            "minimum_balance": minimum_balance,
            "transaction_fee": transaction_fee,
            "status": "active"
        }
    }), 201

@accounts_bp.route("/my-accounts", methods=["GET"])
@token_required
def get_my_accounts():
    db = get_db()
    user_id = request.current_user["user_id"]
    accounts_cursor = db.accounts.find({"user_id": user_id, "status": {"$ne": "closed"}})
    
    result = []
    for acc in accounts_cursor:
        acc["_id"] = str(acc["_id"])
        result.append(acc)
        
    return jsonify({"accounts": result}), 200

@accounts_bp.route("/lookup/<account_number>", methods=["GET"])
@token_required
def lookup_account(account_number: str):
    db = get_db()
    account = db.accounts.find_one({"account_number": account_number})
    if not account:
        return jsonify({"error": "Account number not found"}), 404

    if account.get("status") != "active":
        return jsonify({"error": f"Account #{account_number} is {account.get('status')}"}), 400

    return jsonify({
        "account_number": account["account_number"],
        "owner_name": account.get("owner_name", "Anonymous"),
        "account_type": account.get("account_type", "Generic"),
        "status": account.get("status", "active")
    }), 200

@accounts_bp.route("/<account_number>", methods=["GET"])
@token_required
def get_account_details(account_number: str):
    db = get_db()
    user = request.current_user
    account = db.accounts.find_one({"account_number": account_number})
    
    if not account:
        return jsonify({"error": "Account not found"}), 404

    if user["role"] != "manager" and account.get("user_id") != user["user_id"]:
        return jsonify({"error": "Unauthorized access to this account"}), 403

    account["_id"] = str(account["_id"])
    return jsonify({"account": account}), 200
