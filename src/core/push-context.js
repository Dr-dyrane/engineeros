/* EngineerOS · Push context bridge.
   The server only ever sends a trigger; the *content* of a reminder is composed
   on the device by the service worker. To do that without sending anything
   personal to the server, the app stashes a tiny summary of "today" in
   IndexedDB, which the service worker reads when a push arrives. Nothing here
   leaves the device. */

import { todaysMission, liveStreak, totalMissions, firstName } from './state.js';

const DB = 'engineeros', STORE = 'kv', KEYNAME = 'push-context';

function openDB() {
  return new Promise((resolve, reject) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE); } catch (e) {} };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (e) { reject(e); }
  });
}

/* Recompute the summary from current state and store it for the SW to read. */
export async function syncPushContext() {
  if (typeof indexedDB === 'undefined') return;      // unsupported, or test env
  try {
    const tm = todaysMission();
    const total = totalMissions();
    const ctx = {
      name: firstName(),
      missionId: tm ? tm.m.id : '',
      missionTitle: tm ? tm.m.title : '',
      journeyTitle: tm ? tm.j.title : '',
      streak: liveStreak(),
      allDone: !tm && total > 0,
      updated: Date.now(),
    };
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(ctx, KEYNAME);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {}
}
