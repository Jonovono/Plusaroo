// eslint-disable-next-line import/no-extraneous-dependencies
const { app, BrowserWindow, globalShortcut } = require('electron');
const { is } = require('electron-util');
const path = require('path');
const Store = require('electron-store');
const TrayGenerator = require('./TrayGenerator');
const SpotifyAuth = require('./SpotifyAuth');
const SpotifyPlayer = require('./SpotifyPlayer');

const icons = path.join(__dirname, './assets/AppIcon.appiconset');

const schema = {
  launchAtStartup: true,
  refreshToken: '',
  accessToken: '',
};

const store = new Store(schema);

let mainWindow = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    backgroundColor: '#fff',
    width: 300,
    height: 150,
    show: false,
    fullscreenable: false,
    resizable: false,
    icon: icons,
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

app.on('ready', async () => {
  createMainWindow();
  const Tray = new TrayGenerator(mainWindow, store);
  const spotifyAuth = new SpotifyAuth(store);
  const tray = Tray.createTray();

  await spotifyAuth.initialize();

  const player = new SpotifyPlayer(this.store, Tray);
  player.initialize();

  globalShortcut.register('Control + Option + Command + Shift + O', () =>
    player.saveSong()
  );

  globalShortcut.register('Control + Option + P', () => player.saveSong());

  tray.on('click', () => player.saveSong());
});

app.setName('Plusaroo');

app.setLoginItemSettings({
  openAtLogin: store.get('launchAtStart'),
});

app.on('will-quit', () => {
  // Unregister a shortcut.
  globalShortcut.unregister('CommandOrControl+X');

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});
