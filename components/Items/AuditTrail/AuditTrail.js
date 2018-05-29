AuditTrail = (function() {
  function AuditTrail(params) {

    /* Dependencies */
    var _Constants = NSMain.Constants;
    var _PopupWindow = NSMain.PopupWindow;
    var _MiscFunctions = NSMain.MiscFunctions;
    var _Users = NSMain.Users;

    var self = this;

    /*
     * Setting the constructor to null to prevent a new object creation by calling
     * the constructor of the instance. This is needed to make the instance strictly
     * a singleton.
     */
    self.constructor = null;

    /* Private Variables */
    var _listId = "";

    var _itemId = "";

    var _fields = {
      "ID": "text",
      "ItemID": "text",
      "Changes": "text",
      "eLN": "text",
      "Created": "datetime",
      "User": "person_lookup"
    }

    var _s = {
      Ids: {
        auditTrailTable: "#audit-trail-table",
        auditTrailChangesTd: ".audit-trail-changes-td",
        auditTrailChangesText: ".audit-trail-changes-text",
        newItemTitle: "#new-item-title-text"
      }
    }

    /*-------------------------------------- Private Functions --------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    function prepAuditPopup(results) {
      var contentHtml = "<table id='" + _s.Ids.auditTrailTable.slice(1) + "' class='" + _Constants.Ids.scrollableTable.slice(1) + "'>";

      // Table head
      contentHtml += "<thead>";
      // Header cells with title texts
      contentHtml += "<tr>";
      contentHtml += "<th>Version</th>";
      contentHtml += "<th class='" + _s.Ids.auditTrailChangesTd.slice(1) + "'>Changes</th>";
      contentHtml += "<th>User</th>";
      contentHtml += "<th>Date</th>";
      contentHtml += "<th>eLN</th>";
      contentHtml += "<th></th>"; // Empty cell is needed for scrollbar
      contentHtml += "</tr>";
      // Header shadow row
      contentHtml += "<tr class='shadow'><th></th></tr>";
      contentHtml += "</thead>";

      // Table body
      contentHtml += "<tbody>";

      var version = Object.keys(results).length;

      for (var id in results) {
        if (!results.hasOwnProperty(id))
          continue;
        var changes = results[id]["Changes"];
        var eLN = results[id]["eLN"] !== null ? results[id]["eLN"] : "N/A";
        contentHtml += "<tr>";
        version--;

        // Version number
        contentHtml += "<td title='" + version + "'>";
        contentHtml += "<span>" + version + "</span>";
        contentHtml += "</td>";

        var changesHtml = "";
        var changesHintText = "";
        if (version === 0) {
          changesHtml += "<div id='" + _s.Ids.newItemTitle.slice(1) + "'>New Item</div>";
          changesHintText += "New item was added with values: ";
        }

        for (var fieldName in changes) {
          if (!changes.hasOwnProperty(fieldName))
            continue;

          changesHtml += "<div>";
          changesHtml += "<b>" + fieldName + ": </b>";

          if (version === 0) {
            changesHintText += fieldName + ": '" + changes[fieldName]["NewValue"] + "'; ";
          } else {
            changesHtml += "<span>Value changed from ";
            changesHtml += "'<span class='" + _s.Ids.auditTrailChangesText.slice(1) + "'>" + changes[fieldName]["OldValue"] + "</span>'";
            changesHtml += " to ";

            changesHintText += "Field '" + fieldName + "' was changed from '" + changes[fieldName]["OldValue"] + "' to '" + changes[fieldName]["NewValue"] + "'; ";
          }

          changesHtml += "'<span class='" + _s.Ids.auditTrailChangesText.slice(1) + "'>" + changes[fieldName]["NewValue"] + "</span>'";
          changesHtml += "</span>";
          changesHtml += "</div>";

        }

        contentHtml += "<td class='" + _s.Ids.auditTrailChangesTd.slice(1) + "' title='" + _MiscFunctions.escapeHtml(changesHintText.slice(0, -2)) + "'>";
        contentHtml += changesHtml;
        contentHtml += "</td>";

        contentHtml += "<td title='" + results[id]["User"] + "'>";
        contentHtml += "<span>" + results[id]["User"] + "</span>";
        contentHtml += "</td>";

        var dateHtml = _MiscFunctions.datetime(results[id]["Created"]);

        contentHtml += "<td title='" + dateHtml + "'>";
        contentHtml += "<span>" + dateHtml + "</span>";
        contentHtml += "</td>";

        contentHtml += "<td title='" + eLN + "'>";
        contentHtml += "<span>" + eLN + "</span>";
        contentHtml += "</td>";

        contentHtml += "</tr>";
      }

      contentHtml += "</tbody>";
      contentHtml += "</table>";

      _PopupWindow.show({
        content: contentHtml,
        title: "Audit Trail for " + _itemId,
        width: "96",
        height: "96"
      });
    }

    /*-------------------------------------- Public Functions ---------------------------------------*/
    /*↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓*/

    /**
     * @description Performs the API query to get the audit trail for a given item
     * @param  {number}   itemId                Item's ID for which the audit trail to be fetched
     * @param  {Function} [options.callback]    Callback function called when AJAX is complete
     */
    self.getAuditTrail = function(itemId, options) {
      options = options !== undefined ? options : {};
      _itemId = itemId;

      var apiBaseUrl = "_api/web/lists/getbytitle('" + _Constants.auditTrailListName + "')/items";
      var apiQueryUrl = "?$select=";

      // Might or might not be used depending on if there are any person lookup fields in _fields object
      var personLookupQuery = "*&$expand=";

      // Looping through all the fields and adding them to the query
      for (var field in _fields) {
        if (!_fields.hasOwnProperty(field))
          continue;

        if (_fields[field] === "person_lookup") {
          personLookupQuery += field + ",";
          apiQueryUrl += field + "/Title,"; // By default the user title is requested for a person lookup field
        } else {
          apiQueryUrl += field + ",";
        }
      }

      if (personLookupQuery !== "*&$expand=") { // If there is a person lookup field present, personLookupQuery would be different than its default value of "*&$expand="
        apiQueryUrl += personLookupQuery.slice(0, -1); // Removing the extra comma at the end
      } else {
        apiQueryUrl = apiQueryUrl.slice(0, -1); // Removing the extra comma at the end
      }

      apiQueryUrl += "&$filter=(ItemID eq " + itemId + ")"; // Getting the audit trail for the requested item only using its provided ID
      apiQueryUrl += "&$orderby=ID desc"; // Returning the most recent entries first

      var returnObj = {};

      $.ajax({
        url: _Constants.siteUrl + apiBaseUrl + apiQueryUrl,
        method: "GET",
        headers: {
          "Accept": "application/json; odata=verbose"
        },
        success: function(data) {
          // Iterating through all the items in returned data
          for (var id in data.d.results) {
            if (!data.d.results.hasOwnProperty(id))
              continue;

            returnObj[id] = {};
            returnObj[id]['ID'] = data.d.results[id]['ID'];
            returnObj[id]['ItemID'] = data.d.results[id]['ItemID'];
            returnObj[id]['Changes'] = JSON.parse(data.d.results[id]['Changes']);
            returnObj[id]['eLN'] = data.d.results[id]['eLN'];
            returnObj[id]['Created'] = data.d.results[id]['Created'];
            returnObj[id]['User'] = data.d.results[id]['User']['Title'];
          }

          prepAuditPopup(returnObj);
        },
        error: function(data) {
          CLog.e("AudtiTrail.getAuditTrail", data);
        }
      }).done(function() {
        if (options.callback !== undefined) {
          options.callback(returnObj);
        }
      });
    };

    /**
     * @param  {Object}   items           Object containing all the changed fields with their old and new values.
     *                                    There can be multiple items with their respected changes grouped under their respective IDs.
     *                                    Example structure:
     *                                      {
     *                                        "43": {
     *                                          "old": {
     *                                            "Name": "this is old name",
     *                                            "Notebook": "eLN Number 1234",
     *                                          },
     *                                          "new": {
     *                                            "Name": "this is new name",
     *                                            "Notebook": "eLN Number 4567",
     *                                          }
     *                                        },
     *                                        "46": {
     *                                          "old": {
     *                                            "RackNo": "1",
     *                                            "Notebook": "eLN Number 1234",
     *                                          },
     *                                          "new": {
     *                                            "RackNo": "3",
     *                                            "Notebook": "eLN Number 4567",
     *                                          }
     *                                        }
     *                                      }
     *
     * @param  {Object}   [elnReferences] Object containing eLN references for the changes. This is an optional parameter.
     *                                    Example structure:
     *                                      {
     *                                        "43": "eLN Reference 1234",
     *                                        "46": "eLN Reference 1456"
     *                                      }
     *
     * @param  {Function} [callback]      Callback function
     */
    self.updateAuditTrail = function(items, elnReferences, callback) {
      elnReferences = elnReferences !== undefined ? elnReferences : {};

      var clientContext = new SP.ClientContext(Constants.siteUrl);
      var oList = clientContext.get_web().get_lists().getByTitle(_Constants.auditTrailListName);

      // Iterating through all the items in 'items' object
      for (var id in items) {
        if (!items.hasOwnProperty(id))
          continue;

        var itemCreateInfo = new SP.ListItemCreationInformation();
        var oListItem = oList.addItem(itemCreateInfo);

        var changedFields = {};

        // Iterating through all the fields for each item (using their IDs)
        for (var field in items[id]["new"]) {
          if (!items[id]["new"].hasOwnProperty(field))
            continue;

          if (field.contains("date")) {
            items[id]["new"][field] = _MiscFunctions.date(items[id]["new"][field]);
            if (items[id]["new"][field] === _MiscFunctions.date(_Constants.defaultTime)) {
              items[id]["new"][field] = "N/A";
            }
          }

          changedFields[field] = {};
          changedFields[field]["OldValue"] = items[id]["old"][field];
          changedFields[field]["NewValue"] = items[id]["new"][field];
        }

        oListItem.set_item("ItemID", id);
        oListItem.set_item("User", _Users.getCurrentUserId());
        oListItem.set_item("Changes", JSON.stringify(changedFields));

        elnReferences[id] = elnReferences[id] !== undefined ? elnReferences[id] : "N/A";
        oListItem.set_item("eLN", elnReferences[id]);

        oListItem.update();
        clientContext.load(oListItem);
      }

      clientContext.executeQueryAsync(function() {
        if (callback !== undefined) {
          callback();
        }
      }, function(sender, args) {
        CLog.e("AuditTrail.updateAuditTrail", "Request failed. " + args.get_message() + '\n' + args.get_stackTrace());
      });
    }
  }

  /** @type {AuditTrail} */
  var _instance = null;

  return {
    getInstance: function(params) {
      if (_instance === null) {
        _instance = new AuditTrail(params);
      }
      return _instance;
    }
  };
})();
