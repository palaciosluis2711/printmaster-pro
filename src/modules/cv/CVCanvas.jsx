import React from 'react';
import { Mail, Phone, User } from 'lucide-react';
import { PAGE_SIZES } from '../../constants/printSettings';
import ZoomControls from '../../components/ui/ZoomControls';

export default function CVCanvas({ config, zoom, setZoom }) {
    const { personalData = {}, pageSize = 'carta' } = config;

    const MM_TO_PX = 3.7795;
    const sizeData = PAGE_SIZES[pageSize] || PAGE_SIZES['carta'];

    const widthPx = sizeData.width * MM_TO_PX;
    const heightPx = sizeData.height * MM_TO_PX;

    return (
        <main className="flex-1 bg-slate-200/50 overflow-auto flex justify-center p-8 relative print:p-0 print:bg-white print:overflow-visible">
            {setZoom && <ZoomControls zoom={zoom} setZoom={setZoom} />}

            <div
                className="bg-white shadow-2xl relative transition-transform duration-300 origin-top"
                style={{
                    width: `${widthPx}px`,
                    height: `${heightPx}px`,
                    transform: `scale(${zoom})`,
                    marginBottom: `${(heightPx * (zoom - 1))}px`
                }}
            >
                {/* CV Layout */}
                <div className="flex h-full">
                    {/* Left Column (Color Strip) */}
                    <div className="w-1/3 bg-slate-50 h-full border-r border-slate-100 p-8 flex flex-col gap-6">
                        {/* Photo Placeholder */}
                        <div className="w-32 h-32 bg-slate-200 rounded-full self-center flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-sm">
                            <User className="w-16 h-16 text-slate-400" />
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="uppercase tracking-widest text-xs font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2">Contacto</h3>

                            {/* Phones */}
                            {personalData.phones && personalData.phones.map((p, idx) => (
                                p.number && (
                                    <div key={idx} className="flex items-center gap-3 text-xs text-slate-600">
                                        <Phone className="w-3 h-3 text-blue-500" />
                                        <span>{p.number} {p.type === 'whatsapp' && '(WA)'}</span>
                                    </div>
                                )
                            ))}

                            {/* Email */}
                            {(!personalData.emailNA && personalData.email) && (
                                <div className="flex items-center gap-3 text-xs text-slate-600">
                                    <Mail className="w-3 h-3 text-blue-500" />
                                    <span className="break-all">{personalData.email}</span>
                                </div>
                            )}
                        </div>

                        {/* IDs */}
                        <div className="space-y-4">
                            <h3 className="uppercase tracking-widest text-xs font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2">Documentos</h3>

                            {personalData.dui && (
                                <div className="text-xs">
                                    <span className="font-bold text-slate-700 block">DUI</span>
                                    <span className="text-slate-600">{personalData.dui}</span>
                                </div>
                            )}

                            {(!personalData.showNit === false && personalData.nit) && (
                                <div className="text-xs">
                                    <span className="font-bold text-slate-700 block">NIT</span>
                                    <span className="text-slate-600">{personalData.nit}</span>
                                </div>
                            )}

                            {(!personalData.isssNA && personalData.isss) && (
                                <div className="text-xs">
                                    <span className="font-bold text-slate-700 block">ISSS</span>
                                    <span className="text-slate-600">{personalData.isss}</span>
                                </div>
                            )}

                            {(!personalData.afpNA && personalData.afp) && (
                                <div className="text-xs">
                                    <span className="font-bold text-slate-700 block">AFP</span>
                                    <span className="text-slate-600">{personalData.afp}</span>
                                </div>
                            )}
                        </div>

                        {/* Others */}
                        {personalData.others && personalData.others.length > 0 && (
                            <div className="space-y-2">
                                <h3 className="uppercase tracking-widest text-xs font-bold text-slate-400 border-b border-slate-200 pb-1 mb-2">Otros</h3>
                                {personalData.others.map((doc, i) => (
                                    <div key={i} className="text-xs">
                                        <span className="font-bold text-slate-700 block">{doc.name}</span>
                                        <span className="text-slate-600">{doc.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column (Main Content) */}
                    <div className="flex-1 p-10">
                        {/* Name Header */}
                        <div className="mb-10">
                            <h1 className="text-4xl font-bold text-slate-800 uppercase leading-none mb-2">
                                {personalData.firstName} {personalData.secondName}
                            </h1>
                            <h2 className="text-3xl font-light text-slate-600 uppercase leading-none">
                                {personalData.firstSurname} {personalData.secondSurname}
                            </h2>
                            <div className="w-20 h-1 bg-blue-500 mt-4"></div>
                        </div>

                        {/* Personal Stats Grid */}
                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Edad</span>
                                <span className="text-sm text-slate-700">{personalData.age ? `${personalData.age} Años` : '-'}</span>
                            </div>
                            {(personalData.showCivilStatus && personalData.civilStatus) && (
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Estado Civil</span>
                                    <span className="text-sm text-slate-700">{personalData.civilStatus}</span>
                                </div>
                            )}
                            <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sexo</span>
                                <span className="text-sm text-slate-700">{personalData.sex || '-'}</span>
                            </div>
                        </div>

                        {/* Placeholder for future blocks */}
                        <div className="mt-20 p-8 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-center">
                            <p className="text-slate-400 text-sm font-medium">Próximamente: Experiencia y Estudios</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
