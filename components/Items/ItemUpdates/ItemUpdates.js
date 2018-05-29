ItemUpdates = (function() {
  function ItemUpdates(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _MiscFunctions = NSMain.MiscFunctions;
    var _Toast = NSMain.Toast;
    var _BlockUI = NSMain.BlockUI;
    var _PopupWindow = NSMain.PopupWindow;
    var _NewItem = params.NewItem;
    var _AuditTrail = params.AuditTrail;
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
      highlighted: ".highlighted"
    }
    _s.elnPopup = {
      Ids: {
        contentWrapper: "#eln-number-request-popup-contents"
      },
      inputPlaceholder: "Please enter the eLN number where you used the cell line",
      title: "Quantity Changed - Please Enter eLN Reference"
    }

    var _focusedItem = {
      currentValue: "",
      hasChanged: false,
      id: "",
      fieldName: ""
    }

    var _initialValues = {};

    var _changedItems = {};
    var _isThereAnyEmptyField = false;
    var _emptyFields = [];

    var _elnReferences = {};
    var _elnReferencesEntered = false;
    var _areThereMissingFieldsInElnPopup = false;


    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/


    var _listeners = {
      elnReferencePopupSaveButtonClickListener: function() {
        $("body").on("click", _s.elnPopup.Ids.contentWrapper + " .button", function(e) {
          saveElnReferences();
        });
      },
      elnReferencePopupTableInputKeyPressListener: function() {
        $("body").on("keyup", _s.elnPopup.Ids.contentWrapper + " table tr td input", function(e) {
          if (e.keyCode == 13) { // Enter key
            saveElnReferences();
          }
        });
      },
      inventoryTableDatepickerChangeListener: function() {
        $("body").on("change", _InventoryTable.id() + " .datepicker input", function(e) {
          if ($(this).closest("tr").attr("id") !== _NewItem.rowId()) {
            self.focusedItemAction($(this));
          }
        });
      },
      init: function() {
        this.elnReferencePopupSaveButtonClickListener();
        this.elnReferencePopupTableInputKeyPressListener();
        this.inventoryTableDatepickerChangeListener();
      }
      // Inventory table input listeners are in InventoryTable class
    }

    function saveElnReferences() {
      _areThereMissingFieldsInElnPopup = false;
      _elnReferencesEntered = false;
      $(_s.elnPopup.Ids.contentWrapper + " table tr").each(function() {
        var id = $(this).find('td:first-child').html();
        var value = $(this).find('td:last-child input').val();

        if (value == "" || value == _s.elnPopup.inputPlaceholder) {
          _areThereMissingFieldsInElnPopup = true;
          _Toast.showToast({
            message: "Please fill all the fields",
            shake: "true",
            callback: function() {
              self.showUnsavedChangesToast();
            }
          });
        } else {
          _elnReferences[id] = value;
        }
      }).promise().done(function() {
        if (!_areThereMissingFieldsInElnPopup) {
          _elnReferencesEntered = true;
          _PopupWindow.hide();
        }
      });
    }

    function showElnPopup(htmlContent, callback) {
      _PopupWindow.show({
        content: htmlContent,
        title: _s.elnPopup.title,
        width: "50",
        height: "50"
      });

      var interval = setInterval(function() {
        if (_elnReferencesEntered) {
          clearInterval(interval);
          callback();
        }
      }, 200);
    }

    /**
     * @description Gets the focused item's id, field name, and current value and assigns them to
     *              local variables.
     * @param  {Object} item jQuery object for the focused input HTML element
     */
    function saveFocusedItemDetails($item) {
      _focusedItem.id = $item.closest("tr").attr("id").slice(_InventoryTable.rowIdPrefix().length);
      _focusedItem.fieldName = $item.closest("td").attr("field-name");
      _focusedItem.currentValue = $item.val().trim();
    };

    /**
     * @description Cleans up _changedItems object by looping through all the IDs and fields and deleting
     *              fields if the 'new' and 'old' values are same. It also deletes the array for the ID if
     *              it doesn't have any changed values left after clean up.
     */
    function cleanChangedItemsObject() {
      for (var id in _changedItems) {
        if (!_changedItems.hasOwnProperty(id))
          continue;

        // Iterating through all the fields for each item (using their IDs)
        for (var field in _changedItems[id]["new"]) {
          if (!_changedItems[id]["new"].hasOwnProperty(field))
            continue;

          if (_changedItems[id]["new"][field] === _changedItems[id]["old"][field]) {
            // Removing items that hasn't changed
            delete _changedItems[id]["new"][field];
            delete _changedItems[id]["old"][field];
            _highlight.remove(id, field);
          } else {
            _highlight.add(id, field);
            if (field.contains("date")) {
              var datetime = new Date(_changedItems[id]["new"][field]);
              if (datetime === "Invalid Date" || isNaN(datetime)) {
                _changedItems[id]["new"][field] = _Constants.defaultTime;
              } else if (_MiscFunctions.date(_changedItems[id]["new"][field]) === _MiscFunctions.date(_changedItems[id]["old"][field])) {
                // Removing items that hasn't changed
                delete _changedItems[id]["new"][field];
                delete _changedItems[id]["old"][field];
                _highlight.remove(id, field);
              }
            }
          }
        }

        // If no field has changed for the item, it's removed from the object
        if (jQuery.isEmptyObject(_changedItems[id]["new"])) {
          delete _changedItems[id];
        }

        if (jQuery.isEmptyObject(_changedItems)) {
          self.itemsChanged(false);
        } else {
          self.itemsChanged(true);
        }
      }
    }

    var _highlight = {
      add: function(id, fieldName) {
        $("#" + _InventoryTable.rowIdPrefix() + id).find("td[field-name='" + fieldName + "']").find("input").addClass(_s.Ids.highlighted.slice(1));
      },
      remove: function(id, fieldName) {
        $("#" + _InventoryTable.rowIdPrefix() + id).find("td[field-name='" + fieldName + "']").find("input").removeClass(_s.Ids.highlighted.slice(1));
      },
      clearAll: function() {
        $(_InventoryTable.id()).find("input").removeClass(_s.Ids.highlighted.slice(1));
      }
    }

    function showAddNewItemToast() {
      if (_NewItem.isNewItemRowVisible()) {
        var toastDelay = _s.toastDuration + _Constants.fadeDuration * 1.1;
        _NewItem.showAddNewItemToast(toastDelay); // Showing the new item toast if add new item row is visible

        _InventoryTable.body().find("tr:first-child td:first-child input").focus(); // Focusing in new item input if add new item row is visible
      }
    }


    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /*--------------------------------------- Getters/Setters ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @description Getter/setter for _focusedItem.hasChanged. If no parameter is provided, it serves
     *              as a getter and returns the current saved value. If the 'value' parameter is provided,
     *              it acts as a setter and assigns the value to _focusedItem.hasChanged.
     * @param {Boolean} [value]
     * @returns {Boolean} Returns true if there are any changes in any of the inputs in the table
     */
    self.itemsChanged = function(value) {
      if (value !== undefined) {
        if (value === false) {
          _highlight.clearAll();
        }
        _focusedItem.hasChanged = value;
      } else {
        return _focusedItem.hasChanged;
      }
    };

    /**
     * @description Getter/setter for _focusedItem.currentValue. If no parameter is provided, it serves
     *              as a getter and returns the current saved value. If the 'value' parameter is provided,
     *              it acts as a setter and assigns the value to _focusedItem.currentValue.
     * @param {String|Number} [value] String or number value of the focused input's current value
     * @returns {String|Number}       If no parameter is provided, saved value is returned
     */
    self.currentValue = function(value) {
      if (value !== undefined) {
        _focusedItem.currentValue = value;
      } else {
        return _focusedItem.currentValue;
      }
    };

    /*↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑*/
    /*--------------------------------------- Getters/Setters ---------------------------------------*/

    /**
     * @param  {Object} item jQuery object for the focused input HTML element
     */
    self.initialValues = function($item) {
      saveFocusedItemDetails($item);
      if (_changedItems[_focusedItem.id] === undefined ||
        _changedItems[_focusedItem.id]["old"] === undefined ||
        _changedItems[_focusedItem.id]["old"][_focusedItem.fieldName] === undefined) {
        _initialValues[_focusedItem.id] = _focusedItem.currentValue;
      }
    }

    self.focusedItemAction = function($item) {
      saveFocusedItemDetails($item);

      if (_changedItems[_focusedItem.id] === undefined) {
        _changedItems[_focusedItem.id] = {};
        _changedItems[_focusedItem.id]["new"] = {};
        _changedItems[_focusedItem.id]["old"] = {};
        _changedItems[_focusedItem.id]["old"][_focusedItem.fieldName] = _initialValues[_focusedItem.id];
      };

      if (_changedItems[_focusedItem.id]["old"][_focusedItem.fieldName] === undefined) {
        _changedItems[_focusedItem.id]["old"][_focusedItem.fieldName] = _initialValues[_focusedItem.id];
      }

      _changedItems[_focusedItem.id]["new"][_focusedItem.fieldName] = _focusedItem.currentValue;

      cleanChangedItemsObject();

      if (self.itemsChanged()) {
        self.showUnsavedChangesToast();
      } else {
        _Toast.hideToast();
        showAddNewItemToast();
      }
    };

    self.showUnsavedChangesToast = function() {
      _Toast.showToast({
        message: "Press 'Enter' to save changes",
        duration: 0
      });
    };

    /**
     * @description Updates all the items in the server via an API query. This function uses the _changedItems object.
     * @param  {Function} callback Callback function
     */
    self.updateItems = function(callback) {
      _isThereAnyEmptyField = false;
      _emptyFields = [];
      var clientContext = new SP.ClientContext(Constants.siteUrl);
      var oList = clientContext.get_web().get_lists().getByTitle(_Constants.itemsListName);

      var quantityChangesPresent = false;
      var eLNPopupHtml = "<div id='" + _s.elnPopup.Ids.contentWrapper.slice(1) + "'>";
      eLNPopupHtml += "<table class='" + _Constants.Ids.scrollableTable.slice(1) + "'>";

      // Table head
      eLNPopupHtml += "<thead>";
      // Header cells with title texts
      eLNPopupHtml += "<tr>";
      eLNPopupHtml += "<th>Item ID</th>";
      eLNPopupHtml += "<th>eLN</th>";
      eLNPopupHtml += "<th></th>"; // Empty cell is needed for scrollbar
      eLNPopupHtml += "</tr>";
      // Header shadow row
      eLNPopupHtml += "<tr class='shadow'><th></th></tr>";
      eLNPopupHtml += "</thead>";

      // Table body
      eLNPopupHtml += "<tbody>";

      // Iterating through all the items that were added to the _changedItems object
      for (var id in _changedItems) {
        if (!_changedItems.hasOwnProperty(id))
          continue;

        var oListItem = oList.getItemById(id);

        // Iterating through all the fields for each item (using their IDs)
        for (var field in _changedItems[id]["new"]) {
          if (!_changedItems[id]["new"].hasOwnProperty(field))
            continue;

          if (_changedItems[id]["new"][field] === _changedItems[id]["old"][field]) {
            // Removing items that hasn't changed
            delete _changedItems[id]["new"][field];
            delete _changedItems[id]["old"][field];
          } else {
            if (field.contains("date")) {
              var datetime = new Date(_changedItems[id]["new"][field]);
              if (datetime === "Invalid Date" || isNaN(datetime)) {
                _changedItems[id]["new"][field] = _Constants.defaultTime;
              }
            }

            if (_changedItems[id]["new"][field] !== "") {
              // Adding all the changed fields to the query
              oListItem.set_item(field, _changedItems[id]["new"][field]);
            } else {
              _isThereAnyEmptyField = true;
              _emptyFields.push([id, field]);
            }
          }
        }
        oListItem.update();

        eLNPopupHtml += "<tr>";
        eLNPopupHtml += "<td>" + id + "</td>";
        eLNPopupHtml += "<td><input type='text' placeholder='" + _s.elnPopup.inputPlaceholder + "'></td>";
        eLNPopupHtml += "</tr>";

        if (_changedItems[id]["new"]["Quantity"] !== undefined) {
          quantityChangesPresent = true;
        }

        // If no field has changed for the item, it's removed from the object
        if (jQuery.isEmptyObject(_changedItems[id]["new"])) {
          delete _changedItems[id];
        }
      }

      eLNPopupHtml += "</tbody>";
      eLNPopupHtml += "</table>";
      eLNPopupHtml += "<a class='button'>Save</a>";
      eLNPopupHtml += "</div>";

      if (!_isThereAnyEmptyField) {
        if (quantityChangesPresent) {
          showElnPopup(eLNPopupHtml, saveChanges);
        } else {
          saveChanges();
        }
      } else {
        var id = _emptyFields[0][0];
        var fieldName = _emptyFields[0][1];
        $("#" + _InventoryTable.rowIdPrefix() + id).find("td[field-name='" + fieldName + "']").find("input").focus();
        _Toast.showToast({
          message: "Please fill all the fields. Values cannot be empty.",
          shake: "true",
          callback: function() {
            self.showUnsavedChangesToast();
          }
        });
      }

      function saveChanges() {
        _BlockUI.block();

        clientContext.executeQueryAsync(function() {
          _BlockUI.unblock();
          _Toast.showToast({
            message: "Changes saved",
            duration: _s.toastDuration
          });

          self.itemsChanged(false);
          _initialValues[_focusedItem.id] = _focusedItem.currentValue;

          // Do not pass objects directly as they are reset in next line
          _AuditTrail.updateAuditTrail(JSON.parse(JSON.stringify(_changedItems)), JSON.parse(JSON.stringify(_elnReferences)));

          // Resetting the holder objects and variables
          _changedItems = {};
          _elnReferences = {};
          quantityChangesPresent = false;
          _elnReferencesEntered = false;

          showAddNewItemToast();

          if (callback !== undefined) {
            callback();
          }
        }, function(sender, args) {
          _Toast.showToast({
            message: "Error during saving. Please refresh the page and try again.</br><span>Error message: <i>" + args.get_message() + "</i></span>",
            duration: 0
          });
          CLog.e("ItemUpdates.updateItem", "Request failed. " + args.get_message() + '\n' + args.get_stackTrace());
        });
      }
    }

    self.init = function() {
      _listeners.init();
    };
  }

  /** @type {ItemUpdates} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new ItemUpdates(params);
      }
      return _instance;
    }
  };
})();
