import React from 'react';

export interface Ticker {
    readonly status: 'stopped' | 'playing' | 'paused';
    readonly position: number;
    readonly play: () => void;
    readonly stop: () => void;
    readonly pause: () => void;
    readonly set: (position: number) => void;
}

export function useTicker(
    max: number | null,
    onStart: () => void,
    onTick: (i: number) => void,
    onStop: () => void
): Ticker {
    const [status, setStatus] = React.useState<'stopped' | 'playing' | 'paused'>('stopped');
    const [position, setPosition] = React.useState<number | null>(null);

    const play = React.useCallback(() => {
        if (max !== null) {
            if (status === 'stopped') {
                console.debug('Playing from 0');
                onStart();
                setStatus('playing');
                setPosition(0);
            } else if (status === 'paused') {
                console.debug('Resuming from ' + position);
                setStatus('playing');
            } else {
                console.debug(`Not playing because status is ${status}`);
            }
        } else {
            console.debug('Not playing because no active feature');
        }
    }, [max, onStart, status, setStatus, position, setPosition]);

    const pause = React.useCallback(() => {
        if (status === 'playing') {
            setStatus('paused');
        }
    }, [status, setStatus]);

    const stop = React.useCallback(() => {
        if (status !== 'stopped') {
            console.debug(`Stopping playback from status ${status} at ${position}`);
            onStop();
            setStatus('stopped');
            setPosition(null);
        } else {
            console.debug(`Not stopping because status is ${status}`);
        }
    }, [onStop, status, setStatus, setPosition]);

    const set = React.useCallback((newPosition: number) => {
        console.debug(`Setting position to ${newPosition}`);
        setPosition(newPosition);
        onTick(newPosition);
        if (status === 'stopped') {
            setStatus('paused');
        }
    }, [status, setPosition, onTick]);

    React.useEffect(() => {
        if (max !== null && status === 'playing') {
            // TODO : start and finish slowly and accelerate in the middle
            if (position < max) {
                onTick(position);
                let cancelled = false;
                setTimeout(() => {
                    if (!cancelled) {
                        setPosition(position + 1);
                    }
                }, 10);
                return () => {
                    //console.debug('Cancelling timer');
                    cancelled = true;
                };
            } else {
                setStatus('paused');
            }
        } else if (status !== 'stopped' && max === null) {
            stop();
        }
    }, [max, onTick, status, setStatus, position, setPosition]);

    return {status, position, play, pause, stop, set};
}
