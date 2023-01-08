import { formatTimestampAsDate } from '@src/client/utils/formatTime';
import { Track } from '@src/shared/types';
import React from 'react';

interface Props {
    selectedTracks: Track[];
    onActiveTrack: (t: Track) => void;
    onDismiss: () => void;
}

const TrackList: React.FC<Props> = (props) => {
    const { selectedTracks } = props;

    let title;
    if (selectedTracks.length > 1) {
        title = `${selectedTracks.length} tracks selected`;
    } else {
        title = `${selectedTracks.length} track selected`;
    }

    const makeClickHandler = (t: Track) => {
        return (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            props.onActiveTrack(t);
        };
    };

    const sortedTracks = selectedTracks
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, Math.min(selectedTracks.length, 10));

    // TODO : highlight the track on mouse over?
    return (
        <div className="trackList">
            <h2>{title}</h2>
            {sortedTracks.map((t) => {
                return (
                    <div key={t.id}>
                        <a href="#" onClick={makeClickHandler(t)}>
                            {t.description} ({formatTimestampAsDate(t.timestamp)})
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
