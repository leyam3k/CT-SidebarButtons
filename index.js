import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "CT-SidebarButtons";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default Settings
const defaultSettings = {
  buttonOrder: {}, // Map of elementID -> order (number)
  position: 'right', // right or left
  verticalAlignment: 'bottom', // top, center, or bottom - default to bottom
  buttonSize: 20, // Size of buttons in pixels - much smaller for additional buttons
  spacing: 1, // Spacing between buttons in pixels - very tight
  opacity: 0.5, // Default opacity - more transparent
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
 * Global API for other extensions to register their buttons
 */
window.CTSidebarButtons = {
  /**
   * Register a button to be displayed in the sidebar
   * @param {Object} config - Button configuration
   * @param {string} config.id - Unique identifier for the button
   * @param {string} config.icon - FontAwesome icon class (e.g., 'fa-solid fa-cog')
   * @param {string} config.title - Tooltip text
   * @param {Function} config.onClick - Click handler
   * @param {number} [config.order=50] - Display order (lower = higher)
   * @param {string} [config.class] - Additional CSS classes
   * @returns {HTMLElement} The created button element
   */
  registerButton: function(config) {
    if (!config.id || !config.icon) {
      console.error(`${extensionName}: Button registration requires at least id and icon`);
      return null;
    }

    const settings = extension_settings[extensionName];
    
    // Check if button already exists
    let $button = $(`#ct-sidebar-btn-${config.id}`);
    if ($button.length > 0) {
      // Update existing button
      $button.attr('title', config.title || '');
      $button.find('i').attr('class', config.icon);
      if (config.onClick) {
        $button.off('click').on('click', config.onClick);
      }
      return $button[0];
    }

    // Create new button
    $button = $(`
      <div id="ct-sidebar-btn-${config.id}" 
           class="ct-sidebar-button interactable ${config.class || ''}"
           title="${config.title || ''}"
           tabindex="0">
        <i class="${config.icon}"></i>
      </div>
    `);

    // Set order
    const order = config.order !== undefined ? config.order : 
                   settings.buttonOrder[config.id] || 50;
    settings.buttonOrder[config.id] = order;
    $button.css('order', order);

    // Add click handler
    if (config.onClick) {
      $button.on('click', config.onClick);
    }

    // Add to sidebar
    const $container = $('#ct-sidebar-container');
    if ($container.length > 0) {
      $container.append($button);
      updateSettingsUI();
    }

    return $button[0];
  },

  /**
   * Remove a button from the sidebar
   * @param {string} id - Button identifier
   */
  removeButton: function(id) {
    $(`#ct-sidebar-btn-${id}`).remove();
    delete extension_settings[extensionName].buttonOrder[id];
    updateSettingsUI();
    saveSettings();
  },

  /**
   * Update a button's visibility
   * @param {string} id - Button identifier
   * @param {boolean} visible - Whether the button should be visible
   */
  setButtonVisible: function(id, visible) {
    const $button = $(`#ct-sidebar-btn-${id}`);
    if ($button.length > 0) {
      $button.toggle(visible);
    }
  },

  /**
   * Update a button's enabled state
   * @param {string} id - Button identifier
   * @param {boolean} enabled - Whether the button should be enabled
   */
  setButtonEnabled: function(id, enabled) {
    const $button = $(`#ct-sidebar-btn-${id}`);
    if ($button.length > 0) {
      $button.toggleClass('disabled', !enabled);
      $button.prop('disabled', !enabled);
    }
  },

  /**
   * Get the sidebar container element
   * @returns {HTMLElement|null} The sidebar container
   */
  getContainer: function() {
    return $('#ct-sidebar-container')[0] || null;
  }
};

/**
 * Settings UI Population
 */
function updateSettingsUI() {
  const $list = $('#ct-sidebar-button-list');
  if ($list.length === 0) return;

  $list.empty();
  const settings = extension_settings[extensionName];
  const buttonOrder = settings.buttonOrder;

  // Find all buttons currently in the sidebar
  const $buttons = $('#ct-sidebar-container').find('.ct-sidebar-button');

  if ($buttons.length === 0) {
    $list.append(
      '<div class="text-muted">No buttons registered yet. Other extensions can register buttons using the CTSidebarButtons API.</div>'
    );
    return;
  }

  $buttons.each((i, el) => {
    const $el = $(el);
    const id = $el.attr('id').replace('ct-sidebar-btn-', '');
    const title = $el.attr('title') || id;
    const currentOrder = buttonOrder[id] !== undefined ? buttonOrder[id] : 50;

    const $row = $(`
      <div class="ct-sidebar-settings-row">
        <span class="button-title" title="${id}">${title}</span>
        <div class="button-controls">
          <input type="number" class="text_pole order-input" data-id="${id}" value="${currentOrder}">
          <div class="visibility-toggle ${$el.is(':visible') ? 'visible' : 'hidden'}" data-id="${id}">
            <i class="fa-solid ${$el.is(':visible') ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </div>
        </div>
      </div>
    `);

    // Event listener for order change
    $row.find('.order-input').on('change', function() {
      const newOrder = parseInt($(this).val());
      const btnId = $(this).data('id');
      
      // Update Settings
      extension_settings[extensionName].buttonOrder[btnId] = newOrder;
      saveSettings();
      
      // Apply immediately
      $(`#ct-sidebar-btn-${btnId}`).css('order', newOrder);
    });

    // Event listener for visibility toggle
    $row.find('.visibility-toggle').on('click', function() {
      const btnId = $(this).data('id');
      const $btn = $(`#ct-sidebar-btn-${btnId}`);
      const isVisible = !$btn.is(':visible');
      
      CTSidebarButtons.setButtonVisible(btnId, isVisible);
      $(this).toggleClass('visible hidden');
      $(this).find('i').toggleClass('fa-eye fa-eye-slash');
    });

    $list.append($row);
  });
}

/**
 * Apply settings to the sidebar
 */
function applySettings() {
  const settings = extension_settings[extensionName];
  const $sidebar = $('#ct-sidebar-container');
  
  // Position
  $sidebar.removeClass('sidebar-left sidebar-right').addClass(`sidebar-${settings.position}`);
  
  // Vertical alignment
  $sidebar.removeClass('align-top align-center align-bottom').addClass(`align-${settings.verticalAlignment}`);
  
  // Button size and spacing
  $sidebar.css({
    '--button-size': `${settings.buttonSize}px`,
    '--button-spacing': `${settings.spacing}px`,
    '--sidebar-opacity': settings.opacity
  });
  
  // Update position relative to chat
  updateSidebarPosition();
}

/**
 * Position the sidebar relative to the #chat element
 */
function updateSidebarPosition() {
  const $chat = $('#chat');
  const $sidebar = $('#ct-sidebar-container');
  
  if ($chat.length === 0 || $sidebar.length === 0) return;
  
  const settings = extension_settings[extensionName];
  
  // Detect if we're on mobile (check multiple conditions for reliability)
  const isMobile = window.matchMedia('(max-width: 768px)').matches ||
                   window.matchMedia('(orientation: portrait)').matches ||
                   /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Use different positioning strategies for mobile vs desktop
  if (isMobile) {
    // Mobile: Use viewport-based positioning for reliability
    updateMobilePosition($sidebar, settings);
  } else {
    // Desktop: Use chat element relative positioning
    updateDesktopPosition($chat, $sidebar, settings);
  }
}

/**
 * Position sidebar for desktop - relative to chat element
 */
function updateDesktopPosition($chat, $sidebar, settings) {
  const chatRect = $chat[0].getBoundingClientRect();
  
  let css = {
    position: 'fixed',
    zIndex: 100,
  };
  
  // Horizontal positioning
  if (settings.position === 'right') {
    css.left = (chatRect.right - 30) + 'px';
    css.right = 'auto';
  } else {
    css.left = (chatRect.left + 10) + 'px';
    css.right = 'auto';
  }
  
  // Vertical positioning
  if (settings.verticalAlignment === 'top') {
    css.top = (chatRect.top + 10) + 'px';
    css.bottom = 'auto';
    css.transform = 'none';
  } else if (settings.verticalAlignment === 'center') {
    css.top = (chatRect.top + chatRect.height / 2) + 'px';
    css.bottom = 'auto';
    css.transform = 'translateY(-50%)';
  } else { // bottom
    css.top = 'auto';
    css.bottom = (window.innerHeight - chatRect.bottom + 10) + 'px';
    css.transform = 'none';
  }
  
  $sidebar.css(css);
}

/**
 * Position sidebar for mobile - use viewport-based positioning
 */
function updateMobilePosition($sidebar, settings) {
  // Ensure sidebar is visible first
  $sidebar.show();
  
  let css = {
    position: 'fixed',
    zIndex: 100,
    display: 'flex', // Ensure it's displayed
  };
  
  // Horizontal positioning - flush to edge on mobile like desktop
  if (settings.position === 'right') {
    css.right = '0px';  // No spacing on mobile
    css.left = 'auto';
  } else {
    css.left = '0px';   // No spacing on mobile
    css.right = 'auto';
  }
  
  // Vertical positioning - use fixed pixels for reliability on mobile
  // Mobile viewport can be tricky with percentages
  if (settings.verticalAlignment === 'top') {
    css.top = '60px'; // Account for mobile top bar
    css.bottom = 'auto';
    css.transform = 'none';
  } else if (settings.verticalAlignment === 'center') {
    // For center, calculate based on window height
    const centerPos = Math.floor(window.innerHeight / 2);
    css.top = centerPos + 'px';
    css.bottom = 'auto';
    css.transform = 'translateY(-50%)';
  } else { // bottom - most common for mobile
    // Position above the chat input area
    // Check if we can find the send_form element for more accurate positioning
    const $sendForm = $('#send_form');
    if ($sendForm.length > 0) {
      const sendFormRect = $sendForm[0].getBoundingClientRect();
      // Position just above the send form with some padding
      css.top = (sendFormRect.top - $sidebar.outerHeight() - 10) + 'px';
      css.bottom = 'auto';
      css.transform = 'none';
    } else {
      // Fallback: Use fixed distance from bottom
      css.top = 'auto';
      css.bottom = '100px'; // Higher up to avoid chat input
      css.transform = 'none';
    }
  }
  
  console.log(`${extensionName}: Mobile positioning applied:`, css);
  $sidebar.css(css);
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

  // 3. Create Sidebar Container
  console.log(`${extensionName}: Initializing sidebar...`);
  
  let $sidebar = $('#ct-sidebar-container');
  if ($sidebar.length === 0) {
    $sidebar = $('<div id="ct-sidebar-container"></div>');
    // Append to body, but position it relative to #chat
    $('body').append($sidebar);
  }

  // Apply initial settings and force position update
  applySettings();
  
  // Force initial position update with delay to ensure DOM is ready
  setTimeout(() => {
    updateSidebarPosition();
    console.log(`${extensionName}: Initial position update complete`);
  }, 500);
  
  // Update position when window is resized or orientation changes
  $(window).on('resize orientationchange', () => {
    setTimeout(() => updateSidebarPosition(), 100);
  });
  
  // Use ResizeObserver to watch chat element changes
  const $chat = $('#chat');
  if ($chat.length > 0 && window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(() => updateSidebarPosition());
    });
    resizeObserver.observe($chat[0]);
  }
  
  // Monitor viewport changes (important for mobile keyboards)
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      requestAnimationFrame(() => updateSidebarPosition());
    });
    window.visualViewport.addEventListener('scroll', () => {
      requestAnimationFrame(() => updateSidebarPosition());
    });
  }
  
  // Also update position when chat changes
  const { eventSource, event_types } = SillyTavern.getContext();
  eventSource.on(event_types.CHAT_CHANGED, () => {
    setTimeout(() => updateSidebarPosition(), 100);
  });
  
  // Update when app is ready
  eventSource.on(event_types.APP_READY, () => {
    setTimeout(() => updateSidebarPosition(), 200);
  });

  // 4. Setup Settings UI Event Handlers
  
  // Position selector
  $('#ct-sidebar-position').val(extension_settings[extensionName].position);
  $('#ct-sidebar-position').on('change', function() {
    extension_settings[extensionName].position = $(this).val();
    applySettings();
    saveSettings();
  });

  // Vertical alignment selector
  $('#ct-sidebar-alignment').val(extension_settings[extensionName].verticalAlignment);
  $('#ct-sidebar-alignment').on('change', function() {
    extension_settings[extensionName].verticalAlignment = $(this).val();
    applySettings();
    saveSettings();
  });

  // Button size slider
  $('#ct-sidebar-button-size').val(extension_settings[extensionName].buttonSize);
  $('#ct-sidebar-button-size-value').text(extension_settings[extensionName].buttonSize);
  $('#ct-sidebar-button-size').on('input', function() {
    const size = parseInt($(this).val());
    extension_settings[extensionName].buttonSize = size;
    $('#ct-sidebar-button-size-value').text(size);
    applySettings();
    saveSettings();
  });

  // Spacing slider
  $('#ct-sidebar-spacing').val(extension_settings[extensionName].spacing);
  $('#ct-sidebar-spacing-value').text(extension_settings[extensionName].spacing);
  $('#ct-sidebar-spacing').on('input', function() {
    const spacing = parseInt($(this).val());
    extension_settings[extensionName].spacing = spacing;
    $('#ct-sidebar-spacing-value').text(spacing);
    applySettings();
    saveSettings();
  });

  // Opacity slider
  $('#ct-sidebar-opacity').val(extension_settings[extensionName].opacity * 100);
  $('#ct-sidebar-opacity-value').text(Math.round(extension_settings[extensionName].opacity * 100));
  $('#ct-sidebar-opacity').on('input', function() {
    const opacity = parseInt($(this).val()) / 100;
    extension_settings[extensionName].opacity = opacity;
    $('#ct-sidebar-opacity-value').text(Math.round(opacity * 100));
    applySettings();
    saveSettings();
  });

  // 5. Example Demo Buttons (for testing - remove in production)
  if (window.location.search.includes('demo=true')) {
    setTimeout(() => {
      CTSidebarButtons.registerButton({
        id: 'example-settings',
        icon: 'fa-solid fa-cog',
        title: 'Settings Example',
        order: 10,
        onClick: () => console.log('Settings clicked!')
      });

      CTSidebarButtons.registerButton({
        id: 'example-info',
        icon: 'fa-solid fa-info-circle',
        title: 'Info Example',
        order: 20,
        onClick: () => console.log('Info clicked!')
      });

      CTSidebarButtons.registerButton({
        id: 'example-star',
        icon: 'fa-solid fa-star',
        title: 'Star Example',
        order: 30,
        onClick: () => console.log('Star clicked!')
      });
    }, 1000);
  }

  // 6. Observer to detect when buttons are added/removed by other extensions
  const observer = new MutationObserver((mutations) => {
    let needsUpdate = false;
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        needsUpdate = true;
        break;
      }
    }
    if (needsUpdate) {
      updateSettingsUI();
    }
  });

  if ($sidebar.length > 0) {
    observer.observe($sidebar[0], { childList: true });
  }

  // 7. Open listener for the settings drawer to refresh list when opened
  $('.inline-drawer-toggle').on('click', function() {
    if ($(this).closest('.ct-sidebar-settings').length > 0) {
      updateSettingsUI();
    }
  });

  // Initial UI update
  updateSettingsUI();

  console.log(`${extensionName}: Ready! Other extensions can use window.CTSidebarButtons to register buttons.`);
});

