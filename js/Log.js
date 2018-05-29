CLog = {
  todo: function(location, message) {
    if (this.dev) {
      console.log("[TODO] Location: " + location + " ==> Message: " + message + "");
    }
  },
  e: function(location, error) {
    console.log("[ERROR] Location: " + location + " ==> Error: ", error);
  },
  catch: function(location, error, printError) {
    printError = printError !== undefined ? printError : false;
    if (this.dev && (!this.hideCaught || printError)) {
      console.log("[ERROR CAUGHT] Location: " + location + " ==> Error: ", error);
    }
  },
  d: function(location, message) {
    if (this.dev) {
      console.log("[DEBUG] Location: " + location + " ==> Message: ", message);
    }
  },
  v: function(message1, message2) {
    if (message2 === undefined) {
      console.log("[VERBOSE]", message1);
    } else {
      console.log("[VERBOSE] " + message1, message2);
    }
  },
  n: function(number) {
    console.log("--------------------------- " + number + " ---------------------------");
  },
  caller: function() {
    console.log(arguments.callee.caller.arguments.callee.caller.toString());
  },
  dev: true,
  hideCaught: false
};
