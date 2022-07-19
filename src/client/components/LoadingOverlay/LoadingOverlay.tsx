import React from 'react';

interface Props {
    error?: string;
}

const LoadingOverlay: React.FC<Props> = (props) => {
    return (
        <div className="loadingOverlay">
            <div className="loadingOverlay-content">
                {props.error && <div className="loadingOverlay-content-error">{props.error}</div>}
                {!props.error && "Please wait..."}
            </div>
        </div>
    );
}

export default LoadingOverlay;
