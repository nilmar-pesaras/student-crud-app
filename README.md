# student-management
 using reactjs (frontend), nodejs(backend), axios(API), and redis for database

# Setting up your environment

**Tools**
- `volta` - JavaScript Manager
- `pnpm` - Node Package Manager

<br>

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

Install `pnpm` using `volta`.
```powershell
volta install pnpm
```

install node packages using `pnpm`
```powershell
pnpm install
```

# Start only frontend
npm run start:client

# Start only backend
npm run start:server

# Start backend in dev mode (with nodemon)
npm run dev:server