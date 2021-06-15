import React from 'react';
import {TrackFeature} from '../../types';
import TrackList from '../TrackList';
import TrackDetails from '../TrackDetails';

interface Props {
    selectedFeatures: TrackFeature[];
    activeFeature: TrackFeature | null;
    replayPosition: number | null;
    onActiveFeature: (f: TrackFeature | null) => void;
    onReplayFeature: () => void;
}

const TrackOverlay: React.FC<Props> = (props) => {
    return (
        <div className={'trackOverlay ' + (props.selectedFeatures.length === 0 ? 'trackOverlay_hidden' : '')}>
            {props.selectedFeatures.length > 0 && !props.activeFeature && (
                <TrackList selectedFeatures={props.selectedFeatures} onActiveFeature={props.onActiveFeature}/>
            )}
            {props.activeFeature && <TrackDetails
                feature={props.activeFeature}
                replayPosition={props.replayPosition}
                onReplay={props.onReplayFeature}
                onDismiss={() => props.onActiveFeature(null)}
            />}
        </div>
    );
}

export default TrackOverlay;
