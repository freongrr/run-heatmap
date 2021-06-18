import React from 'react';
import {Replay, TrackFeature} from './types';
import MapWrapper from './map';

// TODO : move somewhere else
export function useReplay(mapWrapper: MapWrapper, feature: TrackFeature | null): Replay {
    const [status, setStatus] = React.useState<'stopped' | 'playing' | 'paused'>('stopped');
    const [position, setPosition] = React.useState<number | null>(null);

    const play = React.useCallback(() => {
        if (feature) {
            if (status === 'stopped') {
                console.log('Playing from 0');
                mapWrapper.enterReplay(feature);
                setStatus('playing');
                setPosition(0);
            } else if (status === 'paused') {
                console.log('Resuming from ' + position);
                setStatus('playing');
            } else {
                console.log('Not playing because status is ' + status);
            }
        } else {
            console.log('Not playing because no active feature');
        }
    }, [mapWrapper, feature, status, setStatus, position, setPosition]);

    const pause = React.useCallback(() => {
        if (status === 'playing') {
            setStatus('paused');
        }
    }, [mapWrapper, status, setStatus, setPosition]);

    const stop = React.useCallback(() => {
        if (status !== 'stopped') {
            console.log('Stopping replay from status ' + status + ' at ' + position);
            mapWrapper.exitReplay();
            setStatus('stopped');
            setPosition(null);
        } else {
            console.log('Not stopping because status is ' + status);
        }
    }, [mapWrapper, status, setStatus, setPosition]);

    React.useEffect(() => {
        if (feature && status === 'playing') {
            // TODO : start and finish slowly and accelerate in the middle
            if (position < feature.geometry.coordinates.length) {
                mapWrapper.setReplayPosition(feature, position);
                let cancelled = false;
                setTimeout(() => {
                    if (!cancelled) {
                        setPosition(position + 1);
                    }
                }, 10);
                return () => {
                    //console.log('Cancelling timer');
                    cancelled = true;
                };
            } else {
                setStatus('paused');
            }
        } else if (status !== 'stopped' && !feature) {
            stop();
        }
    }, [mapWrapper, feature, status, setStatus, position, setPosition]);

    return {status, position, play, pause, stop};
}
