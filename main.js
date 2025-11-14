const { app, BrowserWindow } = require('electron');
const path = require('path');

// 设置用户数据路径到有写入权限的目录
app.setPath('userData', path.join(__dirname, 'user-data'));

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
        enableRemoteModule: true,
        webSecurity: false // 允许加载本地文件
      },
      resizable: true,
      title: 'TWT-FORCE',
      icon: path.join(__dirname, 'assets/icon.ico') // 可选：添加应用图标
    });

    // 开发环境和生产环境使用不同的加载方式
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadFile('load.html');
      this.mainWindow.webContents.openDevTools();
    } else {
      // 生产环境：优先尝试加载 game.html，如果不存在则使用 index.html
      try {
        this.mainWindow.loadFile('load.html');
      } catch (error) {
        console.log('game.html 不存在，尝试加载 load.html');
        this.mainWindow.loadFile('load.html');
      }
    }

    // 处理窗口关闭事件
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // 处理文件加载失败
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('页面加载失败:', errorCode, errorDescription);
    });
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

// 处理应用激活事件（macOS）
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const gameWindow = new GameWindow();
    gameWindow.createWindow();
  }
});
