import { getDeviceId } from './device.js';

const API_BASE = 'http://localhost:3000/api';
// const API_BASE = 'https://cookie-be.securedapp.io/api';

export async function fetchConfig(tenantId, appId) {
  try {
    const res = await fetch(`${API_BASE}/config/${tenantId}/${appId}`);
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to fetch config', error);
    return null;
  }
}

export async function saveConsentAPI(payload) {
  try {
    const res = await fetch(`${API_BASE}/cookie-consents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: API failed. Queuing for background sync.');
    queueOfflineRequest(payload, 'POST', '/cookie-consents');
    // Return pseudo-consent structure so script manager can proceed
    return { ...payload, consent_id: 'pending_' + Date.now() };
  }
}

export async function linkConsentAPI(consentId, userId, token = null, tenantId = null, appId = null) {
  const deviceId = getDeviceId();
  const payload = { consent_id: consentId, user_id: userId, device_id: deviceId, tenant_id: tenantId, app_id: appId };
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}/cookie-consents/link`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    return await res.json();
  } catch (error) {
    queueOfflineRequest(payload, 'POST', '/cookie-consents/link');
    return null;
  }
}

export async function getUserConsentAPI(userId, token = null, tenantId = null, appId = null) {
  try {
    const params = new URLSearchParams();
    if (tenantId) params.append('tenant_id', tenantId);
    if (appId) params.append('app_id', appId);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/cookie-consents/user/${userId}${queryString}`, {
      headers
    });
    if (res.ok) return await res.json();
    return null;
  } catch (e) {
    return null;
  }
}

// Background retry logic
function queueOfflineRequest(payload, method, endpoint) {
  const queue = JSON.parse(localStorage.getItem('consent_offline_queue') || '[]');
  queue.push({ payload, method, endpoint, timestamp: Date.now() });
  localStorage.setItem('consent_offline_queue', JSON.stringify(queue));
}

export async function syncOfflineQueue() {
  const queue = JSON.parse(localStorage.getItem('consent_offline_queue') || '[]');
  if (queue.length === 0) return;

  const tempQueue = [...queue];
  localStorage.setItem('consent_offline_queue', '[]'); // Clear early to prevent duplicates

  for (const req of tempQueue) {
    try {
      await fetch(`${API_BASE}${req.endpoint}`, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.payload)
      });
    } catch (e) {
      // Requeue if still failing
      queueOfflineRequest(req.payload, req.method, req.endpoint);
    }
  }
}

// --- Admin & Management APIs ---

export async function getVendorsAPI() {
  try {
    const res = await fetch(`${API_BASE}/admin/vendors`);
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to fetch vendors', error);
    return [];
  }
}

export async function upsertVendorAPI(vendorData) {
  try {
    const res = await fetch(`${API_BASE}/admin/vendors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorData)
    });
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to upsert vendor', error);
    return null;
  }
}

export async function getPurposesAPI() {
  try {
    const res = await fetch(`${API_BASE}/admin/purposes`);
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to fetch purposes', error);
    return [];
  }
}

export async function upsertPurposeAPI(purposeData) {
  try {
    const res = await fetch(`${API_BASE}/admin/purposes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purposeData)
    });
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to upsert purpose', error);
    return null;
  }
}

export async function upsertAppConfigAPI(configData) {
  try {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    });
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to upsert app config', error);
    return null;
  }
}

export async function getAdminConsentsAPI(page = 1, limit = 10) {
  try {
    const res = await fetch(`${API_BASE}/admin/cookie-consents?page=${page}&limit=${limit}`);
    return await res.json();
  } catch (error) {
    console.error('Consent SDK: Failed to fetch admin consents', error);
    return null;
  }
}
