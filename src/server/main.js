// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow } = require('electron');
const { is } = require('electron-util');
const TrayGenerator = require('./TrayGenerator');
const Store = require('electron-store');

const schema = {
  launchAtStartup: true,
  refreshToken: '',
  accessToken: '',
};

const store = new Store(schema);

const path = require('path');

let mainWindow = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#fff',
    width: 300,
    height: 150,
    show: false,
    fullscreenable: false,
    resizable: false,
    webPreferences: {
      devTools: is.development,
      nodeIntegration: true,
      backgroundThrottling: false,
    },
  });

  if (is.development) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadURL(
      `file://${path.join(__dirname, '../../build/index.html')}`
    );
  }
};

app.on('ready', () => {
  createMainWindow();
  const Tray = new TrayGenerator(mainWindow, store);
  Tray.createTray();
});

app.dock.hide();

app.setLoginItemSettings({
  openAtLogin: store.get('launchAtStart'),
});
