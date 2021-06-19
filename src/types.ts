import * as GeoJSON from 'geojson';

export type RawDataView = 'Tracks' | 'Points' | 'Hidden';

// Can't use an enum since I don't know the other types
export const TYPE_RUN = 9;

export interface TrackProperties {
    description: string;
    type: number;
    timestamps: number[];
}

export interface TrackFeatureCollection extends GeoJSON.FeatureCollection<GeoJSON.LineString, TrackProperties> {
    features: [TrackFeature];
}

export interface TrackFeature extends GeoJSON.Feature<GeoJSON.LineString, TrackProperties> {
    id: number;
}
