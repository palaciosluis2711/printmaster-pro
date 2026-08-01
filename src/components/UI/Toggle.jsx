import React from 'react';

export default function Toggle({
    id,
    label,
    checked,
    onChange,
    disabled = false,
    color = 'blue',
    icon: Icon,
    className = ''
}) {
    const colorClasses = {
        blue: 'text-blue-600 focus:ring-blue-500',
        purple: 'text-purple-600 focus:ring-purple-500',
        pink: 'text-pink-600 focus:ring-pink-500',
        emerald: 'text-emerald-600 focus:ring-emerald-500'
    }[color] || 'text-blue-600 focus:ring-blue-500';

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
                className={`rounded w-4 h-4 cursor-pointer disabled:cursor-not-allowed ${colorClasses}`}
            />
            {label && (
                <label
                    htmlFor={id}
                    className="text-xs font-medium text-slate-600 cursor-pointer select-none flex items-center gap-1.5"
                >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {label}
                </label>
            )}
        </div>
    );
}
