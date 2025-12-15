import React, { useState, useEffect, useRef } from 'react';
import { convert } from '../../utils/measurements';

export default function InputNumber({
    valueMm,
    unit,
    onChange,
    className,
    disabled,
    min = 0, // Se asume que viene en milímetros
    step = 0.1
}) {
    // Convertimos el valor MM a la unidad visual para mostrar
    const formatValue = (mm) => convert(mm, unit);

    // CORRECCIÓN CLAVE: Convertimos el min (mm) a la unidad visual para el atributo HTML
    // Si estamos en 'mm' (sin decimales), un min de 195.9mm se convierte en "196"
    // Esto fuerza al input nativo a detenerse en 196 y no mostrar 195.9
    const displayMin = convert(min, unit);

    // Estado local para controlar lo que se ve en pantalla
    const [localValue, setLocalValue] = useState(formatValue(valueMm));
    const inputRef = useRef(null);

    // Sincronizar cuando cambia el valor externo
    useEffect(() => {
        if (document.activeElement !== inputRef.current) {
            setLocalValue(formatValue(valueMm));
        }
    }, [valueMm, unit]);

    const handleChange = (e) => {
        const val = e.target.value;
        setLocalValue(val);

        if (val === '') {
            // Permitimos borrar visualmente enviando 0
            onChange(0);
        } else {
            const num = parseFloat(val);
            if (!isNaN(num)) {
                onChange(num); // Enviamos el número en la unidad actual
            }
        }
    };

    const handleBlur = () => {
        // Al salir, formateamos al valor real (esto corrige si el usuario dejó algo inválido o vacío)
        setLocalValue(formatValue(valueMm));
    };

    return (
        <input
            ref={inputRef}
            type="number"
            step={step}
            min={displayMin} // Usamos el mínimo convertido a la unidad visual
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={`${className} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto`}
            placeholder="0"
        />
    );
}


