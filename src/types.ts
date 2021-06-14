import * as GeoJSON from 'geojson';

// TODO : fine a good place for these types

export type RawDataView = 'Tracks' | 'Points' | 'Hidden';

export interface TrackProperties {
    trackId: string;
    description: string;
    time: string;
    type: number;
}

export interface TrackFeatureCollection extends GeoJSON.FeatureCollection<GeoJSON.LineString, TrackProperties> {
}

export interface TrackFeature extends GeoJSON.Feature<GeoJSON.LineString, TrackProperties> {
}

// TODO : Eliminate this, or use it everywhere?
export type TrackFeatureLike = GeoJSON.Feature<GeoJSON.Geometry, TrackProperties>;
