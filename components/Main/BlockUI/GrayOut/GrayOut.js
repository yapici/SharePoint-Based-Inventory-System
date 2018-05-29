GrayOut = (function() {
  function GrayOut(params) {

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
      grayOut: "#gray-out-div"
    }

    var _fadeDuration = 200;
    var _keepVisible = false;

    self.showGrayOut = function(status) {
      if (status === true) {
        _keepVisible = status;
      }
      $(_s.Ids.grayOut).fadeIn(_fadeDuration);
    }

    self.hideGrayOut = function() {
      if (!_keepVisible) {
        $(_s.Ids.grayOut).fadeOut(_fadeDuration);
      }
    }

    self.keepVisible = function(status) {
      _keepVisible = status;
    }

    /**
     * @description Getter for gray out div id
     * @return {String} Gray out div id
     */
    self.id = function() {
      return _s.Ids.grayOut.substr(1);
    }
  }

  /** @type {GrayOut} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new GrayOut(params);
      }
      return _instance;
    }
  };
})();
