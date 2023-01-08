import * as PouchDB from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import { Track } from '../shared/types';

interface DBTrack extends Track {
    _id: string;
}

PouchDB.plugin(PouchDBFind);

const db = new PouchDB<DBTrack>('track_db');

export async function loadTracks(year: number): Promise<Track[]> {
    const start = new Date().getTime();
    const response = await db.find({ selector: { year: year } });
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
        // No-op
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

async function createIndex(name: string, fields: string[]): Promise<void> {
    const start = new Date().getTime();
    const createIndexResponse = await db.createIndex({ index: { name: name, fields: fields } });
    if (createIndexResponse.result !== 'exists') {
        const end = new Date().getTime();
        console.debug(`Created index ${name} in ${end - start} ms`);
    } else {
        console.debug(`Index ${name} already exists`);
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
    Promise.all([
        // createIndex('idx_timestamp', ['timestamp']),
        createIndex('idx_year', ['year'])
    ])
        .then(() => {
            // no op
        })
        .catch((e) => console.error('Error initializing DB', e));
}
