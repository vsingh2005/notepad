const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Y = require('yjs');

function syncHarness() {
  const timers = new Map();
  let timerId = 0;
  const context = vm.createContext({window: {Y}, console, Date, setTimeout(fn) {
    timers.set(++timerId, fn); return timerId;
  }, clearTimeout(id) { timers.delete(id); }});
  const source = fs.readFileSync('js/sync.js', 'utf8').replace('window.syncEngine = new SyncEngine();', 'window.SyncEngine = SyncEngine;');
  vm.runInContext(source, context);
  const engine = Object.create(context.window.SyncEngine.prototype);
  engine.doc = new Y.Doc();
  engine.activePageId = 'main';
  engine.yNotesPages = new Map([['main', engine.doc.getText('main')]]);
  engine.deviceId = 'test'; engine.deviceName = 'Tester';
  engine.deviceColor = '#10b981'; engine.deviceInfo = {tag: '@Tester'};
  let state = {isTyping: false, cursor: null};
  let updates = 0;
  engine.awareness = {getLocalState: () => state, setLocalState(next) { state = next; updates++; }};
  return {engine, timers, get updates() { return updates; }, get state() { return state; }};
}

test('rapid edits remain immediate and converge on another Yjs document', () => {
  const h = syncHarness();
  const remote = new Y.Doc();
  h.engine.doc.on('update', update => Y.applyUpdate(remote, update));
  for (const text of ['hello', 'hello world', 'hello brave world', 'hello world', '👋 hello\nworld']) {
    h.engine.setNoteText(text);
    assert.equal(h.engine.getNoteText(), text);
    assert.equal(remote.getText('main').toString(), text);
  }
  assert.equal(h.updates, 1, 'typing presence changes once across the burst');
});

test('cursor bursts send the latest selection once and typing stops after idle', () => {
  const h = syncHarness();
  for (let index = 0; index < 100; index++) h.engine.setLocalCursor(index, index + 2);
  assert.equal(h.timers.size, 1);
  const [id, flush] = h.timers.entries().next().value;
  h.timers.delete(id); flush();
  assert.equal(h.updates, 1);
  assert.equal(h.state.cursor.index, 99);
  assert.equal(h.state.cursor.length, 2);
  h.engine.setLocalTyping(true);
  h.engine.setLocalTyping(true);
  assert.equal(h.updates, 2);
  const stop = Array.from(h.timers.values()).pop(); stop();
  assert.equal(h.state.isTyping, false);
});

test('optional libraries share a request and retry after a failed download', async () => {
  const scripts = [];
  const window = {};
  const context = vm.createContext({window, URL, document: {
    baseURI: 'https://example.com/notepad/',
    createElement: () => ({remove() {}}), head: {appendChild: script => scripts.push(script)}
  }});
  const source = fs.readFileSync('src/bundle.js', 'utf8');
  vm.runInContext(source.slice(source.indexOf('const optionalLibraries')), context);
  const first = window.loadOptionalLibrary('zip');
  assert.equal(first, window.loadOptionalLibrary('zip'));
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://example.com/notepad/js/zip-bundle.js?v=2.7.0');
  scripts[0].onerror();
  await assert.rejects(first);
  const retry = window.loadOptionalLibrary('zip');
  window.JSZip = {}; scripts[1].onload();
  assert.equal(await retry, window.JSZip);
});

test('animation caps high DPI, skips frames, and pauses while hidden', () => {
  let frames = 0;
  const context = vm.createContext({window: {devicePixelRatio: 3, innerWidth: 100, innerHeight: 100},
    document: {readyState: 'loading', addEventListener() {}, hidden: false},
    performance: {now: () => 1}, requestAnimationFrame() { frames++; return frames; }});
  vm.runInContext(fs.readFileSync('js/nature.js', 'utf8') + '\nwindow.Nature = NatureAmbience;', context);
  const nature = Object.create(context.window.Nature.prototype);
  nature.canvas = {}; nature.ctx = {scale() {}, clearRect() {}, drawImage() {}};
  nature.isActive = true; nature.resize();
  assert.equal(nature.canvas.width, 150);
  nature.backgroundCache = {}; nature.particles = []; nature.leaves = []; nature.lastFrameTime = 1;
  nature.animate(10); assert.equal(nature.lastFrameTime, 1);
  nature.animate(35); assert.equal(nature.lastFrameTime, 35);
  context.document.hidden = true; nature.animate(80); assert.equal(frames, 2);
});

test('list reconciliation preserves unchanged cards and handles filtering and reorder', () => {
  const source = fs.readFileSync('js/app.js', 'utf8');
  const start = source.indexOf('  function reconcileChildren');
  const end = source.indexOf('  const linkCardCache', start);
  const context = vm.createContext({});
  vm.runInContext(source.slice(start, end), context);
  const a = {}, b = {}, c = {};
  const parent = {children: [a, b, c], insertBefore(node, anchor) {
    const previous = this.children.indexOf(node);
    if (previous >= 0) this.children.splice(previous, 1);
    this.children.splice(anchor ? this.children.indexOf(anchor) : this.children.length, 0, node);
  }, get lastElementChild() { return this.children.at(-1); }};
  for (const node of [a, b, c]) node.remove = () => parent.children.splice(parent.children.indexOf(node), 1);
  context.reconcileChildren(parent, [c, a]);
  assert.deepEqual(parent.children, [c, a]);
  context.reconcileChildren(parent, [a, b, c]);
  assert.deepEqual(parent.children, [a, b, c]);
});

test('scroll pauses decorative frames until interaction stops without changing the saved toggle', () => {
  const timers = new Map();
  let nextTimer = 0;
  let frames = 0;
  const context = vm.createContext({window: {},
    document: {readyState: 'loading', addEventListener() {}, hidden: false},
    performance: {now: () => 1},
    requestAnimationFrame() { frames++; return frames; }, cancelAnimationFrame() {},
    setTimeout(fn) { timers.set(++nextTimer, fn); return nextTimer; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(fs.readFileSync('js/nature.js', 'utf8') + '\nwindow.Nature = NatureAmbience;', context);
  const nature = Object.create(context.window.Nature.prototype);
  nature.isActive = true;
  nature.pauseForInteraction(); nature.pauseForInteraction();
  nature.animate(50);
  assert.equal(frames, 0);
  assert.equal(timers.size, 1, 'one resume timer per scroll burst');
  assert.equal(nature.isActive, true);
  let resumed = 0;
  nature.animate = () => resumed++;
  Array.from(timers.values())[0]();
  assert.equal(nature.interactionPaused, false);
  assert.equal(resumed, 1);
  nature.pauseForInteraction(); nature.isActive = false;
  Array.from(timers.values()).at(-1)();
  assert.equal(resumed, 1, 'turning ambience off during scrolling must keep it off');
});
