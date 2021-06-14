import React from 'react';

interface Props {
}

const TrackDetails: React.FC<Props> = (props) => {
    return (
        <div className="trackDetails">
            <div className="trackDetails-links two-columns">
                <div className="trackDetails-links-left"><a href="">← Back</a></div>
                <div className="trackDetails-links-right"><a href="">Open in Strava ↑</a></div>
            </div>

            <h2>Evening Run</h2>
            <div className="trackDetails-datetime">2021-06-13 17:30</div>

            <div className="trackDetails-timeline-wrapper">
                <div>
                    <button>&gt;</button>
                </div>
                <div>
                    <div className="trackDetails-timeline">
                        <div className="trackDetails-timeline-bar"/>
                        <div className="trackDetails-timeline-cursor"/>
                    </div>
                    <div className="trackDetails-numbers">
                        <div className="trackDetails-numbers-distance">Distance: 6.03km</div>
                        <div className="trackDetails-numbers-duration">Time: 31m 45s</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TrackDetails;
