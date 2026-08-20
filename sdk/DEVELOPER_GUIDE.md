# Developer Guide: Script Blocking & Consent Implementation

This guide explains how the Secure CMS Cookie Consent SDK prevents unauthorized scripts (e.g., Marketing, Analytics) from loading until the user provides explicit consent.

## Overview

The SDK uses a **Consent-First** architecture. By default, all non-essential scripts are either:
1. **Never loaded** (Dynamic Injection).
2. **Prevented from executing** by the browser (Tag-based Blocking).

---

## 1. Dynamic Injection (Dashboard Managed)

This is the primary way to manage vendor scripts through the Admin Dashboard.

### How it works:
1. You register a vendor (e.g., Google Analytics) in the dashboard and add its script URL.
2. The SDK fetches this configuration on page load.
3. The SDK only injects the `<script>` tag into the DOM if the user has already granted consent for that category.

### Code Implementation (src/scriptManager.js):
```javascript
// Iterates through vendors defined in the backend config
purpose.vendors.forEach(vendor => {
  if (vendor.scripts && vendor.scripts.length > 0) {
    vendor.scripts.forEach(src => {
      // Injects only if purpose is granted
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.head.appendChild(script);
    });
  }
});
```

---

## 2. Tag-based Blocking (In-line HTML)

If you have scripts already present in your HTML (e.g., a tracking pixel or a manually added library), you can use **Tag-based Blocking**.

### How to implement:
Change your existing `<script>` tags to use `type="text/plain"` and add the `data-cc-purpose` attribute.

**Before:**
```html
<script src="https://example.com/marketing.js"></script>
```

**After (Blocked by default):**
```html
<!-- Browser ignores this because type is not javascript -->
<script 
  type="text/plain" 
  data-cc-purpose="marketing" 
  src="https://example.com/marketing.js">
</script>
```

### Activation Logic:
When the user grants consent for "marketing", the SDK scans the DOM for these tags and activates them.

### Code Implementation (src/scriptManager.js):
```javascript
function activateParkedScripts(purposeName) {
  // Finds tags like <script type="text/plain" data-cc-purpose="marketing">
  const selector = `script[type="text/plain"][data-cc-purpose="${purposeName}"]`;
  const parkedScripts = document.querySelectorAll(selector);

  parkedScripts.forEach(oldScript => {
    const newScript = document.createElement('script');
    
    // Copy attributes and change type to javascript
    newScript.type = 'text/javascript';
    newScript.src = oldScript.src;

    // Replacing the tag forces the browser to execute it
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}
```

---

## 3. Best Practices

- **Essential Scripts**: Only use `is_essential: true` for scripts required for basic site functionality (e.g., session management, security).
- **Initialization**: The SDK checks consent on page load (`init`) and automatically triggers `executeScripts` if valid consent exists.
- **Real-time Updates**: When a user changes preferences in the Privacy Center, the SDK immediately calls `executeScripts` to activate newly granted categories.

---

## 4. Troubleshooting

- **Script executing twice?** The SDK maintains an internal `Set` (`window._cc_executed_vendors`) to ensure scripts are never injected twice in the same session.
- **Script not executing?** Ensure the `data-cc-purpose` value matches exactly what is defined in your Admin Dashboard (e.g., `marketing`, `analytics`).
