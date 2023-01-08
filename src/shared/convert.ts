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

export function sampleTrack(track: Track, sampling: number): Track {
    if (sampling < track.sampling) {
        throw new Error(`Requested sampling is too low (${sampling} < ${track.sampling})`);
    } else if (sampling === track.sampling) {
        return track;
    } else {
        return {
            ...track,
            sampling: sampling,
            coordinates: track.coordinates.filter((c, i) => i % sampling / track.sampling === 0),
            coordinateSeconds: track.coordinateSeconds.filter((s, i) => i % sampling / track.sampling === 0)
        };
    }
}
