import React from 'react';
import * as turf from '@turf/turf';
import {TrackFeature} from '../../types';

interface Props {
    feature: TrackFeature;
    replayPosition: number | null;
}

const TrackReplayInfo: React.FC<Props> = (props) => {
    const {feature, replayPosition} = props;

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

    // TODO : move/rename class names?
    return (
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
    );
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

export default TrackReplayInfo;
