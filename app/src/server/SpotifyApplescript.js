const applescript = require('applescript');
const path = require('path');
const log = require('electron-log');

const getTrackApplescriptPath = path.join(
  __dirname,
  './assets/scripts/get_track.applescript'
);

// const getStateApplescriptPath = path.join(
//   __dirname,
//   './assets/scripts/get_state.applescript'
// );
const IS_RUNNING_COMMAND = 'get running of application "Spotify"';

const GET_STATE_COMMAND = `
tell application "Spotify"
  set cstate to "{"
  set cstate to cstate & "'track_id': '" & current track's id & "'"
  set cstate to cstate & ",'volume': " & sound volume
  set cstate to cstate & ",'position': " & (player position as integer)
  set cstate to cstate & ",'state': '" & player state & "'"
  set cstate to cstate & "}"

  return cstate
end tell
`;

const GET_TRACK_COMMAND = `
on escape_quotes(string_to_escape)
  set AppleScript's text item delimiters to the "\\""
  set the item_list to every text item of string_to_escape
  set AppleScript's text item delimiters to the "\\\\\\""
  set string_to_escape to the item_list as string
  set AppleScript's text item delimiters to ""
  return string_to_escape
end escape_quotes

tell application "Spotify"
  set ctrack to "{"
  set ctrack to ctrack & "\\"artist\\": \\"" & my escape_quotes(current track's artist) & "\\""
  set ctrack to ctrack & ",\\"id\\": \\"" & current track's id & "\\""
  set ctrack to ctrack & ",\\"name\\": \\"" & my escape_quotes(current track's name) & "\\""
  set ctrack to ctrack & "}"
end tell
`;

function isRunning() {
  return new Promise((resolve, reject) => {
    applescript.execString(IS_RUNNING_COMMAND, (err, res) => {
      if (err) {
        resolve(false);
        return;
      }

      resolve(res === 'true');
    });
  });
}

function getTrack() {
  return new Promise((resolve, reject) => {
    applescript.execString(GET_TRACK_COMMAND, (err, res) => {
      log.info('Get Track', err, res);
      if (err) {
        resolve(null);
        return;
      }

      // const resGood = res.replace(/'/g, '"');
      const result = JSON.parse(res);
      resolve(result);
    });
  });
}

function getState() {
  return new Promise((resolve, reject) => {
    applescript.execString(GET_STATE_COMMAND, (err, res) => {
      if (err) {
        resolve(null);
        return;
      }

      const resGood = res.replace(/'/g, '"');

      const result = JSON.parse(resGood);
      resolve(result);
    });
  });
}

module.exports = {
  isRunning,
  getTrack,
  getState,
};
