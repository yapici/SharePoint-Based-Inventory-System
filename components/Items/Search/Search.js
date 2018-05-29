Search = (function() {
  function Search(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _MiscFunctions = NSMain.MiscFunctions;
    var _NewItem = params.NewItem;
    var _InventoryTable = params.InventoryTable;
    var _s = clone(params.settings); // Do not use direct assignment, as it causes the original object (i.e. NSItems.settings) to change when anything changes in _s.

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */

    _s.Ids = {
      searchInput: "#search-input",
      searchGrayOut: "#search-elements-grayout",
      searchButton: "#search-button",
      searchCancelButton: "#search-cancel-button",
      checkboxHolder: "#search-checkbox-holder",
      createdCheckbox: "#search-created-checkbox",
      modifiedCheckbox: "#search-modified-checkbox"
    }

    var _searchFields = _s.fields;

    var _searchGrayOut = "";
    var _searchInput = "";
    var _searchCancelButton = "";

    var _searchInputKeywords = "";

    // Date search flags in created and modified fields
    var _searchCreatedDate = false;
    var _searchModifiedDate = false;
    var _datePresent = false;

    var _searchQuery = "(Deleted eq 0)";

    var _showDeleted = false;


    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    var _listeners = {
      searchInputKeyPressListener: function() {
        $("body").on("keyup", _s.Ids.searchInput, function(e) {
          if (e.keyCode == 13) { // Enter key
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
            search(_searchInput.val());
            return false;
          }
        });
      },
      searchButtonClickListener: function() {
        $("body").on("click", _s.Ids.searchButton, function() {
          search(_searchInput.val());
        });
      },
      searchCancelClickListener: function() {
        $("body").on("click", _s.Ids.searchCancelButton, function() {
          if (_showDeleted) {
            _searchQuery = "((Deleted eq 1) or (Deleted eq 0))";
          } else {
            _searchQuery = "(Deleted eq 0)";
          }
          _InventoryTable.populateTable({
            callback: function() {
              _searchInput.val("");
              hideCheckboxes();
              _searchCancelButton.fadeOut(200);
            }
          });
        });
      },
      searchInputBlurListener: function() {
        $("body").on("blur", _s.Ids.searchInput, function(e) {
          if ((_searchQuery !== "" || _searchQuery !== "(Deleted eq 0)") && _searchInput.val() == "") {
            setInputValue(_searchInputKeywords);
          }
        });
      },
      searchCheckboxListener: function() {
        $(document).on("change", _s.Ids.createdCheckbox, function(e) {
          if ($(_s.Ids.checkboxHolder).is(":visible")) {
            if ($(this).is(':checked')) {
              _searchCreatedDate = true;
            } else {
              _searchCreatedDate = false;
            }
            search(_searchInput.val());
          }
        });
        $(document).on("change", _s.Ids.modifiedCheckbox, function(e) {
          if ($(_s.Ids.checkboxHolder).is(":visible")) {
            if ($(this).is(':checked')) {
              _searchModifiedDate = true;
            } else {
              _searchModifiedDate = false;
            }
            search(_searchInput.val());
          }
        });
      },
      init: function() {
        this.searchInputKeyPressListener();
        this.searchButtonClickListener();
        this.searchCancelClickListener();
        this.searchInputBlurListener();
        this.searchCheckboxListener();
      }
    }

    function search(keywords) {
      _datePresent = false;
      if (keywords !== undefined && keywords !== "") {

        var queryString = "(";
        if (keywords.toLowerCase() === "deleted" || keywords.toLowerCase() === "\"show deleted\"") {
          queryString += "Deleted eq 1)";

          _InventoryTable.populateTable({
            searchQuery: queryString,
            callback: function() {
              _searchCancelButton.fadeIn(200);
              _searchQuery = queryString;
              _searchInputKeywords = keywords;
            }
          });
        } else {
          /**
           * Below regular expression in match method splits the string into keywords using spaces, but it keeps the keywords wrapped in double quotes together.
           * In other words, it doesn't split the words within double quotes if there are spaces in between them. For example:
           *      var string = 'aaa "23 Mar 2018" 23' is split into this array: ["aaa", ""23 Mar 2018"", "23"]
           * Reference: https://stackoverflow.com/a/16261693/1004334
           */
          var keywordsArray = keywords.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g);

          if (!(keywordsArray.contains("deleted") || keywordsArray.contains("Deleted") || keywordsArray.contains("DELETED") ||
              keywordsArray.contains("\"show deleted\"") || keywordsArray.contains("\"Show Deleted\"") || keywordsArray.contains("\"Show deleted\"") || keywordsArray.contains("\"SHOW DELETED\""))) {
            queryString += "(Deleted eq 0) and ";
          }

          var numOfKeywords = keywordsArray.length;
          var numOfFields = _searchFields.length;

          for (var i = 0; i < numOfKeywords; i++) {
            keywordsArray[i] = keywordsArray[i].replace(/"/g, ""); // Replacing the quotes flanking the keyword (if present)

            if (keywordsArray[i].toLowerCase() === "deleted" || keywordsArray[i].toLowerCase() === "show deleted" || _showDeleted) {
              queryString += "((Deleted eq 1) or (Deleted eq 0)) or ";
            }

            queryString += "(";

            for (var j = 0; j < numOfFields; j++) {
              if (_searchFields[j].contains("date") && _MiscFunctions.isDate(keywordsArray[i])) {
                queryString += self.prepareDateQuery(keywordsArray[i], _searchFields[j]);
                if (_searchCreatedDate) {
                  queryString += self.prepareDateQuery(keywordsArray[i], "Created");
                }
                if (_searchModifiedDate) {
                  queryString += self.prepareDateQuery(keywordsArray[i], "Created");
                }
              } else {
                queryString += "(substringof('" + keywordsArray[i] + "'," + _searchFields[j] + ")) or ";
              }
            }

            queryString = queryString.slice(0, -4); // Removing the extra ' or ' at the end
            queryString += ") and ";
          }

          queryString = queryString.slice(0, -5); // Removing the extra ' and ' at the end
          queryString += ")";
          _searchQuery = queryString;

          _InventoryTable.populateTable({
            searchQuery: queryString,
            callback: function() {
              _searchCancelButton.fadeIn(200);
              _searchQuery = queryString;
              _searchInputKeywords = keywords;

              if (_datePresent) {
                showCheckboxes();
              } else {
                hideCheckboxes();
              }
            }
          });
        }
      } else {
        _InventoryTable.populateTable({
          searchQuery: "",
          callback: function() {
            if (_showDeleted) {
              _searchQuery = "((Deleted eq 1) or (Deleted eq 0))";
            } else {
              _searchQuery = "(Deleted eq 0)";
            }
            _searchInputKeywords = "";
            _searchCancelButton.fadeOut(200);
          }
        });
      }
    }

    function showCheckboxes() {
      $(_s.Ids.checkboxHolder).fadeIn(_Constants.fadeDuration);
    }

    function hideCheckboxes() {
      $(_s.Ids.checkboxHolder).fadeOut(_Constants.fadeDuration)
        .promise().done(function() {
          $(_s.Ids.checkboxHolder).find('input:checkbox').prop('checked', false);
        });
      _searchCreatedDate = false;
      _searchModifiedDate = false;
    }

    function setInputValue(value) {
      _searchInput.val(value);
    }


    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @param  {String} [message] Message to be shown if user tries to interact with disabled search
     */
    self.disable = function(message) {
      if (message !== undefined) {
        _searchGrayOut.attr("data-balloon", message);
      }
      _searchGrayOut.fadeIn(200);
    }

    self.enable = function() {
      _searchGrayOut.removeAttr("data-balloon");
      _searchGrayOut.fadeOut(200);
    }

    /**
     * @description Getter for search query string
     * @return {String} Search query string
     */
    self.queryString = function() {
      return _searchQuery;
    }

    self.prepareDateQuery = function(dateString, fieldName) {
      var queryString = "";
      var date = new Date(dateString).fixUTCDateOffset();

      // Getting the details of the entered date
      // If only year is entered, month will be 0 (i.e. Jan), and day will be 1
      // If only month and year is entered, day will be 1
      var day = date.getDate().toString();
      var month = date.getMonth().toString();
      var year = date.getFullYear().toString();

      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        var stringGMTDate = day + " " + date.getMonthNameShort() + " " + year + " 00:00:00 GMT-0000";

        date = new Date(stringGMTDate);

        var dateStart = new Date(stringGMTDate).toISOString();

        var dateEnd = date.addDays(365).toISOString();

        if (day != 1) { // A day value was entered in search box by user. E.g. "03 Mar 2018"
          dateEnd = date.addDays(1).toISOString();
        } else if ((month != 0 && day == 1) || (month == 0 && day != 1)) { // Month was entered by user, but not a day. E.g. "Mar 2018"
          dateEnd = date.addDays(_MiscFunctions.daysInMonth(month + 1, year)).toISOString();
        }

        // Reference for SP date filtering: https://sharepoint.stackexchange.com/a/100995/74927
        queryString += "(";
        queryString += "(" + fieldName + " ge datetime'" + dateStart + "') and ";
        queryString += "(" + fieldName + " lt datetime'" + dateEnd + "')";
        queryString += ") or ";

        _datePresent = true;
      }

      return queryString;
    }

    self.showDeleted = function(value) {
      if (value !== undefined) {
        _showDeleted = value;
        if (_showDeleted) {
          _searchQuery = "((Deleted eq 1) or (Deleted eq 0))";
          _searchInputKeywords = "";
          setInputValue("");
          hideCheckboxes();
          _searchCancelButton.fadeOut(200);
        } else {
          _searchQuery = "(Deleted eq 0)";
          _searchInputKeywords = "";
          setInputValue("");
          hideCheckboxes();
          _searchCancelButton.fadeOut(200);
        }
      } else {
        return _showDeleted;
      }
    }

    /**
     * @description     Used to handle the circular dependencies by loading the dependencies after
     *                  initial creation of an object.
     *
     *                  A single parameter must be passed as an object literal. For example:
     *
     *                      {Items: Items}
     *
     *                  If Items and Search have circular dependencies with each other,
     *                  "solveCircularDependencies" method should be called as below to solve
     *                  the circular dependency:
     *
     *                      Search.solveCircularDependencies({
     *                          Items: Items
     *                      });
     *
     *                  this is assuming the Items object was created before Search object. If it
     *                  is the other way around, then the method should be called from Items object:
     *
     *                      Items.solveCircularDependencies({
     *                          Search: Search
     *                      });
     *
     *                  If there is more than one circular dependency, each dependent object
     *                  should be added as an item in the object literal parameter:
     *
     *                      Search.solveCircularDependencies({
     *                          Items: Items,
     *                          Users: Users
     *                      });
     *
     */
    self.solveCircularDependencies = function() {
      var parameters = arguments[0];

      var variableName, value, property;

      /*
       * Below functions are used to set the local (private) variables, which have circular dependencies,
       * in the parent object. These functions are not intended to be used anywhere other than here,
       * therefore they are set to null once called.
       */
      self.setNewItem = function(obj) {
        _NewItem = obj;
        self.setNewItem = null;
      };

      self.setInventoryTable = function(obj) {
        _InventoryTable = obj;
        self.InventoryTable = null;
      };

      for (property in parameters) {
        if (parameters.hasOwnProperty(property)) {
          variableName = "set" + property;
          value = parameters[property];

          try {
            run();
          } catch (e) {
            CLog.e("Search.solveCircularDependencies", e);
          }
        }
      }

      function run() {
        self[variableName](value);
      }
    };

    self.init = function() {
      _listeners.init();
      _searchGrayOut = $(_s.Ids.searchGrayOut);
      _searchInput = $(_s.Ids.searchInput);
      _searchCancelButton = $(_s.Ids.searchCancelButton);
    }
  }

  /** @type {Search} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new Search(params);
      }
      return _instance;
    }
  };
})();
