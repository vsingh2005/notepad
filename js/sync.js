/**
 * SyncPad - Cloud-Persistent Real-Time Sync Engine
 * Retained State Architecture: Links & Notepad persist even when 0 users are online.
 * Cross-device sync between macOS, Windows, Linux, and Mobile.
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

        // Subscribe to state & presence topics
        this.client.subscribe([this.stateTopic, this.presenceTopic], { qos: 1 }, (err) => {
          if (!err) {
            // Broker will immediately deliver retained state if available
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
    this.publishCurrentState();
  }
}

// Global Singleton
window.syncEngine = new SyncEngine();
