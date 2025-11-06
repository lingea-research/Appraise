(function(window, $) {
  'use strict';

  var DEFAULT_QUALITY_CLASSES = [
    'quality-option-1',
    'quality-option-2',
    'quality-option-3',
    'quality-option-4',
    'quality-option-5',
    'quality-option-6',
    'quality-option-7',
    'quality-option-8',
    'quality-option-9',
    'quality-option-10'
  ];
  var DEFAULT_UNSET_CLASS = 'quality-option-unset';
  var EPSILON = 0.000001;

  function toNumber(value, fallback) {
    var parsed = parseFloat(value);
    if (isNaN(parsed)) {
      return fallback;
    }
    return parsed;
  }

  function createStep(options) {
    if (!options.enabled) {
      return null;
    }
    var count = Number(options.valueCount);
    var min = toNumber(options.min, 0);
    var max = toNumber(options.max, 100);
    if (!count || count <= 1) {
      return 0;
    }
    var rawStep = (max - min) / (count - 1);
    return parseFloat(rawStep.toFixed(6));
  }

  function computeDiscreteValues(options) {
    if (!options.enabled) {
      return [];
    }
    var values = [];
    var count = Number(options.valueCount) || 0;
    var min = toNumber(options.min, 0);
    var max = toNumber(options.max, 100);
    if (count <= 0) {
      return values;
    }
    if (count === 1) {
      values.push(parseFloat(min.toFixed(4)));
      return values;
    }
    var step = options.step;
    if (typeof step !== 'number') {
      step = createStep(options);
    }
    for (var index = 0; index < count; index += 1) {
      var scalarValue = min + step * index;
      if (index === count - 1) {
        scalarValue = max;
      }
      values.push(parseFloat(scalarValue.toFixed(4)));
    }
    return values;
  }

  function ScalarSlider($element, options) {
    this.$element = $element;
    this.options = $.extend({
      enabled: false,
      valueCount: 10,
      min: 0,
      max: 100,
      step: null,
      hiddenInput: null,
      qualityClasses: DEFAULT_QUALITY_CLASSES.slice(),
      unsetClass: DEFAULT_UNSET_CLASS,
      sliderOptions: {},
      precision: 4,
      onValueChange: null
    }, options || {});

    if (this.options.step === null || typeof this.options.step === 'undefined') {
      this.options.step = createStep(this.options);
    }

    this.discreteValues = computeDiscreteValues(this.options);
    this.touched = false;
    this.$range = null;
    this.$handle = null;
    this.$hiddenInput = this.options.hiddenInput ? $(this.options.hiddenInput) : null;
  }

  ScalarSlider.prototype.init = function() {
    if (!this.$element || !this.$element.length) {
      return this;
    }

    var sliderOptions = $.extend({}, this.options.sliderOptions, {
      orientation: 'horizontal',
      range: 'min'
    });

    if (this.options.enabled) {
      sliderOptions.min = toNumber(this.options.min, 0);
      sliderOptions.max = toNumber(this.options.max, 100);
      sliderOptions.step = typeof this.options.step === 'number' ? this.options.step : createStep(this.options);
    }

    var self = this;
    sliderOptions.slide = function(event, ui) {
      self._onUpdate(event, ui);
    };
    sliderOptions.change = function(event, ui) {
      self._onUpdate(event, ui);
    };

    this.$element.slider(sliderOptions);
    this.$range = this.$element.find('.ui-slider-range');
    this.$handle = this.$element.find('.ui-slider-handle');
    this.$element.data('scalar-slider-instance', this);
    this.$element.data('slider-touched', false);
    this.applyQualityClass(this.$element.slider('value'));
    if (this.$hiddenInput && this.$hiddenInput.length) {
      this.$hiddenInput.val(-1);
    }
    return this;
  };

  ScalarSlider.prototype._onUpdate = function(event, ui) {
    var sliderValue = (ui && ui.value !== undefined) ? ui.value : this.$element.slider('value');
    var formattedValue = this.formatValue(sliderValue);

    if (this.options.enabled) {
      var currentValue = this.$element.slider('value');
      if (Math.abs(currentValue - formattedValue) > EPSILON) {
        this.$element.slider('option', 'value', formattedValue);
      }
    }

    if (event && event.originalEvent) {
      this.setTouched(true);
    }

    this.applyQualityClass(formattedValue);

    var storedValue = this.options.enabled ? Math.round(formattedValue) : formattedValue;
    this.updateHiddenInput(storedValue);

    if (typeof this.options.onValueChange === 'function') {
      this.options.onValueChange.call(this.$element, storedValue, formattedValue, this);
    }
  };

  ScalarSlider.prototype.snapValue = function(value) {
    if (!this.options.enabled || !this.discreteValues.length) {
      return value;
    }
    var closest = this.discreteValues[0];
    var smallestDiff = Math.abs(value - closest);
    for (var i = 1; i < this.discreteValues.length; i += 1) {
      var diff = Math.abs(value - this.discreteValues[i]);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = this.discreteValues[i];
      }
    }
    return closest;
  };

  ScalarSlider.prototype.formatValue = function(value) {
    var numericValue = toNumber(value, null);
    if (numericValue === null) {
      return value;
    }
    if (!this.options.enabled) {
      return numericValue;
    }
    var snapped = this.snapValue(numericValue);
    return parseFloat(snapped.toFixed(this.options.precision));
  };

  ScalarSlider.prototype.getQualityClass = function(value) {
    if (!this.options.enabled || !this.discreteValues.length) {
      return null;
    }
    var numericValue = toNumber(value, null);
    if (numericValue === null) {
      return null;
    }
    var closestIndex = 0;
    var smallestDiff = Math.abs(numericValue - this.discreteValues[0]);
    for (var i = 1; i < this.discreteValues.length; i += 1) {
      var diff = Math.abs(numericValue - this.discreteValues[i]);
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closestIndex = i;
      }
    }
    if (closestIndex >= this.options.qualityClasses.length) {
      closestIndex = this.options.qualityClasses.length - 1;
    }
    return this.options.qualityClasses[closestIndex] || null;
  };

  ScalarSlider.prototype.applyQualityClass = function(value) {
    if (!this.options.enabled || !this.$range || !this.$handle) {
      return;
    }

    var classList = this.options.qualityClasses.slice();
    classList.push(this.options.unsetClass);
    var classString = classList.join(' ');

    this.$range.removeClass(classString);
    this.$handle.removeClass(classString);

    if (!this.touched) {
      this.$range.addClass(this.options.unsetClass);
      this.$handle.addClass(this.options.unsetClass);
      return;
    }

    var qualityClass = this.getQualityClass(value);
    if (qualityClass) {
      this.$range.addClass(qualityClass);
      this.$handle.addClass(qualityClass);
    }
  };

  ScalarSlider.prototype.setTouched = function(touched) {
    this.touched = Boolean(touched);
    this.$element.data('slider-touched', this.touched);
  };

  ScalarSlider.prototype.updateHiddenInput = function(storedValue) {
    if (!this.$hiddenInput || !this.$hiddenInput.length) {
      return;
    }
    if (!this.touched) {
      this.$hiddenInput.val(-1);
      return;
    }
    this.$hiddenInput.val(storedValue);
  };

  ScalarSlider.prototype.reset = function() {
    var resetValue = this.options.enabled ? toNumber(this.options.min, 0) : 0;
    this.setTouched(false);
    this.$element.slider('option', 'value', resetValue);
    this.applyQualityClass(resetValue);
    this.updateHiddenInput(-1);
  };

  ScalarSlider.prototype.setValue = function(value, markTouched) {
    if (markTouched) {
      this.setTouched(true);
    }
    var formattedValue = this.formatValue(value);
    this.$element.slider('option', 'value', formattedValue);
    if (!markTouched) {
      // Ensure hidden input and styling are in sync even if no event fires
      this.applyQualityClass(formattedValue);
      var storedValue = this.options.enabled ? Math.round(formattedValue) : formattedValue;
      this.updateHiddenInput(storedValue);
    }
  };

  ScalarSlider.prototype.getValue = function() {
    return this.$element.slider('value');
  };

  ScalarSlider.prototype.getStoredValue = function() {
    if (this.$hiddenInput && this.$hiddenInput.length) {
      return toNumber(this.$hiddenInput.val(), -1);
    }
    var currentValue = this.getValue();
    if (!this.touched) {
      return -1;
    }
    return this.options.enabled ? Math.round(currentValue) : currentValue;
  };

  ScalarSlider.prototype.isTouched = function() {
    return this.touched;
  };

  ScalarSlider.prototype.focusHandle = function() {
    if (this.$handle && this.$handle.length) {
      this.$handle.focus();
    }
  };

  var ScalarSliderAPI = {
    create: function(element, options) {
      var $element = element instanceof $ ? element : $(element);
      if (!$element.length) {
        return null;
      }
      var existing = $element.data('scalar-slider-instance');
      if (existing) {
        return existing;
      }
      var instance = new ScalarSlider($element, options);
      return instance.init();
    },
    getInstance: function(element) {
      var $element = element instanceof $ ? element : $(element);
      if (!$element.length) {
        return null;
      }
      return $element.data('scalar-slider-instance') || null;
    }
  };

  window.Appraise = window.Appraise || {};
  window.Appraise.ScalarSlider = ScalarSliderAPI;
})(window, window.jQuery);
