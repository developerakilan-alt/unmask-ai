const { app, BrowserWindow, protocol } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const DIST = path.join(__dirname, '..', 'dist');

if (process.env.UNMASK_TEST_LOG) {
  const TEST_LOG = path.join(app.getPath('temp'), 'unmask-app-test.log');
  const testLog = (msg) => {
    try {
      fs.appendFileSync(TEST_LOG, `${new Date().toISOString()} [${process.pid}] ${msg}\n`);
    } catch (e) { /* ignore */ }
  };
  testLog('main process entered');
  process.on('uncaughtException', (err) => {
    testLog(`uncaughtException: ${err && err.stack ? err.stack : err}`);
  });
  process.on('unhandledRejection', (reason) => {
    testLog(`unhandledRejection: ${reason}`);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'public', 'logo.png');

  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: 'Unmask AI',
    icon: iconPath,
    show: false,
    backgroundColor: '#09090b',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (process.env.UNMASK_TEST_LOG) {
    const logFile = path.join(app.getPath('temp'), 'unmask-app-test.log');
    const log = (msg) => fs.appendFileSync(logFile, `${new Date().toISOString()} ${msg}\n`);
    win.webContents.on('did-finish-load', () => log('did-finish-load'));
    win.webContents.on('did-fail-load', (_e, code, desc, url) => log(`did-fail-load code=${code} desc=${desc} url=${url}`));
    win.webContents.on('render-process-gone', (_e, details) => log(`render-process-gone ${details.reason}`));
    win.webContents.on('console-message', (_e, level, message, line, sourceId) => log(`console[${level}] ${sourceId}:${line} ${message}`));
    setTimeout(() => app.quit(), 8000);
  }

  win.loadURL('app://bundle/index.html');
}

app.whenReady().then(() => {
  protocol.handle('app', async (request) => {
    const { pathname } = new URL(request.url);
    let rel = decodeURIComponent(pathname);
    if (rel === '' || rel === '/') rel = '/index.html';

    const target = path.normalize(path.join(DIST, rel));
    if (!target.startsWith(DIST)) {
      return new Response('Forbidden', { status: 403 });
    }

    try {
      const data = await fs.promises.readFile(target);
      const ext = path.extname(target).toLowerCase();
      return new Response(data, {
        headers: { 'content-type': MIME[ext] || 'application/octet-stream' },
      });
    } catch {
      return new Response('Not Found', { status: 404 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
