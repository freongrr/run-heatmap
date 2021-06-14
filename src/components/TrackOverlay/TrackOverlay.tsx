import React from 'react';
import TrackList from '../TrackList';
import {TrackFeatureLike} from '../../types';

interface Props {
    selectedFeatures: TrackFeatureLike[];
}

const TrackOverlay: React.FC<Props> = (props) => {
    return (
        <div className={'trackOverlay ' + (props.selectedFeatures.length === 0 ? 'trackOverlay_hidden' : '')}>
            {props.selectedFeatures.length > 0 && <TrackList selectedFeatures={props.selectedFeatures} />}
            {/*<TrackDetails/>*/}
        </div>
    );
}

export default TrackOverlay;
