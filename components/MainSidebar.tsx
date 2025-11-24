
import React from 'react';
import { HomeIcon, UserIcon, UserGroupIcon, PlaneIcon, TruckIcon, DocumentTextIcon, ClipboardListIcon, CurrencyDollarIcon } from './Icons';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center text-center p-2 h-20 w-full rounded-lg transition-colors cursor-pointer ${active ? 'bg-[#A92128] text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
    >
        {icon}
        <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
);

export type ViewType = 'home' | 'attendance' | 'teams' | 'transport' | 'equipment' | 'icsForms' | 'workOrders' | 'finance' | 'siteSurveys';

interface MainSidebarProps {
    currentView?: ViewType;
    onViewChange?: (view: ViewType) => void;
}

const MainSidebar: React.FC<MainSidebarProps> = ({ currentView = 'workOrders', onViewChange }) => {
    return (
        <aside className="w-24 bg-[#262626] p-2 pt-4 flex flex-col items-center space-y-2 flex-shrink-0 h-full overflow-y-auto">
            <nav className="w-full flex flex-col space-y-2 flex-grow">
                <NavItem 
                    icon={<HomeIcon className="w-6 h-6" />} 
                    label="Home" 
                    active={currentView === 'home'}
                    onClick={() => onViewChange?.('home')}
                />
                <NavItem 
                    icon={<UserIcon className="w-6 h-6" />} 
                    label="Attendance" 
                    active={currentView === 'attendance'}
                    onClick={() => onViewChange?.('attendance')}
                />
                <NavItem 
                    icon={<UserGroupIcon className="w-6 h-6" />} 
                    label="Teams" 
                    active={currentView === 'teams'}
                    onClick={() => onViewChange?.('teams')}
                />
                <NavItem 
                    icon={<PlaneIcon className="w-6 h-6" />} 
                    label="Transport" 
                    active={currentView === 'transport'}
                    onClick={() => onViewChange?.('transport')}
                />
                <NavItem 
                    icon={<TruckIcon className="w-6 h-6" />} 
                    label="Equipment" 
                    active={currentView === 'equipment'}
                    onClick={() => onViewChange?.('equipment')}
                />
                <NavItem 
                    icon={<DocumentTextIcon className="w-6 h-6" />} 
                    label="ICS Forms" 
                    active={currentView === 'icsForms'}
                    onClick={() => onViewChange?.('icsForms')}
                />
                <div className="w-full h-px bg-gray-700 my-1"></div>
                <NavItem 
                    icon={<ClipboardListIcon className="w-6 h-6" />} 
                    label="Work Orders" 
                    active={currentView === 'workOrders'} 
                    onClick={() => onViewChange?.('workOrders')}
                />
                <NavItem 
                    icon={<CurrencyDollarIcon className="w-6 h-6" />} 
                    label="Finance" 
                    active={currentView === 'finance'}
                    onClick={() => onViewChange?.('finance')}
                />
            </nav>
        </aside>
    );
}

export default MainSidebar;
