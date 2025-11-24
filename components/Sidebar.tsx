
import React, { useState } from 'react';
import { AppMessage, ProcessedWorkOrder } from '../types';
import { WORK_TYPE_BORDER_COLORS } from '../constants';

interface SidebarProps {
    onFileUpload: (fileName: string, fileContent: ArrayBuffer | string) => void;
    setMessage: (message: AppMessage | null) => void;
    message: AppMessage | null;
    statusOptions: string[];
    workTypeOptions: string[];
    teamOptions: string[];
    unlocatedWorkOrders: ProcessedWorkOrder[];
    filters: {
        statuses: string[];
        workTypes: string[];
        teams: string[];
        searchTerm: string;
    };
    onFilterChange: (filterName: string, value: any) => void;
    onClearAllData: () => void;
    onExportData: () => void;
    onAddLocation: () => void;
    onAddCounty: () => void;
    isApiReady: boolean;
    
    // Impact Zone Props
    showPrimaryZones?: boolean;
    showSecondaryZones?: boolean;
    onToggleZoneVisibility?: (type: 'Primary' | 'Secondary') => void;
    onStartDrawingZone?: (type: 'Primary' | 'Secondary') => void;
    onClearZones?: () => void;
    isDrawing?: boolean;
}

const FilterGroup: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="filter-group">
        <h4 className="font-semibold mb-2 border-b pb-2 border-gray-600 text-gray-100">{title}</h4>
        <div className="space-y-2">{children}</div>
    </div>
);

const Sidebar: React.FC<SidebarProps> = ({
    onFileUpload,
    message,
    setMessage,
    statusOptions,
    workTypeOptions,
    teamOptions,
    unlocatedWorkOrders,
    filters,
    onFilterChange,
    onClearAllData,
    onExportData,
    onAddLocation,
    onAddCounty,
    isApiReady,
    showPrimaryZones = true,
    showSecondaryZones = true,
    onToggleZoneVisibility,
    onStartDrawingZone,
    onClearZones,
    isDrawing = false
}) => {
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
                const fileContent = isXlsx ? await file.arrayBuffer() : await file.text();
                onFileUpload(file.name, fileContent);
            } catch (error) {
                console.error("File reading error:", error);
                const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred while reading the file.';
                setMessage({ text: `Error: File read failed: ${errorMessage}`, type: 'error' });
            } finally {
                 e.target.value = ''; // Reset input
            }
        }
    };
    
    const messageClasses: { [key: string]: string } = {
        success: 'bg-green-900/50 text-green-300 border-green-700',
        warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
        error: 'bg-red-900/50 text-red-300 border-red-700',
        info: 'bg-blue-900/50 text-blue-300 border-blue-700',
    };
    
    const handleCheckboxChange = (group: 'statuses' | 'workTypes' | 'teams', value: string) => {
        const currentValues = filters[group];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        onFilterChange(group, newValues);
    };

    const handleClearClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Are you sure you want to clear all loaded work orders and hazards? This action cannot be undone.')) {
            onClearAllData();
        }
    };

    const handleExportClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onExportData();
    };

    return (
        <div className="space-y-6 text-gray-300">
            <div className="space-y-2">
                 <label htmlFor="fileUpload" className={`w-full text-center block bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg transition ${isApiReady ? 'hover:bg-gray-500 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                    {isApiReady ? 'Upload Data / Map Layers' : 'Loading Map API...'}
                 </label>
                 <div className="text-xs text-center text-gray-500">Supports CSV, XLSX, JSON, GeoJSON</div>
                <input id="fileUpload" type="file" onChange={handleFileChange} className="hidden" accept=".csv, .xlsx, .json, .geojson" disabled={!isApiReady} />
            </div>
            
            <div className="space-y-2">
                 <button type="button" onClick={handleExportClick} className="w-full text-center block bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition cursor-pointer text-sm shadow-md">
                    Download Map Data
                 </button>
                 <button type="button" onClick={handleClearClick} className="w-full text-center block bg-red-600 text-white font-bold px-4 py-2 rounded-lg hover:bg-red-500 transition cursor-pointer text-sm shadow-md">
                    Clear All Map Data
                 </button>
            </div>

            {message && (
                <div className={`text-center p-4 rounded-lg border ${messageClasses[message.type]}`}>
                    {message.text}
                </div>
            )}
            
            <FilterGroup title="Actions">
                <div className="space-y-2">
                    <button 
                        onClick={onAddLocation} 
                        className="w-full text-center block bg-blue-600 text-white font-bold px-4 py-3 rounded-lg transition shadow-lg hover:bg-blue-500 hover:shadow-xl cursor-pointer transform hover:-translate-y-0.5"
                    >
                        + Add Location
                    </button>
                    <button 
                        onClick={onAddCounty} 
                        className="w-full text-center block bg-gray-600 text-white font-bold px-4 py-2 rounded-lg transition shadow-md hover:bg-gray-500 cursor-pointer text-sm"
                    >
                        + Add County Boundary
                    </button>
                </div>
            </FilterGroup>

            <FilterGroup title="Impact Zones">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="toggle-primary" 
                                checked={showPrimaryZones} 
                                onChange={() => onToggleZoneVisibility && onToggleZoneVisibility('Primary')} 
                                className="h-4 w-4 rounded accent-red-600 bg-gray-600 border-gray-500" 
                            />
                            <label htmlFor="toggle-primary" className="ml-2 text-sm flex items-center gap-2">
                                Primary Zone
                                <span className="w-3 h-3 rounded-full bg-red-600 inline-block"></span>
                            </label>
                        </div>
                    </div>
                     <button 
                        onClick={() => onStartDrawingZone && onStartDrawingZone('Primary')} 
                        disabled={isDrawing}
                        className={`w-full text-center block text-white text-xs font-bold px-3 py-1.5 rounded transition ${isDrawing ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-red-900 hover:bg-red-800'}`}
                    >
                        {isDrawing ? 'Drawing Active...' : 'Draw Primary Zone'}
                    </button>

                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                            <input 
                                type="checkbox" 
                                id="toggle-secondary" 
                                checked={showSecondaryZones} 
                                onChange={() => onToggleZoneVisibility && onToggleZoneVisibility('Secondary')} 
                                className="h-4 w-4 rounded accent-yellow-500 bg-gray-600 border-gray-500" 
                            />
                            <label htmlFor="toggle-secondary" className="ml-2 text-sm flex items-center gap-2">
                                Secondary Zone
                                <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
                            </label>
                        </div>
                    </div>
                     <button 
                        onClick={() => onStartDrawingZone && onStartDrawingZone('Secondary')} 
                        disabled={isDrawing}
                        className={`w-full text-center block text-white text-xs font-bold px-3 py-1.5 rounded transition ${isDrawing ? 'bg-gray-700 cursor-not-allowed opacity-50' : 'bg-yellow-700 hover:bg-yellow-600'}`}
                    >
                        {isDrawing ? 'Drawing Active...' : 'Draw Secondary Zone'}
                    </button>
                    
                    {onClearZones && (
                         <button 
                            onClick={onClearZones}
                            className="w-full text-center block bg-gray-700 text-gray-300 hover:text-white font-medium px-3 py-1 rounded transition text-xs mt-2 hover:bg-gray-600"
                        >
                            Clear Zones
                        </button>
                    )}
                </div>
            </FilterGroup>

            {unlocatedWorkOrders.length > 0 && (
                <FilterGroup title="Unlocated Work Orders">
                    <div className="text-xs text-gray-400 space-y-2 max-h-48 overflow-y-auto p-2 bg-gray-700/50 rounded border border-yellow-800">
                        <p className="font-semibold text-yellow-400">Could not find location for:</p>
                        {unlocatedWorkOrders.map(wo => (
                            <div key={wo.filterData.woNumber}>
                                {wo.filterData.isGeneratedWoNumber ? (
                                     <strong className="text-gray-300">{wo.filterData.workType === 'Site Survey' ? 'Site Survey:' : 'No ID:'}</strong>
                                ) : (
                                     <strong className="text-gray-300">WO #{wo.filterData.woNumber}:</strong>
                                )}
                                {' '}{wo.address}
                            </div>
                        ))}
                    </div>
                </FilterGroup>
            )}

            <FilterGroup title="Search">
                <div className="flex items-center">
                    <span className="bg-gray-700 p-2 rounded-l-md border border-r-0 border-gray-500 text-sm text-gray-300 px-3">WO #</span>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filters.searchTerm}
                        onChange={(e) => onFilterChange('searchTerm', e.target.value)}
                        className="bg-gray-600 flex-grow p-2 border border-gray-500 rounded-r-md text-sm text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none"
                    />
                </div>
            </FilterGroup>

            <FilterGroup title="Status">
                {statusOptions.map(status => (
                    <div key={status} className="flex items-center">
                        <input type="checkbox" id={`status-${status}`} checked={filters.statuses.includes(status)} onChange={() => handleCheckboxChange('statuses', status)} className="h-4 w-4 rounded accent-[#A92128] bg-gray-600 border-gray-500" />
                        <label htmlFor={`status-${status}`} className="ml-2 text-sm">{status}</label>
                    </div>
                ))}
            </FilterGroup>
            
            <FilterGroup title="Primary Help Needed">
                {workTypeOptions.map(wt => (
                    <div key={wt} className="flex items-center">
                         <input type="checkbox" id={`wt-${wt}`} checked={filters.workTypes.includes(wt)} onChange={() => handleCheckboxChange('workTypes', wt)} className="h-4 w-4 rounded accent-[#A92128] bg-gray-600 border-gray-500" />
                         <label htmlFor={`wt-${wt}`} className="ml-2 text-sm flex items-center">
                            {wt}
                            <span className="w-3 h-3 rounded-full ml-2" style={{ backgroundColor: WORK_TYPE_BORDER_COLORS[wt] }}></span>
                        </label>
                    </div>
                ))}
            </FilterGroup>
            
            <FilterGroup title="Strike Teams">
                 {teamOptions.map(team => (
                    <div key={team} className="flex items-center">
                        <input 
                            type="checkbox" 
                            id={`team-${team}`} 
                            checked={filters.teams.includes(team)} 
                            onChange={() => handleCheckboxChange('teams', team)} 
                            className="h-4 w-4 rounded accent-[#A92128] bg-gray-600 border-gray-500"
                        />
                        <label htmlFor={`team-${team}`} className="ml-2 text-sm">{team}</label>
                    </div>
                ))}
            </FilterGroup>
        </div>
    );
};

export default Sidebar;
