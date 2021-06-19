import React from 'react';
import {TrackFeature} from '../../types';
import {formatTimestampAsDatetime} from '../../utils/formatTime';
import TrackReplayInfo from './TrackReplayInfo';
import {Ticker} from '../../hooks/useTicker';

interface Props {
    feature: TrackFeature;
    ticker: Ticker;
    onDismiss: () => void;
}

const TrackDetails: React.FC<Props> = (props) => {
    const {feature, ticker} = props;

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
                    <a href={'https://www.strava.com/activities/' + feature.id} target="_blank">
                        Open in Strava ↑
                    </a>
                </div>
            </div>

            <h2>{feature.properties.description}</h2>
            <div className="trackDetails-datetime">{formatTimestampAsDatetime(feature.properties.timestamps[0])}</div>

            <div className="trackDetails-timeline-wrapper">
                <div>
                    <button onClick={ticker.play} disabled={ticker.status === 'playing'}>▶️</button>
                    <button onClick={ticker.pause} disabled={ticker.status !== 'playing'}>⏸</button>
                    <button onClick={ticker.stop} disabled={ticker.status === 'stopped'}>⏹</button>
                </div>
                <TrackReplayInfo feature={feature} replayPosition={ticker.position}/>
            </div>
        </div>
    );
}

export default TrackDetails;
