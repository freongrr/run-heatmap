import { TrackFeature } from '@src/shared/types';
import * as PouchDB from 'pouchdb';

// TODO : why not store the gpx files directly?
const db = new PouchDB('run-features');

export async function loadFeatures(): Promise<TrackFeature[]> {
    const docs = await db.allDocs<TrackFeature>({ include_docs: true });
    console.info(`Read ${docs.rows.length} out of ${docs.total_rows} rows from DB`);
    return docs.rows.map((d) => d.doc);
}

export async function putFeature(feature: TrackFeature): Promise<void> {
    const featureWithId = { _id: feature.id.toString(), ...feature };
    try {
        await db.put(featureWithId);
        console.info(`put ${feature.id} in database`);
    } catch (e) {
        console.error(`error putting ${feature.id} in database`, e);
    }
}
