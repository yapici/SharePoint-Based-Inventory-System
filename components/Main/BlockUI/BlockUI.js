BlockUI = (function() {
  function BlockUI(params) {

    /* Dependencies */
    var _Spinner = params.Spinner;
    var _GrayOut = params.GrayOut;

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */

    var _hideDelay = 0;

    /**
     * @param  {Number} [minDuration] Minimum duration to show the spinner, in milliseconds.
     *                                It is shown indefinitely by default.
     */
    self.block = function(minDuration) {
      if (minDuration !== undefined) {
        _hideDelay = minDuration;
        setTimeout(function() {
          _hideDelay = 0;
        }, minDuration);
      }
      _Spinner.show();
      _GrayOut.showGrayOut();
    }

    self.unblock = function() {
      setTimeout(function() {
        _Spinner.hide();
        _GrayOut.hideGrayOut();
      }, _hideDelay);
    }
  }

  /** @type {BlockUI} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new BlockUI(params);
      }
      return _instance;
    }
  };
})();
