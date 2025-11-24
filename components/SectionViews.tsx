
import React, { useState, useEffect } from 'react';
import { PrinterIcon } from './Icons';

// --- COMMON STYLES FOR PRINT ---
const PrintStyles = () => (
    <style>{`
        @media print {
            @page { margin: 0.5cm; size: auto; }
            body * { visibility: hidden; }
            .print-container, .print-container * { visibility: visible; }
            .print-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                min-height: 100%;
                background: white;
                color: black;
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.2;
            }
            .print-border { border: 2px solid black; }
            .print-border-b { border-bottom: 1px solid black; }
            .print-border-r { border-right: 1px solid black; }
            .print-border-t { border-top: 1px solid black; }
            .print-border-l { border-left: 1px solid black; }
            .print-label { font-weight: bold; font-size: 10px; display: block; margin-bottom: 2px; }
            .print-content { min-height: 16px; }
            .print-textarea { white-space: pre-wrap; }
            .print-checkbox { 
                display: inline-block; 
                width: 10px; 
                height: 10px; 
                border: 1px solid black; 
                margin-right: 4px; 
                text-align: center; 
                line-height: 8px; 
                vertical-align: middle;
            }
            .print-checked::after { content: 'X'; font-size: 9px; font-weight: bold; }
            .print-table { width: 100%; border-collapse: collapse; }
            .print-table th, .print-table td { border: 1px solid black; padding: 2px 4px; text-align: left; vertical-align: top; }
            .print-table th { background-color: #f0f0f0 !important; font-weight: bold; text-align: center; }
            .print-header { background-color: #e0e0e0 !important; font-weight: bold; text-align: center; padding: 4px; border-bottom: 1px solid black; font-size: 14px; }
            .print-section-header { background-color: #f0f0f0 !important; font-weight: bold; padding: 2px 4px; border-top: 1px solid black; border-bottom: 1px solid black; text-align: center; }
            input[type="checkbox"] { -webkit-print-color-adjust: exact; }
        }
    `}</style>
);

// --- COMMON HEADER COMPONENT FOR FORMS ---
const ICSHeader: React.FC<{ 
    formName: string, 
    formNumber: string, 
    data: any, 
    onChange: (key: string, value: any) => void 
}> = ({ formName, formNumber, data, onChange }) => (
    <div className="flex print-border-b">
        <div className="w-1/2 print-border-r p-1">
            <span className="print-label">1. Incident Name:</span>
            <div className="print-content font-bold text-sm">{data.incidentName}</div>
        </div>
        <div className="w-1/2 p-1">
            <span className="print-label">2. Operational Period: {data.opPeriodNum}</span>
            <div className="flex justify-between mt-1">
                <div><span className="text-[10px] font-bold mr-1">Date From:</span>{data.dateFrom}</div>
                <div><span className="text-[10px] font-bold mr-1">Date To:</span>{data.dateTo}</div>
            </div>
            <div className="flex justify-between">
                <div><span className="text-[10px] font-bold mr-1">Time From:</span>{data.timeFrom}</div>
                <div><span className="text-[10px] font-bold mr-1">Time To:</span>{data.timeTo}</div>
            </div>
        </div>
    </div>
);

// --- COMMON PREPARED BY FOOTER ---
const ICSFooter: React.FC<{ 
    formNumber: string, 
    preparedName: string, 
    preparedPosition: string, 
    dateTime: string,
    approvedBy?: string
}> = ({ formNumber, preparedName, preparedPosition, dateTime, approvedBy }) => (
    <div className="print-border-t flex">
        {approvedBy !== undefined && (
            <div className="w-1/3 print-border-r p-1">
                <span className="print-label">7. Approved By:</span>
                <div className="print-content font-bold">{approvedBy}</div>
                <div className="text-[9px] mt-1">Incident Commander / Safety Officer</div>
            </div>
        )}
        <div className={`${approvedBy !== undefined ? 'w-2/3' : 'w-full'} p-1`}>
            <span className="print-label">{approvedBy !== undefined ? '8.' : '4.'} Prepared by:</span>
            <div className="flex justify-between items-end">
                <div>
                    <span className="text-[10px] mr-1">Name:</span>
                    <span className="font-bold mr-4">{preparedName}</span>
                    <span className="text-[10px] mr-1">Position/Title:</span>
                    <span>{preparedPosition}</span>
                </div>
                <div className="text-[10px]">
                    <span className="mr-1">Date/Time:</span>
                    <span>{dateTime}</span>
                </div>
            </div>
        </div>
        <div className="absolute bottom-0 right-0 p-1 text-[9px] font-bold bg-white">
            {formNumber}
        </div>
    </div>
);

// --- HOME VIEW ---
export const HomeView: React.FC = () => {
    return (
        <div className="p-6 overflow-y-auto h-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Home</h2>
                <p className="text-gray-400">Situational Awareness</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Stats Section */}
                <div className="space-y-6">
                    <div className="bg-[#343a40] p-6 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4">Personnel</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-3xl font-bold text-blue-400">3/27</p>
                                <p className="text-sm text-gray-400">Working</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">0</p>
                                <p className="text-sm text-gray-400">Inbound</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">0</p>
                                <p className="text-sm text-gray-400">Outbound</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#343a40] p-6 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4">Work Orders</h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-3xl font-bold text-white">0</p>
                                <p className="text-sm text-gray-400">In Progress</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">0</p>
                                <p className="text-sm text-gray-400">Completed</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-white">0</p>
                                <p className="text-sm text-gray-400">Total</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#343a40] p-6 rounded-lg border border-gray-600">
                        <h3 className="text-lg font-semibold text-white mb-4">Equipment (Assigned/On Hand)</h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-3xl font-bold text-blue-400">0/7</p>
                                <p className="text-sm text-gray-400">SUV</p>
                            </div>
                            <div>
                                <p className="text-3xl font-bold text-blue-400">0/3</p>
                                <p className="text-sm text-gray-400">Tech Kit</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Weather/Map Section */}
                <div className="bg-[#343a40] rounded-lg border border-gray-600 overflow-hidden flex flex-col h-full min-h-[400px]">
                    <div className="p-6 bg-gray-800">
                        <h3 className="text-2xl font-bold text-white">Mostly sunny</h3>
                        <p className="text-gray-300">Savanna la Mar, International</p>
                        <div className="flex items-center mt-4">
                            <span className="text-5xl font-bold text-white">86°F</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">Humidity: 62% Wind: 18.6 mi/h SE</p>
                    </div>
                    <div className="flex-grow bg-gray-700 relative">
                        {/* Placeholder for mini map */}
                         <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                            [Mini Map View]
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ATTENDANCE VIEW ---
export const AttendanceView: React.FC = () => {
    // Anonymized Data
    const personnel = [
        { name: 'Volunteer, Alpha', contact: '555-010-1001', checkIn: '08:00 EST', checkOut: '17:00 EST' },
        { name: 'Volunteer, Bravo', contact: '555-010-1002', checkIn: '08:15 EST', checkOut: '17:00 EST' },
        { name: 'Volunteer, Charlie', contact: '555-010-1003', checkIn: '08:05 EST', checkOut: '17:00 EST' },
        { name: 'Volunteer, Delta', contact: '555-010-1004', checkIn: '07:55 EST', checkOut: '17:00 EST' },
        { name: 'Volunteer, Echo', contact: '555-010-1005', checkIn: '08:30 EST', checkOut: '17:00 EST' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#212529]">
            <div className="p-4 border-b border-gray-700">
                <h2 className="text-2xl font-bold text-white">Attendance</h2>
                <p className="text-gray-400">Attendance Sheet</p>
            </div>
            <div className="p-4">
                <input 
                    type="text" 
                    placeholder="Search" 
                    className="w-full bg-[#343a40] text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:border-[#A92128]"
                />
            </div>
            <div className="flex-1 overflow-auto p-4 pt-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#343a40] text-gray-300 text-sm sticky top-0 z-10">
                        <tr>
                            <th className="p-3 border-b border-gray-600">Name</th>
                            <th className="p-3 border-b border-gray-600">Contact</th>
                            <th className="p-3 border-b border-gray-600">Signature</th>
                            <th className="p-3 border-b border-gray-600">Billeting</th>
                            <th className="p-3 border-b border-gray-600">Checked In</th>
                            <th className="p-3 border-b border-gray-600">Checked Out</th>
                            <th className="p-3 border-b border-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-200 text-sm">
                        {personnel.map((p, i) => (
                            <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                                <td className="p-3">{p.name}</td>
                                <td className="p-3">{p.contact}</td>
                                <td className="p-3"><input type="checkbox" checked readOnly className="accent-gray-500" /></td>
                                <td className="p-3">🏠</td>
                                <td className="p-3">{p.checkIn}</td>
                                <td className="p-3">{p.checkOut}</td>
                                <td className="p-3"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- TEAMS VIEW ---
export const TeamsView: React.FC = () => {
    const teams = ['C&G', 'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf'];
    
    return (
        <div className="p-6 overflow-y-auto h-full">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white">Teams</h2>
                <div className="flex space-x-4 text-sm text-blue-400 mt-2">
                    <button className="border-b-2 border-blue-400 pb-1">Personnel 24/27</button>
                    <button className="text-gray-400 pb-1 hover:text-white">Devices 12/12</button>
                    <button className="text-gray-400 pb-1 hover:text-white">Vehicles 7/7</button>
                    <button className="text-gray-400 pb-1 hover:text-white">Kits 3/3</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="col-span-1">
                    <h3 className="text-xl font-bold text-white mb-4">Strike Teams</h3>
                </div>
                <div className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teams.map(team => (
                        <div key={team} className="bg-[#343a40] p-4 rounded-lg border border-gray-600 min-h-[200px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                    {team} 
                                    {team === 'C&G' && <span className="text-green-500">✓</span>}
                                </h4>
                                <div className="flex gap-2 text-gray-400">
                                    <button>✏️</button>
                                    <button>📋</button>
                                </div>
                            </div>
                            {team === 'C&G' ? (
                                <div className="space-y-2">
                                    <div className="bg-gray-700 p-2 rounded text-sm text-white flex justify-between">
                                        <span>👤 <strong>IC:</strong> TBD</span>
                                        <button>✎</button>
                                    </div>
                                    <div className="bg-gray-700 p-2 rounded text-sm text-white flex justify-between">
                                        <span>👤 <strong>OSC:</strong> TBD</span>
                                        <button>✎</button>
                                    </div>
                                    <div className="bg-gray-700 p-2 rounded text-sm text-white flex justify-between">
                                        <span>👤 <strong>SOFR:</strong> TBD</span>
                                        <button>✎</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center text-gray-400 text-sm hover:bg-gray-700/30 transition cursor-pointer">
                                    <span className="text-2xl mb-1">+</span>
                                    Drag & drop resources
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- TRANSPORT VIEW ---
export const TransportView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Arrivals');
    return (
        <div className="flex flex-col h-full bg-[#212529]">
            <div className="p-6 pb-0">
                <h2 className="text-2xl font-bold text-white mb-4">Transport</h2>
                <div className="flex border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('Summary')}
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'Summary' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Summary
                    </button>
                    <button 
                        onClick={() => setActiveTab('Arrivals')}
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'Arrivals' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Flight Arrivals Plan
                    </button>
                    <button 
                        onClick={() => setActiveTab('Departures')}
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'Departures' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Flight Departures Plan
                    </button>
                </div>
            </div>
            <div className="p-6 flex-1 overflow-auto">
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="w-full bg-[#343a40] text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:border-[#A92128]"
                    />
                </div>
                {activeTab === 'Arrivals' && (
                     <div className="bg-[#343a40] rounded-lg border border-gray-600 overflow-hidden min-h-[400px]">
                        <div className="p-4 border-b border-gray-600">
                            <h3 className="font-bold text-white">Flight Arrivals</h3>
                        </div>
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-[#2d2d2d] text-gray-400">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Flight</th>
                                    <th className="p-3">Airport</th>
                                    <th className="p-3">Arr Time</th>
                                    <th className="p-3">Contact</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-8 text-center text-gray-500 italic" colSpan={5}>No records found</td>
                                </tr>
                            </tbody>
                        </table>
                     </div>
                )}
                 {activeTab === 'Departures' && (
                     <div className="bg-[#343a40] rounded-lg border border-gray-600 overflow-hidden min-h-[400px]">
                         <div className="p-4 border-b border-gray-600">
                            <h3 className="font-bold text-white">Flight Departures</h3>
                        </div>
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-[#2d2d2d] text-gray-400">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Flight</th>
                                    <th className="p-3">Airport</th>
                                    <th className="p-3">Dep Time</th>
                                    <th className="p-3">Contact</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="p-8 text-center text-gray-500 italic" colSpan={5}>No records found</td>
                                </tr>
                            </tbody>
                        </table>
                     </div>
                )}
                {activeTab === 'Summary' && (
                     <div className="text-center p-10 text-gray-400">Transport Summary Dashboard Placeholder</div>
                )}
            </div>
        </div>
    );
};

// --- EQUIPMENT VIEW ---
export const EquipmentView: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Mobile');
    const devices = [
        { id: 'US 19028', number: '310-555-0100', role: 'Op Mobile Device', assigned: 'Unassigned', date: '2025-11-29' },
        { id: 'US 19177', number: '214-555-0101', role: 'Op Mobile Device', assigned: 'Unassigned', date: '2025-11-29' },
        { id: 'US 18925', number: '310-555-0102', role: 'Op Mobile Device', assigned: 'Unassigned', date: '2025-11-29' },
        { id: 'US 19315', number: '213-555-0103', role: 'Op Mobile Device', assigned: 'Unassigned', date: '2025-11-29' },
    ];

    return (
        <div className="flex flex-col h-full bg-[#212529]">
            <div className="p-6 pb-0">
                <h2 className="text-2xl font-bold text-white mb-4">Equipment Setup</h2>
                <div className="flex border-b border-gray-700">
                    <button 
                        onClick={() => setActiveTab('Mobile')}
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'Mobile' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Mobile Devices
                    </button>
                    <button 
                        onClick={() => setActiveTab('Vehicles')}
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'Vehicles' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Vehicles
                    </button>
                    <button 
                        onClick={() => setActiveTab('Kits')}
                        className={`px-6 py-3 text-sm font-medium ${activeTab === 'Kits' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                    >
                        Team Kits
                    </button>
                </div>
            </div>
            <div className="p-6 flex-1 overflow-auto">
                 <div className="flex justify-between mb-4">
                    <input 
                        type="text" 
                        placeholder="Search" 
                        className="flex-grow bg-[#343a40] text-white p-3 rounded-md border border-gray-600 focus:outline-none focus:border-[#A92128] mr-4"
                    />
                    <button className="bg-blue-500 text-white font-bold px-4 py-2 rounded-md hover:bg-blue-600">Add Device</button>
                </div>
                
                {activeTab === 'Mobile' && (
                    <div className="rounded-lg border border-gray-600 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-[#2d2d2d] text-gray-400">
                                <tr>
                                    <th className="p-3">Id</th>
                                    <th className="p-3">Number</th>
                                    <th className="p-3">Role</th>
                                    <th className="p-3">Assigned to</th>
                                    <th className="p-3">Demob date</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map((d, i) => (
                                    <tr key={i} className="border-b border-gray-700 hover:bg-gray-800">
                                        <td className="p-3">{d.id}</td>
                                        <td className="p-3">{d.number}</td>
                                        <td className="p-3">{d.role}</td>
                                        <td className="p-3">{d.assigned}</td>
                                        <td className="p-3">{d.date}</td>
                                        <td className="p-3 text-right">⋮</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {activeTab !== 'Mobile' && (
                    <div className="text-center p-10 text-gray-400">Placeholder for {activeTab}</div>
                )}
            </div>
        </div>
    );
};

// --- ICS 202 FORM COMPONENT ---
const initialICS202State = {
    incidentName: '', opPeriodNum: '', dateFrom: '', dateTo: '', timeFrom: '', timeTo: '',
    objectives: '', commandEmphasis: '', situationalAwareness: '',
    safetyPlanRequired: false, safetyPlanLocation: '',
    attachments: { ics203: false, ics204: false, ics205a: false, ics206: false, ics207: false, ics208: false, ics218: false, mapChart: false, weather: false },
    otherAttachments: '', approvedBy: '', preparedBy: '', preparedPosition: 'Planning Section Chief', preparedDateTime: ''
};

const ICS202Form: React.FC = () => {
    const [data, setData] = useState(initialICS202State);
    
    useEffect(() => {
        const saved = localStorage.getItem('ics_202_data');
        if (saved) setData(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        localStorage.setItem('ics_202_data', JSON.stringify(data));
        alert('ICS 202 Saved');
    };

    const handleChange = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));
    
    return (
        <div className="flex flex-col h-full w-full">
            <PrintStyles />
            <div className="flex-1 overflow-y-auto p-6 print:hidden space-y-6 max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">202 - Incident Objectives</h2>
                    <div className="flex gap-2">
                        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow"><PrinterIcon className="w-5 h-5" /> Print / PDF</button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Incident Name" value={data.incidentName} onChange={e => handleChange('incidentName', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    <input type="text" placeholder="Op Period #" value={data.opPeriodNum} onChange={e => handleChange('opPeriodNum', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={data.dateFrom} onChange={e => handleChange('dateFrom', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    <input type="date" value={data.dateTo} onChange={e => handleChange('dateTo', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    <input type="time" value={data.timeFrom} onChange={e => handleChange('timeFrom', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    <input type="time" value={data.timeTo} onChange={e => handleChange('timeTo', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                </div>
                <textarea placeholder="3. Objectives" rows={5} value={data.objectives} onChange={e => handleChange('objectives', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                <textarea placeholder="4. Command Emphasis" rows={4} value={data.commandEmphasis} onChange={e => handleChange('commandEmphasis', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                <textarea placeholder="General Situational Awareness" rows={4} value={data.situationalAwareness} onChange={e => handleChange('situationalAwareness', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                <div className="bg-gray-800 p-3 rounded">
                    <label className="flex items-center text-white mb-2"><input type="checkbox" checked={data.safetyPlanRequired} onChange={e => handleChange('safetyPlanRequired', e.target.checked)} className="mr-2" /> Site Safety Plan Required?</label>
                    {data.safetyPlanRequired && <input type="text" placeholder="Location of Safety Plan" value={data.safetyPlanLocation} onChange={e => handleChange('safetyPlanLocation', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Approved By (IC)" value={data.approvedBy} onChange={e => handleChange('approvedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Prepared By Name" value={data.preparedBy} onChange={e => handleChange('preparedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                        <input type="datetime-local" value={data.preparedDateTime} onChange={e => handleChange('preparedDateTime', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-blue-400 text-gray-900 font-bold py-2 px-6 rounded hover:bg-blue-300">Save</button>
                </div>
            </div>
            <div className="print-container hidden">
                <div className="print-border border-2">
                    <div className="print-header">INCIDENT OBJECTIVES (ICS 202)</div>
                    <ICSHeader formName="ICS 202" formNumber="ICS 202" data={data} onChange={handleChange} />
                    <div className="print-border-b p-1 min-h-[150px]"><span className="print-label">3. Objective(s):</span><div className="print-textarea text-xs mt-1">{data.objectives}</div></div>
                    <div className="print-border-b p-1 min-h-[150px]"><span className="print-label">4. Operational Period Command Emphasis:</span><div className="print-textarea text-xs mt-1 mb-4">{data.commandEmphasis}</div><span className="print-label mt-4">General Situational Awareness:</span><div className="print-textarea text-xs mt-1">{data.situationalAwareness}</div></div>
                    <div className="print-border-b p-1 flex justify-between items-center"><div><span className="print-label inline mr-2">5. Site Safety Plan Required?</span><span className={`print-checkbox ${data.safetyPlanRequired ? 'print-checked' : ''}`}></span> Yes <span className={`print-checkbox ${!data.safetyPlanRequired ? 'print-checked' : ''}`}></span> No</div>{data.safetyPlanRequired && <div className="ml-4 flex-grow"><span className="font-bold text-[10px] mr-2">Approved Site Safety Plan(s) Located at:</span>{data.safetyPlanLocation}</div>}</div>
                    <div className="print-border-b p-1"><span className="print-label mb-1">6. Incident Action Plan (the items checked below are included in this Incident Action Plan):</span><div className="flex"><div className="w-1/2 grid grid-cols-2 gap-1 text-[10px]">{Object.keys(data.attachments).map(k => <div key={k} className="flex items-center"><span className={`print-checkbox ${(data.attachments as any)[k] ? 'print-checked' : ''}`}></span> {k.toUpperCase()}</div>)}</div><div className="w-1/2 pl-2 border-l border-black"><span className="text-[10px] font-bold underline mb-1 block">Other Attachments:</span><div className="text-[10px] whitespace-pre-wrap">{data.otherAttachments}</div></div></div></div>
                    <ICSFooter formNumber="ICS 202" preparedName={data.preparedBy} preparedPosition={data.preparedPosition} dateTime={data.preparedDateTime} approvedBy={data.approvedBy} />
                </div>
            </div>
        </div>
    );
};

// --- ICS 203 FORM COMPONENT ---
const initialICS203State = {
    incidentName: '', opPeriodNum: '', dateFrom: '', dateTo: '', timeFrom: '', timeTo: '',
    ic: '', deputy: '', safetyOfficer: '', pio: '', liaison: '',
    agencyReps: [{ agency: '', name: '' }],
    planningChief: '', planningDeputy: '', resourcesUnit: '', situationUnit: '', techSpecialists: [{ name: '' }],
    logisticsChief: '', logisticsDeputy: '', supplyUnit: '', facilitiesUnit: '', groundSupportUnit: '', commsUnit: '', medicalUnit: '', foodUnit: '',
    opsChief: '', opsDeputy: '', stagingArea: '', 
    opsDivisions: [{ branch: '', stlName: '', capability: '' }],
    financeChief: '', financeDeputy: '',
    preparedBy: '', preparedPosition: 'Planning Section Chief', preparedDateTime: ''
};

const ICS203Form: React.FC = () => {
    const [data, setData] = useState(initialICS203State);

    useEffect(() => {
        const saved = localStorage.getItem('ics_203_data');
        if (saved) setData(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        localStorage.setItem('ics_203_data', JSON.stringify(data));
        alert('ICS 203 Saved');
    };

    const handleChange = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));
    const handleListChange = (listKey: string, index: number, field: string, value: string) => {
        const list = [...(data as any)[listKey]];
        list[index][field] = value;
        setData(prev => ({ ...prev, [listKey]: list }));
    };
    const addListItem = (listKey: string, initial: any) => setData(prev => ({ ...prev, [listKey]: [...(prev as any)[listKey], initial] }));
    const removeListItem = (listKey: string, index: number) => {
        const list = [...(data as any)[listKey]];
        list.splice(index, 1);
        setData(prev => ({ ...prev, [listKey]: list }));
    };

    return (
        <div className="flex flex-col h-full w-full">
            <PrintStyles />
            <div className="flex-1 overflow-y-auto p-6 print:hidden space-y-6 max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">203 - Organization Assignment List</h2>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow"><PrinterIcon className="w-5 h-5" /> Print / PDF</button>
                </div>
                {/* Basic Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Incident Name" value={data.incidentName} onChange={e => handleChange('incidentName', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <input type="text" placeholder="Op Period" value={data.opPeriodNum} onChange={e => handleChange('opPeriodNum', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                </div>
                {/* Command Staff */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">Command Staff</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" placeholder="IC/UC" value={data.ic} onChange={e => handleChange('ic', e.target.value)} className="bg-gray-700 text-white p-2 rounded" />
                        <input type="text" placeholder="Safety Officer" value={data.safetyOfficer} onChange={e => handleChange('safetyOfficer', e.target.value)} className="bg-gray-700 text-white p-2 rounded" />
                        <input type="text" placeholder="Public Info" value={data.pio} onChange={e => handleChange('pio', e.target.value)} className="bg-gray-700 text-white p-2 rounded" />
                        <input type="text" placeholder="Liaison" value={data.liaison} onChange={e => handleChange('liaison', e.target.value)} className="bg-gray-700 text-white p-2 rounded" />
                    </div>
                </div>
                {/* Agency Reps */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">Agency Representatives</h3>
                    {data.agencyReps.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <div className="grid grid-cols-2 gap-2 flex-grow">
                                <input type="text" placeholder="Agency" value={r.agency} onChange={e => handleListChange('agencyReps', i, 'agency', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Name" value={r.name} onChange={e => handleListChange('agencyReps', i, 'name', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                            </div>
                            <button onClick={() => removeListItem('agencyReps', i)} className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-500">Remove</button>
                        </div>
                    ))}
                    <button onClick={() => addListItem('agencyReps', { agency: '', name: '' })} className="bg-blue-400 text-gray-900 font-bold py-1 px-3 rounded hover:bg-blue-300 mt-2">Add</button>
                </div>
                {/* Operations Section */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">Operations Section</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input type="text" placeholder="Chief" value={data.opsChief} onChange={e => handleChange('opsChief', e.target.value)} className="bg-gray-700 text-white p-2 rounded" />
                        <input type="text" placeholder="Staging Area" value={data.stagingArea} onChange={e => handleChange('stagingArea', e.target.value)} className="bg-gray-700 text-white p-2 rounded" />
                    </div>
                    <h4 className="text-gray-400 text-sm mb-1">Divisions / Groups / Strike Teams</h4>
                    {data.opsDivisions.map((div, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <div className="grid grid-cols-3 gap-2 flex-grow">
                                <input type="text" placeholder="Branch/Div" value={div.branch} onChange={e => handleListChange('opsDivisions', i, 'branch', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="STL Name" value={div.stlName} onChange={e => handleListChange('opsDivisions', i, 'stlName', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Core Capability" value={div.capability} onChange={e => handleListChange('opsDivisions', i, 'capability', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                            </div>
                            <button onClick={() => removeListItem('opsDivisions', i)} className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-500">Remove</button>
                        </div>
                    ))}
                    <button onClick={() => addListItem('opsDivisions', { branch: '', stlName: '', capability: '' })} className="bg-blue-400 text-gray-900 font-bold py-1 px-3 rounded hover:bg-blue-300 mt-2">Add</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Prepared By Name" value={data.preparedBy} onChange={e => handleChange('preparedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <input type="datetime-local" value={data.preparedDateTime} onChange={e => handleChange('preparedDateTime', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-blue-400 text-gray-900 font-bold py-2 px-6 rounded hover:bg-blue-300">Save</button>
                </div>
            </div>
            {/* PRINT VIEW */}
            <div className="print-container hidden">
                <div className="print-border border-2">
                    <div className="print-header">ORGANIZATION ASSIGNMENT LIST (ICS 203)</div>
                    <ICSHeader formName="ICS 203" formNumber="ICS 203" data={data} onChange={handleChange} />
                    <div className="flex print-border-b">
                        {/* Left Column */}
                        <div className="w-1/2 print-border-r">
                            <div className="print-section-header">3. Incident Commander(s) and Command Staff:</div>
                            <div className="p-1"><span className="print-label">IC/UC:</span> {data.ic}</div>
                            <div className="p-1"><span className="print-label">Deputy:</span> {data.deputy}</div>
                            <div className="p-1"><span className="print-label">Safety Officer:</span> {data.safetyOfficer}</div>
                            <div className="p-1"><span className="print-label">Public Info. Officer:</span> {data.pio}</div>
                            <div className="p-1"><span className="print-label">Liaison Officer:</span> {data.liaison}</div>
                            <div className="print-section-header">4. Agency/Organization Representatives:</div>
                            <table className="print-table">
                                <thead><tr><th>Agency/Organization</th><th>Name</th></tr></thead>
                                <tbody>
                                    {data.agencyReps.map((r, i) => <tr key={i}><td className="h-4">{r.agency}</td><td>{r.name}</td></tr>)}
                                    {[...Array(Math.max(0, 3 - data.agencyReps.length))].map((_, i) => <tr key={`e${i}`}><td className="h-4">&nbsp;</td><td>&nbsp;</td></tr>)}
                                </tbody>
                            </table>
                            <div className="print-section-header">5. Planning Section:</div>
                            <div className="p-1"><span className="print-label">Chief:</span> {data.planningChief}</div>
                            <div className="p-1"><span className="print-label">Deputy:</span> {data.planningDeputy}</div>
                            <div className="p-1"><span className="print-label">Resources Unit:</span> {data.resourcesUnit}</div>
                            <div className="p-1"><span className="print-label">Situation Unit:</span> {data.situationUnit}</div>
                            <div className="print-section-header">6. Logistics Section:</div>
                            <div className="p-1"><span className="print-label">Chief:</span> {data.logisticsChief}</div>
                            <div className="p-1"><span className="print-label">Support Branch:</span></div>
                            <div className="pl-4 text-[10px]">Supply: {data.supplyUnit} | Facilities: {data.facilitiesUnit} | Ground: {data.groundSupportUnit}</div>
                            <div className="p-1"><span className="print-label">Service Branch:</span></div>
                            <div className="pl-4 text-[10px]">Comms: {data.commsUnit} | Medical: {data.medicalUnit} | Food: {data.foodUnit}</div>
                        </div>
                        {/* Right Column */}
                        <div className="w-1/2">
                            <div className="print-section-header">7. Operations Section:</div>
                            <div className="p-1"><span className="print-label">Chief:</span> {data.opsChief}</div>
                            <div className="p-1"><span className="print-label">Deputy:</span> {data.opsDeputy}</div>
                            <div className="p-1"><span className="print-label">Staging Area:</span> {data.stagingArea}</div>
                            <table className="print-table mt-2">
                                <thead><tr><th>Division/Branch</th><th>STL Name</th><th>Core Capability</th></tr></thead>
                                <tbody>
                                    {data.opsDivisions.map((d, i) => <tr key={i}><td className="h-4">{d.branch}</td><td>{d.stlName}</td><td>{d.capability}</td></tr>)}
                                    {[...Array(Math.max(0, 10 - data.opsDivisions.length))].map((_, i) => <tr key={`eo${i}`}><td className="h-4">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
                                </tbody>
                            </table>
                            <div className="print-section-header mt-2">8. Finance/Administration Section:</div>
                            <div className="p-1"><span className="print-label">Chief:</span> {data.financeChief}</div>
                            <div className="p-1"><span className="print-label">Deputy:</span> {data.financeDeputy}</div>
                        </div>
                    </div>
                    <ICSFooter formNumber="ICS 203" preparedName={data.preparedBy} preparedPosition={data.preparedPosition} dateTime={data.preparedDateTime} />
                </div>
            </div>
        </div>
    );
};

// --- ICS 205a FORM COMPONENT ---
const initialICS205aState = {
    incidentName: '', opPeriodNum: '', dateFrom: '', dateTo: '', timeFrom: '', timeTo: '',
    comms: [{ assignment: '', name: '', contact: '' }],
    preparedBy: '', preparedPosition: 'Planning Section Chief', preparedDateTime: ''
};

const ICS205aForm: React.FC = () => {
    const [data, setData] = useState(initialICS205aState);

    useEffect(() => {
        const saved = localStorage.getItem('ics_205a_data');
        if (saved) setData(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        localStorage.setItem('ics_205a_data', JSON.stringify(data));
        alert('ICS 205a Saved');
    };

    const handleChange = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));
    const handleListChange = (index: number, field: string, value: string) => {
        const list = [...data.comms];
        list[index][field] = value;
        setData(prev => ({ ...prev, comms: list }));
    };
    const addRow = () => setData(prev => ({ ...prev, comms: [...prev.comms, { assignment: '', name: '', contact: '' }] }));
    const removeRow = (index: number) => {
        const list = [...data.comms];
        list.splice(index, 1);
        setData(prev => ({ ...prev, comms: list }));
    };

    return (
        <div className="flex flex-col h-full w-full">
            <PrintStyles />
            <div className="flex-1 overflow-y-auto p-6 print:hidden space-y-6 max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">205a - Communications List</h2>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow"><PrinterIcon className="w-5 h-5" /> Print / PDF</button>
                </div>
                {/* Basic Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Incident Name" value={data.incidentName} onChange={e => handleChange('incidentName', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <input type="text" placeholder="Op Period" value={data.opPeriodNum} onChange={e => handleChange('opPeriodNum', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                </div>
                {/* Comms Table */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">Basic Local Communications Information</h3>
                    {data.comms.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <div className="grid grid-cols-3 gap-2 flex-grow">
                                <input type="text" placeholder="Assignment" value={c.assignment} onChange={e => handleListChange(i, 'assignment', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Name" value={c.name} onChange={e => handleListChange(i, 'name', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Method(s)" value={c.contact} onChange={e => handleListChange(i, 'contact', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                            </div>
                            <button onClick={() => removeRow(i)} className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-500">Remove</button>
                        </div>
                    ))}
                    <button onClick={addRow} className="bg-blue-400 text-gray-900 font-bold py-1 px-3 rounded hover:bg-blue-300 mt-2">Add</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Prepared By Name" value={data.preparedBy} onChange={e => handleChange('preparedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <input type="datetime-local" value={data.preparedDateTime} onChange={e => handleChange('preparedDateTime', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-blue-400 text-gray-900 font-bold py-2 px-6 rounded hover:bg-blue-300">Save</button>
                </div>
            </div>
            {/* PRINT VIEW */}
            <div className="print-container hidden">
                <div className="print-border border-2">
                    <div className="print-header">COMMUNICATIONS LIST (ICS 205a)</div>
                    <ICSHeader formName="ICS 205a" formNumber="ICS 205a" data={data} onChange={handleChange} />
                    <div className="print-section-header text-left pl-2">3. Basic Local Communications Information:</div>
                    <table className="print-table">
                        <thead>
                            <tr>
                                <th>Assigned Position/Agency</th>
                                <th>Name (Alphabetized)</th>
                                <th>Method(s) of Contact (phone, pager, cell, etc.)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.comms.map((c, i) => (
                                <tr key={i}>
                                    <td className="h-6">{c.assignment}</td>
                                    <td>{c.name}</td>
                                    <td>{c.contact}</td>
                                </tr>
                            ))}
                            {[...Array(Math.max(0, 15 - data.comms.length))].map((_, i) => <tr key={`e${i}`}><td className="h-6">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
                        </tbody>
                    </table>
                    <ICSFooter formNumber="ICS 205a" preparedName={data.preparedBy} preparedPosition={data.preparedPosition} dateTime={data.preparedDateTime} />
                </div>
            </div>
        </div>
    );
};

// --- ICS 206 FORM COMPONENT ---
const initialICS206State = {
    incidentName: '', opPeriodNum: '', dateFrom: '', dateTo: '', timeFrom: '', timeTo: '',
    aidStations: [{ name: '', location: '', contact: '', paramedics: false }],
    transport: [{ name: '', location: '', contact: '', als: false, bls: false }],
    hospitals: [{ name: '', address: '', contact: '', airTime: '', groundTime: '', trauma: false, burn: false, helipad: false }],
    procedures: '', aviationAssets: false,
    approvedBy: '', preparedBy: '', preparedPosition: 'Medical Unit Leader', preparedDateTime: ''
};

const ICS206Form: React.FC = () => {
    const [data, setData] = useState(initialICS206State);

    useEffect(() => {
        const saved = localStorage.getItem('ics_206_data');
        if (saved) setData(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        localStorage.setItem('ics_206_data', JSON.stringify(data));
        alert('ICS 206 Saved');
    };

    const handleChange = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));
    const handleListChange = (listKey: string, index: number, field: string, value: any) => {
        const list = [...(data as any)[listKey]];
        list[index][field] = value;
        setData(prev => ({ ...prev, [listKey]: list }));
    };
    const addListItem = (listKey: string, initial: any) => setData(prev => ({ ...prev, [listKey]: [...(prev as any)[listKey], initial] }));
    const removeListItem = (listKey: string, index: number) => {
        const list = [...(data as any)[listKey]];
        list.splice(index, 1);
        setData(prev => ({ ...prev, [listKey]: list }));
    };

    return (
        <div className="flex flex-col h-full w-full">
            <PrintStyles />
            <div className="flex-1 overflow-y-auto p-6 print:hidden space-y-6 max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">206 - Medical Plan</h2>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow"><PrinterIcon className="w-5 h-5" /> Print / PDF</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Incident Name" value={data.incidentName} onChange={e => handleChange('incidentName', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <input type="text" placeholder="Op Period" value={data.opPeriodNum} onChange={e => handleChange('opPeriodNum', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                </div>
                {/* Aid Stations */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">3. Medical Aid Stations</h3>
                    {data.aidStations.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <div className="grid grid-cols-4 gap-2 flex-grow">
                                <input type="text" placeholder="Name" value={s.name} onChange={e => handleListChange('aidStations', i, 'name', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Location" value={s.location} onChange={e => handleListChange('aidStations', i, 'location', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Contact" value={s.contact} onChange={e => handleListChange('aidStations', i, 'contact', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <label className="text-white flex items-center"><input type="checkbox" checked={s.paramedics} onChange={e => handleListChange('aidStations', i, 'paramedics', e.target.checked)} className="mr-1" /> Paramedics?</label>
                            </div>
                            <button onClick={() => removeListItem('aidStations', i)} className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-500">Remove</button>
                        </div>
                    ))}
                    <button onClick={() => addListItem('aidStations', { name: '', location: '', contact: '', paramedics: false })} className="bg-blue-400 text-gray-900 font-bold py-1 px-3 rounded hover:bg-blue-300 mt-2">Add</button>
                </div>
                {/* Transport */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">4. Transportation</h3>
                    {data.transport.map((t, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2">
                            <div className="grid grid-cols-4 gap-2 flex-grow">
                                <input type="text" placeholder="Name" value={t.name} onChange={e => handleListChange('transport', i, 'name', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Location" value={t.location} onChange={e => handleListChange('transport', i, 'location', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <input type="text" placeholder="Contact" value={t.contact} onChange={e => handleListChange('transport', i, 'contact', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                <div className="flex items-center gap-2">
                                    <label className="text-white flex items-center"><input type="checkbox" checked={t.als} onChange={e => handleListChange('transport', i, 'als', e.target.checked)} className="mr-1" /> ALS</label>
                                    <label className="text-white flex items-center"><input type="checkbox" checked={t.bls} onChange={e => handleListChange('transport', i, 'bls', e.target.checked)} className="mr-1" /> BLS</label>
                                </div>
                            </div>
                            <button onClick={() => removeListItem('transport', i)} className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-500">Remove</button>
                        </div>
                    ))}
                    <button onClick={() => addListItem('transport', { name: '', location: '', contact: '', als: false, bls: false })} className="bg-blue-400 text-gray-900 font-bold py-1 px-3 rounded hover:bg-blue-300 mt-2">Add</button>
                </div>
                {/* Hospitals */}
                <div className="bg-gray-800 p-4 rounded">
                    <h3 className="text-white font-bold mb-2">5. Hospitals</h3>
                    {data.hospitals.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 mb-2 border-b border-gray-700 pb-2">
                            <div className="flex-grow">
                                <div className="grid grid-cols-3 gap-2 mb-1">
                                    <input type="text" placeholder="Name" value={h.name} onChange={e => handleListChange('hospitals', i, 'name', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                    <input type="text" placeholder="Address/LatLong" value={h.address} onChange={e => handleListChange('hospitals', i, 'address', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                    <input type="text" placeholder="Contact" value={h.contact} onChange={e => handleListChange('hospitals', i, 'contact', e.target.value)} className="bg-gray-700 text-white p-1 rounded" />
                                </div>
                                <div className="col-span-3 flex gap-4 text-xs text-white">
                                    <label><input type="checkbox" checked={h.trauma} onChange={e => handleListChange('hospitals', i, 'trauma', e.target.checked)} /> Trauma</label>
                                    <label><input type="checkbox" checked={h.burn} onChange={e => handleListChange('hospitals', i, 'burn', e.target.checked)} /> Burn</label>
                                    <label><input type="checkbox" checked={h.helipad} onChange={e => handleListChange('hospitals', i, 'helipad', e.target.checked)} /> Helipad</label>
                                </div>
                            </div>
                            <button onClick={() => removeListItem('hospitals', i)} className="bg-red-600 text-white font-bold py-1 px-3 rounded hover:bg-red-500">Remove</button>
                        </div>
                    ))}
                    <button onClick={() => addListItem('hospitals', { name: '', address: '', contact: '', trauma: false, burn: false, helipad: false })} className="bg-blue-400 text-gray-900 font-bold py-1 px-3 rounded hover:bg-blue-300 mt-2">Add</button>
                </div>
                <textarea placeholder="6. Special Medical Emergency Procedures" rows={4} value={data.procedures} onChange={e => handleChange('procedures', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Approved By (Safety Officer)" value={data.approvedBy} onChange={e => handleChange('approvedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Prepared By" value={data.preparedBy} onChange={e => handleChange('preparedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                        <input type="datetime-local" value={data.preparedDateTime} onChange={e => handleChange('preparedDateTime', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-blue-400 text-gray-900 font-bold py-2 px-6 rounded hover:bg-blue-300">Save</button>
                </div>
            </div>
            {/* PRINT VIEW */}
            <div className="print-container hidden">
                <div className="print-border border-2">
                    <div className="print-header">MEDICAL PLAN (ICS 206)</div>
                    <ICSHeader formName="ICS 206" formNumber="ICS 206" data={data} onChange={handleChange} />
                    <div className="print-section-header text-left pl-2">3. Medical Aid Stations:</div>
                    <table className="print-table">
                        <thead><tr><th>Name</th><th>Location</th><th>Contact</th><th className="w-16">Paramedics</th></tr></thead>
                        <tbody>
                            {data.aidStations.map((s, i) => <tr key={i}><td className="h-6">{s.name}</td><td>{s.location}</td><td>{s.contact}</td><td className="text-center">{s.paramedics ? 'Yes' : 'No'}</td></tr>)}
                            {[...Array(Math.max(0, 4 - data.aidStations.length))].map((_, i) => <tr key={`ea${i}`}><td className="h-6">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
                        </tbody>
                    </table>
                    <div className="print-section-header text-left pl-2">4. Transportation (indicate air or ground):</div>
                    <table className="print-table">
                        <thead><tr><th>Name</th><th>Location</th><th>Contact</th><th className="w-20">Level of Service</th></tr></thead>
                        <tbody>
                            {data.transport.map((t, i) => <tr key={i}><td className="h-6">{t.name}</td><td>{t.location}</td><td>{t.contact}</td><td>{t.als ? 'ALS' : ''} {t.bls ? 'BLS' : ''}</td></tr>)}
                            {[...Array(Math.max(0, 3 - data.transport.length))].map((_, i) => <tr key={`et${i}`}><td className="h-6">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
                        </tbody>
                    </table>
                    <div className="print-section-header text-left pl-2">5. Hospitals:</div>
                    <table className="print-table">
                        <thead><tr><th>Name</th><th>Address/LatLong</th><th>Contact</th><th className="w-10">Trauma</th><th className="w-10">Burn</th><th className="w-10">Helipad</th></tr></thead>
                        <tbody>
                            {data.hospitals.map((h, i) => <tr key={i}><td className="h-6">{h.name}</td><td>{h.address}</td><td>{h.contact}</td><td className="text-center">{h.trauma ? 'Yes' : 'No'}</td><td className="text-center">{h.burn ? 'Yes' : 'No'}</td><td className="text-center">{h.helipad ? 'Yes' : 'No'}</td></tr>)}
                            {[...Array(Math.max(0, 4 - data.hospitals.length))].map((_, i) => <tr key={`eh${i}`}><td className="h-6">&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>)}
                        </tbody>
                    </table>
                    <div className="print-border-b p-1 min-h-[100px]"><span className="print-label">6. Special Medical Emergency Procedures:</span><div className="print-textarea text-xs mt-1">{data.procedures}</div><div className="mt-4"><span className={`print-checkbox ${data.aviationAssets ? 'print-checked' : ''}`}></span> Check box if aviation assets are utilized for rescue.</div></div>
                    <ICSFooter formNumber="ICS 206" preparedName={data.preparedBy} preparedPosition={data.preparedPosition} dateTime={data.preparedDateTime} approvedBy={data.approvedBy} />
                </div>
            </div>
        </div>
    );
};

// --- ICS 208 FORM COMPONENT ---
const initialICS208State = {
    incidentName: '', opPeriodNum: '', dateFrom: '', dateTo: '', timeFrom: '', timeTo: '',
    safetyMessage: '',
    safetyPlanRequired: false, safetyPlanLocation: '',
    preparedBy: '', preparedPosition: 'Safety Officer', preparedDateTime: ''
};

const ICS208Form: React.FC = () => {
    const [data, setData] = useState(initialICS208State);

    useEffect(() => {
        const saved = localStorage.getItem('ics_208_data');
        if (saved) setData(JSON.parse(saved));
    }, []);

    const handleSave = () => {
        localStorage.setItem('ics_208_data', JSON.stringify(data));
        alert('ICS 208 Saved');
    };

    const handleChange = (key: string, value: any) => setData(prev => ({ ...prev, [key]: value }));

    return (
        <div className="flex flex-col h-full w-full">
            <PrintStyles />
            <div className="flex-1 overflow-y-auto p-6 print:hidden space-y-6 max-w-4xl mx-auto w-full">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h2 className="text-2xl font-bold text-white">208 - Safety Message/Plan</h2>
                    <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow"><PrinterIcon className="w-5 h-5" /> Print / PDF</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Incident Name" value={data.incidentName} onChange={e => handleChange('incidentName', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                    <input type="text" placeholder="Op Period" value={data.opPeriodNum} onChange={e => handleChange('opPeriodNum', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded" />
                </div>
                <textarea placeholder="3. Safety Message/Expanded Safety Message, Safety Plan, Site Safety Plan" rows={15} value={data.safetyMessage} onChange={e => handleChange('safetyMessage', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                <div className="bg-gray-800 p-3 rounded">
                    <label className="flex items-center text-white mb-2"><input type="checkbox" checked={data.safetyPlanRequired} onChange={e => handleChange('safetyPlanRequired', e.target.checked)} className="mr-2" /> Site Safety Plan Required?</label>
                    {data.safetyPlanRequired && <input type="text" placeholder="Location of Safety Plan" value={data.safetyPlanLocation} onChange={e => handleChange('safetyPlanLocation', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Prepared By Name" value={data.preparedBy} onChange={e => handleChange('preparedBy', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                        <input type="datetime-local" value={data.preparedDateTime} onChange={e => handleChange('preparedDateTime', e.target.value)} className="w-full bg-gray-700 text-white p-2 rounded border border-gray-600" />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleSave} className="bg-blue-400 text-gray-900 font-bold py-2 px-6 rounded hover:bg-blue-300">Save</button>
                </div>
            </div>
            <div className="print-container hidden">
                <div className="print-border border-2">
                    <div className="print-header">SAFETY MESSAGE/PLAN (ICS 208)</div>
                    <ICSHeader formName="ICS 208" formNumber="ICS 208" data={data} onChange={handleChange} />
                    <div className="print-border-b p-1 min-h-[600px]"><span className="print-label">3. Safety Message/Expanded Safety Message, Safety Plan, Site Safety Plan:</span><div className="print-textarea text-xs mt-1">{data.safetyMessage}</div></div>
                    <div className="print-border-b p-1 flex justify-between items-center"><div><span className="print-label inline mr-2">4. Site Safety Plan Required?</span><span className={`print-checkbox ${data.safetyPlanRequired ? 'print-checked' : ''}`}></span> Yes <span className={`print-checkbox ${!data.safetyPlanRequired ? 'print-checked' : ''}`}></span> No</div>{data.safetyPlanRequired && <div className="ml-4 flex-grow"><span className="font-bold text-[10px] mr-2">Approved Site Safety Plan(s) Located at:</span>{data.safetyPlanLocation}</div>}</div>
                    <div className="print-border-t flex">
                        <div className="w-full p-1">
                            <span className="print-label">5. Prepared by:</span>
                            <div className="flex justify-between items-end">
                                <div><span className="text-[10px] mr-1">Name:</span><span className="font-bold mr-4">{data.preparedBy}</span><span className="text-[10px] mr-1">Position/Title:</span><span>{data.preparedPosition}</span></div>
                                <div className="text-[10px]"><span className="mr-1">Date/Time:</span><span>{data.preparedDateTime}</span></div>
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 p-1 text-[9px] font-bold bg-white">ICS 208</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ICS FORMS VIEW ---
export const ICSFormsView: React.FC = () => {
    const [activeForm, setActiveForm] = useState<string | null>(null);
    const forms = ['Cover Page', '202 - Incident Objectives', '203 - Agency Reps', '205a - Additional Contacts', '206 - Medical', '208 - Safety Plan', 'Area of Operation'];
    
    return (
        <div className="flex h-full bg-[#212529]">
            <div className="w-64 bg-[#2d2d2d] border-r border-gray-700 flex-shrink-0 overflow-y-auto print:hidden">
                <div className="p-4 border-b border-gray-700"><h3 className="font-bold text-white">Incident Action Plan</h3></div>
                <ul>{forms.map((form, i) => (<li key={i} onClick={() => setActiveForm(form)} className={`p-3 text-sm cursor-pointer hover:bg-gray-700 text-gray-300 ${activeForm === form ? 'bg-[#343a40] border-l-4 border-white text-white' : ''}`}>{form}</li>))}</ul>
            </div>
            <div className="flex-1 overflow-y-auto h-full relative">
                {activeForm === '202 - Incident Objectives' && <ICS202Form />}
                {activeForm === '203 - Agency Reps' && <ICS203Form />}
                {activeForm === '205a - Additional Contacts' && <ICS205aForm />}
                {activeForm === '206 - Medical' && <ICS206Form />}
                {activeForm === '208 - Safety Plan' && <ICS208Form />}
                {(activeForm === 'Cover Page' || activeForm === null) && (
                    <div className="p-8 flex flex-col h-full">
                        <h2 className="text-xl font-bold text-white mb-2">Choose a Cover Page Image</h2>
                        <div className="border-2 border-dashed border-green-600/50 bg-[#343a40]/50 rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="relative w-full max-w-md aspect-[4/3] bg-gray-800 mb-4"><img src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Placeholder" className="w-full h-full object-cover" /></div>
                            <p className="text-white font-bold text-sm">image.png (56 KB)</p>
                        </div>
                    </div>
                )}
                {activeForm === 'Area of Operation' && <div className="flex items-center justify-center h-full text-gray-500">Area of Operation Placeholder</div>}
            </div>
        </div>
    );
};
