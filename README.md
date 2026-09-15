# 🏦 Apex Banking System — Fullstack Platform

A production-grade, enterprise Fullstack Banking Application built with **Flask REST API (Blueprints Architecture)**, **MongoDB Persistence**, **React.js (Vite + Tailwind CSS)**, **Role-Based Access Control (RBAC)**, and a **Strict 5-Minute Inactivity Session Window for Clients**.

---

## 🌟 Key Features

### 1. Role-Based Access Control (RBAC)
- **Client Role (Customer)**:
  - Open new bank accounts (Savings, Business, Checking)
  - Deposit, withdraw, and transfer funds
  - Real-time recipient account number verification (`/api/accounts/lookup/<account_number>`)
  - Filterable transaction ledger & printable digital receipts
  - **🛡️ 5-Minute Security Inactivity Window**: The client's active session is monitored. If idle for 4 minutes, a countdown warning appears allowing the client to extend their session or auto-logout at 5 minutes.
- **Manager Role (Administrator)**:
  - Bank-wide Executive Dashboard (Total Reserves, User Metrics, Account Type Distribution)
  - Inspect, Freeze, Unfreeze, and Close customer bank accounts
  - View registered user profiles and suspend/reactivate access
  - Trigger **Batch Interest Distribution** across all active Savings accounts
  - Comprehensive **Security Audit Trail** logging IPs, actions, and timestamps

### 2. Enhanced Banking Domain Rules
- **Savings Account**: Requires minimum initial deposit of \$100.00, prevents withdrawals below \$100.00 minimum balance, compounds 5% annual interest.
- **Business Account**: High-volume transactions with a flat \$1.50 fee charged on withdrawals.
- **Checking Account**: Everyday transactional account with zero minimum balance requirement.
- **Atomic Intra-bank Transfers**: Instant account-to-account funds transfer with double-entry transaction records.

---

## 🚀 Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

---

### Step 1: Start Backend (Flask API)

```powershell
# Navigate to backend directory
cd backend

# Install dependencies (if not already installed)
python -m pip install -r requirements.txt

# Run the backend server (starts on http://localhost:5000)
python run.py
```

> **Note on MongoDB**: The backend connects to your MongoDB instance (`mongodb://localhost:27017/apex_banking_db` or MongoDB Atlas URI in `.env`). If no MongoDB server is currently running, it automatically activates an in-memory database (`mongomock`) so the entire application runs out-of-the-box with zero setup!

---

### Step 2: Start Frontend (React.js)

```powershell
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server (starts on http://localhost:5173)
npm run dev
```

---

## 🔑 Demo Login Credentials

You can use the **1-Click Quick Demo Login** buttons on the login page or enter credentials manually:

| Role | Email | Password | Session Timeout |
|---|---|---|---|
| **Bank Manager** | `manager@apexbank.com` | `Password123!` | 24 Hours (Administrative) |
| **Client 1** | `client@apexbank.com` | `Password123!` | **5 Minutes** (Inactivity window) |
| **Client 2** | `david@apexbank.com` | `Password123!` | **5 Minutes** (Inactivity window) |

Bank Manager: manager@apexbank.com / Password123!
Client: client@apexbank.com / Password123!

---

## 🧪 Running Automated Tests

```powershell
# Run the complete test suite for backend APIs & RBAC rules
python -m pytest backend/tests
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user (Client / Manager)
- `POST /api/auth/login` — Login & receive JWT token
- `GET /api/auth/me` — Current authenticated user profile
- `POST /api/auth/refresh` — Refresh token & extend session window

### Accounts (`/api/accounts`)
- `POST /api/accounts/create` — Open Savings, Business, or Checking account
- `GET /api/accounts/my-accounts` — List current user's accounts
- `GET /api/accounts/lookup/<account_number>` — Verify recipient details for transfer
- `GET /api/accounts/<account_number>` — Account details & balance
- `POST /api/accounts/<account_number>/close` — Close zero-balance account

### Transactions (`/api/transactions`)
- `POST /api/transactions/deposit` — Deposit funds
- `POST /api/transactions/withdraw` — Withdraw funds (enforcing fees/minimum balance)
- `POST /api/transactions/transfer` — Transfer funds between accounts
- `GET /api/transactions/history` — Filterable transaction ledger
- `POST /api/transactions/apply-interest/<acc_num>` — Apply interest to Savings

### Manager Operations (`/api/manager`)
- `GET /api/manager/analytics` — Global bank metrics and total reserves
- `GET /api/manager/accounts` — Search & list all customer accounts
- `PUT /api/manager/accounts/<acc_num>/status` — Freeze / Unfreeze / Close account
- `GET /api/manager/users` — List registered users and accounts count
- `PUT /api/manager/users/<user_id>/status` — Suspend / Reactivate user profile
- `POST /api/manager/batch-interest` — Disburse interest bank-wide
- `GET /api/manager/audit-logs` — Immutable audit log records




🚀 How to Run
Start Backend:

powershell


cd "d:\EXL\EXL Code\Fullstack Dev_plan\week one\banking_system_fullstack\backend"
python run.py
Start Frontend:

powershell


cd "d:\EXL\EXL Code\Fullstack Dev_plan\week one\banking_system_fullstack\frontend"
npm.cmd run dev
Demo Logins:

Manager: manager@apexbank.com / Password123!
Customer: customer@apexbank.com / Password123!