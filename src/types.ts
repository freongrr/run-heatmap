import * as GeoJSON from 'geojson';

// TODO : fine a good place for these types

export type RawDataView = 'Tracks' | 'Points' | 'Hidden';

export interface TrackProperties {
    // TODO : use the id on Feature directly
    trackId: string;
    description: string;
    // TODO : we don't need that since we have the timestamps
    time: string;
    // TODO : use an enum?
    type: number;
    // TODO : use a number
    timestamps: string[];
}

export type TrackFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, TrackProperties>;
export type TrackFeature = GeoJSON.Feature<GeoJSON.LineString, TrackProperties>;
