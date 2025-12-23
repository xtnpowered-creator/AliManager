import { useState, useEffect, useMemo } from 'react';

export const useTimelineFilters = (tasks, colleagues, projectsData, user) => {
    const [filterText, setFilterText] = useState('');
    // Sync colleagues with local storage order
    const orderedColleagues = useMemo(() => {
        if (colleagues.length === 0) return [];

        try {
            const savedOrder = JSON.parse(localStorage.getItem('colleagueOrder') || '[]');
            const colleagueMap = new Map(colleagues.map(c => [c.id, c]));
            const newOrder = [];
            const seenIds = new Set();

            savedOrder.forEach(id => {
                if (colleagueMap.has(id)) {
                    newOrder.push(colleagueMap.get(id));
                    seenIds.add(id);
                }
            });

            colleagues.forEach(c => {
                if (!seenIds.has(c.id)) newOrder.push(c);
            });

            // Default: Move Alisara to top if no order saved
            if (savedOrder.length === 0) {
                const alisaraIndex = newOrder.findIndex(c => c.name === 'Alisara Plyler');
                if (alisaraIndex > 0) {
                    const [alisara] = newOrder.splice(alisaraIndex, 1);
                    newOrder.unshift(alisara);
                }
            }
            return newOrder;
        } catch (e) {
            console.error('Failed to sort colleagues:', e);
            return colleagues;
        }
    }, [colleagues]);

    // Filter Logic
    const filteredTasks = useMemo(() => {
        if (!filterText) return tasks;
        const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
        const projectMap = new Map((projectsData || []).map(p => [p.id, p.title?.toLowerCase() || '']));
        const colleagueMap = new Map((colleagues || []).map(c => [c.id, c.name?.toLowerCase() || '']));

        return tasks.filter(t => tokens.every(token => {
            return t.title?.toLowerCase().includes(token) ||
                (t.projectId && projectMap.get(t.projectId)?.includes(token)) ||
                t.priority?.toLowerCase().includes(token) ||
                t.assignedTo?.some(uid => colleagueMap.get(uid)?.includes(token));
        }));
    }, [tasks, filterText, projectsData, colleagues]);

    // Visible Colleagues Logic
    const visibleColleagues = useMemo(() => {
        let list = orderedColleagues;
        if (filterText) {
            const tokens = filterText.toLowerCase().split(/\s+/).filter(t => t.length > 0);
            const activeIds = new Set();
            filteredTasks.forEach(t => t.assignedTo?.forEach(uid => activeIds.add(uid)));
            list = orderedColleagues.filter(c => activeIds.has(c.id) || tokens.every(token => c.name?.toLowerCase().includes(token)));
        }

        // PINNED USER LOGIC
        if (user) {
            const selfId = user.id || user.uid;
            const self = list.find(c => c.id === selfId) ||
                (colleagues || []).find(c => c.id === selfId) ||
                { id: selfId, name: user.displayName || 'Me', avatar: 'M' };
            return [self, ...list.filter(c => c.id !== selfId)];
        }
        return list;
    }, [orderedColleagues, filteredTasks, filterText, user, colleagues]);

    return {
        filterText,
        setFilterText,
        filteredTasks,
        visibleColleagues
    };
};
