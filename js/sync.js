/**
 * SyncPad - Real-Time Collaborative CRDT, WebRTC & BroadcastChannel Sync Engine
 * Guarantees permanent persistence (IndexedDB) and bidirectional cross-device sync.
 */

class SyncEngine {
  constructor() {
    this.doc = null;
    this.provider = null;
    this.persistence = null;
    this.broadcastChannel = null;
    this.roomName = this.getRoomFromUrl();
    this.deviceInfo = this.detectDevice();
    
    // Callbacks
    this.onLinksUpdate = null;
    this.onNotesUpdate = null;
    this.onPeersUpdate = null;
    this.onStatusUpdate = null;

    this.deletedHistory = []; // For Undo functionality
  }

  /**
   * Detect current device/OS for peer presence display
   */
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
      id: Math.random().toString(36).substring(2, 9),
      name: `${os} (${Math.floor(100 + Math.random() * 900)})`,
      os: os,
      color: randomColor
    };
  }

  /**
   * Parse room name from URL hash (e.g. #room=work-links)
   */
  getRoomFromUrl() {
    const hash = window.location.hash;
    if (hash) {
      const match = hash.match(/room=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }
    const stored = localStorage.getItem('syncpad_last_room');
    if (stored) return stored;
    return 'collab-room';
  }

  /**
   * Set room in URL and reload
   */
  setRoom(newRoom) {
    const cleanRoom = encodeURIComponent(newRoom.trim().toLowerCase());
    window.location.hash = `#room=${cleanRoom}`;
    localStorage.setItem('syncpad_last_room', cleanRoom);
  }

  /**
   * Initialize Yjs, IndexedDB, BroadcastChannel, and WebRTC
   */
  init() {
    if (!window.Y) {
      console.error('[SyncPad] Yjs bundle missing!');
      return;
    }

    const Y = window.Y;
    this.doc = new Y.Doc();

    // 1. Permanent Local Persistence via IndexedDB
    // Links remain forever in storage until manually removed via the delete button.
    const idbName = `syncpad_db_${this.roomName}`;
    if (window.IndexeddbPersistence) {
      try {
        this.persistence = new window.IndexeddbPersistence(idbName, this.doc);
        this.persistence.on('synced', () => {
          console.log('[SyncPad] IndexedDB permanent storage synced.');
          this.triggerDataUpdate();
        });
      } catch (e) {
        console.warn('[SyncPad] IndexedDB error:', e);
      }
    }

    // 2. Instant Same-Device Cross-Tab Sync via BroadcastChannel
    try {
      this.broadcastChannel = new BroadcastChannel(`syncpad-bc-${this.roomName}`);
      this.broadcastChannel.onmessage = (e) => {
        if (e.data && e.data.update) {
          Y.applyUpdate(this.doc, new Uint8Array(e.data.update), 'broadcast');
        } else if (e.data && e.data.requestFullSync) {
          const state = Y.encodeStateAsUpdate(this.doc);
          this.broadcastChannel.postMessage({ update: Array.from(state) });
        }
      };

      this.doc.on('update', (update, origin) => {
        if (origin !== 'broadcast' && this.broadcastChannel) {
          this.broadcastChannel.postMessage({ update: Array.from(update) });
        }
      });

      // Request latest state from any other tab
      this.broadcastChannel.postMessage({ requestFullSync: true });
    } catch (bcErr) {
      console.warn('[SyncPad] BroadcastChannel unavailable:', bcErr);
    }

    // 3. Multi-Device Real-Time Sync via WebRTC (macOS <-> Windows <-> Mobile)
    if (window.WebrtcProvider) {
      try {
        this.provider = new window.WebrtcProvider(`syncpad-p2p-${this.roomName}`, this.doc, {
          signaling: [
            'wss://signaling.yjs.dev',
            'wss://y-webrtc-signaling-eu.herokuapp.com',
            'wss://y-webrtc-signaling-us.herokuapp.com'
          ],
          peerOpts: {
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' },
              { urls: 'stun:stun3.l.google.com:19302' }
            ]
          }
        });

        // Presence & Awareness
        if (this.provider.awareness) {
          this.provider.awareness.setLocalStateField('user', this.deviceInfo);

          this.provider.awareness.on('change', () => {
            const states = Array.from(this.provider.awareness.getStates().values());
            const peers = states.filter(s => s.user).map(s => s.user);
            if (this.onPeersUpdate) {
              this.onPeersUpdate({
                count: peers.length,
                peers: peers,
                currentDevice: this.deviceInfo
              });
            }
          });
        }

        this.provider.on('status', event => {
          if (this.onStatusUpdate) {
            this.onStatusUpdate({
              status: event.status,
              room: this.roomName
            });
          }
        });

        this.provider.on('synced', () => {
          this.triggerDataUpdate();
        });
      } catch (err) {
        console.warn('[SyncPad] WebrtcProvider initialization:', err);
      }
    }

    // 4. Data Listeners for Y.Array('links') and Y.Text('notes')
    const yLinks = this.doc.getArray('links');
    yLinks.observe(() => {
      this.triggerLinksUpdate();
    });

    const yNotes = this.doc.getText('notes');
    yNotes.observe(() => {
      if (this.onNotesUpdate) {
        this.onNotesUpdate(yNotes.toString());
      }
    });

    // Hash change handler for switching rooms
    window.addEventListener('hashchange', () => {
      const newRoom = this.getRoomFromUrl();
      if (newRoom !== this.roomName) {
        window.location.reload();
      }
    });
  }

  triggerDataUpdate() {
    this.triggerLinksUpdate();
    if (this.onNotesUpdate && this.doc) {
      this.onNotesUpdate(this.doc.getText('notes').toString());
    }
  }

  triggerLinksUpdate() {
    if (!this.onLinksUpdate || !this.doc) return;
    const yLinks = this.doc.getArray('links');
    this.onLinksUpdate(yLinks.toArray());
  }

  // ==========================================
  // Link Operations (Permanent until manually deleted)
  // ==========================================

  /**
   * Add a new link item
   */
  addLink(url, note = '') {
    if (!this.doc) return;
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

    const yLinks = this.doc.getArray('links');
    this.doc.transact(() => {
      yLinks.insert(0, [linkItem]);
    });

    return linkItem;
  }

  /**
   * Toggle opened/checked state (does NOT delete link)
   */
  toggleLinkOpened(linkId) {
    if (!this.doc) return;
    const yLinks = this.doc.getArray('links');
    const items = yLinks.toArray();
    const index = items.findIndex(item => item.id === linkId);
    if (index !== -1) {
      const updated = { ...items[index], opened: !items[index].opened };
      this.doc.transact(() => {
        yLinks.delete(index, 1);
        yLinks.insert(index, [updated]);
      });
    }
  }

  /**
   * Update note/tag for a link
   */
  updateLinkNote(linkId, newNote) {
    if (!this.doc) return;
    const yLinks = this.doc.getArray('links');
    const items = yLinks.toArray();
    const index = items.findIndex(item => item.id === linkId);
    if (index !== -1) {
      const updated = { ...items[index], note: newNote };
      this.doc.transact(() => {
        yLinks.delete(index, 1);
        yLinks.insert(index, [updated]);
      });
    }
  }

  /**
   * Manually delete a single link (permanent manual deletion)
   */
  removeLink(linkId) {
    if (!this.doc) return;
    const yLinks = this.doc.getArray('links');
    const items = yLinks.toArray();
    const index = items.findIndex(item => item.id === linkId);
    if (index !== -1) {
      const removed = items[index];
      this.deletedHistory.push({ item: removed, index: index });
      this.doc.transact(() => {
        yLinks.delete(index, 1);
      });
      return removed;
    }
    return null;
  }

  /**
   * Undo last manual deletion
   */
  undoDelete() {
    if (!this.doc || this.deletedHistory.length === 0) return;
    const last = this.deletedHistory.pop();
    const yLinks = this.doc.getArray('links');
    const pos = Math.min(last.index, yLinks.length);
    this.doc.transact(() => {
      yLinks.insert(pos, [last.item]);
    });
  }

  /**
   * Manually clear all links (requires explicit confirmation)
   */
  clearAllLinks() {
    if (!this.doc) return;
    const yLinks = this.doc.getArray('links');
    this.doc.transact(() => {
      yLinks.delete(0, yLinks.length);
    });
  }

  // ==========================================
  // Collaborative Raw Notepad Text
  // ==========================================

  setRawNotes(newText) {
    if (!this.doc) return;
    const yNotes = this.doc.getText('notes');
    const current = yNotes.toString();
    if (current === newText) return;

    this.doc.transact(() => {
      yNotes.delete(0, current.length);
      yNotes.insert(0, newText);
    });
  }
}

// Global Singleton
window.syncEngine = new SyncEngine();
