/**
 * Ringo's Notepad: Application UI Controller & User Interaction
 * Modern, leafy pastel green UI • Optimized for link pasting • Permanent persistence
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
    globe: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
    paperclip: `<svg class="icon" viewBox="0 0 24 24"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>`,
    image: `<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    video: `<svg class="icon" viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    audio: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`,
    file: `<svg class="icon" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    download: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`,
    eye: `<svg class="icon" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
    upload: `<svg class="icon" viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"></polyline><line x1="12" y1="12" x2="12" y2="21"></line><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path></svg>`,
    play: `<svg class="icon" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
  };

  // Size limit constants (Optimized for full-resolution modern 48MP iPhone photos & ProRAW)
  const MAX_FILE_SIZE_BYTES = 75 * 1024 * 1024; // 75 MB limit
  const MAX_FILE_SIZE_LABEL = '75 MB';

  // DOM Elements
  const quickPasteInput = document.getElementById('quick-paste-input');
  const btnPasteClipboard = document.getElementById('btn-paste-clipboard');
  const btnAddLink = document.getElementById('btn-add-link');
  const linkCardsContainer = document.getElementById('link-cards-container');
  const emptyLinksPlaceholder = document.getElementById('empty-links-placeholder');
  const linkCountBadge = document.getElementById('link-count-badge');
  const linkListTitleCount = document.getElementById('link-list-title-count');
  const paperTextarea = document.getElementById('paper-textarea');
  
  // Notebook Tab Navigation Controls
  const tabNotepad = document.getElementById('tab-notepad');
  const tabLinks = document.getElementById('tab-links');
  const tabSplit = document.getElementById('tab-split');
  const tabAttachments = document.getElementById('tab-attachments');
  const linkListView = document.getElementById('link-list-view');
  const rawNotepadView = document.getElementById('raw-notepad-view');
  const attachmentsView = document.getElementById('attachments-view');

  // Attachment DOM Elements
  const attachmentCountBadge = document.getElementById('attachment-count-badge');
  const attachmentsTitleCount = document.getElementById('attachments-title-count');
  const btnUploadAttachments = document.getElementById('btn-upload-attachments');
  const btnDownloadAllAttachments = document.getElementById('btn-download-all-attachments');
  const btnClearAllAttachments = document.getElementById('btn-clear-all-attachments');
  const attachmentDropzone = document.getElementById('attachment-dropzone');
  const attachmentFileInput = document.getElementById('attachment-file-input');
  const dropzoneBrowseBtn = document.getElementById('dropzone-browse-btn');
  const storageUsageBadge = document.getElementById('storage-usage-badge');
  const attachmentSearchInput = document.getElementById('attachment-search-input');
  const attachmentsCardsGrid = document.getElementById('attachments-cards-grid');
  const emptyAttachmentsPlaceholder = document.getElementById('empty-attachments-placeholder');
  const btnHeaderAttach = document.getElementById('btn-header-attach');

  // Filter Counters
  const countAll = document.getElementById('count-all');
  const countImage = document.getElementById('count-image');
  const countVideo = document.getElementById('count-video');
  const countAudio = document.getElementById('count-audio');
  const countDocument = document.getElementById('count-document');

  // Lightbox Modal Elements
  const mediaLightboxModal = document.getElementById('media-lightbox-modal');
  const lightboxFilename = document.getElementById('lightbox-filename');
  const lightboxFilemeta = document.getElementById('lightbox-filemeta');
  const lightboxDownloadBtn = document.getElementById('lightbox-download-btn');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxContentWrap = document.getElementById('lightbox-content-wrap');

  // Global Drag Overlay
  const globalDragOverlay = document.getElementById('global-drag-overlay');

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
  const statAttachmentCount = document.getElementById('stat-attachment-count');
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
  let currentAttachments = [];
  let activeFilter = 'all';
  let currentSearchQuery = '';
  let deletedAttachmentHistory = [];
  let isEditingTextarea = false;

  // IndexedDB Storage Manager for Permanent Attachments
  const AttachmentDB = {
    dbPromise: null,
    getDb() {
      if (!this.dbPromise) {
        this.dbPromise = new Promise((resolve) => {
          try {
            const req = indexedDB.open('ringos_notepad_db', 1);
            req.onupgradeneeded = (e) => {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('attachments')) {
                db.createObjectStore('attachments', { keyPath: 'id' });
              }
            };
            req.onsuccess = (e) => resolve(e.target.result);
            req.onerror = (e) => {
              console.error('[SyncPad] IndexedDB open error:', e);
              resolve(null);
            };
          } catch (e) {
            console.error('[SyncPad] IndexedDB unavailable:', e);
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

  // Expose to global for SyncEngine cross-device file transfer
  window.AttachmentDB = AttachmentDB;

  function generateThumbnail(dataUrl, category) {
    return new Promise((resolve) => {
      if (category !== 'image' || !dataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 320;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(w, 1);
          canvas.height = Math.max(h, 1);
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const thumb = canvas.toDataURL('image/jpeg', 0.65);
          resolve(thumb);
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // Cross-Tab Attachment Synchronization
  let attachmentsChannel = null;
  try {
    attachmentsChannel = new BroadcastChannel('syncpad-attachments-bc');
    attachmentsChannel.onmessage = async (e) => {
      if (e.data && (e.data.type === 'ATTACHMENTS_CHANGED' || e.data.type === 'ATTACHMENTS_MANIFEST_UPDATE')) {
        await loadAttachments(false);
      }
    };
  } catch (e) {}

  function broadcastAttachmentsChange() {
    if (attachmentsChannel) {
      try {
        attachmentsChannel.postMessage({ type: 'ATTACHMENTS_CHANGED' });
      } catch (e) {}
    }
  }

  // Initialize
  function init() {
    loadPreferences();
    setupEventListeners();
    setupSyncEngine();
    loadAttachments();
    updateShareUrl();
    statDeviceName.textContent = window.syncEngine.deviceInfo.name;

    // Initialize Blank Notepad text from local/cloud storage
    if (window.syncEngine.notes) {
      paperTextarea.value = window.syncEngine.notes;
      updateTextStats(window.syncEngine.notes);
    }
  }

  function loadPreferences() {
    const theme = localStorage.getItem('syncpad_theme') || 'sepia';
    const font = localStorage.getItem('syncpad_font') || 'sans';
    const ruling = localStorage.getItem('syncpad_ruling') || 'dots';

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
      if (!isEditingTextarea && paperTextarea.value !== text) {
        const start = paperTextarea.selectionStart;
        const end = paperTextarea.selectionEnd;
        const isFocused = document.activeElement === paperTextarea;

        paperTextarea.value = text || '';
        
        if (isFocused && start !== null && end !== null) {
          try {
            paperTextarea.setSelectionRange(start, end);
          } catch(e) {}
        }
        updateTextStats(paperTextarea.value);
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

    sync.onAttachmentsUpdate = async (manifest) => {
      await loadAttachments(false);
    };

    sync.onAttachmentDataReceived = async (fullItem) => {
      await loadAttachments(false);
      showToast(`Synced "${fullItem.name}" from another device!`);
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

    // 3. Global Paste Listener: paste pictures/files or links from anywhere
    window.addEventListener('paste', (e) => {
      // Check for pasted files or images in clipboard (e.g. Snipping Tool screenshots)
      const clipboardFiles = (e.clipboardData && e.clipboardData.files) ? e.clipboardData.files : null;
      if (clipboardFiles && clipboardFiles.length > 0) {
        e.preventDefault();
        handleFiles(clipboardFiles);
        return;
      }

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

    // 4. Notebook Tab Navigation Controls
    if (tabNotepad) tabNotepad.addEventListener('click', () => switchView('notepad'));
    if (tabLinks) tabLinks.addEventListener('click', () => switchView('links'));
    if (tabSplit) tabSplit.addEventListener('click', () => switchView('split'));
    if (tabAttachments) tabAttachments.addEventListener('click', () => switchView('attachments'));

    // Mobile Appearance Drawer Toggle
    const btnToggleCustomizers = document.getElementById('btn-toggle-customizers');
    const canvasCustomizers = document.getElementById('canvas-customizers');
    if (btnToggleCustomizers && canvasCustomizers) {
      btnToggleCustomizers.addEventListener('click', () => {
        canvasCustomizers.classList.toggle('active');
        btnToggleCustomizers.classList.toggle('active');
      });
    }

    // Set 'split' (side-by-side) as default when site is opened
    if (localStorage.getItem('ringo_default_sidebyside_v2') !== 'true') {
      localStorage.setItem('ringo_default_sidebyside_v2', 'true');
      localStorage.setItem('ringo_view_mode', 'split');
    }

    const savedView = localStorage.getItem('ringo_view_mode') || 'split';
    switchView(savedView);

    // 5. Raw textarea input listener (collaborative typing)
    paperTextarea.addEventListener('input', () => {
      isEditingTextarea = true;
      const text = paperTextarea.value;
      window.syncEngine.setRawNotes(text);
      updateTextStats(text);
      setTimeout(() => { isEditingTextarea = false; }, 300);
    });

    paperTextarea.addEventListener('blur', () => {
      window.syncEngine.flushNotesNow();
    });

    window.addEventListener('beforeunload', () => {
      window.syncEngine.flushNotesNow();
    });

    // 6. Batch Actions for Links
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

    // 7. Attachments Event Listeners
    if (btnUploadAttachments) {
      btnUploadAttachments.addEventListener('click', () => {
        if (attachmentFileInput) attachmentFileInput.click();
      });
    }

    if (btnHeaderAttach) {
      btnHeaderAttach.addEventListener('click', () => {
        if (attachmentFileInput) attachmentFileInput.click();
      });
    }

    if (dropzoneBrowseBtn) {
      dropzoneBrowseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (attachmentFileInput) attachmentFileInput.click();
      });
    }

    if (attachmentDropzone) {
      attachmentDropzone.addEventListener('click', () => {
        if (attachmentFileInput) attachmentFileInput.click();
      });
      attachmentDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        attachmentDropzone.classList.add('drag-active');
      });
      attachmentDropzone.addEventListener('dragleave', () => {
        attachmentDropzone.classList.remove('drag-active');
      });
      attachmentDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        attachmentDropzone.classList.remove('drag-active');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFiles(e.dataTransfer.files);
        }
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
      btnDownloadAllAttachments.addEventListener('click', handleDownloadAllAttachments);
    }

    if (btnClearAllAttachments) {
      btnClearAllAttachments.addEventListener('click', handleClearAllAttachments);
    }

    if (attachmentSearchInput) {
      attachmentSearchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        renderAttachments();
      });
    }

    // Attachment Category Filter Pills
    document.querySelectorAll('.attachment-filter-btn, .filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.attachment-filter-btn, .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeFilter = pill.getAttribute('data-filter') || 'all';
        renderAttachments();
      });
    });

    // 8. Global Window Drag and Drop
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
      e.preventDefault();
      dragCounter++;
      if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) {
        if (globalDragOverlay) globalDragOverlay.classList.add('active');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

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

    // 9. Media Lightbox Modal Listeners
    if (lightboxCloseBtn) {
      lightboxCloseBtn.addEventListener('click', closeLightbox);
    }
    if (mediaLightboxModal) {
      mediaLightboxModal.addEventListener('click', (e) => {
        if (e.target === mediaLightboxModal) closeLightbox();
      });
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeLightbox();
    });

    // 10. Customization Selectors
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

    // Ambience Animation Toggle
    const btnToggleAmbience = document.getElementById('btn-toggle-ambience');
    if (btnToggleAmbience) {
      btnToggleAmbience.addEventListener('click', () => {
        if (window.natureAmbience) {
          const active = window.natureAmbience.toggle();
          showToast(active ? 'Nature ambience enabled' : 'Nature ambience paused');
        }
      });
    }

    // 11. Room Sharing & Modals
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
    const fullDateTitle = item.timestamp ? new Date(item.timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'long' }) : '';
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
            <span class="link-time" ${fullDateTitle ? `title="${escapeHtml(fullDateTitle)}"` : ''}>${formattedTime}</span>
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

  // Switch between Blank Notepad, Link Collector, Side-by-Side, and Attachments views
  function switchView(mode) {
    if (mode !== 'notepad' && mode !== 'links' && mode !== 'split' && mode !== 'attachments') {
      mode = 'split';
    }

    document.body.classList.remove('view-notepad', 'view-links', 'view-split', 'view-attachments');
    document.body.classList.add(`view-${mode}`);

    // Strictly enforce that attachments are hidden in notepad, links, and split views
    if (attachmentsView) {
      if (mode === 'attachments') {
        attachmentsView.style.setProperty('display', 'flex', 'important');
      } else {
        attachmentsView.style.setProperty('display', 'none', 'important');
      }
    }

    if (tabNotepad) {
      tabNotepad.classList.toggle('active', mode === 'notepad');
      tabNotepad.setAttribute('aria-selected', mode === 'notepad');
    }
    if (tabLinks) {
      tabLinks.classList.toggle('active', mode === 'links');
      tabLinks.setAttribute('aria-selected', mode === 'links');
    }
    if (tabSplit) {
      tabSplit.classList.toggle('active', mode === 'split');
      tabSplit.setAttribute('aria-selected', mode === 'split');
    }
    if (tabAttachments) {
      tabAttachments.classList.toggle('active', mode === 'attachments');
      tabAttachments.setAttribute('aria-selected', mode === 'attachments');
    }

    try {
      localStorage.setItem('ringo_view_mode', mode);
    } catch (e) {}

    // Focus active input smoothly
    if (mode === 'notepad' || mode === 'split') {
      paperTextarea.focus();
    } else if (mode === 'links') {
      if (quickPasteInput) quickPasteInput.focus();
    }
  }

  // ==========================================
  // Attachments Engine & UI Logic
  // ==========================================

  async function loadAttachments(notify = true) {
    try {
      const stored = await AttachmentDB.getAll();
      currentAttachments = Array.isArray(stored) ? stored.sort((a, b) => b.timestamp - a.timestamp) : [];
      renderAttachments();
      updateAttachmentStats();
    } catch (e) {
      console.warn('[SyncPad] Failed to load attachments from IndexedDB:', e);
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

  function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);

    files.forEach(file => {
      // Enforce 15 MB limit
      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        showToast(`File "${file.name}" (${sizeMB} MB) exceeds the ${MAX_FILE_SIZE_LABEL} limit. Attachments must be under ${MAX_FILE_SIZE_LABEL}.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        const category = getFileCategory(file.type, file.name);
        const item = {
          id: 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          name: file.name,
          type: file.type || 'application/octet-stream',
          category: category,
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          dataUrl: dataUrl,
          timestamp: Date.now(),
          note: ''
        };

        const thumbnail = await generateThumbnail(dataUrl, category);
        await AttachmentDB.put(item);
        currentAttachments = currentAttachments.filter(a => a.id !== item.id);
        currentAttachments.unshift(item);
        renderAttachments();
        updateAttachmentStats();
        broadcastAttachmentsChange();
        if (window.syncEngine && window.syncEngine.syncAttachment) {
          window.syncEngine.syncAttachment(item, thumbnail);
        }
        showToast(`Attached "${file.name}" (${item.sizeFormatted})`);
      };

      reader.onerror = () => {
        showToast(`Failed to read "${file.name}"`);
      };

      reader.readAsDataURL(file);
    });
  }

  function renderAttachments() {
    if (!attachmentsCardsGrid) return;
    attachmentsCardsGrid.innerHTML = '';

    // Filter and search
    let filtered = currentAttachments;
    if (activeFilter !== 'all') {
      filtered = filtered.filter(item => item.category === activeFilter);
    }
    if (currentSearchQuery) {
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(currentSearchQuery) || 
        (item.note && item.note.toLowerCase().includes(currentSearchQuery))
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

    updateFilterCounts();
  }

  function createAttachmentCard(item) {
    const card = document.createElement('div');
    card.className = 'link-card attachment-item-card';
    card.setAttribute('data-id', item.id);

    const formattedTime = formatTimestamp(item.timestamp);
    const fullDateTitle = item.timestamp ? new Date(item.timestamp).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'long' }) : '';

    let thumbHtml = '';
    if (item.category === 'image') {
      thumbHtml = `
        <div class="attachment-thumb-wrap" title="Click to preview full image">
          <img class="attachment-thumb-img" src="${item.dataUrl}" alt="${escapeHtml(item.name)}" loading="lazy" />
        </div>
      `;
    } else if (item.category === 'video') {
      thumbHtml = `
        <div class="attachment-thumb-wrap" title="Click to play video">
          <video class="attachment-thumb-video" src="${item.dataUrl}" preload="metadata"></video>
          <div class="attachment-thumb-play-icon">${ICONS.play}</div>
        </div>
      `;
    } else if (item.category === 'audio') {
      thumbHtml = `
        <div class="attachment-thumb-wrap" title="Click to play audio">
          <div class="attachment-thumb-doc-icon">${ICONS.audio}</div>
        </div>
      `;
    } else {
      thumbHtml = `
        <div class="attachment-thumb-wrap" title="Click to preview or download">
          <div class="attachment-thumb-doc-icon">${ICONS.file}</div>
        </div>
      `;
    }

    const badgeClass = item.category === 'image' ? 'badge-image' :
                       item.category === 'video' ? 'badge-video' :
                       item.category === 'audio' ? 'badge-audio' : 'badge-doc';

    card.innerHTML = `
      <div class="link-card-left">
        ${thumbHtml}
        <div class="link-details">
          <div class="link-badge-row">
            <span class="domain-badge ${badgeClass}">${escapeHtml(item.category.toUpperCase())}</span>
            <span class="attachment-size-text">${escapeHtml(item.sizeFormatted || '')}</span>
            <span class="link-time" ${fullDateTitle ? `title="${escapeHtml(fullDateTitle)}"` : ''}>${formattedTime}</span>
          </div>
          <span class="attachment-filename-text" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <input 
            type="text" 
            class="link-note-input" 
            placeholder="+ Add a note or caption..." 
            value="${escapeHtml(item.note || '')}" 
            spellcheck="false"
          />
        </div>
      </div>
      <div class="link-card-actions">
        <button type="button" class="btn-card-action open-btn btn-preview" title="Preview media">
          <span>Preview</span>
          ${ICONS.eye}
        </button>
        <button type="button" class="btn-card-action copy-btn btn-download" title="Download file">
          ${ICONS.download}
        </button>
        <button type="button" class="btn-card-action delete-btn btn-delete" title="Delete attachment permanently">
          ${ICONS.trash}
        </button>
      </div>
    `;

    // Preview click
    const previewTrigger = card.querySelector('.btn-preview');
    const thumbWrap = card.querySelector('.attachment-thumb-wrap');
    const filenameText = card.querySelector('.attachment-filename-text');
    if (previewTrigger) previewTrigger.addEventListener('click', () => openLightbox(item));
    if (thumbWrap) thumbWrap.addEventListener('click', () => openLightbox(item));
    if (filenameText) filenameText.addEventListener('click', () => openLightbox(item));

    // Download click
    const downloadBtn = card.querySelector('.btn-download');
    if (downloadBtn) downloadBtn.addEventListener('click', () => downloadAttachment(item));

    // Note change
    const noteInput = card.querySelector('.link-note-input');
    if (noteInput) {
      noteInput.addEventListener('change', async () => {
        item.note = noteInput.value.trim();
        await AttachmentDB.put(item);
        broadcastAttachmentsChange();
        if (window.syncEngine && window.syncEngine.syncAttachment) {
          window.syncEngine.syncAttachment(item);
        }
      });
    }

    // Delete click
    const deleteBtn = card.querySelector('.btn-delete');
    if (deleteBtn) deleteBtn.addEventListener('click', () => deleteAttachment(item.id));

    return card;
  }

  function openLightbox(item) {
    if (!mediaLightboxModal) return;
    lightboxFilename.textContent = item.name;
    const formattedTime = formatTimestamp(item.timestamp);
    lightboxFilemeta.textContent = `${item.category.toUpperCase()} • ${item.sizeFormatted} • ${formattedTime}`;
    lightboxDownloadBtn.href = item.dataUrl;
    lightboxDownloadBtn.download = item.name;

    lightboxContentWrap.innerHTML = '';
    if (item.category === 'image') {
      const img = document.createElement('img');
      img.src = item.dataUrl;
      img.alt = item.name;
      lightboxContentWrap.appendChild(img);
    } else if (item.category === 'video') {
      const video = document.createElement('video');
      video.src = item.dataUrl;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      lightboxContentWrap.appendChild(video);
    } else if (item.category === 'audio') {
      const audio = document.createElement('audio');
      audio.src = item.dataUrl;
      audio.controls = true;
      audio.autoplay = true;
      lightboxContentWrap.appendChild(audio);
    } else {
      lightboxContentWrap.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-main);">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${escapeHtml(item.name)}</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">${escapeHtml(item.sizeFormatted)} • ${escapeHtml(item.type)}</div>
          <a href="${item.dataUrl}" download="${escapeHtml(item.name)}" class="btn btn-primary" style="display: inline-flex;">Download File</a>
        </div>
      `;
    }

    mediaLightboxModal.classList.add('active');
  }

  function closeLightbox() {
    if (!mediaLightboxModal) return;
    mediaLightboxModal.classList.remove('active');
    lightboxContentWrap.innerHTML = '';
  }

  function downloadAttachment(item) {
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function deleteAttachment(id) {
    const idx = currentAttachments.findIndex(a => a.id === id);
    if (idx !== -1) {
      const removed = currentAttachments.splice(idx, 1)[0];
      deletedAttachmentHistory.push({ item: removed, index: idx });
      await AttachmentDB.delete(id);
      renderAttachments();
      updateAttachmentStats();
      broadcastAttachmentsChange();
      if (window.syncEngine && window.syncEngine.deleteAttachment) {
        window.syncEngine.deleteAttachment(id);
      }

      if (mediaLightboxModal && mediaLightboxModal.classList.contains('active') && lightboxFilename && lightboxFilename.textContent === removed.name) {
        closeLightbox();
      }

      showToastWithUndo(`Deleted "${removed.name}"`, async () => {
        const last = deletedAttachmentHistory.pop();
        if (last) {
          await AttachmentDB.put(last.item);
          currentAttachments.splice(last.index, 0, last.item);
          renderAttachments();
          updateAttachmentStats();
          broadcastAttachmentsChange();
          if (window.syncEngine && window.syncEngine.syncAttachment) {
            window.syncEngine.syncAttachment(last.item);
          }
        }
      });
    }
  }

  function updateAttachmentStats() {
    const count = currentAttachments.length;
    let totalBytes = 0;
    currentAttachments.forEach(a => totalBytes += (a.size || 0));

    if (attachmentCountBadge) attachmentCountBadge.textContent = count;
    if (attachmentsTitleCount) attachmentsTitleCount.textContent = `(${count})`;
    if (statAttachmentCount) statAttachmentCount.textContent = `${count} attachments`;
    if (storageUsageBadge) storageUsageBadge.textContent = `${formatBytes(totalBytes)} stored`;

    updateFilterCounts();
  }

  function updateFilterCounts() {
    const counts = { image: 0, video: 0, audio: 0, document: 0, all: currentAttachments.length };
    currentAttachments.forEach(item => {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    });

    if (countAll) countAll.textContent = counts.all;
    if (countImage) countImage.textContent = counts.image;
    if (countVideo) countVideo.textContent = counts.video;
    if (countAudio) countAudio.textContent = counts.audio;
    if (countDocument) countDocument.textContent = counts.document;
  }

  function handleDownloadAllAttachments() {
    if (currentAttachments.length === 0) {
      showToast('No attachments to download');
      return;
    }
    showToast(`Downloading ${currentAttachments.length} attachments...`);
    currentAttachments.forEach((item, index) => {
      setTimeout(() => {
        downloadAttachment(item);
      }, index * 250);
    });
  }

  async function handleClearAllAttachments() {
    if (currentAttachments.length === 0) {
      showToast('No attachments to delete');
      return;
    }
    const previous = [...currentAttachments];
    currentAttachments = [];
    await AttachmentDB.clear();
    renderAttachments();
    updateAttachmentStats();
    broadcastAttachmentsChange();
    if (window.syncEngine && window.syncEngine.clearAllAttachments) {
      window.syncEngine.clearAllAttachments();
    }

    showToastWithUndo(`Deleted ${previous.length} attachments`, async () => {
      for (const item of previous) {
        await AttachmentDB.put(item);
        if (window.syncEngine && window.syncEngine.syncAttachment) {
          window.syncEngine.syncAttachment(item);
        }
      }
      currentAttachments = previous;
      renderAttachments();
      updateAttachmentStats();
      broadcastAttachmentsChange();
    });
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
    if (isNaN(date.getTime())) return '';
    try {
      return date.toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short'
      });
    } catch (e) {
      return date.toLocaleString('en-US', { timeZone: 'America/Chicago' });
    }
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
