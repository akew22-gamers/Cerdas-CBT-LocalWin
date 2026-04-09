const { app, BrowserWindow, ipcMain, Menu, shell, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Environment detection
const isDev = process.env.NODE_ENV === 'development';
const isProduction = !isDev;

// Server process reference
let serverProcess = null;
let mainWindow = null;
let serverPort = 3000;

// Data directory path
const getDataDir = () => {
  if (isProduction) {
    // In production, use the bundled data directory
    return path.join(process.resourcesPath, 'data');
  }
  // In development, use the project data directory
  return path.join(__dirname, '..', 'data');
};

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = getDataDir();
  const subDirs = ['uploads', 'exports', 'backups'];
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  subDirs.forEach(subDir => {
    const fullPath = path.join(dataDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Start Next.js server
const startServer = () => {
  if (serverProcess) {
    console.log('Server already running');
    return;
  }

  const dataDir = getDataDir();
  
  // Set environment variables for the Next.js server
  const env = {
    ...process.env,
    PORT: String(serverPort),
    HOST: '0.0.0.0', // Allow LAN access
    DATA_DIR: dataDir,
    NODE_ENV: isProduction ? 'production' : 'development',
  };

  console.log('Starting server with DATA_DIR:', dataDir);

  if (isProduction) {
    const appPath = app.getAppPath();
    const standalonePath = path.join(appPath, '.next', 'standalone');
    const serverPath = path.join(standalonePath, 'server.js');
    
    console.log('Production server path:', serverPath);
    console.log('App path:', appPath);
    
    serverProcess = spawn('node', [serverPath], { 
      env,
      cwd: standalonePath
    });
  } else {
    const nextPath = path.join(__dirname, '..', 'node_modules', '.bin', 'next');
    const projectPath = path.join(__dirname, '..');
    serverProcess = spawn(nextPath, ['start'], { env, cwd: projectPath });
  }

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('Server stdout:', output);
    if (mainWindow) {
      mainWindow.webContents.send('server-log', output);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString();
    console.error('Server stderr:', output);
    if (mainWindow) {
      mainWindow.webContents.send('server-log', `[ERROR] ${output}`);
    }
  });

  serverProcess.on('close', (code) => {
    console.log('Server process closed with code:', code);
    serverProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('server-status', { running: false });
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Server process error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('server-log', `[ERROR] Failed to start server: ${err.message}`);
    }
  });
};

// Stop Next.js server
const stopServer = () => {
  if (!serverProcess) {
    console.log('Server not running');
    return;
  }

  serverProcess.kill('SIGTERM');
  serverProcess = null;
  console.log('Server stopped');
  if (mainWindow) {
    mainWindow.webContents.send('server-status', { running: false });
  }
};

// Get server status
const getServerStatus = () => {
  return {
    running: serverProcess !== null,
    port: serverPort,
    dataDir: getDataDir(),
  };
};

// Create main dashboard window
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 600,
    minHeight: 400,
    title: 'CBT Server Local - Control Panel',
    icon: path.join(__dirname, 'resources', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    resizable: true,
    show: false, // Show after ready
  });

  // Load dashboard HTML
  mainWindow.loadFile(path.join(__dirname, 'dashboard', 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Send initial status
    mainWindow.webContents.send('server-status', getServerStatus());
    mainWindow.webContents.send('data-dir', getDataDir());
  });

  // Handle window close
  mainWindow.on('close', (e) => {
    if (serverProcess) {
      e.preventDefault();
      const choice = dialog.showMessageBoxSync(mainWindow, {
        type: 'question',
        buttons: ['Stop Server & Exit', 'Keep Running', 'Cancel'],
        title: 'Server Still Running',
        message: 'The CBT server is still running. Do you want to stop it and exit?',
        defaultId: 0,
        cancelId: 2,
      });
      
      if (choice === 0) {
        stopServer();
        mainWindow.destroy();
        app.quit();
      } else if (choice === 1) {
        // Keep running - just hide window
        mainWindow.hide();
      }
      // choice === 2: Cancel - do nothing
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  createMenu();
};

// Create application menu
const createMenu = () => {
  const template = [
    {
      label: 'Server',
      submenu: [
        { label: 'Start Server', click: () => startServer() },
        { label: 'Stop Server', click: () => stopServer() },
        { type: 'separator' },
        { label: 'Open in Browser', click: () => shell.openExternal(`http://localhost:${serverPort}`) },
        { type: 'separator' },
        { label: 'Exit', click: () => app.quit() },
      ]
    },
    {
      label: 'Data',
      submenu: [
        { label: 'Open Data Folder', click: () => shell.openPath(getDataDir()) },
        { label: 'Open Uploads Folder', click: () => shell.openPath(path.join(getDataDir(), 'uploads')) },
        { label: 'Open Backups Folder', click: () => shell.openPath(path.join(getDataDir(), 'backups')) },
      ]
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About', click: () => showAboutDialog() },
        { type: 'separator' },
        { label: 'Documentation', click: () => shell.openExternal('https://github.com/akew22-gamers/Cerdas-CBT-LocalWin') },
      ]
    },
  ];

  // Add View menu in development
  if (isDev) {
    template.splice(1, 0, {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Show about dialog
const showAboutDialog = () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'About CBT Server Local',
    message: 'CBT Server Local v1.0.0',
    detail: 'Offline Computer Based Test Server for Windows.\n\nDeveloped for local school exam management.\n\nServer runs on localhost:3000\nAccessible via LAN for Guru and Siswa.\n\nData stored locally in SQLite database.',
    buttons: ['OK'],
  });
};

// IPC Handlers
ipcMain.handle('start-server', () => {
  startServer();
  return getServerStatus();
});

ipcMain.handle('stop-server', () => {
  stopServer();
  return getServerStatus();
});

ipcMain.handle('get-server-status', () => {
  return getServerStatus();
});

ipcMain.handle('open-browser', () => {
  shell.openExternal(`http://localhost:${serverPort}`);
});

ipcMain.handle('open-data-folder', () => {
  shell.openPath(getDataDir());
});

ipcMain.handle('get-network-info', () => {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.keys(interfaces).forEach((ifname) => {
    interfaces[ifname].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          interface: ifname,
          address: iface.address,
          url: `http://${iface.address}:${serverPort}`,
        });
      }
    });
  });
  
  return addresses;
});

// App lifecycle
app.whenReady().then(() => {
  ensureDataDir();
  createWindow();
  
  // Auto-start server on launch
  startServer();
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    stopServer();
  }
  app.quit();
});

app.on('before-quit', () => {
  if (serverProcess) {
    stopServer();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (mainWindow) {
    mainWindow.webContents.send('server-log', `[ERROR] Uncaught Exception: ${error.message}`);
  }
});