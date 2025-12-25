import React, { useMemo, useState } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';
import FilterChip from './FilterChip';
import FilterCommandButton from './FilterCommandButton';

const FilterAndSortToolbar = ({
    tasks, colleagues, projectsData,
    colleagueFilters, setColleagueFilters,
    taskFilters, setTaskFilters,
    projectFilters, setProjectFilters,
    sortConfig, setSortConfig,
    hideEmptyRows, setHideEmptyRows,
    resetAll,
    showPeopleControls = true,
    showTaskControls = true,
    showProjectControls = false,
    showSortControls = true
}) => {

    // -- 1. Derive Suggestions --
    const peopleSuggestions = useMemo(() => {
        const depts = new Set();
        const positions = new Set();

        (colleagues || []).forEach(c => {
            if (c.department) depts.add(c.department);
            if (c.position) positions.add(c.position);
        });

        return {
            'department': Array.from(depts).sort(),
            'position': Array.from(positions).sort(),
        };
    }, [colleagues]);

    const taskSuggestions = useMemo(() => {
        return {
            'status': ['Todo', 'In Progress', 'Done', 'Blocked'],
            'priority': ['Priority 1', 'Priority 2', 'Priority 3'],
            'due date': ['Overdue', 'Today', 'Tomorrow', 'This Week', 'Next Week'],
            'created': ['Today', 'Yesterday', 'Last 7 Days'],
            'content': ['Has Steps', 'Has Deliverables', 'Has Files'],
            // Placeholder for Steps/Metadata - would need specific extraction logic
            // For now, static list or derived from tasks if we want dynamic steps?
            // User asked for "Step Name, Step Description". That's a lot of unique values.
            // Let's stick to the high level buckets for now unless requested.
        };
    }, []);

    const projectSuggestions = useMemo(() => {
        const clients = new Set();
        const statuses = new Set();
        const titles = new Set();

        (projectsData || []).forEach(p => {
            if (p.client) clients.add(p.client);
            if (p.status) statuses.add(p.status);
            if (p.title) titles.add(p.title);
        });

        return {
            'client': Array.from(clients).sort(),
            'status': Array.from(statuses).sort(),
            'title': Array.from(titles).sort()
        };
    }, [projectsData]);


    // -- 2. Handlers --
    const addColleagueFilter = (filter) => {
        if (!colleagueFilters.some(f => f.type === filter.type && f.value === filter.value)) {
            setColleagueFilters([...colleagueFilters, filter]);
        }
    };

    const removeColleagueFilter = (index) => {
        const next = [...colleagueFilters];
        next.splice(index, 1);
        setColleagueFilters(next);
    };

    const addTaskFilter = (filter) => {
        if (!taskFilters.some(f => f.type === filter.type && f.value === filter.value)) {
            setTaskFilters([...taskFilters, filter]);
        }
    };

    const removeTaskFilter = (index) => {
        const next = [...taskFilters];
        next.splice(index, 1);
        setTaskFilters(next);
    };

    const addProjectFilter = (filter) => {
        if (!projectFilters.some(f => f.type === filter.type && f.value === filter.value)) {
            setProjectFilters([...projectFilters, filter]);
        }
    };

    const removeProjectFilter = (index) => {
        const next = [...projectFilters];
        next.splice(index, 1);
        setProjectFilters(next);
    };

    const handleSortChange = (e) => {
        setSortConfig({ ...sortConfig, field: e.target.value });
    };

    // -- 3. Render --
    return (
        <div className="flex flex-col gap-0 w-full">

            {/* ROW 1: COMMANDS */}
            <div className="flex items-center gap-2 h-[30px] mb-[-1px]">
                {[
                    {
                        id: 'task',
                        show: showTaskControls,
                        buttons: [
                            {
                                id: 'tsk-filter',
                                show: true,
                                component: FilterCommandButton,
                                props: {
                                    label: "Filter Task",
                                    color: "green",
                                    placeholder: "Status, Priority...",
                                    parser: (input) => {
                                        const results = [];
                                        const lower = input.toLowerCase();

                                        // 1. Due Date Parsing
                                        // Pattern: "due [date]" or just a date-like string
                                        // VALIDATION: Does any task actually have this due date?
                                        const dateMatch = lower.match(/(\d{1,2})[\/\-\.](\d{1,2})/); // Simple MM/DD
                                        if (lower.startsWith('due ') || dateMatch) {
                                            let val = lower.replace('due ', '').trim();

                                            // Normalize input "12/24" -> "2025-12-24" for comparison?
                                            // Simpler: Just check if any task's stringified due date matches the input input
                                            // Or smarter: parse input, check against task.dueDate objects

                                            const hasMatchingTask = (tasks || []).some(t => {
                                                if (!t.dueDate) return false;
                                                // Flexible check: Does the ISO string contain "12-24"?
                                                // Or better: construct local date string
                                                const d = new Date(t.dueDate);
                                                const localDateStr = d.toLocaleDateString(); // "12/24/2025" or similar
                                                return localDateStr.includes(val) || t.dueDate.includes(val);
                                            });

                                            if (val && hasMatchingTask) {
                                                results.push({ type: 'due date', value: val });
                                            }
                                        }

                                        // 2. Priority Shortcuts (Check existence)
                                        if (['p1', 'priority 1'].includes(lower)) {
                                            if (tasks.some(t => t.priority === '1')) results.push({ type: 'priority', value: 'Priority 1' });
                                        }
                                        if (['p2', 'priority 2'].includes(lower)) {
                                            if (tasks.some(t => t.priority === '2')) results.push({ type: 'priority', value: 'Priority 2' });
                                        }
                                        if (['p3', 'priority 3'].includes(lower)) {
                                            if (tasks.some(t => t.priority === '3')) results.push({ type: 'priority', value: 'Priority 3' });
                                        }

                                        // 3. Status Shortcuts (Check existence)
                                        if (lower.startsWith('st ') || lower.startsWith('status ')) {
                                            const val = lower.replace(/^(st|status)\s+/, '').trim();
                                            const match = (tasks || []).find(t => t.status?.toLowerCase() === val);
                                            if (match) {
                                                const displayVal = match.status; // Use actual casing
                                                results.push({ type: 'status', value: displayVal });
                                            }
                                        }

                                        // 4. Generic Title Search
                                        // VALIDATION: Only suggest if a task title actually contains this text
                                        if (input.length > 1) {
                                            const titleMatch = (tasks || []).some(t => t.title?.toLowerCase().includes(lower));
                                            if (titleMatch) {
                                                results.push({ type: 'title', value: input });
                                            }
                                        }

                                        return results;
                                    },
                                    suggestions: taskSuggestions,
                                    onSelect: addTaskFilter
                                }
                            }
                        ]
                    },
                    {
                        id: 'project',
                        show: showProjectControls,
                        buttons: [
                            {
                                id: 'proj-filter',
                                show: true,
                                component: FilterCommandButton,
                                props: {
                                    label: "Filter Proj",
                                    color: "blue",
                                    placeholder: "Client, Status...",
                                    suggestions: projectSuggestions,
                                    onSelect: addProjectFilter
                                }
                            }
                        ]
                    },
                    {
                        id: 'people',
                        show: showPeopleControls,
                        buttons: [
                            {
                                id: 'ppl-filter',
                                show: true,
                                component: FilterCommandButton,
                                props: {
                                    label: "Filter Ppl",
                                    color: "purple",
                                    placeholder: "Dept, Position...",
                                    suggestions: peopleSuggestions,
                                    onSelect: addColleagueFilter
                                }
                            }
                        ]
                    },
                    {
                        id: 'sort',
                        show: showSortControls,
                        buttons: [
                            {
                                id: 'sort-rows',
                                show: true, // Always show if the section is shown
                                component: FilterCommandButton,
                                props: {
                                    label: "Sort Rows",
                                    color: "neutral", // Gray
                                    placeholder: "Sort by...",
                                    suggestions: { "Order By": ["Name", "Position", "Workload"] },
                                    onSelect: (selection) => {
                                        const map = { 'Name': 'name', 'Position': 'position', 'Workload': 'taskCount' };
                                        setSortConfig({ ...sortConfig, field: map[selection.value] || 'name' });
                                    }
                                }
                            },
                            {
                                id: 'remove-all',
                                show: true, // Always show
                                render: () => {
                                    const hasActiveFilters = (colleagueFilters.length > 0 || taskFilters.length > 0 || (projectFilters && projectFilters.length > 0) || sortConfig.field !== 'name');
                                    return (
                                        <button
                                            key="remove-all-btn"
                                            onClick={hasActiveFilters ? resetAll : undefined}
                                            disabled={!hasActiveFilters}
                                            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors border
                                                ${hasActiveFilters
                                                    ? 'bg-white border-slate-300 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-slate-500 cursor-pointer'
                                                    : 'bg-slate-50 border-slate-300 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <X size={14} />
                                            <span>Remove All</span>
                                        </button>
                                    );
                                }
                            }
                        ]
                    }
                ].filter(s => s.show).map((section, idx, arr) => (
                    <React.Fragment key={section.id}>
                        {section.buttons.filter(b => b.show).map(btn => (
                            btn.render ? btn.render() : (
                                <FilterCommandButton key={btn.id} {...btn.props} />
                            )
                        ))}
                    </React.Fragment>
                ))}


                {/* D. Global Commands */}


                {/* Clean Up Toggle */}
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-500 hover:text-slate-800 ml-4 select-none">
                    <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors ${hideEmptyRows ? 'bg-slate-700 border-slate-700' : 'bg-white border-slate-300'}`}>
                        {hideEmptyRows && <Check size={10} className="text-white" />}
                    </div>
                    <input
                        type="checkbox"
                        className="hidden"
                        checked={hideEmptyRows}
                        onChange={(e) => setHideEmptyRows(e.target.checked)}
                    />
                    Hide Empty Rows
                </label>
            </div>

            {/* ROW 2: THE SENTENCE (Active Chips) */}
            <div className="flex flex-wrap items-center gap-2 h-[30px] py-1 px-0 bg-slate-50/50 rounded-lg border border-slate-100/50">

                {/* Placeholder if empty */}
                {(colleagueFilters.length === 0 && taskFilters.length === 0 && (!projectFilters || projectFilters.length === 0) && sortConfig.field === 'name') && (
                    <span className="text-xs text-slate-400 italic pl-1">Showing everything...</span>
                )}

                {/* 1. Task Chips (Green) */}
                {taskFilters.map((f, i) => (
                    <FilterChip
                        key={`tsk-${i}`}
                        label={f.label}
                        onRemove={() => removeTaskFilter(i)}
                        color="green"
                    />
                ))}

                {/* 2. Project Chips (Blue) */}
                {projectFilters && projectFilters.map((f, i) => (
                    <FilterChip
                        key={`proj-${i}`}
                        label={f.label}
                        onRemove={() => removeProjectFilter(i)}
                        color="blue"
                    />
                ))}

                {/* 3. People Chips (Purple) */}
                {colleagueFilters.map((f, i) => (
                    <FilterChip
                        key={`ppl-${i}`}
                        label={f.label}
                        onRemove={() => removeColleagueFilter(i)}
                        color="purple"
                    />
                ))}

                {/* 4. Sort Chip (Gray) */}
                {sortConfig.field !== 'name' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 border border-slate-300">
                        Sort: {sortConfig.field === 'taskCount' ? 'Workload' : sortConfig.field}
                    </span>
                )}

            </div>
        </div>
    );
};

export default FilterAndSortToolbar;
