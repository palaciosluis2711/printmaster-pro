import React from 'react';

const VARIANTS = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:bg-blue-300',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 disabled:opacity-50',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm disabled:opacity-50',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm disabled:bg-purple-300',
    pink: 'bg-pink-600 hover:bg-pink-700 text-white shadow-sm disabled:bg-pink-300',
    danger: 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 disabled:opacity-50',
    ghost: 'hover:bg-slate-100 text-slate-600 disabled:opacity-50'
};

const SIZES = {
    xs: 'px-2 py-1 text-[10px] rounded',
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-5 py-2.5 text-base rounded-xl font-bold'
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    className = '',
    disabled = false,
    onClick,
    type = 'button',
    ...props
}) {
    const variantClasses = VARIANTS[variant] || VARIANTS.primary;
    const sizeClasses = SIZES[size] || SIZES.md;

    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            className={`font-medium inline-flex items-center justify-center gap-1.5 transition active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${variantClasses} ${sizeClasses} ${className}`}
            {...props}
        >
            {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
            {children}
            {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </button>
    );
}
