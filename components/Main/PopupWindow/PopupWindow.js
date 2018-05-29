PopupWindow = (function() {
  function PopupWindow(params) {

    /* Dependencies */
    var _Constants = params.Constants;
    var _GrayOut = params.GrayOut;

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */
    var _fadeDuration = _Constants.fadeDuration;

    var _s = {};
    _s.Ids = {
      popupWindow: "#popup-window",
      mainWrapper: "#popup-window-main-content-wrapper",
      closeButton: "#close-popup-button",
      title: "#popup-window-title"
    }

    var _popupWindow;

    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    var _listeners = {
      closePopupWindowButtonClickListener: function() {
        $("body").on("click", _s.Ids.popupWindow + " " + _s.Ids.closeButton, function(e) {
          self.hide();
        });
      },
      closePopupWindowListener: function() {
        $("body").on("click", function(e) {
          if (e.target.id === _GrayOut.id() &&
            $(_s.Ids.popupWindow).is(":visible")) {
            self.hide();
          }
        });
      },
      init: function() {
        this.closePopupWindowButtonClickListener();
        this.closePopupWindowListener();
      }
    }


    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @param  {String}   options.content     HTML content to be placed inside the popup window
     * @param  {String}   options.title     Popup window title
     * @param  {Number}   [options.width]     Width of the popup window in percentage. Default is 70% of the window width
     * @param  {Number}   [options.height]    Width of the popup window in percentage. Default is 60% of the window height
     */
    self.show = function(options) {
      _popupWindow = $(_s.Ids.popupWindow);

      if (options !== undefined && options.content !== "" && options.content !== undefined) {
        options.title = options.title !== undefined ? options.title : "Popup Window";

        $(_s.Ids.mainWrapper).html(options.content);
        $(_s.Ids.title).html(options.title);

        if (options.width !== undefined) {
          _popupWindow.css("width", options.width + "vw");
          _popupWindow.css("left", (100 - options.width) / 2 + "vw");
        }

        if (options.height !== undefined) {
          _popupWindow.css("height", options.height + "vh");
          _popupWindow.css("top", (100 - options.height) / 3 + "vh");
        }

        _popupWindow.fadeIn(_fadeDuration);
        _GrayOut.showGrayOut(true);
      }
    }

    self.hide = function() {
      _popupWindow.fadeOut(_fadeDuration).promise().done(function() {
        $(_s.Ids.mainWrapper).html("");
      });
      _GrayOut.keepVisible(false);
      _GrayOut.hideGrayOut();
    }

    self.isVisible = function() {
      _popupWindow = $(_s.Ids.popupWindow);
      return _popupWindow.is(":visible");
    }

    init();

    function init() {
      _listeners.init();
    }
  }

  /** @type {PopupWindow} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new PopupWindow(params);
      }
      return _instance;
    }
  };
})();
