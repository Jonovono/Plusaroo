const { Tray, Menu, BrowserWindow, app } = require('electron');
const path = require('path');
const querystring = require('querystring');
const Url = require('url');
const log = require('electron-log');

const spotifyApi = require('./spotifyUtil');

const generateNotification = require('./Notification');

const scopes = [
  'user-read-private',
  'user-read-email',
  'user-library-modify',
  'user-library-read',
];

const STATE = '123456';

let authWindow = null;

class SpotifyAuth {
  constructor(store) {
    this.store = store;
  }

  auth() {
    return new Promise((resolve, reject) => {
      authWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: false,
        'node-integration': false,
        'web-security': false,
      });

      const url = spotifyApi.createAuthorizeURL(scopes, STATE);

      authWindow.loadURL(url);
      authWindow.show();

      const handleCallback = (callbackUrl) => {
        if (Url.parse(callbackUrl).query) {
          const q = Url.parse(callbackUrl).query;
          const { code } = querystring.parse(q);
          if (code && code.length > 50) {
            this.getAccessTokens(code);
            authWindow.hide();
            resolve();
          }
        }
      };

      authWindow.webContents.on('will-redirect', (event, url) => {
        handleCallback(url);
      });

      // Reset the authWindow on close
      authWindow.on(
        'close',
        () => {
          authWindow = null;
        },
        false
      );
    });
  }

  getAccessTokens = async (code) => {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const accessToken = data.body.access_token;
    const refreshToken = data.body.refresh_token;

    generateNotification('You are setup with Spotify!');
    app.dock.hide();

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    this.store.set('accessToken', accessToken);
    this.store.set('refreshToken', refreshToken);
  };

  refreshAccessToken = async () => {
    const data = await spotifyApi.refreshAccessToken();
    const accessToken = data.body.access_token;
    spotifyApi.setAccessToken(accessToken);
    this.store.set('accessToken', accessToken);
  };

  checkAccess = async () => {
    const refreshToken = this.store.get('refreshToken');
    spotifyApi.setRefreshToken(refreshToken);

    log.info('Refresh Token', refreshToken);

    if (refreshToken) {
      app.dock.hide();
      await this.refreshAccessToken(refreshToken);
    } else {
      await this.auth();
    }
  };

  initialize = async () => {
    await this.checkAccess();

    setInterval(this.refreshAccessToken, 1000 * 1500);
  };
}

module.exports = SpotifyAuth;
