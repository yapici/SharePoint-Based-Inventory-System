// This is called after all the resources in the page are loaded and all the JS elements are initiated
$(window).on('load', function() {
  NSMain.Spinner.hide();
  NSMain.GrayOut.hideGrayOut();
  NSMain.Users.init();
  CLog.todo("Filter", "Add a date range filter option");
  CLog.todo("Search", "Add Author and Modified fields to search");
  CLog.todo("Search", "Add search instructions");
  CLog.todo("New Feature", "Might want to add a delete function for items, maybe via a right click context menu");
});
