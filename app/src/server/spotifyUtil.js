const SpotifyWebApi = require('spotify-web-api-node');

const CLIENT_ID = '95001b6e557a48589c5ec44f06d6498b'; // Your client id
const SECRET = 'ac80c4ad37624c54a4cc5c7c29d85ad5'; // Your secret
const REDIRECT_URL = 'http://localhost:8888/callback/'; // Your redirect uri

const spotifyApi = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: SECRET,
  redirectUri: REDIRECT_URL,
});

module.exports = spotifyApi;
