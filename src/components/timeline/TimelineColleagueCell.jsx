import React from 'react';

const TimelineColleagueCell = ({ colleague, width = '200px' }) => {
    return (
        <div
            className={`sticky left-0 z-[5000] w-50 p-4 bg-white border-r border-slate-200 flex items-center gap-3 shrink-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]`}
            style={{ width }}
        >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-slate-200 shrink-0">
                {colleague.avatar}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex flex-col gap-0 mb-1">
                    <p className="font-bold text-slate-900 text-[11px] tracking-tight leading-tight">{colleague.name}</p>
                </div>
                <div className="flex flex-col gap-0">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.position || '---'}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.company || '---'}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.department || '---'}</p>
                    {colleague.role && (
                        <p className="text-[8px] font-bold text-teal-600 uppercase tracking-wider truncate leading-tight mt-1">
                            {(() => {
                                const map = {
                                    user: 'MEMBER',
                                    guest: 'COLLAB',
                                    admin: 'ADMIN',
                                    god: 'SYSTEM GOD'
                                };
                                return map[colleague.role] || colleague.role;
                            })()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TimelineColleagueCell;
