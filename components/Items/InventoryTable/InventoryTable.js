InventoryTable = (function() {
  function InventoryTable(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _BlockUI = NSMain.BlockUI;
    var _Spinner = NSMain.Spinner;
    var _PopupWindow = NSMain.PopupWindow;
    var _MiscFunctions = NSMain.MiscFunctions;
    var _ItemUpdates = params.ItemUpdates;
    var _Search = params.Search;
    var _NewItem = params.NewItem;
    var _AuditTrail = params.AuditTrail;
    var _Filter = params.Filter;
    var _Sort = params.Sort;
    var _DeleteItem = params.DeleteItem;
    var _s = clone(params.settings); // Do not use direct assignment, as it causes the original object (i.e. NSItems.settings) to change when anything changes in _s.

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */

    var _anInputHasFocus = false;

    // These field names has to match the SharePoint list field IDs (not the display names)
    var _fields = _s.fields;

    var _numOfItemsPerQuery = 50;
    var _nextUrl = "";

    _s.Ids = {
      inventoryTable: "#inventory-table",
      theadTextWrapper: ".inventory-table-thead-text-wrapper",
      theadText: ".inventory-table-thead-text",
      deletedItemTd: ".deleted-item-td",
      deletedItemTr: ".deleted-item-tr",
      deleteContextMenu: ".delete-context-menu"
    }
    _s.rowIdPrefix = "cell-line-id-";

    // Used to store inventory table body jQuery object. It is first initialized in 'populateTable' method.
    var _tableBody = "";

    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    var _listeners = {
      inventoryTableInputFocusListener: function() {
        $("body").on("focus", _s.Ids.inventoryTable + " td input", function(e) {
          if ($(this).closest("tr").attr("id") !== _NewItem.rowId()) { // Excluding inputs in new item row
            _ItemUpdates.initialValues($(this));
          }
          _anInputHasFocus = true;
        });
      },
      inventoryTableInputKeyPressListener: function() {
        $("body").on("keyup", _s.Ids.inventoryTable + " td input", function(e) {
          if ($(this).closest("tr").attr("id") !== _NewItem.rowId()) { // Excluding inputs in new item row
            _ItemUpdates.focusedItemAction($(this));

            if (e.keyCode == 13) { // Enter key
              if (_ItemUpdates.itemsChanged()) {
                _ItemUpdates.updateItems();
              } else {
                if (_NewItem.isNewItemRowVisible()) {
                  _NewItem.saveNewItem();
                }
              }
            }
          }
        });
      },
      inventoryTableInputBlurListener: function() {
        $("body").on("blur", _s.Ids.inventoryTable + " td input", function(e) {
          _anInputHasFocus = false;
        });
      },
      inventoryTableIdClickListener: function() {
        $("body").on("click", _s.Ids.inventoryTable + " tbody tr td:first-child", function(e) {
          if ($(this).closest("tr").attr("id") !== _NewItem.rowId()) {
            _AuditTrail.getAuditTrail($(this).closest("tr").attr("id").replace(_s.rowIdPrefix, ""));
          }
        });
      },
      /**
       * @description This method is intended to be used on body keyup events only when no input
       *              has focus in the table (including the add new item inputs)
       */
      bodyKeyPressListener: function() {
        $("body").on("keyup", function(e) {
          if (!_PopupWindow.isVisible()) {
            if (!_anInputHasFocus && e.keyCode == 13) { // Enter key
              if (_ItemUpdates.itemsChanged()) { // There are changes in the table
                _ItemUpdates.updateItems();
              } else if (_NewItem.isNewItemRowVisible()) { // Add new item row is visible and there are no changes in the other items in the table
                _NewItem.saveNewItem();
              }
            }

            if (e.keyCode == 27) { // Esc key
              if (_NewItem.isNewItemRowVisible()) {
                _NewItem.removeNewItemRow();
                if (_ItemUpdates.itemsChanged()) {
                  setTimeout(function() {
                    _ItemUpdates.showUnsavedChangesToast();
                  }, (_Constants.fadeDuration * 2));
                }
              }
            }
          }
        });
      },
      inventoryTableScrollToBottomListener: function() {
        $(_s.Ids.inventoryTable + " tbody").off("scroll");
        $(_s.Ids.inventoryTable + " tbody").scroll(function(e) {
          if ((this.scrollHeight - this.scrollTop) === this.clientHeight) {
            loadMore();
          }
        });
      },
      init: function() {
        this.inventoryTableInputFocusListener();
        this.inventoryTableInputKeyPressListener();
        this.inventoryTableInputBlurListener();
        this.bodyKeyPressListener();
        this.inventoryTableIdClickListener();
        this.inventoryTableScrollToBottomListener();
      }
    }

    /**
     * @description  Prepares and returns table rows (i.e. 'tr') outer HTML with the provided parameters
     * @param  {Array} array    Array containing objects with the provided keys as the field names.
     *                          The value of each field (except 'id') is used to create a cell (i.e. 'td') in row.
     *                          Each object in the array is used to populate a row.
     *                            Example array:
     *                              [
     *                                {ID: 1, Name: "test1", BoxNo: "5", ...},
     *                                {ID: 2, Name: "test2", BoxNo: "4", ...}
     *                              ]
     * @param  {Object} fields  An object containing the field names to grab the values from the array
     *                          provided. Each key in the object is used as the field name; and the values
     *                          for the keys are used to wrap the array values in the provided HTML tag.
     *                            Example fields:
     *                              {id: "ID", Name: "input", BoxNo: "span", ...}
     * @return {String}         HTML string for the rows
     */
    function prepareTableRows(array, keys) {
      var returnHtml = "";

      for (var i = 0, max = array.length; i < max; i++) {
        returnHtml += "<tr id=" + _s.rowIdPrefix + array[i]["Id"];

        var isDeleted = array[i]["Deleted"] == 1;

        if (isDeleted) {
          returnHtml += " class='" + _s.Ids.deletedItemTr.slice(1) + "'";
        }

        returnHtml += ">";

        for (var key in keys) {
          if (!keys.hasOwnProperty(key))
            continue;

          var values = {
            value: array[i][key],
            field: key
          }

          if (key.contains("date") && (_MiscFunctions.date(array[i][key]) === _MiscFunctions.date(_Constants.defaultTime))) {
            array[i][key] = null;
            values.value = array[i][key];
          }

          if (!isDeleted) {
            values.type = keys[key];

            if (key.contains("date")) {
              values.class = "datepicker";
            }

            if (key.toLowerCase() === "id") {
              values.class = _s.Ids.deleteContextMenu.slice(1);
            }
          } else {
            values.title = "(This item was deleted and cannot be edited)";

            if (key.toLowerCase() === "id") {
              values.type = "a";
            } else {
              values.class = _s.Ids.deletedItemTd.slice(1);
            }
          }

          returnHtml += self.prepareTableCell(values);
        }

        returnHtml += "</tr>";
      }

      return returnHtml;
    };

    function prepareTableHead() {
      var numOfFields = _fields.length;
      var theadHtml = "<tr>";

      for (var i = 0; i < numOfFields; i++) {
        theadHtml += "<th field-name='" + _fields[i] + "'>";
        theadHtml += "<span class='" + _s.Ids.theadTextWrapper.slice(1) + "'>";
        theadHtml += "<span class='" + _s.Ids.theadText.slice(1) + "'>" + _fields[i].toSentenceCaseWithSpaces() + "</span>";
        theadHtml += "</span></th>";
      }

      theadHtml += "<th></th>"; // An empty cell at the end is needed for the tbody scrollbar
      theadHtml += "</tr>";

      var tableHead = $(_s.Ids.inventoryTable).find("thead");
      tableHead.html(theadHtml + tableHead.html());

      _Filter.init(tableHead);
      _Sort.init(tableHead);
    }

    function loadMore() {
      if (_nextUrl !== "") {
        _Spinner.show();
        self.getData({
          nextQuery: _nextUrl,
          success: function(data, next) {
            _nextUrl = "";
            if (next !== undefined) {
              _nextUrl = next;
            }
            var fields = {};
            var numOfFields = _fields.length;
            for (var i = 0; i < numOfFields; i++) {
              if (_fields[i] === "ID") {
                fields[_fields[i]] = "a";
              } else {
                fields[_fields[i]] = "input"; // Setting all the fields as inputs, except 'ID'
              }
            }

            _tableBody.html(_tableBody.html() + prepareTableRows(data, fields));
            _listeners.inventoryTableScrollToBottomListener();
            _MiscFunctions.pikaday.init();
          },
          done: function() {
            _Spinner.hide();
          }
        });
      }
    }

    /**
     * @description Builds the query string for API call
     * @param  {String}   [options.searchQuery] If not provided, all the results are shown
     * @param  {String}   [options.sortQuery] If not provided, default sort is 'ID desc'
     * @param  {String}   [options.filterQuery]
     * @param  {String}   [options.paginationQuery]
     * @return {String}   Query string
     */
    function buildQuery(options) {
      options = options !== undefined ? options : {};
      var queryString = "?$select=";

      // Looping through all the fields and adding them to the query
      var numOfFields = _fields.length;
      for (var i = 0; i < numOfFields; i++) {
        queryString += _fields[i] + ",";
      }

      // Adding the 'Deleted' field manually as it is not part of the view, therefore not included in _fields
      queryString += "Deleted"

      var searchQuery = "";
      if (options.searchQuery !== undefined) {
        searchQuery += options.searchQuery;
      } else if (_Search.queryString() !== "") {
        searchQuery += _Search.queryString();
      }

      var filterQuery = "";
      if (options.filterQuery !== undefined) {
        filterQuery += options.filterQuery;
      } else if (_Filter.queryString() !== "") {
        filterQuery += _Filter.queryString();
      }

      if (searchQuery !== "" && filterQuery !== "") {
        queryString += "&$filter=(" + searchQuery + " and " + filterQuery + ")";
      } else if (searchQuery === "" && filterQuery !== "") {
        queryString += "&$filter=(" + filterQuery + ")";
      } else if (searchQuery !== "" && filterQuery === "") {
        queryString += "&$filter=(" + searchQuery + ")";
      }

      if (options.sortQuery !== undefined) {
        queryString += options.sortQuery;
      } else if (_Sort.sortQueryString() !== "") {
        queryString += _Sort.sortQueryString();
      } else {
        queryString += "&$orderby=ID desc"; // Returning the last added item first
      }

      if (options.paginationQuery !== undefined) {
        queryString += options.paginationQuery;
      }

      return queryString;
    }



    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @description  Prepares and returns a table cell (i.e. 'td') outer HTML with the
     *               provided parameters
     * @param  {String} params.value    Value that will be displayed
     * @param  {String} [params.type]   Type of HTML element that needs to be inserted into the cell.
     *                                  For example: input. span, div, etc.
     * @param  {String} [params.id]     HTML id for the cell
     * @param  {String} [params.class]  HTML class for the cell
     * @param  {String} [params.field]  Field name for td 'field-name' attribute
     * @param  {String} [params.title]  HTML title field
     * @return {String} Outer HTML of the table prepareTableCell
     */
    self.prepareTableCell = function(params) {
      params.type = params.type !== undefined ? params.type : "";
      params.id = params.id !== undefined ? params.id : "";
      params.class = params.class !== undefined ? params.class : "";
      params.field = params.field !== undefined ? params.field : "";
      params.title = params.title !== undefined ? params.title : "";
      params.value = params.value !== null ? params.value : "";
      params.value = _MiscFunctions.escapeHtml(params.value);

      var title = params.value;

      var returnHtml = "<td";

      if (params.field !== "") {
        returnHtml += " field-name=" + params.field;
      }

      if (params.id !== "") {
        returnHtml += " id=" + params.id;
      }

      if (params.class !== "") {
        returnHtml += " class=" + params.class;
      }

      if (params.title !== "") {
        title = params.value + " " + params.title;
      }

      if (params.field.contains("date")) {
        params.value = _MiscFunctions.date(params.value);
      }

      returnHtml += ">";

      if (params.type === "") {
        returnHtml += "<span title='" + title + "'>" + params.value; + "</span>";
      } else if (params.type === "input") {
        returnHtml += "<input value='" + params.value + "' title='" + title + "'/>";
      } else {
        returnHtml += "<" + params.type + " title='" + title + "'>" + params.value + "</" + params.type + ">";
      }

      returnHtml += "</td>";

      return returnHtml;
    };

    /**
     * @description Performs the API query and populates the table with the results
     * @param  {String}   [options.searchQuery] If not provided, all the results are shown
     * @param  {String}   [options.sortQuery]   If not provided, default sort is 'ID desc'
     * @param  {String}   [options.filterQuery]
     * @param  {Function} [options.callback]    Callback function called when AJAX is complete
     * @param  {Boolean}  [options.blockUI]     Default is true
     */
    self.populateTable = function(options) {
      options = options !== undefined ? options : {};
      options.blockUI = options.blockUI !== undefined ? options.blockUI : true;

      var queryString = buildQuery({
        searchQuery: options.searchQuery,
        sortQuery: options.sortQuery,
        filterQuery: options.filterQuery,
        paginationQuery: "&$top=" + _numOfItemsPerQuery
      });

      if (options.blockUI) {
        _BlockUI.block(500);
      }

      self.getData({
        query: queryString,
        success: function(data, next) {
          _nextUrl = "";
          if (next !== undefined) {
            _nextUrl = next;
          }
          var fields = {};
          var numOfFields = _fields.length;
          for (var i = 0; i < numOfFields; i++) {
            if (_fields[i] === "ID") {
              fields[_fields[i]] = "a";
            } else {
              fields[_fields[i]] = "input"; // Setting all the fields as inputs, except 'ID'
            }
          }

          _tableBody = $(_s.Ids.inventoryTable).find("tbody");
          _tableBody.html(prepareTableRows(data, fields));
          _listeners.inventoryTableScrollToBottomListener();
          _MiscFunctions.pikaday.init();
          _Filter.refresh();
        },
        done: function() {
          _BlockUI.unblock();
          if (options.callback !== undefined) {
            options.callback();
          }
        }

      });
    };

    /**
     * @param  {String} [options.query] API query string
     * @param  {String} [options.nextQuery] API __next query URL
     * @param  {Function} [options.success] Callback function to be called after a successful AJAX call
     * @param  {Function} [options.done] Callback function to be called after a AJAX call is done, regardless of the status
     */
    self.getData = function(options) {
      var url = "";
      var apiBaseUrl = "_api/web/lists/getbytitle('" + _Constants.itemsListName + "')/items";
      if (options.query === undefined) {
        options.query = buildQuery();
      }

      if (options.nextQuery !== undefined) {
        url = options.nextQuery
      } else {
        url = _Constants.siteUrl + apiBaseUrl + options.query;
      }

      $.ajax({
        url: url,
        method: "GET",
        headers: {
          "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
          try {
            // CLog.d("InventoryTable.getData returned data", data);
            if (data.d.__next !== undefined) {
              options.success(data.d.results, data.d.__next);
            } else {
              options.success(data.d.results);
            }
          } catch (e) {
            CLog.catch("InventoryTable.getData successCallback", e, true);
          }
        },
        error: function(data) {
          CLog.e("InventoryTable.getData", data);
        }
      }).done(function() {
        try {
          options.done();
        } catch (e) {
          CLog.catch("InventoryTable.getData doneCallback", e);
        }
      });
    }

    /**
     * @description Getter for the inventory table body jQuery object
     * @return {Object} jQuery object for the main inventory table body
     */
    self.body = function() {
      return _tableBody;
    }
    /**
     * @description Getter for the inventory table HTML id
     * @return {Object} HTML id for the main inventory table
     */
    self.id = function() {
      return _s.Ids.inventoryTable;
    }

    /**
     * @description Getter for the inventory table row id prefix
     * @return {String} Inventory table row id prefix
     */
    self.rowIdPrefix = function() {
      return _s.rowIdPrefix;
    }

    /**
     * @description Getter for the inventory table thead text html id
     * @return {String} Inventory table thead text html id
     */
    self.theadTextHtmlClass = function() {
      return _s.Ids.theadText;
    }

    /**
     * @description     Used to handle the circular dependencies by loading the dependencies after
     *                  initial creation of an object.
     *
     *                  A single parameter must be passed as an object literal. For example:
     *
     *                      {Search: Search}
     *
     *                  If Items and Search have circular dependencies with each other,
     *                  "solveCircularDependencies" method should be called as below to solve
     *                  the circular dependency:
     *
     *                      InventoryTable.solveCircularDependencies({
     *                          Search: Search
     *                      });
     *
     *                  this is assuming the Items object was created before Search object. If it
     *                  is the other way around, then the method should be called from Items object:
     *
     *                      Search.solveCircularDependencies({
     *                          InventoryTable: InventoryTable
     *                      });
     *
     *                  If there is more than one circular dependency, each dependent object
     *                  should be added as an item in the object literal parameter:
     *
     *                      InventoryTable.solveCircularDependencies({
     *                          Search: Search,
     *                          NewItem: NewItem
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

      self.setItemUpdates = function(obj) {
        _ItemUpdates = obj;
        self.setItemUpdates = null;
      };

      self.setDeleteItem = function(obj) {
        _DeleteItem = obj;
        self.setDeleteItem = null;
      };

      for (property in parameters) {
        if (parameters.hasOwnProperty(property)) {
          variableName = "set" + property;
          value = parameters[property];

          try {
            run();
          } catch (e) {
            CLog.e("InventoryTable.solveCircularDependencies", e);
          }
        }
      }

      function run() {
        self[variableName](value);
      }
    };

    self.init = function() {
      prepareTableHead();
      _listeners.init();
      _DeleteItem.init();
    };
  }

  /** @type {InventoryTable} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new InventoryTable(params);
      }
      return _instance;
    }
  };
})();
