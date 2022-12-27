import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { LegacyTrackFeature, Track, TYPE_RUN } from '../shared/types';

interface DBTrack extends Track {
    _id: string;
}

PouchDB.plugin(PouchDBFind);

const db = new PouchDB<DBTrack>('track_db');

export async function loadTracks(year: number): Promise<Track[]> {
    const start = new Date().getTime();

    const startOfYear = new Date(`${year}-01-01`).getTime();
    const startOfNextYear = new Date(`${year + 1}-01-01`).getTime();
    const request = {
        selector: {
            timestamp: {
                $gte: startOfYear,
                $lt: startOfNextYear,
            }
        }
    };

    const response = await db.find(request);
    const tracks = response.docs;

    const end = new Date().getTime();
    console.info(`Read ${tracks.length} tracks in ${end - start} ms`);
    return tracks;
}

export async function putTrack(track: Track): Promise<void> {
    const dbTrack: DBTrack = { ...track, _id: track.id.toString() };
    try {
        await db.put(dbTrack);
        console.info(`put ${track.id} in database`);
    } catch (e) {
        console.error(`error putting ${track.id} in database`, e);
    }
}

async function processDBCommand(command: string) {
    if (command === '--upgrade') {
        const legacyDb = new PouchDB('run-features');
        const allDocsResponse = await legacyDb.allDocs<LegacyTrackFeature>({ include_docs: true });
        let updatedDocs = 0;
        for (const row of allDocsResponse.rows) {
            if (row.doc.type === 'Feature' && row.doc.properties.type === TYPE_RUN) {
                const feature = row.doc;
                const timestamp = feature.properties.timestamps[0];
                const dbTrack: DBTrack = {
                    id: feature.id,
                    _id: feature.id.toString(),
                    description: feature.properties.description,
                    timestamp: timestamp,
                    coordinates: feature.geometry.coordinates.map(([c1, c2]) => [c1, c2]),
                    coordinateTimes: feature.properties.timestamps.map((t) => t - timestamp),
                };
                await db.put(dbTrack);
                updatedDocs++;
            }
        }
        console.info(`Converted ${updatedDocs} documents`);
    } else if (command === '--remove-indexes') {
        const response = await db.getIndexes();
        for (let i = 0; i < response.indexes.length; i++) {
            const index = response.indexes[i];
            if (index.ddoc) {
                console.info('Deleting index: ', index);
                await db.deleteIndex(index);
            }
        }
    } else {
        console.error('Unexpected DB command: ' + command);
    }
}

async function initIndexes() {
    const start = new Date().getTime();
    const createIndexResponse = await db.createIndex({
        index: {
            name: 'idx_timestamp',
            fields: ['timestamp']
        }
    });
    if (createIndexResponse.result !== 'exists') {
        const end = new Date().getTime();
        console.debug(`Created index in ${end - start} ms`);
    }
}

// switch for CLI and runtime modes
if (process.argv[1] && process.argv[1].endsWith('db.js')) {
    processDBCommand(process.argv[2])
        .then(() => {
            // no op
        })
        .catch((e) => console.error('Error processing DB command', e));
} else {
    initIndexes()
        .then(() => {
            // no op
        })
        .catch((e) => console.error('Error initializing DB', e));
}
