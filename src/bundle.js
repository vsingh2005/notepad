import mqtt from 'mqtt';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';

const mqttLib = mqtt && mqtt.connect ? mqtt : (mqtt && mqtt.default ? mqtt.default : mqtt);

if (typeof window !== 'undefined') {
  window.mqtt = mqttLib;
  window.Y = Y;
  window.IndexeddbPersistence = IndexeddbPersistence;
  window.awarenessProtocol = awarenessProtocol;

}

export { mqttLib as mqtt, Y, IndexeddbPersistence, awarenessProtocol };

const optionalLibraries = new Map();
window.loadOptionalLibrary = function (name) {
  if (!['zip', 'qrcode'].includes(name)) return Promise.reject(new Error('Unknown library'));
  if (!optionalLibraries.has(name)) {
    const promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL(`js/${name}-bundle.js?v=2.7.0`, document.baseURI).href;
      script.onload = () => resolve(name === 'zip' ? window.JSZip : window.QRCode);
      script.onerror = () => { script.remove(); optionalLibraries.delete(name); reject(new Error('Library failed to load')); };
      document.head.appendChild(script);
    });
    optionalLibraries.set(name, promise);
  }
  return optionalLibraries.get(name);
};
