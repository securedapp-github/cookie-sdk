import { saveConsentAPI, syncOfflineQueue } from './api.js';
import { getDeviceId } from './device.js';

export function getLocalConsent() {
  
  const data = localStorage.getItem('user_cookie_consent');
  return data ? JSON.parse(data) : null;
}

export function saveLocalConsent(consentData) {
  // Auto-expiry handling (6 months)
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 6);
  
  const payload = {
    ...consentData,
    expiry: expiryDate.toISOString()
  };
  localStorage.setItem('user_cookie_consent', JSON.stringify(payload));
  
  // Dispatch Webhook / Event for client use
  window.dispatchEvent(new CustomEvent('CookieConsentUpdate', { detail: payload }));
}

export function clearLocalConsent() {
  localStorage.removeItem('user_cookie_consent');
  window.dispatchEvent(new CustomEvent('CookieConsentUpdate', { detail: null }));
}

export function isConsentValid(localConsent, currentPolicyVersion) {
  if (!localConsent) return false;
  if (!localConsent.policy_version || localConsent.policy_version !== currentPolicyVersion) return false;
  if (localConsent.expiry && new Date(localConsent.expiry) < new Date()) return false;
  return true;
}

export async function processConsentChoices(tenantId, appId, policyVersion, choices) {
  const deviceId = getDeviceId();
  
  const payload = {
    tenant_id: tenantId,
    app_id: appId,
    device_id: deviceId,
    policy_version: policyVersion,
    purposes: Object.entries(choices).map(([name, isGranted]) => ({
      name,
      status: isGranted ? 'granted' : 'denied',
      timestamp: new Date().toISOString()
    }))
  };

  // Call backend
  const savedResponse = await saveConsentAPI(payload);
  
  // Store locally
  saveLocalConsent(savedResponse);
  
  return savedResponse;
}

// Setup background sync interval
setInterval(syncOfflineQueue, 1000 * 60);
