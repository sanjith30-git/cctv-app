# Backend Setup

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. **IMPORTANT**: Initialize the database with hashed passwords:
   ```bash
   python init_db.py
   ```
   This will create proper bcrypt hashes for all users. Default password is `password123`.

3. Start the server:
   ```bash
   python main.py
   ```
   Or:
   ```bash
   uvicorn main:app --reload
   ```

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Default Users

After running `init_db.py`:
- **owner1** / password123 (Owner)
- **owner2** / password123 (Owner)
- **admin** / password123 (Control Room)

