/**
 * SyncPad - Application UI Controller & User Interaction
 * Modern, colorful, vector-icon UI • Optimized for link pasting • Permanent persistence
 */

(function () {
  // SVG Icon Templates (Clean modern vector icons - zero emojis)
  const ICONS = {
    link: `<svg class="icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    externalLink: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    copy: `<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg class="icon" viewBox="0 0 24 24" style="stroke: #10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    trash: `<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    clipboard: `<svg class="icon" viewBox="0 0 24 24"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`,
    plus: `<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
    globe: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`
  };

  // DOM Elements
  const quickPasteInput = document.getElementById('quick-paste-input');
  const btnPasteClipboard = document.getElementById('btn-paste-clipboard');
  const btnAddLink = document.getElementById('btn-add-link');
  const linkCardsContainer = document.getElementById('link-cards-container');
  const emptyLinksPlaceholder = document.getElementById('empty-links-placeholder');
  const linkCountBadge = document.getElementById('link-count-badge');
  const linkListTitleCount = document.getElementById('link-list-title-count');
  const paperTextarea = document.getElementById('paper-textarea');
  
  // Segmented Mode Controls
  const segmentInteractive = document.getElementById('segment-interactive');
  const segmentRaw = document.getElementById('segment-raw');
  const linkListView = document.getElementById('link-list-view');
  const rawNotepadView = document.getElementById('raw-notepad-view');

  // Status & Room Elements
  const syncStatusDot = document.getElementById('sync-status-dot');
  const syncStatusText = document.getElementById('sync-status-text');
  const roomNameDisplay = document.getElementById('room-name-display');
  const btnShareRoom = document.getElementById('btn-share-room');

  // Batch Action Buttons
  const btnOpenAll = document.getElementById('btn-open-all');
  const btnCopyAll = document.getElementById('btn-copy-all');
  const btnClearAll = document.getElementById('btn-clear-all');

  // Stats Footer Elements
  const statLinkCount = document.getElementById('stat-link-count');
  const statWordCount = document.getElementById('stat-word-count');
  const statCharCount = document.getElementById('stat-char-count');
  const statDeviceName = document.getElementById('stat-device-name');

  // Customization Selectors
  const selectTheme = document.getElementById('select-theme');
  const selectFont = document.getElementById('select-font');
  const selectRuling = document.getElementById('select-ruling');

  // Modals & Toasts
  const shareModal = document.getElementById('share-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const shareUrlInput = document.getElementById('share-url-input');
  const btnCopyShareUrl = document.getElementById('btn-copy-share-url');
  const qrCodeBox = document.getElementById('qr-code-box');
  const toastContainer = document.getElementById('toast-container');

  // State
  let currentLinks = [];
  let isEditingTextarea = false;

  // Initialize
  function init() {
    loadPreferences();
    setupEventListeners();
    setupSyncEngine();
    updateShareUrl();
    statDeviceName.textContent = window.syncEngine.deviceInfo.name;
  }

  function loadPreferences() {
    const theme = localStorage.getItem('syncpad_theme') || 'light';
    const font = localStorage.getItem('syncpad_font') || 'sans';
    const ruling = localStorage.getItem('syncpad_ruling') || 'blank';

    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.setProperty('--font-current', getFontFamily(font));
    document.body.setAttribute('data-ruling', ruling);

    if (selectTheme) selectTheme.value = theme;
    if (selectFont) selectFont.value = font;
    if (selectRuling) selectRuling.value = ruling;
  }

  function getFontFamily(fontKey) {
    if (fontKey === 'mono') return 'var(--font-family-mono)';
    if (fontKey === 'serif') return 'var(--font-family-serif)';
    return 'var(--font-family-sans)';
  }

  // Setup Sync Engine Event Bindings
  function setupSyncEngine() {
    const sync = window.syncEngine;

    sync.onLinksUpdate = (links) => {
      currentLinks = links || [];
      renderLinks(currentLinks);
      updateStats();
    };

    sync.onNotesUpdate = (text) => {
      if (!isEditingTextarea) {
        paperTextarea.value = text;
        updateTextStats(text);
      }
    };

    sync.onPeersUpdate = ({ count, peers, currentDevice }) => {
      if (count > 1) {
        const osList = Array.from(new Set(peers.map(p => p.os))).join(' & ');
        syncStatusText.textContent = `${count} devices online (${osList})`;
        syncStatusDot.className = 'status-dot connected';
      } else {
        syncStatusText.textContent = '1 device online (Waiting for peer)';
        syncStatusDot.className = 'status-dot connected';
      }
    };

    sync.onStatusUpdate = ({ status }) => {
      if (status === 'connected') {
        syncStatusDot.className = 'status-dot connected';
        syncStatusText.textContent = sync.getActivePeerCountText();
      } else if (status === 'offline') {
        syncStatusDot.className = 'status-dot syncing';
        syncStatusText.textContent = 'Offline (Saved locally)';
      } else {
        syncStatusDot.className = 'status-dot syncing';
        syncStatusText.textContent = 'Connecting...';
      }
    };

    sync.init();
  }

  // UI Event Listeners
  function setupEventListeners() {
    // 1. Add link via Quick Paste input
    btnAddLink.addEventListener('click', handleAddLinkInput);
    quickPasteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddLinkInput();
      }
    });

    // 2. Paste from Clipboard button
    btnPasteClipboard.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          processPastedText(text);
        } else {
          showToast('Clipboard is empty');
        }
      } catch (err) {
        quickPasteInput.focus();
        showToast('Please press Cmd+V / Ctrl+V to paste');
      }
    });

    // 3. Global Paste Listener: paste link from anywhere
    window.addEventListener('paste', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'textarea' || (activeTag === 'input' && document.activeElement !== quickPasteInput)) {
        return;
      }

      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      if (pastedText && isUrlOrContainsUrls(pastedText)) {
        e.preventDefault();
        processPastedText(pastedText);
      }
    });

    // 4. View Mode Segmented Controls
    segmentInteractive.addEventListener('click', () => switchView('interactive'));
    segmentRaw.addEventListener('click', () => switchView('raw'));

    // 5. Raw textarea input listener (collaborative typing)
    paperTextarea.addEventListener('input', () => {
      isEditingTextarea = true;
      const text = paperTextarea.value;
      window.syncEngine.setRawNotes(text);
      updateTextStats(text);
      setTimeout(() => { isEditingTextarea = false; }, 200);
    });

    // 6. Batch Actions
    btnOpenAll.addEventListener('click', () => {
      const unopened = currentLinks.filter(l => !l.opened);
      const toOpen = unopened.length > 0 ? unopened : currentLinks;
      if (toOpen.length === 0) {
        showToast('No links to open');
        return;
      }
      toOpen.forEach(link => {
        window.open(link.url, '_blank', 'noopener,noreferrer');
        if (!link.opened) {
          window.syncEngine.toggleLinkOpened(link.id);
        }
      });
      showToast(`Opened ${toOpen.length} links in new tabs`);
    });

    btnCopyAll.addEventListener('click', () => {
      if (currentLinks.length === 0) {
        showToast('No links to copy');
        return;
      }
      const textList = currentLinks.map(l => l.note ? `${l.note}: ${l.url}` : l.url).join('\n');
      navigator.clipboard.writeText(textList).then(() => {
        showToast(`Copied ${currentLinks.length} links to clipboard!`);
      });
    });

    btnClearAll.addEventListener('click', () => {
      if (currentLinks.length === 0) {
        showToast('No links to delete');
        return;
      }
      if (confirm(`Are you sure you want to permanently delete all ${currentLinks.length} links?`)) {
        window.syncEngine.clearAllLinks();
        showToast('All links cleared');
      }
    });

    // 7. Customization Selectors
    selectTheme.addEventListener('change', (e) => {
      const val = e.target.value;
      document.documentElement.setAttribute('data-theme', val);
      localStorage.setItem('syncpad_theme', val);
    });

    selectFont.addEventListener('change', (e) => {
      const val = e.target.value;
      document.body.style.setProperty('--font-current', getFontFamily(val));
      localStorage.setItem('syncpad_font', val);
    });

    selectRuling.addEventListener('change', (e) => {
      const val = e.target.value;
      document.body.setAttribute('data-ruling', val);
      localStorage.setItem('syncpad_ruling', val);
    });

    // 8. Room Sharing & Modals
    btnShareRoom.addEventListener('click', openShareModal);
    btnCloseModal.addEventListener('click', closeShareModal);
    shareModal.addEventListener('click', (e) => {
      if (e.target === shareModal) closeShareModal();
    });

    btnCopyShareUrl.addEventListener('click', () => {
      shareUrlInput.select();
      navigator.clipboard.writeText(shareUrlInput.value).then(() => {
        btnCopyShareUrl.textContent = 'Copied!';
        setTimeout(() => { btnCopyShareUrl.textContent = 'Copy Link'; }, 2000);
        showToast('Link copied! Open it on your other computer');
      });
    });
  }

  // Handle adding a link from the quick paste input
  function handleAddLinkInput() {
    const val = quickPasteInput.value.trim();
    if (!val) return;
    processPastedText(val);
    quickPasteInput.value = '';
    quickPasteInput.focus();
  }

  function isUrlOrContainsUrls(text) {
    const urlPattern = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi;
    return urlPattern.test(text) || (text.includes('.') && !text.includes(' '));
  }

  function processPastedText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let addedCount = 0;

    lines.forEach(line => {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const matches = line.match(urlRegex);

      if (matches && matches.length > 0) {
        matches.forEach(url => {
          const note = line.replace(url, '').trim();
          window.syncEngine.addLink(url, note);
          addedCount++;
        });
      } else if (line.includes('.') && !line.includes(' ')) {
        window.syncEngine.addLink(line);
        addedCount++;
      } else {
        window.syncEngine.addLink(line);
        addedCount++;
      }
    });

    if (addedCount === 1) {
      showToast('Link added and synced across devices');
    } else if (addedCount > 1) {
      showToast(`${addedCount} links added and synced`);
    }
  }

  // Render link cards
  function renderLinks(links) {
    linkCardsContainer.innerHTML = '';

    if (!links || links.length === 0) {
      emptyLinksPlaceholder.style.display = 'flex';
      linkCardsContainer.style.display = 'none';
    } else {
      emptyLinksPlaceholder.style.display = 'none';
      linkCardsContainer.style.display = 'flex';

      links.forEach(item => {
        const card = createLinkCardElement(item);
        linkCardsContainer.appendChild(card);
      });
    }

    const count = links ? links.length : 0;
    linkCountBadge.textContent = count;
    linkListTitleCount.textContent = count > 0 ? `(${count})` : '';
  }

  // Determine domain badge class for colorful display
  function getDomainBadgeClass(domain) {
    const d = domain.toLowerCase();
    if (d.includes('github')) return 'badge-github';
    if (d.includes('youtube') || d.includes('youtu.be')) return 'badge-youtube';
    if (d.includes('google') || d.includes('docs') || d.includes('drive')) return 'badge-google';
    if (d.includes('twitter') || d.includes('x.com')) return 'badge-twitter';
    if (d.includes('reddit')) return 'badge-reddit';
    return '';
  }

  // Create single link card DOM element
  function createLinkCardElement(item) {
    const card = document.createElement('div');
    card.className = `link-card ${item.opened ? 'opened' : ''}`;
    card.dataset.id = item.id;

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain)}&sz=32`;
    const formattedTime = formatTimestamp(item.timestamp);
    const badgeClass = getDomainBadgeClass(item.domain);

    card.innerHTML = `
      <div class="link-card-left">
        <label class="custom-checkbox-wrapper" title="Mark as read/visited">
          <input type="checkbox" class="link-checkbox" ${item.opened ? 'checked' : ''} />
        </label>
        <div class="link-favicon-wrap">
          <img class="link-favicon" src="${faviconUrl}" alt="" onerror="this.parentElement.innerHTML='${ICONS.globe}'" />
        </div>
        <div class="link-details">
          <div class="link-badge-row">
            <span class="domain-badge ${badgeClass}">${escapeHtml(item.domain)}</span>
            <span class="link-time">${formattedTime}</span>
          </div>
          <a class="link-url-text" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.url)}">
            ${escapeHtml(item.url)}
          </a>
          <input type="text" class="link-note-input" placeholder="+ Add a note or tag (syncs in real time)" value="${escapeHtml(item.note || '')}" />
        </div>
      </div>
      <div class="link-card-actions">
        <button class="btn-card-action open-btn" title="Open in new tab (1-Click)">
          <span>Open</span>
          ${ICONS.externalLink}
        </button>
        <button class="btn-card-action copy-btn" title="Copy URL to clipboard">
          ${ICONS.copy}
        </button>
        <button class="btn-card-action delete-btn" title="Delete link permanently">
          ${ICONS.trash}
        </button>
      </div>
    `;

    // Event Bindings
    const checkbox = card.querySelector('.link-checkbox');
    checkbox.addEventListener('change', () => {
      window.syncEngine.toggleLinkOpened(item.id);
    });

    const openBtn = card.querySelector('.open-btn');
    openBtn.addEventListener('click', () => {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      if (!item.opened) {
        window.syncEngine.toggleLinkOpened(item.id);
      }
    });

    const copyBtn = card.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(item.url).then(() => {
        copyBtn.innerHTML = ICONS.check;
        setTimeout(() => { copyBtn.innerHTML = ICONS.copy; }, 1500);
        showToast('Link copied to clipboard');
      });
    });

    // Manual Delete Button
    const deleteBtn = card.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      const removed = window.syncEngine.removeLink(item.id);
      showToastWithUndo('Link deleted', () => {
        window.syncEngine.undoDelete();
      });
    });

    const noteInput = card.querySelector('.link-note-input');
    noteInput.addEventListener('change', () => {
      window.syncEngine.updateLinkNote(item.id, noteInput.value);
    });

    return card;
  }

  // Switch between Interactive and Raw Notepad views
  function switchView(mode) {
    if (mode === 'interactive') {
      segmentInteractive.classList.add('active');
      segmentRaw.classList.remove('active');
      linkListView.style.display = 'flex';
      rawNotepadView.style.display = 'none';
    } else {
      segmentRaw.classList.add('active');
      segmentInteractive.classList.remove('active');
      linkListView.style.display = 'none';
      rawNotepadView.style.display = 'flex';
      paperTextarea.focus();
    }
  }

  function updateStats() {
    statLinkCount.textContent = `${currentLinks.length} links`;
  }

  function updateTextStats(text) {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    statWordCount.textContent = `${words} words`;
    statCharCount.textContent = `${chars} chars`;
  }

  // Share Modal & QR Code
  function openShareModal() {
    updateShareUrl();
    shareModal.classList.add('active');
    renderQrCode(shareUrlInput.value);
  }

  function closeShareModal() {
    shareModal.classList.remove('active');
  }

  function updateShareUrl() {
    const fullUrl = window.location.origin + window.location.pathname;
    shareUrlInput.value = fullUrl;
  }

  function renderQrCode(text) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(text)}`;
    qrCodeBox.innerHTML = `
      <img src="${qrUrl}" alt="QR Code" class="qr-code-svg" onerror="this.parentElement.innerHTML='<div style=\\'padding:20px;color:var(--text-subtle);\\'>Scan link on phone camera</div>'" />
    `;
  }

  // Toast Notifications
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  function showToastWithUndo(message, onUndo) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${message}</span>`;
    
    const undoBtn = document.createElement('button');
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', () => {
      onUndo();
      toast.remove();
      showToast('Restored');
    });

    toast.appendChild(undoBtn);
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, 3800);
  }

  // Utilities
  function formatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
