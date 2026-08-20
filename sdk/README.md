# Cookie Consent SDK

A production-grade, lightweight, and DPDP Act 2023 compliant Cookie Consent Management System. This SDK handles the lifecycle of user consent, from UI presentation to conditional script execution and backend synchronization.

## Features

- **Dynamic Configuration**: Fetches compliance rules, purposes, and vendor lists from the backend.
- **Intelligent Script Injection**: Automatically injects third-party scripts (e.g., Google Analytics) only after the user grants the corresponding consent.
- **User Identity Linking**: Syncs anonymous device-level consent with an authenticated User ID for cross-device consistency.
- **Offline Support**: Uses an offline queue to ensure consent choices are saved even during network instability.
- **Responsive UI**: Includes a sleek mini-banner and a detailed "Manage Preferences" modal.
- **Developer API**: Simple methods to initialize, open settings, and handle user logins.

---

## Installation

### 1. Build the SDK
If you have made changes to the source code, you need to recompile the SDK:
```bash
cd sdk
npm install
npx vite build

Set  API_BASE in sdk/src/api.js file for localhost:3000/api and for hosted use https://cookie-be.securedapp.io/api

Set Tenant and App in SDK initialization : CookieConsent.init
```
This generates the following files in the `sdk/dist` directory:
- `cookie-consent-sdk.iife.js` (The main logic)
- `cookie-consent-sdk.css` (The styling)

### 2. Add to your Website
Include the CSS and the JS file in your HTML. Ideally, the SDK should be loaded early to manage script blocking.

```html
<!-- Include SDK CSS -->
<link rel="stylesheet" href="path/to/sdk/dist/cookie-consent-sdk.css">

<!-- Include SDK JS -->
<script src="path/to/sdk/dist/cookie-consent-sdk.iife.js"></script>
```

---

## Integration Guide

### Initialization
Initialize the SDK as soon as the DOM is ready. You need your `tenantId` and `appId`.

```javascript
document.addEventListener('DOMContentLoaded', () => {
    if (window.CookieConsent) {
        window.CookieConsent.init('your_tenant_id', 'your_app_id');
    }
});
```

### Handling User Login
To sync consent across devices, call `loginUser` when a user authenticates on your site.

```javascript
// Call this after your user successfully logs in
window.CookieConsent.loginUser('user_123');
```

### Handling User Logout
To prevent consent state leaking across users on shared devices, call `logoutUser` when the user logs out. This clears cached consent and resets the banner for the next user.

```javascript
// Call this after your user logs out
window.CookieConsent.logoutUser();
```

### Opening Preferences
To allow users to change their settings later (e.g., from a link in the footer), use:

```javascript
window.CookieConsent.openPreferences();
```

---

## Technical Details

### Script Blocking / Management
The SDK looks at the `purposes` returned by the backend. Each purpose contains a list of `vendors`. Each vendor has a list of `scripts`. 
- **Essential Purposes**: Scripts are injected automatically.
- **Optional Purposes**: Scripts are injected ONLY if the user toggles the switch to "granted".

### Events
The SDK dispatches a `CookieConsentUpdate` event whenever the consent state changes (on initial load, login, or manual update).

```javascript
window.addEventListener('CookieConsentUpdate', (e) => {
    console.log('New Consent State:', e.detail);
});
```

### Folder Structure
- `sdk/index.js`: The main entry point and public API class.
- `sdk/src/api.js`: All backend communication logic.
- `sdk/src/ui.js`: Banner and Modal DOM creation and event handling.
- `sdk/src/consent.js`: Logical processing of choices and local storage management.
- `sdk/src/scriptManager.js`: Responsible for injecting the `<script>` tags for vendors.
- `sdk/src/style.css`: The look and feel of the banner/modal.

---

