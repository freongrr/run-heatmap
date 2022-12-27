import { formatDuration } from '@src/client/utils/formatTime';
import { convertTrackToFeature } from '@src/shared/convert';
import { Track } from '@src/shared/types';
import { lineDistance } from '@turf/turf';
import React from 'react';

interface Props {
    track: Track;
    replayPosition: number | null;
    onSetPosition: (position: number) => void;
}

const TrackReplayInfo: React.FC<Props> = (props) => {
    const { track, replayPosition } = props;

    const clone: Track = { ...track };
    if (replayPosition !== null) {
        clone.coordinates = track.coordinates.slice(0, Math.max(1, replayPosition));
        clone.coordinateTimes = track.coordinateTimes.slice(0, Math.max(1, replayPosition));
    }

    const formattedDistance = Math.round(getDistanceInKms(clone) * 100) / 100 + 'km';
    const formattedDuration = formatDuration(getDurationInMillis(clone));

    const progressPct = replayPosition === null
        ? 100
        : 100 * (replayPosition / track.coordinates.length);

    const timelineRef = React.useRef<HTMLDivElement>();

    const setPositionFromClick = React.useCallback((e) => {
        if (timelineRef.current) {
            const { left, right } = timelineRef.current.getBoundingClientRect();
            const r = Math.max(0, Math.min((e.clientX - left) / (right - left), 1));
            props.onSetPosition(Math.round(track.coordinates.length * r));
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
                <div className="trackDetails-timeline-cursor" style={{ left: progressPct + '%' }}/>
            </div>
            <div className="trackDetails-numbers">
                <div className="trackDetails-numbers-distance">Distance: {formattedDistance}</div>
                <div className="trackDetails-numbers-duration">Time: {formattedDuration}</div>
            </div>
        </div>
    );
}

function getDistanceInKms(track: Track): number {
    const feature = convertTrackToFeature(track);
    return lineDistance(feature, { units: 'kilometers' });
}

function getDurationInMillis(track: Track): number {
    const startTime = new Date(track.timestamp + track.coordinateTimes[0]);
    const endTime = new Date(track.timestamp + track.coordinateTimes[track.coordinateTimes.length - 1]);
    return endTime.getTime() - startTime.getTime();
}

export default TrackReplayInfo;
