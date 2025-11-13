const { app, BrowserWindow } = require('electron');
const path = require('path');

class GameWindow {
  constructor() {
    this.mainWindow = null;
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true
      },
      resizable: true,
      title: 'TWT-FORCE'
    });

    this.mainWindow.loadFile('index.html');
    
    // 开发时打开调试工具
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }
}

app.whenReady().then(() => {
  const gameWindow = new GameWindow();
  gameWindow.createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gameWindow.createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});