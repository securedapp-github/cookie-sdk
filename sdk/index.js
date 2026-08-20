import './src/style.css';
import { fetchConfig, getUserConsentAPI, linkConsentAPI } from './src/api.js';
import { getLocalConsent, isConsentValid, processConsentChoices, saveLocalConsent, clearLocalConsent } from './src/consent.js';
import { executeScripts } from './src/scriptManager.js';
import { showBanner } from './src/ui.js';

class CookieConsentSDK {
  constructor() {
    this.tenantId = null;
    this.appId = null;
    this.configData = null;
  }

  async init(tenantId, appId) {
    this.tenantId = tenantId;
    this.appId = appId;
    
    // Fetch Configuration from Backend
    this.configData = await fetchConfig(tenantId, appId);
    
    if (!this.configData) {
      console.warn("CookieConsentSDK: Disabled due to config fetch failure.");
      return;
    }

    const localConsent = getLocalConsent();

    if (isConsentValid(localConsent, this.configData.policy_version)) {
      // Execute choices directly without showing banner
      executeScripts(this.configData, localConsent);
    } else {
      // Show Banner
      showBanner(this.configData, async (choices) => {
        const savedConsent = await processConsentChoices(
          this.tenantId, 
          this.appId, 
          this.configData.policy_version, 
          choices
        );
        executeScripts(this.configData, savedConsent);
      });
    }
  }

  // Handle Updates
  openPreferences() {
    if(!this.configData) return;
    
    // Destroy existing banner to force re-render with fresh states
    const existingRoot = document.getElementById('cc-root-container');
    if (existingRoot) existingRoot.remove();

    showBanner(this.configData, async (choices) => {
        const savedConsent = await processConsentChoices(
          this.tenantId, 
          this.appId, 
          this.configData.policy_version, 
          choices
        );
        executeScripts(this.configData, savedConsent);
    }, true);
  }

  // Handle Logins (accepts JWT token string, { userId, token }, or userId, token)
  async loginUser(userTokenOrId, maybeToken = null) {
     let userId = userTokenOrId;
     let token = maybeToken;

     // If first parameter is a JWT string
     if (typeof userTokenOrId === 'string' && userTokenOrId.split('.').length === 3) {
       token = userTokenOrId;
       try {
         const base64Url = token.split('.')[1];
         const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
         const jsonStr = decodeURIComponent(escape(atob(base64)));
         const decoded = JSON.parse(jsonStr);
         if (decoded && decoded.sub) {
           userId = decoded.sub;
         }
       } catch (e) {
         console.warn("Consent SDK: Could not parse sub claim from JWT", e);
       }
     } else if (typeof userTokenOrId === 'object' && userTokenOrId !== null) {
       userId = userTokenOrId.userId || userTokenOrId.sub;
       token = userTokenOrId.token || userTokenOrId.jwt;
     }

     const localConsent = getLocalConsent();
     
     const syncAndClean = (record) => {
         saveLocalConsent(record);
         executeScripts(this.configData, record);
         // Clean up banner if it was hanging around natively since we sync'd background states now.
         const bannerRoot = document.getElementById('cc-root-container');
         if (bannerRoot) bannerRoot.remove();
     };

     if (localConsent && localConsent.consent_id) {
       await linkConsentAPI(localConsent.consent_id, userId, token, this.tenantId, this.appId);
     } 
     const res = await getUserConsentAPI(userId, token, this.tenantId, this.appId);
     if (res) {
        syncAndClean(res);
     }
  }

  // Handle Logout
  logoutUser() {
    clearLocalConsent();
    const existingRoot = document.getElementById('cc-root-container');
    if (existingRoot) existingRoot.remove();

    if (this.configData) {
      showBanner(this.configData, async (choices) => {
        const savedConsent = await processConsentChoices(
          this.tenantId,
          this.appId,
          this.configData.policy_version,
          choices
        );
        executeScripts(this.configData, savedConsent);
      });
    }
  }
}

window.CookieConsent = new CookieConsentSDK();
