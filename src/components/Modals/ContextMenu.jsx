import React, { useEffect } from 'react';
import { Clipboard, Pencil } from 'lucide-react';

export default function ContextMenu({ data, close, onEdit, onPaste }) {
  // Cerrar al hacer click fuera
  useEffect(() => {
    const handleClick = () => close();
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [close]);

  if (!data.visible) return null;

  return (
    <div 
      className="fixed bg-white shadow-xl border border-slate-200 rounded-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-100" 
      style={{ top: data.y, left: data.x }}
      onClick={(e) => e.stopPropagation()} // Evitar cierre inmediato al hacer click dentro
    >
      <button 
        onClick={() => { onPaste(); close(); }} 
        className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
      >
        <Clipboard className="w-4 h-4" /> Pegar del portapapeles
      </button>
      
      {(data.imageId) && (
        <button 
          onClick={() => { onEdit(); close(); }} 
          className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded flex items-center gap-2"
        >
          <Pencil className="w-4 h-4" /> Editar imagen
        </button>
      )}
    </div>
  );
}