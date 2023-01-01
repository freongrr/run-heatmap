import * as GeoJSON from 'geojson';

export type RawDataView = 'Tracks' | 'Points' | 'Hidden';

export type Coordinates = [number, number];

export interface Track {
    id: number;
    description: string;
    timestamp: number;
    coordinates: Coordinates[];
    // TODO : could save some space by using seconds instead of millis
    coordinateTimes: number[];
}

// Can't use an enum since I don't know the other types
/** @Deprecated */
export const TYPE_RUN = 9;

/** @Deprecated */
export interface LegacyTrackProperties {
    description: string;
    type: number;
    timestamps: number[];
}

/** @Deprecated */
export interface LegacyTrackFeature extends GeoJSON.Feature<GeoJSON.LineString, LegacyTrackProperties> {
    id: number;
}

export interface TrackProperties {}

export interface TrackFeature extends GeoJSON.Feature<GeoJSON.LineString, TrackProperties> {
    id: number;
}
