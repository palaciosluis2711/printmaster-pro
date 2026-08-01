import React, { useState, useEffect, useRef } from 'react';
import { convert } from '../../utils/measurements';

export default function InputNumber({
    valueMm,
    unit,
    onChange,
    className = '',
    disabled = false,
    min = 0,
    max,
    step = 0.1,
    placeholder = '0'
}) {
    const formatValue = (mm) => convert(mm, unit);
    const displayMin = convert(min, unit);
    const displayMax = max !== undefined ? convert(max, unit) : undefined;

    const [localValue, setLocalValue] = useState(formatValue(valueMm));
    const inputRef = useRef(null);

    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalValue(formatValue(valueMm));
        }
    }, [valueMm, unit]);

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalValue(val);

        if (val === '') {
            onChange(0);
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                onChange(num);
            }
        }
    };

    const handleBlur = () => {
        setLocalValue(formatValue(valueMm));
    };

    return (
        <input
            ref={inputRef}
            type="number"
            step={step}
            min={displayMin}
            max={displayMax}
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            placeholder={placeholder}
            className={`border border-slate-300 rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800'} ${className}`}
        />
    );
}
