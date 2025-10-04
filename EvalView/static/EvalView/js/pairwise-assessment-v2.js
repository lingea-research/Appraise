function get_hidden_input(container) {
  var targetName = container.data('target-input');
  if (!targetName) {
    return $();
  }
  return $('input[name="' + targetName + '"]');
}

function set_hidden_score(container, score) {
  var hiddenInput = get_hidden_input(container);
  if (!hiddenInput.length) {
    return;
  }
  hiddenInput.val(score);
}

function update_active_state(container, radioInput) {
  var buttons = container.find('.btn-quality');
  buttons.removeClass('active');
  if (radioInput && radioInput.length) {
    radioInput.closest('.btn-quality').addClass('active');
  }
}

function set_selected_score(containerId, score, triggerChange) {
  var container = $('#' + containerId);
  if (!container.length) {
    return;
  }
  var radios = container.find('input[type="radio"]');
  var target = radios.filter(function() {
    return Number($(this).data('score')) === Number(score);
  }).first();
  if (!target.length) {
    return;
  }
  radios.prop('checked', false);
  target.prop('checked', true);
  update_active_state(container, target);
  if (triggerChange !== false) {
    target.trigger('change');
  } else {
    set_hidden_score(container, Number(score));
  }
}

function get_selected_score(containerId) {
  var container = $('#' + containerId);
  if (!container.length) {
    return null;
  }
  var checked = container.find('input[type="radio"]:checked');
  if (!checked.length) {
    return null;
  }
  return Number(checked.data('score'));
}

function set_metadata_preference(preferenceLabel) {
  var metadataField = $('input[name="metadata"]');
  if (!metadataField.length) {
    return;
  }
  if (!preferenceLabel) {
    metadataField.val('{}');
    return;
  }
  metadataField.val(JSON.stringify({ preference: preferenceLabel }));
}

function set_preference_radio(preferenceLabel) {
  var fieldset = $('#preference-fieldset');
  if (!fieldset.length) {
    return;
  }
  var radios = fieldset.find('input[name="preference"]');
  var target = radios.filter(function() {
    return $(this).val() === preferenceLabel;
  }).first();
  if (!target.length) {
    return;
  }
  if (!target.prop('checked')) {
    target.prop('checked', true);
  }
}

function update_preference_ui() {
  var fieldset = $('#preference-fieldset');
  if (!fieldset.length) {
    return;
  }

  var section = $('#preference-section');
  if (!section.length) {
    return;
  }

  var status = $('#preference-status');
  var labels = section.find('.preference-option');
  var radios = fieldset.find('input[name="preference"]');
  var extremeRadios = radios.filter('[data-preference-extreme="true"]');
  var score1 = get_selected_score('rating');
  var score2 = get_selected_score('rating2');

  section.removeClass('preference-ready preference-locked preference-inactive preference-extreme-a preference-extreme-b');
  labels.removeClass('preference-option--active preference-option--disabled');
  fieldset.prop('disabled', false);
  extremeRadios.prop('disabled', false);

  if (score1 === null || score2 === null) {
    fieldset.prop('disabled', true);
    section.addClass('preference-inactive');
    radios.prop('checked', false);
    set_metadata_preference(null);
    if (status.length) {
      status.text('Rate the quality of both candidates to unlock preference selection.');
    }
  } else if (score1 > score2) {
    fieldset.prop('disabled', true);
    section.addClass('preference-locked preference-extreme-a');
    set_preference_radio('A>>B');
    set_metadata_preference('A>>B');
    if (status.length) {
      status.text('Preference locked: Candidate A scored higher.');
    }
  } else if (score2 > score1) {
    fieldset.prop('disabled', true);
    section.addClass('preference-locked preference-extreme-b');
    set_preference_radio('A<<B');
    set_metadata_preference('A<<B');
    if (status.length) {
      status.text('Preference locked: Candidate B scored higher.');
    }
  } else {
    section.addClass('preference-ready');
    if (status.length) {
      status.text('Quality scores are equal. Choose the preference that best reflects your judgement.');
    }

    var currentChecked = radios.filter(':checked');
    if (currentChecked.length && currentChecked.is(extremeRadios)) {
      currentChecked.prop('checked', false);
    }

    extremeRadios.prop('disabled', true);

    var middleRadios = radios.not(extremeRadios);
    var checkedMiddle = middleRadios.filter(':checked').first();
    if (!checkedMiddle.length) {
      checkedMiddle = middleRadios.filter('[value="A=B"]').first();
      if (checkedMiddle.length) {
        checkedMiddle.prop('checked', true);
      }
    }

    if (checkedMiddle.length) {
      set_metadata_preference(checkedMiddle.val());
    } else {
      set_metadata_preference(null);
    }
  }

  var fieldsetDisabled = fieldset.prop('disabled');
  labels.each(function() {
    var input = $(this).find('input');
    if (input.prop('checked')) {
      $(this).addClass('preference-option--active');
    }
    if (input.prop('disabled') || fieldsetDisabled) {
      $(this).addClass('preference-option--disabled');
    }
  });
}

function toggle_context()
{
  var contextBlocks = $('.context-sentences');
  if (!contextBlocks.length) {
    return;
  }
  var referencePanel = $('.reference-panel').first();
  var referenceLabel = $('#reference-label').text();
  var wasHidden = contextBlocks.first().is(':hidden');
  contextBlocks.toggle(200);
  if (referencePanel.length) {
    referencePanel.attr('data-reference-label', wasHidden ? '' : referenceLabel);
  }
  Cookies.set('show-context', wasHidden ? 'yes' : 'no', { sameSite: 'strict' });
}

function toggle_diff()
{
    var isActive = $('.candidate-text').first().hasClass('active');
    if (isActive) {
        $('.candidate-text').removeClass('active');
    } else {
        $('.candidate-text').addClass('active');
    }
    Cookies.set('show-diff', isActive ? 'no' : 'yes', { sameSite: 'strict' });
}

function add_end_timestamp()
{
  $('input[name="end_timestamp"]').val(Date.now()/1000.0);
}

function reset_form()
{
  $('input[name="start_timestamp"]').val(Date.now()/1000.0);
  $('.quality-scale input[type="radio"]').prop('checked', false);
  $('.quality-scale .btn-quality').removeClass('active');
  $('input[name="score"]').val(-1);
  $('input[name="score2"]').val(-1);
  $('input[name="error1"]').prop("checked", false);
  $('input[name="error2"]').prop("checked", false);
  var metadataField = $('input[name="metadata"]');
  if (metadataField.length) {
    metadataField.val('{}');
  }
  var preferenceFieldset = $('#preference-fieldset');
  if (preferenceFieldset.length) {
    preferenceFieldset.find('input[type="radio"]').prop('checked', false);
  }
  update_preference_ui();
}

function validate_form()
{
  var score1 = $('input[name="score"]');
  var score2 = $('input[name="score2"]');
  if (score1.val() == -1 || (score2.length && score2.val() == -1))
  {
    alert('Please score all candidate sentences. Thanks!');
    return false;
  }

  var hasPreference = $('#preference-fieldset').length > 0;
  var metadataField = $('input[name="metadata"]');
  if (hasPreference && metadataField.length && metadataField.val() === '{}') {
    alert('Please record your preference before submitting. Thanks!');
    return false;
  }

  return true;
}

function match_ratings()
{
  var score1 = get_selected_score('rating');
  if (score1 === null) {
    return;
  }
  set_selected_score('rating2', score1);
  update_preference_ui();
}

function initialize_layout_controls()
{
  var layoutContainer = $('[data-layout-container]');
  var assessmentForm = $('[data-assessment-form]');
  var layoutButtons = $('[data-orientation-choice]');
  var widthButtons = $('[data-width-choice]');
  var mainContainer = $('.container[role="main"]');

  if (!layoutContainer.length || !assessmentForm.length || !layoutButtons.length) {
    return;
  }

  var availableOrientations = ['vertical', 'stacked'];
  var availableWidths = ['narrow', 'wide'];
  var orientationKey = 'pairwise_v2_orientation';
  var widthKey = 'pairwise_v2_width';

  function setOrientation(mode) {
    var orientation = availableOrientations.indexOf(mode) >= 0 ? mode : availableOrientations[0];
    layoutContainer.attr('data-orientation', orientation);
    assessmentForm.attr('data-orientation', orientation);

    layoutButtons.each(function() {
      var button = $(this);
      var isActive = button.data('orientation-choice') === orientation;
      button.toggleClass('active', isActive);
      button.attr('aria-pressed', isActive ? 'true' : 'false');
    });

    if (typeof Cookies !== 'undefined') {
      Cookies.set(orientationKey, orientation, { sameSite: 'strict' });
    }
  }

  function setWidth(mode) {
    if (!widthButtons.length) {
      return;
    }

    var width = availableWidths.indexOf(mode) >= 0 ? mode : availableWidths[0];

    if (mainContainer.length) {
      if (width === 'wide') {
        mainContainer.addClass('container-wide');
      } else {
        mainContainer.removeClass('container-wide');
      }
    }

    widthButtons.each(function() {
      var button = $(this);
      var isActive = button.data('width-choice') === width;
      button.toggleClass('active', isActive);
      button.attr('aria-pressed', isActive ? 'true' : 'false');
    });

    if (typeof Cookies !== 'undefined') {
      Cookies.set(widthKey, width, { sameSite: 'strict' });
    }
  }

  layoutButtons.on('click', function(event) {
    event.preventDefault();
    setOrientation($(this).data('orientation-choice'));
  });

  if (widthButtons.length) {
    widthButtons.on('click', function(event) {
      event.preventDefault();
      setWidth($(this).data('width-choice'));
    });
  }

  var storedOrientation = typeof Cookies !== 'undefined' ? Cookies.get(orientationKey) : null;
  setOrientation(storedOrientation);

  if (widthButtons.length) {
    var storedWidth = typeof Cookies !== 'undefined' ? Cookies.get(widthKey) : null;
    setWidth(storedWidth);
  }
}

$(document).ready(function() {
  initialize_layout_controls();
  $('input[name="start_timestamp"]').val(Date.now()/1000.0);

  var hiddenScore = $('input[name="score"]');
  if (hiddenScore.length) {
    hiddenScore.val(-1);
  }
  var hiddenScore2 = $('input[name="score2"]');
  if (hiddenScore2.length) {
    hiddenScore2.val(-1);
  }

  var qualityRadios = $('.quality-scale input[type="radio"]');
  qualityRadios.on('change', function() {
    var selectedScore = Number($(this).data('score'));
    if (isNaN(selectedScore)) {
      selectedScore = Number($(this).val());
    }
    var container = $(this).closest('.quality-scale');
    set_hidden_score(container, selectedScore);
    update_active_state(container, $(this));
    update_preference_ui();
  });

  $('.quality-scale').each(function() {
    var container = $(this);
    var hiddenInput = get_hidden_input(container);
    if (!hiddenInput.length) {
      return;
    }
    var existingScore = Number(hiddenInput.val());
    if (!isNaN(existingScore) && existingScore >= 0) {
      set_selected_score(container.attr('id'), existingScore, false);
    }
  });

  var preferenceRadios = $('input[name="preference"]');
  if (preferenceRadios.length) {
    preferenceRadios.on('change', function() {
      if ($('#preference-fieldset').prop('disabled')) {
        return;
      }
      set_metadata_preference($(this).val());
      update_preference_ui();
    });
  }

  if (qualityRadios.length) {
    qualityRadios.first().focus();
  }

  var referencePanel = $('.reference-panel').first();
  var referenceLabel = $('#reference-label').text();
  if (referencePanel.length && !referencePanel.attr('data-reference-label')) {
    referencePanel.attr('data-reference-label', referenceLabel);
  }

  if (Cookies.get('show-context') == 'yes') {
    $('.context-sentences').show();
    if (referencePanel.length) {
      referencePanel.attr('data-reference-label', '');
    }
  } else if (referencePanel.length) {
    referencePanel.attr('data-reference-label', referenceLabel);
  }

  if (Cookies.get('show-diff') != 'no') {
    $('.candidate-text').addClass('active');
  }

  $('#guidelines-modal').modal('show');

  update_preference_ui();
});
