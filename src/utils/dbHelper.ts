import {TrackFeature} from '../types';

const DB = 'db';
const STORE_FEATURES = 'features';

export function readFromDB(): Promise<TrackFeature[]> {
    return new Promise((resolve, reject) => {
        openDB()
            .then((db) => {
                const transaction = db.transaction([STORE_FEATURES], 'readonly');
                transaction.onerror = () => reject(new Error(`Transaction failed`));

                const objectStore = transaction.objectStore(STORE_FEATURES);
                const request = objectStore.getAll();
                request.onsuccess = () => resolve(request.result as TrackFeature[]);
                request.onerror = () => reject(new Error(`Request failed: ${request.error.message}`));
            })
            .catch((e) => {
                reject(e);
            });
    });
}

export function saveToDB(features: TrackFeature[]): Promise<void> {
    return new Promise((resolve, reject) => {
        openDB()
            .then((db) => {
                const transaction = db.transaction([STORE_FEATURES], 'readwrite');
                let error: Error | null = null;

                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(error || new Error('Unknown error'));

                const objectStore = transaction.objectStore(STORE_FEATURES);
                features.forEach((f) => {
                    const request = objectStore.add(f);
                    request.onerror = () => {
                        error = new Error(`Failed to write feature ${f.id}: ${request.error?.message}`);
                    }
                });
            })
            .catch((e) => {
                reject(e);
            });
    });
}

function openDB(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const openRequest = window.indexedDB.open(DB);

        openRequest.onupgradeneeded = () => {
            const db = openRequest.result;
            // Not sure if I need that :|
            db.onerror = () => reject(openRequest.error);
            db.createObjectStore(STORE_FEATURES, {keyPath: 'id'});
        };

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => resolve(openRequest.result);
    });
}
