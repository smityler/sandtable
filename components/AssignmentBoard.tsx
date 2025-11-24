
import React, { useState, useEffect, useRef } from 'react';
import { ProcessedWorkOrder } from '../types';
import { WORK_TYPE_BORDER_COLORS, WORK_TYPE_ICONS } from '../constants';
import { UserGroupIcon, ClipboardCheckIcon, PlusIcon, TrashIcon } from './Icons';

// Helper Component: WorkOrderCard
interface WorkOrderCardProps {
  workOrder: ProcessedWorkOrder;
  onEdit: (wo: ProcessedWorkOrder) => void;
  onDelete: (woNumber: string) => void;
  onDoubleClick: (wo: ProcessedWorkOrder) => void;
}
const WorkOrderCard: React.FC<WorkOrderCardProps> = React.memo(({ workOrder, onEdit, onDelete, onDoubleClick }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('workOrderId', workOrder.filterData.woNumber);
    e.currentTarget.classList.add('opacity-50');
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50');
  };
  
  const borderColor = WORK_TYPE_BORDER_COLORS[workOrder.filterData.workType] || WORK_TYPE_BORDER_COLORS.Other;
  const isCompleted = workOrder.filterData.status === 'Completed';

  // Determine Label:
  // 1. If generated ID AND Work Type is Site Survey -> "Site Survey"
  // 2. If generated ID AND Other Work Type -> "Work Order" (fallback)
  // 3. If Real ID -> "WO #..."
  let displayLabel = `WO #${workOrder.filterData.woNumber}`;
  if (workOrder.filterData.isGeneratedWoNumber) {
      if (workOrder.filterData.workType === 'Site Survey') {
          displayLabel = 'Site Survey';
      } else {
          displayLabel = 'Work Order';
      }
  }

  const isSiteSurvey = workOrder.filterData.workType === 'Site Survey';

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDoubleClick={() => onDoubleClick(workOrder)}
      className={`bg-[#4f4f4f] rounded p-2 mb-2 cursor-pointer transition hover:bg-gray-600 border-l-4 ${isCompleted ? 'opacity-60' : ''}`}
      style={{ borderLeftColor: borderColor }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-hidden">
             {isSiteSurvey && (
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={borderColor} strokeWidth="2" className="flex-shrink-0">
                     <g dangerouslySetInnerHTML={{ __html: WORK_TYPE_ICONS['Site Survey'] }} />
                 </svg>
             )}
            <span className={`font-semibold text-sm text-gray-100 truncate ${isCompleted ? 'line-through' : ''}`}>
                {displayLabel}
            </span>
        </div>
        <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(workOrder); }} className="text-gray-300 hover:text-white text-xs px-2 py-1 rounded bg-gray-600 hover:bg-gray-700 flex-shrink-0">EDIT</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(workOrder.filterData.woNumber); }} className="text-gray-400 hover:text-red-400 text-xs px-1 py-1 rounded hover:bg-gray-700 flex-shrink-0" title="Delete">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
      <p className={`text-xs text-gray-400 mt-1 ${isCompleted ? 'line-through' : ''}`}>{workOrder.filterData.originalWorkType}</p>
    </div>
  );
});

// Main Component: AssignmentBoard
interface AssignmentBoardProps {
    workOrdersByTeam: { [key: string]: ProcessedWorkOrder[] };
    teams: string[];
    onReassign: (woId: string, newTeam: string) => void;
    onEditWorkOrder: (wo: ProcessedWorkOrder) => void;
    onDeleteWorkOrder: (woNumber: string) => void;
    onAddWorkOrder: () => void;
    onAddTeam: () => void;
    onFocusWorkOrder: (wo: ProcessedWorkOrder) => void;
    onSiteSurveysClick: () => void;
    focusedWorkOrderNumber?: string | null;
}
const AssignmentBoard: React.FC<AssignmentBoardProps> = ({ workOrdersByTeam, teams, onReassign, onEditWorkOrder, onDeleteWorkOrder, onAddWorkOrder, onAddTeam, onFocusWorkOrder, onSiteSurveysClick, focusedWorkOrderNumber }) => {
    const [draggedOverTeam, setDraggedOverTeam] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, teamName: string) => {
        e.preventDefault();
        setDraggedOverTeam(null);
        const woId = e.dataTransfer.getData('workOrderId');
        if (woId) {
            onReassign(woId, teamName);
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, teamName: string) => {
        e.preventDefault();
        setDraggedOverTeam(teamName);
    };

    const teamOrder = ['Unassigned', ...teams.filter(t => t !== 'Unassigned').sort()];

    return (
        <div className="w-full flex flex-col h-full">
            <div className="flex justify-between items-center p-3 border-b border-gray-600 flex-shrink-0 bg-[#2d2d2d]">
                <h2 className="text-md md:text-lg font-bold text-gray-200">Assignments</h2>
                
                {/* Combined Action Button */}
                <div className="relative" ref={menuRef}>
                    <button 
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center justify-center w-8 h-8 bg-[#A92128] text-white rounded hover:bg-red-800 transition shadow-sm"
                        title="Actions"
                    >
                         <PlusIcon className="w-5 h-5" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-[#343a40] border border-gray-600 rounded-lg shadow-xl z-50 flex flex-col overflow-hidden">
                            <button 
                                onClick={() => { onAddWorkOrder(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 text-gray-200 text-sm text-left transition-colors border-b border-gray-700"
                            >
                                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#A92128]/20 text-[#A92128]">
                                    <PlusIcon className="w-3 h-3" />
                                </span>
                                Add Work Order
                            </button>
                            <button 
                                onClick={() => { onSiteSurveysClick(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 text-gray-200 text-sm text-left transition-colors border-b border-gray-700"
                            >
                                <ClipboardCheckIcon className="w-5 h-5 text-blue-400" />
                                Site Surveys
                            </button>
                            <button 
                                onClick={() => { onAddTeam(); setIsMenuOpen(false); }}
                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-600 text-gray-200 text-sm text-left transition-colors"
                            >
                                <UserGroupIcon className="w-5 h-5 text-gray-400" />
                                Add Team
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto" onDragLeave={() => setDraggedOverTeam(null)}>
                {teamOrder.map(team => {
                    const teamWorkOrders = workOrdersByTeam[team] || [];
                    const isEmpty = teamWorkOrders.length === 0;

                    // Teams with content will grow to fill space evenly. Empty teams will be a fixed small size.
                    const teamContainerClasses = `px-4 py-3 border-b border-gray-700 flex flex-col ${!isEmpty ? 'flex-1 min-h-[140px]' : 'flex-shrink-0'}`;

                    return (
                     <div
                        key={team}
                        className={teamContainerClasses}
                    >
                        <h3 className="font-semibold text-gray-300 flex-shrink-0">{team === 'Unassigned' ? 'Unscheduled' : team}</h3>
                        <div
                            onDragOver={(e) => handleDragOver(e, team)}
                            onDrop={(e) => handleDrop(e, team)}
                            className={`mt-2 bg-[#3c3c3c] rounded p-2 border-2 transition flex-1 overflow-y-auto ${draggedOverTeam === team ? 'border-dashed border-[#A92128]' : 'border-dashed border-transparent'}`}
                        >
                            {!isEmpty ? (
                                teamWorkOrders.map(wo => (
                                    <WorkOrderCard key={wo.filterData.woNumber} workOrder={wo} onEdit={onEditWorkOrder} onDelete={onDeleteWorkOrder} onDoubleClick={onFocusWorkOrder}/>
                                ))
                            ) : (
                                <div className="flex items-center justify-center h-full text-sm text-gray-400 select-none min-h-[60px]">
                                    {'Drop work orders here'}
                                </div>
                            )}
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

export default AssignmentBoard;
