# CT-SidebarButtons

A SillyTavern/CozyTavern extension that provides a dedicated floating sidebar area for third-party extensions to register their additional buttons, keeping the UI organized and accessible.

## Features

- **Floating Sidebar**: A non-intrusive, floating sidebar that overlays the chat area
- **Customizable Position**: Choose between left or right side placement
- **Adjustable Alignment**: Position the sidebar at the top, center, or bottom (default) of the chat area
- **Compact Design**: Small, transparent buttons optimized for additional functionality
- **Mobile Responsive**: Automatically adjusts positioning for mobile devices
- **Flexible Styling**: Adjustable button size, spacing, and opacity
- **Easy API**: Simple JavaScript API for other extensions to register buttons

## Installation

1. Download the extension files
2. Place them in the `/public/scripts/extensions/third-party/CT-SidebarButtons` folder of your SillyTavern installation
3. Restart SillyTavern
4. The extension will automatically load and create the sidebar container

## Configuration

Access the settings through the Extensions menu in SillyTavern:

### Layout Settings
- **Position**: Right (default) or Left side of the chat
- **Vertical Alignment**: Top, Center, or Bottom (default)
- **Button Size**: 12-48px (default: 20px) - smaller for minimal footprint
- **Spacing**: 0-12px (default: 1px) - tight spacing for compact layout
- **Opacity**: 20-100% (default: 50%) - semi-transparent for non-intrusive display

## API Usage

Other extensions can register buttons using the global `CTSidebarButtons` API:

### Register a Button

```javascript
CTSidebarButtons.registerButton({
  id: 'my-button',           // Unique identifier (required)
  icon: 'fa-solid fa-star',  // FontAwesome icon class (required)
  title: 'My Button',         // Tooltip text
  order: 10,                  // Display order (lower = higher priority)
  onClick: () => {            // Click handler function
    console.log('Button clicked!');
  }
});
```

### Remove a Button

```javascript
CTSidebarButtons.removeButton('my-button');
```

### Control Button Visibility

```javascript
// Hide/show a button
CTSidebarButtons.setButtonVisible('my-button', false);

// Disable/enable a button
CTSidebarButtons.setButtonEnabled('my-button', false);
```

### Get Sidebar Container

```javascript
const container = CTSidebarButtons.getContainer();
```

## Design Philosophy

CT-SidebarButtons is designed to be a companion to CT-SeparateChatInput, providing a dedicated space for additional extension buttons that don't fit in the main control bar. The sidebar is intentionally:

- **Small & Subtle**: Tiny buttons with minimal visual footprint
- **Transparent**: See-through design that doesn't block chat content
- **Floating**: Overlays the chat area without affecting layout
- **Bottom-Right Default**: Positioned where it's accessible but not intrusive

## Mobile Support

The extension automatically detects mobile devices and adjusts positioning:
- Uses viewport-based positioning for reliability
- Positions above the chat input area to avoid overlap
- Flush to screen edges for maximum screen utilization
- Automatically calculates position relative to send form

## License

MIT License

## Changelog

### v1.0.0
- Initial release
- Floating sidebar container for third-party extension buttons
- Customizable positioning and styling
- Mobile-responsive design
- Simple API for button registration
