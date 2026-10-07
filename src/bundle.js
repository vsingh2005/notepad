import mqtt from 'mqtt';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import * as awarenessProtocol from 'y-protocols/awareness';
import JSZip from 'jszip';
import QRCode from 'qrcode';

const mqttLib = mqtt && mqtt.connect ? mqtt : (mqtt && mqtt.default ? mqtt.default : mqtt);

if (typeof window !== 'undefined') {
  window.mqtt = mqttLib;
  window.Y = Y;
  window.IndexeddbPersistence = IndexeddbPersistence;
  window.awarenessProtocol = awarenessProtocol;
  window.JSZip = JSZip;
  window.QRCode = QRCode;
}

export { mqttLib as mqtt, Y, IndexeddbPersistence, awarenessProtocol, JSZip, QRCode };
