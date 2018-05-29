Filter = (function() {
  function Filter(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _MiscFunctions = NSMain.MiscFunctions;
    var _Toast = NSMain.Toast;
    var _InventoryTable = params.InventoryTable;
    var _Search = params.Search;
    var _s = clone(params.settings); // Do not use direct assignment, as it causes the original object (i.e. NSItems.settings) to change when anything changes in _s.

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */

    var _fields = _s.fields;

    _s.Ids = {
      filterIcon: ".filter-icon",
      filterPopup: ".filter-popup",
      filterPopupHolderTr: "#filter-popup-holder-tr",
      opaque: ".opaque",
      applyFilterButton: ".apply-filter-button",
      clearFilterButton: ".clear-filter-button",
      showDeletedItemsCheckboxHolder: "#show-deleted-items-checkbox-holder",
      showDeletedItemsCheckbox: "#show-deleted-items-checkbox"
    }

    // jQuery object for inventory table thead
    _s.thead = {}; // Initialized in init function

    var _savedFields = [];
    var _savedValues = {};

    var _popupVisible = false;
    var _currentPopup = "";
    var _lastApplyClickedField = "";

    var _query = "";

    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/


    var _listeners = {
      filterClickListener: function() {
        $("body").on("click", _s.Ids.filterIcon, function(e) {
          var clickedFilterFieldName = $(this).closest("th").attr("field-name");
          prepareFilterIcons();

          if (_currentPopup === clickedFilterFieldName) {
            _popup.hide(clickedFilterFieldName);
          } else {
            _popup.show(clickedFilterFieldName);
            $(this).addClass(_s.Ids.opaque.slice(1));
          }
        });
      },
      filterCheckboxChangeListener: function() {
        $(document).on("change", _s.Ids.filterPopup + " input[type='checkbox']:not(" + _s.Ids.showDeletedItemsCheckbox + ")", function(e) {
          _Toast.showToast({
            message: "Click 'Apply' to filter",
            duration: 0
          });
        });
      },
      clearFilterButtonClickListener: function() {
        $("body").on("click", _s.Ids.clearFilterButton, function(e) {
          var clickedFilterFieldName = $(this).closest(_s.Ids.filterPopup).attr("field-name");
          _lastApplyClickedField = "";
          _checkboxes.clear(clickedFilterFieldName);
        });
      },
      applyFilterButtonClickListener: function() {
        $("body").on("click", _s.Ids.applyFilterButton, function(e) {
          var clickedFilterFieldName = $(this).closest(_s.Ids.filterPopup).attr("field-name");
          _lastApplyClickedField = clickedFilterFieldName;
          _checkboxes.getCheckedItems(clickedFilterFieldName);
        });
      },
      bodyClickListener: function() {
        $("body").on("click", function(e) {
          var classList = e.target.className.split(" ");
          if (!classList.contains(_s.Ids.filterPopup.slice(1)) &&
            !classList.contains(_s.Ids.filterIcon.slice(1)) &&
            !($(e.target).closest(_s.Ids.filterPopup).length > 0) &&
            $(_s.Ids.filterPopup).is(":visible")) {
            _popup.hideAll();
            prepareFilterIcons();
          }
        });
      },
      showDeletedItemsCheckboxListener: function() {
        $(document).on("change", _s.Ids.showDeletedItemsCheckbox, function(e) {
          if ($(this).is(":checked")) {
            _Search.showDeleted(true);
          } else {
            _Search.showDeleted(false);
          }
          _InventoryTable.populateTable();
        });
      },
      init: function() {
        this.filterClickListener();
        this.filterCheckboxChangeListener();
        this.clearFilterButtonClickListener();
        this.applyFilterButtonClickListener();
        this.bodyClickListener();
        this.showDeletedItemsCheckboxListener();
      }
    }

    var _popup = {
      show: function(fieldName) {
        $(_s.Ids.filterPopupHolderTr).find(_s.Ids.filterPopup).fadeOut(_Constants.fadeDuration);
        $(_s.Ids.filterPopupHolderTr).find(_s.Ids.filterPopup + "[field-name='" + fieldName + "']").fadeIn(_Constants.fadeDuration)
          .promise().done(function() {
            _currentPopup = fieldName;
            _popupVisible = true;

            if (_currentPopup.toLowerCase() === "id") {
              if (_Search.showDeleted()) {
                $(_s.Ids.showDeletedItemsCheckbox).attr("checked", true);
              }
            }
          });
      },
      hide: function(fieldName) {
        $(_s.Ids.filterPopupHolderTr).find(_s.Ids.filterPopup + "[field-name='" + fieldName + "']").fadeOut(_Constants.fadeDuration).promise().done(function() {
          _currentPopup = "";
          _popupVisible = false;
        });
        _Toast.hideToast();
      },
      hideAll: function() {
        $(_s.Ids.filterPopupHolderTr).find(_s.Ids.filterPopup).fadeOut(_Constants.fadeDuration).promise().done(function() {
          _currentPopup = "";
          _popupVisible = false;
        });
        _Toast.hideToast();
      }
    }

    var _checkboxes = {
      prepare: function(value) {
        var html = "<div class='pretty p-default p-curve' title='" + value + "'>";
        html += "<input type='checkbox' filter-value='" + value + "'>";
        html += "<div class='state p-primary-o'>";
        html += "<label>" + value + "</label>";
        html += "</div>";
        html += "</div>";

        return html;
      },
      check: function() {
        var numOfFields = _savedFields.length;

        for (var i = 0; i < numOfFields; i++) {
          var fieldName = _savedFields[i];
          var values = _savedValues[fieldName];

          for (var key in values) {
            if (!values.hasOwnProperty(key))
              continue;
            $(document).find(_s.Ids.filterPopup + "[field-name='" + fieldName + "']").find("input[filter-value='" + values[key] + "']").prop("checked", true);;
          }
        }
      },
      clear: function(fieldName) {
        $(_s.Ids.filterPopup + "[field-name='" + fieldName + "']").find("input[type='checkbox']:not(" + _s.Ids.showDeletedItemsCheckbox + ")").prop('checked', false);
        _savedValues[fieldName] = [];
        _savedFields.remove(fieldName);
        _checkboxes.getCheckedItems(fieldName);
      },
      getCheckedItems: function(fieldName) {
        if (_savedValues[fieldName] === undefined) {
          _savedValues[fieldName] = [];
        }

        $(document).find(_s.Ids.filterPopup + "[field-name='" + fieldName + "']").find("input[type='checkbox']:not(" + _s.Ids.showDeletedItemsCheckbox + ")").each(function() {
          var value = $(this).attr('filter-value');
          var index = _savedValues[fieldName].indexOf(value);

          if ($(this).is(":checked") && !(index > -1)) {
            _savedValues[fieldName].push(value); // If checked, it is added into the values list
          } else if (!$(this).is(":checked") && index > -1) {
            _savedValues[fieldName].remove(value);
          }
        });

        if (_savedValues[fieldName].length === 0) {
          delete _savedValues[fieldName];
          _savedFields.remove(fieldName);
        } else {
          _savedFields.push(fieldName);
        }

        prepareFilterIcons();
        prepareQuery();
      }
    }

    var _filterValues = {
      init: function() {
        _s.thead.append("<tr id='" + _s.Ids.filterPopupHolderTr.slice(1) + "'></tr>");
        this.refresh();
      },
      refresh: function(excludeField) {
        var self = this;
        excludeField = excludeField !== undefined ? excludeField : _lastApplyClickedField;

        var numOfFields = _fields.length;
        for (var j = 0; j < numOfFields; j++) {
          if (_fields[j] !== excludeField) {
            self.values[_fields[j]] = []; // Resetting the arrays for all fields, except currently active field
          }
        }

        getData();

        function getData(nextQuery) {
          var options = {
            success: function(data, next) { // Using SP API __next string to query API to get all the data to populate filters properly
              if (next !== undefined) {
                getData(next); // As long as there are more items left to be retrieved (i.e. there is __next field in API response), the method is called again and again
              }
              processData(data);
            }
          }

          if (nextQuery !== undefined) {
            options.nextQuery = nextQuery;
          }

          _InventoryTable.getData(options);
        }

        function processData(data) {
          self.saveValues(data);
          $(_s.Ids.filterPopupHolderTr).html(self.prepareFilterCells());
          _checkboxes.check();
          prepareFilterIcons();
        }

        _currentPopup = "";
        _popupVisible = false;
      },
      saveValues: function(data) {
        var self = this;
        var numOfFields = _fields.length;
        var fieldName = "";

        for (var i = 0, max = data.length; i < max; i++) {
          var values = data[i];

          for (var j = 0; j < numOfFields; j++) {
            fieldName = _fields[j];

            if (self.values[fieldName] === undefined) {
              self.values[fieldName] = [];
            }

            if (!self.values[fieldName].contains(values[fieldName])) {
              self.values[fieldName].push(values[fieldName]);
            }
          }

        }

        for (var k = 0; k < numOfFields; k++) {
          fieldName = _fields[k];

          if (fieldName.toLowerCase() === "id") {
            self.values[fieldName].sortNumbers();
          } else {
            self.values[fieldName].sort();
          }
        }
      },
      prepareFilterCells: function() {
        var self = this;
        var numOfFields = _fields.length;
        var returnHtml = "";

        for (var j = 0; j < numOfFields; j++) {
          var fieldName = _fields[j];

          returnHtml += "<th>";
          returnHtml += "<div class='" + _s.Ids.filterPopup.slice(1) + "' field-name='" + fieldName + "'>";
          returnHtml += "<div>";
          returnHtml += "<a class='button " + _s.Ids.applyFilterButton.slice(1) + "'>Apply</a>";
          returnHtml += "<a class='button " + _s.Ids.clearFilterButton.slice(1) + "'>Clear</a>";
          returnHtml += "</div>";
          if (fieldName.toLowerCase() === "id") {
            var showDeletedHtml = "<div class='pretty p-default p-curve' id='" + _s.Ids.showDeletedItemsCheckboxHolder.slice(1) + "' title='Show Deleted Items'>";
            showDeletedHtml += "<input type='checkbox' id='" + _s.Ids.showDeletedItemsCheckbox.slice(1) + "' filter-value='Show Deleted Items'>";
            showDeletedHtml += "<div class='state p-primary-o'>";
            showDeletedHtml += "<label>Show Deleted Items</label>";
            showDeletedHtml += "</div>";
            showDeletedHtml += "</div>";
            returnHtml += showDeletedHtml;
          }
          returnHtml += "<ul>";

          var numOfItems = self.values[fieldName].length;
          var nullDateCheckboxAdded = false;
          for (var i = 0; i < numOfItems; i++) {
            if (fieldName.contains("date")) {
              if (self.values[fieldName][i] !== null && self.values[fieldName][i] !== _Constants.defaultTime) {
                returnHtml += "<li>" + _checkboxes.prepare(_MiscFunctions.date(self.values[fieldName][i])) + "</li>";
              } else if (!nullDateCheckboxAdded) {
                nullDateCheckboxAdded = true;
                returnHtml += "<li>" + _checkboxes.prepare("N/A") + "</li>";
              }
            } else {
              returnHtml += "<li>" + _checkboxes.prepare(self.values[fieldName][i]) + "</li>";
            }
          }

          returnHtml += "</ul>";
          returnHtml += "</div>";
          returnHtml += "</th>";
        }

        return returnHtml;
      },
      values: {}
    }

    /**
     * @description Loops through _savedFields array and sets up the filter icon's opaquenes accordingly
     */
    function prepareFilterIcons() {
      // Setting up the filter icon opacities depending on if there are any active filters
      $(_s.Ids.filterIcon).removeClass(_s.Ids.opaque.slice(1));
      var numOfSavedFields = _savedFields.length;
      for (var i = 0; i < numOfSavedFields; i++) {
        $(_s.Ids.filterIcon).closest("tr").find("th[field-name='" + _savedFields[i] + "']").find(_s.Ids.filterIcon).addClass(_s.Ids.opaque.slice(1));
      }
    }

    function prepareQuery() {
      var queryString = "";
      if (_savedFields.length !== 0) {
        queryString += "(";

        for (var fieldName in _savedValues) {
          if (!_savedValues.hasOwnProperty(fieldName))
            continue;

          var valuesArray = _savedValues[fieldName];
          var numOfValues = valuesArray.length;

          queryString += "(";
          for (var i = 0; i < numOfValues; i++) {
            if (fieldName.contains("date")) {
              if (valuesArray[i] == "N/A") {
                queryString += "(" + fieldName + " le datetime'" + _Constants.defaultTime + "') or ";
              } else {
                queryString += _Search.prepareDateQuery(valuesArray[i], fieldName);
              }
            } else {
              queryString += "(" + fieldName + " eq '" + valuesArray[i] + "') or ";
            }
          }

          queryString = queryString.slice(0, -4); // Removing the extra ' or ' at the end
          queryString += ") and ";

        }
        queryString = queryString.slice(0, -5); // Removing the extra ' and ' at the end
        queryString += ")";
      }
      _query = queryString;
      _popup.hideAll();
      _InventoryTable.populateTable();
    }

    /**
     * @description Injects all the required HTML code for filter visuals into DOM.
     */
    function initVisuals() {
      _s.thead.find("tr:first-child").find("th").find(_InventoryTable.theadTextHtmlClass()).parent().each(function() {
        var filterHtml = "<span class='" + _s.Ids.filterIcon.slice(1) + "'></span>";
        $(this).append(filterHtml);
      });
      _filterValues.init();
    }

    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    self.queryString = function() {
      return _query;
    }

    self.refresh = function() {
      _filterValues.refresh();
    }

    /**
     * @description     Used to handle the circular dependencies by loading the dependencies after
     *                  initial creation of an object.
     *
     *                  A single parameter must be passed as an object literal. For example:
     *
     *                      {InventoryTable: InventoryTable}
     *
     *                  If Items and Search have circular dependencies with each other,
     *                  "solveCircularDependencies" method should be called as below to solve
     *                  the circular dependency:
     *
     *                      Filter.solveCircularDependencies({
     *                          InventoryTable: InventoryTable
     *                      });
     *
     *                  this is assuming the Items object was created before Search object. If it
     *                  is the other way around, then the method should be called from Items object:
     *
     *                      InventoryTable.solveCircularDependencies({
     *                          Filter: Filter
     *                      });
     *
     *                  If there is more than one circular dependency, each dependent object
     *                  should be added as an item in the object literal parameter:
     *
     *                      Filter.solveCircularDependencies({
     *                          Search: Search,
     *                          InventoryTable: InventoryTable
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
            CLog.e("Filter.solveCircularDependencies", e);
          }
        }
      }

      function run() {
        self[variableName](value);
      }
    };

    /**
     * @param  {Object} thead jQuery object for table head
     */
    self.init = function(thead) {
      _s.thead = thead;
      initVisuals();
      _listeners.init();
    }
  }

  /** @type {Filter} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new Filter(params);
      }
      return _instance;
    }
  };
})();
