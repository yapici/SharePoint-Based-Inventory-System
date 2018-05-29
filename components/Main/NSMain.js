NSMain = (function() {
  var instance = {};

  instance.constructor = null;

  /** @type {Constants} */
  instance.Constants = {};

  /** @type {MiscFunctions} */
  instance.MiscFunctions = {};

  /** @type {Toast} */
  instance.Toast = {};

  /** @type {Spinner} */
  instance.Spinner = {};

  /** @type {GrayOut} */
  instance.GrayOut = {};

  /** @type {BlockUI} */
  instance.BlockUI = {};

  /** @type {PopupWindow} */
  instance.PopupWindow = {};

  /** @type {Users} */
  instance.Users = {};

  /** @type {WindowLoad} */
  instance.WindowLoad = {};

  instance.init = function() {
    instance.Constants = Constants;
    instance.MiscFunctions = MiscFunctions;
    instance.Toast = Toast.getInstance(instance);
    instance.Spinner = Spinner.getInstance(instance);
    instance.GrayOut = GrayOut.getInstance(instance);
    instance.BlockUI = BlockUI.getInstance(instance);
    instance.PopupWindow = PopupWindow.getInstance(instance);
    instance.Users = Users.getInstance(instance);
    instance.WindowLoad = WindowLoad.getInstance(instance);
  }

  return instance;
})();
