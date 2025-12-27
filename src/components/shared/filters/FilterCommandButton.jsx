import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, ChevronRight } from 'lucide-react';

/**
 * Filter Command Dropdown Button
 * 
 * PURPOSE:
 * Smart dropdown for adding filters with two interaction modes:
 * 1. Browse Mode: Category/Option split view (no search input)
 * 2. Search Mode: Unified search across all categories + dynamic parsing
 * 
 * ARCHITECTURE - DUAL MODE UI:
 * 
 * **BROWSE MODE** (default, when input is empty):
 * - Left panel: Filter categories (assignee, status, priority, etc.)
 * - Right panel: Options for selected category
 * - Hover-to-preview pattern (activeCategory tracks hover)
 * - Example: Hover "Status" → Right panel shows ["Open", "In Progress", "Done"]
 * 
 * **SEARCH MODE** (when user types):
 * - Single-column flat list of matches
 * - Multi-word AND search: "status done" matches Status: Done
 * - Falls through to dynamic parser if no static matches
 * - Example: Type "overdue" → Parser converts to Date: < Today
 * 
 * DYNAMIC PARSER EXTENSION:
 * The `parser` prop allows custom filter logic beyond static suggestions.
 * 
 * Example use cases:
 * - "overdue" → { type: 'date', value: '<today' }
 * - "urgent" → { type: 'priority', value: 'urgent' }
 * - "assigned to me" → { type: 'assignee', value: currentUserId }
 * - "last week" → { type: 'date', value: 'last 7 days' }
 * 
 * Parser signature:
 * parser(inputValue: string): Array<{ type: string, value: any }> | null
 * 
 * DATA FLOW:
 * 1. Parent provides suggestions (static options) and parser (dynamic)
 * 2. User clicks button → Dropdown opens, input auto-focuses
 * 3. User types → Search across static suggestions + parser
 * 4. User clicks option → onSelect({ type, value, label })
 * 5. Parent adds filter chip to active filters
 * 6. Dropdown closes, input resets
 * 
 * SEARCH ALGORITHM:
 * 1. Tokenize input: "status done" → ["status", "done"]
 * 2. For each suggestion, create searchable string: type + value
 * 3. Check if ALL tokens are present (AND filter)
 * 4. If static suggestions match, show them
 * 5. If no matches, try parser for custom logic
 * 6. Show "No matches found" if both fail
 * 
 * KEYBOARD NAVIGATION:
 * - Escape: Close dropdown
 * - Click outside: Close dropdown
 * - Auto-focus on open
 * 
 * VISUAL DESIGN:
 * - Color prop allows category branding (blue for filters, green for sorts, etc.)
 * - Plus icon indicates "add" action
 * - Split-panel inspired by command palettes (VS Code, Raycast)
 * - High z-index (1000) ensures dropdown stays above content
 * 
 * @param {string} label - Button label (e.g., "Add Filter", "Add Sort")
 * @param {string} placeholder - Search input placeholder (default: "Search...")
 * @param {Object<string, Array<string>>} suggestions - Static options grouped by type
 *   Example: { assignee: ["Alice", "Bob"], status: ["Open", "Done"] }
 * @param {Function} onSelect - Callback when option selected: ({ type, value, label }) => void
 * @param {Function} parser - Optional dynamic parser for custom filter logic
 * @param {string} color - Icon color variant: 'neutral'|'blue'|'green'|'purple' (default: 'neutral')
 * 
 * @example
 * // Basic usage with static suggestions
 * <FilterCommandButton
 *   label="Add Filter"
 *   suggestions={{
 *     assignee: colleagues.map(c => c.name),
 *     status: ["Open", "In Progress", "Done"],
 *     priority: ["Low", "Medium", "High"]
 *   }}
 *   onSelect={({ type, value }) => addFilter(type, value)}
 *   color="blue"
 * />
 * 
 * @example
 * // Advanced: Static + Dynamic Parser
 * <FilterCommandButton
 *   label="Add Filter"
 *   placeholder="Search or type 'overdue', 'urgent'..."
 *   suggestions={{ status: ["Open", "Done"], priority: ["High"] }}
 *   parser={(input) => {
 *     if (input === 'overdue') return [{ type: 'date', value: '<today' }];
 *     if (input === 'urgent') return [{ type: 'priority', value: 'high' }];
 *     return null;
 *   }}
 *   onSelect={addFilter}
 * />
 */
const FilterCommandButton = ({ label, placeholder = "Search...", suggestions = {}, onSelect, parser, color = 'neutral' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeCategory, setActiveCategory] = useState(null); // Track hovered category
    const containerRef = useRef(null);
    const inputRef = useRef(null);

    // Initialize active category when opening or suggestions change
    useEffect(() => {
        if (isOpen && !activeCategory) {
            const firstKey = Object.keys(suggestions)[0];
            if (firstKey) setActiveCategory(firstKey);
        }
    }, [isOpen, suggestions, activeCategory]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setInputValue('');
                setActiveCategory(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (type, value) => {
        onSelect({ type, value, label: `${type.charAt(0).toUpperCase() + type.slice(1)}: ${value} ` });
        setIsOpen(false);
        setInputValue('');
        setActiveCategory(null);
    };

    // SEARCH MODE: Flattened Search + Dynamic Parser
    const getSearchResults = () => {
        const results = [];

        // 1. Static Suggestions Match
        const lowerInput = inputValue.toLowerCase();
        const terms = lowerInput.split(/\s+/).filter(Boolean);

        Object.entries(suggestions).forEach(([type, values]) => {
            values.forEach(v => {
                const fullString = `${type} ${v} `.toLowerCase();
                const match = terms.every(term => fullString.includes(term));
                if (match) results.push({ type, value: v });
            });
        });

        // 2. Dynamic Parser (if provided)
        if (parser) {
            const parsed = parser(inputValue);
            if (parsed && Array.isArray(parsed)) {
                results.push(...parsed);
            }
        }

        return results;
    };

    const searchResults = inputValue ? getSearchResults() : [];
    const categories = Object.keys(suggestions);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 10); }}
                className={`flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-md transition-colors border whitespace-nowrap
                    ${isOpen ? 'bg-slate-100 border-slate-400' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'} `}
            >
                <Plus size={14} className={color === 'blue' ? 'text-blue-500' : color === 'green' ? 'text-emerald-500' : color === 'purple' ? 'text-purple-500' : 'text-slate-400'} />
                <span>{label}</span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-[1000] min-w-[300px] bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    {/* Search Bar */}
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
                                if (e.key === 'Escape') setIsOpen(false);
                            }}
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex max-h-[400px]">
                        {inputValue ? (
                            /* SEARCH RESULT VIEW (Flat List) */
                            <div className="w-full overflow-y-auto py-1">
                                {searchResults.length > 0 ? (
                                    searchResults.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() => handleSelect(item.type, item.value)}
                                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-16 text-right">{item.type}</span>
                                            <span className="text-sm text-slate-700 font-medium">{item.value}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 text-xs italic">No matches found</div>
                                )}
                            </div>
                        ) : (
                            /* SPLIT VIEW (Categories | Options) */
                            <>
                                {/* Left Col: Categories */}
                                <div className="w-1/3 border-r border-slate-100 bg-slate-50/50 overflow-y-auto py-1">
                                    {categories.map(cat => (
                                        <div
                                            key={cat}
                                            onMouseEnter={() => setActiveCategory(cat)}
                                            className={`px - 3 py - 2 cursor - pointer text - xs font - bold transition - colors flex items - center justify - between
                                                ${activeCategory === cat ? 'bg-white text-teal-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'} `}
                                        >
                                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                                            {activeCategory === cat && <ChevronRight size={12} />}
                                        </div>
                                    ))}
                                </div>

                                {/* Right Col: Options */}
                                <div className="w-2/3 overflow-y-auto py-1 bg-white">
                                    {activeCategory && suggestions[activeCategory]?.map(val => (
                                        <div
                                            key={val}
                                            onClick={() => handleSelect(activeCategory, val)}
                                            className="px-3 py-1.5 hover:bg-teal-50 cursor-pointer text-sm text-slate-700 hover:text-teal-700 transition-colors flex items-center gap-2"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-teal-400"></div>
                                            {val}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterCommandButton;
