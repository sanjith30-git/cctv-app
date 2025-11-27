# Login Troubleshooting Guide

## Common Login Issues

### 1. "Cannot connect to server" Error

**Problem:** You're using a physical device and trying to connect to `localhost`.

**Solution:**
1. Find your computer's IP address:
   - **Windows:** Open CMD, run `ipconfig`, look for "IPv4 Address"
   - **macOS/Linux:** Open Terminal, run `ifconfig` or `ip addr`
   
2. Update `frontend/src/utils/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_IP_ADDRESS:8000/api';
   // Example: const API_BASE_URL = 'http://192.168.1.100:8000/api';
   ```

3. Make sure:
   - Backend is running: `cd backend && python main.py`
   - Both devices are on the same Wi-Fi network
   - Firewall allows connections on port 8000

### 2. "Invalid username or password" Error

**Check:**
- Username: `owner1`, `owner2`, or `admin`
- Password: `password123`
- Role matches the user:
  - `owner1` and `owner2` → Select "CCTV Owner"
  - `admin` → Select "Control Room"

**If still failing:**
1. Reinitialize the database:
   ```bash
   cd backend
   python init_db.py
   ```

### 3. Backend Not Running

**Check if backend is running:**
1. Open browser and go to: `http://localhost:8000/docs`
2. If you see the API documentation, backend is running
3. If not, start it:
   ```bash
   cd backend
   python main.py
   ```

### 4. Network Connection Issues

**For Physical Device:**
- Ensure phone and computer are on the same Wi-Fi network
- Try pinging your computer's IP from the phone
- Check Windows Firewall settings

**For Emulator/Simulator:**
- Android Emulator: Use `10.0.2.2` instead of `localhost`
- iOS Simulator: `localhost` should work

### 5. Check Console Logs

Open the Expo developer console to see detailed error messages:
- Look for network errors
- Check the exact error message
- Verify the API URL being used

## Quick Test

Test if backend is accessible:
```bash
# From your computer
curl http://localhost:8000/

# Should return: {"message":"CCTV Role-Based System API"}
```

## Still Having Issues?

1. Check the Expo console for detailed error messages
2. Verify backend is running and accessible
3. Confirm API URL is correct for your device type
4. Ensure database is initialized (`python init_db.py`)

