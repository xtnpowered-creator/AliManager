import React from 'react';

/**
 * TimelineColleagueCell Component
 * 
 * Renders the sticky left sidebar cell displaying colleague information.
 * Appears on every timeline row to identify who owns that row.
 * 
 * Layout:
 * - Sticky left positioning (z-5000) to stay visible during horizontal scroll
 * - 200px width (configurable via props)
 * - Subtle shadow on right edge to indicate depth/separation from grid
 * 
 * Visual Elements:
 * - Avatar: Large rounded square (48x48) with colleague's initials
 * - Name: Bold, prominent text (11px)
 * - Metadata: Position, Company, Department (8px uppercase, muted)
 * - Role Badge: Displays user role with mapped labels:
 *   - 'user' → 'MEMBER'
 *   - 'guest' → 'COLLAB'
 *   - 'admin' → 'ADMIN'
 *   - 'god' → 'SYSTEM GOD'
 * 
 * @param {Object} props
 * @param {Object} props.colleague - Colleague object containing name, avatar, position, etc.
 * @param {string} props.colleague.avatar - Initials or avatar text to display in square
 * @param {string} props.colleague.name - Full name of colleague
 * @param {string} [props.colleague.position] - Job title/position
 * @param {string} [props.colleague.company] - Company name
 * @param {string} [props.colleague.department] - Department name
 * @param {string} [props.colleague.role] - System role (user/guest/admin/god)
 * @param {string} [props.width='200px'] - Width of the sidebar cell
 */
const TimelineColleagueCell = ({ colleague, width = '200px' }) => {
    return (
        <div
            className={`sticky left-0 z-[5000] w-50 p-4 bg-white border-r border-slate-200 flex items-center gap-3 shrink-0 shadow-[10px_0_20px_-10px_rgba(0,0,0,0.1)]`}
            style={{ width }}
        >
            {/* Avatar Square */}
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-sm font-black text-white uppercase shadow-lg shadow-slate-200 shrink-0">
                {colleague.avatar}
            </div>

            {/* Colleague Info */}
            <div className="flex-1 min-w-0">
                {/* Name */}
                <div className="flex flex-col gap-0 mb-1">
                    <p className="font-bold text-slate-900 text-[11px] tracking-tight leading-tight">{colleague.name}</p>
                </div>

                {/* Metadata: Position, Company, Department */}
                <div className="flex flex-col gap-0">
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.position || '---'}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.company || '---'}</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider truncate leading-tight">{colleague.department || '---'}</p>

                    {/* Role Badge (if present) */}
                    {colleague.role && (
                        <p className="text-[8px] font-bold text-teal-600 uppercase tracking-wider truncate leading-tight mt-1">
                            {(() => {
                                // Map internal role codes to user-friendly labels
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
