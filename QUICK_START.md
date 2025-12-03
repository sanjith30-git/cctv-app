# Quick Start Guide

## ⚠️ IMPORTANT: Start the Backend First!

The network error you're seeing means the backend server is not running.

### Step 1: Start Backend Server

1. Open a terminal/command prompt
2. Navigate to backend folder:
   ```bash
   cd backend
   ```

3. Activate virtual environment (if using one):
   ```bash
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

4. Start the server:
   ```bash
   python main.py
   ```

   You should see:
   ```
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

5. **Keep this terminal open** - the server must stay running!

### Step 2: Verify Backend is Running

Open a browser and go to: `http://192.168.0.107:8000/docs`

You should see the API documentation page. If you see this, the backend is running correctly.

### Step 3: Start Mobile App

1. Open a **new** terminal/command prompt
2. Navigate to frontend folder:
   ```bash
   cd frontend
   ```

3. Start Expo:
   ```bash
   npm start
   ```

4. Scan QR code with Expo Go app on your phone

### Step 4: Login

Use these credentials:
- **Owner**: `owner1` / `password123` / Role: "CCTV Owner"
- **Control Room**: `admin` / `password123` / Role: "Control Room"

## Troubleshooting

### "Network Error" or "Cannot connect to server"

1. ✅ Make sure backend is running (Step 1)
2. ✅ Check that both devices are on the same Wi-Fi network
3. ✅ Verify your IP address hasn't changed:
   - Run: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - Update `frontend/src/utils/api.js` if IP changed
4. ✅ Check Windows Firewall - allow Python on port 8000

### "Invalid username or password"

- Make sure you're using the correct credentials
- Username should be exactly: `owner1`, `owner2`, or `admin`
- Password should be exactly: `password123`
- Role must match the user (Owner for owner1/owner2, Control Room for admin)

## Current Setup

- **Backend URL**: `http://192.168.0.107:8000/api`
- **Backend Port**: 8000
- **Authentication**: JWT tokens stored in AsyncStorage

