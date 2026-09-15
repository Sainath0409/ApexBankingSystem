import os
import pymongo
from pymongo import MongoClient
import mongomock
from .config import Config

class Database:
    _client = None
    _db = None
    _is_mock = False

    @classmethod
    def get_db(cls):
        if cls._db is not None:
            return cls._db

        mongo_uri = Config.MONGO_URI
        db_name = Config.DB_NAME

        try:
            # Try connecting to real MongoDB with short timeout
            real_client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
            real_client.admin.command('ping')
            cls._client = real_client
            cls._db = real_client[db_name]
            cls._is_mock = False
            print(f"[DATABASE] Connected successfully to live MongoDB: {mongo_uri}")
        except Exception as e:
            print(f"[DATABASE] Live MongoDB connection unavailable ({e}). Using robust In-Memory MongoDB (mongomock).")
            cls._client = mongomock.MongoClient()
            cls._db = cls._client[db_name]
            cls._is_mock = True

        cls._init_indexes()
        return cls._db

    @classmethod
    def is_mock(cls) -> bool:
        return cls._is_mock

    @classmethod
    def _init_indexes(cls):
        try:
            db = cls._db
            db.users.create_index([("email", pymongo.ASCENDING)], unique=True)
            db.accounts.create_index([("account_number", pymongo.ASCENDING)], unique=True)
            db.accounts.create_index([("user_id", pymongo.ASCENDING)])
            db.transactions.create_index([("transaction_id", pymongo.ASCENDING)], unique=True)
            db.transactions.create_index([("account_number", pymongo.ASCENDING)])
            db.transactions.create_index([("user_id", pymongo.ASCENDING)])
            db.transactions.create_index([("timestamp", pymongo.DESCENDING)])
            db.audit_logs.create_index([("timestamp", pymongo.DESCENDING)])
        except Exception as err:
            print(f"[DATABASE] Index creation info: {err}")

# Convenience accessor
def get_db():
    return Database.get_db()
