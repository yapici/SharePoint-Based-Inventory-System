Spinner = (function() {
  function Spinner(params) {
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
      spinner: "#spinner"
    }

    var _fadeDuration = 200;

    self.show = function() {
      $(_s.Ids.spinner).fadeIn(_fadeDuration);

    }

    self.hide = function() {
      $(_s.Ids.spinner).fadeOut(_fadeDuration);

    }
  }

  /** @type {Spinner} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new Spinner(params);
      }
      return _instance;
    }
  };
})();
