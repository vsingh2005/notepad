/**
 * Ringo's Notepad: Cloud-Persistent Real-Time Sync Engine
 * Retained State Architecture: Links & Notepad persist even when 0 users are online.
 * Universal sync across all browsers and devices (macOS, Windows, iOS, Android, Linux).
 */

class SyncEngine {
  constructor() {
    this.deviceInfo = this.detectDevice();
    this.client = null;
    this.broadcastChannel = null;
    
    // In-memory data store
    this.links = [];
    this.notes = '';
    this.lastUpdatedAt = 0;
    this.deletedHistory = [];
    
    // Active peers tracking
    this.peers = new Map(); // id -> { device, lastSeen }
    
    // Callbacks
    this.onLinksUpdate = null;
    this.onNotesUpdate = null;
    this.onPeersUpdate = null;
    this.onStatusUpdate = null;

    this.isConnected = false;
    this.currentBrokerIndex = 0;
    this.brokers = [
      'wss://broker.emqx.io:8084/mqtt',
      'wss://broker.hivemq.com:8884/mqtt'
    ];

    // Dedicated cloud-retained topics
    this.stateTopic = 'syncpad/v3/workspace/state';
    this.presenceTopic = 'syncpad/v3/workspace/presence';
    this.attachmentsTopic = 'syncpad/v3/workspace/attachments/manifest';
    this.reqTopic = 'syncpad/v3/workspace/attachments/req';
    this.chunkTopic = 'syncpad/v3/workspace/attachments/chunk';

    // Attachments cross-device sync state
    this.attachmentsManifest = [];
    this.incomingChunks = new Map(); // attachmentId -> { chunks, totalChunks, received, meta }
    this.onAttachmentsUpdate = null;
    this.onAttachmentDataReceived = null;
  }

  detectDevice() {
    const ua = navigator.userAgent || '';
    let os = 'Device';
    if (ua.includes('iPhone')) os = 'iPhone';
    else if (ua.includes('iPad')) os = 'iPad';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'Mac';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('CrOS')) os = 'Chromebook';
    else if (ua.includes('Linux')) os = 'Linux';
    else os = 'Browser';

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: 'dev_' + Math.random().toString(36).substring(2, 9),
      name: `${os} (${Math.floor(100 + Math.random() * 900)})`,
      os: os,
      color: randomColor
    };
  }

  getActivePeerCountText() {
    const activePeers = [this.deviceInfo, ...Array.from(this.peers.values()).map(p => p.device)];
    if (activePeers.length > 1) {
      const osList = Array.from(new Set(activePeers.map(p => p.os))).join(' & ');
      return `${activePeers.length} devices online (${osList})`;
    }
    return '1 device online';
  }

  init() {
    // Clean any lingering room hashes
    if (window.location.hash) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // 1. Immediately load local storage on startup
    this.loadFromLocalStorage();

    // 2. Setup BroadcastChannel for instant same-machine cross-tab sync
    try {
      this.broadcastChannel = new BroadcastChannel('syncpad-bc-global');
      this.broadcastChannel.onmessage = (e) => {
        if (e.data && e.data.type === 'STATE_UPDATE') {
          this.applyIncomingState(e.data.payload, false);
        } else if (e.data && e.data.type === 'PRESENCE_PING') {
          this.handlePresenceMessage(e.data);
        }
      };
    } catch (e) {
      console.warn('[SyncPad] BroadcastChannel unavailable:', e);
    }

    // 3. Connect to cloud broker for cross-device sync & permanent retention
    this.connectBroker();

    // 4. Presence Heartbeat
    setInterval(() => {
      this.sendPresencePing();
      this.cleanStalePeers();
    }, 3500);
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('syncpad_global_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.links)) this.links = parsed.links;
        if (typeof parsed.notes === 'string') this.notes = parsed.notes;
        if (parsed.lastUpdatedAt) this.lastUpdatedAt = parsed.lastUpdatedAt;
        
        if (this.onLinksUpdate) this.onLinksUpdate(this.links);
        if (this.onNotesUpdate) this.onNotesUpdate(this.notes);
      }

      const savedAtt = localStorage.getItem('syncpad_attachments_manifest');
      if (savedAtt) {
        const parsedAtt = JSON.parse(savedAtt);
        if (Array.isArray(parsedAtt)) {
          this.attachmentsManifest = parsedAtt;
        }
      }
    } catch (err) {
      console.warn('[SyncPad] Failed to read localStorage:', err);
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('syncpad_global_state', JSON.stringify({
        links: this.links,
        notes: this.notes,
        lastUpdatedAt: this.lastUpdatedAt
      }));
    } catch (err) {
      console.warn('[SyncPad] Failed to save to localStorage:', err);
    }
  }

  connectBroker() {
    if (!window.mqtt) {
      console.error('[SyncPad] MQTT library not available');
      return;
    }

    if (this.onStatusUpdate) {
      this.onStatusUpdate({ status: 'connecting' });
    }

    const brokerUrl = this.brokers[this.currentBrokerIndex % this.brokers.length];
    const clientId = `syncpad_${this.deviceInfo.id}_${Math.random().toString(16).substring(2, 8)}`;

    try {
      if (this.client) {
        try { this.client.end(true); } catch(e){}
      }

      this.client = window.mqtt.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
        keepalive: 30
      });

      this.client.on('connect', () => {
        console.log('[SyncPad] Connected to broker:', brokerUrl);
        this.isConnected = true;

        if (this.onStatusUpdate) {
          this.onStatusUpdate({ status: 'connected' });
        }

        // Subscribe to state, presence, and attachment topics
        const myId = this.deviceInfo.id;
        const subTopics = [
          this.stateTopic,
          this.presenceTopic,
          this.attachmentsTopic,
          `${this.reqTopic}/${myId}`,
          `${this.chunkTopic}/${myId}/+`
        ];

        this.client.subscribe(subTopics, { qos: 1 }, (err) => {
          if (!err) {
            // Broker will immediately deliver retained state and attachments if available
            this.sendPresencePing();
          }
        });
      });

      this.client.on('message', (topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          if (topic === this.stateTopic) {
            this.applyIncomingState(msg, true);
          } else if (topic === this.presenceTopic) {
            this.handlePresenceMessage(msg);
          } else if (topic === this.attachmentsTopic) {
            this.handleIncomingAttachmentsManifest(msg);
          } else if (topic.startsWith(`${this.reqTopic}/${this.deviceInfo.id}`)) {
            this.handleAttachmentDataRequest(msg);
          } else if (topic.startsWith(`${this.chunkTopic}/${this.deviceInfo.id}`)) {
            this.handleIncomingAttachmentChunk(msg);
          }
        } catch (e) {
          console.warn('[SyncPad] Message parse error:', e);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[SyncPad] Broker error, trying next broker:', err);
        this.tryNextBroker();
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        if (this.onStatusUpdate) {
          this.onStatusUpdate({ status: 'offline' });
        }
      });

      this.client.on('reconnect', () => {
        if (this.onStatusUpdate) {
          this.onStatusUpdate({ status: 'connecting' });
        }
      });
    } catch (err) {
      console.error('[SyncPad] Connect error:', err);
      this.tryNextBroker();
    }
  }

  tryNextBroker() {
    this.currentBrokerIndex++;
    setTimeout(() => {
      if (!this.isConnected) {
        this.connectBroker();
      }
    }, 1500);
  }

  // ==========================================
  // Cloud Retained State Synchronization
  // ==========================================

  /**
   * Broadcast state with retain: true
   * This guarantees that when all users disconnect (0 users online),
   * the cloud broker retains the state for whoever opens the site next.
   */
  publishCurrentState() {
    this.lastUpdatedAt = Date.now();
    this.saveToLocalStorage();

    const payload = {
      links: this.links,
      notes: this.notes,
      lastUpdatedAt: this.lastUpdatedAt,
      senderId: this.deviceInfo.id
    };

    // 1. Publish to cloud broker with RETAIN = TRUE
    if (this.client && this.isConnected) {
      this.client.publish(this.stateTopic, JSON.stringify(payload), { retain: true, qos: 1 });
    }

    // 2. Broadcast to other local browser tabs
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'STATE_UPDATE', payload: payload });
    }
  }

  applyIncomingState(incoming, isFromMqtt) {
    if (!incoming || incoming.senderId === this.deviceInfo.id) return;

    // Check if incoming state is newer or has distinct data
    if (incoming.lastUpdatedAt && incoming.lastUpdatedAt < this.lastUpdatedAt) {
      return;
    }

    let linksChanged = false;
    let notesChanged = false;

    if (Array.isArray(incoming.links)) {
      this.links = incoming.links;
      linksChanged = true;
    }

    if (typeof incoming.notes === 'string') {
      this.notes = incoming.notes;
      notesChanged = true;
    }

    this.lastUpdatedAt = incoming.lastUpdatedAt || Date.now();
    this.saveToLocalStorage();

    if (linksChanged && this.onLinksUpdate) {
      this.onLinksUpdate(this.links);
    }
    if (notesChanged && this.onNotesUpdate) {
      this.onNotesUpdate(this.notes);
    }
  }

  // ==========================================
  // Presence & Device Tracking
  // ==========================================

  sendPresencePing() {
    const payload = {
      device: this.deviceInfo,
      timestamp: Date.now()
    };

    if (this.client && this.isConnected) {
      this.client.publish(this.presenceTopic, JSON.stringify(payload), { qos: 0 });
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'PRESENCE_PING', ...payload });
    }
  }

  handlePresenceMessage(msg) {
    if (!msg.device || msg.device.id === this.deviceInfo.id) return;
    this.peers.set(msg.device.id, {
      device: msg.device,
      lastSeen: Date.now()
    });
    this.updatePeerStatus();
  }

  cleanStalePeers() {
    const now = Date.now();
    let changed = false;
    for (const [id, data] of this.peers.entries()) {
      if (now - data.lastSeen > 9000) {
        this.peers.delete(id);
        changed = true;
      }
    }
    if (changed) {
      this.updatePeerStatus();
    }
  }

  updatePeerStatus() {
    const activePeers = [this.deviceInfo, ...Array.from(this.peers.values()).map(p => p.device)];
    if (this.onPeersUpdate) {
      this.onPeersUpdate({
        count: activePeers.length,
        peers: activePeers,
        currentDevice: this.deviceInfo
      });
    }
  }

  // ==========================================
  // Link Operations (Anyone can add or delete)
  // ==========================================

  addLink(url, note = '') {
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    let domain = '';
    try {
      const parsed = new URL(cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch (e) {
      domain = cleanUrl.split('/')[0] || 'link';
    }

    const linkItem = {
      id: 'link_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      url: cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`,
      domain: domain,
      note: note.trim(),
      timestamp: Date.now(),
      opened: false,
      addedBy: this.deviceInfo.name
    };

    this.links.unshift(linkItem);
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);

    // Save and publish to cloud with retain: true
    this.publishCurrentState();

    return linkItem;
  }

  toggleLinkOpened(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (link) {
      link.opened = !link.opened;
      if (this.onLinksUpdate) this.onLinksUpdate(this.links);
      this.publishCurrentState();
    }
  }

  updateLinkNote(linkId, newNote) {
    const link = this.links.find(l => l.id === linkId);
    if (link) {
      link.note = newNote;
      if (this.onLinksUpdate) this.onLinksUpdate(this.links);
      this.publishCurrentState();
    }
  }

  removeLink(linkId) {
    const idx = this.links.findIndex(l => l.id === linkId);
    if (idx !== -1) {
      const removed = this.links.splice(idx, 1)[0];
      this.deletedHistory.push({ item: removed, index: idx });
      if (this.onLinksUpdate) this.onLinksUpdate(this.links);

      // Publish deletion to cloud with retain: true so it is removed for everyone
      this.publishCurrentState();

      return removed;
    }
    return null;
  }

  undoDelete() {
    if (this.deletedHistory.length === 0) return;
    const last = this.deletedHistory.pop();
    const pos = Math.min(last.index, this.links.length);
    this.links.splice(pos, 0, last.item);
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);

    this.publishCurrentState();
  }

  clearAllLinks() {
    this.links = [];
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);
    this.publishCurrentState();
  }

  setRawNotes(newText) {
    if (this.notes === newText) return;
    this.notes = newText;
    this.saveToLocalStorage();

    // Debounce network broadcast during active typing (200ms)
    clearTimeout(this.notesDebounceTimer);
    this.notesDebounceTimer = setTimeout(() => {
      this.publishCurrentState();
    }, 200);
  }

  flushNotesNow() {
    if (this.notesDebounceTimer) {
      clearTimeout(this.notesDebounceTimer);
      this.publishCurrentState();
    }
  }

  // ==========================================
  // Cross-Device Attachment Synchronization
  // ==========================================

  async handleIncomingAttachmentsManifest(msg) {
    if (!msg || !Array.isArray(msg.attachments)) return;
    
    this.attachmentsManifest = msg.attachments;
    try {
      localStorage.setItem('syncpad_attachments_manifest', JSON.stringify(msg.attachments));
    } catch (e) {}

    // Synchronize into local IndexedDB
    if (window.AttachmentDB) {
      for (const item of msg.attachments) {
        const existing = await window.AttachmentDB.get(item.id);
        if (!existing) {
          // New attachment arrived from another device!
          const localItem = {
            id: item.id,
            name: item.name,
            type: item.type,
            category: item.category,
            size: item.size,
            sizeFormatted: item.sizeFormatted,
            timestamp: item.timestamp,
            note: item.note || '',
            dataUrl: item.thumbnail || (item.isSmallFile ? item.dataUrl : ''),
            isThumbnailOnly: !item.isSmallFile && !item.hasFullData,
            sourceDeviceId: item.sourceDeviceId || msg.senderId
          };
          await window.AttachmentDB.put(localItem);

          // Request full data from source device if it was a large file
          if (!item.isSmallFile && localItem.sourceDeviceId && localItem.sourceDeviceId !== this.deviceInfo.id) {
            this.requestAttachmentFullData(item.id, localItem.sourceDeviceId);
          }
        }
      }
    }

    if (this.onAttachmentsUpdate) {
      this.onAttachmentsUpdate(this.attachmentsManifest);
    }
  }

  requestAttachmentFullData(attachmentId, targetPeerId) {
    if (!this.client || !this.isConnected || !targetPeerId) return;
    const reqPayload = {
      attachmentId: attachmentId,
      requesterId: this.deviceInfo.id,
      timestamp: Date.now()
    };
    this.client.publish(`${this.reqTopic}/${targetPeerId}`, JSON.stringify(reqPayload), { qos: 1 });
  }

  async handleAttachmentDataRequest(req) {
    if (!req || !req.attachmentId || !req.requesterId) return;
    if (!window.AttachmentDB) return;

    const item = await window.AttachmentDB.get(req.attachmentId);
    if (!item || !item.dataUrl) return;

    this.streamAttachmentChunks(item, req.requesterId);
  }

  streamAttachmentChunks(item, targetPeerId) {
    if (!this.client || !this.isConnected) return;
    const dataUrl = item.dataUrl;
    const chunkSize = 28672; // 28 KB chunks
    const totalChunks = Math.ceil(dataUrl.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = dataUrl.substring(i * chunkSize, (i + 1) * chunkSize);
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
        chunkData: chunkData
      };

      setTimeout(() => {
        if (this.client && this.isConnected) {
          this.client.publish(`${this.chunkTopic}/${targetPeerId}/${item.id}`, JSON.stringify(packet), { qos: 1 });
        }
      }, i * 40);
    }
  }

  async handleIncomingAttachmentChunk(packet) {
    if (!packet || !packet.attachmentId) return;
    const attId = packet.attachmentId;

    if (!this.incomingChunks.has(attId)) {
      this.incomingChunks.set(attId, {
        chunks: new Array(packet.totalChunks),
        totalChunks: packet.totalChunks,
        received: 0,
        meta: packet
      });
    }

    const state = this.incomingChunks.get(attId);
    if (!state.chunks[packet.chunkIndex]) {
      state.chunks[packet.chunkIndex] = packet.chunkData;
      state.received++;
    }

    if (state.received === state.totalChunks) {
      // Reassembly complete!
      const fullDataUrl = state.chunks.join('');
      this.incomingChunks.delete(attId);

      if (window.AttachmentDB) {
        const existing = await window.AttachmentDB.get(attId);
        const fullItem = {
          id: attId,
          name: packet.name,
          type: packet.type,
          category: packet.category,
          size: packet.size,
          sizeFormatted: packet.sizeFormatted,
          timestamp: packet.timestamp,
          note: packet.note || (existing ? existing.note : ''),
          dataUrl: fullDataUrl,
          isThumbnailOnly: false
        };
        await window.AttachmentDB.put(fullItem);

        if (this.onAttachmentDataReceived) {
          this.onAttachmentDataReceived(fullItem);
        }
      }
    }
  }

  syncAttachment(item, thumbnailDataUrl) {
    const isSmallFile = (item.size && item.size < 65536);
    const manifestEntry = {
      id: item.id,
      name: item.name,
      type: item.type,
      category: item.category,
      size: item.size,
      sizeFormatted: item.sizeFormatted,
      timestamp: item.timestamp,
      note: item.note || '',
      thumbnail: thumbnailDataUrl || (item.category === 'image' && isSmallFile ? item.dataUrl : ''),
      dataUrl: isSmallFile ? item.dataUrl : '',
      isSmallFile: isSmallFile,
      hasFullData: true,
      sourceDeviceId: this.deviceInfo.id
    };

    this.attachmentsManifest = this.attachmentsManifest.filter(a => a.id !== item.id);
    this.attachmentsManifest.unshift(manifestEntry);

    try {
      localStorage.setItem('syncpad_attachments_manifest', JSON.stringify(this.attachmentsManifest));
    } catch (e) {}

    // Publish to cloud broker with retain = true
    if (this.client && this.isConnected) {
      const payload = {
        attachments: this.attachmentsManifest,
        lastUpdatedAt: Date.now(),
        senderId: this.deviceInfo.id
      };
      this.client.publish(this.attachmentsTopic, JSON.stringify(payload), { retain: true, qos: 1 });
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'ATTACHMENTS_MANIFEST_UPDATE', attachments: this.attachmentsManifest });
    }
  }

  deleteAttachment(id) {
    this.attachmentsManifest = this.attachmentsManifest.filter(a => a.id !== id);
    try {
      localStorage.setItem('syncpad_attachments_manifest', JSON.stringify(this.attachmentsManifest));
    } catch (e) {}

    if (this.client && this.isConnected) {
      const payload = {
        attachments: this.attachmentsManifest,
        lastUpdatedAt: Date.now(),
        senderId: this.deviceInfo.id
      };
      this.client.publish(this.attachmentsTopic, JSON.stringify(payload), { retain: true, qos: 1 });
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'ATTACHMENTS_MANIFEST_UPDATE', attachments: this.attachmentsManifest });
    }
  }
}

// Global Singleton
window.syncEngine = new SyncEngine();
