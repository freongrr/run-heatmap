import React from 'react';
import {TrackFeatureLike} from '../../types';

interface Props {
    selectedFeatures: TrackFeatureLike[];
}

const TrackList: React.FC<Props> = (props) => {
    const {selectedFeatures} = props;

    let title;
    if (selectedFeatures.length > 1) {
        title = `${selectedFeatures.length} tracks selected`;
    } else {
        title = `${selectedFeatures.length} track selected`;
    }

    return (
        <div className="trackList">
            <h2>{title}</h2>
            {selectedFeatures.slice(0, Math.min(selectedFeatures.length, 10)).map((f) => {
                return (
                    <div key={f.properties.trackId}>
                        <a href={'https://www.strava.com/activities/' + f.properties.trackId}>
                            {f.properties.description} ({formatTime(f.properties.time)})
                        </a>
                    </div>
                );
            })}
        </div>
    );
}

function formatTime(timeString: string): string {
    // Raw format: 2014-12-07T05:54:07Z)
    // TODO : better format including local time?
    return timeString.substring(0, 10)
}

export default TrackList;
