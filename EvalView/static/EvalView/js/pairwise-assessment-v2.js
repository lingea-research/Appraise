var COMMENT_CONFIG = {
  field: null,
  section: null,
  buttonsContainer: null,
  required: false,
};

var QUICK_COMMENT_PRESETS = window.PAIRWISE_QUICK_COMMENTS;
if (!Array.isArray(QUICK_COMMENT_PRESETS) || !QUICK_COMMENT_PRESETS.length) {
  QUICK_COMMENT_PRESETS = [
    { name: 'sensitive', text: 'the text is politically, ethically, or socially sensitive' },
    { name: 'missing context', text: 'the example is missing context to properly evaluate' },
    { name: 'challenging', text: 'this source text is particularly challenging to translate' },
    { name: 'issues with source', text: 'there are issues with the source text' },
    { name: 'partially translated', text: 'the translation does not include all information from the source text' },
    { name: 'overtranslated', text: 'the translation includes excessive or unnecessary text' },
    { name: 'hallucinations', text: 'the translation includes hallucinated, repeated or non-sense text' },
    { name: 'critical error', text: 'the candidate contains a critical error' },
    { name: 'terminology', text: 'terminology was not properly translated' },
    { name: 'not fluent', text: 'the translation is not fluent' },
    { name: 'locale conventions', text: 'locale-specific conventions are not respected' },
    { name: 'units', text: 'incorrectly localized or converted units/measurements' },
    { name: 'style', text: 'the translation has style issues' },
    { name: 'gender', text: 'the translation uses incorrect gender' },
    { name: 'bad idioms', text: 'idioms were incorrectly or too literally translated' },
  ];
}

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

function get_metadata_field() {
  return $('input[name="metadata"]');
}

function read_metadata() {
  var metadataField = get_metadata_field();
  if (!metadataField.length) {
    return {};
  }
  var raw = metadataField.val();
  if (!raw) {
    return {};
  }
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return parsed;
  } catch (error) {
    return {};
  }
}

function write_metadata(metadata) {
  var metadataField = get_metadata_field();
  if (!metadataField.length) {
    return;
  }

  var cleaned = {};
  $.each(metadata || {}, function(key, value) {
    if (value === undefined || value === null) {
      return;
    }
    if (typeof value === 'string') {
      var trimmed = value.trim();
      if (!trimmed) {
        return;
      }
      cleaned[key] = trimmed;
      return;
    }
    cleaned[key] = value;
  });

  if (Object.keys(cleaned).length === 0) {
    metadataField.val('{}');
  } else {
    metadataField.val(JSON.stringify(cleaned));
  }
}

function set_metadata_preference(preferenceLabel) {
  var metadata = read_metadata();
  if (preferenceLabel) {
    metadata.preference = preferenceLabel;
  } else {
    delete metadata.preference;
  }
  write_metadata(metadata);
}

function set_metadata_comment(commentText) {
  var metadata = read_metadata();
  if (commentText && commentText.trim()) {
    metadata.comment = commentText.trim();
  } else {
    delete metadata.comment;
  }
  write_metadata(metadata);
}

function comment_contains_phrase(field, phrase) {
  if (!field || !field.length) {
    return false;
  }
  var currentValue = field.val() || '';
  return currentValue.toLowerCase().indexOf((phrase || '').toLowerCase()) !== -1;
}

function append_quick_comment(field, phrase) {
  if (!field || !field.length || !phrase) {
    return;
  }

  if (comment_contains_phrase(field, phrase)) {
    return;
  }

  var existing = field.val() || '';
  var updated = existing;
  if (existing.trim().length === 0) {
    updated = phrase;
  } else {
    if (!/\n\s*$/.test(existing)) {
      updated = existing.replace(/\s+$/, '') + '\n' + phrase;
    } else {
      updated = existing + phrase;
    }
  }
  field.val(updated);
  field.trigger('input');
}

function update_quick_comment_states(container, field) {
  if (!container || !container.length || !field || !field.length) {
    return;
  }
  var currentValue = (field.val() || '').toLowerCase();
  container.find('[data-quick-comment-button]').each(function() {
    var button = $(this);
    var phrase = (button.data('quick-comment-text') || '').toString().toLowerCase();
    var isPresent = phrase && currentValue.indexOf(phrase) !== -1;
    button.toggleClass('active', isPresent);
    button.attr('aria-pressed', isPresent ? 'true' : 'false');
  });
}

function sync_comment_metadata() {
  if (!COMMENT_CONFIG.field || !COMMENT_CONFIG.field.length) {
    return;
  }
  set_metadata_comment(COMMENT_CONFIG.field.val());
  if (COMMENT_CONFIG.buttonsContainer && COMMENT_CONFIG.buttonsContainer.length) {
    update_quick_comment_states(COMMENT_CONFIG.buttonsContainer, COMMENT_CONFIG.field);
  }
}

function initialize_comment_field() {
  var section = $('[data-comment-section]');
  var field = $('#comment-field');
  var buttonsContainer = $('[data-quick-comments]');

  COMMENT_CONFIG.section = section;
  COMMENT_CONFIG.field = field.length ? field : null;
  COMMENT_CONFIG.buttonsContainer = buttonsContainer;
  COMMENT_CONFIG.required = false;

  if (!section.length || !field.length) {
    return COMMENT_CONFIG;
  }

  var requiredAttr = section.data('comments-required');
  COMMENT_CONFIG.required = requiredAttr === true || requiredAttr === 'true';

  var existingMetadata = read_metadata();
  if (existingMetadata.comment && !field.val()) {
    field.val(existingMetadata.comment);
  }

  field.on('input change blur', function() {
    sync_comment_metadata();
  });

  sync_comment_metadata();
  return COMMENT_CONFIG;
}

function initialize_quick_comments() {
  if (!COMMENT_CONFIG.buttonsContainer || !COMMENT_CONFIG.buttonsContainer.length || !COMMENT_CONFIG.field) {
    return;
  }

  var container = COMMENT_CONFIG.buttonsContainer;
  var field = COMMENT_CONFIG.field;
  container.empty();

  QUICK_COMMENT_PRESETS.forEach(function(preset) {
    if (!preset || !preset.name || !preset.text) {
      return;
    }
    var button = $('<button type="button" class="quick-comment-button"></button>');
    button.text(preset.name);
    button.attr('data-quick-comment-button', 'true');
    button.attr('data-quick-comment-text', preset.text);
    button.attr('aria-pressed', 'false');
    button.on('click', function(event) {
      event.preventDefault();
      append_quick_comment(field, preset.text);
      sync_comment_metadata();
    });
    container.append(button);
  });

  update_quick_comment_states(container, field);
}

function set_diff_mode(mode)
{
  var showDiff = mode === 'show';
  var candidateTexts = $('.candidate-text');
  if (candidateTexts.length) {
    if (showDiff) {
      candidateTexts.addClass('active');
    } else {
      candidateTexts.removeClass('active');
    }
  }

  var diffButtons = $('[data-diff-choice]');
  diffButtons.each(function() {
    var button = $(this);
    var isActive = button.data('diff-choice') === (showDiff ? 'show' : 'hide');
    button.toggleClass('active', isActive);
    button.attr('aria-pressed', isActive ? 'true' : 'false');
  });

  if (typeof Cookies !== 'undefined') {
    Cookies.set('show-diff', showDiff ? 'yes' : 'no', { sameSite: 'strict' });
  }
}

function initialize_diff_controls()
{
  var diffButtons = $('[data-diff-choice]');
  var storedPreference = typeof Cookies !== 'undefined' ? Cookies.get('show-diff') : null;
  var initialMode = storedPreference === 'no' ? 'hide' : 'show';

  if (diffButtons.length) {
    diffButtons.on('click', function(event) {
      event.preventDefault();
      var choice = $(this).data('diff-choice');
      set_diff_mode(choice === 'hide' ? 'hide' : 'show');
    });
  }

  set_diff_mode(initialMode);
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
    section.addClass('preference-locked');
    set_preference_radio('A>>B');
    set_metadata_preference('A>>B');
    if (status.length) {
      status.text('Preference locked: Candidate A scored higher.');
    }
  } else if (score2 > score1) {
    fieldset.prop('disabled', true);
    section.addClass('preference-locked');
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
  set_diff_mode(isActive ? 'hide' : 'show');
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
  write_metadata({});
  var preferenceFieldset = $('#preference-fieldset');
  if (preferenceFieldset.length) {
    preferenceFieldset.find('input[type="radio"]').prop('checked', false);
  }
  if (COMMENT_CONFIG.field && COMMENT_CONFIG.field.length) {
    COMMENT_CONFIG.field.val('');
  }
  sync_comment_metadata();
  update_preference_ui();
}

function validate_form()
{
  sync_comment_metadata();
  var score1 = $('input[name="score"]');
  var score2 = $('input[name="score2"]');
  if (score1.val() == -1 || (score2.length && score2.val() == -1))
  {
    alert('Please score all candidate sentences. Thanks!');
    return false;
  }

  if (COMMENT_CONFIG.required) {
    var commentField = COMMENT_CONFIG.field;
    if (!commentField || !commentField.val() || !commentField.val().trim()) {
      alert('Please provide a comment before submitting. Thanks!');
      return false;
    }
  }

  var hasPreference = $('#preference-fieldset').length > 0;
  if (hasPreference) {
    var metadata = read_metadata();
    if (!metadata.preference) {
      alert('Please record your preference before submitting. Thanks!');
      return false;
    }
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

  var availableOrientations = ['vertical', 'stacked', 'horizontal'];
  var availableWidths = ['narrow', 'wide'];
  var orientationKey = 'pairwise_v2_orientation';
  var widthKey = 'pairwise_v2_width';
  var HORIZONTAL_MIN_WIDTH = 1000;
  var preferredOrientation = availableOrientations[0];

  function getViewportWidth() {
    return window.innerWidth || document.documentElement.clientWidth || $(window).width() || 0;
  }

  function applyOrientation(preferred) {
    var requested = availableOrientations.indexOf(preferred) >= 0 ? preferred : availableOrientations[0];
    var viewportWidth = getViewportWidth();
    var effective = requested;

    if (requested === 'horizontal' && viewportWidth < HORIZONTAL_MIN_WIDTH) {
      effective = 'stacked';
    }

    layoutContainer.attr('data-orientation', effective);
    assessmentForm.attr('data-orientation', effective);

    layoutButtons.each(function() {
      var button = $(this);
      var choice = button.data('orientation-choice');
      var isActive = choice === effective;
      var shouldDisable = choice === 'horizontal' && viewportWidth < HORIZONTAL_MIN_WIDTH;

      button.toggleClass('active', isActive);
      button.attr('aria-pressed', isActive ? 'true' : 'false');
      button.prop('disabled', shouldDisable);
      button.toggleClass('disabled', shouldDisable);

      if (shouldDisable) {
        button.attr('aria-disabled', 'true');
      } else {
        button.removeAttr('aria-disabled');
      }
    });

    return effective;
  }

  function setOrientation(mode) {
    preferredOrientation = availableOrientations.indexOf(mode) >= 0 ? mode : availableOrientations[0];

    if (typeof Cookies !== 'undefined') {
      Cookies.set(orientationKey, preferredOrientation, { sameSite: 'strict' });
    }

    applyOrientation(preferredOrientation);
  }

  function setWidth(mode) {
    var width = availableWidths.indexOf(mode) >= 0 ? mode : availableWidths[0];
    layoutContainer.attr('data-width', width);
    assessmentForm.attr('data-width', width);

    if (mainContainer.length) {
      if (width === 'wide') {
        mainContainer.addClass('container-wide');
      } else {
        mainContainer.removeClass('container-wide');
      }
    }

    if (widthButtons.length) {
      widthButtons.each(function() {
        var button = $(this);
        var isActive = button.data('width-choice') === width;
        button.toggleClass('active', isActive);
        button.attr('aria-pressed', isActive ? 'true' : 'false');
      });
    }

    if (typeof Cookies !== 'undefined') {
      Cookies.set(widthKey, width, { sameSite: 'strict' });
    }
  }

  layoutButtons.on('click', function(event) {
    event.preventDefault();
    if ($(this).prop('disabled')) {
      return;
    }
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

  var storedWidth = typeof Cookies !== 'undefined' ? Cookies.get(widthKey) : null;
  setWidth(storedWidth);

  function handleResize() {
    applyOrientation(preferredOrientation);
  }

  $(window).on('resize orientationchange', handleResize);
}

$(document).ready(function() {
  initialize_layout_controls();
  initialize_diff_controls();
  initialize_comment_field();
  initialize_quick_comments();
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

  $('#guidelines-modal').modal('show');

  sync_comment_metadata();
  update_preference_ui();
});
