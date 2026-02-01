# CT-SeparateChatInput

A SillyTavern/CozyTavern extension that separates the chat input area from the control buttons, placing the text input above a dedicated, customizable button row. This layout is designed to provide a cleaner typing experience and more organized controls, working consistently across both desktop and mobile views.

## Features

- **Dedicated Input Row:** Moves the chat textarea to its own row above the controls, ensuring full width for typing.
- **Organized Control Bar:**
  - **Fixed Positions:** Keeps the "Options" menu on the far left and the "Send" button (including Stop, Impersonate, Continue, etc.) on the far right.
  - **Centered Controls:** Dynamically gathers other buttons (like Extensions, or buttons added by other extensions) and centers them in the middle.
- **Customizable Order:** Includes a settings panel to reorder the centered buttons to your preference.
- **Mobile Friendly:** Designed to work seamlessly on smaller screens.

## Installation

1.  Open SillyTavern.
2.  Navigate to the **Extensions** menu (plug icon).
3.  Select **Install Extension**.
4.  Paste the repository URL: `https://github.com/leyam3k/CT-SeparateChatInput`
5.  Click **Install**.
6.  Reload SillyTavern.

## Usage

Once installed, the layout changes are applied automatically.

### Customizing Button Order

1.  Open the **Extensions** menu.
2.  Find the **Separate Chat Input** settings drawer.
3.  You will see a list of detected buttons (excluding the fixed Options and Send buttons).
4.  Change the "Order" number for any button.
    - **Lower numbers** move the button to the **left**.
    - **Higher numbers** move the button to the **right**.
5.  Changes are applied immediately.

## Compatibility

- Compatible with the latest version of SillyTavern.
- Should work with most third-party extensions that add buttons to the chat form.

## Changelog

### v1.1.3

- **New: Universal Square Box Button Design**
  - Implemented consistent square box design for all control buttons for better visual distinction.
  - All buttons now feature a uniform 32x32px size with 4px rounded corners.
  - Added visible borders to clearly define button boundaries without relying solely on spacing.
  - **Inverted Color Scheme:** Darker background in normal state for better visibility, lighter on hover for clear interaction feedback.
  - Added smooth transitions, shadow effects, and transform animations for improved user experience.
  - **Fixed Button Visibility Issues:**
    - Script execution buttons (Continue, Pause, Stop) now properly hide when not in use.
    - Abort Request button only displays when actively stopping a request.
    - Conditional buttons (Impersonate, Continue) respect their display states.
  - Improved accessibility with focus states and consistent hover/active effects.
  - Special handling for Quick Persona images to fit within the new box design.
- **Changed: Button Alignment**
  - Dynamic buttons now align from left to right instead of being centered.
  - Options button remains fixed on the far left, Send button group on the far right.
  - Dynamic buttons flow naturally left-to-right between the fixed positions.

### v1.1.2

- **Fixed: Mobile Virtual Keyboard Issues**
  - Enhanced TopBar Hider button positioning on mobile devices with virtual keyboards.
  - Added Visual Viewport API support for accurate positioning when keyboard is open.
  - Button now hides when placeholder is scrolled out of view (e.g., when keyboard pushes content up).
  - Added event listeners for focus/blur, orientation changes, and touch events.
  - Improved boundary checking to keep button within viewport limits.
  - Added mobile-specific CSS optimizations for better touch interaction.
  - Fixed button misalignment issues when typing with virtual keyboard on mobile.

### v1.1.1

- **Improved: TopBar Hider Button Positioning**
  - The floating TopBar Hider button now dynamically binds its position to the internal placeholder element.
  - Removed hardcoded CSS positioning (left: 50.7%, bottom: 8px) in favor of JavaScript-based dynamic positioning.
  - Added ResizeObserver to track layout changes and update button position automatically.
  - Added debounced position updates on window resize and scroll events.
  - Added staggered initial position updates (100ms, 300ms, 500ms, 1000ms) to handle late-loading extensions.
  - Button position now correctly updates when other extensions add/remove buttons from the control bar.
  - Eliminated the need for manual CSS adjustments or media query workarounds.

### v1.1.0

- **New Feature: TopBar Hider**
  - Added a floating toggle button (centered at the bottom) to hide/show the top navigation bar for a more immersive view.
  - Added a placeholder in the control bar to reserve space for the floating button.
  - The hidden state is temporary and resets to "visible" upon reloading the page.
  - The button uses a high Z-Index to remain accessible even when full-screen drawers are open.

### v1.0.0

- **Initial Release**
  - Separated chat input text area to its own row.
  - Created a dedicated control bar for buttons.
  - Implemented fixed positioning for "Options" (Left) and "Send" (Right) groups.
  - Added a settings panel to customize the order of center-aligned buttons.

## License

This project is licensed under the AGPLv3 License.
