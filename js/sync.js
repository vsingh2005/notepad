/**
 * SyncPad - Ultra-Reliable Real-Time Collaborative Engine
 * Unified Single Workspace Room at all times across all devices (macOS & Windows)
 */

class SyncEngine {
  constructor() {
    // Single unified room at all times
    this.roomName = 'syncpad-main-workspace';
    this.deviceInfo = this.detectDevice();
    this.client = null;
    this.broadcastChannel = null;
    
    // In-memory data store
    this.links = [];
    this.notes = '';
    this.deletedHistory = [];
    
    // Connected peers tracking
    this.peers = new Map(); // id -> { device, lastSeen }
    
    // Callbacks
    this.onLinksUpdate = null;
    this.onNotesUpdate = null;
    this.onPeersUpdate = null;
    this.onStatusUpdate = null;

    this.isConnected = false;
  }

  detectDevice() {
    const ua = navigator.userAgent || '';
    let os = 'Device';
    if (ua.includes('Macintosh') || ua.includes('Mac OS')) os = 'macOS';
    else if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    return {
      id: 'dev_' + Math.random().toString(36).substring(2, 9),
      name: `${os} (${Math.floor(100 + Math.random() * 900)})`,
      os: os,
      color: randomColor
    };
  }

  /**
   * Initialize Storage, BroadcastChannel, and WebSocket MQTT Sync
   */
  init() {
    // Clean any lingering room hashes from URL
    if (window.location.hash) {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    }

    // 1. Load permanent local storage
    this.loadFromLocalStorage();

    // 2. Setup BroadcastChannel for instant same-computer cross-tab sync
    try {
      this.broadcastChannel = new BroadcastChannel(`syncpad-bc-${this.roomName}`);
      this.broadcastChannel.onmessage = (e) => {
        this.handleIncomingMessage(e.data, false);
      };
    } catch (e) {
      console.warn('[SyncPad] BroadcastChannel unavailable:', e);
    }

    // 3. Connect to High-Availability Public MQTT over WebSockets
    this.connectMqtt();

    // 4. Start Peer Presence Heartbeat
    setInterval(() => {
      this.sendPresencePing();
      this.cleanStalePeers();
    }, 3500);
  }

  loadFromLocalStorage() {
    try {
      const savedLinks = localStorage.getItem(`syncpad_links_${this.roomName}`);
      if (savedLinks) {
        this.links = JSON.parse(savedLinks);
        if (this.onLinksUpdate) this.onLinksUpdate(this.links);
      }
      const savedNotes = localStorage.getItem(`syncpad_notes_${this.roomName}`);
      if (savedNotes) {
        this.notes = savedNotes;
        if (this.onNotesUpdate) this.onNotesUpdate(this.notes);
      }
    } catch (err) {
      console.warn('[SyncPad] Failed to load local storage:', err);
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem(`syncpad_links_${this.roomName}`, JSON.stringify(this.links));
      localStorage.setItem(`syncpad_notes_${this.roomName}`, this.notes);
    } catch (err) {
      console.warn('[SyncPad] Failed to save to local storage:', err);
    }
  }

  connectMqtt() {
    if (!window.mqtt) {
      console.error('[SyncPad] MQTT library not available');
      return;
    }

    if (this.onStatusUpdate) {
      this.onStatusUpdate({ status: 'connecting' });
    }

    // Primary broker (EMQX public WebSocket broker, 99.99% uptime)
    const brokerUrl = 'wss://broker.emqx.io:8084/mqtt';
    const clientId = `syncpad_${this.deviceInfo.id}_${Math.random().toString(16).substring(2, 8)}`;

    try {
      this.client = window.mqtt.connect(brokerUrl, {
        clientId: clientId,
        clean: true,
        connectTimeout: 7000,
        reconnectPeriod: 3000,
        keepalive: 30
      });

      const dataTopic = `syncpad/v2/room/${this.roomName}/data`;
      const presenceTopic = `syncpad/v2/room/${this.roomName}/presence`;

      this.client.on('connect', () => {
        console.log('[SyncPad] Connected to unified real-time room!');
        this.isConnected = true;

        if (this.onStatusUpdate) {
          this.onStatusUpdate({ status: 'connected' });
        }

        this.client.subscribe([dataTopic, presenceTopic], (err) => {
          if (!err) {
            this.sendPresencePing();
            this.broadcastMessage({
              type: 'REQUEST_SYNC',
              senderId: this.deviceInfo.id
            });
          }
        });
      });

      this.client.on('message', (topic, payload) => {
        try {
          const msg = JSON.parse(payload.toString());
          if (topic === presenceTopic) {
            this.handlePresenceMessage(msg);
          } else if (topic === dataTopic) {
            this.handleIncomingMessage(msg, true);
          }
        } catch (e) {
          console.warn('[SyncPad] Malformed message:', e);
        }
      });

      this.client.on('error', (err) => {
        console.warn('[SyncPad] MQTT error:', err);
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
      this.client.publish(`syncpad/v2/room/${this.roomName}/presence`, JSON.stringify(payload), { qos: 0 });
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
  // Message Handling & Replication
  // ==========================================

  broadcastMessage(message) {
    message.senderId = this.deviceInfo.id;
    message.timestamp = Date.now();

    if (this.client && this.isConnected) {
      this.client.publish(`syncpad/v2/room/${this.roomName}/data`, JSON.stringify(message), { qos: 1 });
    }

    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
  }

  handleIncomingMessage(msg, isFromMqtt) {
    if (!msg || msg.senderId === this.deviceInfo.id) return;

    switch (msg.type) {
      case 'PRESENCE_PING':
        if (!isFromMqtt) this.handlePresenceMessage(msg);
        break;

      case 'REQUEST_SYNC':
        if (this.links.length > 0 || this.notes.length > 0) {
          this.broadcastMessage({
            type: 'SYNC_STATE_RESPONSE',
            links: this.links,
            notes: this.notes,
            targetId: msg.senderId
          });
        }
        break;

      case 'SYNC_STATE_RESPONSE':
        if (msg.links && Array.isArray(msg.links)) {
          this.mergeLinks(msg.links);
        }
        if (msg.notes && msg.notes.length > 0 && !this.notes) {
          this.notes = msg.notes;
          if (this.onNotesUpdate) this.onNotesUpdate(this.notes);
        }
        this.saveToLocalStorage();
        break;

      case 'ADD_LINK':
        if (msg.link) {
          const exists = this.links.some(l => l.id === msg.link.id);
          if (!exists) {
            this.links.unshift(msg.link);
            this.saveToLocalStorage();
            if (this.onLinksUpdate) this.onLinksUpdate(this.links);
          }
        }
        break;

      case 'TOGGLE_LINK':
        if (msg.linkId) {
          const link = this.links.find(l => l.id === msg.linkId);
          if (link) {
            link.opened = msg.opened;
            this.saveToLocalStorage();
            if (this.onLinksUpdate) this.onLinksUpdate(this.links);
          }
        }
        break;

      case 'UPDATE_NOTE':
        if (msg.linkId) {
          const link = this.links.find(l => l.id === msg.linkId);
          if (link) {
            link.note = msg.note;
            this.saveToLocalStorage();
            if (this.onLinksUpdate) this.onLinksUpdate(this.links);
          }
        }
        break;

      case 'REMOVE_LINK':
        if (msg.linkId) {
          const idx = this.links.findIndex(l => l.id === msg.linkId);
          if (idx !== -1) {
            this.links.splice(idx, 1);
            this.saveToLocalStorage();
            if (this.onLinksUpdate) this.onLinksUpdate(this.links);
          }
        }
        break;

      case 'RESTORE_LINK':
        if (msg.link) {
          const exists = this.links.some(l => l.id === msg.link.id);
          if (!exists) {
            const pos = Math.min(msg.index || 0, this.links.length);
            this.links.splice(pos, 0, msg.link);
            this.saveToLocalStorage();
            if (this.onLinksUpdate) this.onLinksUpdate(this.links);
          }
        }
        break;

      case 'CLEAR_ALL_LINKS':
        this.links = [];
        this.saveToLocalStorage();
        if (this.onLinksUpdate) this.onLinksUpdate(this.links);
        break;

      case 'UPDATE_RAW_NOTES':
        this.notes = msg.text || '';
        this.saveToLocalStorage();
        if (this.onNotesUpdate) this.onNotesUpdate(this.notes);
        break;
    }
  }

  mergeLinks(remoteLinks) {
    const localMap = new Map(this.links.map(l => [l.id, l]));
    remoteLinks.forEach(rl => {
      if (!localMap.has(rl.id)) {
        localMap.set(rl.id, rl);
      }
    });
    this.links = Array.from(localMap.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);
  }

  // ==========================================
  // Link Operations (Permanent until manually deleted)
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
    this.saveToLocalStorage();
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);

    this.broadcastMessage({
      type: 'ADD_LINK',
      link: linkItem
    });

    return linkItem;
  }

  toggleLinkOpened(linkId) {
    const link = this.links.find(l => l.id === linkId);
    if (link) {
      link.opened = !link.opened;
      this.saveToLocalStorage();
      if (this.onLinksUpdate) this.onLinksUpdate(this.links);

      this.broadcastMessage({
        type: 'TOGGLE_LINK',
        linkId: linkId,
        opened: link.opened
      });
    }
  }

  updateLinkNote(linkId, newNote) {
    const link = this.links.find(l => l.id === linkId);
    if (link) {
      link.note = newNote;
      this.saveToLocalStorage();
      if (this.onLinksUpdate) this.onLinksUpdate(this.links);

      this.broadcastMessage({
        type: 'UPDATE_NOTE',
        linkId: linkId,
        note: newNote
      });
    }
  }

  removeLink(linkId) {
    const idx = this.links.findIndex(l => l.id === linkId);
    if (idx !== -1) {
      const removed = this.links.splice(idx, 1)[0];
      this.deletedHistory.push({ item: removed, index: idx });
      this.saveToLocalStorage();
      if (this.onLinksUpdate) this.onLinksUpdate(this.links);

      this.broadcastMessage({
        type: 'REMOVE_LINK',
        linkId: linkId
      });

      return removed;
    }
    return null;
  }

  undoDelete() {
    if (this.deletedHistory.length === 0) return;
    const last = this.deletedHistory.pop();
    const pos = Math.min(last.index, this.links.length);
    this.links.splice(pos, 0, last.item);
    this.saveToLocalStorage();
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);

    this.broadcastMessage({
      type: 'RESTORE_LINK',
      link: last.item,
      index: pos
    });
  }

  clearAllLinks() {
    this.links = [];
    this.saveToLocalStorage();
    if (this.onLinksUpdate) this.onLinksUpdate(this.links);

    this.broadcastMessage({
      type: 'CLEAR_ALL_LINKS'
    });
  }

  setRawNotes(newText) {
    if (this.notes === newText) return;
    this.notes = newText;
    this.saveToLocalStorage();

    this.broadcastMessage({
      type: 'UPDATE_RAW_NOTES',
      text: newText
    });
  }
}

// Global Singleton
window.syncEngine = new SyncEngine();
