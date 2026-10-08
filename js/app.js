/**
 * Ringo's Notepad: Application UI Controller & User Interaction
 * Real-Time Yjs CRDT Collaboration • Link Hub • Pristine Media Attachments
 */

(function () {
  // SVG Icon Templates (Clean modern vector icons)
  const ICONS = {
    link: `<svg class="icon" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    externalLink: `<svg class="icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
    copy: `<svg class="icon" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    check: `<svg class="icon" viewBox="0 0 24 24" style="stroke: #10b981;"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    trash: `<svg class="icon" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`,
    pin: `<svg class="icon" viewBox="0 0 24 24"><path d="M12 2l3 6 6 1-4.5 4.5 1 6.5-5.5-3.5-5.5 3.5 1-6.5L3 9l6-1z"></path></svg>`,
    pinFilled: `<svg class="icon" viewBox="0 0 24 24" style="fill: currentColor;"><path d="M12 2l3 6 6 1-4.5 4.5 1 6.5-5.5-3.5-5.5 3.5 1-6.5L3 9l6-1z"></path></svg>`,
    globe: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    paperclip: `<svg class="icon" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`,
    image: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    video: `<svg class="icon" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    audio: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
    file: `<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>`,
    download: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    eye: `<svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    play: `<svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
    drag: `<svg class="icon icon-drag" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.5"></circle><circle cx="15" cy="6" r="1.5"></circle><circle cx="9" cy="12" r="1.5"></circle><circle cx="15" cy="12" r="1.5"></circle><circle cx="9" cy="18" r="1.5"></circle><circle cx="15" cy="18" r="1.5"></circle></svg>`
  };

  const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB limit (WebRTC LAN P2P direct streaming)

  // DOM Elements
  const quickPasteInput = document.getElementById('quick-paste-input');
  const btnPasteClipboard = document.getElementById('btn-paste-clipboard');
  const btnAddLink = document.getElementById('btn-add-link');
  const linkCardsContainer = document.getElementById('link-cards-container');
  const emptyLinksPlaceholder = document.getElementById('empty-links-placeholder');
  const linkCountBadge = document.getElementById('link-count-badge');
  const linkListTitleCount = document.getElementById('link-list-title-count');
  const paperTextarea = document.getElementById('paper-textarea');
  const paperMarkdownPreview = document.getElementById('paper-markdown-preview');
  const remoteCursorsLayer = document.getElementById('remote-cursors-layer');
  
  // Navigation Tabs
  const tabNotepad = document.getElementById('tab-notepad');
  const tabLinks = document.getElementById('tab-links');
  const tabSplit = document.getElementById('tab-split');
  const tabAttachments = document.getElementById('tab-attachments');
  const linkListView = document.getElementById('link-list-view');
  const rawNotepadView = document.getElementById('raw-notepad-view');
  const attachmentsView = document.getElementById('attachments-view');

  // Link Filtering & Search Elements
  const linkSearchInput = document.getElementById('link-search-input');
  const btnClearLinkSearch = document.getElementById('btn-clear-link-search');
  const linkFilterChips = document.getElementById('link-filter-chips');
  const btnToggleGrouping = document.getElementById('btn-toggle-grouping');
  const activeTagsBar = document.getElementById('active-tags-bar');

  // Notes Toolbar Elements
  const notesPagesTabs = document.getElementById('notes-pages-tabs');
  const btnAddNotePage = document.getElementById('btn-add-note-page');
  const btnModeEdit = document.getElementById('btn-mode-edit');
  const btnModePreview = document.getElementById('btn-mode-preview');
  const typingIndicator = document.getElementById('typing-indicator');
  const typingText = document.getElementById('typing-text');
  const activePeersAvatars = document.getElementById('active-peers-avatars');

  // Attachments Elements
  const attachmentCountBadge = document.getElementById('attachment-count-badge');
  const attachmentsTitleCount = document.getElementById('attachments-title-count');
  const btnUploadAttachments = document.getElementById('btn-upload-attachments');
  const btnDownloadAllAttachments = document.getElementById('btn-download-all-attachments');
  const btnClearAllAttachments = document.getElementById('btn-clear-all-attachments');
  const attachmentFileInput = document.getElementById('attachment-file-input');
  const attachmentSearchInput = document.getElementById('attachment-search-input');
  const attachmentsCardsGrid = document.getElementById('attachments-cards-grid');
  const emptyAttachmentsPlaceholder = document.getElementById('empty-attachments-placeholder');
  const btnHeaderAttach = document.getElementById('btn-header-attach');
  const transferProgressContainer = document.getElementById('transfer-progress-container');
  const transferProgressFill = document.getElementById('transfer-progress-fill');
  const transferProgressText = document.getElementById('transfer-progress-text');

  // Lightbox Modal
  const mediaLightboxModal = document.getElementById('media-lightbox-modal');
  const lightboxFilename = document.getElementById('lightbox-filename');
  const lightboxFilemeta = document.getElementById('lightbox-filemeta');
  const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxContentWrap = document.getElementById('lightbox-content-wrap');

  // Drag Overlay
  const globalDragOverlay = document.getElementById('global-drag-overlay');

  // Status & Popover Elements
  const syncStatusContainer = document.getElementById('sync-status-container');
  const syncStatusDot = document.getElementById('sync-status-dot');
  const syncStatusText = document.getElementById('sync-status-text');
  const connectionPopover = document.getElementById('connection-popover');
  const btnClosePopover = document.getElementById('btn-close-popover');
  const popoverBrokerVal = document.getElementById('popover-broker-val');
  const popoverHealthVal = document.getElementById('popover-health-val');
  const popoverTimeVal = document.getElementById('popover-time-val');
  const popoverDeviceCount = document.getElementById('popover-device-count');
  const popoverPeersList = document.getElementById('popover-peers-list');
  const inputMyDeviceName = document.getElementById('input-my-device-name');
  const btnSaveDeviceName = document.getElementById('btn-save-device-name');

  // Batch Action Buttons for Links
  const btnOpenUnread = document.getElementById('btn-open-unread');
  const btnOpenAll = document.getElementById('btn-open-all');
  const btnCopyAll = document.getElementById('btn-copy-all');
  const btnClearCompleted = document.getElementById('btn-clear-completed');
  const btnClearAll = document.getElementById('btn-clear-all');

  // Footer Stats
  const statLinkCount = document.getElementById('stat-link-count');
  const statWordCount = document.getElementById('stat-word-count');
  const statCharCount = document.getElementById('stat-char-count');
  const statAttachmentCount = document.getElementById('stat-attachment-count');
  const statDeviceName = document.getElementById('stat-device-name');

  // Appearance Selectors
  const selectTheme = document.getElementById('select-theme');
  const selectFont = document.getElementById('select-font');
  const selectRuling = document.getElementById('select-ruling');
  const btnToggleAmbience = document.getElementById('btn-toggle-ambience');

  // Share & Shortcuts Modals
  const shareModal = document.getElementById('share-modal');
  const btnShareRoom = document.getElementById('btn-share-room');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const shareUrlInput = document.getElementById('share-url-input');
  const btnCopyShareUrl = document.getElementById('btn-copy-share-url');
  const shareReadonlyInput = document.getElementById('share-readonly-input');
  const btnCopyReadonlyUrl = document.getElementById('btn-copy-readonly-url');
  const qrCodeBox = document.getElementById('qr-code-box');

  const shortcutsModal = document.getElementById('shortcuts-modal');
  const btnOpenShortcuts = document.getElementById('btn-open-shortcuts');
  const btnCloseShortcuts = document.getElementById('btn-close-shortcuts');

  const toastContainer = document.getElementById('toast-container');
  const readonlyBanner = document.getElementById('readonly-banner');

  // State
  let currentLinks = [];
  let currentAttachments = [];
  let activeLinkFilter = 'all'; // all, unread, visited, pinned
  let activeTagFilter = null;
  let linkSearchQuery = '';
  let isGroupingByDay = false;
  let activeAttachmentFilter = 'all';
  let attachmentSearchQuery = '';
  let isReadOnlyMode = false;
  let noteEditorMode = 'edit'; // edit, preview
  let activeNotePageId = 'p_main';
  let objectUrlsToRevoke = new Set();
  let draggedCardId = null;

  // ==========================================
  // Pristine IndexedDB Storage for Attachments
  // ==========================================
  const AttachmentDB = {
    dbPromise: null,
    getDb() {
      if (!this.dbPromise) {
        this.dbPromise = new Promise((resolve) => {
          try {
            const req = indexedDB.open('ringos_attachments_v4', 1);
            req.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('attachments')) {
                db.createObjectStore('attachments', { keyPath: 'id' });
              }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = () => resolve(null);
          } catch (e) {
            resolve(null);
          }
        });
      }
      return this.dbPromise;
    },

    async getAll() {
      const db = await this.getDb();
      if (!db) return [];
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('attachments', 'readonly');
          const store = tx.objectStore('attachments');
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        } catch (e) {
          resolve([]);
        }
      });
    },

    async put(item) {
      const db = await this.getDb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('attachments', 'readwrite');
          const store = tx.objectStore('attachments');
          const req = store.put(item);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    },

    async delete(id) {
      const db = await this.getDb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('attachments', 'readwrite');
          const store = tx.objectStore('attachments');
          const req = store.delete(id);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    },

    async get(id) {
      const db = await this.getDb();
      if (!db) return null;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('attachments', 'readonly');
          const store = tx.objectStore('attachments');
          const req = store.get(id);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        } catch (e) {
          resolve(null);
        }
      });
    },

    async clear() {
      const db = await this.getDb();
      if (!db) return false;
      return new Promise((resolve) => {
        try {
          const tx = db.transaction('attachments', 'readwrite');
          const store = tx.objectStore('attachments');
          const req = store.clear();
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        } catch (e) {
          resolve(false);
        }
      });
    }
  };

  window.AttachmentDB = AttachmentDB;

  // ==========================================
  // Initialization
  // ==========================================
  function init() {
    checkReadOnlyMode();
    loadPreferences();
    setupSyncEngineBindings();
    setupEventListeners();
    loadAttachments();
    statDeviceName.textContent = window.syncEngine.deviceName;
    inputMyDeviceName.value = window.syncEngine.deviceName;

    // View mode default
    const savedView = localStorage.getItem('ringo_view_mode') || 'split';
    switchView(savedView);

    // Initial Ambience button active class state
    if (btnToggleAmbience && window.natureAmbience) {
      btnToggleAmbience.classList.toggle('active', window.natureAmbience.isActive);
    }
  }

  function checkReadOnlyMode() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'readonly' || window.location.hash.includes('readonly')) {
      isReadOnlyMode = true;
      if (readonlyBanner) readonlyBanner.style.display = 'flex';
      if (paperTextarea) paperTextarea.setAttribute('readonly', 'true');
      if (quickPasteInput) quickPasteInput.disabled = true;
      if (btnAddLink) btnAddLink.disabled = true;
      if (btnPasteClipboard) btnPasteClipboard.disabled = true;
      if (btnHeaderAttach) btnHeaderAttach.disabled = true;
      if (btnUploadAttachments) btnUploadAttachments.disabled = true;
      if (btnClearAll) btnClearAll.style.display = 'none';
      if (btnClearCompleted) btnClearCompleted.style.display = 'none';
      if (btnClearAllAttachments) btnClearAllAttachments.style.display = 'none';
      if (btnAddNotePage) btnAddNotePage.style.display = 'none';
    }
  }

  const THEME_NAMES = {
    ares: 'Isometra Ember',
    isometra: 'Isometra Ember',
    sepia: 'Warm Sepia',
    light: 'Paper Light',
    dark: 'Dark Slate',
    terminal: 'Cyber Neon'
  };

  function applyTheme(themeKey, notify = false) {
    if (!themeKey) return;
    if (themeKey === 'isometra') themeKey = 'ares';
    document.documentElement.setAttribute('data-theme', themeKey);
    localStorage.setItem('syncpad_theme', themeKey);
    if (selectTheme) selectTheme.value = themeKey;

    document.querySelectorAll('.theme-swatch-card').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeVal === themeKey);
    });

    if (window.natureAmbience && typeof window.natureAmbience.drawStaticBackground === 'function') {
      window.natureAmbience.drawStaticBackground();
    }

    if (notify) {
      showToast(`Theme: ${THEME_NAMES[themeKey] || themeKey}`);
    }
  }

  function applyFont(fontKey) {
    if (!fontKey) return;
    document.body.style.setProperty('--font-current', getFontFamily(fontKey));
    localStorage.setItem('syncpad_font', fontKey);
    if (selectFont) selectFont.value = fontKey;
    const pop = document.getElementById('select-font-popover');
    if (pop) pop.value = fontKey;
  }

  function applyRuling(rulingKey) {
    if (!rulingKey) return;
    document.body.setAttribute('data-ruling', rulingKey);
    localStorage.setItem('syncpad_ruling', rulingKey);
    if (selectRuling) selectRuling.value = rulingKey;
    const pop = document.getElementById('select-ruling-popover');
    if (pop) pop.value = rulingKey;
  }

  function loadPreferences() {
    const theme = localStorage.getItem('syncpad_theme') || 'ares';
    const font = localStorage.getItem('syncpad_font') || 'sans';
    const ruling = localStorage.getItem('syncpad_ruling') || 'dots';
    isGroupingByDay = localStorage.getItem('ringo_group_by_day') === 'true';

    applyTheme(theme, false);
    applyFont(font);
    applyRuling(ruling);

    if (btnToggleGrouping) {
      btnToggleGrouping.textContent = isGroupingByDay ? 'Group: Day' : 'Group: Off';
      btnToggleGrouping.classList.toggle('active', isGroupingByDay);
    }
  }

  function getFontFamily(fontKey) {
    switch (fontKey) {
      case 'mono': return 'var(--font-family-mono)';
      case 'serif': return 'var(--font-family-serif)';
      case 'handwriting': return 'var(--font-family-handwriting)';
      case 'outfit': return 'var(--font-family-outfit)';
      case 'slab': return 'var(--font-family-slab)';
      case 'dyslexic': return 'var(--font-family-dyslexic)';
      default: return 'var(--font-family-sans)';
    }
  }

  // ==========================================
  // Sync Engine Event Bindings (Yjs & Awareness)
  // ==========================================
  function setupSyncEngineBindings() {
    const sync = window.syncEngine;

    // 1. Links update from Yjs
    sync.onLinksUpdate = (links) => {
      currentLinks = links || [];
      renderLinks();
      updateStats();
    };

    // 2. Notes update from Yjs
    sync.onNotesUpdate = (text, pageId) => {
      if (pageId === activeNotePageId) {
        if (paperTextarea.value !== text) {
          const start = paperTextarea.selectionStart;
          const end = paperTextarea.selectionEnd;
          const isFocused = (document.activeElement === paperTextarea);

          paperTextarea.value = text || '';

          if (isFocused && start !== null && end !== null) {
            try { paperTextarea.setSelectionRange(start, end); } catch (e) {}
          }
        }
        updateTextStats(paperTextarea.value);
        if (noteEditorMode === 'preview') {
          renderMarkdownPreview(paperTextarea.value);
        }
      }
    };

    // 3. Pages metadata update from Yjs
    sync.onPagesMetaUpdate = (pagesMeta, activeId) => {
      if (activeId && pagesMeta.some(p => p.id === activeId)) {
        activeNotePageId = activeId;
      } else if (!pagesMeta.some(p => p.id === activeNotePageId)) {
        activeNotePageId = pagesMeta[0] ? pagesMeta[0].id : 'p_main';
      }
      renderNotePagesTabs(pagesMeta);
    };

    // 4. Awareness Peers & Live Typing
    sync.onPeersUpdate = ({ count, peers, currentDevice, typingUsers }) => {
      // Status text
      if (count > 1) {
        const otherPeers = peers.filter(p => !p.isSelf);
        const osList = Array.from(new Set(peers.map(p => p.os))).join(' & ');
        syncStatusText.textContent = `${count} devices online (${osList})`;
      } else {
        syncStatusText.textContent = '1 device online';
      }
      syncStatusDot.className = 'status-dot connected';

      // Live typing indicator
      if (typingUsers && typingUsers.length > 0) {
        const names = typingUsers.slice(0, 2).join(', ') + (typingUsers.length > 2 ? ` +${typingUsers.length - 2}` : '');
        typingText.textContent = `${names} typing...`;
        typingIndicator.style.display = 'inline-flex';
      } else {
        typingIndicator.style.display = 'none';
      }

      // Active peers avatar pills
      renderPeerAvatars(peers);
      renderPopoverPeers(peers, count);

      // P2P Direct Attachments online status badge
      const p2pBadgeText = document.getElementById('p2p-badge-text');
      const p2pDot = document.getElementById('p2p-dot');
      if (p2pBadgeText && p2pDot) {
        if (count >= 2) {
          p2pDot.className = 'p2p-dot ready';
          p2pBadgeText.textContent = `${count} devices ready for P2P`;
        } else {
          p2pDot.className = 'p2p-dot';
          p2pBadgeText.textContent = 'Waiting for 2nd device...';
        }
      }
    };

    // 5. Remote Cursors
    sync.onRemoteCursorsUpdate = (cursors) => {
      renderRemoteCursors(cursors);
    };

    // 6. Status & Connection updates
    sync.onStatusUpdate = ({ status, broker, lastSyncedAt }) => {
      if (status === 'connected') {
        syncStatusDot.className = 'status-dot connected';
        popoverHealthVal.textContent = 'CRDT Active (Synced)';
        popoverHealthVal.className = 'popover-value status-online-text';
      } else if (status === 'connecting') {
        syncStatusDot.className = 'status-dot syncing';
        popoverHealthVal.textContent = 'Connecting...';
        popoverHealthVal.className = 'popover-value status-syncing-text';
      } else {
        syncStatusDot.className = 'status-dot';
        popoverHealthVal.textContent = 'Offline (Local Only)';
        popoverHealthVal.className = 'popover-value status-offline-text';
      }

      if (broker) popoverBrokerVal.textContent = broker;
      if (lastSyncedAt) {
        popoverTimeVal.textContent = formatTimestamp(lastSyncedAt);
      }
    };

    // 7. Attachments updates
    sync.onAttachmentsUpdate = async () => {
      await loadAttachments(false);
    };

    sync.onAttachmentDataReceived = async (fullItem) => {
      await loadAttachments(false);
      showToast(`Pristine media "${fullItem.name}" synced!`);
      const matched = currentAttachments.find(a => a.id === fullItem.id);
      if (matched && matched.autoDownloadWhenReady) {
        matched.autoDownloadWhenReady = false;
        downloadAttachment(fullItem);
      }
    };

    let progressStallTimer = null;
    sync.onTransferProgress = ({ attachmentId, name, percent, type, mode }) => {
      if (transferProgressContainer && transferProgressFill && transferProgressText) {
        transferProgressContainer.style.display = 'flex';
        transferProgressFill.style.width = `${percent}%`;
        const prefix = mode === 'p2p' ? '⚡ Direct P2P' : 'Cloud';
        transferProgressText.textContent = `${prefix} ${type === 'upload' ? 'Sending' : 'Downloading'} "${name}": ${percent}%`;
        clearTimeout(progressStallTimer);
        if (percent >= 100) {
          setTimeout(() => {
            if (transferProgressContainer) transferProgressContainer.style.display = 'none';
          }, 1500);
        } else {
          // If transfer stalls for more than 10 seconds, auto-hide progress bar
          progressStallTimer = setTimeout(() => {
            if (transferProgressContainer) transferProgressContainer.style.display = 'none';
          }, 10000);
        }
      }
    };

    // Initialize engine
    sync.init();
  }

  // ==========================================
  // URL Sanitization & Link Cleaning (Fix 1.5)
  // ==========================================
  const TRACKING_PARAMS = new Set([
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
    'fbclid', 'gclid', 'si', 'igshid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi',
    'ref', 'ref_src', 'yclid', 'zanpid', 's_kwcid'
  ]);

  function cleanAndSanitizeUrl(raw) {
    if (!raw) return null;
    let urlStr = raw.trim();

    // Check dangerous schemes
    if (/^(javascript|vbscript|data):/i.test(urlStr)) {
      return null;
    }

    if (!/^https?:\/\//i.test(urlStr)) {
      urlStr = 'https://' + urlStr;
    }

    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }

      // Strip invasive tracking params while preserving functional ones
      const searchParams = new URLSearchParams(parsed.search);
      let modified = false;
      for (const key of Array.from(searchParams.keys())) {
        if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
          searchParams.delete(key);
          modified = true;
        }
      }

      if (modified) {
        parsed.search = searchParams.toString();
      }

      const domain = parsed.hostname.replace(/^www\./i, '');
      return {
        url: parsed.href,
        domain: domain,
        protocol: parsed.protocol
      };
    } catch (e) {
      return null;
    }
  }

  function isLikelyUrl(text) {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (trimmed.includes(' ') && !/^https?:\/\//i.test(trimmed)) {
      return false; // Plain sentences like "hello world" are rejected
    }
    return /(https?:\/\/[^\s]+)/i.test(trimmed) || (trimmed.includes('.') && trimmed.length > 3 && !trimmed.includes(' '));
  }

  function extractTags(text) {
    if (!text) return [];
    const matches = text.match(/#([a-zA-Z0-9_\-]+)/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.toLowerCase())));
  }

  // ==========================================
  // Rich Link Preview & Title Metadata Fetcher
  // ==========================================
  async function fetchLinkMetadata(linkItem) {
    if (linkItem.preview && linkItem.preview.title) return;

    try {
      // Use noembed oEmbed proxy (safe, zero credentials, returns titles & thumbs for YouTube, Vimeo, Reddit, Twitter, etc.)
      const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(linkItem.url)}`;
      const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.title || data.thumbnail_url)) {
          const preview = {
            title: data.title ? data.title.substring(0, 160) : '',
            author: data.author_name || '',
            thumbnail: data.thumbnail_url || ''
          };
          window.syncEngine.updateLink(linkItem.id, { preview: preview });
        }
      }
    } catch (e) {
      // Quiet fallback to URL display
    }
  }

  // ==========================================
  // Links Rendering & Actions
  // ==========================================
  function renderLinks() {
    if (!linkCardsContainer) return;
    linkCardsContainer.innerHTML = '';

    // 1. Filter links
    let filtered = [...currentLinks];

    if (activeLinkFilter === 'unread') {
      filtered = filtered.filter(l => !l.opened);
    } else if (activeLinkFilter === 'visited') {
      filtered = filtered.filter(l => !!l.opened);
    } else if (activeLinkFilter === 'pinned') {
      filtered = filtered.filter(l => !!l.pinned);
    }

    if (activeTagFilter) {
      filtered = filtered.filter(l => {
        const tags = l.tags || extractTags(l.note);
        return tags.includes(activeTagFilter);
      });
    }

    if (linkSearchQuery) {
      const q = linkSearchQuery.toLowerCase();
      filtered = filtered.filter(l => {
        const title = (l.preview && l.preview.title) ? l.preview.title.toLowerCase() : '';
        const note = (l.note || '').toLowerCase();
        const url = (l.url || '').toLowerCase();
        const domain = (l.domain || '').toLowerCase();
        return title.includes(q) || note.includes(q) || url.includes(q) || domain.includes(q);
      });
    }

    // 2. Sort pinned items to the top if not in drag mode
    filtered.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

    // 3. Render Empty state or cards
    if (filtered.length === 0) {
      emptyLinksPlaceholder.style.display = 'flex';
      linkCardsContainer.style.display = 'none';
    } else {
      emptyLinksPlaceholder.style.display = 'none';
      linkCardsContainer.style.display = 'flex';

      if (isGroupingByDay) {
        renderGroupedLinks(filtered);
      } else {
        filtered.forEach(item => {
          const card = createLinkCardElement(item);
          linkCardsContainer.appendChild(card);
        });
      }
    }

    // 4. Update Header Counts
    const count = currentLinks.length;
    linkCountBadge.textContent = count;
    linkListTitleCount.textContent = count > 0 ? `(${count})` : '';

    renderActiveTagsList();
  }

  function renderGroupedLinks(links) {
    const groups = {
      'Today': [],
      'Yesterday': [],
      'Earlier This Week': [],
      'Older': []
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 86400000 * 6;

    links.forEach(l => {
      const ts = l.timestamp || 0;
      if (ts >= todayStart) {
        groups['Today'].push(l);
      } else if (ts >= yesterdayStart) {
        groups['Yesterday'].push(l);
      } else if (ts >= weekStart) {
        groups['Earlier This Week'].push(l);
      } else {
        groups['Older'].push(l);
      }
    });

    for (const [groupName, items] of Object.entries(groups)) {
      if (items.length > 0) {
        const header = document.createElement('div');
        header.className = 'link-group-header';
        header.innerHTML = `<span>${groupName}</span> <span class="group-count">(${items.length})</span>`;
        linkCardsContainer.appendChild(header);

        items.forEach(item => {
          const card = createLinkCardElement(item);
          linkCardsContainer.appendChild(card);
        });
      }
    }
  }

  function renderActiveTagsList() {
    if (!activeTagsBar) return;
    const allTags = new Set();
    currentLinks.forEach(l => {
      const tags = l.tags || extractTags(l.note);
      tags.forEach(t => allTags.add(t));
    });

    if (allTags.size === 0 && !activeTagFilter) {
      activeTagsBar.style.display = 'none';
      return;
    }

    activeTagsBar.style.display = 'flex';
    activeTagsBar.innerHTML = '';

    const label = document.createElement('span');
    label.className = 'tags-bar-label';
    label.textContent = 'Tags:';
    activeTagsBar.appendChild(label);

    allTags.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tag-pill ${activeTagFilter === tag ? 'active' : ''}`;
      btn.textContent = tag;
      btn.addEventListener('click', () => {
        activeTagFilter = (activeTagFilter === tag) ? null : tag;
        renderLinks();
      });
      activeTagsBar.appendChild(btn);
    });

    if (activeTagFilter) {
      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'tag-pill tag-clear';
      clearBtn.textContent = 'Clear Filter ✕';
      clearBtn.addEventListener('click', () => {
        activeTagFilter = null;
        renderLinks();
      });
      activeTagsBar.appendChild(clearBtn);
    }
  }

  function createLinkCardElement(item) {
    const card = document.createElement('div');
    card.className = `link-card ${item.opened ? 'opened' : ''} ${item.pinned ? 'pinned' : ''}`;
    card.dataset.id = item.id;
    card.setAttribute('draggable', isReadOnlyMode ? 'false' : 'true');

    const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(item.domain)}&sz=32`;
    const formattedTime = formatTimestamp(item.timestamp);
    const badgeClass = getDomainBadgeClass(item.domain);
    const tags = item.tags || extractTags(item.note);

    let tagsHtml = '';
    if (tags.length > 0) {
      tagsHtml = `<div class="card-tags-row">` + tags.map(t => `<span class="card-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('') + `</div>`;
    }

    let previewHtml = '';
    if (item.preview && item.preview.title) {
      previewHtml = `
        <div class="card-rich-preview">
          ${item.preview.thumbnail ? `<img src="${escapeHtml(item.preview.thumbnail)}" class="preview-thumb" alt="" loading="lazy" />` : ''}
          <div class="preview-info">
            <span class="preview-title">${escapeHtml(item.preview.title)}</span>
            ${item.preview.author ? `<span class="preview-author">${escapeHtml(item.preview.author)}</span>` : ''}
          </div>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="card-drag-handle" title="Drag to reorder">${ICONS.drag}</div>
      <div class="link-card-left">
        <label class="custom-checkbox-wrapper" title="Mark as read/visited">
          <input type="checkbox" class="link-checkbox" ${item.opened ? 'checked' : ''} ${isReadOnlyMode ? 'disabled' : ''} />
          <span class="check-tick"></span>
        </label>
        <div class="link-favicon-wrap">
          <img class="link-favicon" src="${faviconUrl}" alt="" onerror="this.parentElement.innerHTML='${ICONS.globe}'" />
        </div>
        <div class="link-details">
          <div class="link-badge-row">
            ${item.pinned ? `<span class="domain-badge badge-pinned" title="Pinned link">${ICONS.pinFilled} Pinned</span>` : ''}
            <span class="domain-badge ${badgeClass}">${escapeHtml(item.domain)}</span>
            <span class="link-time">${formattedTime}</span>
          </div>
          ${previewHtml}
          <a class="link-url-text" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(item.url)}">
            ${escapeHtml(item.url)}
          </a>
          <input 
            type="text" 
            class="link-note-input" 
            placeholder="+ Add a note or #tag..." 
            value="${escapeHtml(item.note || '')}" 
            ${isReadOnlyMode ? 'readonly' : ''}
            spellcheck="false"
          />
          ${tagsHtml}
        </div>
      </div>
      <div class="link-card-actions">
        <button class="btn-card-action btn-pin ${item.pinned ? 'active' : ''}" title="${item.pinned ? 'Unpin' : 'Pin to top'}">
          ${item.pinned ? ICONS.pinFilled : ICONS.pin}
        </button>
        <button class="btn-card-action open-btn" title="Open in new tab">
          <span>Open</span>
          ${ICONS.externalLink}
        </button>
        <button class="btn-card-action copy-btn" title="Copy URL">
          ${ICONS.copy}
        </button>
        ${!isReadOnlyMode ? `
        <button class="btn-card-action delete-btn" title="Delete link">
          ${ICONS.trash}
        </button>` : ''}
      </div>
    `;

    // Event bindings
    const checkbox = card.querySelector('.link-checkbox');
    checkbox.addEventListener('change', () => {
      window.syncEngine.updateLink(item.id, { opened: checkbox.checked });
    });

    const openBtn = card.querySelector('.open-btn');
    openBtn.addEventListener('click', () => {
      window.open(item.url, '_blank', 'noopener,noreferrer');
      if (!item.opened) {
        window.syncEngine.updateLink(item.id, { opened: true });
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

    const pinBtn = card.querySelector('.btn-pin');
    pinBtn.addEventListener('click', () => {
      window.syncEngine.updateLink(item.id, { pinned: !item.pinned });
      showToast(item.pinned ? 'Unpinned' : 'Pinned to top');
    });

    const deleteBtn = card.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const removed = window.syncEngine.removeLink(item.id);
        showToastWithUndo('Link deleted', () => {
          if (removed) window.syncEngine.addLink(removed);
        });
      });
    }

    const noteInput = card.querySelector('.link-note-input');
    noteInput.addEventListener('change', () => {
      const val = noteInput.value.trim();
      const newTags = extractTags(val);
      window.syncEngine.updateLink(item.id, { note: val, tags: newTags });
    });

    // Tag click
    card.querySelectorAll('.card-tag').forEach(tagEl => {
      tagEl.addEventListener('click', () => {
        activeTagFilter = tagEl.dataset.tag;
        renderLinks();
      });
    });

    // Drag and drop reordering
    card.addEventListener('dragstart', (e) => {
      draggedCardId = item.id;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', () => {
      draggedCardId = null;
      card.classList.remove('dragging');
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedCardId || draggedCardId === item.id) return;
      const allLinks = window.syncEngine.getLinks();
      const fromIdx = allLinks.findIndex(l => l.id === draggedCardId);
      const toIdx = allLinks.findIndex(l => l.id === item.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        window.syncEngine.reorderLinks(fromIdx, toIdx);
      }
    });

    // Lazy load rich metadata preview in background
    if (!item.preview) {
      setTimeout(() => fetchLinkMetadata(item), 100);
    }

    return card;
  }

  function getDomainBadgeClass(domain) {
    const d = (domain || '').toLowerCase();
    if (d.includes('github')) return 'badge-github';
    if (d.includes('youtube') || d.includes('youtu.be')) return 'badge-youtube';
    if (d.includes('google') || d.includes('docs') || d.includes('drive')) return 'badge-google';
    if (d.includes('twitter') || d.includes('x.com')) return 'badge-twitter';
    if (d.includes('reddit')) return 'badge-reddit';
    return '';
  }

  // ==========================================
  // Note Pages & Collaborative Notepad
  // ==========================================
  function switchNotePage(pageId) {
    if (!pageId) return;
    activeNotePageId = pageId;
    if (window.syncEngine) {
      window.syncEngine.setActivePage(pageId);
    }
    const currentText = (window.syncEngine ? window.syncEngine.getNoteText(pageId) : '') || '';
    paperTextarea.value = currentText;
    updateTextStats(currentText);
    if (noteEditorMode === 'preview') {
      renderMarkdownPreview(currentText);
    }
    const meta = window.syncEngine ? window.syncEngine.getPagesMeta() : [{ id: pageId, title: 'Main Notes' }];
    renderNotePagesTabs(meta);
  }

  function renderNotePagesTabs(pagesMeta) {
    if (!notesPagesTabs) return;
    notesPagesTabs.innerHTML = '';

    pagesMeta.forEach(page => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `note-page-tab ${page.id === activeNotePageId ? 'active' : ''}`;
      
      btn.innerHTML = `
        <span class="note-page-title">${escapeHtml(page.title)}</span>
        ${pagesMeta.length > 1 && !isReadOnlyMode ? `<span class="note-page-close" title="Delete page">×</span>` : ''}
      `;

      btn.addEventListener('click', (e) => {
        if (e.target.classList.contains('note-page-close')) {
          e.stopPropagation();
          if (confirm(`Delete page "${page.title}"?`)) {
            window.syncEngine.deletePage(page.id);
            const remaining = window.syncEngine.getPagesMeta();
            if (activeNotePageId === page.id && remaining.length > 0) {
              switchNotePage(remaining[0].id);
            } else {
              renderNotePagesTabs(remaining);
            }
          }
          return;
        }
        switchNotePage(page.id);
      });

      // Double click to rename
      if (!isReadOnlyMode) {
        btn.addEventListener('dblclick', () => {
          const newTitle = prompt('Rename notebook page:', page.title);
          if (newTitle && newTitle.trim()) {
            window.syncEngine.renamePage(page.id, newTitle.trim());
          }
        });
      }

      notesPagesTabs.appendChild(btn);
    });
  }

  function renderMarkdownPreview(markdownText) {
    if (!paperMarkdownPreview) return;
    paperMarkdownPreview.innerHTML = parseMarkdownToHtml(markdownText);
  }

  function parseMarkdownToHtml(src) {
    if (!src) return '<p style="color:var(--text-subtle);">Nothing in this notebook page yet. Switch to Edit mode to write notes.</p>';

    let escaped = escapeHtml(src);

    // Code blocks
    escaped = escaped.replace(/```([a-zA-Z0-9]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre class="md-code-block"><code>${code}</code></pre>`;
    });

    // Inline code
    escaped = escaped.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>');

    // Headings
    escaped = escaped.replace(/^### (.*$)/gim, '<h3 class="md-h3">$1</h3>');
    escaped = escaped.replace(/^## (.*$)/gim, '<h2 class="md-h2">$1</h2>');
    escaped = escaped.replace(/^# (.*$)/gim, '<h1 class="md-h1">$1</h1>');

    // Blockquotes
    escaped = escaped.replace(/^\> (.*$)/gim, '<blockquote class="md-quote">$1</blockquote>');

    // Horizontal Rules
    escaped = escaped.replace(/^---$/gim, '<hr class="md-hr" />');

    // Checklists
    escaped = escaped.replace(/^- \[x\] (.*$)/gim, '<li class="md-task-item checked"><input type="checkbox" checked disabled> <span>$1</span></li>');
    escaped = escaped.replace(/^- \[ \] (.*$)/gim, '<li class="md-task-item"><input type="checkbox" disabled> <span>$1</span></li>');

    // Unordered lists
    escaped = escaped.replace(/^- (.*$)/gim, '<li class="md-list-item">$1</li>');

    // Bold & Italics
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    escaped = escaped.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Auto-link URLs
    escaped = escaped.replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>');

    // Paragraph breaks
    escaped = escaped.replace(/\n\n+/g, '</p><p>');
    escaped = `<p>${escaped}</p>`;

    return escaped;
  }

  function renderPeerAvatars(peers) {
    if (!activePeersAvatars) return;
    activePeersAvatars.innerHTML = '';

    peers.forEach(peer => {
      const pill = document.createElement('div');
      pill.className = `peer-avatar-pill ${peer.isSelf ? 'self' : ''}`;
      pill.style.borderColor = peer.color;
      pill.title = `${peer.name} (${peer.os})${peer.isSelf ? ' - You' : ''}`;

      const initial = (peer.name || 'D').charAt(0).toUpperCase();
      pill.innerHTML = `
        <span class="peer-dot" style="background-color: ${peer.color};"></span>
        <span class="peer-initial">${initial}</span>
      `;
      activePeersAvatars.appendChild(pill);
    });
  }

  function renderPopoverPeers(peers, count) {
    if (!popoverPeersList || !popoverDeviceCount) return;
    popoverDeviceCount.textContent = count;
    popoverPeersList.innerHTML = '';

    peers.forEach(peer => {
      const item = document.createElement('div');
      item.className = 'popover-peer-item';
      item.innerHTML = `
        <span class="peer-status-dot" style="background-color: ${peer.color};"></span>
        <span class="popover-peer-name">${escapeHtml(peer.name)} ${peer.isSelf ? '(You)' : ''}</span>
        <span class="popover-peer-os">${escapeHtml(peer.os)}</span>
      `;
      popoverPeersList.appendChild(item);
    });
  }

  function renderRemoteCursors(cursors) {
    if (!remoteCursorsLayer) return;
    remoteCursorsLayer.innerHTML = '';

    if (noteEditorMode === 'preview') return;

    // Show non-intrusive cursor indicator tags
    cursors.forEach(c => {
      const flag = document.createElement('div');
      flag.className = 'remote-cursor-flag';
      flag.style.backgroundColor = c.user.color;
      flag.textContent = c.user.name;
      remoteCursorsLayer.appendChild(flag);
    });
  }

  // ==========================================
  // Attachments Engine & Pristine Media Sync
  // ==========================================
  async function loadAttachments(notify = true) {
    try {
      const stored = await AttachmentDB.getAll();
      currentAttachments = Array.isArray(stored) ? stored.sort((a, b) => b.timestamp - a.timestamp) : [];
      renderAttachments();
      updateAttachmentStats();
    } catch (e) {
      console.warn('[SyncPad] Load attachments error:', e);
    }
  }

  function getFileCategory(type, name) {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();

    if (t.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico|bmp|avif|heic|heif|dng)$/i.test(n)) {
      return 'image';
    }
    if (t.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|ogv)$/i.test(n)) {
      return 'video';
    }
    if (t.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(n)) {
      return 'audio';
    }
    if (t.includes('pdf') || /\.(pdf)$/i.test(n) || t.includes('text') || /\.(txt|md|json|js|html|css|csv|xml|py)$/i.test(n) || t.includes('document') || /\.(docx?|xlsx?|pptx?)$/i.test(n)) {
      return 'document';
    }
    return 'other';
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Convert iOS HEIC/HEIF photos to standard high-quality JPEG if decodable, ensuring compatibility with PC browsers & Windows Photos
  async function convertHeicToJpegIfPossible(file) {
    const isHeic = /\.(heic|heif)$/i.test(file.name) || (file.type && /image\/(heic|heif)/i.test(file.type));
    if (!isHeic) return file;

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(() => reject(new Error('HEIC decode timeout')), 5000);
      });
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const convertedBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (convertedBlob) {
        const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
        return new File([convertedBlob], newName, { type: 'image/jpeg' });
      }
    } catch (err) {
      console.warn('[SyncPad] HEIC conversion skipped or not supported natively:', err);
    }
    return file;
  }

  // Generate lightweight base64 thumbnail for instant preview on all devices
  async function generateThumbnail(fileOrBlob) {
    try {
      const type = (fileOrBlob.type || '').toLowerCase();
      const name = (fileOrBlob.name || '').toLowerCase();
      const isImg = type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg|avif)$/i.test(name);
      if (!isImg) return null;

      const url = URL.createObjectURL(fileOrBlob);
      const img = new Image();
      img.src = url;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        setTimeout(() => reject(new Error('Thumb decode timeout')), 3500);
      });
      URL.revokeObjectURL(url);

      const maxDim = 120;
      let w = img.naturalWidth || img.width || 120;
      let h = img.naturalHeight || img.height || 120;
      if (w > h) {
        if (w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        }
      } else {
        if (h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, w);
      canvas.height = Math.max(1, h);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      return canvas.toDataURL('image/jpeg', 0.75);
    } catch (e) {
      return null;
    }
  }

  async function handleFiles(fileList) {
    if (isReadOnlyMode) {
      showToast('Read-only mode: uploading files is disabled');
      return;
    }
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    const peerCount = (window.syncEngine && window.syncEngine.getOnlinePeerCount) ? window.syncEngine.getOnlinePeerCount() : 1;
    if (peerCount < 2) {
      showToast('Notice: At least 2 devices must have the site open in Attachments to stream large files.');
    }

    for (const rawFile of files) {
      if (rawFile.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (rawFile.size / (1024 * 1024)).toFixed(1);
        showToast(`File "${rawFile.name}" (${sizeMB} MB) exceeds the 500 MB limit.`);
        continue;
      }

      // Convert HEIC if natively decodable (e.g. on iOS Safari)
      const file = await convertHeicToJpegIfPossible(rawFile);
      const thumbData = await generateThumbnail(file);
      const category = getFileCategory(file.type, file.name);

      const uploaderId = (window.syncEngine && window.syncEngine.deviceId) || 'dev_local';
      const uploaderName = (window.syncEngine && window.syncEngine.deviceName) || 'My Device';

      const item = {
        id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: file.name,
        type: file.type || 'application/octet-stream',
        category: category,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        thumbData: thumbData,
        blob: file, // Store pure, uncompressed original Blob!
        timestamp: Date.now(),
        note: '',
        uploaderId: uploaderId,
        uploaderName: uploaderName,
        sourceDeviceId: uploaderId,
        sourceDeviceName: uploaderName
      };

      await AttachmentDB.put(item);
      currentAttachments = currentAttachments.filter(a => a.id !== item.id);
      currentAttachments.unshift(item);
      renderAttachments();
      updateAttachmentStats();

      // Sync manifest entry to peers
      if (window.syncEngine && window.syncEngine.syncAttachmentManifestEntry) {
        window.syncEngine.syncAttachmentManifestEntry(item);
      }

      showToast(`Attached "${file.name}" (${item.sizeFormatted})`);
    }
  }

  function renderAttachments() {
    if (!attachmentsCardsGrid) return;

    // Revoke previous blob URLs to prevent memory leaks
    objectUrlsToRevoke.forEach(url => URL.revokeObjectURL(url));
    objectUrlsToRevoke.clear();

    attachmentsCardsGrid.innerHTML = '';

    let filtered = currentAttachments;
    if (activeAttachmentFilter !== 'all') {
      filtered = filtered.filter(item => item.category === activeAttachmentFilter);
    }
    if (attachmentSearchQuery) {
      const q = attachmentSearchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(q) || (item.note && item.note.toLowerCase().includes(q))
      );
    }

    if (filtered.length === 0) {
      if (emptyAttachmentsPlaceholder) emptyAttachmentsPlaceholder.classList.add('active');
    } else {
      if (emptyAttachmentsPlaceholder) emptyAttachmentsPlaceholder.classList.remove('active');
      filtered.forEach(item => {
        const card = createAttachmentCard(item);
        attachmentsCardsGrid.appendChild(card);
      });
    }

    updateAttachmentStats();
  }

  function createAttachmentCard(item) {
    const card = document.createElement('div');
    card.className = 'link-card attachment-item-card';
    card.setAttribute('data-id', item.id);

    const formattedTime = formatTimestamp(item.timestamp);
    const hasFullBlob = !!item.blob;
    let previewUrl = '';
    if (item.blob) {
      try {
        previewUrl = URL.createObjectURL(item.blob);
        objectUrlsToRevoke.add(previewUrl);
      } catch (e) {}
    } else if (item.thumbData) {
      previewUrl = item.thumbData;
    }

    let thumbHtml = '';
    if (item.category === 'image' && previewUrl) {
      thumbHtml = `
        <div class="attachment-thumb-wrap ${!hasFullBlob ? 'thumb-syncing' : ''}" title="${hasFullBlob ? 'Preview original photo' : 'Syncing file from peer...'}">
          <img class="attachment-thumb-img" src="${previewUrl}" alt="${escapeHtml(item.name)}" loading="lazy" />
          ${!hasFullBlob ? `<div class="attachment-thumb-sync-badge" title="Syncing file from peer">⟳</div>` : ''}
        </div>
      `;
    } else if (item.category === 'video' && previewUrl && hasFullBlob) {
      thumbHtml = `
        <div class="attachment-thumb-wrap" title="Play video">
          <video class="attachment-thumb-video" src="${previewUrl}" preload="metadata"></video>
          <div class="attachment-thumb-play-icon">${ICONS.play}</div>
        </div>
      `;
    } else if (item.category === 'audio') {
      thumbHtml = `
        <div class="attachment-thumb-wrap" title="Play audio">
          <div class="attachment-thumb-doc-icon">${ICONS.audio}</div>
        </div>
      `;
    } else {
      thumbHtml = `
        <div class="attachment-thumb-wrap ${!hasFullBlob ? 'thumb-syncing' : ''}" title="${hasFullBlob ? 'Download file' : 'Syncing file from peer...'}">
          <div class="attachment-thumb-doc-icon">${ICONS.file}</div>
          ${!hasFullBlob ? `<div class="attachment-thumb-sync-badge" title="Syncing file from peer">⟳</div>` : ''}
        </div>
      `;
    }

    const badgeClass = item.category === 'image' ? 'badge-image' :
                       item.category === 'video' ? 'badge-video' :
                       item.category === 'audio' ? 'badge-audio' : 'badge-doc';

    const syncStatusBadge = !hasFullBlob ? `<span class="domain-badge badge-syncing">SYNCING</span>` : '';
    const uploaderDisplay = item.uploaderName || item.sourceDeviceName || (item.sourceDeviceId ? `Device (${item.sourceDeviceId.slice(-4)})` : 'Device');
    const uploaderIdDisplay = item.uploaderId || item.sourceDeviceId || '';

    card.innerHTML = `
      <div class="link-card-left">
        ${thumbHtml}
        <div class="link-details">
          <div class="link-badge-row">
            <span class="domain-badge ${badgeClass}">${escapeHtml(item.category.toUpperCase())}</span>
            ${syncStatusBadge}
            <span class="domain-badge badge-uploader" title="Uploaded by: ${escapeHtml(uploaderDisplay)} (Device ID: ${escapeHtml(uploaderIdDisplay)})">
              <svg class="icon uploader-icon" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>${escapeHtml(uploaderDisplay)}</span>
            </span>
            <span class="attachment-size-text">${escapeHtml(item.sizeFormatted || '')}</span>
            <span class="link-time">${formattedTime}</span>
          </div>
          <span class="attachment-filename-text" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <input 
            type="text" 
            class="link-note-input" 
            placeholder="+ Add a caption..." 
            value="${escapeHtml(item.note || '')}" 
            ${isReadOnlyMode ? 'readonly' : ''}
            spellcheck="false"
          />
        </div>
      </div>
      <div class="link-card-actions">
        <button type="button" class="btn-card-action open-btn btn-preview" title="${hasFullBlob ? 'Preview media' : 'Preview / Sync media'}">
          <span>${hasFullBlob ? 'Preview' : 'View'}</span>
          ${ICONS.eye}
        </button>
        <button type="button" class="btn-card-action copy-btn btn-download" title="${hasFullBlob ? 'Download file' : 'Sync & download file from peer'}">
          ${ICONS.download}
        </button>
        ${!isReadOnlyMode ? `
        <button type="button" class="btn-card-action delete-btn btn-delete" title="Delete attachment permanently">
          ${ICONS.trash}
        </button>` : ''}
      </div>
    `;

    // Preview
    const previewTrigger = card.querySelector('.btn-preview');
    const thumbWrap = card.querySelector('.attachment-thumb-wrap');
    const filenameText = card.querySelector('.attachment-filename-text');
    if (previewTrigger) previewTrigger.addEventListener('click', () => openLightbox(item, previewUrl));
    if (thumbWrap) thumbWrap.addEventListener('click', () => openLightbox(item, previewUrl));
    if (filenameText) filenameText.addEventListener('click', () => openLightbox(item, previewUrl));

    // Download
    const downloadBtn = card.querySelector('.btn-download');
    if (downloadBtn) downloadBtn.addEventListener('click', () => downloadAttachment(item, previewUrl));

    // Caption
    const noteInput = card.querySelector('.link-note-input');
    if (noteInput) {
      noteInput.addEventListener('change', async () => {
        item.note = noteInput.value.trim();
        await AttachmentDB.put(item);
        if (window.syncEngine && window.syncEngine.syncAttachmentManifestEntry) {
          window.syncEngine.syncAttachmentManifestEntry(item);
        }
      });
    }

    // Delete
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) deleteBtn.addEventListener('click', () => deleteAttachment(item.id));

    return card;
  }

  function openLightbox(item, previewUrl) {
    if (!mediaLightboxModal) return;
    lightboxFilename.textContent = item.name;
    const isReady = !!item.blob;
    const uploaderDisplay = item.uploaderName || item.sourceDeviceName || 'Device';
    const uploaderIdDisplay = item.uploaderId || item.sourceDeviceId || 'local';
    lightboxFilemeta.textContent = `${item.category.toUpperCase()} • ${item.sizeFormatted} • By: ${uploaderDisplay} (${uploaderIdDisplay.slice(0, 10)}) • ${formatTimestamp(item.timestamp)} ${!isReady ? '• Syncing from peer' : ''}`;

    const url = previewUrl || (item.blob ? URL.createObjectURL(item.blob) : '');
    lightboxDownloadBtn.onclick = (e) => {
      e.preventDefault();
      downloadAttachment(item, previewUrl);
    };

    lightboxContentWrap.innerHTML = '';
    if (item.category === 'image' && url) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = item.name;
      lightboxContentWrap.appendChild(img);
      if (!isReady) {
        const syncNotice = document.createElement('div');
        syncNotice.className = 'lightbox-sync-banner';
        syncNotice.innerHTML = `<span>Displaying preview thumbnail. Full file is syncing from your peer device...</span>`;
        lightboxContentWrap.appendChild(syncNotice);
      }
    } else if (item.category === 'video' && url && isReady) {
      const video = document.createElement('video');
      video.src = url;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      lightboxContentWrap.appendChild(video);
    } else if (item.category === 'audio' && url && isReady) {
      const audio = document.createElement('audio');
      audio.src = url;
      audio.controls = true;
      audio.autoplay = true;
      lightboxContentWrap.appendChild(audio);
    } else {
      lightboxContentWrap.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-main);">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.name)}</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">${escapeHtml(item.sizeFormatted)} • ${escapeHtml(item.type)}</div>
          ${!isReady ? '<div class="lightbox-sync-banner" style="margin: 0 auto 16px auto;">Waiting for peer device to transfer full file data...</div>' : ''}
          <button type="button" id="lightbox-action-btn" class="btn btn-primary" style="display: inline-flex;">
            ${isReady ? 'Download File' : 'Sync & Download from Peer'}
          </button>
        </div>
      `;
      const actionBtn = lightboxContentWrap.querySelector('#lightbox-action-btn');
      if (actionBtn) {
        actionBtn.addEventListener('click', () => downloadAttachment(item, previewUrl));
      }
    }

    mediaLightboxModal.classList.add('active');
  }

  function closeLightbox() {
    if (!mediaLightboxModal) return;
    mediaLightboxModal.classList.remove('active');
    lightboxContentWrap.innerHTML = '';
  }

  async function downloadAttachment(item, previewUrl) {
    if (!item.blob) {
      item.autoDownloadWhenReady = true;
      const peerCount = (window.syncEngine && window.syncEngine.getOnlinePeerCount) ? window.syncEngine.getOnlinePeerCount() : 1;
      if (peerCount < 2) {
        showToast(`Waiting for peer: At least 2 devices must have the site open in Attachments to stream "${item.name}".`);
      } else {
        showToast(`Syncing "${item.name}" from your peer device... Download will start as soon as it arrives.`);
      }
      if (window.syncEngine && window.syncEngine.requestAttachmentStreaming) {
        window.syncEngine.requestAttachmentStreaming(item.id, item.sourceDeviceId);
      }
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    // If on iOS, offer native iOS Share Sheet so the user can easily "Save Image" to Photos!
    if (isIOS && navigator.canShare) {
      try {
        const file = new File([item.blob], item.name, { type: item.type || 'image/jpeg' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: item.name
          });
          return;
        }
      } catch (err) {
        if (err.name === 'AbortError') return; // User tapped cancel on iOS share sheet
      }
    }

    // Standard download trigger for PC Windows, Mac, Linux, Android
    const blobUrl = (previewUrl && item.blob) ? previewUrl : URL.createObjectURL(item.blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (blobUrl !== previewUrl) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    }
    showToast(`Downloading "${item.name}"`);
  }

  async function deleteAttachment(id) {
    const idx = currentAttachments.findIndex(a => a.id === id);
    if (idx !== -1) {
      const removed = currentAttachments.splice(idx, 1)[0];
      await AttachmentDB.delete(id);
      renderAttachments();
      updateAttachmentStats();
      if (window.syncEngine && window.syncEngine.deleteAttachment) {
        window.syncEngine.deleteAttachment(id);
      }

      showToastWithUndo(`Deleted "${removed.name}"`, async () => {
        await AttachmentDB.put(removed);
        currentAttachments.splice(idx, 0, removed);
        renderAttachments();
        updateAttachmentStats();
        if (window.syncEngine && window.syncEngine.syncAttachmentManifestEntry) {
          window.syncEngine.syncAttachmentManifestEntry(removed);
        }
      });
    }
  }

  // Download all as ZIP
  async function handleDownloadAllAttachmentsZip() {
    if (currentAttachments.length === 0) {
      showToast('No attachments to download');
      return;
    }
    if (!window.JSZip) {
      showToast('JSZip engine not loaded');
      return;
    }

    const readyItems = currentAttachments.filter(a => !!a.blob);
    if (readyItems.length === 0) {
      showToast('Files are still syncing from your peer device. Please ensure your device is connected.');
      if (window.syncEngine && window.syncEngine.requestMissingAttachments) {
        window.syncEngine.requestMissingAttachments();
      }
      return;
    }

    if (readyItems.length < currentAttachments.length) {
      showToast(`Archiving ${readyItems.length} of ${currentAttachments.length} files (${currentAttachments.length - readyItems.length} still syncing from peer)...`);
    } else {
      showToast(`Archiving ${readyItems.length} files into ZIP...`);
    }

    const zip = new window.JSZip();
    for (const item of readyItems) {
      zip.file(item.name, item.blob);
    }

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(content);
      a.download = `ringos_notepad_attachments_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('ZIP archive downloaded!');
    } catch (e) {
      showToast('Failed to generate ZIP archive');
    }
  }

  async function handleClearAllAttachments() {
    if (currentAttachments.length === 0) {
      showToast('No attachments to delete');
      return;
    }
    if (!confirm(`Are you sure you want to permanently delete all ${currentAttachments.length} attachments? This will remove them from all synced devices.`)) {
      return;
    }

    currentAttachments = [];
    await AttachmentDB.clear();
    renderAttachments();
    updateAttachmentStats();

    if (window.syncEngine && window.syncEngine.clearAllAttachments) {
      window.syncEngine.clearAllAttachments();
    }
    showToast('All attachments cleared');
  }

  function updateAttachmentStats() {
    const count = currentAttachments.length;
    if (attachmentCountBadge) attachmentCountBadge.textContent = count;
    if (attachmentsTitleCount) attachmentsTitleCount.textContent = `(${count})`;
    if (statAttachmentCount) statAttachmentCount.textContent = `${count} attachments`;
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

  // ==========================================
  // UI Event Listeners
  // ==========================================
  function setupEventListeners() {
    // 1. Quick paste input & button
    btnAddLink.addEventListener('click', handleAddLinkInput);
    quickPasteInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddLinkInput();
      }
    });

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

    // 2. Global paste listener
    window.addEventListener('paste', (e) => {
      if (e.clipboardData) {
        const files = [];
        if (e.clipboardData.files && e.clipboardData.files.length > 0) {
          for (let i = 0; i < e.clipboardData.files.length; i++) {
            files.push(e.clipboardData.files[i]);
          }
        } else if (e.clipboardData.items && e.clipboardData.items.length > 0) {
          for (let i = 0; i < e.clipboardData.items.length; i++) {
            const it = e.clipboardData.items[i];
            if (it.kind === 'file') {
              const f = it.getAsFile();
              if (f) files.push(f);
            }
          }
        }
        if (files.length > 0) {
          e.preventDefault();
          switchView('attachments');
          handleFiles(files);
          return;
        }
      }

      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'textarea' || (activeTag === 'input' && document.activeElement !== quickPasteInput)) {
        return;
      }

      const pastedText = (e.clipboardData || window.clipboardData).getData('text');
      if (pastedText && isLikelyUrl(pastedText)) {
        e.preventDefault();
        processPastedText(pastedText);
      }
    });

    // 3. Tab switching
    if (tabNotepad) tabNotepad.addEventListener('click', () => switchView('notepad'));
    if (tabLinks) tabLinks.addEventListener('click', () => switchView('links'));
    if (tabSplit) tabSplit.addEventListener('click', () => switchView('split'));
    if (tabAttachments) tabAttachments.addEventListener('click', () => switchView('attachments'));

    // Theme & Styling popover trigger
    const btnToggleCustomizers = document.getElementById('btn-toggle-customizers');
    const themePopover = document.getElementById('theme-popover');
    const btnCloseThemePopover = document.getElementById('btn-close-theme-popover');
    const canvasCustomizers = document.getElementById('canvas-customizers');

    if (btnToggleCustomizers && themePopover) {
      btnToggleCustomizers.addEventListener('click', (e) => {
        e.stopPropagation();
        if (connectionPopover) connectionPopover.classList.remove('active');
        const willBeActive = !themePopover.classList.contains('active');

        if (willBeActive && window.innerWidth >= 900) {
          const rect = btnToggleCustomizers.getBoundingClientRect();
          themePopover.style.position = 'fixed';
          themePopover.style.left = `${Math.round(rect.right + 12)}px`;
          themePopover.style.right = 'auto';
          const popHeight = themePopover.offsetHeight || 330;
          let top = Math.round(rect.top - 8);
          if (top + popHeight > window.innerHeight - 20) {
            top = Math.max(20, window.innerHeight - popHeight - 20);
          }
          themePopover.style.top = `${top}px`;
        } else if (window.innerWidth < 900) {
          themePopover.style.position = '';
          themePopover.style.left = '';
          themePopover.style.right = '';
          themePopover.style.top = '';
        }

        themePopover.classList.toggle('active', willBeActive);
        btnToggleCustomizers.classList.toggle('active', willBeActive);

        if (canvasCustomizers) {
          canvasCustomizers.classList.toggle('active', willBeActive);
        }
      });
    }

    if (btnCloseThemePopover && themePopover) {
      btnCloseThemePopover.addEventListener('click', () => {
        themePopover.classList.remove('active');
        if (btnToggleCustomizers) btnToggleCustomizers.classList.remove('active');
      });
    }

    // Theme swatches inside popover
    document.querySelectorAll('.theme-swatch-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const val = btn.dataset.themeVal;
        if (val) {
          applyTheme(val, true);
          if (themePopover) themePopover.classList.remove('active');
          if (btnToggleCustomizers) btnToggleCustomizers.classList.remove('active');
        }
      });
    });

    const selectFontPopover = document.getElementById('select-font-popover');
    if (selectFontPopover) {
      selectFontPopover.addEventListener('change', (e) => applyFont(e.target.value));
    }

    const selectRulingPopover = document.getElementById('select-ruling-popover');
    if (selectRulingPopover) {
      selectRulingPopover.addEventListener('change', (e) => applyRuling(e.target.value));
    }

    // 4. Collaborative Textarea listeners
    paperTextarea.addEventListener('input', () => {
      if (isReadOnlyMode) return;
      const text = paperTextarea.value;
      window.syncEngine.setNoteText(text, activeNotePageId);
      updateTextStats(text);
      window.syncEngine.setLocalCursor(paperTextarea.selectionStart, paperTextarea.selectionEnd);
    });

    paperTextarea.addEventListener('selectionchange', () => {
      window.syncEngine.setLocalCursor(paperTextarea.selectionStart, paperTextarea.selectionEnd);
    });

    paperTextarea.addEventListener('keyup', () => {
      window.syncEngine.setLocalCursor(paperTextarea.selectionStart, paperTextarea.selectionEnd);
    });

    // 5. Notes Mode Toggle (Edit vs Markdown Preview)
    if (btnModeEdit) {
      btnModeEdit.addEventListener('click', () => {
        noteEditorMode = 'edit';
        btnModeEdit.classList.add('active');
        btnModePreview.classList.remove('active');
        paperTextarea.style.display = 'block';
        paperMarkdownPreview.style.display = 'none';
        paperTextarea.focus();
      });
    }

    if (btnModePreview) {
      btnModePreview.addEventListener('click', () => {
        noteEditorMode = 'preview';
        btnModePreview.classList.add('active');
        btnModeEdit.classList.remove('active');
        paperTextarea.style.display = 'none';
        paperMarkdownPreview.style.display = 'block';
        renderMarkdownPreview(paperTextarea.value);
      });
    }

    // 6. Note Pages + Button
    if (btnAddNotePage) {
      btnAddNotePage.addEventListener('click', () => {
        const title = prompt('Enter page title:', 'New Page');
        if (title && title.trim()) {
          const newId = window.syncEngine.addPage(title.trim());
          if (newId) {
            switchNotePage(newId);
          }
        }
      });
    }

    // 7. Batch actions for links
    if (btnOpenUnread) {
      btnOpenUnread.addEventListener('click', () => {
        const unread = currentLinks.filter(l => !l.opened);
        if (unread.length === 0) {
          showToast('No unread links to open');
          return;
        }
        unread.forEach(l => {
          window.open(l.url, '_blank', 'noopener,noreferrer');
          window.syncEngine.updateLink(l.id, { opened: true });
        });
        showToast(`Opened ${unread.length} unread links`);
      });
    }

    if (btnOpenAll) {
      btnOpenAll.addEventListener('click', () => {
        if (currentLinks.length === 0) {
          showToast('No links to open');
          return;
        }
        currentLinks.forEach(l => {
          window.open(l.url, '_blank', 'noopener,noreferrer');
          if (!l.opened) window.syncEngine.updateLink(l.id, { opened: true });
        });
        showToast(`Opened ${currentLinks.length} links`);
      });
    }

    if (btnCopyAll) {
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
    }

    if (btnClearCompleted) {
      btnClearCompleted.addEventListener('click', () => {
        const completedCount = currentLinks.filter(l => l.opened).length;
        if (completedCount === 0) {
          showToast('No visited links to clear');
          return;
        }
        window.syncEngine.clearCompletedLinks();
        showToast(`Cleared ${completedCount} visited links`);
      });
    }

    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (currentLinks.length === 0) {
          showToast('No links to delete');
          return;
        }
        if (confirm(`Are you sure you want to delete all ${currentLinks.length} links?`)) {
          window.syncEngine.clearAllLinks();
          showToast('All links deleted');
        }
      });
    }

    // 8. Link search & filter chips
    if (linkSearchInput) {
      linkSearchInput.addEventListener('input', (e) => {
        linkSearchQuery = e.target.value.trim();
        if (btnClearLinkSearch) btnClearLinkSearch.style.display = linkSearchQuery ? 'block' : 'none';
        renderLinks();
      });
    }

    if (btnClearLinkSearch) {
      btnClearLinkSearch.addEventListener('click', () => {
        linkSearchInput.value = '';
        linkSearchQuery = '';
        btnClearLinkSearch.style.display = 'none';
        renderLinks();
      });
    }

    if (linkFilterChips) {
      linkFilterChips.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
        chip.addEventListener('click', () => {
          linkFilterChips.querySelectorAll('.filter-chip[data-filter]').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          activeLinkFilter = chip.dataset.filter;
          renderLinks();
        });
      });
    }

    if (btnToggleGrouping) {
      btnToggleGrouping.addEventListener('click', () => {
        isGroupingByDay = !isGroupingByDay;
        localStorage.setItem('ringo_group_by_day', String(isGroupingByDay));
        btnToggleGrouping.textContent = isGroupingByDay ? 'Group: Day' : 'Group: Off';
        btnToggleGrouping.classList.toggle('active', isGroupingByDay);
        renderLinks();
      });
    }

    // 9. Attachments events
    if (btnUploadAttachments) {
      btnUploadAttachments.addEventListener('click', () => {
        if (attachmentFileInput) attachmentFileInput.click();
      });
    }

    if (btnHeaderAttach) {
      btnHeaderAttach.addEventListener('click', () => {
        if (attachmentFileInput) attachmentFileInput.click();
        switchView('attachments');
      });
    }

    if (attachmentFileInput) {
      attachmentFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleFiles(e.target.files);
          e.target.value = '';
        }
      });
    }

    if (btnDownloadAllAttachments) {
      btnDownloadAllAttachments.addEventListener('click', handleDownloadAllAttachmentsZip);
    }

    if (btnClearAllAttachments) {
      btnClearAllAttachments.addEventListener('click', handleClearAllAttachments);
    }

    if (attachmentSearchInput) {
      attachmentSearchInput.addEventListener('input', (e) => {
        attachmentSearchQuery = e.target.value.trim();
        renderAttachments();
      });
    }

    document.querySelectorAll('.attachment-filter-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.attachment-filter-btn').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeAttachmentFilter = pill.dataset.filter || 'all';
        renderAttachments();
      });
    });

    // 10. Global Drag and drop
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        if (globalDragOverlay) globalDragOverlay.classList.add('active');
      }
    });

    window.addEventListener('dragover', (e) => e.preventDefault());

    window.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        if (globalDragOverlay) globalDragOverlay.classList.remove('active');
      }
    });

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      if (globalDragOverlay) globalDragOverlay.classList.remove('active');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    });

    // 11. Lightbox
    if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
    if (mediaLightboxModal) {
      mediaLightboxModal.addEventListener('click', (e) => {
        if (e.target === mediaLightboxModal) closeLightbox();
      });
    }

    // 12. Appearance settings
    if (selectTheme) {
      selectTheme.addEventListener('change', (e) => applyTheme(e.target.value, true));
    }

    if (selectFont) {
      selectFont.addEventListener('change', (e) => applyFont(e.target.value));
    }

    if (selectRuling) {
      selectRuling.addEventListener('change', (e) => applyRuling(e.target.value));
    }

    // Ambience Toggle
    if (btnToggleAmbience) {
      btnToggleAmbience.addEventListener('click', () => {
        if (window.natureAmbience) {
          const active = window.natureAmbience.toggle();
          btnToggleAmbience.classList.toggle('active', active);
          showToast(active ? 'Nature ambience enabled' : 'Nature ambience paused');
        }
      });
    }

    // 13. Sync Status Popover
    if (syncStatusContainer) {
      syncStatusContainer.addEventListener('click', (e) => {
        e.stopPropagation();
        const themePop = document.getElementById('theme-popover');
        if (themePop) themePop.classList.remove('active');
        const willBeActive = !connectionPopover.classList.contains('active');

        if (willBeActive && window.innerWidth >= 900) {
          const rect = syncStatusContainer.getBoundingClientRect();
          connectionPopover.style.position = 'fixed';
          connectionPopover.style.left = `${Math.round(rect.right + 12)}px`;
          connectionPopover.style.right = 'auto';
          const popHeight = connectionPopover.offsetHeight || 300;
          let top = Math.round(rect.top - 8);
          if (top + popHeight > window.innerHeight - 20) {
            top = Math.max(20, window.innerHeight - popHeight - 20);
          }
          connectionPopover.style.top = `${top}px`;
        } else if (window.innerWidth < 900) {
          connectionPopover.style.position = '';
          connectionPopover.style.left = '';
          connectionPopover.style.right = '';
          connectionPopover.style.top = '';
        }

        connectionPopover.classList.toggle('active', willBeActive);
      });
    }

    if (btnClosePopover) {
      btnClosePopover.addEventListener('click', () => {
        connectionPopover.classList.remove('active');
      });
    }

    document.addEventListener('click', (e) => {
      if (connectionPopover && !connectionPopover.contains(e.target) && e.target !== syncStatusContainer) {
        connectionPopover.classList.remove('active');
      }
      const themePop = document.getElementById('theme-popover');
      const btnTheme = document.getElementById('btn-toggle-customizers');
      if (themePop && !themePop.contains(e.target) && btnTheme && !btnTheme.contains(e.target)) {
        themePop.classList.remove('active');
        if (btnTheme) btnTheme.classList.remove('active');
      }
    });

    if (btnSaveDeviceName) {
      btnSaveDeviceName.addEventListener('click', () => {
        const val = inputMyDeviceName.value.trim();
        if (val) {
          window.syncEngine.setDeviceName(val);
          statDeviceName.textContent = val;
          showToast('Device name saved');
        }
      });
    }

    if (statDeviceName) {
      statDeviceName.addEventListener('click', () => {
        connectionPopover.classList.add('active');
        inputMyDeviceName.focus();
      });
    }

    // 14. Share & Shortcuts Modals
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
        showToast('Workspace link copied');
      });
    });

    if (btnCopyReadonlyUrl) {
      btnCopyReadonlyUrl.addEventListener('click', () => {
        shareReadonlyInput.select();
        navigator.clipboard.writeText(shareReadonlyInput.value).then(() => {
          btnCopyReadonlyUrl.textContent = 'Copied!';
          setTimeout(() => { btnCopyReadonlyUrl.textContent = 'Copy Read-Only'; }, 2000);
          showToast('Read-only link copied');
        });
      });
    }

    if (btnOpenShortcuts) btnOpenShortcuts.addEventListener('click', openShortcutsModal);
    if (btnCloseShortcuts) btnCloseShortcuts.addEventListener('click', closeShortcutsModal);
    shortcutsModal.addEventListener('click', (e) => {
      if (e.target === shortcutsModal) closeShortcutsModal();
    });

    // 15. Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      // Escape closes any modal
      if (e.key === 'Escape') {
        closeLightbox();
        closeShareModal();
        closeShortcutsModal();
        if (connectionPopover) connectionPopover.classList.remove('active');
        return;
      }

      // '?' opens shortcuts when not inside an input/textarea
      if (e.key === '?' && !['input', 'textarea'].includes((document.activeElement.tagName || '').toLowerCase())) {
        e.preventDefault();
        openShortcutsModal();
        return;
      }

      // '/' focuses paste input
      if (e.key === '/' && !['input', 'textarea'].includes((document.activeElement.tagName || '').toLowerCase())) {
        e.preventDefault();
        if (quickPasteInput) quickPasteInput.focus();
        return;
      }

      // Cmd/Ctrl + 1..4 switch tabs
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        if (e.key === '1') switchView('links');
        else if (e.key === '2') switchView('notepad');
        else if (e.key === '3') switchView('split');
        else if (e.key === '4') switchView('attachments');
      }

      // Cmd/Ctrl + M toggles Markdown
      if ((e.metaKey || e.ctrlKey) && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        if (noteEditorMode === 'edit') {
          if (btnModePreview) btnModePreview.click();
        } else {
          if (btnModeEdit) btnModeEdit.click();
        }
      }
    });
  }

  // Handle adding link from quick paste input
  function handleAddLinkInput() {
    if (isReadOnlyMode) return;
    const val = quickPasteInput.value.trim();
    if (!val) return;
    processPastedText(val);
    quickPasteInput.value = '';
    quickPasteInput.focus();
  }

  function processPastedText(text) {
    if (isReadOnlyMode) return;
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let addedCount = 0;

    lines.forEach(line => {
      const urlRegex = /(https?:\/\/[^\s]+)/gi;
      const matches = line.match(urlRegex);

      if (matches && matches.length > 0) {
        matches.forEach(rawUrl => {
          const note = line.replace(rawUrl, '').trim();
          addVerifiedLink(rawUrl, note);
          addedCount++;
        });
      } else if (isLikelyUrl(line)) {
        addVerifiedLink(line, '');
        addedCount++;
      } else {
        // Line is pure text - offer feedback rather than creating broken link
        showToast('Pasted text was not a link (use Notepad for notes)');
      }
    });

    if (addedCount === 1) {
      showToast('Clean link added & synced via CRDT');
    } else if (addedCount > 1) {
      showToast(`${addedCount} clean links added & synced`);
    }
  }

  function addVerifiedLink(rawUrl, rawNote) {
    const cleaned = cleanAndSanitizeUrl(rawUrl);
    if (!cleaned) {
      showToast('Invalid or unsafe link rejected');
      return;
    }

    // Duplicate detection
    const existing = currentLinks.find(l => l.url.toLowerCase() === cleaned.url.toLowerCase());
    if (existing) {
      showToast('Link already in list (highlighted)');
      highlightExistingLinkCard(existing.id);
      return;
    }

    const tags = extractTags(rawNote);
    const linkItem = {
      id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: cleaned.url,
      domain: cleaned.domain,
      note: rawNote ? rawNote.trim() : '',
      timestamp: Date.now(),
      opened: false,
      pinned: false,
      tags: tags,
      addedBy: window.syncEngine.deviceName,
      preview: null
    };

    window.syncEngine.addLink(linkItem);
  }

  function highlightExistingLinkCard(id) {
    const card = document.querySelector(`.link-card[data-id="${id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('pulse-highlight');
      setTimeout(() => card.classList.remove('pulse-highlight'), 2000);
    }
  }

  function switchView(mode) {
    if (!['notepad', 'links', 'split', 'attachments'].includes(mode)) {
      mode = 'split';
    }

    document.body.classList.remove('view-notepad', 'view-links', 'view-split', 'view-attachments');
    document.body.classList.add(`view-${mode}`);

    if (attachmentsView) {
      attachmentsView.style.setProperty('display', mode === 'attachments' ? 'flex' : 'none', 'important');
    }

    if (tabNotepad) tabNotepad.classList.toggle('active', mode === 'notepad');
    if (tabLinks) tabLinks.classList.toggle('active', mode === 'links');
    if (tabSplit) tabSplit.classList.toggle('active', mode === 'split');
    if (tabAttachments) tabAttachments.classList.toggle('active', mode === 'attachments');

    try { localStorage.setItem('ringo_view_mode', mode); } catch (e) {}

    if (mode === 'attachments') {
      const peerCount = (window.syncEngine && window.syncEngine.getOnlinePeerCount) ? window.syncEngine.getOnlinePeerCount() : 1;
      if (peerCount < 2) {
        showToast('⚡ Note: At least 2 devices must have the site open to the Attachments section to transfer files.');
      }
    }

    if (mode === 'notepad' || mode === 'split') {
      if (noteEditorMode === 'edit') paperTextarea.focus();
    } else if (mode === 'links') {
      if (quickPasteInput) quickPasteInput.focus();
    }
  }

  // ==========================================
  // Share & QR Code (Client-Side Local Generator)
  // ==========================================
  async function openShareModal() {
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const cleanUrl = origin + pathname;

    shareUrlInput.value = cleanUrl;
    shareReadonlyInput.value = cleanUrl + '?view=readonly';

    if (qrCodeBox) {
      qrCodeBox.innerHTML = '<span style="font-size:12px;color:var(--text-subtle);">Generating QR...</span>';
      try {
        if (window.QRCode && window.QRCode.toDataURL) {
          const qrDataUrl = await window.QRCode.toDataURL(cleanUrl, {
            width: 180,
            margin: 2,
            color: { dark: '#132a1e', light: '#ffffff' }
          });
          qrCodeBox.innerHTML = `<img src="${qrDataUrl}" alt="Local QR Code" class="qr-code-svg" />`;
        } else {
          qrCodeBox.innerHTML = `<div style="font-size:12px;color:var(--text-subtle);">${escapeHtml(cleanUrl)}</div>`;
        }
      } catch (e) {
        qrCodeBox.innerHTML = `<div style="font-size:12px;color:var(--text-subtle);">${escapeHtml(cleanUrl)}</div>`;
      }
    }

    shareModal.classList.add('active');
  }

  function closeShareModal() {
    if (shareModal) shareModal.classList.remove('active');
  }

  function openShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.add('active');
  }

  function closeShortcutsModal() {
    if (shortcutsModal) shortcutsModal.classList.remove('active');
  }

  // ==========================================
  // Toast Notifications
  // ==========================================
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
    
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    toast.appendChild(textSpan);

    const undoBtn = document.createElement('button');
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Undo';
    undoBtn.addEventListener('click', () => {
      onUndo();
      toast.remove();
      showToast('Action undone');
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

  // Localized timestamp
  function formatTimestamp(ts) {
    if (!ts) return '';
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';
    try {
      return new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return date.toLocaleTimeString();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
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
