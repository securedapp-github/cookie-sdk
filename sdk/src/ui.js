import './style.css';
import { getLocalConsent } from './consent.js';

export function showBanner(configData, onComplete, forceOpenModal = false) {
  if (document.getElementById('cc-root-container')) return;

  const root = document.createElement('div');
  root.id = 'cc-root-container';
  document.body.appendChild(root);

  let currentView = 'main'; // 'main' or 'cookie-list'
  let cookieSearch = '';
  let isModalOpen = forceOpenModal;

  const existingConsent = getLocalConsent();
  const grantedPurposes = existingConsent && Array.isArray(existingConsent.purposes)
    ? existingConsent.purposes.filter(p => p.status === 'granted').map(p => p.name)
    : [];

  const currentChoices = {};
  configData.purposes.forEach(p => {
    currentChoices[p.name] = p.is_essential || grantedPurposes.includes(p.name);
  });

  const sortPurposes = (purposes) => {
    return [...purposes].sort((a, b) => {
      if (a.is_essential && !b.is_essential) return -1;
      if (!a.is_essential && b.is_essential) return 1;
      return 0;
    });
  };

  const purposes = sortPurposes(configData.purposes);

  const render = () => {
    root.innerHTML = `
      <div id="cc-mini-banner" class="cc-slideInLeft" style="display: ${isModalOpen ? 'none' : 'flex'}">
        <button id="cc-mini-close">&times;</button>
        <div class="cc-mini-content">
          <span>To enhance your experience, we use cookies. <a href="#" id="cc-link-know">Know more.</a></span>
          <button id="cc-mini-btn-ok">OK</button>
        </div>
      </div>

      <div id="cc-modal-overlay" class="cc-fadeIn" style="display: ${isModalOpen ? 'block' : 'none'}"></div>
      
      <div id="cc-modal-container" class="cc-modal-dialog cc-slideUp" style="display: ${isModalOpen ? 'flex' : 'none'}">
        <div class="cc-modal-header">
          <div class="cc-logo">
             <span style="font-weight: 800; font-size: 1.2rem; color: #f26522;">SECURE <span style="color: #333;">CMS</span></span>
          </div>
          <button id="cc-modal-close" class="cc-close-btn">&times;</button>
        </div>
        
        <div class="cc-modal-body">
          ${currentView === 'main' ? renderMainView() : renderCookieListView()}
        </div>

        <div class="cc-modal-footer">
          <div class="cc-powered-by">Powered by <a href="#">Secure CMS</a></div>
          <div class="cc-action-btns">
            <button id="cc-btn-reject" class="cc-btn cc-btn-secondary">Reject All</button>
            <button id="cc-btn-confirm" class="cc-btn cc-btn-primary">Confirm My Choices</button>
          </div>
        </div>
      </div>
    `;

    attachEvents();
  };

  const renderMainView = () => {
    return `
      <div class="cc-view-container">
        <div class="cc-view-title">Privacy Preference Center</div>
        <div class="cc-view-desc">
          When you visit any website, it may store or retrieve information on your browser, mostly in the form of cookies. This information might be about you, your preferences or your device and is mostly used to make the site work as you expect it to. The information does not usually directly identify you, but it can give you a more personalized web experience. Because we respect your right to privacy, you can choose not to allow some types of cookies. Click on the different category headings to find out more and change our default settings. However, blocking some types of cookies may impact your experience of the site and the services we are able to offer.
        </div>
        
        ${configData.privacyPolicyUrl ? `
          <div class="cc-privacy-link">
            <a href="${configData.privacyPolicyUrl}" target="_blank">Read our Privacy Policy</a>
          </div>
        ` : ''}
        
        <button id="cc-btn-allow-all" class="cc-btn cc-btn-primary cc-btn-full" style="margin-bottom: 24px;">Allow All</button>

        <div class="cc-manage-link" id="cc-goto-cookies">Manage Consent Preferences</div>

        <div class="cc-purposes-list">
          ${purposes.map(p => `
            <div class="cc-purpose-item" id="cc-purpose-${p.name}">
              <div class="cc-purpose-header" onclick="document.getElementById('cc-purpose-${p.name}').classList.toggle('open')">
                <div class="cc-purpose-title-wrap">
                  <div class="cc-arrow"></div>
                  <span class="cc-purpose-title">${p.title}</span>
                  ${p.is_essential ? '<span class="cc-purpose-status">Always Active</span>' : ''}
                </div>
                ${!p.is_essential ? `
                  <label class="cc-switch">
                    <input type="checkbox" class="cc-purpose-toggle" data-purpose="${p.name}" ${currentChoices[p.name] ? 'checked' : ''}>
                    <span class="cc-slider"></span>
                  </label>
                ` : ''}
              </div>
              <div class="cc-purpose-content">
                <div class="cc-purpose-desc">${p.description}</div>
                <div class="cc-cookie-details-link" onclick="window.ccSetView('cookie-list')">Cookie Details</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const renderCookieListView = () => {
    return `
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
          <input type="text" id="cc-cookie-search" class="cc-search-input" placeholder="Search..." value="${cookieSearch}">
        </div>

        <div class="cc-cookie-groups">
          ${purposes.map(p => `
            <div class="cc-cookie-group cc-nested-group" data-purpose="${p.name}">
              <div class="cc-cookie-group-title">${p.title}</div>
              ${p.vendors && p.vendors.length > 0 ? p.vendors.map(v => `
                <div class="cc-vendor-wrap" data-vendor="${v.vendor_id}">
                  <div class="cc-cookie-row-header">
                    <div class="cc-cookie-name-wrap">
                       <div class="cc-cookie-icon"></div>
                       <span class="cc-cookie-name">${v.name}</span>
                    </div>
                  </div>
                  <div class="cc-cookie-list-inner">
                    ${v.cookies && v.cookies.length > 0 ? v.cookies.map(c => `
                       <div class="cc-cookie-row" id="cc-cookie-${c.name}">
                          <div class="cc-cookie-row-header" onclick="document.getElementById('cc-cookie-${c.name}').classList.toggle('open')">
                             <span class="cc-cookie-host">${c.name} (${c.host})</span>
                             <div class="cc-cookie-details-link">Details</div>
                          </div>
                          <div class="cc-cookie-row-details">
                            <div class="cc-detail-grid">
                              <div class="cc-detail-label">Name</div><div class="cc-detail-value">${c.name}</div>
                              <div class="cc-detail-label">Host</div><div class="cc-detail-value">${c.host}</div>
                              <div class="cc-detail-label">Description</div><div class="cc-detail-value">${c.description}</div>
                            </div>
                          </div>
                       </div>
                    `).join('') : '<div class="cc-no-cookies">No cookies found for this vendor.</div>'}
                  </div>
                </div>
              `).join('') : '<div class="cc-no-vendors">No vendors found for this purpose.</div>'}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const attachEvents = () => {
    const miniBanner = document.getElementById('cc-mini-banner');
    const modalOverlay = document.getElementById('cc-modal-overlay');
    const modalContainer = document.getElementById('cc-modal-container');

    const openModal = () => {
      isModalOpen = true;
      render();
    };

    const closeModal = () => {
      isModalOpen = false;
      render();
    };

    if (document.getElementById('cc-link-know')) {
      document.getElementById('cc-link-know').onclick = (e) => { e.preventDefault(); openModal(); };
    }

    if (document.getElementById('cc-modal-close')) {
      document.getElementById('cc-modal-close').onclick = closeModal;
    }

    if (document.getElementById('cc-mini-close')) {
      document.getElementById('cc-mini-close').onclick = () => {
        miniBanner.style.display = 'none';
      };
    }

    if (document.getElementById('cc-goto-cookies')) {
      document.getElementById('cc-goto-cookies').onclick = () => { currentView = 'cookie-list'; render(); };
    }

    if (document.getElementById('cc-btn-allow-all')) {
      document.getElementById('cc-btn-allow-all').onclick = () => {
        const checkboxes = document.querySelectorAll('.cc-switch input');
        checkboxes.forEach(cb => {
          if (!cb.disabled) {
            cb.checked = true;
            const purpose = cb.getAttribute('data-purpose');
            if (purpose) currentChoices[purpose] = true;
          }
        });
      };
    }

    document.querySelectorAll('.cc-purpose-toggle').forEach(cb => {
      cb.onchange = (e) => {
        const purpose = e.target.getAttribute('data-purpose');
        currentChoices[purpose] = e.target.checked;
      };
    });

    if (document.getElementById('cc-back-to-main')) {
      document.getElementById('cc-back-to-main').onclick = () => { currentView = 'main'; render(); };
    }

    if (document.getElementById('cc-cookie-search')) {
      document.getElementById('cc-cookie-search').oninput = (e) => {
        cookieSearch = e.target.value;
        const search = cookieSearch.toLowerCase();
        const purposeGroups = document.querySelectorAll('.cc-cookie-group');

        purposeGroups.forEach(group => {
          const vendors = group.querySelectorAll('.cc-vendor-wrap');
          let groupHasMatch = false;

          vendors.forEach(vendor => {
            const cookies = vendor.querySelectorAll('.cc-cookie-row');
            const vendorName = vendor.querySelector('.cc-cookie-name').textContent.toLowerCase();
            let vendorHasMatch = vendorName.includes(search);

            cookies.forEach(cookie => {
              const cookieText = cookie.textContent.toLowerCase();
              const cookieMatches = cookieText.includes(search);
              cookie.style.display = (cookieMatches || vendorName.includes(search)) ? 'block' : 'none';
              if (cookieMatches) vendorHasMatch = true;
            });

            vendor.style.display = vendorHasMatch ? 'block' : 'none';
            if (vendorHasMatch) groupHasMatch = true;
          });

          group.style.display = groupHasMatch ? 'block' : 'none';
        });
      };
      document.getElementById('cc-cookie-search').focus();
    }

    // Modal Actions
    document.getElementById('cc-btn-confirm').onclick = () => {
      completeAndClose({...currentChoices});
    };

    document.getElementById('cc-btn-reject').onclick = () => {
      const choices = {};
      purposes.forEach(p => {
        choices[p.name] = p.is_essential;
      });
      completeAndClose(choices);
    };

    document.getElementById('cc-mini-btn-ok').onclick = () => {
      const choices = {};
      purposes.forEach(p => {
        choices[p.name] = true;
      });
      completeAndClose(choices);
    };

    // Global helper for links in strings
    window.ccSetView = (view) => {
      currentView = view;
      render();
    };
  };

  const completeAndClose = (choices) => {
    root.remove();
    onComplete(choices);
  };

  render();
}
