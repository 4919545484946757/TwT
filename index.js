const { app, BrowserWindow } = require('electron')


const createWindow = () => {
  const MainWin = new BrowserWindow({
    width: 1000,
    height: 800
  })
  // load the index.html file
  MainWin.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
})