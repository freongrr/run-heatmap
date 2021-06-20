import React from 'react';
import {RawDataView} from '../../types';
import MapControls from '../MapControls';
import DropZone from '../DropZone';

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
            {/* TODO : MapControls does not help much now (props are exactly the same as here)
                       Split each field to its own component and use them here.
                       It will be easier to align them. */}
            <MapControls
                disabled={props.disabled}
                year={props.year}
                onSelectYear={props.onSelectYear}
                sampling={props.sampling}
                onSelectSampling={props.onSelectSampling}
                rawDataView={props.rawDataView}
                onSelectRawDataView={props.onSelectRawDataView}
            />
        </div>
    );
}

export default ControlOverlay;
