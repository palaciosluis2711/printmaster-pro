import React, { useMemo } from 'react';
import { mmToPx } from '../../utils/measurements';

export default function BannerCanvas({
    config,
    pageIndex,
    layout, // layout contiene info de la página física
    isPreview
}) {

    // 1. Convertir la altura de letra deseada (mm) a píxeles
    // Factor 3.7795 es estándar para 96 DPI (1mm = 3.78px)
    // Pero para mejor calidad de texto en canvas, a veces se usa un multiplicador,
    // aquí usaremos el estándar del sistema.
    const fontSizePx = mmToPx(config.bannerHeight);

    // 2. Definir fuente
    const fontStyle = `${config.bannerStyle === 'italic' ? 'italic ' : ''}${config.bannerStyle === 'bold' ? 'bold ' : ''}`;
    const fontString = `${fontStyle}${fontSizePx}px "${config.bannerFont}", sans-serif`;

    // 3. Medir el texto para obtener el ancho total
    const textMetrics = useMemo(() => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.font = fontString;
        const metrics = ctx.measureText(config.bannerText);

        // Altura real aproximada (ascent + descent)
        const actualHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        return {
            width: metrics.width,
            height: actualHeight, // Altura visual real del texto
            fullHeight: fontSizePx // Altura de caja reservada (line-height 1)
        };
    }, [config.bannerText, fontString]);

    // --- RENDERIZADO DE VISTA PREVIA (Una sola tira larga) ---
    if (isPreview) {
        // Calculamos cuántas páginas de ancho ocupa realmente
        // layout.contentWidth es el ancho ÚTIL de una página (sin márgenes) en mm
        const contentWidthPx = mmToPx(layout.contentWidth);
        const contentHeightPx = mmToPx(layout.contentHeight);

        // Ancho total en píxeles del banner completo
        const bannerTotalWidthPx = textMetrics.width;

        // Número de hojas necesarias (Ancho)
        const sheetsX = Math.ceil(bannerTotalWidthPx / contentWidthPx);

        // Altura: Si la letra es más alta que una hoja, se necesitarán más filas
        const sheetsY = Math.ceil(textMetrics.fullHeight / contentHeightPx);

        // Estilos para el contenedor de vista previa (se pasa al padre para dimensionar)
        // Pero aquí renderizamos el contenido visual

        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
            }}>
                {/* TEXTO RENDERIZADO */}
                <div style={{
                    font: fontString,
                    color: config.bannerColor,
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                    transformOrigin: 'center',
                    // Centrado absoluto si es necesario
                }}>
                    {config.bannerText}
                </div>

                {/* LÍNEAS DE CORTE (Grid Overlay) */}
                {/* Calculamos dónde caen los cortes basándonos en el tamaño de página */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* La lógica aquí es compleja porque el texto "flota" en el centro.
                   Para simplificar la vista previa visual, pintaremos las líneas 
                   relativas al texto.
                */}
                </div>
            </div>
        );
    }

    // --- RENDERIZADO DE PÁGINA INDIVIDUAL (Modo Procesado) ---

    // Calcular posición para esta página específica
    // layout.colsP y layout.rowsP vienen del cálculo global en MainCanvas
    const colIndex = pageIndex % layout.colsP;
    const rowIndex = Math.floor(pageIndex / layout.colsP);

    // Offset: Cuánto debemos mover el texto hacia la izquierda/arriba 
    // para que la parte correspondiente a esta página quede visible en el viewport
    const offsetX = -(colIndex * mmToPx(layout.contentWidth));
    const offsetY = -(rowIndex * mmToPx(layout.contentHeight));

    // CENTRADO VERTICAL EN LA PÁGINA (Opcional, por ahora top-aligned o centrado en el strip)
    // Si el banner es de 1 fila de alto, lo centramos verticalmente en la página
    let centeringY = 0;
    if (layout.rowsP === 1) {
        const pageHPx = mmToPx(layout.contentHeight);
        centeringY = (pageHPx - textMetrics.fullHeight) / 2;
    }

    return (
        <div className="w-full h-full relative overflow-hidden">
            {/* Contenedor que mueve el texto gigante */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                transform: `translate(${offsetX}px, ${offsetY + centeringY}px)`,
                whiteSpace: 'nowrap',
                pointerEvents: 'none' // El texto no es interactivo aquí
            }}>
                <span style={{
                    font: fontString,
                    color: config.bannerColor,
                    lineHeight: 1
                }}>
                    {config.bannerText}
                </span>
            </div>

            {/* Guías de margen (opcional) */}
            {config.printGuides && (
                <div className="absolute inset-0 border border-purple-200 pointer-events-none"></div>
            )}
        </div>
    );
}