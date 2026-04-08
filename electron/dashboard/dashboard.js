const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const serverUrl = document.getElementById('serverUrl');
const dataDir = document.getElementById('dataDir');
const networkList = document.getElementById('networkList');
const openBrowserBtn = document.getElementById('openBrowserBtn');
const openDataBtn = document.getElementById('openDataBtn');
const logContainer = document.getElementById('logContainer');

function addLog(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function updateStatus(status) {
  statusIndicator.classList.remove('running', 'stopped');
  
  if (status.running) {
    statusIndicator.classList.add('running');
    statusText.textContent = 'Server Running';
    addLog('Server started successfully', 'success');
  } else {
    statusIndicator.classList.add('stopped');
    statusText.textContent = 'Server Stopped';
    addLog('Server stopped', 'error');
  }
  
  if (status.port) {
    serverUrl.textContent = `http://localhost:${status.port}`;
  }
}

function displayNetworkInfo(addresses) {
  if (addresses.length === 0) {
    networkList.innerHTML = '<div class="loading">No network interfaces detected. Check your network connection.</div>';
    return;
  }
  
  networkList.innerHTML = addresses.map(addr => `
    <div class="network-item">
      <span class="interface-name">${addr.interface}</span>
      <span class="network-url" onclick="copyToClipboard('${addr.url}')">${addr.url}</span>
    </div>
  `).join('');
  
  addLog(`Network detected: ${addresses.length} interface(s) available for LAN access`, 'info');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    addLog(`Copied to clipboard: ${text}`, 'info');
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  addLog('Initializing CBT Server Local...', 'info');
  
  const status = await window.electronAPI.getServerStatus();
  updateStatus(status);
  
  const addresses = await window.electronAPI.getNetworkInfo();
  displayNetworkInfo(addresses);
  
  window.electronAPI.onServerStatus((status) => {
    updateStatus(status);
  });
  
  window.electronAPI.onServerLog((log) => {
    const type = log.includes('[ERROR]') ? 'error' : 
                 log.includes('ready') || log.includes('started') ? 'success' : 'info';
    addLog(log, type);
  });
  
  window.electronAPI.onDataDir((dir) => {
    dataDir.textContent = dir;
    addLog(`Data directory: ${dir}`, 'info');
  });
});

openBrowserBtn.addEventListener('click', async () => {
  addLog('Opening server in browser...', 'info');
  await window.electronAPI.openBrowser();
});

openDataBtn.addEventListener('click', async () => {
  addLog('Opening data folder...', 'info');
  await window.electronAPI.openDataFolder();
});