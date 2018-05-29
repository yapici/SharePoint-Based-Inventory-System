NewItem = (function() {
  function NewItem(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _Toast = NSMain.Toast;
    var _BlockUI = NSMain.BlockUI;
    var _MiscFunctions = NSMain.MiscFunctions;
    var _Search = params.Search;
    var _InventoryTable = params.InventoryTable;
    var _AuditTrail = params.AuditTrail;
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
      addNewItemButton: "#add-new-button",
      addNewItemRow: "#add-new-item-row",
      theadBlockTr: "#thead-block-tr"
    }
    _s.addNewItemRowInputPrefix = "new-item-";
    _s.headerBlockWarningText = "You cannot sort or use filters while adding a new item";

    var _fields = _s.fields;

    var _newItemRowVisible = false;
    var _missingValueFieldId = "";

    var _toastCheckInterval = "";

      var _$thead = "";


    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    var _listeners = {
      addNewItemButtonClickListener: function() {
        $(_s.Ids.addNewItemButton).on("click", function() {
          if (_newItemRowVisible) {
            self.saveNewItem();
          } else {
            $(this).html("Save");
            addNewRow();
          }
        });
      },
      newItemRowKeyPressListener: function() {
        $("body").on("keyup", _s.Ids.addNewItemRow + " td input", function(e) {
          if (e.keyCode == 13) {
            if (_newItemRowVisible) {
              self.saveNewItem();
            }
          }
        });
      },
      init: function() {
        this.addNewItemButtonClickListener();
        this.newItemRowKeyPressListener();
      }
    }

    /**
     * @description Iterates through the new item row inputs and returns an object with values and field names
     * @return {Object} Returns an object with the field names and corresponding values. Example:
     *                    {
     *                      Name: "Item name",
     *                      Notebook: "Notebook number",
     *                      StorageAssetId: "123456",
     *                      RackNo: "4",
     *                      BoxNo: "2",
     *                      Quantity: "50"
     *                    }
     */
    function getNewItemValues() {
      var returnObject = {};

      // Looping through all the fields
      var numOfFields = _fields.length;
      for (var i = 0; i < numOfFields; i++) {
        if (_fields[i].toLowerCase() !== "id") {
          var id = _s.addNewItemRowInputPrefix + _fields[i].toLowerCaseWithDashes();
          returnObject[_fields[i]] = $("#" + id).find("input").val();
        }
      }

      return returnObject;
    }

    function addNewRow() {
      _$thead = $(_InventoryTable.id()).find("thead");
      _$thead.append("<tr id='" + _s.Ids.theadBlockTr.slice(1) + "' data-balloon-pos='up' data-balloon='" + _s.headerBlockWarningText + "'><th></th></tr>");
      checkToast();

      if (!_newItemRowVisible) {
        var emptyRow = "<tr id='" + _s.Ids.addNewItemRow.slice(1) + "'>";

        // Adding the ID row
        emptyRow += _InventoryTable.prepareTableCell({
          value: "",
          type: "",
          id: ""
        });

        // Looping through all the fields
        var numOfFields = _fields.length;
        for (var i = 0; i < numOfFields; i++) {
          if (_fields[i].toLowerCase() !== "id") {
            var id = _s.addNewItemRowInputPrefix + _fields[i].toLowerCaseWithDashes();
            var values = {
              value: "",
              type: "input", // All fields are inputs by default
              id: id
            }

            if (_fields[i].contains("date")) {
              values.class = "datepicker";
            }

            emptyRow += _InventoryTable.prepareTableCell(values);
          }
        }

        emptyRow += "</tr>";

        _InventoryTable.body().html(emptyRow + _InventoryTable.body().html());
        _InventoryTable.body().find("tr:first-child td:nth-child(2) input").focus(); // Focusing in new item input if add new item row is visible
        _MiscFunctions.pikaday.init();

        _newItemRowVisible = true;
      }

      self.showAddNewItemToast();
      _Search.disable("You cannot use search while adding a new item");
    }

    function checkToast() {
      _toastCheckInterval = setInterval(function() {
        if (_newItemRowVisible && !($(_Toast.id()).is(":visible"))) {
          self.showAddNewItemToast();
        } else if (!_newItemRowVisible) {
          clearInterval(_toastCheckInterval);
        }
      }, 4000);
    }

    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /*--------------------------------------- Getters/Setters ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @description Getter for _newItemRowVisible
     * @returns {Boolean}
     */
    self.isNewItemRowVisible = function() {
      return _newItemRowVisible;
    };

    /*↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑*/
    /*--------------------------------------- Getters/Setters ---------------------------------------*/

    self.removeNewItemRow = function() {
      $(_s.Ids.addNewItemRow).remove();
      _$thead.find(_s.Ids.theadBlockTr).remove();
      _newItemRowVisible = false;
      _Toast.hideToast();
      _Search.enable();
      $(_s.Ids.addNewItemButton).html("Add New");
    };


    /**
     * @param  {Number} [delay] Delay to show the toast in milliseconds. By default there is no delay.
     */
    self.showAddNewItemToast = function(delay) {
      delay = delay !== undefined ? delay : 0;

      setTimeout(function() {
        _Toast.showToast({
          message: "Press 'Enter' to save new item</br>'Esc' to cancel",
          duration: 0
        });
      }, delay);
    }

    self.saveNewItem = function() {
      var values = getNewItemValues();

      var auditTrail = {};
      auditTrail["old"] = {};
      auditTrail["new"] = {};

      _missingValueFieldId = "";

      for (var value in values) {
        if (!values.hasOwnProperty(value))
          continue;

        if (values[value] === "") {
          if (_missingValueFieldId === "") {
            _missingValueFieldId = _s.addNewItemRowInputPrefix + value.toLowerCaseWithDashes();
          }
        }
      }

      if (_missingValueFieldId !== "") {
        _InventoryTable.body().find("#" + _missingValueFieldId).find("input").focus();
        _Toast.showToast({
          message: "Please fill all the fields",
          shake: "true",
          callback: function() {
            self.showAddNewItemToast();
          }
        });
      } else {
        _BlockUI.block(500);

        var clientContext = new SP.ClientContext(Constants.siteUrl);
        var oList = clientContext.get_web().get_lists().getByTitle(_Constants.itemsListName);

        var itemCreateInfo = new SP.ListItemCreationInformation();
        var oListItem = oList.addItem(itemCreateInfo);

        // Looping through all the fields
        var numOfFields = _fields.length;
        for (var i = 0; i < numOfFields; i++) {
          if (_fields[i].toLowerCase() !== "id") {
            if (_fields[i].contains("date")) {
              var datetime = new Date(values[_fields[i]]);
              if (datetime === "Invalid Date" || isNaN(datetime)) {
                values[_fields[i]] = _Constants.defaultTime;
              }
            }

            // Adding the item details to the audit trail object. This will be stored in audit trail as version 0.
            auditTrail["old"][_fields[i]] = "";
            auditTrail["new"][_fields[i]] = values[_fields[i]];

            oListItem.set_item(_fields[i], values[_fields[i]]);
          }
        }

        oListItem.update();

        clientContext.load(oListItem);

        clientContext.executeQueryAsync(function() {
          _newItemRowVisible = false;
          _Toast.showToast({
            message: "New item saved",
            duration: _s.toastDuration
          });
          _InventoryTable.populateTable();
          _BlockUI.unblock();
          _Search.enable();
          $(_s.Ids.addNewItemButton).html("Add New");
          _$thead.find(_s.Ids.theadBlockTr).remove();

          // Adding the item into the audit trail
          var auditTrailObj = {};
          auditTrailObj[oListItem.get_item("ID")] = auditTrail;
          _AuditTrail.updateAuditTrail(auditTrailObj);

        }, function(sender, args) {
          _BlockUI.unblock();
          _Search.enable();
          CLog.e("NewItem.saveNewItem", "Request failed. " + args.get_message() + '\n' + args.get_stackTrace());
        });
      }
    };

    /**
     * @description Getter for the add new item row id
     * @return {String} Add new item row id
     */
    self.rowId = function() {
      return _s.Ids.addNewItemRow.slice(1);
    }

    self.init = function() {
      _listeners.init();
    };
  }

  /** @type {NewItem} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new NewItem(params);
      }
      return _instance;
    }
  };
})();
