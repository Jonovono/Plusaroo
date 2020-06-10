const { Tray, Menu, Notification } = require('electron');
const path = require('path');

const unlikedAsset = path.join(__dirname, './assets/unlikedblackTemplate.png');
const likedAsset = path.join(__dirname, './assets/liked.png');

class TrayGenerator {
  constructor(mainWindow, store) {
    this.tray = null;
    this.store = store;
    this.mainWindow = mainWindow;
  }

  getWindowPosition = () => {
    const windowBounds = this.mainWindow.getBounds();
    const trayBounds = this.tray.getBounds();
    const x = Math.round(
      trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2
    );
    const y = Math.round(trayBounds.y + trayBounds.height);
    return { x, y };
  };

  showWindow = () => {
    const position = this.getWindowPosition();
    this.mainWindow.setPosition(position.x, position.y, false);
    this.mainWindow.show();
    this.mainWindow.setVisibleOnAllWorkspaces(true);
    this.mainWindow.focus();
    this.mainWindow.setVisibleOnAllWorkspaces(false);
  };

  setIconLiked = () => this.tray.setImage(likedAsset);

  setIconUnliked = () => this.tray.setImage(unlikedAsset);

  rightClickMenu = () => {
    const menu = [
      {
        label: 'CTRL + OPTION + P to Save',
      },
      {
        label: 'Launch at startup',
        type: 'checkbox',
        checked: this.store.get('launchAtStart'),
        click: (event) => this.store.set('launchAtStart', event.checked),
      },
      {
        role: 'quit',
        accelerator: 'Command+Q',
      },
    ];
    this.tray.popUpContextMenu(Menu.buildFromTemplate(menu));
  };

  createTray = () => {
    this.tray = new Tray(unlikedAsset);
    this.tray.setIgnoreDoubleClickEvents(true);
    this.tray.setToolTip('Like Spotify Songs Easily');
    this.tray.on('right-click', this.rightClickMenu);

    return this.tray;
  };
}

module.exports = TrayGenerator;
