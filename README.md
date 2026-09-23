# 📝 SyncPad — Real-Time Collaborative Notepad & Link Hub

A clean, distraction-free, blank typable notepad and link hub designed to be hosted for free on **GitHub Pages**. 

SyncPad syncs automatically in real time across **macOS**, **Windows**, **Linux**, and **mobile browsers** without requiring any paid backend, external database accounts, or server configuration.

---

## ⚡ Key Highlights

- **Real-Time Cross-Device Sync**: Powered by **Yjs (CRDT)** and **WebRTC** peer-to-peer data channels with public signaling relays. Keystrokes and links update simultaneously across Windows, Mac, and mobile.
- **Optimized for Pasting Links**:
  - Paste links one by one using <kbd>Cmd+V</kbd> (Mac) or <kbd>Ctrl+V</kbd> (Windows) anywhere on the sheet.
  - Automatically fetches domain favicons & badges (`github.com`, `youtube.com`, `apple.com`).
  - **1-Click Open (↗)** on the other computer in a new tab.
  - **1-Click Copy (📋)** back to clipboard.
  - Check off links as you review them, or delete with 1-click.
  - Inline editable notes/tags for each link that sync across devices.
  - Batch actions: **Open All**, **Copy All**, and **Clear Opened**.
- **Blank Typable Sheet**:
  - Switch anytime to **Blank Notepad** for freeform, collaborative text editing.
  - Responsive paper canvas with realistic elevation, custom rulings (Blank, Lined, Grid, Dot Matrix), and multiple themes (Paper Light, Dark Slate, Warm Sepia, Cyber Terminal).
- **Zero-Server & Offline Resilient**:
  - Uses browser **IndexedDB** for local persistence — your notes stay saved even if you refresh or go offline.
  - When reconnected, changes merge conflict-free.
- **Room / Workspace Privacy**:
  - Rooms are isolated using URL hashes (e.g., `https://<user>.github.io/notepad/#room=my-work`).
  - Share modal includes one-click link copying and an instant QR code to open on your phone or other laptop.

---

## 🚀 How to Deploy to GitHub Pages (60 Seconds)

### Step 1: Create a GitHub Repository
1. Go to [GitHub.com](https://github.com) and click **New Repository**.
2. Name it `notepad` (or whatever you prefer) and set it to **Public**.

### Step 2: Push These Files
In your local terminal inside this folder, run:
```bash
git init
git add .
git commit -m "Initial commit of SyncPad"
git branch -M main
git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/notepad.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub.
2. Click **Settings** (top tab) ➔ **Pages** (left sidebar).
3. Under **Build and deployment**:
   - **Source**: Select **Deploy from a branch**.
   - **Branch**: Select `main` and folder `/ (root)`.
   - Click **Save**.
4. Within 1-2 minutes, your notepad will be live at:
   ```
   https://<YOUR-GITHUB-USERNAME>.github.io/notepad/
   ```

---

## 💻 Cross-Device Workflow (macOS & Windows)

1. **Open on Mac**: Open `https://<YOUR-GITHUB-USERNAME>.github.io/notepad/#room=my-links` in Safari or Chrome.
2. **Open on Windows**: Open the **exact same link** in Edge or Chrome.
3. You will see the status dot turn green: `🟢 2 devices online (Mac & Windows)`.
4. Copy any link on your Mac and hit <kbd>Cmd+V</kbd>.
5. Look at your Windows screen — the link appears instantly with a 1-click **Open ↗** button!

---

## 🛠️ Architecture & Tech Stack

- **Core**: Vanilla HTML5, CSS3, Modern ES JavaScript.
- **Sync Protocol**: WebRTC Peer-to-Peer DataChannels via `y-webrtc` with redundant public signaling relays (`signaling.yjs.dev`, `y-webrtc-signaling-eu.herokuapp.com`, `y-webrtc-signaling-us.herokuapp.com`).
- **CRDT Engine**: [Yjs](https://github.com/yjs/yjs) for conflict-free real-time state replication.
- **Local Storage**: IndexedDB via `y-indexeddb` for instant offline persistence.
- **Styling**: Pure CSS design system with custom CSS variables, dark mode, and paper physics.
- **No external build step required**: Core libraries are pre-bundled in `js/yjs-bundle.js` for instant deployment.
