import React from 'react';
import {TrackFeature} from '../../types';
import {formatTime} from '../../utils/formatTime';
import TrackReplayInfo from './TrackReplayInfo';

interface Props {
    feature: TrackFeature;
    replayPosition: number | null;
    onReplay: () => void;
    onDismiss: () => void;
}

const TrackDetails: React.FC<Props> = (props) => {
    const feature = props.feature;

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
                <TrackReplayInfo feature={feature} replayPosition={props.replayPosition}/>
            </div>
        </div>
    );
}

export default TrackDetails;
