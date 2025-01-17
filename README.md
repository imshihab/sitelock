# SiteLock Chrome Extension

## Overview
SiteLock is a security-focused Chrome extension that provides password and passkey protection for websites. It allows users to set up authentication requirements for specific websites, ensuring that access to sensitive sites requires verification even after browser restarts.

## Features
- **Website Protection**: Set up password or passkey protection for any website
- **Session Management**: Automatically manages authentication states based on open tabs
- **Smart Authentication**: 
  - Remembers authenticated sites while tabs are open
  - Automatically revokes access when all tabs of a protected site are closed
  - Re-authenticates when revisiting protected sites
- **Context Menu Integration**: Quick access to preferences through right-click menu
- **Flexible Security Options**: Support for both Password-based and passkey authentication


## Installation
1. Clone the repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will automatically open its configuration page on installation

## Usage

### Securing a Website
1. Navigate to the website you want to protect
2. Click the SiteLock extension icon
3. Choose "Secure This Site"
4. Set up either a PIN or passkey for protection
5. The site is now protected and will require authentication

### Accessing Protected Sites
1. When visiting a protected site, you'll be redirected to an authentication page
2. Enter your Password or use your passkey
3. Upon successful authentication, you'll be redirected to the original site
4. Authentication persists until all tabs of that site are closed

### Managing Protected Sites
1. Access preferences through:
   - Right-click context menu → "Preferences"
   - Click the extension icon → "Preferences"
2. View all protected sites
3. Remove protection from sites using either Password or passkey verification

## Security Considerations
- Authentication state is maintained only in memory
- Protected sites require re-authentication after all tabs are closed
- Implements origin-based protection to prevent subdomain bypasses

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
[MIT License](LICENSE).
