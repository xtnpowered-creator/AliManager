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
        const statuses = new Set();
        const priorities = new Set();

        (tasks || []).forEach(t => {
            if (t.status) statuses.add(t.status);
            if (t.priority) priorities.add(t.priority);
        });

        ['Todo', 'In Progress', 'Done', 'Blocked'].forEach(s => statuses.add(s));

        return {
            'status': Array.from(statuses).sort(),
            'priority': Array.from(priorities).sort()
        };
    }, [tasks]);

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
        <div className="flex flex-col gap-3 w-full max-w-5xl mx-auto">

            {/* ROW 1: COMMANDS */}
            <div className="flex items-center gap-4 h-[30px]">

                {/* A. People Commands */}
                {showPeopleControls && (
                    <>
                        <FilterCommandButton
                            label="+ Filter Ppl"
                            color="blue"
                            placeholder="Dept, Position..."
                            suggestions={peopleSuggestions}
                            onSelect={addColleagueFilter}
                        />

                        {showSortControls && (
                            <div className="relative inline-block">
                                <select
                                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none cursor-pointer text-slate-700"
                                    value={sortConfig.field}
                                    onChange={handleSortChange}
                                >
                                    <option value="name">+ Sort Ppl: Name</option>
                                    <option value="position">+ Sort Ppl: Position</option>
                                    <option value="taskCount">+ Sort Ppl: Workload</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        )}
                    </>
                )}

                {/* Divider? */}
                {(showPeopleControls && (showTaskControls || showProjectControls)) && <div className="w-px h-4 bg-slate-200" />}

                {/* B. Task Commands */}
                {showTaskControls && (
                    <FilterCommandButton
                        label="+ Filter Tsk"
                        color="green"
                        placeholder="Status, Priority..."
                        suggestions={taskSuggestions}
                        onSelect={addTaskFilter}
                    />
                )}

                {/* Divider? */}
                {(showTaskControls && showProjectControls) && <div className="w-px h-4 bg-slate-200" />}

                {/* C. Project Commands */}
                {showProjectControls && (
                    <>
                        <FilterCommandButton
                            label="+ Filter Proj"
                            color="purple"
                            placeholder="Client, Status..."
                            suggestions={projectSuggestions}
                            onSelect={addProjectFilter}
                        />
                        <div className="relative inline-block">
                            <select
                                className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none cursor-pointer text-slate-700"
                                onChange={(e) => console.log('Sort Proj not implemented for Timeline View')}
                                disabled
                                title="Sort capability for Projects View"
                            >
                                <option value="name">+ Sort Proj</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                    </>
                )}


                {/* D. Global Commands */}
                {resetAll && (colleagueFilters.length > 0 || taskFilters.length > 0 || (projectFilters && projectFilters.length > 0) || sortConfig.field !== 'name') && (
                    <button
                        onClick={resetAll}
                        className="text-xs font-medium text-slate-400 hover:text-red-600 ml-auto transition-colors"
                    >
                        Clear All
                    </button>
                )}

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
            <div className="flex flex-wrap items-center gap-2 min-h-[30px] p-2 bg-slate-50/50 rounded-lg border border-slate-100/50">

                {/* Placeholder if empty */}
                {(colleagueFilters.length === 0 && taskFilters.length === 0 && (!projectFilters || projectFilters.length === 0) && sortConfig.field === 'name') && (
                    <span className="text-xs text-slate-400 italic pl-1">Showing everyone...</span>
                )}

                {/* People Chips */}
                {colleagueFilters.map((f, i) => (
                    <FilterChip
                        key={`ppl-${i}`}
                        label={f.label}
                        onRemove={() => removeColleagueFilter(i)}
                        color="blue"
                    />
                ))}

                {/* Sort Chip (Read Only) */}
                {sortConfig.field !== 'name' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 border border-slate-300">
                        Sort: {sortConfig.field === 'taskCount' ? 'Workload' : sortConfig.field}
                    </span>
                )}

                {/* Project Chips */}
                {projectFilters && projectFilters.map((f, i) => (
                    <FilterChip
                        key={`proj-${i}`}
                        label={f.label}
                        onRemove={() => removeProjectFilter(i)}
                        color="purple"
                    />
                ))}

                {/* Task Chips */}
                {taskFilters.map((f, i) => (
                    <FilterChip
                        key={`tsk-${i}`}
                        label={f.label}
                        onRemove={() => removeTaskFilter(i)}
                        color="green"
                    />
                ))}
            </div>
        </div>
    );
};

export default FilterAndSortToolbar;
