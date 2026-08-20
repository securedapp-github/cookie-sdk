# Website Integration Guide: Cookie Consent SDK

This guide provides step-by-step instructions for integrating the Secure CMS Cookie Consent SDK into your website, whether you are using Vanilla JavaScript or a modern framework like React.

---

## 1. Prerequisites

Before you begin, ensure you have:
- Your **Tenant ID** (e.g., `bank`).
- Your **App ID** (e.g., `web01`).
- The SDK files: `cookie-consent-sdk.iife.js` and `cookie-consent-sdk.css` (or the single bundled JS if applicable).

---

## 2. Vanilla JavaScript Integration

### Step 1: Include the SDK
Add the following tags to the `<head>` of your HTML file:

```html
<!-- Load SDK Styles -->
<link rel="stylesheet" href="path/to/dist/cookie-consent-sdk.css">

<!-- Load SDK Logic -->
<script src="path/to/dist/cookie-consent-sdk.iife.js"></script>
```

### Step 2: Initialize the SDK
Initialize the SDK as early as possible (ideally at the bottom of the body or in an async function):

```html
<script>
  window.addEventListener('DOMContentLoaded', () => {
    // Initialize with your Tenant and App IDs
    window.CookieConsent.init('bank123', 'web01');
  });
</script>
```

### Step 3: Global API Usage
You can trigger the preference center manually (e.g., from a footer link):

```html
<button onclick="window.CookieConsent.openPreferences()">Cookie Settings</button>
```

---

## 3. React Integration

In React, you should initialize the SDK once at the root of your application.

### Step 1: Add Scripts to `index.html`
Add the CSS and JS tags to your public `index.html` file as shown in the Vanilla JS section.

### Step 2: Create a Hook or Helper
Since the SDK attaches to `window`, you can create a simple wrapper:

```javascript
// useCookieConsent.js
import { useEffect } from 'react';

export const useCookieConsent = (tenantId, appId) => {
  useEffect(() => {
    if (window.CookieConsent) {
      window.CookieConsent.init(tenantId, appId);
    }
  }, [tenantId, appId]);

  return {
    openPreferences: () => window.CookieConsent?.openPreferences(),
    loginUser: (userId) => window.CookieConsent?.loginUser(userId),
    logoutUser: () => window.CookieConsent?.logoutUser()
  };
};
```

### Step 3: Usage in App Component
```javascript
import React from 'react';
import { useCookieConsent } from './hooks/useCookieConsent';

function App() {
  const { openPreferences } = useCookieConsent('bank123', 'web01');

  return (
    <div className="App">
      <h1>Welcome to our Bank</h1>
      <footer>
        <button onClick={openPreferences}>Manage Cookies</button>
      </footer>
    </div>
  );
}
```

---

## 4. Advance Feature: Tag-based Blocking

If you want to prevent a script from loading until consent is given, modify the script tag as follows:

```html
<!-- This script will not load until the user grants "marketing" consent -->
<script 
  type="text/plain" 
  data-cc-purpose="marketing" 
  src="https://example.com/tracking-script.js">
</script>
```

---

## 5. Event Handling

The SDK dispatches a `CookieConsentUpdate` event whenever a user's choices are saved or updated. You can listen for this to trigger custom logic in your app:

```javascript
window.addEventListener('CookieConsentUpdate', (event) => {
  const consentData = event.detail;
  console.log('User consent updated:', consentData.purposes);
  
  // Custom logic (e.g., disable/enable internal app features)
});
```

---

## 6. Authentication Support

When a user logs in to your site, notify the SDK to sync their consent preferences across all their devices:

```javascript
// Call this after your login logic
window.CookieConsent.loginUser('user_789');
```

---

## 7. Troubleshooting

- **SDK not loading?**: Check the browser console for fetch errors. Ensure your backend server is running and accessible at the `API_BASE` defined in the SDK.
- **Styles missing?**: Ensure the `cookie-consent-sdk.css` is correctly linked in your HTML.
- **Global `CookieConsent` undefined?**: Ensure the SDK script is loaded before you attempt to call `init()`.


## Explanantion

### Who "STOPS" the script? (The Browser + Client Dev)
In reality, the Browser stops the script from loading, but it only does so because of an intentional change made by the Client Developer.

Standard Behavior: When a browser sees <script src="..."></script>, its default behavior is to immediately fetch and execute it.
The "Trick": By changing the type to type="text/plain", the Client Dev is signaling to the browser: "This is just data, not a script. Do not fetch or execute this."
Result: The browser ignores the script entirely. No network request is made to the 3rd party server (e.g., Google or Facebook), preserving user privacy until consent is given.

### Who "ALLOWS" the script? (The SDK)
Once the user clicks "Allow All" or toggles a category to "Granted", the SDK takes over:

Scanning: The SDK implementation (in scriptManager.js) searches the entire webpage for any script tags with type="text/plain" and the matching data-cc-purpose.
Activation: The SDK creates a new script element, copies all the attributes (like src) from the "parked" script, but sets the type back to text/javascript.
Injection: The SDK injects this new script into the page. The browser sees a "new" valid script tag and finally executes it.
Summary Table
Step	Action	Responsibility
Blocking	Change type to text/plain	Client Developer (Manual or via template)
Prevention	Ignore the tag (no network request)	Browser (Standard behavior for unknown types)
Decision	Clicks "Confirm" or "Allow All"	End User
Activation	Change type to javascript & Re-inject	Consent SDK