import React from 'react';

export default function Slider({
    label,
    value,
    displayValue,
    unit = '',
    min = 0,
    max = 100,
    step = 1,
    onChange,
    disabled = false,
    color = 'blue',
    className = ''
}) {
    const colorClasses = {
        blue: 'accent-blue-600 bg-blue-200',
        purple: 'accent-purple-600 bg-purple-200',
        pink: 'accent-pink-600 bg-pink-200',
        emerald: 'accent-emerald-600 bg-emerald-200',
        slate: 'accent-slate-600 bg-slate-200'
    }[color] || 'accent-blue-600 bg-slate-200';

    return (
        <div className={`space-y-1 ${className}`}>
            {label && (
                <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="font-mono text-slate-700 font-bold">
                        {displayValue !== undefined ? displayValue : value} {unit}
                    </span>
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${colorClasses}`}
            />
        </div>
    );
}
