String.prototype.hashCode = function() {
  var hash = 0,
    i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

/**
 * @description Example string provided: "newTestString"; returned string: "new-test-string"
 *              Reference: https://stackoverflow.com/a/34323600/1004334
 */
String.prototype.toLowerCaseWithDashes = function() {
  var string = this;
  string = string.replace(/([a-z])([A-Z])/g, '$1-$2');
  string = string.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
  return string.toLowerCase();
};

/**
 * @description Example string provided: "new-test-string"; returned string: "NewTestString"
 */
String.prototype.removeDashesAndCapitalize = function() {
  var frags = this.split('-');
  for (i = 0; i < frags.length; i++) {
    frags[i] = frags[i].charAt(0).toUpperCase() + frags[i].slice(1);
  }
  return frags.join('');
};

/**
 * @description Separates the camel case string with spaces. Example string provided: "StorageAssetID"; returned string: "Storage Asset ID"
 */
String.prototype.toSentenceCaseWithSpaces = function() {
  var string = this;
  string = string.replace(/([a-z])([A-Z])/g, '$1 $2');
  string = string.replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
  return string;
};

String.prototype.contains = function(value) {
  return this.toLowerCase().indexOf(value) >= 0;
};
