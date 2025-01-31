# student-management
 using reactjs (frontend), nodejs(backend), axios(API), and redis for database

# Setting up your environment

**Tools**
- `volta` - JavaScript Manager

<br>

*Note: If you already have node installed, you can skip the following steps.*

Volta installation.
```powershell
winget install Volta.Volta
```

Install node.js using Volta Js Manager
```powershell
volta install node
```

Checking node version
```powershell
node --version
```

<br>

# Installing project dependencies

## Backend
Installing dependencies for backend
```powershell
cd redis-backend && npm install
```
Run frontend
```powershell
npm start
```

## Frontend
Installing dependencies for frontend
```powershell
cd redis-frontend && npm install
```
Run backend
```powershell
node server.js
```
