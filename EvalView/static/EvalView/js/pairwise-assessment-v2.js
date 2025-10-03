document.addEventListener('DOMContentLoaded', function() {
  const Cookies = window.Cookies;
  const ORIENTATION_KEY = 'pairwise_v2_orientation';
  const WIDTH_KEY = 'pairwise_v2_width';
  const layoutContainer = document.querySelector('[data-layout-container]');
  const assessmentForm = document.querySelector('[data-assessment-form]');
  const layoutButtons = document.querySelectorAll('[data-orientation-choice]');
  const widthButtons = document.querySelectorAll('[data-width-choice]');
  const mainContainer = document.querySelector('.container[role="main"]');

  if (!layoutContainer || !assessmentForm || !layoutButtons.length) {
    return;
  }

  const availableOrientations = ['vertical', 'stacked'];
  const availableWidths = ['narrow', 'wide'];

  function setOrientation(mode) {
    const orientation = availableOrientations.includes(mode) ? mode : availableOrientations[0];
    layoutContainer.dataset.orientation = orientation;
    assessmentForm.dataset.orientation = orientation;

    layoutButtons.forEach(function(button) {
      const isActive = button.dataset.orientationChoice === orientation;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    Cookies.set(ORIENTATION_KEY, orientation, { sameSite: 'strict' });
  }

  const stored = Cookies.get(ORIENTATION_KEY);
  setOrientation(availableOrientations.includes(stored) ? stored : availableOrientations[0]);

  layoutButtons.forEach(function(button) {
    button.addEventListener('click', function(event) {
      event.preventDefault();
      setOrientation(button.dataset.orientationChoice);
    });
  });

  function setWidth(mode) {
    if (!widthButtons.length) {
      return;
    }
    const width = availableWidths.includes(mode) ? mode : availableWidths[0];

    if (mainContainer) {
      if (width === 'wide') {
        mainContainer.classList.add('container-wide');
      } else {
        mainContainer.classList.remove('container-wide');
      }
    }

    widthButtons.forEach(function(button) {
      const isActive = button.dataset.widthChoice === width;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    Cookies.set(WIDTH_KEY, width, { sameSite: 'strict' });
  }

  if (widthButtons.length) {
    const storedWidth = Cookies.get(WIDTH_KEY);
    setWidth(availableWidths.includes(storedWidth) ? storedWidth : availableWidths[0]);

    widthButtons.forEach(function(button) {
      button.addEventListener('click', function(event) {
        event.preventDefault();
        setWidth(button.dataset.widthChoice);
      });
    });
  }
});
