Users = (function() {
  function Users(params) {

    /* Dependencies */
    var _Constants = params.Constants;

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */
    var _currentUserId = "";
    var _currentUser = "";
    var _currentUserName = "";

    self.get_currentUserId = function() {
      var apiBaseUrl = "/_api/web/CurrentUser?$select=Id";

      $.ajax({
        url: Constants.siteUrl + apiBaseUrl,
        method: "GET",
        headers: {
          "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
          _currentUserId = data.d.Id;
          self.getUser(_currentUserId);
        },
        error: function(data) {
          CLog.e("Users.get_currentUserId", 'request failed ' + data);
        }
      });
    }

    self.getCurrentUsername = function() {
      return _currentUserName;
    }

    self.getCurrentUserId = function() {
      return _currentUserId;
    }

    self.getUser = function(userid) {
      $.ajax({
        url: Constants.siteUrl + "/_api/web/getuserbyid(" + userid + ")",
        method: "GET",
        headers: {
          "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
          _currentUser = data.d;
          _currentUserName = data.d.Title;
        },
        error: function(data) {
          CLog.e("Users.get_currentUserId", 'request failed ' + data);
        }
      });
    }

    self.init = function() {
      self.get_currentUserId();
      self.getCurrentUsername();
    }
  }

  /** @type {Users} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new Users(params);
      }
      return _instance;
    }
  };
})();
