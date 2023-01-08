import { Ticker } from '@src/client/hooks/useTicker';
import { formatTimestampAsDatetime } from '@src/client/utils/formatTime';
import { Track } from '@src/shared/types';
import React from 'react';
import TrackReplayInfo from './TrackReplayInfo';

interface Props {
    track: Track;
    ticker: Ticker;
    onDismiss: () => void;
}

const TrackDetails: React.FC<Props> = (props) => {
    const { track, ticker } = props;

    const onClickDismiss = React.useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        props.onDismiss()
    }, [props.onDismiss]);

    return (
        <div className="trackDetails">
            <h2>{track.description}</h2>
            <div className="trackDetails-datetime">
                {formatTimestampAsDatetime(track.timestamp, track.coordinateSeconds[0])}
            </div>

            <div className="trackDetails-timeline-wrapper">
                <div>
                    <button onClick={ticker.play} disabled={ticker.status === 'playing'}>▶️</button>
                    <button onClick={ticker.pause} disabled={ticker.status !== 'playing'}>⏸️</button>
                    <button onClick={ticker.stop} disabled={ticker.status === 'stopped'}>⏹️</button>
                </div>
                <TrackReplayInfo track={track} replayPosition={ticker.position} onSetPosition={ticker.set}/>
            </div>

            <div className="trackDetails-links two-columns">
                <div className="trackDetails-links-left">
                    <a href="#" onClick={onClickDismiss}>← Back</a>
                </div>
                <div className="trackDetails-links-right">
                    <a href={'https://www.strava.com/activities/' + track.id} target="_blank">
                        Open in Strava ↑
                    </a>
                </div>
            </div>
        </div>
    );
}

export default TrackDetails;
