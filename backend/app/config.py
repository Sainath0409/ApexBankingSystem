import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "apex_banking_super_secret_jwt_key_2026")
    JWT_SECRET = os.getenv("JWT_SECRET", "apex_banking_jwt_secret_token_key_2026")
    
    # MongoDB Config
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/apex_banking_db")
    DB_NAME = os.getenv("DB_NAME", "apex_banking_db")
    
    # Session Expirations
    CUSTOMER_SESSION_TIMEOUT_MINUTES = int(os.getenv("CUSTOMER_SESSION_TIMEOUT_MINUTES", "5"))
    MANAGER_SESSION_TIMEOUT_HOURS = int(os.getenv("MANAGER_SESSION_TIMEOUT_HOURS", "24"))
    
    # Fixed Interest Rates & Account Rules
    SAVINGS_INTEREST_RATE = float(os.getenv("SAVINGS_INTEREST_RATE", "0.06")) # 6% per annum
    BUSINESS_INTEREST_RATE = float(os.getenv("BUSINESS_INTEREST_RATE", "0.09")) # 9% per annum
    SAVINGS_MINIMUM_BALANCE = float(os.getenv("SAVINGS_MINIMUM_BALANCE", "100.0")) # $100 min balance
    BUSINESS_WITHDRAWAL_FEE = float(os.getenv("BUSINESS_WITHDRAWAL_FEE", "1.50")) # $1.50 per withdrawal
