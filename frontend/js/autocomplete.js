/* ═══════════════════════════════════════════════════════════════
   autocomplete.js – Location Input Suggestions
═══════════════════════════════════════════════════════════════ */
window.SheRoutes = window.SheRoutes || {};

SheRoutes.Autocomplete = (function () {
  let activeDropdown = null;
  const DEBOUNCE_MS = 350;
  const timers = {};

  function init() {
    setupField('source-input', 'source-dropdown');
    setupField('dest-input', 'dest-dropdown');

    // Close dropdowns on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.input-wrapper')) closeAll();
    });

    // Keyboard navigation
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeAll();
    });
  }

  function setupField(inputId, dropdownId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    input.addEventListener('input', () => {
      clearTimeout(timers[inputId]);
      const val = input.value.trim();
      if (val.length < 2) { close(dropdown); return; }

      timers[inputId] = setTimeout(() => {
        fetchSuggestions(val, dropdown, input);
      }, DEBOUNCE_MS);
    });

    input.addEventListener('focus', () => {
      if (input.value.trim().length >= 2) {
        fetchSuggestions(input.value.trim(), dropdown, input);
      }
    });

    input.addEventListener('keydown', e => {
      handleKeyNav(e, dropdown, input);
    });
  }

  async function fetchSuggestions(query, dropdown, input) {
    try {
      // Try Google Places first if available
      if (window.google && google.maps && google.maps.places && !window.MAPS_DEMO_MODE) {
        fetchGoogleSuggestions(query, dropdown, input);
        return;
      }

      // Backend autocomplete
      const data = await SheRoutes.API.autocomplete(query);
      const predictions = data.predictions || [];
      renderDropdown(predictions.map(p => p.description), dropdown, input);

    } catch (err) {
      console.warn('Autocomplete error:', err.message);
      renderDropdown([], dropdown, input);
    }
  }

  function fetchGoogleSuggestions(query, dropdown, input) {
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: query }, (predictions, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        renderDropdown(predictions.map(p => p.description), dropdown, input);
      } else {
        close(dropdown);
      }
    });
  }

  function renderDropdown(items, dropdown, input) {
    if (!items || items.length === 0) { close(dropdown); return; }

    dropdown.innerHTML = '';
    items.slice(0, 5).forEach((text, i) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.setAttribute('role', 'option');
      item.setAttribute('tabindex', '-1');
      item.setAttribute('aria-selected', 'false');
      item.textContent = text;
      item.dataset.index = i;

      item.addEventListener('click', () => {
        input.value = text;
        close(dropdown);
        // Trigger input event so app knows value changed
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });

      item.addEventListener('mouseenter', () => {
        clearActive(dropdown);
        item.classList.add('active');
      });

      dropdown.appendChild(item);
    });

    open(dropdown);
    activeDropdown = dropdown;
  }

  function handleKeyNav(e, dropdown, input) {
    if (!dropdown.classList.contains('open')) return;
    const items = dropdown.querySelectorAll('.autocomplete-item');
    const curr = dropdown.querySelector('.autocomplete-item.active');
    let idx = curr ? parseInt(curr.dataset.index) : -1;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      idx = Math.min(idx + 1, items.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      idx = Math.max(idx - 1, 0);
    } else if (e.key === 'Enter') {
      if (curr) {
        e.preventDefault();
        input.value = curr.textContent;
        close(dropdown);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    } else {
      return;
    }

    clearActive(dropdown);
    if (items[idx]) {
      items[idx].classList.add('active');
      items[idx].setAttribute('aria-selected', 'true');
      items[idx].scrollIntoView({ block: 'nearest' });
      input.value = items[idx].textContent;
    }
  }

  function open(dropdown) {
    dropdown.classList.add('open');
  }

  function close(dropdown) {
    if (dropdown) dropdown.classList.remove('open');
  }

  function closeAll() {
    document.querySelectorAll('.autocomplete-dropdown').forEach(d => d.classList.remove('open'));
  }

  function clearActive(dropdown) {
    dropdown.querySelectorAll('.autocomplete-item').forEach(i => {
      i.classList.remove('active');
      i.setAttribute('aria-selected', 'false');
    });
  }

  return { init };
})();
