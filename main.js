// const {app, Menu, Tray} = require('electron')

const electron       = require('electron');
const app            = electron.app;
const Tray           = electron.Tray;
const Menu           = electron.Menu;
const ipcMain        = electron.ipcMain
const BrowserWindow  = electron.BrowserWindow;
const globalShortcut = electron.globalShortcut
const spotify = require("spotify-node-applescript");
const applescript    = require('applescript');
// const server = require('./server')

const Player = require('./player');

const low            = require('lowdb')
const storage        = require('lowdb/lib/file-sync')
const db             = low(__dirname + '/db.json', { storage })

const RapidAPI = require('rapidapi-connect');
const rapid = new RapidAPI("Plusaroo", "1eb73c40-dbed-49f4-bfef-0c8d2f9c6ab7");

const SpotifyWebApi  = require('spotify-web-api-node');

const path = require('path')
const Url            = require('url')
const querystring = require('querystring');


const CLIENT_ID = '95001b6e557a48589c5ec44f06d6498b'; // Your client id
const SECRET = 'ac80c4ad37624c54a4cc5c7c29d85ad5'; // Your secret
const REDIRECT_URL = 'http://localhost:8888/callback/'; // Your redirect uri
const SCOPE = 'user-read-private user-read-email user-library-modify user-library-read';
const STATE                 = '123'

var access_token = ''

const spotifyApi = new SpotifyWebApi({
  clientId     : CLIENT_ID,
  clientSecret : SECRET,
  redirectUri  : REDIRECT_URL
});

let tray = null
var player = null

const initial = () => {
  setInterval(refresh, 1000 * 3500)
}

app.on('ready', () => {
  app.dock.hide();

  checkAccess()

  player = new Player()
  player.update()

  process.on("song-changed", songChanged);
  process.on("got-track", checkSaved);

  const ret = globalShortcut.register('Command+Shift+P', saveSong);

  const iconPath = path.join(__dirname, 'public/assets/plus.png')
  tray = new Tray(iconPath)  
  tray.setToolTip('Plusaroo Spotify Songs')

  tray.on('click', saveSong)
  tray.on('right-click', showMenu)
})

const parseTrack = (trackId) => {
  return trackId.split(':').splice(-1, 1)[0]
}

const currentTrack = (cb) => {
  spotify.getTrack(function(err, track) {
    if (err) return cb(err, null) 
      return cb(null, track)
  });
}

const saveSongToSpotify = (track) => {
  var track = parseTrack(track)

  rapid.call('SpotifyUserAPI', 'saveTrack', { 
    'access_token': access_token,
    'id': track
 
  }).on('success', (payload)=>{
    console.log(payload)
     /*YOUR CODE GOES HERE*/ 
  }).on('error', (payload)=>{
    console.log("ERR saving")
     /*YOUR CODE GOES HERE*/ 
  });
}

const saveSong = () => {
  spotify.getTrack(function(err, track) {
    if (!err) {
      var artist = track.artist;
      var name = track.name;
      var id = track.id

      console.log(artist, ' ', name)
      notification(artist, name)

      saveSongToSpotify(id)

      changeIcon(true)

      const refreshSpotifyApplescript = path.join(__dirname, 'refreshSpotify.applescript')
      applescript.execFile(refreshSpotifyApplescript)
    }
  });
}

const closeApp = () => {
  app.quit()
}

const showMenu = () => {
  const contextMenu = Menu.buildFromTemplate([
    {label: 'Settings', checked: false},
    {label: 'Quit', checked: false, click: closeApp}
  ])

  tray.popUpContextMenu(contextMenu)
}

const changeIcon = (saved) => {
  const savedIconPath = path.join(__dirname, 'public/assets/check.png')
  const notSavedIconPath = path.join(__dirname, 'public/assets/plus.png')

  if (saved) {
    tray.setImage(savedIconPath)
  } else {
    tray.setImage(notSavedIconPath)
  }
}

const checkSaved = (track) => {
  var track = parseTrack(track)

  rapid.call('SpotifyUserAPI', 'checkSavedTrack', { 
    'access_token': access_token,
    'id': track
 
  }).on('success', (payload)=>{
    var saved = payload[0];

    changeIcon(saved)

     /*YOUR CODE GOES HERE*/ 
  }).on('error', (payload)=>{
    console.log(payload)
     /*YOUR CODE GOES HERE*/ 
  });
}

const songChanged = (track, position) => {
  console.log('song change', track, position)

  checkSaved(track)
}

const checkAccess = () => {
  return new Promise((resolve, reject) => {
    const refresh_token = db.get('refresh_token').value();
    
    if (refresh_token) {
      refreshAccessToken(refresh_token)
    } else {
      return getSpotifyCode()
    }

    resolve()
  })
}

const refresh = () => {
  const refresh_token = db.get('refresh_token').value();

  refreshAccessToken(refresh_token)
}

const refreshAccessToken = (refresh_token) => {
  rapid.call('SpotifyUserAPI', 'refreshAccessToken', { 
    'client_id': CLIENT_ID,
    'client_key': SECRET,
    'refresh_token': refresh_token
   
  }).on('success', (payload)=>{
    access_token = payload.access_token;

    console.log(access_token)
    spotifyApi.setAccessToken(access_token);
  }).on('error', (payload)=>{
    console.log('ERROR2')
  });
}

const getAccessTokens = (code) => {
  console.log('hene')
  rapid.call('SpotifyUserAPI', 'getAccessToken', { 
    'client_id': CLIENT_ID,
    'client_key': SECRET,
    'code': code,
    'redirect_uri': REDIRECT_URL
   
  }).on('success', (payload)=>{
    access_token = payload.access_token;
    var refresh_token = payload.refresh_token;

    spotifyApi.setAccessToken(access_token);

    const state = {
      access_token: access_token,
      refresh_token: refresh_token
    }

    db.setState(state)

    console.log(access_token, refresh_token)
  }).on('error', (payload)=>{
    console.log('ERROR')
  });
}


/* ------------------------ Initial app ----------------------------- */
const getSpotifyCode = () => {
  console.log('get code')
  return new Promise((resolve, reject) => {
    var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false });

    var url = 'https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: CLIENT_ID,
        scope: SCOPE,
        redirect_uri: REDIRECT_URL,
        state: STATE
      });

    authWindow.loadURL(url)
    authWindow.show();

    authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
      handleCallback(newUrl);
    });

    function handleCallback (url) {
      console.log('URL ', url)
      console.log('')
      if (Url.parse(url).query) {
        var q  = Url.parse(url).query
        code = querystring.parse(q).code;
        if (code && code.length > 50) {
          getAccessTokens(code)
          authWindow.hide();
          resolve();
        }
      }
    }

    // Reset the authWindow on close
    authWindow.on('close', () => {
        authWindow = null;
    }, false)
  })
}


function notification (artist, song) {
  var together = artist + ' ' + song;
  // return new Promise((resolve, reject) => {
    var script = '';

    script = `display notification "😙 ${together} => Saved Track 🎵"  with title "Plusaroo"
    delay 1`

    applescript.execString(script, (err, rtn) => {
      if (err) {
        console.log(err)
        // reject(err)
      }
      // resolve(data)
    });
  // })
}