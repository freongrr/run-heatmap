import { TrackFeature, TYPE_RUN } from '../shared/types';
import * as PouchDB from 'pouchdb';

// TODO : why not store the gpx files directly?
const db = new PouchDB('run-features');

export async function loadAllFeatures(): Promise<TrackFeature[]> {
    const docs = await db.allDocs<TrackFeature>({ include_docs: true });
    console.info(`Read ${docs.rows.length} out of ${docs.total_rows} rows from DB`);
    return docs.rows.map((d) => d.doc);
}

export async function loadFeatures(year: number): Promise<TrackFeature[]> {
    // TODO : https://pouchdb.com/guides/mango-queries.html
    const startOfYear = new Date(`${year}-01-01`).getTime();
    const startOfNextYear = new Date(`${year + 1}-01-01`).getTime();

    const docs = await db.allDocs<TrackFeature>({ include_docs: true });
    const features = docs.rows.map(r => r.doc).filter(f => {
        const timestamp = f.properties.timestamps[0];
        return f.properties.type === TYPE_RUN
            && timestamp >= startOfYear && timestamp < startOfNextYear;
    });

    console.info(`Read ${features.length} out of ${docs.total_rows} rows from DB`);
    return features;
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
