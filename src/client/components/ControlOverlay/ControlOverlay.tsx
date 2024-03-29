import DropZone from "@src/client/components/DropZone";
import * as FormControls from "@src/client/components/FormControls";
import TrackDetails from '@src/client/components/TrackDetails';
import TrackList from '@src/client/components/TrackList';
import { Ticker } from '@src/client/hooks/useTicker';
import { RawDataView, Track } from '@src/shared/types';
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
    selectedTracks: Track[];
    onDeselectTracks: () => void;
    activeTrack: Track | null;
    onActiveTrack: (f: Track | null) => void;
    ticker: Ticker;
}

const ControlOverlay: React.FC<Props> = (props) => {
    const [visible, setVisible] = React.useState<boolean>(true);
    const onHideOverlay = React.useCallback(() => setVisible(false), [setVisible]);
    const onShowOverlay = React.useCallback(() => setVisible(true), [setVisible]);
    const onHideActiveTrack = React.useCallback(() => props.onActiveTrack(null), [props.onActiveTrack]);
    if (!visible) {
        return <div className="controlOverlay-icon" onClick={onShowOverlay}/>;
    } else {
        let content: React.ReactNode;
        if (props.activeTrack) {
            content = (
                <TrackDetails
                    track={props.activeTrack}
                    ticker={props.ticker}
                    onDismiss={onHideActiveTrack}/>
            );
        } else if (props.selectedTracks.length > 0) {
            content = (
                <TrackList
                    selectedTracks={props.selectedTracks}
                    onActiveTrack={props.onActiveTrack}
                    onDismiss={props.onDeselectTracks}
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
