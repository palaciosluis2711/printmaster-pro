import React, { useEffect } from 'react';
import { Clipboard, Pencil, Image as ImageIcon, Trash2, Upload } from 'lucide-react';

export default function ContextMenu({ data, close, onEdit, onPaste, onUpload, onRemove }) {
  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClick = () => close();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [close]);

  if (!data.visible) return null;

  const isMosaicEmpty = data.imageId === 'mosaic-empty';
  const isMosaic1x1 = data.imageId === 'mosaic-1x1';

  return (
    <div
      className="fixed bg-white shadow-xl border border-slate-200 rounded-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100 min-w-[200px]"
      style={{ top: data.y, left: data.x }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* OPCIONES PARA MOSAICO VACÍO */}
      {isMosaicEmpty && (
        <button
          onClick={() => { onPaste(); close(); }}
          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
        >
          <Clipboard className="w-4 h-4" /> Pegar del portapapeles
        </button>
      )}

      {/* OPCIONES PARA MOSAICO CON IMAGEN (Solo en 1x1) */}
      {isMosaic1x1 && (
        <>
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 rounded mb-1">
            Cambiar Imagen
          </div>
          <button
            onClick={() => { onUpload(); close(); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Desde Archivo...
          </button>
          <button
            onClick={() => { onPaste(); close(); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
          >
            <Clipboard className="w-4 h-4" /> Desde Portapapeles
          </button>

          <div className="my-1 border-t border-slate-100"></div>

          <button
            onClick={() => { onEdit(); close(); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Editar imagen
          </button>
          <button
            onClick={() => { onRemove(); close(); }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Quitar imagen
          </button>
        </>
      )}

      {/* OPCIONES ESTÁNDAR (Para modo normal) */}
      {!isMosaicEmpty && !isMosaic1x1 && data.imageId && (
        <>
          <button
            onClick={() => { onPaste(); close(); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
          >
            <Clipboard className="w-4 h-4" /> Pegar del portapapeles
          </button>
          <button
            onClick={() => { onEdit(); close(); }}
            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Editar imagen
          </button>
        </>
      )}

      {/* Click derecho en fondo vacío (Modo normal) */}
      {!isMosaicEmpty && !isMosaic1x1 && !data.imageId && (
        <button
          onClick={() => { onPaste(); close(); }}
          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
        >
          <Clipboard className="w-4 h-4" /> Pegar del portapapeles
        </button>
      )}
    </div>
  );
}