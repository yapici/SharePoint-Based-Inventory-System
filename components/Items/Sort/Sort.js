Sort = (function() {
  function Sort(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
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

    var _fields = _s.fields;

    _s.Ids = {
      sortArrow: ".sort-arrow",
      clearSortButton: "#clear-sort-button"
    }

    // jQuery object for inventory table thead
    _s.thead = {}; // Initialized in init function

    var _sort = {
      field: "",
      order: "asc",
      query: "",
      clear: true
    }

    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/


    var _listeners = {
      sortClickListener: function() {
        $("body").on("click", _InventoryTable.theadTextHtmlClass() + ", " + _s.Ids.sortArrow, function(e) {
          prepareSortQuery($(this).closest("th").attr("field-name"));
          _InventoryTable.populateTable();
        });
      },
      clearSortingButtonClickListener: function() {
        $("body").on("click", _s.Ids.clearSortButton, function(e) {
          prepareSortQuery("");
          _InventoryTable.populateTable();
        });
      },
      init: function() {
        this.sortClickListener();
        this.clearSortingButtonClickListener();
      }
    }

    /**
     * @description Prepares the sort query and saves it into local _sort object
     * @param  {String} fieldName Field name the sort will be applied to. Empty string can be passes to clear sort.
     */
    function prepareSortQuery(fieldName) {
      _sort.clear = false;
      _clearSortButton.show();

      if (fieldName === "") { // Clear sorting
        fieldName = "ID"; // Default sorting field is ID
        _sort.clear = true;
        _clearSortButton.hide();
        _sort.order = "desc"; // Default sorting is ID desc
      } else {
        if (fieldName !== _sort.field) { // If sort field is changed, sorting order is reset to default (i.e. asc)
          _sort.order = "asc";
        } else {
          // Reversing the order in case the click field is same as before
          _sort.order = _sort.order === "asc" ? "desc" : "asc";
        }
      }

      _sort.field = fieldName;
      _sort.query = "&$orderby=" + fieldName + " " + _sort.order;

      updateVisuals();
    }

    function updateVisuals() {
      // First, hiding all the arrow head
      _s.thead.find(_s.Ids.sortArrow).hide();
      _s.thead.find(_s.Ids.sortArrow).parent().removeClass(_Constants.Ids.underlined.slice(1));

      // Then if the sort query isn't empty (i.e. 'clear' flag is false), showing the appropriate arrow head
      if (!_sort.clear) {
        var arrowHead = _s.thead.find("th[field-name='" + _sort.field + "']").find(_s.Ids.sortArrow);
        arrowHead.parent().addClass(_Constants.Ids.underlined.slice(1));
        if (_sort.order === "asc") {
          arrowHead.html("&#9650;");
        } else {
          arrowHead.html("&#9660;");
        }
        arrowHead.show();
      }
    }

    var _clearSortButton = {
      init: function() {
        _s.thead.closest("table").parent().append("<a id='" + _s.Ids.clearSortButton.slice(1) + "'>Clear Sorting</a>");
      },
      show: function() {
        $(_s.Ids.clearSortButton).show();
      },
      hide: function() {
        $(_s.Ids.clearSortButton).hide();
      }
    }

    /**
     * @description Injects all the required HTML code for sort visuals into DOM.
     */
    function initVisuals() {
      _s.thead.find("tr:first-child").find("th").find(_InventoryTable.theadTextHtmlClass()).parent().each(function() {
        var sortHtml = "<span title='Sort' class='" + _s.Ids.sortArrow.slice(1) + "'>&#9660;</span>";
        $(this).append(sortHtml);
      });
      _clearSortButton.init();
    }

    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/


    /**
     * @description Getter for sort and filter query string
     * @return {String} Sort and filter query string
     */
    self.sortQueryString = function() {
      return _sort.query;
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
     *                      Sort.solveCircularDependencies({
     *                          InventoryTable: InventoryTable
     *                      });
     *
     *                  this is assuming the Items object was created before Search object. If it
     *                  is the other way around, then the method should be called from Items object:
     *
     *                      InventoryTable.solveCircularDependencies({
     *                          Sort: Sort
     *                      });
     *
     *                  If there is more than one circular dependency, each dependent object
     *                  should be added as an item in the object literal parameter:
     *
     *                      Sort.solveCircularDependencies({
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
            CLog.e("Sort.solveCircularDependencies", e);
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

  /** @type {Sort} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new Sort(params);
      }
      return _instance;
    }
  };
})();
