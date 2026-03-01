import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'

const isDev = process.env.NODE_ENV === 'development'

let mainWindow: BrowserWindow | null = null

// Register custom protocol for OAuth callbacks (pegasus://auth-callback)
// Must include the script path explicitly — without it, Windows passes the
// protocol URL as argv[1] and Electron tries to load it as the app entry point.
app.setAsDefaultProtocolClient('pegasus', process.execPath, [join(__dirname, 'index.js')])

// Enforce single instance so the OAuth protocol redirect hits this process
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  // Windows: protocol handler fires second-instance with the URL in commandLine
  app.on('second-instance', (_event, commandLine) => {
    const callbackUrl = commandLine.find(arg => arg.startsWith('pegasus://'))
    if (callbackUrl && mainWindow) {
      mainWindow.webContents.send('auth:callback', callbackUrl)
    }
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    ipcMain.on('window:minimize', () => mainWindow?.minimize())
    ipcMain.on('window:close', () => mainWindow?.close())
    ipcMain.on('open-external', (_event, url: string) => shell.openExternal(url))

    // Expand window for cloud PC streaming, restore for normal UI
    ipcMain.on('window:enter-cloudpc', () => {
      if (!mainWindow) return
      mainWindow.setResizable(true)
      mainWindow.setMinimumSize(800, 600)
      mainWindow.setMaximumSize(0, 0)
      mainWindow.maximize()
    })
    ipcMain.on('window:exit-cloudpc', () => {
      if (!mainWindow) return
      mainWindow.unmaximize()
      mainWindow.setSize(950, 620)
      mainWindow.setMinimumSize(950, 620)
      mainWindow.setMaximumSize(950, 620)
      mainWindow.setResizable(false)
      mainWindow.center()
    })

    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 950,
    height: 620,
    minWidth: 950,
    minHeight: 620,
    maxWidth: 950,
    maxHeight: 620,
    resizable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0f',
    center: true,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webviewTag: true
    }
  })

  mainWindow.once('ready-to-show', () => mainWindow?.show())

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Allow webview (noVNC) to make WebSocket connections and load insecure content
  mainWindow.webContents.on('will-attach-webview', (_event, webPreferences) => {
    webPreferences.allowRunningInsecureContent = true
  })

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Auto-supply Basic Auth credentials for the Selkies streaming webview.
// Selkies' nginx requires Basic Auth; this prevents the blank-page 401.
app.on('login', (event, _webContents, _details, _authInfo, callback) => {
  event.preventDefault()
  callback('user', 'pegasus')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})