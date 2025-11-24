
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import MapComponent from './components/MapComponent';
import Sidebar from './components/Sidebar';
import AssignmentBoard from './components/AssignmentBoard';
import MainSidebar, { ViewType } from './components/MainSidebar';
import AppHeader from './components/AppHeader';
import MobileNav from './components/MobileNav';
import FinanceTracker from './components/FinanceTracker';
import { SiteSurveyView } from './components/SiteSurveyView';
import { HomeView, AttendanceView, TeamsView, TransportView, EquipmentView, ICSFormsView } from './components/SectionViews';
import { RawWorkOrder, ProcessedWorkOrder, AppMessage, HazardMarker, InfrastructureMarker, InfrastructureType, InfrastructureStatus, MapLayer, ImpactZone, MapAnnotation, SiteSurvey } from './types';
import { STATIC_STATUSES, STATIC_WORK_TYPES, ALL_TEAMS, HAZARD_TYPES, INFRASTRUCTURE_TYPES, INFRASTRUCTURE_STATUSES, MARKER_CATEGORIES } from './constants';
import { processAndGeocodeFile, getStatusCategory, geocodeSingleWorkOrder, geocodeSingleAddress, reverseGeocode } from './services/dataService';

// Use the specific API key provided to resolve InvalidKeyMapError
const API_KEY = "AIzaSyCAZehbkFiafaCB4q4ZJwp7aoInZBPPioQ";
declare const google: any;

// --- Helper Components defined in the same file ---
interface WorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => void;
    workOrder: ProcessedWorkOrder | null;
    teams: string[];
    onSelectLocationOnMap: () => void;
}
const WorkOrderModal: React.FC<WorkOrderModalProps> = ({ isOpen, onClose, onSave, workOrder, teams, onSelectLocationOnMap }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        woNumber: '',
        status: 'Unscheduled',
        address: '',
        workType: 'Other',
        strikeTeam: '',
        notes: '',
        lastContactedDate: '',
        lastContactedResult: '',
        lastContactedOther: '',
        contactName: '',
        contactPhone: '',
        lat: undefined as number | undefined,
        lon: undefined as number | undefined,
    });

    useEffect(() => {
        if (workOrder) {
            setFormData({
                woNumber: workOrder.filterData.woNumber,
                status: workOrder.filterData.status || 'Unscheduled',
                address: workOrder.filterData.fullAddress,
                workType: workOrder.filterData.workType,
                strikeTeam: workOrder.filterData.strikeTeam === 'Unassigned' ? '' : workOrder.filterData.strikeTeam,
                notes: workOrder.filterData.notes || '',
                lastContactedDate: workOrder.filterData.lastContacted?.date || '',
                lastContactedResult: workOrder.filterData.lastContacted?.result || '',
                lastContactedOther: workOrder.filterData.lastContacted?.otherResult || '',
                contactName: workOrder.filterData.contactName || '',
                contactPhone: workOrder.filterData.contactPhone || '',
                lat: workOrder.lat,
                lon: workOrder.lon,
            });
        } else {
             setFormData({
                woNumber: `NEW-${Date.now()}`,
                status: 'Unscheduled',
                address: '',
                workType: 'Other',
                strikeTeam: '',
                notes: '',
                lastContactedDate: '',
                lastContactedResult: '',
                lastContactedOther: '',
                contactName: '',
                contactPhone: '',
                lat: undefined,
                lon: undefined,
             });
        }
    }, [workOrder, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const lastContacted = (formData.lastContactedDate && formData.lastContactedResult)
            ? {
                date: formData.lastContactedDate,
                result: formData.lastContactedResult,
                otherResult: formData.lastContactedResult === 'Other' ? formData.lastContactedOther : undefined
            }
            : undefined;

        onSave({
            ...formData,
            lastContacted: lastContacted,
            originalWoNumber: workOrder?.filterData.woNumber || formData.woNumber
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        // If user types in address field, clear lat/lon to force re-geocoding
        const isAddressChange = name === 'address';
        setFormData(prev => ({ 
            ...prev, 
            [name]: value,
            lat: isAddressChange ? undefined : prev.lat,
            lon: isAddressChange ? undefined : prev.lon
        }));
    };
    
    const contactResultOptions = ['Work Scheduled', 'Work no longer needed', 'No Answer', 'Other'];

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-lg border border-gray-600 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-100">{workOrder && !workOrder.filterData.woNumber.startsWith('NEW') ? 'Edit' : 'Add'} Work Order</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="woNumber" className="block text-sm font-medium text-gray-300">Work Order #</label>
                            <input type="text" name="woNumber" value={formData.woNumber} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                            <select name="status" value={formData.status} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none">
                                {STATIC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-300">Address</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" placeholder="Enter full address" />
                        <button type="button" onClick={onSelectLocationOnMap} className="w-full text-center mt-2 bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition cursor-pointer text-sm">Select Location on Map</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="contactName" className="block text-sm font-medium text-gray-300">Contact Name</label>
                            <input type="text" name="contactName" value={formData.contactName} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" />
                        </div>
                        <div>
                            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-300">Contact Phone</label>
                            <input type="text" name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="workType" className="block text-sm font-medium text-gray-300">Primary Help Needed</label>
                            <select name="workType" value={formData.workType} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none">
                                {STATIC_WORK_TYPES.map(wt => <option key={wt} value={wt}>{wt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="strikeTeam" className="block text-sm font-medium text-gray-300">Strike Team</label>
                            <select name="strikeTeam" value={formData.strikeTeam} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none">
                                <option value="">Unassigned</option>
                                {teams.filter(t => t !== 'Unassigned').map(team => <option key={team} value={team}>{team}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notes</label>
                        <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" />
                    </div>
                    <fieldset className="border border-gray-600 p-4 rounded-md">
                        <legend className="text-sm font-medium text-gray-300 px-2">Last Contact Attempt</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="lastContactedDate" className="block text-sm font-medium text-gray-300">Date</label>
                                <input type="date" name="lastContactedDate" value={formData.lastContactedDate} max={today} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" style={{ colorScheme: 'dark' }} />
                            </div>
                            <div>
                                <label htmlFor="lastContactedResult" className="block text-sm font-medium text-gray-300">Result</label>
                                <select name="lastContactedResult" value={formData.lastContactedResult} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" disabled={!formData.lastContactedDate}>
                                    <option value="">Select Result</option>
                                    {contactResultOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        </div>
                        {formData.lastContactedResult === 'Other' && (
                            <div className="mt-4">
                                <label htmlFor="lastContactedOther" className="block text-sm font-medium text-gray-300">Other Result Details</label>
                                <input type="text" name="lastContactedOther" value={formData.lastContactedOther} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none" />
                            </div>
                        )}
                    </fieldset>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                        <button type="submit" className="bg-[#A92128] text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-800 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface AddTeamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (teamName: string) => void;
    existingTeams: string[];
}
const AddTeamModal: React.FC<AddTeamModalProps> = ({ isOpen, onClose, onAdd, existingTeams }) => {
    const [selectedTeam, setSelectedTeam] = useState('');
    if (!isOpen) return null;
    
    const availableTeams = ALL_TEAMS.filter(t => !existingTeams.includes(t));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedTeam) onAdd(selectedTeam);
    };

    return (
         <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600">
                <h3 className="text-xl font-bold mb-4 text-gray-100">Add New Team</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="newTeamName" className="block text-sm font-medium text-gray-300">Team Name</label>
                        <select id="newTeamName" value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-[#A92128] focus:border-[#A92128] focus:outline-none">
                             <option value="">Select Team to Add</option>
                             {availableTeams.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => onClose()} className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                        <button type="submit" className="bg-[#A92128] text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-800 transition">Add Team</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface HazardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => void;
    onSelectOnMap: () => void;
    initialData: { id?: string; lat?: number; lon?: number; address?: string; type?: string; description?: string; status?: string } | null;
}
const HazardModal: React.FC<HazardModalProps> = ({ isOpen, onClose, onSave, onSelectOnMap, initialData }) => {
    const [formData, setFormData] = useState({ address: '', type: HAZARD_TYPES[0], description: '', status: 'Active Hazard' });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                address: initialData?.address || '',
                type: initialData?.type || HAZARD_TYPES[0],
                description: initialData?.description || '',
                status: initialData?.status || 'Active Hazard'
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, ...initialData });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600">
                <h3 className="text-xl font-bold mb-4 text-gray-100">{initialData?.id ? 'Edit' : 'Add'} Marker</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-300">Address / Location</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none" placeholder="Enter address or select on map" />
                    </div>
                    <div>
                        <button type="button" onClick={onSelectOnMap} className="w-full text-center mt-1 bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition cursor-pointer text-sm">Select Location on Map</button>
                    </div>
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-300">Marker Type</label>
                        <select name="type" value={formData.type} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none">
                            {HAZARD_TYPES.sort().map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none">
                            {['Road Closed', 'Passable with Caution', 'Active Hazard', 'Cleared', 'Reported', 'Confirmed'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Notes</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Describe the hazard, blockage, or danger..." className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none" />
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={onClose} className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                        <button type="submit" className="bg-yellow-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-yellow-700 transition">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- NEW Infrastructure Modal ---
interface InfrastructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (formData: any) => void;
    onSelectOnMap: () => void;
    type: InfrastructureType;
    initialData: { lat?: number, lon?: number, address?: string } | null;
}
const InfrastructureModal: React.FC<InfrastructureModalProps> = ({ isOpen, onClose, onSave, onSelectOnMap, type, initialData }) => {
    const [formData, setFormData] = useState({ name: '', description: '', status: INFRASTRUCTURE_STATUSES[0] as InfrastructureStatus, address: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData({ 
                name: '', 
                description: '', 
                status: 'Operational',
                address: initialData?.address || ''
            });
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...formData, ...initialData, type });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600">
                <h3 className="text-xl font-bold mb-4 text-gray-100">Add {type}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Location Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" required />
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-300">Address / Location</label>
                        <input type="text" name="address" value={formData.address} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" placeholder="Enter address or select on map" />
                        <button type="button" onClick={onSelectOnMap} className="w-full text-center mt-2 bg-gray-600 text-gray-200 font-semibold px-4 py-2 rounded-lg hover:bg-gray-500 transition cursor-pointer text-sm">Select Location on Map</button>
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description / Notes</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" />
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-300">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="bg-gray-700 text-white mt-1 block w-full rounded-md border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none">
                            {INFRASTRUCTURE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-4 mt-6">
                        <button type="button" onClick={() => onClose()} className="bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition">Cancel</button>
                        <button type="submit" className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition">Save Location</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- NEW Add Location Type Modal ---
interface AddLocationTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectType: (type: 'WorkOrder' | 'Hazard' | 'Infrastructure', subtype?: string) => void;
    onSelectInfrastructureType: (type: InfrastructureType) => void;
}
const AddLocationTypeModal: React.FC<AddLocationTypeModalProps> = ({ isOpen, onClose, onSelectType, onSelectInfrastructureType }) => {
    const [step, setStep] = useState<'main' | 'infrastructure' | 'marker_category' | 'marker_select'>('main');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    
    useEffect(() => {
        if(isOpen) {
            setStep('main');
            setSelectedCategory(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const btnClass = "w-full py-4 rounded-lg font-bold text-white text-lg shadow-md transition transform hover:-translate-y-1 flex flex-col items-center justify-center gap-2";

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-100">
                        {step === 'main' ? 'Add to Map' : 
                         step === 'marker_category' ? 'Select Category' :
                         step === 'marker_select' ? `Select ${selectedCategory}` : 'Select Infrastructure'}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white font-bold text-xl">&times;</button>
                </div>

                <div className="space-y-4">
                    {step === 'main' && (
                        <>
                            <button onClick={() => onSelectType('WorkOrder')} className={`${btnClass} bg-blue-600 hover:bg-blue-500`}>
                                <span>Add Work Order</span>
                                <span className="text-xs font-normal opacity-80">Track tasks, needs, and teams</span>
                            </button>
                            <button onClick={() => setStep('marker_category')} className={`${btnClass} bg-yellow-600 hover:bg-yellow-500`}>
                                <span>Add Marker / Hazard</span>
                                <span className="text-xs font-normal opacity-80">Mark dangers, needs, or status</span>
                            </button>
                            <button onClick={() => setStep('infrastructure')} className={`${btnClass} bg-gray-600 hover:bg-gray-500 border border-gray-500`}>
                                <span>Add Infrastructure</span>
                                <span className="text-xs font-normal opacity-80">Log hospitals, airports, bases, etc.</span>
                            </button>
                        </>
                    )}

                    {step === 'marker_category' && (
                        <div className="grid grid-cols-1 gap-3">
                             {Object.keys(MARKER_CATEGORIES).map(cat => (
                                <button 
                                    key={cat}
                                    onClick={() => { setSelectedCategory(cat); setStep('marker_select'); }}
                                    className="p-3 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold border border-gray-600 hover:border-gray-400 transition text-left px-4"
                                >
                                    {cat}
                                </button>
                             ))}
                             <button onClick={() => setStep('main')} className="mt-2 text-gray-400 hover:text-white text-sm underline">Back</button>
                        </div>
                    )}

                    {step === 'marker_select' && selectedCategory && (
                        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                            {(MARKER_CATEGORIES as any)[selectedCategory].map((type: string) => (
                                <button 
                                    key={type}
                                    onClick={() => onSelectType('Hazard', type)}
                                    className="p-2 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium border border-gray-700 hover:border-gray-500 transition text-left"
                                >
                                    {type}
                                </button>
                            ))}
                            <button onClick={() => setStep('marker_category')} className="mt-2 text-gray-400 hover:text-white text-sm underline text-center">Back to Categories</button>
                        </div>
                    )}

                    {step === 'infrastructure' && (
                        <div className="grid grid-cols-2 gap-3">
                            {INFRASTRUCTURE_TYPES.map(type => (
                                <button 
                                    key={type} 
                                    onClick={() => onSelectInfrastructureType(type as InfrastructureType)}
                                    className="p-3 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-semibold border border-gray-600 hover:border-gray-400 transition"
                                >
                                    {type}
                                </button>
                            ))}
                            <button onClick={() => setStep('main')} className="col-span-2 mt-2 text-gray-400 hover:text-white text-sm underline">
                                Back to Main Menu
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface CountySearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddLayer: (geojson: any, name: string) => void;
}

const CountySearchModal: React.FC<CountySearchModalProps> = ({ isOpen, onClose, onAddLayer }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&polygon_geojson=1&countrycodes=us&limit=5`);
            const data = await response.json();
            // Filter for results that have valid geojson polygons/multipolygons
            const validResults = data.filter((item: any) => 
                item.geojson && (item.geojson.type === 'Polygon' || item.geojson.type === 'MultiPolygon')
            );
            setResults(validResults);
        } catch (error) {
            console.error("County search error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        const feature = {
            type: "Feature",
            geometry: item.geojson,
            properties: { name: item.display_name }
        };
        const featureCollection = {
            type: "FeatureCollection",
            features: [feature]
        };
        onAddLayer(featureCollection, item.display_name.split(',')[0]);
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-100">Add County Boundary</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., Orange County, CA"
                        className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600">
                        {loading ? '...' : 'Search'}
                    </button>
                </form>
                <div className="flex-1 overflow-y-auto">
                    {results.length > 0 ? (
                        <ul className="space-y-2">
                            {results.map((item: any, idx: number) => (
                                <li key={idx} className="bg-gray-800 p-3 rounded-md border border-gray-700 hover:bg-gray-700 cursor-pointer transition" onClick={() => handleSelect(item)}>
                                    <p className="text-sm text-gray-200 font-semibold">{item.display_name}</p>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">{item.type} • {item.class}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loading && <p className="text-gray-500 text-center text-sm mt-4">Search for a US county to see boundaries.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

interface PropertySearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPropertyFound: (data: any) => void;
}

const PropertySearchModal: React.FC<PropertySearchModalProps> = ({ isOpen, onClose, onPropertyFound }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setResults([]);
        setError(null);

        if (!(window as any).google) {
             setError("Google Maps API not ready. Please wait a moment.");
             setLoading(false);
             return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: query }, (googleResults: any, status: any) => {
            setLoading(false);
            if (status === 'OK' && googleResults) {
                const mappedResults = googleResults.map((r: any) => ({
                    display_name: r.formatted_address,
                    lat: r.geometry.location.lat(),
                    lon: r.geometry.location.lng(),
                    place_id: r.place_id,
                    source: 'google'
                }));
                setResults(mappedResults);
            } else {
                setError("No properties found via Google Maps. Please try a more specific address.");
            }
        });
    };

    const handleSelect = (item: any) => {
        onPropertyFound(item);
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center z-50 bg-black bg-opacity-70">
            <div className="bg-[#343a40] p-6 rounded-lg shadow-2xl w-full max-w-md border border-gray-600 max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-100">Property Lookup</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., 123 Main St, Springfield"
                        className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-600 flex items-center justify-center min-w-[80px]">
                        {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : 'Search'}
                    </button>
                </form>
                {error && (
                    <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded text-red-200 text-sm">
                        {error}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">
                    {results.length > 0 ? (
                        <ul className="space-y-2">
                            {results.map((item: any, idx: number) => (
                                <li key={idx} className="bg-gray-800 p-3 rounded-md border border-gray-700 hover:bg-gray-700 cursor-pointer transition" onClick={() => handleSelect(item)}>
                                    <p className="text-sm text-gray-200 font-semibold">{item.display_name}</p>
                                    <p className="text-xs text-gray-500 mt-1 capitalize">Google Maps Result</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        !loading && !error && <p className="text-gray-500 text-center text-sm mt-4">Search for a property address.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- NEW Map Only Page Component ---
const MapOnlyPage: React.FC = () => {
    const [workOrders, setWorkOrders] = useState<ProcessedWorkOrder[]>([]);
    const [hazardMarkers, setHazardMarkers] = useState<HazardMarker[]>([]);
    const [infrastructureMarkers, setInfrastructureMarkers] = useState<InfrastructureMarker[]>([]);
    const [mapLayers, setMapLayers] = useState<MapLayer[]>([]);
    const [impactZones, setImpactZones] = useState<ImpactZone[]>([]);
    const [apiKeyError, setApiKeyError] = useState(false);
    const [isApiReady, setIsApiReady] = useState(false);

    const loadDataFromStorage = () => {
        try { setWorkOrders(JSON.parse(localStorage.getItem('processedWorkOrders') || '[]')); } catch (e) { console.error(e); }
        try { setHazardMarkers(JSON.parse(localStorage.getItem('hazardMarkers') || '[]')); } catch (e) { console.error(e); }
        try { setInfrastructureMarkers(JSON.parse(localStorage.getItem('infrastructureMarkers') || '[]')); } catch (e) { console.error(e); }
        try { setMapLayers(JSON.parse(localStorage.getItem('mapLayers') || '[]')); } catch (e) { console.error(e); }
        try { setImpactZones(JSON.parse(localStorage.getItem('impactZones') || '[]')); } catch (e) { console.error(e); }
    };
    
    useEffect(() => {
        loadDataFromStorage();
        const handleStorageChange = (event: StorageEvent) => {
             if (['processedWorkOrders', 'hazardMarkers', 'infrastructureMarkers', 'mapLayers', 'impactZones'].includes(event.key || '')) {
                loadDataFromStorage();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    
    const handleApiKeyMissing = useCallback(() => setApiKeyError(true), []);
    const handleApiReady = useCallback(() => setIsApiReady(true), []);

    return (
        <div className="w-screen h-screen bg-[#212529]">
             {apiKeyError ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800"><p className="text-gray-400 font-semibold">Google Maps requires a valid API Key.</p></div>
            ) : workOrders.length === 0 && hazardMarkers.length === 0 && infrastructureMarkers.length === 0 && mapLayers.length === 0 && impactZones.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800"><p className="text-gray-400 font-semibold text-center px-4">No map data found.<br/>Please upload data in the main application view to see it here.</p></div>
            ) : (
                <MapComponent apiKey={API_KEY} workOrders={workOrders} hazardMarkers={hazardMarkers} infrastructureMarkers={infrastructureMarkers} mapLayers={mapLayers} impactZones={impactZones} onApiKeyMissing={handleApiKeyMissing} onApiLoaded={handleApiReady} focusedWorkOrderNumber={null} onMapClickForHazard={() => {}} onMapClickForWorkOrder={() => {}} onMapClickForInfrastructure={() => {}} onDeleteHazard={() => {}} onDeleteInfrastructure={() => {}} isAddingHazard={false} isPlacingWorkOrder={false} placingInfrastructureType={null} onEditHazard={() => {}} />
            )}
        </div>
    );
};


// --- The original App component is now the MainLayout for the full application ---
const MainLayout: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('workOrders');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [processedWorkOrders, setProcessedWorkOrders] = useState<ProcessedWorkOrder[]>(() => JSON.parse(localStorage.getItem('processedWorkOrders') || '[]'));
    const [hazardMarkers, setHazardMarkers] = useState<HazardMarker[]>(() => JSON.parse(localStorage.getItem('hazardMarkers') || '[]'));
    const [infrastructureMarkers, setInfrastructureMarkers] = useState<InfrastructureMarker[]>(() => JSON.parse(localStorage.getItem('infrastructureMarkers') || '[]'));
    const [mapLayers, setMapLayers] = useState<MapLayer[]>(() => JSON.parse(localStorage.getItem('mapLayers') || '[]'));
    const [impactZones, setImpactZones] = useState<ImpactZone[]>(() => JSON.parse(localStorage.getItem('impactZones') || '[]'));
    const [operationName, setOperationName] = useState(() => localStorage.getItem('operationName') || '');
    
    // Persistent Site Surveys
    const [siteSurveys, setSiteSurveys] = useState<SiteSurvey[]>(() => JSON.parse(localStorage.getItem('siteSurveys') || '[]'));
    const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null); // To handle cross-component links

    // Impact Zone State
    const [showPrimaryZones, setShowPrimaryZones] = useState(true);
    const [showSecondaryZones, setShowSecondaryZones] = useState(true);
    const [drawingZoneType, setDrawingZoneType] = useState<'Primary' | 'Secondary' | null>(null);

    // Property Search State
    const [isPropertySearchModalOpen, setIsPropertySearchModalOpen] = useState(false);
    const [viewConfig, setViewConfig] = useState<{ center: { lat: number, lng: number }, zoom: number, mapTypeId: string } | null>(null);
    const [newSurveyData, setNewSurveyData] = useState<any>(null);

    // Mobile Navigation Visibility State
    const [mobileView, setMobileView] = useState<'map' | 'board' | 'sidebar'>('map');

    useEffect(() => {
        localStorage.setItem('operationName', operationName);
    }, [operationName]);

    // Persist Surveys
    useEffect(() => {
        localStorage.setItem('siteSurveys', JSON.stringify(siteSurveys));
    }, [siteSurveys]);
    
    const [unlocatedWorkOrders, setUnlocatedWorkOrders] = useState<ProcessedWorkOrder[]>([]);
    const [customTeams, setCustomTeams] = useState<string[]>(() => JSON.parse(localStorage.getItem('customTeams') || '[]'));
    const [apiKeyError, setApiKeyError] = useState(false);
    const [message, setMessage] = useState<AppMessage | null>(null);
    const [isApiReady, setIsApiReady] = useState(false);
    
    const [editingWorkOrder, setEditingWorkOrder] = useState<ProcessedWorkOrder | null>(null);
    const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
    const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
    
    const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);
    const [newHazardInitialData, setNewHazardInitialData] = useState<{ id?: string; lat?: number; lon?: number; address?: string; type?: string; description?: string; status?: string } | null>(null);
    const [isAddingHazard, setIsAddingHazard] = useState(false);

    const [isInfrastructureModalOpen, setIsInfrastructureModalOpen] = useState(false);
    const [newInfrastructureData, setNewInfrastructureData] = useState<{ lat?: number, lon?: number, address?: string } | null>(null);
    const [placingInfrastructureType, setPlacingInfrastructureType] = useState<InfrastructureType | null>(null);
    // To track if we are in "select on map" mode specifically for infrastructure
    const [isPlacingInfrastructure, setIsPlacingInfrastructure] = useState(false); 
    const [currentInfraTypeForPlacement, setCurrentInfraTypeForPlacement] = useState<InfrastructureType | null>(null);

    const [isPlacingWorkOrder, setIsPlacingWorkOrder] = useState(false);
    const [focusedWorkOrderNumber, setFocusedWorkOrderNumber] = useState<string | null>(null);

    const [filters, setFilters] = useState({ statuses: STATIC_STATUSES, workTypes: STATIC_WORK_TYPES, teams: [] as string[], searchTerm: '' });
    
    const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
    const [isCountySearchModalOpen, setIsCountySearchModalOpen] = useState(false);

    // FIX: Sanitize data on load to remove invalid coordinates which crash Google Maps
    useEffect(() => {
        const sanitize = (items: any[]) => items.filter(i => typeof i.lat === 'number' && !isNaN(i.lat) && typeof i.lon === 'number' && !isNaN(i.lon));
        setProcessedWorkOrders(prev => {
             const clean = sanitize(prev);
             if (clean.length !== prev.length) console.warn(`Removed ${prev.length - clean.length} invalid work orders.`);
             return clean;
        });
        setHazardMarkers(prev => {
             const clean = sanitize(prev);
             if (clean.length !== prev.length) console.warn(`Removed ${prev.length - clean.length} invalid hazard markers.`);
             return clean;
        });
        setInfrastructureMarkers(prev => {
             const clean = sanitize(prev);
             if (clean.length !== prev.length) console.warn(`Removed ${prev.length - clean.length} invalid infrastructure markers.`);
             return clean;
        });
    }, []);

    // FIX: Implement `allTeams` useMemo hook to derive all unique teams. This resolves an error where `.includes` was called on `void`.
    const allTeams = useMemo(() => {
        const teamsFromWorkOrders = processedWorkOrders.map(wo => wo.filterData.strikeTeam).filter(team => team && team !== 'Unassigned');
        const all = new Set(['Unassigned', ...teamsFromWorkOrders, ...customTeams]);
        return Array.from(all).sort((a, b) => {
            if (a === 'Unassigned') return -1;
            if (b === 'Unassigned') return 1;
            return a.localeCompare(b);
        });
    }, [processedWorkOrders, customTeams]);
    
    // FIX: Implement useEffect to update filters when allTeams changes.
    useEffect(() => {
        setFilters(prev => ({ ...prev, teams: allTeams }));
    }, [allTeams]);
    
    // FIX: Implement `handleFileUpload` callback to process uploaded files.
    const handleFileUpload = useCallback(async (fileName: string, fileContent: ArrayBuffer | string) => {
        setMessage({ text: 'Processing file... This may take a few minutes for large files.', type: 'info' });
        
        // Handle GeoJSON import (Map Layer)
        if (fileName.toLowerCase().endsWith('.geojson')) {
             try {
                const text = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
                const geoJson = JSON.parse(text);
                const newLayer = { id: `LAYER-${Date.now()}`, name: fileName, data: geoJson, type: 'boundary' as const };
                setMapLayers(prev => [...prev, newLayer]);
                setMessage({ text: `Layer "${fileName}" added to map.`, type: 'success' });
             } catch (e) {
                 console.error("GeoJSON parse error", e);
                 setMessage({ text: `Failed to parse GeoJSON file: ${fileName}`, type: 'error' });
             }
             return;
        }

        // Handle JSON import (Full state restore)
        if (fileName.toLowerCase().endsWith('.json')) {
            try {
               const jsonString = typeof fileContent === 'string' ? fileContent : new TextDecoder().decode(fileContent);
               const data = JSON.parse(jsonString);
               
               // Basic validation
               if (!Array.isArray(data.workOrders) && !Array.isArray(data.hazards)) {
                    throw new Error("Invalid file format. Missing workOrders or hazards arrays.");
               }

               setProcessedWorkOrders(data.workOrders || []);
               setHazardMarkers(data.hazards || []);
               setInfrastructureMarkers(data.infrastructure || []);
               setMapLayers(data.mapLayers || []);
               setImpactZones(data.impactZones || []);
               setUnlocatedWorkOrders(data.unlocatedWorkOrders || []);
               setCustomTeams(data.customTeams || []);
               setSiteSurveys(data.siteSurveys || []);
               
               // Reset filters on load to ensure visibility of all new data
               setFilters({
                   statuses: STATIC_STATUSES,
                   workTypes: STATIC_WORK_TYPES,
                   teams: [], // Empty means show all
                   searchTerm: ''
               });
               
               // Force update storage
               localStorage.setItem('processedWorkOrders', JSON.stringify(data.workOrders || []));
               localStorage.setItem('hazardMarkers', JSON.stringify(data.hazards || []));
               localStorage.setItem('infrastructureMarkers', JSON.stringify(data.infrastructure || []));
               localStorage.setItem('mapLayers', JSON.stringify(data.mapLayers || []));
               localStorage.setItem('impactZones', JSON.stringify(data.impactZones || []));
               localStorage.setItem('customTeams', JSON.stringify(data.customTeams || []));
               localStorage.setItem('siteSurveys', JSON.stringify(data.siteSurveys || []));

               setMessage({ text: 'Map data loaded successfully.', type: 'success' });
            } catch (err) {
                console.error(err);
                setMessage({ text: 'Failed to load JSON map data.', type: 'error' });
            }
            return;
        }

        // Handle CSV/XLSX import (Add work orders)
        try {
            const { located, unlocated, parsedCount } = await processAndGeocodeFile(fileName, fileContent, ALL_TEAMS, (message, type) => {
                setMessage({ text: message, type: type || 'info' });
            });
            setProcessedWorkOrders(prev => [...prev, ...located]);
            setUnlocatedWorkOrders(unlocated);
            setMessage({ text: `Successfully processed ${parsedCount} rows. ${located.length} located, ${unlocated.length} unlocated.`, type: 'success' });
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            setMessage({ text: `File processing failed: ${errorMessage}`, type: 'error' });
        }
    }, [ALL_TEAMS]);

    // Export full state to JSON
    const handleExportData = useCallback(() => {
        const data = {
            workOrders: processedWorkOrders,
            hazards: hazardMarkers,
            infrastructure: infrastructureMarkers,
            mapLayers: mapLayers,
            impactZones: impactZones,
            customTeams: customTeams,
            unlocatedWorkOrders: unlocatedWorkOrders,
            siteSurveys: siteSurveys
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `map-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [processedWorkOrders, hazardMarkers, infrastructureMarkers, mapLayers, impactZones, customTeams, unlocatedWorkOrders, siteSurveys]);

    useEffect(() => { localStorage.setItem('processedWorkOrders', JSON.stringify(processedWorkOrders)); }, [processedWorkOrders]);
    useEffect(() => { localStorage.setItem('hazardMarkers', JSON.stringify(hazardMarkers)); }, [hazardMarkers]);
    useEffect(() => { localStorage.setItem('infrastructureMarkers', JSON.stringify(infrastructureMarkers)); }, [infrastructureMarkers]);
    useEffect(() => { localStorage.setItem('mapLayers', JSON.stringify(mapLayers)); }, [mapLayers]);
    useEffect(() => { localStorage.setItem('impactZones', JSON.stringify(impactZones)); }, [impactZones]);
    useEffect(() => { localStorage.setItem('customTeams', JSON.stringify(customTeams)); }, [customTeams]);
    
    const handleFilterChange = useCallback((filterName: string, value: any) => setFilters(prev => ({ ...prev, [filterName]: value })), []);
    
    const handleClearAllData = useCallback(() => {
        // 1. Clear Data States
        setProcessedWorkOrders([]);
        setHazardMarkers([]);
        setInfrastructureMarkers([]);
        setMapLayers([]);
        setImpactZones([]);
        setUnlocatedWorkOrders([]);
        setCustomTeams([]);
        setSiteSurveys([]);
        
        // 2. Clear UI States
        setFocusedWorkOrderNumber(null);
        setEditingWorkOrder(null);
        setNewSurveyData(null);
        setViewConfig(null); // Reset map view to default
        setNewHazardInitialData(null);
        setNewInfrastructureData(null);
        setSelectedSurveyId(null);
        
        // Switch view back to default to avoid empty state errors in specific views
        setCurrentView('workOrders');

        // 3. Reset Filters
        setFilters({
            statuses: STATIC_STATUSES,
            workTypes: STATIC_WORK_TYPES,
            teams: [],
            searchTerm: ''
        });
        
        // 4. Force Clear Storage
        const keysToRemove = [
            'processedWorkOrders', 
            'hazardMarkers', 
            'infrastructureMarkers', 
            'mapLayers', 
            'impactZones', 
            'customTeams', 
            'siteSurveys'
        ];
        keysToRemove.forEach(key => localStorage.removeItem(key));

        setMessage({ text: 'All map data has been cleared.', type: 'info' });
    }, []);

    // FIX: Implement `derivedData` useMemo hook to filter and group work orders. This resolves errors where properties were accessed on `void`.
    const derivedData = useMemo(() => {
        const workOrdersByTeam: { [key: string]: ProcessedWorkOrder[] } = {};
        allTeams.forEach(team => { workOrdersByTeam[team] = []; });

        const filteredWorkOrders = processedWorkOrders.filter(wo => {
            const { statuses, workTypes, teams, searchTerm } = filters;
            const matchesStatus = statuses.length === 0 || statuses.includes(wo.filterData.status);
            const matchesWorkType = workTypes.length === 0 || workTypes.includes(wo.filterData.workType);
            const matchesTeam = teams.length === 0 || teams.includes(wo.filterData.strikeTeam);
            const matchesSearch = !searchTerm || wo.filterData.woNumber.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesStatus && matchesWorkType && matchesTeam && matchesSearch;
        });

        filteredWorkOrders.forEach(wo => {
            const team = wo.filterData.strikeTeam || 'Unassigned';
            if (!workOrdersByTeam[team]) {
                workOrdersByTeam[team] = [];
            }
            workOrdersByTeam[team].push(wo);
        });

        // Ensure every team from allTeams exists as a key, even if empty.
        allTeams.forEach(team => {
            if (!workOrdersByTeam[team]) {
                workOrdersByTeam[team] = [];
            }
        });

        return {
            filteredWorkOrdersForMap: filteredWorkOrders,
            workOrdersByTeam
        };
    }, [processedWorkOrders, filters, allTeams]);

    // FIX: Implement `handleReassign` callback to update a work order's team.
    const handleReassign = useCallback((woNumber: string, newTeam: string) => {
        setProcessedWorkOrders(prev =>
            prev.map(wo =>
                wo.filterData.woNumber === woNumber
                    ? { ...wo, filterData: { ...wo.filterData, strikeTeam: newTeam } }
                    : wo
            )
        );
    }, []);
    
    // FIX: Implement `handleDeleteWorkOrder` callback to delete a work order.
    const handleDeleteWorkOrder = useCallback((woNumber: string) => {
        if (window.confirm(`Are you sure you want to delete Work Order #${woNumber}?`)) {
            setProcessedWorkOrders(prev => prev.filter(wo => wo.filterData.woNumber !== woNumber));
            setFocusedWorkOrderNumber(null); // Clear focus if the deleted item was focused
            setMessage({ text: `Work Order #${woNumber} deleted.`, type: 'info' });
        }
    }, []);
    
    // FIX: Implement `handleEditWorkOrder` callback to open the edit modal.
    const handleEditWorkOrder = useCallback((woOrNumber: ProcessedWorkOrder | string) => {
        const woToEdit = typeof woOrNumber === 'string'
            ? processedWorkOrders.find(wo => wo.filterData.woNumber === woOrNumber)
            : woOrNumber;
        
        if (woToEdit) {
            setEditingWorkOrder(woToEdit);
            setIsWorkOrderModalOpen(true);
        }
    }, [processedWorkOrders]);

    const handleAddWorkOrder = useCallback(() => { setEditingWorkOrder(null); setIsWorkOrderModalOpen(true); }, []);
    
    // FIX: Implement `handleSaveWorkOrder` callback to create or update work orders.
    const handleSaveWorkOrder = useCallback(async (formData: any) => {
        let finalWo: ProcessedWorkOrder;
        const existingWo = processedWorkOrders.find(wo => wo.filterData.woNumber === formData.originalWoNumber);

        setMessage({ text: 'Saving work order...', type: 'info' });
        
        let lat = formData.lat;
        let lon = formData.lon;

        if ((!lat || !lon) && formData.address) {
            try {
                const location = await geocodeSingleAddress(formData.address);
                if (location) {
                    lat = location.lat;
                    lon = location.lon;
                    setMessage({ text: 'Address geocoded successfully.', type: 'info' });
                } else {
                     setMessage({ text: `Could not geocode address: ${formData.address}`, type: 'warning' });
                }
            } catch (e) {
                setMessage({ text: `Geocoding failed for address: ${formData.address}`, type: 'error' });
                console.error(e);
            }
        }
        
        if (existingWo) { // Update
            finalWo = {
                ...existingWo,
                lat: lat,
                lon: lon,
                address: formData.address,
                filterData: {
                    ...existingWo.filterData,
                    woNumber: formData.woNumber,
                    fullAddress: formData.address,
                    workType: formData.workType,
                    status: formData.status, // Correctly update status
                    strikeTeam: formData.strikeTeam || 'Unassigned',
                    notes: formData.notes,
                    lastContacted: formData.lastContacted,
                    contactName: formData.contactName,
                    contactPhone: formData.contactPhone
                },
            };
            setProcessedWorkOrders(prev => prev.map(wo => wo.filterData.woNumber === formData.originalWoNumber ? finalWo : wo));
        } else { // Create
             finalWo = {
                lat: lat,
                lon: lon,
                address: formData.address,
                filterData: {
                    woNumber: formData.woNumber,
                    workType: formData.workType,
                    originalWorkType: formData.workType,
                    status: formData.status || 'Unscheduled', // Use form status or default
                    strikeTeam: formData.strikeTeam || 'Unassigned',
                    fullAddress: formData.address,
                    originalStatus: 'Unscheduled',
                    notes: formData.notes,
                    lastContacted: formData.lastContacted,
                    contactName: formData.contactName,
                    contactPhone: formData.contactPhone
                },
                originalRow: {} // New WOs won't have an original row
            };
            setProcessedWorkOrders(prev => [...prev, finalWo]);
        }
        
        setIsWorkOrderModalOpen(false);
        setEditingWorkOrder(null);
        if (isPlacingWorkOrder) setIsPlacingWorkOrder(false);
        setMessage({ text: `Work Order #${formData.woNumber} saved.`, type: 'success' });
    }, [processedWorkOrders, isPlacingWorkOrder]);

    const handleAddTeam = useCallback((teamName: string) => { if (!allTeams.includes(teamName)) setCustomTeams(prev => [...prev, teamName]); setIsAddTeamModalOpen(false); }, [allTeams]);

    // FIX: Implement `handleFocusWorkOrder` callback to center the map on a work order.
    const handleFocusWorkOrder = useCallback((wo: ProcessedWorkOrder) => {
        // If team filters are active and this WO's team is not selected, add it to the filter
        if (filters.teams.length > 0 && !filters.teams.includes(wo.filterData.strikeTeam)) {
            handleFilterChange('teams', [...filters.teams, wo.filterData.strikeTeam]);
        }
        setFocusedWorkOrderNumber(null); // Reset to allow re-triggering for same WO
        setTimeout(() => {
            setFocusedWorkOrderNumber(wo.filterData.woNumber);
            setMobileView('map');
        }, 100);
    }, [filters.teams, handleFilterChange]);

    // --- NEW: Handle opening site survey from map ---
    const handleOpenSiteSurvey = useCallback((surveyId: string) => {
        setSelectedSurveyId(surveyId);
        setCurrentView('siteSurveys');
        setMobileView('sidebar'); // Or whichever view shows the main content on mobile
    }, []);

    const handleApiKeyMissing = useCallback(() => setApiKeyError(true), []);
    const handleApiReady = useCallback(() => setIsApiReady(true), []);
    const handleOpenAddTeamModal = useCallback(() => setIsAddTeamModalOpen(true), []);

    // --- LOCATION MODAL HANDLERS ---
    const handleOpenAddLocationModal = useCallback(() => {
        setIsAddLocationModalOpen(true);
    }, []);

    const handleLocationTypeSelect = useCallback((type: 'WorkOrder' | 'Hazard' | 'Infrastructure', subtype?: string) => {
        setIsAddLocationModalOpen(false);
        if (type === 'WorkOrder') {
            setIsPlacingWorkOrder(true);
            setMessage({ text: 'Click on the map to place a new Work Order.', type: 'info' });
        } else if (type === 'Hazard') {
            setIsAddingHazard(true);
            // Store subtype to use when creating the hazard
            if (subtype) {
                 setNewHazardInitialData(prev => ({ ...prev, type: subtype }));
            }
            setMessage({ text: `Click on the map to place a ${subtype || 'Hazard'} marker.`, type: 'info' });
        }
    }, []);

    const handleInfrastructureTypeSelect = useCallback((type: InfrastructureType) => {
        setIsAddLocationModalOpen(false);
        setPlacingInfrastructureType(type);
        setMessage({ text: `Click on the map to place ${type}.`, type: 'info' });
    }, []);

    // --- MAP INTERACTION HANDLERS ---
    const onMapClickForHazard = useCallback((lat: number, lon: number) => {
        setIsAddingHazard(false);
        setNewHazardInitialData(prev => ({ ...prev, lat, lon })); // Use functional update to preserve subtype
        setIsHazardModalOpen(true);
        setMessage(null);
    }, []);

    const onMapClickForWorkOrder = useCallback((lat: number, lon: number) => {
        setIsPlacingWorkOrder(false);
        setEditingWorkOrder(null);
        
        const placeholderWO: ProcessedWorkOrder = {
            lat, lon,
            address: '',
            fileLat: lat, fileLon: lon,
            filterData: {
                woNumber: `NEW-${Date.now()}`,
                status: 'Unscheduled',
                workType: 'Other',
                strikeTeam: 'Unassigned',
                fullAddress: '',
                originalWorkType: '',
                originalStatus: '',
                isGeneratedWoNumber: true
            },
            originalRow: {}
        };
        
        reverseGeocode(new google.maps.Geocoder(), lat, lon).then(addr => {
             placeholderWO.address = addr;
             placeholderWO.filterData.fullAddress = addr;
             setEditingWorkOrder(placeholderWO);
             setIsWorkOrderModalOpen(true);
        }).catch(() => {
             setEditingWorkOrder(placeholderWO);
             setIsWorkOrderModalOpen(true);
        });
        
        setMessage(null);
    }, []);

    const onMapClickForInfrastructure = useCallback((lat: number, lon: number) => {
        if (placingInfrastructureType) {
             setNewInfrastructureData({ lat, lon, address: '' });
             // Reverse geocode
             reverseGeocode(new google.maps.Geocoder(), lat, lon).then(addr => {
                setNewInfrastructureData({ lat, lon, address: addr });
                setIsInfrastructureModalOpen(true);
             }).catch(() => {
                setIsInfrastructureModalOpen(true);
             });
             
             setPlacingInfrastructureType(null); 
             setMessage(null);
        }
    }, [placingInfrastructureType]);


    // --- HAZARD & INFRASTRUCTURE HANDLERS ---
    const handleSaveHazard = useCallback((data: any) => {
        if (data.id) {
             setHazardMarkers(prev => prev.map(h => h.id === data.id ? { ...h, ...data } : h));
        } else {
             const newHazard = { ...data, id: `HAZ-${Date.now()}` };
             setHazardMarkers(prev => [...prev, newHazard]);
        }
        setIsHazardModalOpen(false);
        setNewHazardInitialData(null);
        setMessage({ text: 'Marker saved.', type: 'success' });
    }, []);

    const handleDeleteHazard = useCallback((id: string) => {
        setHazardMarkers(prev => prev.filter(h => h.id !== id));
        setMessage({ text: 'Marker deleted.', type: 'info' });
    }, []);

    const handleEditHazard = useCallback((id: string) => {
        const hazard = hazardMarkers.find(h => h.id === id);
        if (hazard) {
            setNewHazardInitialData(hazard);
            setIsHazardModalOpen(true);
        }
    }, [hazardMarkers]);

    const handleSaveInfrastructure = useCallback((data: any) => {
        if (data.id) {
            setInfrastructureMarkers(prev => prev.map(i => i.id === data.id ? { ...i, ...data } : i));
        } else {
            const newInfra = { ...data, id: `INFRA-${Date.now()}` };
            setInfrastructureMarkers(prev => [...prev, newInfra]);
        }
        setIsInfrastructureModalOpen(false);
        setNewInfrastructureData(null);
        setMessage({ text: 'Infrastructure location saved.', type: 'success' });
    }, []);

    const handleDeleteInfrastructure = useCallback((id: string) => {
        setInfrastructureMarkers(prev => prev.filter(i => i.id !== id));
        setMessage({ text: 'Infrastructure location deleted.', type: 'info' });
    }, []);

    // --- LAYER HANDLERS ---
    const handleCountyLayerAdd = useCallback((geojson: any, name: string) => {
        const newLayer: MapLayer = {
            id: `LAYER-${Date.now()}`,
            name: name,
            data: geojson,
            type: 'boundary'
        };
        setMapLayers(prev => [...prev, newLayer]);
        setIsCountySearchModalOpen(false);
        setMessage({ text: `Added boundary for ${name}`, type: 'success' });
    }, []);

    // --- ZONE HANDLERS ---
    const handleStartDrawingZone = (type: 'Primary' | 'Secondary') => {
        setDrawingZoneType(type);
        setMessage({ text: `Click points on the map to draw the ${type} Zone. Double click to finish.`, type: 'info' });
    };

    const handleZoneCreated = (type: 'Primary' | 'Secondary', path: { lat: number; lng: number }[]) => {
        const newZone: ImpactZone = {
            id: `ZONE-${Date.now()}`,
            type,
            path
        };
        setImpactZones(prev => [...prev, newZone]);
        setDrawingZoneType(null);
        setMessage({ text: `${type} Zone created successfully.`, type: 'success' });
    };

    const handleToggleZoneVisibility = (type: 'Primary' | 'Secondary') => {
        if (type === 'Primary') setShowPrimaryZones(!showPrimaryZones);
        else setShowSecondaryZones(!showSecondaryZones);
    };

    const handleClearZones = () => {
        if (window.confirm("Are you sure you want to clear all impact zones?")) {
            setImpactZones([]);
        }
    };

    // --- PROPERTY SEARCH HANDLER ---
    const handlePropertyFound = useCallback((data: any) => {
        setIsPropertySearchModalOpen(false);
        if (data.lat && data.lon) {
            setViewConfig({
                center: { lat: data.lat, lng: data.lon },
                zoom: 18,
                mapTypeId: 'satellite'
            });
            setNewSurveyData({
                address: data.display_name,
                lat: data.lat,
                lon: data.lon,
                fullData: data 
            });
            setCurrentView('siteSurveys');
        }
    }, []);

    const handleUpdateSurvey = (survey: SiteSurvey) => {
        setSiteSurveys(prev => {
            const exists = prev.find(s => s.id === survey.id);
            if (exists) {
                return prev.map(s => s.id === survey.id ? survey : s);
            }
            return [...prev, survey];
        });

        // Sync to Map Markers
        setProcessedWorkOrders(prev => {
            const woNumber = survey.id;
            const existingIndex = prev.findIndex(wo => wo.filterData.woNumber === woNumber);
            
             const newWo: ProcessedWorkOrder = {
                lat: survey.data.lat,
                lon: survey.data.lon,
                address: survey.address,
                fileLat: survey.data.lat,
                fileLon: survey.data.lon,
                filterData: {
                    woNumber: woNumber,
                    workType: 'Site Survey',
                    originalWorkType: 'Site Survey',
                    status: 'Unscheduled',
                    strikeTeam: 'Unassigned',
                    fullAddress: survey.address,
                    originalStatus: survey.status,
                    isGeneratedWoNumber: true,
                    notes: `Generated from Site Survey.`,
                    contactName: survey.data.contactName || survey.data.ownerName, // Use Contact Name, fallback to Owner if empty
                    contactPhone: survey.data.contactPhone || survey.data.ownerPhone // Use Contact Phone, fallback to Owner if empty
                },
                originalRow: {}
            };

            if (existingIndex !== -1) {
                const updated = [...prev];
                // Preserve existing status and team assignment
                newWo.filterData.status = updated[existingIndex].filterData.status;
                newWo.filterData.strikeTeam = updated[existingIndex].filterData.strikeTeam;
                updated[existingIndex] = newWo;
                return updated;
            } else {
                return [...prev, newWo];
            }
        });
    };

    return (
        <div className="flex h-screen supports-[height:100dvh]:h-[100dvh] bg-[#212529] text-white font-sans overflow-hidden">
            {/* Desktop Sidebar - Hidden on small screens if not in sidebar view */}
            <div className="hidden md:flex md:flex-shrink-0">
                <MainSidebar currentView={currentView} onViewChange={setCurrentView} />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <AppHeader 
                    currentView={currentView} 
                    onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                    operationName={operationName}
                    onOperationNameChange={setOperationName}
                />
                
                {isMobileMenuOpen && (
                     <div className="md:hidden absolute top-16 left-0 w-64 bg-[#262626] z-50 h-[calc(100vh-4rem)] shadow-2xl border-r border-gray-700">
                        <MainSidebar currentView={currentView} onViewChange={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} />
                     </div>
                )}

                <div className="flex-1 relative overflow-hidden">
                    {/* WORK ORDERS VIEW (MAP + BOARD) */}
                    {currentView === 'workOrders' && (
                        <div className="absolute inset-0 flex flex-col xl:flex-row pb-16 xl:pb-0">
                            {/* Left Sidebar (Assignment Board) - MOVED TO LEFT */}
                            <div className={`${mobileView === 'board' ? 'flex' : 'hidden'} xl:flex w-full xl:w-96 bg-[#2d2d2d] border-r border-gray-700 flex-col z-20 absolute xl:relative h-full`}>
                                <AssignmentBoard 
                                    workOrdersByTeam={derivedData.workOrdersByTeam} 
                                    teams={allTeams} 
                                    onReassign={handleReassign} 
                                    onEditWorkOrder={handleEditWorkOrder}
                                    onDeleteWorkOrder={handleDeleteWorkOrder}
                                    onAddWorkOrder={handleAddWorkOrder}
                                    onAddTeam={handleOpenAddTeamModal}
                                    onFocusWorkOrder={handleFocusWorkOrder}
                                    onSiteSurveysClick={() => setCurrentView('siteSurveys')}
                                    focusedWorkOrderNumber={focusedWorkOrderNumber}
                                />
                            </div>

                            {/* Center Map Area */}
                            <div className={`${mobileView === 'map' ? 'flex' : 'hidden'} xl:flex flex-1 relative z-10`}>
                                {apiKeyError ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800 p-4 text-center">
                                        <div>
                                            <p className="text-red-400 font-bold mb-2">Google Maps API Key Error</p>
                                            <p className="text-gray-400 text-sm">Please check your API key configuration.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <MapComponent 
                                        apiKey={API_KEY} 
                                        workOrders={derivedData.filteredWorkOrdersForMap} 
                                        hazardMarkers={hazardMarkers} 
                                        infrastructureMarkers={infrastructureMarkers}
                                        mapLayers={mapLayers}
                                        impactZones={impactZones}
                                        showPrimaryZones={showPrimaryZones}
                                        showSecondaryZones={showSecondaryZones}
                                        drawingZoneType={drawingZoneType}
                                        onZoneCreated={handleZoneCreated}
                                        isAddingHazard={isAddingHazard}
                                        isPlacingWorkOrder={isPlacingWorkOrder}
                                        placingInfrastructureType={placingInfrastructureType}
                                        onApiKeyMissing={handleApiKeyMissing}
                                        onApiLoaded={handleApiReady}
                                        focusedWorkOrderNumber={focusedWorkOrderNumber}
                                        onEditWorkOrder={handleEditWorkOrder}
                                        onDeleteWorkOrder={handleDeleteWorkOrder}
                                        onFocusWorkOrder={handleFocusWorkOrder}
                                        onMapClickForHazard={onMapClickForHazard}
                                        onMapClickForWorkOrder={onMapClickForWorkOrder}
                                        onMapClickForInfrastructure={onMapClickForInfrastructure}
                                        onDeleteHazard={handleDeleteHazard}
                                        onEditHazard={(id) => {
                                             const h = hazardMarkers.find(m => m.id === id);
                                             if(h) { setNewHazardInitialData(h); setIsHazardModalOpen(true); }
                                        }}
                                        onDeleteInfrastructure={handleDeleteInfrastructure}
                                        viewConfig={viewConfig}
                                        siteSurveys={siteSurveys}
                                        onOpenSiteSurvey={handleOpenSiteSurvey}
                                    />
                                )}
                                
                                {/* Floating Message */}
                                {message && (
                                    <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50 text-sm font-semibold ${message.type === 'error' ? 'bg-red-900 text-white' : 'bg-blue-900 text-white'}`}>
                                        {message.text}
                                    </div>
                                )}

                                {/* Map Overlay Controls (if any) */}
                                {drawingZoneType && (
                                    <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded shadow z-50 text-sm">
                                        <p className="font-bold mb-1">Drawing {drawingZoneType} Zone</p>
                                        <p className="text-xs text-gray-300">Click to add points. Double-click to finish.</p>
                                        <button onClick={() => setDrawingZoneType(null)} className="mt-2 text-xs text-red-300 hover:text-white underline">Cancel</button>
                                    </div>
                                )}
                            </div>

                            {/* Right Sidebar (Filters) - MOVED TO RIGHT */}
                            <div className={`${mobileView === 'sidebar' ? 'flex' : 'hidden'} xl:flex w-full xl:w-80 bg-[#2d2d2d] border-l border-gray-700 flex-col z-20 absolute xl:relative h-full right-0`}>
                                <div className="p-4 overflow-y-auto flex-1">
                                    <Sidebar 
                                        onFileUpload={handleFileUpload} 
                                        setMessage={setMessage} 
                                        message={message} 
                                        statusOptions={STATIC_STATUSES} 
                                        workTypeOptions={STATIC_WORK_TYPES}
                                        teamOptions={allTeams} 
                                        unlocatedWorkOrders={unlocatedWorkOrders}
                                        filters={filters} 
                                        onFilterChange={handleFilterChange} 
                                        onClearAllData={handleClearAllData} 
                                        onExportData={handleExportData}
                                        onAddLocation={handleOpenAddLocationModal}
                                        onAddCounty={() => setIsCountySearchModalOpen(true)}
                                        isApiReady={isApiReady}
                                        showPrimaryZones={showPrimaryZones}
                                        showSecondaryZones={showSecondaryZones}
                                        onToggleZoneVisibility={handleToggleZoneVisibility}
                                        onStartDrawingZone={handleStartDrawingZone}
                                        onClearZones={handleClearZones}
                                        isDrawing={drawingZoneType !== null}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* OTHER VIEWS */}
                    {currentView === 'finance' && <FinanceTracker apiKey={API_KEY} />}
                    {currentView === 'siteSurveys' && (
                        <SiteSurveyView 
                            onSearchProperty={() => setIsPropertySearchModalOpen(true)} 
                            newSurveyData={newSurveyData}
                            apiKey={API_KEY}
                            onSave={handleUpdateSurvey}
                            surveys={siteSurveys}
                            onUpdateSurvey={handleUpdateSurvey}
                            selectedSurveyId={selectedSurveyId}
                        />
                    )}
                    {currentView === 'home' && <HomeView />}
                    {currentView === 'attendance' && <AttendanceView />}
                    {currentView === 'teams' && <TeamsView />}
                    {currentView === 'transport' && <TransportView />}
                    {currentView === 'equipment' && <EquipmentView />}
                    {currentView === 'icsForms' && <ICSFormsView />}

                </div>
            </div>

            {/* Mobile Navigation Bar - FIXED BOTTOM - MOVED TO ROOT */}
            {currentView === 'workOrders' && (
                <div className="xl:hidden fixed bottom-0 left-0 right-0 z-[9999] border-t border-gray-700 bg-[#262626] pb-[env(safe-area-inset-bottom)]">
                    <MobileNav activeView={mobileView} onViewChange={setMobileView} />
                </div>
            )}

            {/* MODALS */}
            <WorkOrderModal 
                isOpen={isWorkOrderModalOpen} 
                onClose={() => { setIsWorkOrderModalOpen(false); setEditingWorkOrder(null); }} 
                onSave={handleSaveWorkOrder} 
                workOrder={editingWorkOrder} 
                teams={allTeams} 
                onSelectLocationOnMap={() => { 
                    setIsWorkOrderModalOpen(false); 
                    setIsPlacingWorkOrder(true); 
                    setMessage({ text: 'Click on the map to set location.', type: 'info' }); 
                }} 
            />
            
            <AddTeamModal 
                isOpen={isAddTeamModalOpen} 
                onClose={() => setIsAddTeamModalOpen(false)} 
                onAdd={handleAddTeam} 
                existingTeams={allTeams} 
            />

            <HazardModal 
                isOpen={isHazardModalOpen} 
                onClose={() => setIsHazardModalOpen(false)} 
                onSave={handleSaveHazard} 
                onSelectOnMap={() => { 
                    setIsHazardModalOpen(false); 
                    setIsAddingHazard(true); 
                    setMessage({ text: 'Click on the map to set location.', type: 'info' }); 
                }} 
                initialData={newHazardInitialData} 
            />

            <InfrastructureModal
                isOpen={isInfrastructureModalOpen}
                onClose={() => setIsInfrastructureModalOpen(false)}
                onSave={handleSaveInfrastructure}
                onSelectOnMap={() => {
                    setIsInfrastructureModalOpen(false);
                    setPlacingInfrastructureType(currentInfraTypeForPlacement || 'FOB'); 
                    setMessage({ text: 'Click on map to set location.', type: 'info' });
                }}
                type={placingInfrastructureType || 'FOB'} // Default fallback, usually set before modal opens
                initialData={newInfrastructureData}
            />

            <AddLocationTypeModal 
                isOpen={isAddLocationModalOpen} 
                onClose={() => setIsAddLocationModalOpen(false)} 
                onSelectType={handleLocationTypeSelect}
                onSelectInfrastructureType={handleInfrastructureTypeSelect}
            />

            <CountySearchModal 
                isOpen={isCountySearchModalOpen} 
                onClose={() => setIsCountySearchModalOpen(false)} 
                onAddLayer={handleCountyLayerAdd} 
            />

            <PropertySearchModal
                isOpen={isPropertySearchModalOpen}
                onClose={() => setIsPropertySearchModalOpen(false)}
                onPropertyFound={handlePropertyFound}
            />
        </div>
    );
};

export default MainLayout;
