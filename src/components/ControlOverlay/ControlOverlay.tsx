import React from 'react';
import {RawDataView} from '../../types';
import DropZone from '../DropZone';
import * as MapControls from '../MapControls';

interface Props {
    disabled: boolean;
    year: number | null;
    onSelectYear: (v: number | null) => void;
    sampling: number;
    onSelectSampling: (v: number) => void;
    rawDataView: RawDataView;
    onSelectRawDataView: (v: RawDataView) => void;
    onDropFiles: (files: File[]) => void;
}

const ControlOverlay: React.FC<Props> = (props) => {
    return (
        <div className="controlOverlay">
            <DropZone onDrop={props.onDropFiles}/>
            <MapControls.YearSelect value={props.year} onSelect={props.onSelectYear} disabled={props.disabled}/>
            <MapControls.SamplingRateSelect value={props.sampling} onSelect={props.onSelectSampling} disabled={props.disabled}/>
            <MapControls.RawDataViewSelect value={props.rawDataView} onSelect={props.onSelectRawDataView} disabled={props.disabled}/>
        </div>
    );
}

export default ControlOverlay;
