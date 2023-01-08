import * as GeoJSON from 'geojson';

export type RawDataView = 'Tracks' | 'Points' | 'Hidden';

export type Coordinates = [number, number];

export interface Track {
    id: number;
    description: string;
    year: number;
    sampling: number;
    timestamp: number;
    coordinates: Coordinates[];
    coordinateSeconds: number[];
}

export interface TrackProperties {}

export interface TrackFeature extends GeoJSON.Feature<GeoJSON.LineString, TrackProperties> {
    id: number;
}
