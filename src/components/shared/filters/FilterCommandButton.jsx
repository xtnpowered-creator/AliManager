import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search } from 'lucide-react';

const FilterCommandButton = ({ label, placeholder = "Search...", suggestions = {}, onSelect, color = 'neutral' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setInputValue(''); // Reset on close
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type, value) => {
        onSelect({ type, value, label: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${value}` });
        setIsOpen(false);
        setInputValue('');
    };

    // Derived Suggestions based on input
    const filteredGroups = Object.entries(suggestions).reduce((acc, [type, values]) => {
        const matches = values.filter(v =>
            v.toLowerCase().includes(inputValue.toLowerCase()) ||
            type.toLowerCase().includes(inputValue.toLowerCase())
        );
        if (matches.length > 0) acc[type] = matches;
        return acc;
    }, {});

    const hasSuggestions = Object.keys(filteredGroups).length > 0;

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 10); }}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border
                    ${isOpen ? 'bg-slate-100 border-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
            >
                <Plus size={14} className={color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-emerald-500' : 'text-slate-400'} />
                <span>{label}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-[1000] w-64 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                        <Search size={14} className="text-slate-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm placeholder:text-slate-400"
                            placeholder={placeholder}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setIsOpen(false);
                                    setInputValue('');
                                }
                            }}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                        {hasSuggestions ? (
                            Object.entries(filteredGroups).map(([type, values]) => (
                                <div key={type} className="mb-1 last:mb-0">
                                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {type}
                                    </div>
                                    {values.map(val => (
                                        <button
                                            key={`${type}-${val}`}
                                            onClick={() => handleSelect(type, val)}
                                            className="w-full text-left px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2 transition-colors"
                                        >
                                            <span className="font-medium text-slate-400 w-16 shrink-0 text-xs text-right overflow-hidden uppercase">{type}</span>
                                            <span className="truncate flex-1">{val}</span>
                                        </button>
                                    ))}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
                                No matches found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterCommandButton;
