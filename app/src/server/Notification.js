const { Notification } = require('electron');

function generateNotification(title, body) {
  new Notification({
    body,
    title,
    silent: true,
  }).show();
}

module.exports = generateNotification;
