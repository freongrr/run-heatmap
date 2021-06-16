import React from 'react';
import {Replay, TrackFeature} from '../../types';
import {formatTime} from '../../utils/formatTime';
import TrackReplayInfo from './TrackReplayInfo';

interface Props {
    feature: TrackFeature;
    replay: Replay;
    onDismiss: () => void;
}

const TrackDetails: React.FC<Props> = (props) => {
    const {feature, replay} = props;

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
                    <button onClick={replay.play} disabled={replay.status === 'playing'}>▶️</button>
                    <button onClick={replay.pause} disabled={replay.status !== 'playing'}>⏸</button>
                    <button onClick={replay.stop} disabled={replay.status === 'stopped'}>⏹</button>
                </div>
                <TrackReplayInfo feature={feature} replayPosition={replay.position}/>
            </div>
        </div>
    );
}

export default TrackDetails;
