NSItems = (function() {
  var instance = {};

  instance.constructor = null;

  /** @type {NewItem} */
  instance.NewItem = {};

  /** @type {ItemUpdates} */
  instance.ItemUpdates = {};

  /** @type {InventoryTable} */
  instance.InventoryTable = {};

  /** @type {Search} */
  instance.Search = {};

  /** @type {AuditTrail} */
  instance.AuditTrail = {};

  /** @type {Sort} */
  instance.Sort = {};

  /** @type {Filter} */
  instance.Filter = {};

  /** @type {DeleteItem} */
  instance.DeleteItem = {};

  instance.settings = {
    toastDuration: "", // Assigned in 'init' function
    fields: ["ID", "Name", "Notebook", "StorageAssetID", "RackNo", "BoxNo", "Analyst", "Date", "Quantity", "Notes"] // These field names have to match the SharePoint list field IDs (not the display names)
  }

  instance.init = function() {
    instance.settings.toastDuration = NSMain.Constants.toastShort;
    instance.AuditTrail = AuditTrail.getInstance(instance);
    instance.Search = Search.getInstance(instance);
    instance.Sort = Sort.getInstance(instance);
    instance.Filter = Filter.getInstance(instance);
    instance.InventoryTable = InventoryTable.getInstance(instance);
    instance.DeleteItem = DeleteItem.getInstance(instance);
    instance.NewItem = NewItem.getInstance(instance);
    instance.ItemUpdates = ItemUpdates.getInstance(instance);
    solveCircularDependencies();

    NSItems.InventoryTable.populateTable();
    NSItems.Search.init();
    NSItems.NewItem.init();
    NSItems.InventoryTable.init();
    NSItems.ItemUpdates.init();
  }

  function solveCircularDependencies() {
    instance.Search.solveCircularDependencies({
      NewItem: instance.NewItem,
      InventoryTable: instance.InventoryTable
    });

    instance.InventoryTable.solveCircularDependencies({
      NewItem: instance.NewItem,
      ItemUpdates: instance.ItemUpdates,
      DeleteItem: instance.DeleteItem
    });

    instance.Sort.solveCircularDependencies({
      InventoryTable: instance.InventoryTable
    });

    instance.Filter.solveCircularDependencies({
      InventoryTable: instance.InventoryTable
    });
  }

  return instance;
})();
