import React from 'react';

interface Props {
    label: string;
    value: string;
    disabled: boolean;
    onSelect: (v: string) => void;
    children: React.ReactNode;
}

const Select: React.FC<Props> = (props) => {
    const onSelect = React.useCallback((e: any) => {
        props.onSelect(e.target.value);
    }, [props.onSelect]);

    return (
        <div className="formControl">
            <label>
                {props.label}:
                <select value={props.value} onChange={onSelect} disabled={props.disabled}>
                    {props.children}
                </select>
            </label>
        </div>
    );
}

export default Select;
