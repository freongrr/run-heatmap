import React from 'react';
import * as turf from '@turf/turf';
import {TrackFeature} from '../../types';
import {formatTime} from '../../utils/formatTime';

interface Props {
    feature: TrackFeature;
    replayPosition: number | null;
    onReplay: () => void;
    onDismiss: () => void;
}

const TrackDetails: React.FC<Props> = (props) => {
    const feature = props.feature;
    const {distance, duration, progressPct} = getTrackInfo(feature, props.replayPosition);

    const onClickDismiss = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        props.onDismiss()
    }, [props.onDismiss]);

    return (
        <div className="trackDetails">
            <div className="trackDetails-links two-columns">
                <div className="trackDetails-links-left">
                    <a href="#" onClick={onClickDismiss}>← Back</a>
                </div>
                <div className="trackDetails-links-right">
                    <a href={'https://www.strava.com/activities/' + feature.properties.trackId} target="_blank">
                        Open in Strava ↑
                    </a>
                </div>
            </div>

            <h2>{feature.properties.description}</h2>
            <div className="trackDetails-datetime">{formatTime(feature.properties.time)}</div>

            <div className="trackDetails-timeline-wrapper">
                <div>
                    <button onClick={props.onReplay}>&gt;</button>
                </div>
                <div>
                    <div className="trackDetails-timeline">
                        <div className="trackDetails-timeline-bar"/>
                        <div className="trackDetails-timeline-cursor" style={{left: progressPct + '%'}}/>
                    </div>
                    <div className="trackDetails-numbers">
                        <div className="trackDetails-numbers-distance">Distance: {distance}</div>
                        <div className="trackDetails-numbers-duration">Time: {duration}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTrackInfo(feature: TrackFeature, replayPosition: number): { distance: string; duration: string; progressPct: number } {
    const clone = {...feature, properties: {...feature.properties}, geometry: {...feature.geometry}};
    if (replayPosition !== null) {
        clone.properties.timestamps = feature.properties.timestamps.slice(0, replayPosition);
        clone.geometry.coordinates = feature.geometry.coordinates.slice(0, replayPosition);
    }

    const rawDistance = turf.lineDistance(clone, {units: 'kilometers'});
    const distance = Math.round(rawDistance * 100) / 100 + 'km';

    const startTime = new Date(clone.properties.timestamps[0]);
    const endTime = new Date(clone.properties.timestamps[clone.properties.timestamps.length - 1]);
    const durationInMillis = endTime.getTime() - startTime.getTime();
    const duration = formatDuration(durationInMillis);

    const progressPct = replayPosition === null
        ? 100
        : 100 * (replayPosition / feature.geometry.coordinates.length);

    return {distance, duration, progressPct};
}

function formatDuration(durationInMillis: number): string {
    let remainingInSeconds = durationInMillis / 1000;
    const parts: string[] = [];
    if (remainingInSeconds > 3600) {
        const hours = Math.floor(remainingInSeconds / 3600);
        remainingInSeconds = remainingInSeconds % 3600;
        parts.push(hours + 'h');
    }
    if (parts.length > 0 || remainingInSeconds > 60) {
        const minutes = Math.floor(remainingInSeconds / 60);
        remainingInSeconds = remainingInSeconds % 60;
        parts.push(padTo2(minutes) + 'm');
    }
    parts.push(padTo2(remainingInSeconds) + 's');
    return parts.join(' ');
}

function padTo2(n: number): string {
    return n < 10 ? '0' + n : '' + n;
}

export default TrackDetails;
