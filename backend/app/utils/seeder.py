import bcrypt
import uuid
from datetime import datetime, timezone, timedelta
from ..database import get_db

def seed_database():
    db = get_db()
    
    if db.users.count_documents({}) > 0:
        return

    print("[SEEDER] Populating database with initial users, bank accounts, and transactions...")
    
    hashed_pw = bcrypt.hashpw("Password123!".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    # 1. Manager Account
    manager_res = db.users.insert_one({
        "name": "Alexander Ross",
        "email": "manager@apexbank.com",
        "password_hash": hashed_pw,
        "role": "manager",
        "phone": "+1 (555) 019-2834",
        "status": "active",
        "created_at": (now - timedelta(days=30)).isoformat()
    })
    manager_id = str(manager_res.inserted_id)

    # 2. Customer Sarah Jenkins
    sarah_res = db.users.insert_one({
        "name": "Sarah Jenkins",
        "email": "customer@apexbank.com",
        "password_hash": hashed_pw,
        "role": "customer",
        "phone": "+1 (555) 234-5678",
        "status": "active",
        "created_at": (now - timedelta(days=20)).isoformat()
    })
    sarah_id = str(sarah_res.inserted_id)

    # 3. Customer David Miller
    david_res = db.users.insert_one({
        "name": "David Miller",
        "email": "david@apexbank.com",
        "password_hash": hashed_pw,
        "role": "customer",
        "phone": "+1 (555) 876-5432",
        "status": "active",
        "created_at": (now - timedelta(days=15)).isoformat()
    })
    david_id = str(david_res.inserted_id)

    # Seed Accounts for Sarah (Savings 6% & Business 9%)
    sarah_savings = {
        "account_number": "100101",
        "user_id": sarah_id,
        "owner_name": "Sarah Jenkins",
        "owner_email": "customer@apexbank.com",
        "account_type": "Savings",
        "balance": 5450.00,
        "interest_rate": 0.06, # 6% APY
        "minimum_balance": 100.00,
        "transaction_fee": 0.0,
        "status": "active",
        "created_at": (now - timedelta(days=20)).isoformat()
    }
    db.accounts.insert_one(sarah_savings)

    sarah_business = {
        "account_number": "200202",
        "user_id": sarah_id,
        "owner_name": "Sarah Jenkins",
        "owner_email": "customer@apexbank.com",
        "account_type": "Business",
        "balance": 12800.00,
        "interest_rate": 0.09, # 9% APY
        "minimum_balance": 0.0,
        "transaction_fee": 1.50,
        "status": "active",
        "created_at": (now - timedelta(days=18)).isoformat()
    }
    db.accounts.insert_one(sarah_business)

    # Seed Accounts for David (Savings 6%)
    david_savings = {
        "account_number": "400404",
        "user_id": david_id,
        "owner_name": "David Miller",
        "owner_email": "david@apexbank.com",
        "account_type": "Savings",
        "balance": 3200.00,
        "interest_rate": 0.06, # 6% APY
        "minimum_balance": 100.00,
        "transaction_fee": 0.0,
        "status": "active",
        "created_at": (now - timedelta(days=15)).isoformat()
    }
    db.accounts.insert_one(david_savings)

    # Seed Sample Transactions
    txns = [
        {
            "transaction_id": "TXN-INIT101",
            "account_number": "100101",
            "user_id": sarah_id,
            "type": "deposit",
            "amount": 5000.00,
            "fee": 0.0,
            "balance_after": 5000.00,
            "reference": "Initial Deposit",
            "timestamp": (now - timedelta(days=20)).isoformat()
        },
        {
            "transaction_id": "TXN-DEP102",
            "account_number": "100101",
            "user_id": sarah_id,
            "type": "deposit",
            "amount": 450.00,
            "fee": 0.0,
            "balance_after": 5450.00,
            "reference": "Direct Salary Credit",
            "timestamp": (now - timedelta(days=12)).isoformat()
        },
        {
            "transaction_id": "TXN-INIT202",
            "account_number": "200202",
            "user_id": sarah_id,
            "type": "deposit",
            "amount": 15000.00,
            "fee": 0.0,
            "balance_after": 15000.00,
            "reference": "Business Opening Funding",
            "timestamp": (now - timedelta(days=18)).isoformat()
        },
        {
            "transaction_id": "TXN-WTH203",
            "account_number": "200202",
            "user_id": sarah_id,
            "type": "withdraw",
            "amount": 2198.50,
            "fee": 1.50,
            "balance_after": 12800.00,
            "reference": "Office Supplies & Equipment",
            "timestamp": (now - timedelta(days=5)).isoformat()
        },
        {
            "transaction_id": "TXN-INIT404",
            "account_number": "400404",
            "user_id": david_id,
            "type": "deposit",
            "amount": 3200.00,
            "fee": 0.0,
            "balance_after": 3200.00,
            "reference": "Initial Deposit",
            "timestamp": (now - timedelta(days=15)).isoformat()
        }
    ]
    db.transactions.insert_many(txns)

    # Seed Initial Audit Log
    db.audit_logs.insert_one({
        "action": "SYSTEM_INITIALIZED",
        "details": {"seed_status": "complete", "users_seeded": 3, "accounts_seeded": 3},
        "user_id": manager_id,
        "user_email": "manager@apexbank.com",
        "role": "manager",
        "ip_address": "127.0.0.1",
        "timestamp": now_iso
    })

    print("[SEEDER] Database successfully populated!")
