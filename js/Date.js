Date.prototype.getMonthName = function(lang) {
  lang = lang && (lang in Date.locale) ? lang : 'en';
  return Date.locale[lang].month_names[this.getMonth()];
};

Date.prototype.getMonthNameShort = function(lang) {
  lang = lang && (lang in Date.locale) ? lang : 'en';
  return Date.locale[lang].month_names_short[this.getMonth()];
};

Date.locale = {
  en: {
    month_names: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    month_names_short: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  }
};

Date.prototype.addDays = function(days) {
  var dat = new Date(this.valueOf());
  dat.setDate(dat.getDate() + days);
  return dat;
}

Date.prototype.fixUTCDateOffset = function() {
  var date = new Date(this.valueOf());
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
  return date;
}
