export function executeScripts(configData, consentData) {
  if (!configData || !consentData) return;

  const purposes = configData.purposes || [];
  const userChoices = consentData.purposes || [];

  // Manage internal state to avoid duplicate execution
  if (!window._cc_executed_vendors) window._cc_executed_vendors = new Set();
  if (!window._cc_executed_tags) window._cc_executed_tags = new Set();

  purposes.forEach(purpose => {
    const isGranted = userChoices.find(c => c.name === purpose.name)?.status === 'granted';
    
    if (purpose.is_essential || isGranted) {
      // 1. DYNAMIC INJECTION (From Backend Config)
      if (purpose.vendors) {
        purpose.vendors.forEach(vendor => {
          if (window._cc_executed_vendors.has(vendor.vendor_id)) return;
          
          if (vendor.scripts && vendor.scripts.length > 0) {
            vendor.scripts.forEach(src => {
              injectScript(src, `Vendor: ${vendor.name}`);
            });
          }
          window._cc_executed_vendors.add(vendor.vendor_id);
        });
      }

      // 2. TAG-BASED ACTIVATION (In-line HTML Scripts)
      activateParkedScripts(purpose.name);
    }
  });
}

function injectScript(src, label) {
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
  console.log(`[CookieConsent] Executed dynamic script for ${label}: ${src}`);
}

function activateParkedScripts(purposeName) {
  // Find all scripts marked for this purpose with text/plain type
  const selector = `script[type="text/plain"][data-cc-purpose="${purposeName}"]`;
  const parkedScripts = document.querySelectorAll(selector);

  parkedScripts.forEach((oldScript, index) => {
    const scriptId = `${purposeName}_${index}_${oldScript.src || 'inline'}`;
    if (window._cc_executed_tags.has(scriptId)) return;

    const newScript = document.createElement('script');
    
    // Copy all attributes
    Array.from(oldScript.attributes).forEach(attr => {
      if (attr.name !== 'type') {
        newScript.setAttribute(attr.name, attr.value);
      }
    });

    // Set to executable type
    newScript.type = 'text/javascript';

    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.innerHTML = oldScript.innerHTML;
    }

    // Replace the old script or append new one
    oldScript.parentNode.replaceChild(newScript, oldScript);
    window._cc_executed_tags.add(scriptId);
    
    console.log(`[CookieConsent] Activated parked tag for purpose: ${purposeName}`);
  });
}
