(function(){function e(){let e=localStorage.getItem(`consent_device_id`);return e||(e=`dev_`+Math.random().toString(36).substr(2,9)+Date.now().toString(36),localStorage.setItem(`consent_device_id`,e)),e}var t=`https://cookie-be.securedapp.io/api`;async function n(e,n){try{return await(await fetch(`${t}/config/${e}/${n}`)).json()}catch(e){return console.error(`Consent SDK: Failed to fetch config`,e),null}}async function r(e){try{return await(await fetch(`${t}/cookie-consents`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify(e)})).json()}catch{return console.error(`Consent SDK: API failed. Queuing for background sync.`),o(e,`POST`,`/cookie-consents`),{...e,consent_id:`pending_`+Date.now()}}}async function i(n,r,i=null,a=null,s=null){let c={consent_id:n,user_id:r,device_id:e(),tenant_id:a,app_id:s},l={"Content-Type":`application/json`};i&&(l.Authorization=`Bearer ${i}`);try{return await(await fetch(`${t}/cookie-consents/link`,{method:`POST`,headers:l,body:JSON.stringify(c)})).json()}catch{return o(c,`POST`,`/cookie-consents/link`),null}}async function a(e,n=null,r=null,i=null){try{let a=new URLSearchParams;r&&a.append(`tenant_id`,r),i&&a.append(`app_id`,i);let o=a.toString()?`?${a.toString()}`:``,s={};n&&(s.Authorization=`Bearer ${n}`);let c=await fetch(`${t}/cookie-consents/user/${e}${o}`,{headers:s});return c.ok?await c.json():null}catch{return null}}function o(e,t,n){let r=JSON.parse(localStorage.getItem(`consent_offline_queue`)||`[]`);r.push({payload:e,method:t,endpoint:n,timestamp:Date.now()}),localStorage.setItem(`consent_offline_queue`,JSON.stringify(r))}async function s(){let e=JSON.parse(localStorage.getItem(`consent_offline_queue`)||`[]`);if(e.length===0)return;let n=[...e];localStorage.setItem(`consent_offline_queue`,`[]`);for(let e of n)try{await fetch(`${t}${e.endpoint}`,{method:e.method,headers:{"Content-Type":`application/json`},body:JSON.stringify(e.payload)})}catch{o(e.payload,e.method,e.endpoint)}}function c(){let e=localStorage.getItem(`user_cookie_consent`);return e?JSON.parse(e):null}function l(e){let t=new Date;t.setMonth(t.getMonth()+6);let n={...e,expiry:t.toISOString()};localStorage.setItem(`user_cookie_consent`,JSON.stringify(n)),window.dispatchEvent(new CustomEvent(`CookieConsentUpdate`,{detail:n}))}function u(){localStorage.removeItem(`user_cookie_consent`),window.dispatchEvent(new CustomEvent(`CookieConsentUpdate`,{detail:null}))}function d(e,t){return!(!e||!e.policy_version||e.policy_version!==t||e.expiry&&new Date(e.expiry)<new Date)}async function f(t,n,i,a){let o=await r({tenant_id:t,app_id:n,device_id:e(),policy_version:i,purposes:Object.entries(a).map(([e,t])=>({name:e,status:t?`granted`:`denied`,timestamp:new Date().toISOString()}))});return l(o),o}setInterval(s,1e3*60);function p(e,t){if(!e||!t)return;let n=e.purposes||[],r=t.purposes||[];window._cc_executed_vendors||(window._cc_executed_vendors=new Set),window._cc_executed_tags||(window._cc_executed_tags=new Set),n.forEach(e=>{let t=r.find(t=>t.name===e.name)?.status===`granted`;(e.is_essential||t)&&(e.vendors&&e.vendors.forEach(e=>{window._cc_executed_vendors.has(e.vendor_id)||(e.scripts&&e.scripts.length>0&&e.scripts.forEach(t=>{m(t,`Vendor: ${e.name}`)}),window._cc_executed_vendors.add(e.vendor_id))}),h(e.name))})}function m(e,t){let n=document.createElement(`script`);n.src=e,n.async=!0,document.head.appendChild(n),console.log(`[CookieConsent] Executed dynamic script for ${t}: ${e}`)}function h(e){let t=`script[type="text/plain"][data-cc-purpose="${e}"]`;document.querySelectorAll(t).forEach((t,n)=>{let r=`${e}_${n}_${t.src||`inline`}`;if(window._cc_executed_tags.has(r))return;let i=document.createElement(`script`);Array.from(t.attributes).forEach(e=>{e.name!==`type`&&i.setAttribute(e.name,e.value)}),i.type=`text/javascript`,t.src?i.src=t.src:i.innerHTML=t.innerHTML,t.parentNode.replaceChild(i,t),window._cc_executed_tags.add(r),console.log(`[CookieConsent] Activated parked tag for purpose: ${e}`)})}function g(e,t,n=!1){if(document.getElementById(`cc-root-container`))return;let r=document.createElement(`div`);r.id=`cc-root-container`,document.body.appendChild(r);let i=`main`,a=``,o=n,s=c(),l=s&&Array.isArray(s.purposes)?s.purposes.filter(e=>e.status===`granted`).map(e=>e.name):[],u={};e.purposes.forEach(e=>{u[e.name]=e.is_essential||l.includes(e.name)});let d=(e=>[...e].sort((e,t)=>e.is_essential&&!t.is_essential?-1:!e.is_essential&&t.is_essential?1:0))(e.purposes),f=()=>{r.innerHTML=`
      <div id="cc-mini-banner" class="cc-slideInLeft" style="display: ${o?`none`:`flex`}">
        <button id="cc-mini-close">&times;</button>
        <div class="cc-mini-content">
          <span>To enhance your experience, we use cookies. <a href="#" id="cc-link-know">Know more.</a></span>
          <button id="cc-mini-btn-ok">OK</button>
        </div>
      </div>

      <div id="cc-modal-overlay" class="cc-fadeIn" style="display: ${o?`block`:`none`}"></div>
      
      <div id="cc-modal-container" class="cc-modal-dialog cc-slideUp" style="display: ${o?`flex`:`none`}">
        <div class="cc-modal-header">
          <div class="cc-logo">
             <span style="font-weight: 800; font-size: 1.2rem; color: #f26522;">SECURE <span style="color: #333;">CMS</span></span>
          </div>
          <button id="cc-modal-close" class="cc-close-btn">&times;</button>
        </div>
        
        <div class="cc-modal-body">
          ${i===`main`?p():m()}
        </div>

        <div class="cc-modal-footer">
          <div class="cc-powered-by">Powered by <a href="#">Secure CMS</a></div>
          <div class="cc-action-btns">
            <button id="cc-btn-reject" class="cc-btn cc-btn-secondary">Reject All</button>
            <button id="cc-btn-confirm" class="cc-btn cc-btn-primary">Confirm My Choices</button>
          </div>
        </div>
      </div>
    `,h()},p=()=>`
      <div class="cc-view-container">
        <div class="cc-view-title">Privacy Preference Center</div>
        <div class="cc-view-desc">
          When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change our default settings. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer.
        </div>
        
        ${e.privacyPolicyUrl?`
          <div class="cc-privacy-link">
            <a href="${e.privacyPolicyUrl}" target="_blank">Read our Privacy Policy</a>
          </div>
        `:``}
        
        <button id="cc-btn-allow-all" class="cc-btn cc-btn-primary cc-btn-full" style="margin-bottom: 24px;">Allow All</button>

        <div class="cc-manage-link" id="cc-goto-cookies">Manage Consent Preferences</div>

        <div class="cc-purposes-list">
          ${d.map(e=>`
            <div class="cc-purpose-item" id="cc-purpose-${e.name}">
              <div class="cc-purpose-header" onclick="document.getElementById('cc-purpose-${e.name}').classList.toggle('open')">
                <div class="cc-purpose-title-wrap">
                  <div class="cc-arrow"></div>
                  <span class="cc-purpose-title">${e.title}</span>
                  ${e.is_essential?`<span class="cc-purpose-status">Always Active</span>`:``}
                </div>
                ${e.is_essential?``:`
                  <label class="cc-switch">
                    <input type="checkbox" class="cc-purpose-toggle" data-purpose="${e.name}" ${u[e.name]?`checked`:``}>
                    <span class="cc-slider"></span>
                  </label>
                `}
              </div>
              <div class="cc-purpose-content">
                <div class="cc-purpose-desc">${e.description}</div>
                <div class="cc-cookie-details-link" onclick="window.ccSetView('cookie-list')">Cookie Details</div>
              </div>
            </div>
          `).join(``)}
        </div>
      </div>
    `,m=()=>`
      <div class="cc-view-container">
        <div class="cc-cookie-list-header">
          <div class="cc-back-btn" id="cc-back-to-main">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Back
          </div>
          <div class="cc-view-title">Cookie List</div>
        </div>

        <div class="cc-search-container">
          <span class="cc-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input type="text" id="cc-cookie-search" class="cc-search-input" placeholder="Search..." value="${a}">
        </div>

        <div class="cc-cookie-groups">
          ${d.map(e=>`
            <div class="cc-cookie-group cc-nested-group" data-purpose="${e.name}">
              <div class="cc-cookie-group-title">${e.title}</div>
              ${e.vendors&&e.vendors.length>0?e.vendors.map(e=>`
                <div class="cc-vendor-wrap" data-vendor="${e.vendor_id}">
                  <div class="cc-cookie-row-header">
                    <div class="cc-cookie-name-wrap">
                       <div class="cc-cookie-icon"></div>
                       <span class="cc-cookie-name">${e.name}</span>
                    </div>
                  </div>
                  <div class="cc-cookie-list-inner">
                    ${e.cookies&&e.cookies.length>0?e.cookies.map(e=>`
                       <div class="cc-cookie-row" id="cc-cookie-${e.name}">
                          <div class="cc-cookie-row-header" onclick="document.getElementById('cc-cookie-${e.name}').classList.toggle('open')">
                             <span class="cc-cookie-host">${e.name} (${e.host})</span>
                             <div class="cc-cookie-details-link">Details</div>
                          </div>
                          <div class="cc-cookie-row-details">
                            <div class="cc-detail-grid">
                              <div class="cc-detail-label">Name</div><div class="cc-detail-value">${e.name}</div>
                              <div class="cc-detail-label">Host</div><div class="cc-detail-value">${e.host}</div>
                              <div class="cc-detail-label">Description</div><div class="cc-detail-value">${e.description}</div>
                            </div>
                          </div>
                       </div>
                    `).join(``):`<div class="cc-no-cookies">No cookies found for this vendor.</div>`}
                  </div>
                </div>
              `).join(``):`<div class="cc-no-vendors">No vendors found for this purpose.</div>`}
            </div>
          `).join(``)}
        </div>
      </div>
    `,h=()=>{let e=document.getElementById(`cc-mini-banner`);document.getElementById(`cc-modal-overlay`),document.getElementById(`cc-modal-container`);let t=()=>{o=!0,f()},n=()=>{o=!1,f()};document.getElementById(`cc-link-know`)&&(document.getElementById(`cc-link-know`).onclick=e=>{e.preventDefault(),t()}),document.getElementById(`cc-modal-close`)&&(document.getElementById(`cc-modal-close`).onclick=n),document.getElementById(`cc-mini-close`)&&(document.getElementById(`cc-mini-close`).onclick=()=>{e.style.display=`none`}),document.getElementById(`cc-goto-cookies`)&&(document.getElementById(`cc-goto-cookies`).onclick=()=>{i=`cookie-list`,f()}),document.getElementById(`cc-btn-allow-all`)&&(document.getElementById(`cc-btn-allow-all`).onclick=()=>{document.querySelectorAll(`.cc-switch input`).forEach(e=>{if(!e.disabled){e.checked=!0;let t=e.getAttribute(`data-purpose`);t&&(u[t]=!0)}})}),document.querySelectorAll(`.cc-purpose-toggle`).forEach(e=>{e.onchange=e=>{let t=e.target.getAttribute(`data-purpose`);u[t]=e.target.checked}}),document.getElementById(`cc-back-to-main`)&&(document.getElementById(`cc-back-to-main`).onclick=()=>{i=`main`,f()}),document.getElementById(`cc-cookie-search`)&&(document.getElementById(`cc-cookie-search`).oninput=e=>{a=e.target.value;let t=a.toLowerCase();document.querySelectorAll(`.cc-cookie-group`).forEach(e=>{let n=e.querySelectorAll(`.cc-vendor-wrap`),r=!1;n.forEach(e=>{let n=e.querySelectorAll(`.cc-cookie-row`),i=e.querySelector(`.cc-cookie-name`).textContent.toLowerCase(),a=i.includes(t);n.forEach(e=>{let n=e.textContent.toLowerCase().includes(t);e.style.display=n||i.includes(t)?`block`:`none`,n&&(a=!0)}),e.style.display=a?`block`:`none`,a&&(r=!0)}),e.style.display=r?`block`:`none`})},document.getElementById(`cc-cookie-search`).focus()),document.getElementById(`cc-btn-confirm`).onclick=()=>{g({...u})},document.getElementById(`cc-btn-reject`).onclick=()=>{let e={};d.forEach(t=>{e[t.name]=t.is_essential}),g(e)},document.getElementById(`cc-mini-btn-ok`).onclick=()=>{let e={};d.forEach(t=>{e[t.name]=!0}),g(e)},window.ccSetView=e=>{i=e,f()}},g=e=>{r.remove(),t(e)};f()}window.CookieConsent=new class{constructor(){this.tenantId=null,this.appId=null,this.configData=null}async init(e,t){if(this.tenantId=e,this.appId=t,this.configData=await n(e,t),!this.configData){console.warn(`CookieConsentSDK: Disabled due to config fetch failure.`);return}let r=c();d(r,this.configData.policy_version)?p(this.configData,r):g(this.configData,async e=>{let t=await f(this.tenantId,this.appId,this.configData.policy_version,e);p(this.configData,t)})}openPreferences(){if(!this.configData)return;let e=document.getElementById(`cc-root-container`);e&&e.remove(),g(this.configData,async e=>{let t=await f(this.tenantId,this.appId,this.configData.policy_version,e);p(this.configData,t)},!0)}async loginUser(e,t=null){let n=e,r=t;if(typeof e==`string`&&e.split(`.`).length===3){r=e;try{let e=r.split(`.`)[1].replace(/-/g,`+`).replace(/_/g,`/`),t=decodeURIComponent(escape(atob(e))),i=JSON.parse(t);i&&i.sub&&(n=i.sub)}catch(e){console.warn(`Consent SDK: Could not parse sub claim from JWT`,e)}}else typeof e==`object`&&e&&(n=e.userId||e.sub,r=e.token||e.jwt);let o=c(),s=e=>{l(e),p(this.configData,e);let t=document.getElementById(`cc-root-container`);t&&t.remove()};o&&o.consent_id&&await i(o.consent_id,n,r,this.tenantId,this.appId);let u=await a(n,r,this.tenantId,this.appId);u&&s(u)}logoutUser(){u();let e=document.getElementById(`cc-root-container`);e&&e.remove(),this.configData&&g(this.configData,async e=>{let t=await f(this.tenantId,this.appId,this.configData.policy_version,e);p(this.configData,t)})}}})();