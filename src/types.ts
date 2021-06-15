import * as GeoJSON from 'geojson';

// TODO : fine a good place for these types

export type RawDataView = 'Tracks' | 'Points' | 'Hidden';

export interface TrackProperties {
    trackId: string;
    description: string;
    // TODO : use the first timestamp
    time: string;
    // TODO : use an emum
    type: number;
    // TODO : use a number of some kind of object
    timestamps: string[];
}

export type TrackFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, TrackProperties>;
export type TrackFeature = GeoJSON.Feature<GeoJSON.LineString, TrackProperties>;
