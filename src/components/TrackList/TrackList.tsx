import React from 'react';
import {TrackFeature} from '../../types';
import {formatTime} from '../../utils/formatTime';

interface Props {
    selectedFeatures: TrackFeature[];
    onActiveFeature: (f: TrackFeature) => void;
}

const TrackList: React.FC<Props> = (props) => {
    const {selectedFeatures} = props;

    let title;
    if (selectedFeatures.length > 1) {
        title = `${selectedFeatures.length} tracks selected`;
    } else {
        title = `${selectedFeatures.length} track selected`;
    }

    const makeClickHandler = (f: TrackFeature) => {
        return (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            props.onActiveFeature(f);
        };
    };

    return (
        <div className="trackList">
            <h2>{title}</h2>
            {selectedFeatures.slice(0, Math.min(selectedFeatures.length, 10)).map((f) => {
                return (
                    <div key={f.properties.trackId}>
                        <a href="#" onClick={makeClickHandler(f)}>
                            {f.properties.description} ({formatTime(f.properties.time)})
                        </a>
                    </div>
                );
            })}
        </div>
    );
}

export default TrackList;
