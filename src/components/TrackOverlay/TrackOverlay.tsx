import React from 'react';
import {TrackFeature} from '../../types';
import TrackList from '../TrackList';
import TrackDetails from '../TrackDetails';
import {Ticker} from '../../hooks/useTicker';

interface Props {
    selectedFeatures: TrackFeature[];
    activeFeature: TrackFeature | null;
    ticker: Ticker;
    onActiveFeature: (f: TrackFeature | null) => void;
}

const TrackOverlay: React.FC<Props> = (props) => {
    return (
        <div className={'trackOverlay ' + (props.selectedFeatures.length === 0 ? 'trackOverlay_hidden' : '')}>
            {props.selectedFeatures.length > 0 && !props.activeFeature && (
                <TrackList selectedFeatures={props.selectedFeatures} onActiveFeature={props.onActiveFeature}/>
            )}
            {props.activeFeature && <TrackDetails
                feature={props.activeFeature}
                ticker={props.ticker}
                onDismiss={() => props.onActiveFeature(null)}
            />}
        </div>
    );
}

export default TrackOverlay;
