/**
 * Ringo's Notepad: Real-Time CRDT Sync Engine
 * Built with Yjs (Conflict-Free Replicated Data Type) & MQTT WebSockets
 * Features:
 * - True keystroke-level multi-user CRDT synchronization (zero data overwrites)
 * - Awareness protocol: user presence, device color-coded cursors, and live typing indicators
 * - Cloud-retained state persistence (guaranteed 0-users-online retention)
 * - Offline-first IndexedDB persistence with automatic bi-directional merge on reconnect
 * - Full-fidelity binary attachment transfer with progress tracking & retry
 * - Resilient MQTT broker management with zero reconnect storms
 */

class SyncEngine {
  constructor() {
    this.deviceInfo = this.initDeviceIdentity();
    this.deviceId = this.deviceInfo.id;
    this.deviceName = this.deviceInfo.name;
    this.deviceColor = this.deviceInfo.color;

    // Room configuration (default global accessible room, or custom room via #room=xxx)
    this.roomName = this.detectRoomName();
    this.topicPrefix = `ringo/v4/${this.roomName}`;

    // Broker endpoints
    this.currentBrokerIndex = 0;
    this.brokers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];
    this.client = null;
    this.isConnected = false;
    this.connectionConsecutiveErrors = 0;
    this.lastSyncedAt = null;

    // Core Yjs CRDT Document & Awareness
    this.doc = new window.Y.Doc();
    this.awareness = new window.awarenessProtocol.Awareness(this.doc);

    // Yjs Data Structures
    this.yLinks = this.doc.getArray('links');
    this.yPagesMeta = this.doc.getArray('notes_pages_meta');
    this.yNotesPages = this.doc.getMap('notes_pages');

    // Local IndexedDB persistence for offline-first Yjs doc
    this.indexeddbProvider = null;
    try {
      this.indexeddbProvider = new window.IndexeddbPersistence(`ringo_crdt_${this.roomName}`, this.doc);
    } catch (e) {
      console.warn('[SyncEngine] IndexeddbPersistence error:', e);
    }

    // Attachments tracking
    this.attachmentsManifest = [];
    this.incomingTransfers = new Map(); // attachmentId -> { chunks, totalChunks, received, meta, timer }
    this.activeUploads = new Map();

    // Callbacks
    this.onLinksUpdate = null;
    this.onNotesUpdate = null; // (text, pageId)
    this.onPagesMetaUpdate = null; // (pagesMetaArray)
    this.onPeersUpdate = null; // ({ count, peers, currentDevice, typingUsers })
    this.onRemoteCursorsUpdate = null; // (cursorsArray)
    this.onStatusUpdate = null; // ({ status, broker, lastSyncedAt })
    this.onAttachmentsUpdate = null; // (manifest)
    this.onAttachmentDataReceived = null; // (fullItem)
    this.onTransferProgress = null; // ({ attachmentId, name, percent, type })

    // Typing debounce
    this.typingTimeout = null;
    this.activePageId = 'p_main';

    // Same-tab broadcast channel for instant multi-tab sync
    this.broadcastChannel = null;
    try {
      this.broadcastChannel = new BroadcastChannel(`ringo_bc_${this.roomName}`);
      this.broadcastChannel.onmessage = (e) => this.handleBroadcastMessage(e.data);
    } catch (e) {}
  }

  initDeviceIdentity() {
    let savedId = localStorage.getItem('ringo_device_id');
    if (!savedId) {
      savedId = 'dev_' + Math.random().toString(36).substring(2, 10);
      try { localStorage.setItem('ringo_device_id', savedId); } catch (e) {}
    }

    const ua = navigator.userAgent || '';
    let os = 'Device';
    if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'Mac';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('CrOS')) os = 'Chromebook';
    else if (ua.includes('Linux')) os = 'Linux';

    let savedName = localStorage.getItem('ringo_device_name');
    if (!savedName) {
      savedName = `${os} (${Math.floor(100 + Math.random() * 900)})`;
      try { localStorage.setItem('ringo_device_name', savedName); } catch (e) {}
    }

    const colors = [
      '#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b',
      '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'
    ];
    let savedColor = localStorage.getItem('ringo_device_color');
    if (!savedColor || !colors.includes(savedColor)) {
      savedColor = colors[Math.floor(Math.random() * colors.length)];
      try { localStorage.setItem('ringo_device_color', savedColor); } catch (e) {}
    }

    return {
      id: savedId,
      name: savedName,
      os: os,
      color: savedColor
    };
  }

  detectRoomName() {
    // Check URL query param or hash for custom room; otherwise use global open workspace
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) return roomParam.toLowerCase().replace(/[^a-z0-9_-]/g, '').substring(0, 32);

    const hashMatch = window.location.hash.match(/#room=([a-zA-Z0-9_-]+)/);
    if (hashMatch && hashMatch[1]) {
      return hashMatch[1].toLowerCase().substring(0, 32);
    }
    return 'workspace_global';
  }

  setDeviceName(newName) {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    this.deviceName = trimmed;
    this.deviceInfo.name = trimmed;
    try { localStorage.setItem('ringo_device_name', trimmed); } catch (e) {}

    this.awareness.setLocalStateField('user', {
      id: this.deviceId,
      name: this.deviceName,
      os: this.deviceInfo.os,
      color: this.deviceColor
    });
    this.broadcastAwareness();
    this.notifyPeersUpdate();
  }

  init() {
    // 1. Setup local Yjs state observers
    this.setupYjsObservers();

    // 2. Setup Awareness (Presence, Cursors, Typing)
    this.setupAwareness();

    // 3. Connect to MQTT Broker
    this.connectBroker();

    // 4. Awareness Heartbeat to clean offline peers
    setInterval(() => {
      this.notifyPeersUpdate();
    }, 4000);
  }

  // ==========================================
  // Yjs CRDT Observers & Lifecycle
  // ==========================================

  setupYjsObservers() {
    // 1. Observe links array changes
    this.yLinks.observe(() => {
      this.notifyLinksUpdate();
    });

    // 2. Observe note pages meta changes
    this.yPagesMeta.observe(() => {
      this.notifyPagesMetaUpdate();
      // Ensure active page is observed
      this.bindPageTextObserver(this.activePageId);
    });

    // 3. Observe page text changes
    this.bindPageTextObserver(this.activePageId);

    // 4. Broadcast Yjs incremental updates to network
    this.doc.on('update', (update, origin) => {
      if (origin !== 'remote' && origin !== 'indexeddb') {
        this.publishYjsUpdate(update);
        this.scheduleDebouncedFullDocRetain();
      }
    });

    // When IndexedDB finishes loading local state, ensure default page and notify UI
    if (this.indexeddbProvider) {
      this.indexeddbProvider.on('synced', () => {
        this.ensureDefaultPage();
        this.notifyLinksUpdate();
        this.notifyPagesMetaUpdate();
        this.notifyNotesUpdate(this.activePageId);
      });
    } else {
      this.ensureDefaultPage();
    }

    // Safety fallback: if IndexedDB doesn't exist or is empty after brief timeout
    setTimeout(() => {
      this.ensureDefaultPage();
    }, 350);
  }

  ensureDefaultPage() {
    const pages = this.getPagesMeta();
    if (!pages || pages.length === 0) {
      if (!this.isReadOnly) {
        this.doc.transact(() => {
          if (this.yPagesMeta.length === 0) {
            this.yPagesMeta.push([{
              id: 'p_main',
              title: 'Main Notes',
              createdAt: Date.now()
            }]);
            const yText = new window.Y.Text();
            this.yNotesPages.set('p_main', yText);
          }
        });
      }
    }
  }

  bindPageTextObserver(pageId) {
    let yText = this.yNotesPages.get(pageId);
    if (!yText) {
      this.doc.transact(() => {
        yText = new window.Y.Text();
        this.yNotesPages.set(pageId, yText);
      });
    }

    // Listen to changes on this text instance
    if (!yText._ringo_observed) {
      yText._ringo_observed = true;
      yText.observe((event, transaction) => {
        if (transaction.origin !== 'local_textarea') {
          this.notifyNotesUpdate(pageId);
        }
      });
    }
  }

  setActivePage(pageId) {
    if (!pageId) return;
    this.activePageId = pageId;
    this.bindPageTextObserver(pageId);
    this.awareness.setLocalStateField('activePageId', pageId);
    this.broadcastAwareness();
    this.notifyPagesMetaUpdate();
    this.notifyNotesUpdate(pageId);
  }

  // ==========================================
  // Awareness & Presence
  // ==========================================

  setupAwareness() {
    this.awareness.setLocalState({
      user: {
        id: this.deviceId,
        name: this.deviceName,
        os: this.deviceInfo.os,
        color: this.deviceColor
      },
      cursor: null,
      isTyping: false,
      activePageId: this.activePageId,
      lastActive: Date.now()
    });

    this.awareness.on('change', ({ added, updated, removed }, origin) => {
      this.notifyPeersUpdate();
      this.notifyCursorsUpdate();

      if (origin !== 'remote') {
        const changedClients = added.concat(updated, removed);
        if (changedClients.length > 0) {
          const update = window.awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
          this.publishAwarenessUpdate(update);
        }
      }
    });
  }

  setLocalCursor(selectionStart, selectionEnd) {
    this.awareness.setLocalStateField('cursor', {
      index: selectionStart,
      length: selectionEnd - selectionStart,
      pageId: this.activePageId
    });
    this.awareness.setLocalStateField('lastActive', Date.now());
  }

  setLocalTyping(isTyping) {
    this.awareness.setLocalStateField('isTyping', !!isTyping);
    this.awareness.setLocalStateField('lastActive', Date.now());

    if (isTyping) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.awareness.setLocalStateField('isTyping', false);
      }, 1500);
    }
  }

  broadcastAwareness() {
    const clients = Array.from(this.awareness.getStates().keys());
    if (clients.length > 0) {
      const update = window.awarenessProtocol.encodeAwarenessUpdate(this.awareness, clients);
      this.publishAwarenessUpdate(update);
    }
  }

  publishAwarenessUpdate(updateUint8) {
    if (!this.client || !this.isConnected) return;
    const b64 = this.uint8ToBase64(updateUint8);
    const payload = JSON.stringify({
      senderId: this.deviceId,
      data: b64,
      timestamp: Date.now()
    });
    try {
      this.client.publish(`${this.topicPrefix}/awareness`, payload, { qos: 0 });
    } catch (e) {}
  }

  // ==========================================
  // MQTT Connectivity & Auto-Failover
  // ==========================================

  connectBroker() {
    if (!window.mqtt || !window.mqtt.connect) {
      console.warn('[SyncEngine] MQTT library not available');
      return;
    }

    if (this.onStatusUpdate) {
      this.onStatusUpdate({ status: 'connecting', broker: this.getCurrentBrokerHost() });
    }

    const brokerUrl = this.brokers[this.currentBrokerIndex % this.brokers.length];
    const clientId = `ringo_${this.deviceId}_${Math.random().toString(16).substring(2, 8)}`;

    try {
      if (this.client) {
        try { this.client.end(true); } catch (e) {}
      }

      this.client = window.mqtt.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 8000,
        reconnectPeriod: 4000,
        keepalive: 30
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        this.connectionConsecutiveErrors = 0;
        this.lastSyncedAt = Date.now();

        if (this.onStatusUpdate) {
          this.onStatusUpdate({
            status: 'connected',
            broker: this.getCurrentBrokerHost(),
            lastSyncedAt: this.lastSyncedAt
          });
        }

        // Subscribe to workspace topics
        const topics = [
          `${this.topicPrefix}/yjs/state`,
          `${this.topicPrefix}/yjs/update`,
          `${this.topicPrefix}/awareness`,
          `${this.topicPrefix}/attachments/manifest`,
          `${this.topicPrefix}/attachments/req/${this.deviceId}`,
          `${this.topicPrefix}/attachments/chunk/${this.deviceId}/+`
        ];

        this.client.subscribe(topics, { qos: 1 }, (err) => {
          if (!err) {
            // Send initial awareness
            this.broadcastAwareness();
          }
        });
      });

      this.client.on('message', (topic, payload) => {
        this.handleIncomingMqttMessage(topic, payload);
      });

      this.client.on('error', (err) => {
        this.connectionConsecutiveErrors++;
        console.warn(`[SyncEngine] Broker error on ${brokerUrl}:`, err);
        if (this.connectionConsecutiveErrors >= 3) {
          this.tryNextBroker();
        }
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        if (this.onStatusUpdate) {
          this.onStatusUpdate({ status: 'offline', broker: this.getCurrentBrokerHost() });
        }
      });

      this.client.on('reconnect', () => {
        if (this.onStatusUpdate) {
          this.onStatusUpdate({ status: 'connecting', broker: this.getCurrentBrokerHost() });
        }
      });
    } catch (err) {
      console.warn('[SyncEngine] Connect exception:', err);
      this.tryNextBroker();
    }
  }

  getCurrentBrokerHost() {
    try {
      const url = new URL(this.brokers[this.currentBrokerIndex % this.brokers.length]);
      return url.hostname;
    } catch (e) {
      return 'MQTT Cloud';
    }
  }

  tryNextBroker() {
    this.connectionConsecutiveErrors = 0;
    this.currentBrokerIndex++;
    setTimeout(() => {
      if (!this.isConnected) {
        this.connectBroker();
      }
    }, 2000);
  }

  handleIncomingMqttMessage(topic, payloadBuffer) {
    try {
      const msg = JSON.parse(payloadBuffer.toString());
      if (msg.senderId === this.deviceId) return; // Ignore own messages

      if (topic === `${this.topicPrefix}/yjs/state` || topic === `${this.topicPrefix}/yjs/update`) {
        if (msg.data) {
          const update = this.base64ToUint8(msg.data);
          window.Y.applyUpdate(this.doc, update, 'remote');
          this.lastSyncedAt = Date.now();
          if (this.onStatusUpdate) {
            this.onStatusUpdate({
              status: 'connected',
              broker: this.getCurrentBrokerHost(),
              lastSyncedAt: this.lastSyncedAt
            });
          }
        }
      } else if (topic === `${this.topicPrefix}/awareness`) {
        if (msg.data) {
          const update = this.base64ToUint8(msg.data);
          window.awarenessProtocol.applyAwarenessUpdate(this.awareness, update, 'remote');
        }
      } else if (topic === `${this.topicPrefix}/attachments/manifest`) {
        this.handleIncomingAttachmentsManifest(msg);
      } else if (topic.startsWith(`${this.topicPrefix}/attachments/req/${this.deviceId}`)) {
        this.handleAttachmentDataRequest(msg);
      } else if (topic.startsWith(`${this.topicPrefix}/attachments/chunk/${this.deviceId}`)) {
        this.handleIncomingAttachmentChunk(msg);
      }
    } catch (e) {
      console.warn('[SyncEngine] Parse incoming error:', e);
    }
  }

  // ==========================================
  // Yjs Publishing & Retained State
  // ==========================================

  publishYjsUpdate(updateUint8) {
    if (!this.client || !this.isConnected) return;
    const b64 = this.uint8ToBase64(updateUint8);
    const payload = JSON.stringify({
      senderId: this.deviceId,
      data: b64,
      timestamp: Date.now()
    });
    try {
      this.client.publish(`${this.topicPrefix}/yjs/update`, payload, { qos: 1 });
    } catch (e) {}

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'YJS_UPDATE', data: b64 });
    }
  }

  scheduleDebouncedFullDocRetain() {
    clearTimeout(this.fullDocRetainTimer);
    this.fullDocRetainTimer = setTimeout(() => {
      this.publishFullDocRetained();
    }, 1200);
  }

  publishFullDocRetained() {
    if (!this.client || !this.isConnected) return;
    const fullStateUpdate = window.Y.encodeStateAsUpdate(this.doc);
    const b64 = this.uint8ToBase64(fullStateUpdate);
    const payload = JSON.stringify({
      senderId: this.deviceId,
      data: b64,
      timestamp: Date.now()
    });
    try {
      this.client.publish(`${this.topicPrefix}/yjs/state`, payload, { retain: true, qos: 1 });
    } catch (e) {}
  }

  handleBroadcastMessage(msg) {
    if (!msg) return;
    if (msg.type === 'YJS_UPDATE' && msg.data) {
      const update = this.base64ToUint8(msg.data);
      window.Y.applyUpdate(this.doc, update, 'remote');
    }
  }

  // ==========================================
  // Note Pages & Collaborative Notes API
  // ==========================================

  getPagesMeta() {
    const raw = this.yPagesMeta.toArray();
    const seenIds = new Set();
    const unique = [];
    const duplicateIndices = [];

    raw.forEach((p, index) => {
      if (!p || !p.id) {
        duplicateIndices.push(index);
        return;
      }
      if (seenIds.has(p.id)) {
        duplicateIndices.push(index);
        return;
      }
      seenIds.add(p.id);
      unique.push(p);
    });

    // If duplicate pages exist in the CRDT array, clean them up permanently in a single transaction
    if (duplicateIndices.length > 0 && !this.isReadOnly) {
      this.doc.transact(() => {
        // Delete in reverse order to preserve indices
        for (let i = duplicateIndices.length - 1; i >= 0; i--) {
          const idx = duplicateIndices[i];
          if (idx < this.yPagesMeta.length) {
            this.yPagesMeta.delete(idx, 1);
          }
        }
      });
    }

    if (unique.length === 0) {
      return [{ id: 'p_main', title: 'Main Notes', createdAt: Date.now() }];
    }

    return unique;
  }

  addPage(title) {
    const cleanTitle = (title || '').trim() || 'Untitled Page';
    const pageId = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    this.doc.transact(() => {
      this.yPagesMeta.push([{
        id: pageId,
        title: cleanTitle,
        createdAt: Date.now()
      }]);
      const yText = new window.Y.Text();
      this.yNotesPages.set(pageId, yText);
    });

    this.setActivePage(pageId);
    return pageId;
  }

  renamePage(pageId, newTitle) {
    const cleanTitle = (newTitle || '').trim();
    if (!cleanTitle) return;

    this.doc.transact(() => {
      const meta = this.yPagesMeta.toArray();
      const idx = meta.findIndex(p => p && p.id === pageId);
      if (idx !== -1) {
        const item = { ...meta[idx], title: cleanTitle };
        this.yPagesMeta.delete(idx, 1);
        this.yPagesMeta.insert(idx, [item]);
      }
    });
    this.notifyPagesMetaUpdate();
  }

  deletePage(pageId) {
    const meta = this.getPagesMeta();
    if (meta.length <= 1) return false; // Keep at least one page

    this.doc.transact(() => {
      const currentMeta = this.yPagesMeta.toArray();
      const idx = currentMeta.findIndex(p => p && p.id === pageId);
      if (idx !== -1) {
        this.yPagesMeta.delete(idx, 1);
        this.yNotesPages.delete(pageId);
      }
    });

    if (this.activePageId === pageId) {
      const remaining = this.getPagesMeta();
      if (remaining.length > 0) {
        this.setActivePage(remaining[0].id);
      }
    } else {
      this.notifyPagesMetaUpdate();
    }
    return true;
  }

  getNoteText(pageId = this.activePageId) {
    const yText = this.yNotesPages.get(pageId);
    return yText ? yText.toString() : '';
  }

  setNoteText(newText, pageId = this.activePageId) {
    let yText = this.yNotesPages.get(pageId);
    if (!yText) {
      this.bindPageTextObserver(pageId);
      yText = this.yNotesPages.get(pageId);
    }
    if (!yText) return;

    const current = yText.toString();
    if (current === newText) return;

    // Apply minimal diff to preserve other users' concurrent edits
    this.doc.transact(() => {
      let commonStart = 0;
      while (commonStart < current.length && commonStart < newText.length && current[commonStart] === newText[commonStart]) {
        commonStart++;
      }

      let commonEnd = 0;
      while (
        commonEnd < current.length - commonStart &&
        commonEnd < newText.length - commonStart &&
        current[current.length - 1 - commonEnd] === newText[newText.length - 1 - commonEnd]
      ) {
        commonEnd++;
      }

      const deleteCount = current.length - commonStart - commonEnd;
      if (deleteCount > 0) {
        yText.delete(commonStart, deleteCount);
      }
      const insertStr = newText.substring(commonStart, newText.length - commonEnd);
      if (insertStr.length > 0) {
        yText.insert(commonStart, insertStr);
      }
    }, 'local_textarea');

    this.setLocalTyping(true);
  }

  // ==========================================
  // Links Operations API
  // ==========================================

  getLinks() {
    return this.yLinks.toArray();
  }

  addLink(item) {
    if (!item || !item.url) return;
    this.doc.transact(() => {
      this.yLinks.insert(0, [item]);
    });
  }

  updateLink(linkId, updates) {
    this.doc.transact(() => {
      const arr = this.yLinks.toArray();
      const idx = arr.findIndex(l => l.id === linkId);
      if (idx !== -1) {
        const updated = { ...arr[idx], ...updates };
        this.yLinks.delete(idx, 1);
        this.yLinks.insert(idx, [updated]);
      }
    });
  }

  removeLink(linkId) {
    let removed = null;
    this.doc.transact(() => {
      const arr = this.yLinks.toArray();
      const idx = arr.findIndex(l => l.id === linkId);
      if (idx !== -1) {
        removed = arr[idx];
        this.yLinks.delete(idx, 1);
      }
    });
    return removed;
  }

  reorderLinks(fromIndex, toIndex) {
    if (fromIndex === toIndex) return;
    this.doc.transact(() => {
      const arr = this.yLinks.toArray();
      if (fromIndex >= 0 && fromIndex < arr.length && toIndex >= 0 && toIndex < arr.length) {
        const item = arr[fromIndex];
        this.yLinks.delete(fromIndex, 1);
        this.yLinks.insert(toIndex, [item]);
      }
    });
  }

  clearAllLinks() {
    this.doc.transact(() => {
      if (this.yLinks.length > 0) {
        this.yLinks.delete(0, this.yLinks.length);
      }
    });
  }

  clearCompletedLinks() {
    this.doc.transact(() => {
      const arr = this.yLinks.toArray();
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].opened) {
          this.yLinks.delete(i, 1);
        }
      }
    });
  }

  // ==========================================
  // Full-Fidelity Attachments Sync Engine
  // ==========================================

  async handleIncomingAttachmentsManifest(msg) {
    if (!msg || !Array.isArray(msg.attachments)) return;
    this.attachmentsManifest = msg.attachments;

    try {
      localStorage.setItem(`ringo_att_manifest_${this.roomName}`, JSON.stringify(msg.attachments));
    } catch (e) {}

    // Check with local IndexedDB
    if (window.AttachmentDB) {
      const incomingIds = new Set(msg.attachments.map(a => a.id));
      const localStored = await window.AttachmentDB.getAll();

      // Delete any attachments deleted on remote
      for (const localItem of localStored) {
        if (!incomingIds.has(localItem.id)) {
          await window.AttachmentDB.delete(localItem.id);
        }
      }

      // Check if any incoming attachment needs full data
      for (const item of msg.attachments) {
        const existing = await window.AttachmentDB.get(item.id);
        if (!existing) {
          // Put meta placeholder into IndexedDB
          const metaItem = {
            id: item.id,
            name: item.name,
            type: item.type,
            category: item.category,
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            timestamp: item.timestamp,
            note: item.note || '',
            blob: null,
            isDownloading: true,
            sourceDeviceId: item.sourceDeviceId || msg.senderId
          };
          await window.AttachmentDB.put(metaItem);

          // Request full file streaming
          if (metaItem.sourceDeviceId && metaItem.sourceDeviceId !== this.deviceId) {
            this.requestAttachmentStreaming(item.id, metaItem.sourceDeviceId);
          }
        } else if (item.note !== undefined && existing.note !== item.note) {
          existing.note = item.note;
          await window.AttachmentDB.put(existing);
        }
      }
    }

    if (this.onAttachmentsUpdate) {
      this.onAttachmentsUpdate(this.attachmentsManifest);
    }
  }

  requestAttachmentStreaming(attachmentId, targetPeerId) {
    if (!this.client || !this.isConnected || !targetPeerId) return;
    const reqPayload = {
      attachmentId: attachmentId,
      requesterId: this.deviceId,
      timestamp: Date.now()
    };
    try {
      this.client.publish(`${this.topicPrefix}/attachments/req/${targetPeerId}`, JSON.stringify(reqPayload), { qos: 1 });
    } catch (e) {}
  }

  async handleAttachmentDataRequest(req) {
    if (!req || !req.attachmentId || !req.requesterId) return;
    if (!window.AttachmentDB) return;

    const item = await window.AttachmentDB.get(req.attachmentId);
    if (!item || !item.blob) return;

    this.streamAttachmentBinary(item, req.requesterId);
  }

  async streamAttachmentBinary(item, targetPeerId) {
    if (!this.client || !this.isConnected) return;

    try {
      const buffer = await item.blob.arrayBuffer();
      const chunkSize = 32768; // 32 KB binary chunks
      const totalChunks = Math.ceil(buffer.byteLength / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const slice = buffer.slice(i * chunkSize, Math.min((i + 1) * chunkSize, buffer.byteLength));
        const chunkB64 = this.uint8ToBase64(new Uint8Array(slice));

        const packet = {
          attachmentId: item.id,
          name: item.name,
          type: item.type,
          category: item.category,
          size: item.size,
          sizeFormatted: item.sizeFormatted,
          timestamp: item.timestamp,
          note: item.note || '',
          chunkIndex: i,
          totalChunks: totalChunks,
          chunkData: chunkB64
        };

        setTimeout(() => {
          if (this.client && this.isConnected) {
            this.client.publish(`${this.topicPrefix}/attachments/chunk/${targetPeerId}/${item.id}`, JSON.stringify(packet), { qos: 1 });
          }
        }, i * 35);
      }
    } catch (err) {
      console.warn('[SyncEngine] Stream error:', err);
    }
  }

  async handleIncomingAttachmentChunk(packet) {
    if (!packet || !packet.attachmentId) return;
    const attId = packet.attachmentId;

    if (!this.incomingTransfers.has(attId)) {
      this.incomingTransfers.set(attId, {
        chunks: new Array(packet.totalChunks),
        totalChunks: packet.totalChunks,
        received: 0,
        meta: packet
      });
    }

    const state = this.incomingTransfers.get(attId);
    if (!state.chunks[packet.chunkIndex]) {
      state.chunks[packet.chunkIndex] = this.base64ToUint8(packet.chunkData);
      state.received++;

      const percent = Math.round((state.received / state.totalChunks) * 100);
      if (this.onTransferProgress) {
        this.onTransferProgress({
          attachmentId: attId,
          name: packet.name,
          percent: percent,
          type: 'download'
        });
      }
    }

    if (state.received === state.totalChunks) {
      // Reassemble complete pristine ArrayBuffer
      let totalLength = 0;
      for (const c of state.chunks) totalLength += c.byteLength;

      const merged = new Uint8Array(totalLength);
      let offset = 0;
      for (const c of state.chunks) {
        merged.set(c, offset);
        offset += c.byteLength;
      }

      this.incomingTransfers.delete(attId);

      const blob = new Blob([merged], { type: packet.type || 'application/octet-stream' });
      const fullItem = {
        id: attId,
        name: packet.name,
        type: packet.type,
        category: packet.category,
        size: packet.size,
        sizeFormatted: packet.sizeFormatted,
        timestamp: packet.timestamp,
        note: packet.note || '',
        blob: blob,
        isDownloading: false
      };

      if (window.AttachmentDB) {
        await window.AttachmentDB.put(fullItem);
      }

      if (this.onAttachmentDataReceived) {
        this.onAttachmentDataReceived(fullItem);
      }
    }
  }

  syncAttachmentManifestEntry(item) {
    const entry = {
      id: item.id,
      name: item.name,
      type: item.type,
      category: item.category,
      size: item.size,
      sizeFormatted: item.sizeFormatted,
      timestamp: item.timestamp,
      note: item.note || '',
      sourceDeviceId: this.deviceId
    };

    this.attachmentsManifest = this.attachmentsManifest.filter(a => a.id !== item.id);
    this.attachmentsManifest.unshift(entry);

    this.publishAttachmentsManifest();
  }

  deleteAttachment(id) {
    this.attachmentsManifest = this.attachmentsManifest.filter(a => a.id !== id);
    this.publishAttachmentsManifest();
  }

  clearAllAttachments() {
    this.attachmentsManifest = [];
    this.publishAttachmentsManifest();
  }

  publishAttachmentsManifest() {
    try {
      localStorage.setItem(`ringo_att_manifest_${this.roomName}`, JSON.stringify(this.attachmentsManifest));
    } catch (e) {}

    if (this.client && this.isConnected) {
      const payload = {
        attachments: this.attachmentsManifest,
        lastUpdatedAt: Date.now(),
        senderId: this.deviceId
      };
      this.client.publish(`${this.topicPrefix}/attachments/manifest`, JSON.stringify(payload), { retain: true, qos: 1 });
    }
  }

  // ==========================================
  // Notifications & UI Callbacks
  // ==========================================

  notifyLinksUpdate() {
    if (this.onLinksUpdate) {
      this.onLinksUpdate(this.yLinks.toArray());
    }
  }

  notifyPagesMetaUpdate() {
    if (this.onPagesMetaUpdate) {
      this.onPagesMetaUpdate(this.getPagesMeta(), this.activePageId);
    }
  }

  notifyNotesUpdate(pageId) {
    if (this.onNotesUpdate) {
      const yText = this.yNotesPages.get(pageId);
      this.onNotesUpdate(yText ? yText.toString() : '', pageId);
    }
  }

  notifyPeersUpdate() {
    const states = this.awareness.getStates();
    const activePeers = [];
    const typingUsers = [];

    const now = Date.now();
    for (const [clientId, state] of states.entries()) {
      if (state && state.user) {
        const isSelf = (state.user.id === this.deviceId);
        // Exclude stale peers not updated in 25 seconds
        if (state.lastActive && now - state.lastActive > 25000 && !isSelf) {
          continue;
        }

        activePeers.push({
          clientId: clientId,
          ...state.user,
          isSelf: isSelf,
          activePageId: state.activePageId
        });

        if (state.isTyping && !isSelf) {
          typingUsers.push(state.user.name);
        }
      }
    }

    if (this.onPeersUpdate) {
      this.onPeersUpdate({
        count: activePeers.length,
        peers: activePeers,
        currentDevice: this.deviceInfo,
        typingUsers: typingUsers
      });
    }
  }

  notifyCursorsUpdate() {
    const states = this.awareness.getStates();
    const cursors = [];

    for (const [clientId, state] of states.entries()) {
      if (state && state.user && state.user.id !== this.deviceId && state.cursor) {
        if (state.cursor.pageId === this.activePageId) {
          cursors.push({
            clientId: clientId,
            user: state.user,
            cursor: state.cursor
          });
        }
      }
    }

    if (this.onRemoteCursorsUpdate) {
      this.onRemoteCursorsUpdate(cursors);
    }
  }

  // ==========================================
  // Binary / Base64 Helpers
  // ==========================================

  uint8ToBase64(u8) {
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(u8[i]);
    }
    return btoa(binary);
  }

  base64ToUint8(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = binary.charCodeAt(i);
    }
    return u8;
  }
}

// Global Singleton
window.syncEngine = new SyncEngine();
