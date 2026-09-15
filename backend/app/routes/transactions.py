import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from ..database import get_db
from ..middleware import token_required, log_audit
from ..config import Config

transactions_bp = Blueprint("transactions", __name__, url_prefix="/api/transactions")

def generate_txn_id(prefix="TXN") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

@transactions_bp.route("/deposit", methods=["POST"])
@token_required
def deposit():
    data = request.get_json() or {}
    account_number = data.get("account_number", "").strip()
    try:
        amount = float(data.get("amount", 0.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    reference = data.get("reference", "Funds Deposit").strip()
    user = request.current_user

    if amount <= 0:
        return jsonify({"error": "Deposit amount must be greater than zero"}), 400

    db = get_db()
    account = db.accounts.find_one({"account_number": account_number})
    if not account:
        return jsonify({"error": "Account not found"}), 404

    if account.get("status") != "active":
        return jsonify({"error": f"Account #{account_number} is {account.get('status')}. Deposits not permitted."}), 400

    if user["role"] != "manager" and account.get("user_id") != user["user_id"]:
        return jsonify({"error": "Unauthorized access to deposit into this account"}), 403

    new_balance = round(account.get("balance", 0.0) + amount, 2)
    db.accounts.update_one({"account_number": account_number}, {"$set": {"balance": new_balance}})

    txn_id = generate_txn_id()
    txn_doc = {
        "transaction_id": txn_id,
        "account_number": account_number,
        "user_id": account["user_id"],
        "type": "deposit",
        "amount": amount,
        "fee": 0.0,
        "balance_after": new_balance,
        "reference": reference,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    db.transactions.insert_one(txn_doc)

    log_audit("DEPOSIT", {"account_number": account_number, "amount": amount, "new_balance": new_balance}, user)

    return jsonify({
        "message": f"Successfully deposited ₹{amount:,.2f}",
        "transaction_id": txn_id,
        "new_balance": new_balance,
        "account_number": account_number
    }), 200

@transactions_bp.route("/withdraw", methods=["POST"])
@token_required
def withdraw():
    data = request.get_json() or {}
    account_number = data.get("account_number", "").strip()
    try:
        amount = float(data.get("amount", 0.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    reference = data.get("reference", "Funds Withdrawal").strip()
    user = request.current_user

    if amount <= 0:
        return jsonify({"error": "Withdrawal amount must be greater than zero"}), 400

    db = get_db()
    account = db.accounts.find_one({"account_number": account_number})
    if not account:
        return jsonify({"error": "Account not found"}), 404

    if account.get("status") != "active":
        return jsonify({"error": f"Account #{account_number} is {account.get('status')}. Withdrawals not permitted."}), 400

    if user["role"] != "manager" and account.get("user_id") != user["user_id"]:
        return jsonify({"error": "Unauthorized access to this account"}), 403

    balance = account.get("balance", 0.0)
    acc_type = account.get("account_type", "Savings")
    fee = 0.0

    # Business account fee rule (₹1.50)
    if acc_type == "Business":
        fee = account.get("transaction_fee", Config.BUSINESS_WITHDRAWAL_FEE)
        total_required = round(amount + fee, 2)
        if balance < total_required:
            return jsonify({
                "error": f"Insufficient funds. Required: ₹{total_required:,.2f} (includes ₹{fee:,.2f} withdrawal fee), Available: ₹{balance:,.2f}"
            }), 400
        new_balance = round(balance - total_required, 2)

    # Savings account minimum balance rule (₹100)
    elif acc_type == "Savings":
        min_bal = account.get("minimum_balance", Config.SAVINGS_MINIMUM_BALANCE)
        if (balance - amount) < min_bal:
            return jsonify({
                "error": f"Transaction denied: Savings accounts require a minimum balance of ₹{min_bal:,.2f}. Current balance: ₹{balance:,.2f}"
            }), 400
        new_balance = round(balance - amount, 2)

    else:
        if balance < amount:
            return jsonify({"error": f"Insufficient funds. Available balance: ₹{balance:,.2f}"}), 400
        new_balance = round(balance - amount, 2)

    db.accounts.update_one({"account_number": account_number}, {"$set": {"balance": new_balance}})

    txn_id = generate_txn_id()
    txn_doc = {
        "transaction_id": txn_id,
        "account_number": account_number,
        "user_id": account["user_id"],
        "type": "withdraw",
        "amount": amount,
        "fee": fee,
        "balance_after": new_balance,
        "reference": reference,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    db.transactions.insert_one(txn_doc)

    log_audit("WITHDRAWAL", {
        "account_number": account_number,
        "amount": amount,
        "fee": fee,
        "new_balance": new_balance
    }, user)

    return jsonify({
        "message": f"Successfully withdrew ₹{amount:,.2f}" + (f" (Fee: ₹{fee:,.2f})" if fee > 0 else ""),
        "transaction_id": txn_id,
        "amount": amount,
        "fee": fee,
        "new_balance": new_balance,
        "account_number": account_number
    }), 200

@transactions_bp.route("/transfer", methods=["POST"])
@token_required
def transfer():
    data = request.get_json() or {}
    from_acc_num = data.get("from_account_number", "").strip()
    to_acc_num = data.get("to_account_number", "").strip()
    try:
        amount = float(data.get("amount", 0.0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount"}), 400

    reference = data.get("reference", "Money Transfer").strip()
    user = request.current_user

    if amount <= 0:
        return jsonify({"error": "Transfer amount must be greater than zero"}), 400

    if from_acc_num == to_acc_num:
        return jsonify({"error": "Cannot transfer funds to the same account"}), 400

    db = get_db()
    from_acc = db.accounts.find_one({"account_number": from_acc_num})
    to_acc = db.accounts.find_one({"account_number": to_acc_num})

    if not from_acc:
        return jsonify({"error": f"Source account #{from_acc_num} not found"}), 404
    if not to_acc:
        return jsonify({"error": f"Destination account #{to_acc_num} not found"}), 404

    if from_acc.get("status") != "active":
        return jsonify({"error": f"Source account is {from_acc.get('status')}"}), 400
    if to_acc.get("status") != "active":
        return jsonify({"error": f"Destination account is {to_acc.get('status')}"}), 400

    if user["role"] != "manager" and from_acc.get("user_id") != user["user_id"]:
        return jsonify({"error": "Unauthorized access to source account"}), 403

    from_balance = from_acc.get("balance", 0.0)
    from_type = from_acc.get("account_type", "Savings")
    fee = 0.0

    if from_type == "Business":
        fee = from_acc.get("transaction_fee", Config.BUSINESS_WITHDRAWAL_FEE)
        total_deduction = round(amount + fee, 2)
        if from_balance < total_deduction:
            return jsonify({
                "error": f"Insufficient funds. Required: ₹{total_deduction:,.2f} (includes fee of ₹{fee:,.2f}), Available: ₹{from_balance:,.2f}"
            }), 400
        new_from_balance = round(from_balance - total_deduction, 2)
    elif from_type == "Savings":
        min_bal = from_acc.get("minimum_balance", Config.SAVINGS_MINIMUM_BALANCE)
        if (from_balance - amount) < min_bal:
            return jsonify({
                "error": f"Transfer denied: Savings accounts require a minimum balance of ₹{min_bal:,.2f}. Current balance: ₹{from_balance:,.2f}"
            }), 400
        new_from_balance = round(from_balance - amount, 2)
    else:
        if from_balance < amount:
            return jsonify({"error": f"Insufficient funds in source account. Available: ₹{from_balance:,.2f}"}), 400
        new_from_balance = round(from_balance - amount, 2)

    new_to_balance = round(to_acc.get("balance", 0.0) + amount, 2)

    # Atomic update
    db.accounts.update_one({"account_number": from_acc_num}, {"$set": {"balance": new_from_balance}})
    db.accounts.update_one({"account_number": to_acc_num}, {"$set": {"balance": new_to_balance}})

    txn_id_out = generate_txn_id("TRX-OUT")
    txn_id_in = generate_txn_id("TRX-IN")
    now_iso = datetime.now(timezone.utc).isoformat()

    # Outgoing record
    db.transactions.insert_one({
        "transaction_id": txn_id_out,
        "account_number": from_acc_num,
        "user_id": from_acc["user_id"],
        "type": "transfer_out",
        "amount": amount,
        "fee": fee,
        "balance_after": new_from_balance,
        "recipient_account_number": to_acc_num,
        "recipient_name": to_acc.get("owner_name", ""),
        "reference": f"Transfer to #{to_acc_num} ({to_acc.get('owner_name')}) - {reference}",
        "timestamp": now_iso
    })

    # Incoming record
    db.transactions.insert_one({
        "transaction_id": txn_id_in,
        "account_number": to_acc_num,
        "user_id": to_acc["user_id"],
        "type": "transfer_in",
        "amount": amount,
        "fee": 0.0,
        "balance_after": new_to_balance,
        "sender_account_number": from_acc_num,
        "sender_name": from_acc.get("owner_name", ""),
        "reference": f"Transfer from #{from_acc_num} ({from_acc.get('owner_name')}) - {reference}",
        "timestamp": now_iso
    })

    log_audit("TRANSFER", {
        "from_account": from_acc_num,
        "to_account": to_acc_num,
        "amount": amount,
        "fee": fee
    }, user)

    return jsonify({
        "message": f"Successfully transferred ₹{amount:,.2f} to {to_acc.get('owner_name')} (#{to_acc_num})",
        "transaction_id": txn_id_out,
        "from_account_number": from_acc_num,
        "to_account_number": to_acc_num,
        "new_balance": new_from_balance,
        "amount": amount,
        "fee": fee
    }), 200

@transactions_bp.route("/history", methods=["GET"])
@token_required
def get_transaction_history():
    db = get_db()
    user = request.current_user
    acc_num = request.args.get("account_number")
    txn_type = request.args.get("type")
    limit = int(request.args.get("limit", 300))

    query = {}
    if user["role"] != "manager":
        query["user_id"] = user["user_id"]

    if acc_num:
        query["account_number"] = acc_num
    if txn_type:
        query["type"] = txn_type

    cursor = db.transactions.find(query).sort("timestamp", -1).limit(limit)
    txns = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        txns.append(doc)

    return jsonify({"transactions": txns, "count": len(txns)}), 200
