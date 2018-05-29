Array.prototype.remove = function() {
  var what, a = arguments,
    L = a.length,
    ax;
  while (L && this.length) {
    what = a[--L];
    while ((ax = this.indexOf(what)) !== -1) {
      this.splice(ax, 1);
    }
  }
  return this;
};

Array.prototype.sortNumbers = function() {
  this.sort(function sortNumber(a, b) {
    return a - b;
  });
  return this;
};

Array.prototype.contains = function(value) {
  return this.indexOf(value) > -1;
};
