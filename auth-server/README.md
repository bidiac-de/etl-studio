# Auth Server

Minimalistischer User-Management-Server für ETL Studio mit SQLite-Datenbank.

## Start

```bash
# Windows
./start-auth-server.bat

# Oder direkt
php -S localhost:9000 router.php
```

## Datenbank

- **SQLite-Datei:** `users.db` (wird automatisch erstellt)
- **Default Users:** admin/admin123, user/user123
- **Tabellen:** users (id, username, password, fullname, role, created_at)

## Endpoints

### POST /login
Authentifiziert einen Benutzer.

**Request:**
```json
{
    "username": "admin",
    "password": "admin123"
}
```

**Response:**
```json
{
    "success": true,
    "token": "64-char-hex-token",
    "user": {
        "username": "admin",
        "fullname": "Sven König",
        "role": "admin"
    }
}
```

### POST /verify
Verifiziert einen Token.

**Request:**
```json
{
    "token": "64-char-hex-token"
}
```

**Response:**
```json
{
    "success": true,
    "valid": true
}
```

### GET /users
Listet alle Benutzer auf (Admin-Feature).

**Response:**
```json
{
    "success": true,
    "users": [
        {
            "id": 1,
            "username": "admin",
            "fullname": "Sven König",
            "role": "admin",
            "created_at": "2025-07-24 10:00:00"
        }
    ]
}
```

### POST /register
Registriert einen neuen Benutzer.

**Request:**
```json
{
    "username": "newuser",
    "password": "password123",
    "fullname": "New User",
    "role": "user"
}
```

**Response:**
```json
{
    "success": true,
    "message": "User created successfully"
}
```

## Test Users

- **admin** / admin123
- **user** / user123 