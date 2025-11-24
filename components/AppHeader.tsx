
import React, { useState, useEffect } from 'react';
import { LogoIcon, ChevronDownIcon, UserCircleIcon, ShareIcon, MenuIcon } from './Icons';
import { ViewType } from './MainSidebar';

interface AppHeaderProps {
    onMenuClick?: () => void;
    currentView: ViewType;
    operationName: string;
    onOperationNameChange: (name: string) => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ onMenuClick, currentView, operationName, onOperationNameChange }) => {
    const [copyButtonText, setCopyButtonText] = useState('Share Map');
    const [opDate, setOpDate] = useState('');

    useEffect(() => {
        // Set initial date to today in YYYY-MM-DD format for the input
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setOpDate(`${year}-${month}-${day}`);
    }, []);

    const handleShare = () => {
        // Construct the URL from window.location.origin to create a stable, shareable link
        // that is not a temporary blob: URL. The app uses hash-based routing, so the path is not needed.
        const shareUrl = `${window.location.origin}/#/map`;

        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Share Map'), 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            setCopyButtonText('Error');
            setTimeout(() => setCopyButtonText('Share Map'), 2000);
        });
    };

    return (
        <header className="bg-[#2d2d2d] text-white p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-700 relative z-10">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <button 
                    onClick={onMenuClick} 
                    className="lg:hidden text-white hover:bg-gray-700 p-2 rounded-md focus:outline-none transition-colors cursor-pointer"
                    aria-label="Open Menu"
                >
                    <MenuIcon className="w-8 h-8" />
                </button>
                
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex-shrink-0 text-gray-200">
                        <LogoIcon />
                    </div>
                    <div className="flex flex-col justify-center">
                        <h1 className="text-xl font-bold leading-none tracking-tight">OPERATION</h1>
                        <input 
                            type="text" 
                            value={operationName}
                            onChange={(e) => onOperationNameChange(e.target.value)}
                            placeholder="ENTER NAME"
                            className="bg-transparent text-sm font-bold text-gray-400 tracking-widest uppercase focus:outline-none focus:text-white placeholder-gray-600 w-40"
                            aria-label="Operation Name"
                        />
                    </div>
                </div>

                {currentView === 'workOrders' && (
                    <div className="hidden md:flex items-center gap-4 ml-4 pl-4 border-l border-gray-600">
                        <div>
                            <h2 className="text-lg font-bold leading-none">Work Orders</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Assign and track operational tasks</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 md:gap-6">
                 <button onClick={handleShare} className="flex items-center gap-2 text-sm bg-gray-600 px-3 py-1.5 rounded-md hover:bg-gray-500 transition-colors">
                    <ShareIcon className="w-4 h-4" /> <span className="hidden sm:inline">{copyButtonText}</span>
                </button>
                <div className="hidden lg:flex items-center gap-4">
                    <button className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors">
                        Documents <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors">
                        Support <ChevronDownIcon className="w-4 h-4" />
                    </button>
                    <button className="flex items-center gap-2 text-sm hover:text-gray-300 transition-colors">
                        <UserCircleIcon className="w-5 h-5" /> Account <ChevronDownIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="hidden sm:flex border-l border-gray-600 pl-2 md:pl-6">
                    <div className="flex items-center bg-[#343a40] p-2 rounded-md border border-gray-600">
                        <input 
                            id="planning-date" 
                            type="date" 
                            value={opDate}
                            onChange={(e) => setOpDate(e.target.value)}
                            className="bg-transparent text-sm w-32 focus:outline-none"
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
