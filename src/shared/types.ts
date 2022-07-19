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

/*
export interface TrackProperties {
    description: string;
    type: number;
    timestamps: number[];
}

// extends FeatureCollection<LineString, TrackProperties>
export interface TrackFeatureCollection {
    type: "FeatureCollection";
    features: [TrackFeature]; // i.e. exactly one feature
}

// extends Feature<LineString, TrackProperties>
export interface TrackFeature {
    id: number;
    type: "Feature",
    geometry: {
        type: "LineString";
        coordinates: number[][];
    };
    properties: TrackProperties;
}
*/
/*
const a: TrackFeatureCollection = {
    type: 'FeatureCollection',
    features: [{
        id: 123,
        type: 'Feature',
        properties: {
            type: TYPE_RUN,
            description: 'foo',
            timestamps: [123]
        },
        geometry: {
            type: 'LineString',
            coordinates: [[0, 1, 2]]
        }
    }]
};

const b: FeatureCollection<LineString, TrackProperties> = a;
*/
