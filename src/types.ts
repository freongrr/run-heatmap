// TODO : fine a good place for that

export interface TrackFeatureCollection {
    type: 'FeatureCollection';
    features: TrackFeature[];
}

export type PointCoordinate = [number, number];

export interface TrackFeature {
    type: 'Feature';
    properties: {
        trackId: string;
        description: string;
        time: string;
    };
    geometry: {
        type: 'LineString',
        coordinates: PointCoordinate[];
    };
}
