import React from 'react';
import { MapIcon, AssignIcon, AdjustmentsIcon } from './Icons';

interface MobileNavProps {
    activeView: 'map' | 'board' | 'sidebar';
    onViewChange: (view: 'map' | 'board' | 'sidebar') => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeView, onViewChange }) => {
    const navItems = [
        { view: 'map' as const, label: 'Map', icon: <MapIcon className="w-6 h-6" /> },
        { view: 'board' as const, label: 'Assign', icon: <AssignIcon className="w-6 h-6" /> },
        { view: 'sidebar' as const, label: 'Filters', icon: <AdjustmentsIcon className="w-6 h-6" /> }
    ];

    return (
        <nav 
            className="w-full bg-[#262626] flex justify-around items-center p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex-shrink-0 border-t border-gray-700 z-50"
            style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
        >
            {navItems.map(item => {
                const isActive = activeView === item.view;
                return (
                    <button
                        key={item.view}
                        onClick={() => onViewChange(item.view)}
                        className={`flex flex-col items-center justify-center text-center p-2 rounded-lg transition-colors w-24 ${
                            isActive ? 'text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        {item.icon}
                        <span className="text-xs mt-1 font-medium">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
};

export default MobileNav;