# Sonara — Project Setup Guide

This repository contains the source code for the **Sonara** project.

- **Backend:** Django + Django REST Framework (DRF)  
- **Frontend:** Next.js + TypeScript + Tailwind CSS  

---

## 🛠 Prerequisites

Before starting, make sure you have the following installed:

- **Python:** 3.10+  
- **Node.js:** 18.17+  
- **Git**

---

## 🚀 Quick Start

This guide will help you run the Django backend and Next.js frontend locally for development.

### 1) Backend Setup (Django)

#### Step 1: Navigate to the backend folder
```bash
cd backend
```

#### Step 2: Create and activate a virtual environment

**Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

**Mac / Linux**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

#### Step 4: Database setup

**Windows**
```bash
python manage.py migrate
```

**Mac / Linux**
```bash
python3 manage.py migrate
```

#### Step 5: Run the backend server

**Windows**
```bash
python manage.py runserver
```

**Mac / Linux**
```bash
python3 manage.py runserver
```

#### ✅ Verify Backend

Open the following URL in your browser:

- `http://127.0.0.1:8000/api/health/`

You should see:
```json
{"ok": true}
```

If you see this, the backend is running correctly 🎉

---

### 2) Frontend Setup (Next.js)

> ⚠️ Open a **new terminal window** and keep the backend server running.

#### Step 1: Navigate to the frontend app
```bash
cd frontend/my-next-app
```

#### Step 2: Install dependencies
```bash
npm install
```

#### Step 3: Configure environment variables

You must create a local environment file so the frontend knows where the backend is running.

**Windows (Command Prompt)**
```dos
type NUL > .env.local
```

Open `.env.local` in Notepad and paste:
```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

**Mac / Linux**
```bash
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000" > .env.local
```

#### Step 4: Run the frontend server
```bash
npm run dev
```

#### ✅ Verify Frontend

Open your browser and go to:

- `http://localhost:3000`

You should see the backend connection status displayed on the page. If the page loads and shows data from the backend, your frontend is successfully connected 🎉

---

## 🧪 Troubleshooting (Common Issues)

- **CORS errors:** Make sure Django allows `http://localhost:3000`
- **Backend not responding:** Ensure Django is running on port `8000`
- **Env vars not loading:** Restart the Next.js dev server after editing `.env.local`
- **Module not found:** Double-check you activated the virtual environment (`venv`)
