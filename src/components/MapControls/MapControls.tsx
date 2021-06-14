import React from 'react';

interface Props {
    year: number | null;
    onSelectYear: (v: number | null) => void;
    sampling: number;
    onSelectSampling: (v: number) => void;
    rawDataView: string;
    onSelectRawDataView: (v: string) => void;
}

// TODO : split into MapControls and ControlOverlay?
const MapControls: React.FC<Props> = (props) => {
    const years = [];
    for (let y = 2021; y >= 2013; y--) {
        years.push(y);
    }
    const onSelectYear = React.useCallback((e: any) => {
        if (e.target.value === '') {
            props.onSelectYear(null);
        } else {
            props.onSelectYear(+e.target.value);
        }
    }, [props.onSelectYear]);

    const samplingRates = [2, 4, 8, 16, 32, 64];
    const onSelectSamplingRate = React.useCallback((e: any) => {
        props.onSelectSampling(+e.target.value);
    }, [props.onSelectYear]);

    const onSelectRawDataView = React.useCallback((e: any) => {
        props.onSelectRawDataView(e.target.value);
    }, [props.onSelectRawDataView]);

    return (
        <div className="mapControls">
            <span className="control">
                <label>
                    Year:
                    <select value={props.year === null ? '' : props.year} onChange={onSelectYear}>
                        <option value="">All</option>
                        {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                    </select>
                </label>
            </span>
            <span className="control">
                <label>
                    Data sampling:
                    <select value={props.sampling === null ? '' : props.sampling} onChange={onSelectSamplingRate}>
                        {samplingRates.map((r) => <option key={r} value={String(r)}>1/{r}</option>)}
                    </select>
                </label>
            </span>
            <span className="control">
                <label>
                    Raw data:
                    <select value={props.rawDataView} onChange={onSelectRawDataView}>
                        <option value="Hidden">Hidden</option>
                        <option value="Tracks">Tracks</option>
                        <option value="Points">Points</option>
                    </select>
                </label>
            </span>
        </div>
    );
}

export default MapControls;
