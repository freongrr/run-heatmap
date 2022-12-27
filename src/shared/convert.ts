import { Track, TrackFeature } from '@src/shared/types';

export function convertTrackToFeature(track: Track): TrackFeature {
    return {
        id: track.id,
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: track.coordinates
        }
    }
}
