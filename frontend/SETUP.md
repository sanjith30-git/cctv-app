# Mobile App Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update API URL for your device:**
   
   Open `src/utils/api.js` and update the `API_BASE_URL`:
   
   - **For Emulator/Simulator:** Keep `localhost:8000`
   - **For Physical Device:** Replace with your computer's IP address
   
   Example:
   ```javascript
   const API_BASE_URL = 'http://192.168.1.100:8000/api';
   ```
   
   **How to find your IP:**
   - Windows: Open CMD, run `ipconfig`, look for "IPv4 Address"
   - macOS/Linux: Open Terminal, run `ifconfig` or `ip addr`, look for your local network IP

3. **Start the backend server:**
   ```bash
   cd ../backend
   python main.py
   ```
   
   Make sure it's running with `--host 0.0.0.0` to accept connections from mobile devices.

4. **Start Expo:**
   ```bash
   npm start
   ```

5. **Open on your device:**
   - Install Expo Go app from App Store / Play Store
   - Scan the QR code with Expo Go
   - Make sure your phone and computer are on the same Wi-Fi network

## Troubleshooting

### Can't connect to backend
- ✅ Check that backend is running
- ✅ Verify IP address is correct
- ✅ Ensure both devices are on same network
- ✅ Check firewall allows port 8000
- ✅ Try `http://` not `https://`

### App won't load
- Clear cache: `npx expo start -c`
- Restart Metro bundler
- Reinstall Expo Go app

