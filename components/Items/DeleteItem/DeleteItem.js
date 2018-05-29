DeleteItem = (function() {
  function DeleteItem(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _PopupWindow = NSMain.PopupWindow;
    var _BlockUI = NSMain.BlockUI;
    var _Toast = NSMain.Toast;
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
      deleteContextMenu: ".delete-context-menu",
      deleteConfirmPopupContentWrapper: "#delete-confirm-popup-window-content-wrapper",
      deleteConfirmPopupButtonWrapper: "#delete-confirm-popup-button-wrapper",
      deleteConfirmButton: "#delete-confirm-button",
      deleteCancelButton: "#delete-cancel-button"
    }
    _s.rowIdPrefix = "cell-line-id-";

    var _currentItemId = "";

    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    var _listeners = {
      cancelDeleteButtonClickListener: function() {
        $("body").on("click", _s.Ids.deleteCancelButton, function(e) {
          _PopupWindow.hide();
        });
      },
      confirmDeleteButtonClickListener: function() {
        $("body").on("click", _s.Ids.deleteConfirmButton, function(e) {
          deleteItem(_currentItemId);
        });
      },
      init: function() {
        this.cancelDeleteButtonClickListener();
        this.confirmDeleteButtonClickListener();
      }
    }

    function showConfirmationPopup() {
      var contentHtml = "<div id='" + _s.Ids.deleteConfirmPopupContentWrapper.slice(1) + "'>";
      contentHtml += "<p>Are you sure you want to delete item " + _currentItemId + "?</p>";
      contentHtml += "<div id='" + _s.Ids.deleteConfirmPopupButtonWrapper.slice(1) + "'>";
      contentHtml += "<a class='button' id='" + _s.Ids.deleteConfirmButton.slice(1) + "'>Yes</a>";
      contentHtml += "<a class='button' id='" + _s.Ids.deleteCancelButton.slice(1) + "'>Cancel</a>";
      contentHtml += "</div>";
      contentHtml += "</div>";

      _PopupWindow.show({
        title: "Are you sure?",
        content: contentHtml,
        height: "20",
        width: "30"
      })
    }

    function deleteItem(itemId, callback) {
      var clientContext = new SP.ClientContext(Constants.siteUrl);
      var oList = clientContext.get_web().get_lists().getByTitle(_Constants.itemsListName);

      var oListItem = oList.getItemById(itemId);

      oListItem.set_item("Deleted", "1");
      oListItem.update();

      _PopupWindow.hide();
      _BlockUI.block();

      clientContext.executeQueryAsync(function() {
        _BlockUI.unblock();
        _Toast.showToast({
          message: "Item deleted",
          duration: _s.toastDuration
        });

        var auditTrailChanges = {};
        auditTrailChanges[itemId] = {
          "old": {
            "Deleted": "No"
          },
          "new": {
            "Deleted": "Yes"
          }
        }
        _AuditTrail.updateAuditTrail(auditTrailChanges);

        // Resetting _currentItemId
        _currentItemId = "";

        _InventoryTable.populateTable();

        if (callback !== undefined) {
          callback();
        }
      }, function(sender, args) {
        _Toast.showToast({
          message: "Error during deleting. Please refresh the page and try again.</br><span>Error message: <i>" + args.get_message() + "</i></span>",
          duration: 0
        });
        CLog.e("DeleteItem.deleteItem", "Request failed. " + args.get_message() + '\n' + args.get_stackTrace());
      });

    }

    self.init = function() {
      $(function() {
        $.contextMenu({
          selector: _s.Ids.deleteContextMenu,
          callback: function(key, options) {
            if (key !== "cancel") {
              _currentItemId = $(this).closest("tr").attr("id").replace(_s.rowIdPrefix, "");
              showConfirmationPopup();
            }
          },
          items: {
            "delete": {
              name: "Delete",
              icon: "delete"
            },
            "sep1": "---------",
            "cancel": {
              name: "Cancel",
              icon: "quit"
            }
          }
        });
      });

      _listeners.init();
    }

  }

  /** @type {DeleteItem} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new DeleteItem(params);
      }
      return _instance;
    }
  };
})();
