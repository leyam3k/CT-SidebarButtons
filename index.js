import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "CT-SeparateChatInput";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default Settings
const defaultSettings = {
  buttonOrder: {}, // Map of elementID -> order (number)
  topBarHidden: false,
};

// Initialize Settings
function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  // Merge defaults
  for (const key in defaultSettings) {
    if (!Object.hasOwn(extension_settings[extensionName], key)) {
      extension_settings[extensionName][key] = defaultSettings[key];
    }
  }
}

// Save Settings
function saveSettings() {
  saveSettingsDebounced();
}

/**
 * Main Logic
 */
jQuery(async () => {
  // 1. Load Settings
  loadSettings();

  // 2. Load Settings HTML
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
  $("#extensions_settings").append(settingsHtml);

  // 3. Setup Layout
  const $form = $("#send_form");
  const $textarea = $("#send_textarea");

  // Ensure Placeholder exists for Hider Button
  if ($("#ct-sci-placeholder").length === 0) {
    $("#nonQRFormItems").append(
      '<div id="ct-sci-placeholder" class="interactable" title="TopBar Hider Placeholder"></div>',
    );
  }

  if ($form.length === 0 || $textarea.length === 0) {
    console.error(`${extensionName}: Required elements not found.`);
    return;
  }

  console.log(`${extensionName}: Initializing layout...`);

  // Apply main class
  $form.addClass("ct-separate-chat-input");

  // Create the Control Bar container
  let $controlBar = $("#ct-sci-control-bar");
  if ($controlBar.length === 0) {
    $controlBar = $('<div id="ct-sci-control-bar"></div>');
    $form.append($controlBar);
  }

  // Move Textarea to top (Prepend to form)
  // Note: CSS handles the visual ordering, but moving it in DOM ensures width behavior is consistent
  $form.prepend($textarea);

  /**
   * Function to identify and relocate buttons
   */
  const relocateButtons = () => {
    const settings = extension_settings[extensionName];
    const buttonOrder = settings.buttonOrder || {};

    // 1. Setup Groups
    // We create a "Right Group" to hold the Send button and its alternates (Stop, Impersonate, etc.)
    // This ensures they stay together and push to the right as a unit.
    let $rightGroup = $("#ct-sci-right-group");
    if ($rightGroup.length === 0) {
      $rightGroup = $('<div id="ct-sci-right-group"></div>');
      $controlBar.append($rightGroup);
    }

    // 2. Identify and Move Fixed/Grouped Buttons
    const $optionsBtn = $("#options_button");

    // List of buttons that belong in the Right Group (Send area)
    const rightGroupIds = [
      "send_but",
      "mes_stop",
      "mes_impersonate",
      "mes_continue",
      "stscript_continue",
      "stscript_pause",
      "stscript_stop",
    ];

    // Move Options Button (Left)
    if ($optionsBtn.parent().attr("id") !== "ct-sci-control-bar") {
      $controlBar.append($optionsBtn);
    }

    // Move Right Group Buttons
    rightGroupIds.forEach((btnId) => {
      const $btn = $(`#${btnId}`);
      if (
        $btn.length > 0 &&
        $btn.parent().attr("id") !== "ct-sci-right-group"
      ) {
        $rightGroup.append($btn);
      }
    });

    // 3. Identify and Move Dynamic Buttons
    // We look for interactable elements in the original containers or loosely attached to form
    // Exclude the fixed buttons we just moved, and specific functional divs like nonQRFormItems if they are empty

    // Common containers in default ST
    const searchSelectors = [
      "#leftSendForm > .interactable",
      "#rightSendForm > .interactable",
      "#extensionsMenuButton", // Often outside or specific
      "#form_sheld .menu_button", // Sometimes extensions drop here
    ];

    // Helper to process a candidate button
    const processButton = (el) => {
      const $el = $(el);
      const id = $el.attr("id");

      // Skip invalid or already processed
      if (!id) return;
      if (id === "options_button") return; // Handled separately
      if (rightGroupIds.includes(id)) return; // Handled separately
      if (id === "send_textarea") return;
      if ($el.parent().attr("id") === "ct-sci-control-bar") return; // Already moved

      // Skip unwanted specific buttons
      const unwantedIds = [
        "dialogue_del_mes_ok",
        "dialogue_del_mes_cancel",
        "file_form_reset",
      ];
      if (unwantedIds.includes(id)) return;

      // Skip hidden functional elements that shouldn't be buttons (like file inputs)
      if ($el.is('input[type="file"]')) return;

      // Determine Order
      let order = 50; // Default middle
      if (Object.hasOwn(buttonOrder, id)) {
        order = buttonOrder[id];
      } else {
        // Assign a new default order if new
        buttonOrder[id] = 50;
        settings.buttonOrder = buttonOrder; // Update ref just in case
        // We don't save immediately to avoid spam, wait for user interaction or save periodically?
        // Actually, let's not save "discovered" buttons automatically to settings unless user modifies them,
        // but we use the temp value.
      }

      // Move to control bar
      $controlBar.append($el);

      // Set Order (using flex order css)
      $el.css("order", order);
      $el.addClass("ct-sci-dynamic-button");
    };

    // Scan selectors
    searchSelectors.forEach((sel) => {
      $(sel).each((i, el) => processButton(el));
    });

    // Scan for loose buttons in nonQRFormItems that might have been missed
    $("#nonQRFormItems")
      .find(".interactable")
      .each((i, el) => processButton(el));

    // Re-apply styles/orders for fixed buttons
    $optionsBtn.css("order", -9999); // Always Left
    $rightGroup.css("order", 9999); // Always Right
    $optionsBtn.addClass("ct-sci-fixed-button");
    $rightGroup.addClass("ct-sci-right-group");

    // Update Settings UI List
    updateSettingsUI();
  };

  /**
   * Settings UI Population
   */
  const updateSettingsUI = () => {
    const $list = $("#ct-sci-button-list");
    if ($list.length === 0) return;

    $list.empty();
    const settings = extension_settings[extensionName];
    const buttonOrder = settings.buttonOrder;

    // Find all buttons currently in the bar to list them (excluding fixed groups)
    const $buttons = $controlBar
      .children()
      .not("#options_button, #ct-sci-right-group");

    if ($buttons.length === 0) {
      $list.append(
        '<div class="text-muted">No custom buttons detected yet.</div>',
      );
      return;
    }

    $buttons.each((i, el) => {
      const id = $(el).attr("id");
      const title = $(el).attr("title") || id;
      const currentOrder = buttonOrder[id] !== undefined ? buttonOrder[id] : 50;

      const $row = $(`
                <div class="ct-sci-settings-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; padding: 5px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;" title="${id}">${title}</span>
                    <input type="number" class="text_pole" data-id="${id}" value="${currentOrder}" style="width: 60px; text-align: center;">
                </div>
            `);

      // Event listener for order change
      $row.find("input").on("change", function () {
        const newOrder = parseInt($(this).val());
        const btnId = $(this).data("id");

        // Update Settings
        extension_settings[extensionName].buttonOrder[btnId] = newOrder;
        saveSettings();

        // Apply immediately
        $(`#${btnId}`).css("order", newOrder);
      });

      $list.append($row);
    });
  };

  // Run relocation logic
  relocateButtons();

  // --- Top Bar Hider Logic ---

  /**
   * Toggles a CSS class on the body to show/hide the top bar.
   * @param {boolean} hidden - The desired hidden state.
   */
  function setHiddenState(hidden) {
    if (hidden) {
      $("body").addClass("st-top-bar-hidden");
    } else {
      $("body").removeClass("st-top-bar-hidden");
    }
  }

  // Create the button and add it to the page.
  // The ID 'topBarHiderButton' is kept for CSS styling consistency.
  let $toggleButton = $("#topBarHiderButton");
  if ($toggleButton.length === 0) {
    $toggleButton = $('<button id="topBarHiderButton"></button>');
    $("body").append($toggleButton);
  }

  /**
   * Updates the button's icon and title based on the current state.
   */
  function updateButtonUI() {
    const hidden = extension_settings[extensionName].topBarHidden;
    if (hidden) {
      $toggleButton.text("Show");
      $toggleButton.attr("title", "Show Top Bar");
      $toggleButton.html('<i class="fa-solid fa-eye"></i>'); // Use FontAwesome icon
    } else {
      $toggleButton.text("Hide");
      $toggleButton.attr("title", "Hide Top Bar");
      $toggleButton.html('<i class="fa-solid fa-eye-slash"></i>');
    }
  }
  
  /**
   * Checks if the placeholder element is visible in the viewport
   * @returns {boolean} True if placeholder is visible
   */
  function isPlaceholderVisible() {
    const $placeholder = $("#ct-sci-placeholder");
    if ($placeholder.length === 0) return false;
    
    const rect = $placeholder[0].getBoundingClientRect();
    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    const viewportWidth = window.visualViewport
      ? window.visualViewport.width
      : window.innerWidth;
    
    // Check if element is within viewport bounds
    return rect.top < viewportHeight &&
           rect.bottom > 0 &&
           rect.left < viewportWidth &&
           rect.right > 0;
  }

  /**
   * Updates the position of the TopBar Hider button to align with the placeholder.
   * This binds the external fixed button to the internal placeholder's position.
   * Enhanced to handle virtual keyboard on mobile devices.
   */
  let lastDocHeight = 0;
  let lastViewportHeight = 0;
  
  function updateToggleButtonPosition() {
    const $placeholder = $("#ct-sci-placeholder");
    if ($placeholder.length === 0 || $toggleButton.length === 0) return;
    
    // Check for document/viewport height changes (indicates keyboard state change)
    const currentDocHeight = document.documentElement.scrollHeight;
    const currentViewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
      
    if (currentDocHeight !== lastDocHeight || currentViewportHeight !== lastViewportHeight) {
      lastDocHeight = currentDocHeight;
      lastViewportHeight = currentViewportHeight;
      
      // Schedule additional updates when dimensions change
      schedulePositionUpdate(100);
      schedulePositionUpdate(300);
    }
    
    // Hide button if placeholder is not visible
    if (!isPlaceholderVisible()) {
      $toggleButton.css("display", "none");
      return;
    } else {
      $toggleButton.css("display", "flex");
    }

    const placeholderRect = $placeholder[0].getBoundingClientRect();
    
    // Use visualViewport if available (mobile devices with virtual keyboard)
    // This provides accurate positioning when the keyboard is open
    let offsetX = 0;
    let offsetY = 0;
    
    if (window.visualViewport) {
      // Visual viewport offsets help track the actual visible area
      // when virtual keyboard or other overlays are present
      offsetX = window.visualViewport.offsetLeft || 0;
      offsetY = window.visualViewport.offsetTop || 0;
    }

    // Calculate position relative to the actual viewport
    const leftPosition = placeholderRect.left + offsetX + placeholderRect.width / 2;
    const topPosition = placeholderRect.top + offsetY + placeholderRect.height / 2;
    
    // Ensure the button stays within viewport bounds
    const viewportWidth = window.visualViewport ? window.visualViewport.width : window.innerWidth;
    const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    
    // Clamp position to viewport bounds with some padding
    const clampedLeft = Math.min(Math.max(leftPosition, 25), viewportWidth - 25);
    const clampedTop = Math.min(Math.max(topPosition, 25), viewportHeight - 25);

    // Position the toggle button to overlap exactly with the placeholder
    $toggleButton.css({
      left: clampedLeft + "px",
      top: clampedTop + "px",
      bottom: "auto", // Override the default bottom positioning
      transform: "translate(-50%, -50%)", // Center on the calculated point
    });
  }

  // --- Click Handler ---
  // A simple click now toggles the top bar's visibility.
  $toggleButton.off("click").on("click", function () {
    const currentHidden = extension_settings[extensionName].topBarHidden;
    const newHidden = !currentHidden;

    extension_settings[extensionName].topBarHidden = newHidden;
    setHiddenState(newHidden);
    updateButtonUI();
    // State is not saved to ensure it resets on reload
  });

  // --- Initial Setup for Top Bar Hider ---
  // Always start unhidden on reload
  extension_settings[extensionName].topBarHidden = false;
  setHiddenState(false);
  updateButtonUI();

  // Debounced position update to avoid excessive calls during rapid changes
  let positionUpdateTimer = null;
  let inputFocusChecker = null;
  
  function schedulePositionUpdate(delay = 50) {
    if (positionUpdateTimer) {
      clearTimeout(positionUpdateTimer);
    }
    positionUpdateTimer = setTimeout(() => {
      positionUpdateTimer = null;
      updateToggleButtonPosition();
    }, delay);
  }
  
  // Periodic checker when input is focused (for stubborn keyboard issues)
  function startInputFocusChecker() {
    stopInputFocusChecker();
    inputFocusChecker = setInterval(() => {
      // Check if any input is still focused
      if ($(document.activeElement).is("input, textarea")) {
        updateToggleButtonPosition();
      } else {
        // No input focused, stop checking
        stopInputFocusChecker();
      }
    }, 500); // Check every 500ms
  }
  
  function stopInputFocusChecker() {
    if (inputFocusChecker) {
      clearInterval(inputFocusChecker);
      inputFocusChecker = null;
    }
  }

  // Initial position updates with staggered delays to handle late-loading extensions
  // This ensures the button position is correct even after other extensions finish loading
  requestAnimationFrame(() => {
    updateToggleButtonPosition();
  });

  // Additional delayed updates to catch late-loading buttons
  setTimeout(() => updateToggleButtonPosition(), 100);
  setTimeout(() => updateToggleButtonPosition(), 300);
  setTimeout(() => updateToggleButtonPosition(), 500);
  setTimeout(() => updateToggleButtonPosition(), 1000);

  // Update position on window resize
  $(window).on("resize", () => schedulePositionUpdate(16)); // ~60fps throttle

  // Update position on scroll (in case of scrollable containers)
  $(window).on("scroll", () => schedulePositionUpdate(16));
  
  // Visual Viewport API support for mobile devices with virtual keyboards
  // This is crucial for handling virtual keyboard open/close events
  if (window.visualViewport) {
    // Viewport resize event fires when keyboard opens/closes
    window.visualViewport.addEventListener("resize", () => {
      schedulePositionUpdate(16);
    });
    
    // Viewport scroll event fires when the user pans/zooms
    window.visualViewport.addEventListener("scroll", () => {
      schedulePositionUpdate(16);
    });
  }
  
  // Additional mobile-specific event handlers
  // These help with various mobile scenarios including keyboard changes
  
  // Focus/blur events on input elements can trigger keyboard show/hide
  $(document).on("focus blur", "input, textarea", function(e) {
    if (e.type === "focus") {
      // Start periodic checker when input is focused
      startInputFocusChecker();
      
      // Also schedule immediate updates
      schedulePositionUpdate(50);   // Immediate update
      schedulePositionUpdate(250);  // After keyboard animation
      schedulePositionUpdate(500);  // Final position
    } else if (e.type === "blur") {
      // Stop periodic checker on blur
      stopInputFocusChecker();
      
      // Force multiple updates to catch keyboard closing
      requestAnimationFrame(() => {
        updateToggleButtonPosition();
      });
      schedulePositionUpdate(100);
      schedulePositionUpdate(300);
      schedulePositionUpdate(500);
      
      // Extra aggressive update for stubborn cases
      setTimeout(() => {
        updateToggleButtonPosition();
      }, 700);
    }
  });
  
  // Input event handler - fires when typing
  $(document).on("input", "input, textarea", function() {
    // Light update during typing
    schedulePositionUpdate(100);
  });
  
  // Click events outside inputs might indicate focus change
  $(document).on("click touchstart", function(e) {
    // If clicking outside of input elements, update position
    if (!$(e.target).is("input, textarea")) {
      schedulePositionUpdate(50);
    }
  });
  
  // Orientation change on mobile devices
  $(window).on("orientationchange", function() {
    // Longer delay for orientation animations
    schedulePositionUpdate(500);
  });
  
  // Touch events that might affect viewport
  let touchMoveTimer = null;
  $(document).on("touchmove touchend", function() {
    // Debounce touch events to avoid excessive updates
    if (touchMoveTimer) clearTimeout(touchMoveTimer);
    touchMoveTimer = setTimeout(() => {
      updateToggleButtonPosition();
      touchMoveTimer = null;
    }, 100);
  });

  // Use ResizeObserver to detect layout changes in the control bar
  const resizeObserver = new ResizeObserver(() => {
    schedulePositionUpdate();
  });

  // Observe the control bar and form for size changes
  if ($controlBar.length > 0) {
    resizeObserver.observe($controlBar[0]);
  }
  if ($form.length > 0) {
    resizeObserver.observe($form[0]);
  }

  // Also observe the placeholder itself
  const $placeholder = $("#ct-sci-placeholder");
  if ($placeholder.length > 0) {
    resizeObserver.observe($placeholder[0]);
    
    // Add Intersection Observer for better visibility tracking
    if ('IntersectionObserver' in window) {
      const intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Placeholder is visible, update position
            updateToggleButtonPosition();
          } else {
            // Placeholder is not visible, hide button
            $toggleButton.css("display", "none");
          }
        });
      }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 // Trigger when at least 10% visible
      });
      
      intersectionObserver.observe($placeholder[0]);
    }
  }

  // Observer to handle late-loading extensions adding buttons
  const observer = new MutationObserver((mutations) => {
    let needsRelocation = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        needsRelocation = true;
        break;
      }
    }
    if (needsRelocation) {
      relocateButtons();
      // Update toggle button position after relocation with slight delay
      schedulePositionUpdate(100);
    }
  });

  // Observe potential sources of new buttons
  const obsConfig = { childList: true, subtree: true };
  const nonQr = document.getElementById("nonQRFormItems");
  if (nonQr) observer.observe(nonQr, obsConfig);

  // Also observe the main form sheld just in case
  const sheld = document.getElementById("form_sheld");
  if (sheld) observer.observe(sheld, { childList: true }); // Shallow check for direct appends

  // Observe the control bar itself for any DOM changes
  if ($controlBar.length > 0) {
    observer.observe($controlBar[0], { childList: true, subtree: true });
  }

  // Open listener for the settings drawer to refresh list when opened
  $(".inline-drawer-toggle").on("click", function () {
    if ($(this).closest(".ct-separate-chat-input-settings").length > 0) {
      updateSettingsUI();
    }
  });
});
