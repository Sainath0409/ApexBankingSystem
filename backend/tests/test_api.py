import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app
from app.config import Config
from app.database import Database

@pytest.fixture
def client():
    Config.DB_NAME = "test_apex_banking_cust"
    Database._db = None
    Database._client = None
    
    app = create_app(Config)
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"

def test_auth_login_seeded_users(client):
    # Manager login
    res = client.post("/api/auth/login", json={
        "email": "manager@apexbank.com",
        "password": "Password123!"
    })
    assert res.status_code == 200
    mgr_data = res.get_json()
    assert mgr_data["user"]["role"] == "manager"
    assert mgr_data["expires_in"] == 24 * 3600

    # Customer login
    res_cust = client.post("/api/auth/login", json={
        "email": "customer@apexbank.com",
        "password": "Password123!"
    })
    assert res_cust.status_code == 200
    cust_data = res_cust.get_json()
    assert cust_data["user"]["role"] == "customer"
    assert cust_data["expires_in"] == 300 # 5 minutes (300 seconds)

def test_rbac_protection(client):
    res = client.post("/api/auth/login", json={
        "email": "customer@apexbank.com",
        "password": "Password123!"
    })
    cust_token = res.get_json()["token"]
    headers = {"Authorization": f"Bearer {cust_token}"}

    # Customer attempts to access Manager Analytics -> Expected 403 Forbidden
    res_analytics = client.get("/api/manager/analytics", headers=headers)
    assert res_analytics.status_code == 403

    # Manager accesses Analytics -> Expected 200 OK
    res_mgr = client.post("/api/auth/login", json={
        "email": "manager@apexbank.com",
        "password": "Password123!"
    })
    mgr_token = res_mgr.get_json()["token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}
    res_mgr_analytics = client.get("/api/manager/analytics", headers=mgr_headers)
    assert res_mgr_analytics.status_code == 200

def test_account_creation_rules(client):
    res = client.post("/api/auth/register", json={
        "name": "Tom Hank",
        "email": "tom@test.com",
        "password": "Password123!",
        "role": "customer"
    })
    assert res.status_code == 201
    token = res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Savings account with deposit < $100 -> Expected 400 Bad Request
    res_low = client.post("/api/accounts/create", json={
        "account_type": "savings",
        "initial_deposit": 50.0
    }, headers=headers)
    assert res_low.status_code == 400

    # Savings account with deposit >= $100 -> Expected 201 Created with 6% interest
    res_valid = client.post("/api/accounts/create", json={
        "account_type": "savings",
        "initial_deposit": 250.0
    }, headers=headers)
    assert res_valid.status_code == 201
    acc = res_valid.get_json()["account"]
    assert acc["interest_rate"] == 0.06

    # Business account -> Expected 201 Created with 9% interest
    res_biz = client.post("/api/accounts/create", json={
        "account_type": "business",
        "initial_deposit": 500.0
    }, headers=headers)
    assert res_biz.status_code == 201
    biz_acc = res_biz.get_json()["account"]
    assert biz_acc["interest_rate"] == 0.09

def test_manager_user_details_and_periodic_interest(client):
    # Log in as Manager
    res_mgr = client.post("/api/auth/login", json={
        "email": "manager@apexbank.com",
        "password": "Password123!"
    })
    mgr_token = res_mgr.get_json()["token"]
    mgr_headers = {"Authorization": f"Bearer {mgr_token}"}

    # Get users list
    res_users = client.get("/api/manager/users", headers=mgr_headers)
    assert res_users.status_code == 200
    users = res_users.get_json()["users"]
    assert len(users) >= 2
    target_user = next(u for u in users if u["email"] == "customer@apexbank.com")

    # Get details modal data for user
    res_details = client.get(f"/api/manager/users/{target_user['user_id']}/details", headers=mgr_headers)
    assert res_details.status_code == 200
    details = res_details.get_json()
    assert "user" in details
    assert "accounts" in details
    assert len(details["accounts"]) >= 1

    # Trigger periodic interest
    res_interest = client.post("/api/manager/process-periodic-interest", headers=mgr_headers)
    assert res_interest.status_code == 200
    assert "accounts_credited" in res_interest.get_json()
