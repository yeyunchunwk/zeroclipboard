/*
 * Creates a new ZeroClipboard client; optionally, from an element or array of elements.
 *
 * returns the client instance if it's already created
 */
var ZeroClipboard = function (elements) {

  // Ensure the constructor is invoked with the `new` keyword, even if the user forgets it
  if (!(this instanceof ZeroClipboard)) {
    return new ZeroClipboard(elements);
  }

  // Assign an ID to the client instance
  this.id = "" + (clientIdCounter++);

  // Create the meta information store for this client
  _clientMeta[this.id] = {
    instance: this,
    elements: [],
    handlers: {}
  };

  // If the elements argument exists, clip it
  if (elements) {
    this.clip(elements);
  }


  // Setup the Flash <-> JavaScript bridge
  if (typeof flashState.ready !== "boolean") {
    flashState.ready = false;
  }
  if (!ZeroClipboard.isFlashUnusable() && flashState.bridge === null) {
    var _client = this;
    var maxWait = _globalConfig.flashLoadTimeout;
    if (typeof maxWait === "number" && maxWait >= 0) {
      setTimeout(function() {
        // If it took longer the `_globalConfig.flashLoadTimeout` milliseconds to receive
        // a `ready` event, consider Flash "deactivated".
        if (typeof flashState.deactivated !== "boolean") {
          flashState.deactivated = true;
        }
        if (flashState.deactivated === true) {
          ZeroClipboard.emit({ "type": "error", "name": "flash-deactivated", "client": _client });
        }
      }, maxWait);
    }

    // If creating a new `ZeroClipboard` instance, it is safe to ignore the `overdue` status
    flashState.overdue = false;

    // Load the SWF
    _bridge();
  }
};


/*
 * Sends a signal to the Flash object to set the clipboard text.
 *
 * returns object instance
 */
ZeroClipboard.prototype.setText = function (newText) {
  if (newText && newText !== "") {
    _clipData["text/plain"] = newText;
    if (flashState.ready === true && flashState.bridge && typeof flashState.bridge.setText === 'function') {
      flashState.bridge.setText(newText);
    }
    else {
      flashState.ready = false;
    }
  }
  return this;
};


/*
 * Sends a signal to the Flash object to change the stage size/dimensions.
 *
 * returns object instance
 */
ZeroClipboard.prototype.setSize = function (width, height) {
  if (flashState.ready === true && flashState.bridge && typeof flashState.bridge.setSize === 'function') {
    flashState.bridge.setSize(width, height);
  }
  else {
    flashState.ready = false;
  }
  return this;
};


/*
 * @private
 *
 * Sends a signal to the Flash object to display the hand cursor if true.
 * Does NOT update the value of the `forceHandCursor` option.
 *
 * returns nothing
 */
var _setHandCursor = function (enabled) {
  if (flashState.ready === true && flashState.bridge && typeof flashState.bridge.setHandCursor === 'function') {
    flashState.bridge.setHandCursor(enabled);
  }
  else {
    flashState.ready = false;
  }
};


/*
 * Self-destruction and clean up everything for a single client.
 *
 * returns nothing
 */
ZeroClipboard.prototype.destroy = function () {
  // Unclip all the elements
  this.unclip();

  // Remove all event handlers
  this.off();

  // Delete the client's metadata store
  delete _clientMeta[this.id];
};


/*
 * Get all clients.
 *
 * returns array of clients
 */
var _getAllClients = function () {
  var i, len, client,
      clients = [],
      clientIds = _objectKeys(_clientMeta);
  for (i = 0, len = clientIds.length; i < len; i++) {
    client = _clientMeta[clientIds[i]].instance;
    if (client && client instanceof ZeroClipboard) {
      clients.push(client);
    }
  }
  return clients;
};