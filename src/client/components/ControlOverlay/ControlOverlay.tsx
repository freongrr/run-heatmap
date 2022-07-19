import DropZone from "@src/client/components/DropZone";
import * as FormControls from "@src/client/components/FormControls";
import TrackDetails from '@src/client/components/TrackDetails';
import TrackList from '@src/client/components/TrackList';
import { Ticker } from '@src/client/hooks/useTicker';
import { RawDataView, TrackFeature } from '@src/shared/types';
import React from 'react';

interface Props {
    disabled: boolean;
    year: number | null;
    onSelectYear: (v: number | null) => void;
    sampling: number;
    onSelectSampling: (v: number) => void;
    rawDataView: RawDataView;
    onSelectRawDataView: (v: RawDataView) => void;
    onDropFiles: (files: File[]) => void;
    selectedFeatures: TrackFeature[];
    onDeselectFeatures: () => void;
    activeFeature: TrackFeature | null;
    onActiveFeature: (f: TrackFeature | null) => void;
    ticker: Ticker;
}

const ControlOverlay: React.FC<Props> = (props) => {
    const [visible, setVisible] = React.useState<boolean>(true);
    const onHideOverlay = React.useCallback(() => setVisible(false), [setVisible]);
    const onShowOverlay = React.useCallback(() => setVisible(true), [setVisible]);
    const onHideActiveTrack = React.useCallback(() => props.onActiveFeature(null), [props.onActiveFeature]);
    if (!visible) {
        return <div className="controlOverlay-icon" onClick={onShowOverlay}/>;
    } else {
        let content: React.ReactNode;
        if (props.activeFeature) {
            content = (
                <TrackDetails
                    feature={props.activeFeature}
                    ticker={props.ticker}
                    onDismiss={onHideActiveTrack}/>
            );
        } else if (props.selectedFeatures.length > 0) {
            content = (
                <TrackList
                    selectedFeatures={props.selectedFeatures}
                    onActiveFeature={props.onActiveFeature}
                    onDismiss={props.onDeselectFeatures}
                />
            );
        } else {
            content = (
                <>
                    <h2>Data</h2>
                    <DropZone label="📂 Drop GPX files here" onDrop={props.onDropFiles}/>
                    <h2>Render</h2>
                    <FormControls.YearSelect
                        value={props.year}
                        onSelect={props.onSelectYear}
                        disabled={props.disabled}
                    />
                    <FormControls.SamplingRateSelect
                        value={props.sampling}
                        onSelect={props.onSelectSampling}
                        disabled={props.disabled}
                    />
                    <FormControls.RawDataViewSelect
                        value={props.rawDataView}
                        onSelect={props.onSelectRawDataView}
                        disabled={props.disabled}
                    />
                </>
            );
        }
        return (
            <div className="controlOverlay">
                <div className="controlOverlay-close" onClick={onHideOverlay}>Close</div>
                {content}
            </div>
        );
    }
}

export default ControlOverlay;
