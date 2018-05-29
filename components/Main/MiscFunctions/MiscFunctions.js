MiscFunctions = (function() {

  function updateTitle(title) {
    document.title = title;
  }

  function adjustShadows() {
    var shadow = $(".shadow");
    shadow.each(function() {
      var currentShadow = $(this);
      if (currentShadow.is("tr")) {
        currentShadow.find('th').attr('colspan', currentShadow.parent().find("tr:first-child th").length);
      }
    });
  }

  function preparePlaceholders() {

    var fontFamily = $('html').css('font-family');

    $(function() {
      $('html').on('focus', '[placeholder]', function() {
        var input = $(this);
        if (input.val() === input.attr('placeholder')) {
          input.val('');
          input.removeClass('placeholder');
          input.css('color', '#1C4D6F');
          input.css('font-family', fontFamily);
        }
      });

      $('html').on('blur', '[placeholder]', function() {
        var input = $(this);
        if (input.val() === '' || input.val() === input.attr('placeholder')) {
          input.addClass('placeholder');
          input.val(input.attr('placeholder'));
          input.css('color', '#aaaaaa');
          input.css('font-family', fontFamily);
        } else {
          input.css('color', '#1C4D6F');
          input.css('font-family', fontFamily);
        }
      });
    });

    $('[placeholder]').blur();
  }

  /**
   * @description This method disables all form submit buttons. This needs to be used
   * to prevent default SharePoint WebPart form submit when 'Enter' key is pressed in
   * any of the inputs in the page.
   */
  function disableSPFormSubmits() {
    $("input[type=submit]").attr('disabled', 'disabled');
  }

  /**
   * @description   Briefly shakes the jQuery element left and right
   * @param  {Object}   element     jQuery object for the HTML element
   * @param  {Function} [callback]  Callback function
   */
  function shakeElement(element, callback) {
    var l = 20;
    var duration = 50;
    var max = 10;

    for (var i = 0; i <= max; i++) {
      element.animate({
        'margin-left': '+=' + (l = -l) + 'px',
        'margin-right': '-=' + l + 'px'
      }, duration, resetMargins);
    }

    setTimeout(function() {
      if (callback !== undefined) {
        callback();
      }
    }, duration * max);

    function resetMargins() {
      element.css({
        'margin-left': '0px'
      });
      element.css({
        'margin-right': '0px'
      });
    }
  }

  /**
   * @description Replaces special characters with HTML safe codes
   */
  function escapeHtml(string) {
    var entityMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };

    return String(string).replace(/[&<>"'`=\/]/g, function(s) {
      return entityMap[s];
    });
  }

  function datetime(string) {
    var datetime = new Date(string);
    var returnDate = "N/A";

    if (datetime !== "Invalid Date" && !isNaN(datetime)) {
      var timezone = datetime.toLocaleTimeString('en-us', {
        timeZoneName: 'short'
      }).split(' ')[2];

      var returnDate = String.format("{0:yyyy}", datetime) + "-";
      returnDate += String.format("{0:MM}", datetime) + "-";
      returnDate += String.format("{0:dd}", datetime) + " ";
      returnDate += String.format("{0:T}", datetime) + " ";
      returnDate += timezone;
    }

    return returnDate;
  }

  /**
   * @description Converts the provided string into date with the format "DD MMM YYYY".
   *              If the string cannot be converted into a valid date, 'N/A' string is returned.
   * @param  {String} string Date string
   * @return {String}        Either date in format "DD MMM YYYY, or "N/A" string is returned
   */
  function date(string) {
    var datetime = new Date(string);
    var returnDate = "N/A";

    if (datetime !== "Invalid Date" && !isNaN(datetime)) {
      datetime = datetime.fixUTCDateOffset();
      var day = datetime.getDate();

      returnDate = day < 10 ? "0" + day : day;
      returnDate += " " + datetime.getMonthNameShort() + " ";
      returnDate += datetime.getFullYear();
    }

    return returnDate;
  }

  var pikaday = {
    objects: [],
    init: function() {
      var self = this;
      var currentObj = {};
      self.objects = [];

      $('.datepicker').each(function() {
        currentObj = new Pikaday({
          field: $(this).find('input')[0],
          defaultDate: "DD MMM YYYY", // Need to set this to prevent date format change in inputs
          onSelect: function(date) {
            var year = date.getFullYear();
            var month = date.getMonthNameShort();
            var day = date.getDate();
            day = day < 10 ? "0" + day : day;

            var formattedDate = day + " " + month + " " + year;
            this._o.field.value = formattedDate;

            var itemId = this._o.field.parentElement.parentElement.id;
            var fieldName = $(this._o.field.parentElement.outerHTML).attr("field-name");
            var input = $("#" + itemId).find("td[field-name='" + fieldName + "']").find("input");
            input.val(formattedDate);
          }
        });

        self.objects.push(currentObj);
      });
    },
    getObjects: function() {
      return this.objects;
    }
  }

  function isDate(value) {
    var datetime = new Date(value);
    if (datetime === "Invalid Date" || isNaN(datetime) || datetime.getFullYear().toString().length !== 4) {
      // Checking if entered value is in European format
      // Separators aren't important as parseDate method uses regular expression to extract numbers
      var parsedDate = new Date(parseDate(value, "dd/mm/yyyy"));
      if (parsedDate === "Invalid Date" || isNaN(parsedDate) || parsedDate.getFullYear().toString().length !== 4) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  // Reference: https://stackoverflow.com/a/2945150/1004334
  function parseDate(input, format) {
    format = format || 'yyyy-mm-dd'; // default format
    var parts = input.match(/(\d+)/g),
      i = 0,
      fmt = {};
    // extract date-part indexes from the format
    format.replace(/(yyyy|dd|mm)/g, function(part) {
      fmt[part] = i++;
    });
    var returnDate = "";

    try {
      returnDate = new Date(parts[fmt['yyyy']], parts[fmt['mm']] - 1, parts[fmt['dd']]);
    } catch (error) {
      returnDate = false;
      CLog.catch("MiscFunctions.parseDate", error);
    }
    return returnDate;
  }

  // Reference: https://stackoverflow.com/a/1184359/1004334
  function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
  }

  return {
    updateTitle: updateTitle,
    adjustShadows: adjustShadows,
    preparePlaceholders: preparePlaceholders,
    disableSPFormSubmits: disableSPFormSubmits,
    shakeElement: shakeElement,
    escapeHtml: escapeHtml,
    date: date,
    datetime: datetime,
    pikaday: pikaday,
    isDate: isDate,
    daysInMonth: daysInMonth
  }
})();
