import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from bson import ObjectId
from ..database import get_db
from ..middleware import token_required, role_required, log_audit
from ..config import Config

manager_bp = Blueprint("manager", __name__, url_prefix="/api/manager")

@manager_bp.route("/analytics", methods=["GET"])
@token_required
@role_required(["manager"])
def get_analytics():
    db = get_db()
    
    accounts = list(db.accounts.find())
    total_balance = sum(acc.get("balance", 0.0) for acc in accounts if acc.get("status") != "closed")
    active_accounts = sum(1 for acc in accounts if acc.get("status") == "active")
    frozen_accounts = sum(1 for acc in accounts if acc.get("status") == "frozen")
    closed_accounts = sum(1 for acc in accounts if acc.get("status") == "closed")
    
    # 2 Account Types only: Savings & Business
    savings_count = sum(1 for acc in accounts if acc.get("account_type") == "Savings" and acc.get("status") != "closed")
    business_count = sum(1 for acc in accounts if acc.get("account_type") == "Business" and acc.get("status") != "closed")

    users = list(db.users.find())
    total_customers = sum(1 for u in users if u.get("role") in ["customer", "client"])
    total_managers = sum(1 for u in users if u.get("role") == "manager")

    transactions = list(db.transactions.find())
    total_txns = len(transactions)
    deposit_vol = sum(t.get("amount", 0.0) for t in transactions if t.get("type") == "deposit")
    withdraw_vol = sum(t.get("amount", 0.0) for t in transactions if t.get("type") == "withdraw")
    transfer_vol = sum(t.get("amount", 0.0) for t in transactions if t.get("type") == "transfer_out")
    fees_collected = sum(t.get("fee", 0.0) for t in transactions)

    recent_transactions = list(db.transactions.find().sort("timestamp", -1).limit(10))
    for t in recent_transactions:
        t["_id"] = str(t["_id"])

    return jsonify({
        "total_reserves": round(total_balance, 2),
        "total_accounts": len(accounts),
        "active_accounts": active_accounts,
        "frozen_accounts": frozen_accounts,
        "closed_accounts": closed_accounts,
        "savings_count": savings_count,
        "business_count": business_count,
        "total_users": len(users),
        "total_customers": total_customers,
        "total_managers": total_managers,
        "total_transactions": total_txns,
        "deposit_volume": round(deposit_vol, 2),
        "withdraw_volume": round(withdraw_vol, 2),
        "transfer_volume": round(transfer_vol, 2),
        "fees_collected": round(fees_collected, 2),
        "recent_transactions": recent_transactions
    }), 200

@manager_bp.route("/accounts", methods=["GET"])
@token_required
@role_required(["manager"])
def get_all_accounts():
    db = get_db()
    status_filter = request.args.get("status")
    type_filter = request.args.get("type")
    search = request.args.get("search", "").strip().lower()

    query = {}
    if status_filter:
        query["status"] = status_filter
    if type_filter:
        query["account_type"] = type_filter.capitalize()

    accounts = list(db.accounts.find(query).sort("created_at", -1))
    result = []
    for acc in accounts:
        acc["_id"] = str(acc["_id"])
        if search:
            match = (
                search in acc["account_number"].lower() or 
                search in acc.get("owner_name", "").lower() or 
                search in acc.get("owner_email", "").lower()
            )
            if not match:
                continue
        result.append(acc)

    return jsonify({"accounts": result, "total": len(result)}), 200

@manager_bp.route("/accounts/<account_number>/status", methods=["PUT"])
@token_required
@role_required(["manager"])
def update_account_status(account_number: str):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()

    if new_status not in ["active", "frozen", "closed"]:
        return jsonify({"error": "Status must be 'active', 'frozen', or 'closed'"}), 400

    db = get_db()
    account = db.accounts.find_one({"account_number": account_number})
    if not account:
        return jsonify({"error": "Account not found"}), 404

    db.accounts.update_one({"account_number": account_number}, {"$set": {"status": new_status}})
    log_audit("MANAGER_ACCOUNT_STATUS_CHANGE", {
        "account_number": account_number,
        "old_status": account.get("status"),
        "new_status": new_status,
        "reason": data.get("reason", "Manager administrative update")
    }, request.current_user)

    return jsonify({
        "message": f"Account #{account_number} status updated to '{new_status}' successfully.",
        "account_number": account_number,
        "status": new_status
    }), 200

@manager_bp.route("/users", methods=["GET"])
@token_required
@role_required(["manager"])
def get_all_users():
    db = get_db()
    users = list(db.users.find().sort("created_at", -1))
    result = []
    for u in users:
        u_id = str(u["_id"])
        acc_count = db.accounts.count_documents({"user_id": u_id, "status": {"$ne": "closed"}})
        raw_role = u.get("role", "customer")
        norm_role = "customer" if raw_role in ["customer", "client"] else "manager"
        result.append({
            "user_id": u_id,
            "name": u.get("name"),
            "email": u.get("email"),
            "role": norm_role,
            "phone": u.get("phone", ""),
            "status": u.get("status", "active"),
            "created_at": u.get("created_at"),
            "active_accounts_count": acc_count
        })

    return jsonify({"users": result}), 200

@manager_bp.route("/users/<user_id>/details", methods=["GET"])
@token_required
@role_required(["manager"])
def get_user_details_with_accounts(user_id: str):
    db = get_db()
    user_obj_id = None
    try:
        user_obj_id = ObjectId(user_id)
        user = db.users.find_one({"_id": user_obj_id})
    except Exception:
        user = db.users.find_one({"_id": user_id})

    if not user:
        return jsonify({"error": "User not found"}), 404

    u_id = str(user["_id"])
    accounts = list(db.accounts.find({"user_id": u_id}))
    for acc in accounts:
        acc["_id"] = str(acc["_id"])

    raw_role = user.get("role", "customer")
    norm_role = "customer" if raw_role in ["customer", "client"] else "manager"

    return jsonify({
        "user": {
            "user_id": u_id,
            "name": user.get("name"),
            "email": user.get("email"),
            "role": norm_role,
            "phone": user.get("phone", ""),
            "status": user.get("status", "active"),
            "created_at": user.get("created_at")
        },
        "accounts": accounts,
        "total_accounts": len(accounts),
        "total_balance": sum(acc.get("balance", 0.0) for acc in accounts if acc.get("status") != "closed")
    }), 200

@manager_bp.route("/users/<user_id>/status", methods=["PUT"])
@token_required
@role_required(["manager"])
def update_user_status(user_id: str):
    data = request.get_json() or {}
    new_status = data.get("status", "").strip().lower()

    if new_status not in ["active", "frozen"]:
        return jsonify({"error": "Status must be 'active' or 'frozen'"}), 400

    db = get_db()
    user_obj_id = None
    try:
        user_obj_id = ObjectId(user_id)
        user = db.users.find_one({"_id": user_obj_id})
    except Exception:
        user = db.users.find_one({"_id": user_id})

    if not user:
        return jsonify({"error": "User not found"}), 404

    query = {"_id": user_obj_id} if user_obj_id else {"_id": user_id}
    db.users.update_one(query, {"$set": {"status": new_status}})

    log_audit("MANAGER_USER_STATUS_CHANGE", {
        "target_user_id": user_id,
        "new_status": new_status
    }, request.current_user)

    return jsonify({"message": f"User status changed to '{new_status}'."}), 200

@manager_bp.route("/process-periodic-interest", methods=["POST"])
@token_required
@role_required(["manager"])
def process_periodic_interest():
    db = get_db()
    active_accounts = list(db.accounts.find({"status": "active"}))
    credited_count = 0
    total_interest_paid = 0.0
    now_iso = datetime.now(timezone.utc).isoformat()

    for acc in active_accounts:
        acc_type = acc.get("account_type")
        balance = acc.get("balance", 0.0)
        
        # 6% for Savings, 9% for Business
        if acc_type == "Savings":
            rate = Config.SAVINGS_INTEREST_RATE
        elif acc_type == "Business":
            rate = Config.BUSINESS_INTEREST_RATE
        else:
            rate = 0.0

        interest = round(balance * rate, 2)
        if interest > 0:
            new_balance = round(balance + interest, 2)
            db.accounts.update_one({"account_number": acc["account_number"]}, {"$set": {"balance": new_balance}})
            
            txn_id = f"INT-{uuid.uuid4().hex[:8].upper()}"
            db.transactions.insert_one({
                "transaction_id": txn_id,
                "account_number": acc["account_number"],
                "user_id": acc["user_id"],
                "type": "interest",
                "amount": interest,
                "fee": 0.0,
                "balance_after": new_balance,
                "reference": f"Periodic Interest Distribution ({rate * 100}%)",
                "timestamp": now_iso
            })
            credited_count += 1
            total_interest_paid += interest

    log_audit("PERIODIC_INTEREST_PROCESSED", {
        "accounts_credited": credited_count,
        "total_interest_paid": round(total_interest_paid, 2)
    }, request.current_user)

    return jsonify({
        "message": f"Periodic interest processed successfully. {credited_count} accounts credited with total ₹{total_interest_paid:,.2f}.",
        "accounts_credited": credited_count,
        "total_interest_paid": round(total_interest_paid, 2)
    }), 200

@manager_bp.route("/audit-logs", methods=["GET"])
@token_required
@role_required(["manager"])
def get_audit_logs():
    db = get_db()
    limit = int(request.args.get("limit", 300))
    logs = list(db.audit_logs.find().sort("timestamp", -1).limit(limit))
    for log in logs:
        log["_id"] = str(log["_id"])
    return jsonify({"audit_logs": logs, "count": len(logs)}), 200
