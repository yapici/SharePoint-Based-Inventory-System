WindowLoad = (function() {
  function WindowLoad(params) {

    /* Dependencies */
    var _Toast = params.Toast;
    var _MiscFunctions = params.MiscFunctions;

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */

    self.webPartsLoaded = function(callback) {
      var currentCall = 0;
      var loadedInterval = setInterval(function() {
        currentCall++;
        if ($(_Toast.id()).length) {
          clearInterval(loadedInterval);
          callback();
        } else if (currentCall === 100) {
          clearInterval(loadedInterval);
          alert("Oops, something went wrong.</br>Please try refreshing page or clearing your browser caches. If that doesn't resolve the issue, please contact your system administrator.");
        }
      }, 200);
    }
  }

  /** @type {WindowLoad} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new WindowLoad(params);
      }
      return _instance;
    }
  };
})();
