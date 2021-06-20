import React from 'react';
import {RawDataView} from '../../types';

interface Props<T> {
    value: T;
    disabled?: boolean;
    onSelect: (v: T) => void;
}

interface SelectProps {
    label: string;
    value: string;
    disabled: boolean;
    onSelect: (v: string) => void;
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = (props) => {
    const onSelect = React.useCallback((e: any) => {
        props.onSelect(e.target.value);
    }, [props.onSelect]);

    return (
        <div className="controlSelect">
            <label>
                {props.label}:
                <select value={props.value} onChange={onSelect} disabled={props.disabled}>
                    {props.children}
                </select>
            </label>
        </div>
    );
}

export const YearSelect: React.FC<Props<number | null>> = (props) => {
    const years = [];
    for (let y = 2021; y >= 2013; y--) {
        years.push(y);
    }
    const onSelectYear = React.useCallback((v: string) => {
        if (v === '') {
            props.onSelect(null);
        } else {
            props.onSelect(+v);
        }
    }, [props.onSelect]);

    const stringValue = props.value === null ? '' : String(props.value);
    return (
        <Select label="Year" value={stringValue} onSelect={onSelectYear} disabled={props.disabled}>
            <option value="">All</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </Select>
    );
}

export const SamplingRateSelect: React.FC<Props<number>> = (props) => {
    const samplingRates = [2, 4, 8, 16, 32, 64];
    const onSelectSamplingRate = React.useCallback((v: string) => {
        props.onSelect(+v);
    }, [props.onSelect]);

    const stringValue = String(props.value);
    return (
        <Select label="Data sampling" value={stringValue} onSelect={onSelectSamplingRate} disabled={props.disabled}>
            {samplingRates.map((r) => <option key={r} value={String(r)}>1/{r}</option>)}
        </Select>
    );
};

export const RawDataViewSelect: React.FC<Props<RawDataView>> = (props) => (
    <Select label="Raw data" value={props.value} onSelect={props.onSelect} disabled={props.disabled}>
        <option value="Hidden">Hidden</option>
        <option value="Tracks">Tracks</option>
        <option value="Points">Points</option>
    </Select>
);
