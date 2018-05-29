var $ = jQuery.noConflict();

$(document).ready(function() {
  NSMain.init();

  // Needed to include content.html file
  w3.includeHTML();

  NSMain.WindowLoad.webPartsLoaded(function() {
    NSMain.MiscFunctions.preparePlaceholders();
    NSMain.MiscFunctions.adjustShadows();
    NSMain.MiscFunctions.updateTitle(NSMain.Constants.pageTitle);
    NSMain.MiscFunctions.disableSPFormSubmits();
    NSItems.init();
  });
});

/**
 * @description Returns a deep clone of the passed object
 * @param  {Object} obj
 * @return {Object} 
 */
function clone(obj) {
  if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
    return obj;

  if (obj instanceof Date)
    var temp = new obj.constructor(); //or new Date(obj);
  else
    var temp = obj.constructor();

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      obj['isActiveClone'] = null;
      temp[key] = clone(obj[key]);
      delete obj['isActiveClone'];
    }
  }

  return temp;
}
