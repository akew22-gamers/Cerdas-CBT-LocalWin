# CBT Server Local - Build Instructions

## Prerequisites

1. **Node.js 18+** installed
2. **Windows** (for Windows EXE build) or **Linux** (for Linux build)

## Building the Application

### Step 1: Install Dependencies

```bash
npm install
```

This will automatically rebuild native modules (better-sqlite3) for Electron.

### Step 2: Build Next.js Application

```bash
npm run build
```

### Step 3: Build Electron Application

#### Windows EXE
```bash
npm run electron:build:win
```

Output files will be in `release/` folder:
- `CBT Server Local-1.0.0-x64.exe` (Portable)
- `CBT Server Local-Setup-1.0.0-x64.exe` (Installer)

#### Linux
```bash
npm run electron:build:linux
```

Output files:
- `CBT Server Local-1.0.0-x64.AppImage` (Universal)
- `CBT Server Local-1.0.0-x64.deb` (Debian/Ubuntu)

## Development Mode

Run the application in development mode with hot reload:

```bash
npm run electron:dev
```

## Application Icon (Optional)

To add a custom icon:

1. Place `icon.ico` (Windows) in `electron/resources/`
2. Place icon files in `electron/resources/icons/` (Linux)
   - `icon.png` (512x512 recommended)

## Running on Windows

After building:

1. Run the portable EXE or install using the installer
2. The server control panel will open automatically
3. Server starts automatically on launch
4. Access the application at `http://localhost:3000`
5. Other computers on LAN can access via `http://<your-ip>:3000`

## Directory Structure

```
CBT-LocalWin/
├── electron/           # Electron main process
│   ├── main.js         # Main process entry
│   ├── preload.js      # Preload script
│   ├── dashboard/      # Control panel UI
│   └── resources/      # Icons and resources
├── app/                # Next.js pages
├── lib/                # Shared libraries
│   ├── db/             # SQLite database layer
│   ├── auth/           # JWT authentication
│   └── utils/          # Utilities
├── data/               # Local data storage
│   ├── cbt-data.db     # SQLite database
│   ├── uploads/        # Uploaded files
│   ├── exports/        # Exported files
│   └── backups/        # Database backups
└── release/            # Built applications
```

## Troubleshooting

### better-sqlite3 native module error

Run:
```bash
npm run electron:rebuild
```

### Port 3000 already in use

Change the port in `electron/main.js`:
```javascript
let serverPort = 3001; // Change to available port
```

### Database initialization

The database is automatically initialized on first run. If you need to reset:
1. Delete `data/cbt-data.db`
2. Restart the application

## Network Configuration

For LAN access, ensure:
1. Windows Firewall allows the application
2. All computers are on the same network
3. Use the IP address shown in the control panel