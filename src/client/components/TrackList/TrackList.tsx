import { formatTimestampAsDate } from '@src/client/utils/formatTime';
import { TrackFeature } from '@src/shared/types';
import React from 'react';

interface Props {
    selectedFeatures: TrackFeature[];
    onActiveFeature: (f: TrackFeature) => void;
    onDismiss: () => void;
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

    const sortedFeatures = selectedFeatures
        .sort((a, b) => b.properties.timestamps[0] - a.properties.timestamps[0])
        .slice(0, Math.min(selectedFeatures.length, 10));

    // TODO : highlight the track on mouse over?
    return (
        <div className="trackList">
            <h2>{title}</h2>
            {sortedFeatures.map((f) => {
                return (
                    <div key={f.id}>
                        <a href="#" onClick={makeClickHandler(f)}>
                            {f.properties.description} ({formatTimestampAsDate(f.properties.timestamps[0])})
                        </a>
                    </div>
                );
            })}
            <div className="trackList-links">
                <a href="#" onClick={props.onDismiss}>← Back</a>
            </div>
        </div>
    );
}

export default TrackList;