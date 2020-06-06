const { Tray, Menu, BrowserWindow } = require('electron');
const { isRunning, getTrack, getState } = require('./SpotifyApplescript');
const spotifyApi = require('./spotifyUtil');
const log = require('electron-log');

const generateNotification = require('./Notification');

class SpotifyPlayer {
  constructor(store, tray) {
    this.store = store;
    this.tray = tray;

    this.track = null;
    this.state = null;
    this.position = null;
  }

  parseTrack = (trackId) => trackId.split(':').splice(-1, 1)[0];

  checkSaved = async (track) => {
    const trackId = this.parseTrack(track);

    try {
      const data = await spotifyApi.containsMySavedTracks([trackId]);
      const isSaved = data.body[0];
      return isSaved;
    } catch (err) {
      return false;
    }
  };

  async saveSong() {
    const isSpotifyRunning = await isRunning();

    if (!isSpotifyRunning) {
      log.info('Error?', isSpotifyRunning);
      generateNotification(
        'Something went wrong',
        'You dont have Spotify running, could not save song'
      );
      return;
    }

    const track = await getTrack();
    if (!track) {
      log.info('Another error?');
      generateNotification('Something went wrong', 'Couldnt save song');
      return;
    }

    const { artist, name, id } = track;

    const isSaved = await this.checkSaved(id);
    if (isSaved) {
      generateNotification('Song already saved');
      return;
    }

    const trackId = this.parseTrack(id);

    try {
      await spotifyApi.addToMySavedTracks([trackId]);
    } catch (error) {
      generateNotification(
        'Something went wrong',
        'Could not save song to Spotify. Please email jordan@howlett.sexy and he will try and fix it.'
      );
    }

    generateNotification('Plusaroo', `${artist}: ${name} => Saved! 🎵`);
    this.tray.setIconLiked();
  }

  setupInitialState = async () => {
    const isSaved = await this.checkSaved(this.track);
    if (isSaved) {
      this.tray.setIconLiked();
    } else {
      this.tray.setIconUnliked();
    }
  };

  songChanged = async () => {
    const isSaved = await this.checkSaved(this.track);
    if (isSaved) {
      this.tray.setIconLiked();
    } else {
      this.tray.setIconUnliked();
    }
  };

  update = async () => {
    const isSpotifyRunning = await isRunning();
    if (!isSpotifyRunning) return;

    const state = await getState();
    if (!state) return;

    const { track_id: trackId, state: trackState, position } = state;

    if (this.track == null) {
      this.track = trackId;
      this.setupInitialState();
    }

    if (this.state == null) {
      this.state = trackState;
    }

    if (this.position == null) {
      this.position = position;
    }

    if (this.state !== trackState) {
      this.state = trackState;
    }

    if (this.track !== trackId) {
      this.track = trackId;
      this.position = position;
      this.songChanged();
    } else if (Math.abs(position - this.position) >= 5) {
      this.position = position;
    }

    this.track = trackId;
    this.state = trackState;
    this.position = position;
  };

  initialize() {
    setInterval(this.update, 1000);
  }
}

module.exports = SpotifyPlayer;
