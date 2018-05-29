Toast = (function() {
  function Toast(params) {

    /* Dependencies */
    var _Constants = params.Constants;
    var _MiscFunctions = params.MiscFunctions;

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */

    var _s = {};
    _s.Ids = {
      toast: "#toast-wrapper"
    }

    var _fadeDuration = _Constants.fadeDuration;

    var _toastWrapper = "";

    var _toastFadeTimeout = "";

    var _shakeInProgress = false;

    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @type {Object}     options
     * @type {String}     options.message       Test to show in toast window
     * @type {String}     [options.duration]    Duration in milliseconds. If duration is not provided, default is 4000 (_Constants.toastLong).
     *                                          Pass '0' to show the toast message indefinitely.
     * @type {Boolean}    [options.shake]       Toast is shaked if true
     * @type {Function}   [options.callback]    Callback function. Called only if duration is duration is not 0.
     */
    self.showToast = function(options) {
      _toastWrapper = $(_s.Ids.toast);
      if ((options !== undefined || !options.message.length) && !_shakeInProgress) {
        options.duration = options.duration !== undefined ? options.duration : _Constants.toastLong;
        options.shake = options.shake !== undefined ? options.shake : false;

        _toastWrapper.html(options.message);
        _toastWrapper.fadeIn(_fadeDuration);

        if (options.shake) {
          _shakeInProgress = true;
          _MiscFunctions.shakeElement(_toastWrapper, function() {
            _shakeInProgress = false;
          });
        }

        clearTimeout(_toastFadeTimeout);
        if (options.duration !== 0) {
          _toastFadeTimeout = setTimeout(
            function() {
              self.hideToast(options.callback);
            }, options.duration);
        }
      }
    }

    /**
     * @type {Function} [callback] Callback function
     */
    self.hideToast = function(callback) {
      _toastWrapper = $(_s.Ids.toast);
      clearTimeout(_toastFadeTimeout);
      _toastWrapper.fadeOut(_fadeDuration, function() {
        _toastWrapper.html("");
        if (callback !== undefined) {
          callback();
        }
      });
    }

    /**
     * @description Getter for gray out div id
     * @return {String} Gray out div id
     */
    self.id = function() {
      return _s.Ids.toast;
    }
  }

  /** @type {Toast} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new Toast(params);
      }
      return _instance;
    }
  };
})();
