import React from 'react';
import * as turf from '@turf/turf';
import {TrackFeature} from '@src/types';
import {formatDuration} from '@src/utils/formatTime';

interface Props {
    feature: TrackFeature;
    replayPosition: number | null;
    onSetPosition: (position: number) => void;
}

const TrackReplayInfo: React.FC<Props> = (props) => {
    const {feature, replayPosition} = props;

    const clone = {...feature, properties: {...feature.properties}, geometry: {...feature.geometry}};
    if (replayPosition !== null) {
        clone.properties.timestamps = feature.properties.timestamps.slice(0, Math.max(1, replayPosition));
        clone.geometry.coordinates = feature.geometry.coordinates.slice(0, Math.max(1, replayPosition));
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

    const timelineRef = React.useRef<HTMLDivElement>();

    const setPositionFromClick = React.useCallback((e) => {
        if (timelineRef.current) {
            const {left, right} = timelineRef.current.getBoundingClientRect();
            const r = Math.max(0, Math.min((e.clientX - left) / (right - left), 1));
            props.onSetPosition(Math.round(feature.geometry.coordinates.length * r));
        }
    }, [timelineRef.current, props.onSetPosition]);

    // TODO : debounce?
    const onBarMouseMove = React.useCallback((e) => {
        if (e.buttons !== 0) {
            setPositionFromClick(e);
        }
    }, [setPositionFromClick]);

    // TODO : move/rename class names?
    return (
        <div>
            <div
                className="trackDetails-timeline"
                ref={timelineRef}
                onMouseDown={setPositionFromClick}
                onMouseMove={onBarMouseMove}
            >
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

export default TrackReplayInfo;
