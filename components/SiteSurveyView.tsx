
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MapAnnotation, SiteSurvey } from '../types';

// --- CONSTANTS & FACTORY ---
const getInitialSurveyData = () => ({
    id: '',
    // General - Contact Info (Separate from Owner)
    contactName: '',
    contactPhone: '',
    
    // General - Owner Info
    ownerOccupied: false,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    accessCode: '',
    parcelId: '',
    legalDescription: '',
    
    // New Waiver Data Structure
    waiverData: {
        signed: false,
        date: '',
        ownerName: '',
        propertyAddress: '',
        propertyType: '', // Owner Occupied, Rental, Other
        contactName: '',
        contactPhone: '',
        email: '',
        initials1: '',
        initials2: '',
        initials3: '',
        initials4: '',
        initials5: '',
        ownerSignature: '',
        tenantSignature: ''
    },

    readyToSubmit: false,
    cancelInquiry: false,
    notes: '',
    
    // Map Annotations
    mapAnnotations: [] as MapAnnotation[],

    // Structure & Occupancy
    occupantsUnder18: false,
    occupantsOver62: false,
    workNeeded: true,
    canPerformSS: true,
    cantPerformReason: '',
    accomodations: false,
    currentlyLiving: false,
    structureHabitable: false,
    firstResponder: false,
    structureType: 'Single Family',
    occupancyType: 'Own', // Rent or Own
    sqFootage: '',
    bedrooms: '',
    bathrooms: '',
    constructionType: 'Wood-frame',

    // Insurance
    insurance: false,
    insuranceType: 'Homeowners',
    insuranceProvider: '',
    metAdjuster: false,
    damageCovered: false,

    // Utilities & Hazards
    utilities: { electric: false, gas: false, sewer: false, water: false },
    downedWires: false,
    hazmatPresent: false,
    hazmatTypes: { asbestos: false, lead: false, other: '' },
    personalItems: false,
    
    // Damage Assessment
    roofBreached: false,
    roofSound: true,
    vegDebris: false,
    nonVegDebris: false,
    debrisNotes: '',
    sifting: false,
    basement: false,
    chimney: 'Stable',

    // Muck Out
    muckOutNeeded: false,
    floodHeight: '',
    basementAffected: false,
    basementDepth: '',
    groundFloorAffected: false,
    groundFloorDepth: '',
    secondFloorAffected: false,
    secondFloorDepth: '',
    flooringRemoval: { carpet: false, hardwood: false, drywall: false },
    debrisUnsafe: false,
    debrisSafeForHandCrew: true,
    muckOutDetails: '',

    // Tarping
    tarpingNeeded: false,
    tarpSize: '',
    roofSlope: '',
    tarpNotes: '',
    windowBoarding: false,
    windowCount: '',

    // Sawyer
    sawyerNeeded: false,
    treesLeaning: false,
    buckingLimbing: false,
    treesBlocking: false,
    treeFelling: false,
    treeCounts: { small: '', medium: '', large: '' }, // <12, 12-23, 25-36
    sawyerNotes: '',

    // Heavy Equipment
    heNeeded: false,
    heType: '', // CTL, Excavator, Other
    debrisBlockingAccess: false,
    missingParts: false,
    missingPartsDesc: '',
    damageTooExtensive: false,
    demolitionNeeded: false,
    specialEquipment: false,
    specialEquipmentDesc: '',

    // Completion
    withinScope: true,
    oosReason: '',
});

// --- HELPER COMPONENTS ---

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    subLabel?: string;
}

const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, subLabel }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0">
        <div className="pr-4">
            <div className="text-sm font-medium text-gray-200">{label}</div>
            {subLabel && <div className="text-xs text-gray-400 mt-1">{subLabel}</div>}
        </div>
        <button 
            onClick={() => onChange(!checked)}
            className={`flex-shrink-0 w-12 h-6 rounded-full relative transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#A92128]' : 'bg-gray-600'}`}
        >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-200 ${checked ? 'left-7' : 'left-1'}`}></div>
        </button>
    </div>
);

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h4 className="text-md font-bold text-[#A92128] uppercase tracking-wider mb-3 mt-6 border-b border-gray-700 pb-1">{title}</h4>
);

interface InputProps {
    label: string;
    value: string | number;
    onChange: (val: string) => void;
    type?: string;
    placeholder?: string;
    className?: string;
}

const Input: React.FC<InputProps> = ({ label, value, onChange, type = "text", placeholder, className }) => (
    <div className={`mb-3 ${className || ''}`}>
        <label className="block text-xs text-gray-400 mb-1">{label}</label>
        <input 
            type={type} 
            className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-[#A92128] focus:outline-none focus:ring-1 focus:ring-[#A92128]"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

// --- SIGNATURE CANVAS COMPONENT ---
const SignatureCanvas: React.FC<{ 
    value: string; 
    onChange: (val: string) => void; 
    label: string;
}> = ({ value, onChange, label }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawing = useRef(false);
    const [isEmpty, setIsEmpty] = useState(!value);

    const getPos = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e: any) => {
        isDrawing.current = true;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.strokeStyle = '#000';
            const { x, y } = getPos(e);
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
        // Prevent scrolling on touch devices
        if (e.type === 'touchstart') e.preventDefault();
    };

    const draw = (e: any) => {
        if (!isDrawing.current) return;
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
            const { x, y } = getPos(e);
            ctx.lineTo(x, y);
            ctx.stroke();
            setIsEmpty(false);
        }
        if (e.type === 'touchmove') e.preventDefault();
    };

    const stopDrawing = () => {
        if (isDrawing.current && canvasRef.current) {
            isDrawing.current = false;
            onChange(canvasRef.current.toDataURL());
        }
    };

    const clearSignature = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx && canvasRef.current) {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            onChange('');
            setIsEmpty(true);
        }
    };

    return (
        <div className="mb-4">
            <label className="block text-xs text-gray-400 mb-1 uppercase font-bold">{label}</label>
            {value && isEmpty === false ? (
                <div className="relative border border-gray-600 bg-white rounded">
                    <img src={value} alt="Signature" className="h-32 w-full object-contain" />
                    <button 
                        onClick={clearSignature}
                        className="absolute top-2 right-2 text-red-600 text-xs font-bold border border-red-600 px-2 py-1 rounded hover:bg-red-50"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <canvas 
                        ref={canvasRef}
                        width={500}
                        height={150}
                        className="w-full h-32 bg-white border border-gray-600 rounded cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                    />
                    <div className="absolute bottom-2 left-2 text-gray-400 text-[10px] pointer-events-none">Sign Above</div>
                </div>
            )}
        </div>
    );
};

// --- WAIVER MODAL COMPONENT ---
const WaiverModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    data: any;
    onSave: (data: any) => void;
    defaults: { address: string; owner: string; phone: string; email: string };
}> = ({ isOpen, onClose, data, onSave, defaults }) => {
    const [formData, setFormData] = useState(data);

    useEffect(() => {
        if (isOpen) {
            // Initialize with existing data or defaults
            setFormData((prev: any) => ({
                ...prev,
                date: prev.date || new Date().toISOString().split('T')[0],
                ownerName: prev.ownerName || defaults.owner,
                propertyAddress: prev.propertyAddress || defaults.address,
                contactPhone: prev.contactPhone || defaults.phone,
                email: prev.email || defaults.email
            }));
        }
    }, [isOpen, defaults]);

    if (!isOpen) return null;

    const handleUpdate = (key: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        onSave({ ...formData, signed: true });
        onClose();
    };

    const Paragraph = ({ children }: { children: React.ReactNode }) => (
        <p className="text-gray-300 text-sm mb-4 leading-relaxed text-justify">{children}</p>
    );

    const InitialInput = ({ val, k }: { val: string, k: string }) => (
        <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 mt-1">
                <input 
                    type="text" 
                    maxLength={3} 
                    placeholder="Initials" 
                    value={val} 
                    onChange={(e) => handleUpdate(k, e.target.value.toUpperCase())}
                    className="w-16 bg-gray-100 border border-gray-400 text-black text-center font-bold p-1 rounded focus:ring-2 focus:ring-[#A92128] focus:outline-none"
                />
            </div>
            <div className="text-sm text-gray-300 leading-relaxed">
                {/* Content handled by parent */}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#212529] w-full max-w-4xl h-[90vh] rounded-lg shadow-2xl border border-gray-600 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-600 flex justify-between items-center bg-[#2d2d2d]">
                    <h2 className="text-xl font-bold text-white">Right of Entry Form and Liability Waiver</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#212529]">
                    
                    {/* Form Header Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <Input label="Date" value={formData.date} onChange={(v) => handleUpdate('date', v)} type="date" />
                        <Input label="Property Owner and Tenant Name" value={formData.ownerName} onChange={(v) => handleUpdate('ownerName', v)} />
                        <Input label="Property Address" value={formData.propertyAddress} onChange={(v) => handleUpdate('propertyAddress', v)} className="md:col-span-2" />
                    </div>

                    <div className="mb-6 bg-gray-800/50 p-3 rounded border border-gray-700">
                        <label className="block text-xs text-gray-400 mb-2 font-bold uppercase">Circle as applicable:</label>
                        <div className="flex gap-6">
                            {['Owner Occupied', 'Rental Property', 'Other'].map(type => (
                                <label key={type} className="flex items-center cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="propertyType" 
                                        checked={formData.propertyType === type} 
                                        onChange={() => handleUpdate('propertyType', type)}
                                        className="accent-[#A92128] w-4 h-4 mr-2"
                                    />
                                    <span className="text-sm text-gray-200">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <Input label="Primary Contact Name(s)" value={formData.contactName} onChange={(v) => handleUpdate('contactName', v)} />
                        <Input label="Contact Phone Number(s)" value={formData.contactPhone} onChange={(v) => handleUpdate('contactPhone', v)} />
                        <Input label="Email" value={formData.email} onChange={(v) => handleUpdate('email', v)} />
                    </div>

                    <div className="border-t border-gray-600 my-6"></div>

                    {/* Legal Text Page 1 */}
                    <p className="text-gray-400 text-sm mb-6 italic">
                        Team Rubicon aims to serve every designated beneficiary of a project to their greatest capability. Please read the following statements and initial that you understand each item:
                    </p>

                    <div className="space-y-2">
                        <div className="flex gap-4">
                            <input type="text" maxLength={4} placeholder="Initials" value={formData.initials1} onChange={(e) => handleUpdate('initials1', e.target.value.toUpperCase())} className="w-16 h-10 bg-gray-100 text-black text-center font-bold rounded mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-300 leading-relaxed">I certify by signing this agreement that I am the legal owner or tenant of the property listed above. I am the entity authorized to make decisions related to said property.</p>
                        </div>

                        <div className="flex gap-4">
                             <input type="text" maxLength={4} placeholder="Initials" value={formData.initials2} onChange={(e) => handleUpdate('initials2', e.target.value.toUpperCase())} className="w-16 h-10 bg-gray-100 text-black text-center font-bold rounded mt-1 flex-shrink-0" />
                             <p className="text-sm text-gray-300 leading-relaxed">I understand that my signature on this agreement allows Team Rubicon personnel and/or volunteers right of entry onto my property at the address listed above.</p>
                        </div>

                        <div className="flex gap-4">
                             <input type="text" maxLength={4} placeholder="Initials" value={formData.initials3} onChange={(e) => handleUpdate('initials3', e.target.value.toUpperCase())} className="w-16 h-10 bg-gray-100 text-black text-center font-bold rounded mt-1 flex-shrink-0" />
                             <p className="text-sm text-gray-300 leading-relaxed">I certify that I am aware Team Rubicon volunteers are not licensed contractors and are not legally responsible for the quality, condition, durability or my personal opinion or preferences regarding donated home renovation items, to include but not limited to home appliances, rugs and carpeting, paint color or quality, and all other materials not specified here but used in completion of my home renovation. If there are volunteers holding contractors licenses serving in a professional capacity, said license numbers will be held on file with Team Rubicon headquarters.</p>
                        </div>

                        <div className="flex gap-4">
                             <input type="text" maxLength={4} placeholder="Initials" value={formData.initials4} onChange={(e) => handleUpdate('initials4', e.target.value.toUpperCase())} className="w-16 h-10 bg-gray-100 text-black text-center font-bold rounded mt-1 flex-shrink-0" />
                             <p className="text-sm text-gray-300 leading-relaxed">I hereby release, hold harmless and indemnify Team Rubicon and each of their respective officers, directors, agents, representatives, employees, contractors, volunteers, successors, assignees, and licensees (herein the "Released Parties") from any and all claims, actions, damages, liabilities, losses, costs and expenses of any kind (including, without limitation, attorneys' fees) arising out of, resulting from, or by reason of, my participation on or in connection with the home renovation, including, without limitation, my participation in this project, the entry onto my residential property or into my home by Team Rubicon, or the use of my residential property and home and contents thereof, or on any legal theory whatsoever (including, but not limited to, personal injury, property damage, rights of privacy and publicity, false light, or defamation) (collectively the “Released Claims”). The Released Claims specifically include, without limitation, any and all claims, actions, damages, liabilities, losses, costs and expenses of any kind resulting from the actions of another participant or any other third party at any time.</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-600 my-8"></div>

                    {/* Legal Text Page 2 */}
                    <div className="flex gap-4 mb-8">
                         <input type="text" maxLength={4} placeholder="Initials" value={formData.initials5} onChange={(e) => handleUpdate('initials5', e.target.value.toUpperCase())} className="w-16 h-10 bg-gray-100 text-black text-center font-bold rounded mt-1 flex-shrink-0" />
                         <p className="text-sm text-gray-300 leading-relaxed">I hereby acknowledge and agree that Team Rubicon may contact me by telephone or text messages at any of the phone numbers I have provided in this Homeowner Right of Entry Form in connection with my participation in Team Rubicon Activities, including for marketing purposes or to provide a Homeowner satisfaction survey. [I also understand that I may opt out of receiving text messages from Team Rubicon by following the prompts contained in the text message.]</p>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <SignatureCanvas 
                            label="Property Owner Signature" 
                            value={formData.ownerSignature} 
                            onChange={(v) => handleUpdate('ownerSignature', v)} 
                        />
                        <SignatureCanvas 
                            label="Tenant Signature (if applicable)" 
                            value={formData.tenantSignature} 
                            onChange={(v) => handleUpdate('tenantSignature', v)} 
                        />
                    </div>

                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-600 bg-[#2d2d2d] flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-2 text-gray-300 hover:text-white font-bold">Cancel</button>
                    <button 
                        onClick={handleSave}
                        className="px-8 py-2 bg-[#A92128] hover:bg-red-700 text-white font-bold rounded shadow-lg"
                    >
                        Save & Sign
                    </button>
                </div>
            </div>
        </div>
    );
};

const StreetView: React.FC<{ lat: string | number; lon: string | number }> = ({ lat, lon }) => {
    const panoRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!panoRef.current || !(window as any).google) return;

        const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
        const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;

        if (isNaN(latNum) || isNaN(lonNum)) return;

        const sv = new (window as any).google.maps.StreetViewService();
        
        sv.getPanorama({ location: { lat: latNum, lng: lonNum }, radius: 50 }, (data: any, status: any) => {
            if (status === 'OK') {
                 const panorama = new (window as any).google.maps.StreetViewPanorama(panoRef.current, {
                    position: data.location.latLng,
                    pov: {
                        heading: 34,
                        pitch: 10,
                    },
                    zoom: 1,
                    disableDefaultUI: true,
                    clickToGo: false,
                    linksControl: false,
                    panControl: false,
                    enableCloseButton: false,
                });
                panorama.setVisible(true);
                setError(null);
            } else {
                setError("Street View not available for this location.");
            }
        });

    }, [lat, lon]);

    return (
        <div className="mb-4 relative rounded-lg overflow-hidden border border-gray-500 shadow-md bg-gray-800">
            {error ? (
                <div className="w-full h-64 flex items-center justify-center text-gray-400 text-sm p-4">
                    <div className="text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        {error}
                    </div>
                </div>
            ) : (
                <div ref={panoRef} className="w-full h-64" />
            )}
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none">
                Street View
            </div>
        </div>
    );
};

const MiniPropertyMap: React.FC<{ 
    lat: string | number; 
    lon: string | number; 
    geojson: any; 
    boundingBox?: string[]; 
    viewport?: any;
    annotations: MapAnnotation[];
    onAnnotationsChange: (annotations: MapAnnotation[]) => void;
}> = ({ lat, lon, geojson, boundingBox, viewport, annotations, onAnnotationsChange }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const drawingManagerRef = useRef<any>(null);
    const [isLocked, setIsLocked] = useState(true);
    const overlaysRef = useRef<any[]>([]);
    const propertyLayerRef = useRef<any>(null);

    const annotationsRef = useRef(annotations);
    useEffect(() => {
        annotationsRef.current = annotations;
    }, [annotations]);

    useEffect(() => {
        if (!mapRef.current || !(window as any).google || mapInstance.current) return;
        
        const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
        const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;

        if (isNaN(latNum) || isNaN(lonNum)) return;

        const map = new (window as any).google.maps.Map(mapRef.current, {
            center: { lat: latNum, lng: lonNum },
            zoom: 19,
            mapTypeId: 'satellite',
            disableDefaultUI: false,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            rotateControl: true,
            tilt: 0,
            heading: 0,
            gestureHandling: 'greedy'
        });

        mapInstance.current = map;
    }, []); 

    useEffect(() => {
        if (!mapInstance.current || !(window as any).google) return;

        const latNum = typeof lat === 'string' ? parseFloat(lat) : lat;
        const lonNum = typeof lon === 'string' ? parseFloat(lon) : lon;

        if (!isNaN(latNum) && !isNaN(lonNum)) {
            const center = new (window as any).google.maps.LatLng(latNum, lonNum);
            mapInstance.current.setCenter(center);

            if (viewport) {
                const bounds = new (window as any).google.maps.LatLngBounds(
                    viewport.southwest,
                    viewport.northeast
                );
                mapInstance.current.fitBounds(bounds);
            } else if (boundingBox && boundingBox.length === 4) {
                const southWest = new (window as any).google.maps.LatLng(parseFloat(boundingBox[0]), parseFloat(boundingBox[2]));
                const northEast = new (window as any).google.maps.LatLng(parseFloat(boundingBox[1]), parseFloat(boundingBox[3]));
                const bounds = new (window as any).google.maps.LatLngBounds(southWest, northEast);
                mapInstance.current.fitBounds(bounds);
            }
        }
    }, [lat, lon, boundingBox, viewport]);

    useEffect(() => {
        if (!mapInstance.current) return;
        
        if (geojson && !propertyLayerRef.current) {
             const features = mapInstance.current.data.addGeoJson({
                type: 'Feature',
                geometry: geojson,
                properties: {}
            });
            if (features && features.length > 0) {
                propertyLayerRef.current = features[0];
            }
        }

        mapInstance.current.data.setStyle({
            fillColor: 'transparent',
            strokeColor: '#FF9800',
            strokeWeight: 3,
            clickable: !isLocked,
            editable: !isLocked,
            zIndex: 1
        });
        
    }, [geojson, isLocked]);

    useEffect(() => {
        if (!mapInstance.current || !(window as any).google || drawingManagerRef.current) return;

        const dm = new (window as any).google.maps.drawing.DrawingManager({
            drawingMode: null,
            drawingControl: false,
            markerOptions: { draggable: true },
            polygonOptions: {
                editable: true,
                draggable: true,
                fillColor: '#A92128',
                fillOpacity: 0.4,
                strokeColor: '#A92128',
                strokeWeight: 2,
                zIndex: 10
            },
            polylineOptions: {
                editable: true,
                draggable: true,
                strokeColor: '#FFFF00',
                strokeWeight: 4,
                zIndex: 10
            }
        });

        dm.setMap(mapInstance.current);
        drawingManagerRef.current = dm;

        (window as any).google.maps.event.addListener(dm, 'overlaycomplete', (event: any) => {
            const newAnnotation: any = {};
            
            if (event.type === 'polygon') {
                newAnnotation.type = 'polygon';
                newAnnotation.path = event.overlay.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
            } else if (event.type === 'marker') {
                newAnnotation.type = 'marker';
                newAnnotation.position = { lat: event.overlay.getPosition().lat(), lng: event.overlay.getPosition().lng() };
            } else if (event.type === 'polyline') {
                newAnnotation.type = 'line';
                newAnnotation.path = event.overlay.getPath().getArray().map((p: any) => ({ lat: p.lat(), lng: p.lng() }));
            }

            const updatedAnnotations = [...annotationsRef.current, newAnnotation];
            onAnnotationsChange(updatedAnnotations);
            
            event.overlay.setMap(null);
        });

    }, [mapInstance.current, onAnnotationsChange]);

    useEffect(() => {
        if (!mapInstance.current || !(window as any).google) return;

        overlaysRef.current.forEach(o => o.setMap(null));
        overlaysRef.current = [];

        annotations.forEach(ann => {
            let overlay;
            if (ann.type === 'polygon' && ann.path) {
                overlay = new (window as any).google.maps.Polygon({
                    paths: ann.path,
                    fillColor: '#A92128',
                    fillOpacity: 0.4,
                    strokeColor: '#A92128',
                    strokeWeight: 2,
                    map: mapInstance.current,
                    editable: !isLocked,
                    draggable: !isLocked,
                    zIndex: 10
                });
            } else if (ann.type === 'marker' && ann.position) {
                overlay = new (window as any).google.maps.Marker({
                    position: ann.position,
                    map: mapInstance.current,
                    draggable: !isLocked,
                    zIndex: 20
                });
            } else if (ann.type === 'line' && ann.path) {
                overlay = new (window as any).google.maps.Polyline({
                    path: ann.path,
                    strokeColor: '#FFFF00',
                    strokeWeight: 4,
                    map: mapInstance.current,
                    editable: !isLocked,
                    draggable: !isLocked,
                    zIndex: 10
                });
            }

            if (overlay) {
                overlaysRef.current.push(overlay);
            }
        });

    }, [annotations, isLocked]);

    const setDrawingMode = (mode: string | null) => {
        if (drawingManagerRef.current) {
            drawingManagerRef.current.setDrawingMode(mode);
        }
    };

    return (
        <div className="mb-4 relative group">
            <div className={`absolute top-2 right-2 z-30 flex flex-col gap-2 transition-opacity duration-200 ${isLocked ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                {isLocked ? (
                    <button 
                        onClick={() => setIsLocked(false)}
                        className="bg-[#A92128] text-white text-xs font-bold px-3 py-2 rounded shadow-lg hover:bg-red-800 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        Edit / Annotate
                    </button>
                ) : (
                    <div className="bg-gray-800/90 p-2 rounded-lg shadow-xl border border-gray-600 flex flex-col gap-2">
                         <div className="text-xs text-gray-400 font-bold uppercase text-center mb-1">Tools</div>
                         <button onClick={() => setDrawingMode('marker')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs flex items-center gap-2"><span className="text-red-500">📍</span> Marker</button>
                         <button onClick={() => setDrawingMode('polygon')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs flex items-center gap-2"><span className="text-red-500">⬠</span> Area (Damage)</button>
                         <button onClick={() => setDrawingMode('polyline')} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs flex items-center gap-2"><span className="text-yellow-500">〰</span> Line (Access)</button>
                         <button onClick={() => setDrawingMode(null)} className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded text-xs flex items-center gap-2">✋ Pan</button>
                         <hr className="border-gray-600 my-1" />
                         <button onClick={() => onAnnotationsChange([])} className="bg-red-900/50 hover:bg-red-900 text-red-200 p-2 rounded text-xs">Clear All</button>
                         <button 
                            onClick={() => { setIsLocked(true); setDrawingMode(null); }}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold p-2 rounded text-xs mt-1"
                        >
                            Lock & Save
                        </button>
                    </div>
                )}
            </div>

            <div ref={mapRef} className={`w-full h-96 rounded-lg border border-gray-500 shadow-md ${!isLocked ? 'ring-2 ring-[#A92128]' : ''}`} />
            
            <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded pointer-events-none z-20 flex items-center gap-2">
                <span>Satellite</span>
                {!isLocked && <span className="text-red-400 font-bold">• EDITING MODE</span>}
            </div>
            {geojson && (
                 <div className="absolute bottom-2 left-2 bg-orange-900/80 text-orange-100 text-xs px-2 py-1 rounded pointer-events-none z-20 border border-orange-500">
                    Property Boundary
                </div>
            )}
        </div>
    );
};

const CountyRecordsHelper: React.FC<{ addressDetails: any, addressString: string }> = ({ addressDetails, addressString }) => {
    const county = addressDetails?.county || '';
    const state = addressDetails?.state || '';
    
    const query = `site:gov OR site:us "${county}" "${state}" property search "${addressString}"`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    return (
        <div className="bg-[#262626] border border-gray-600 rounded-lg p-4 mb-6 shadow-lg">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h5 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#A92128]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Official Property Record
                    </h5>
                    <p className="text-xs text-gray-400 mt-1">
                        Can't find owner info? Use the link below to search the official County Assessor/GIS records.
                    </p>
                </div>
            </div>
            <a 
                href={searchUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full block text-center bg-[#A92128] hover:bg-red-700 text-white text-sm font-bold px-4 py-3 rounded transition shadow-md flex items-center justify-center gap-2 uppercase tracking-wide"
            >
                Search County Records
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        </div>
    );
};

interface SiteSurveyViewProps {
    onSearchProperty?: () => void;
    newSurveyData?: any;
    apiKey?: string;
    onSave?: (surveyData: any) => void;
    surveys?: SiteSurvey[];
    onUpdateSurvey?: (survey: SiteSurvey) => void;
    selectedSurveyId?: string | null;
}

export const SiteSurveyView: React.FC<SiteSurveyViewProps> = ({ onSearchProperty, newSurveyData, apiKey, onSave, surveys = [], onUpdateSurvey, selectedSurveyId }) => {
    const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'General' | 'Assess' | 'Notes' | 'Complete'>('General');
    const [message, setMessage] = useState<string | null>(null);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const shouldAutoFillRef = useRef(false);
    
    // New State for Waiver
    const [isWaiverModalOpen, setIsWaiverModalOpen] = useState(false);

    const [formData, setFormData] = useState(getInitialSurveyData());

    // Handle new survey creation from search
    useEffect(() => {
        if (newSurveyData && onUpdateSurvey) {
            const newId = `SURVEY-${Date.now()}`;
            const newSurvey: SiteSurvey = {
                id: newId,
                address: newSurveyData.address || 'Unknown Address',
                status: 'In Progress',
                data: { ...getInitialSurveyData(), id: newId, ...newSurveyData } 
            };
            onUpdateSurvey(newSurvey);
            setActiveSurveyId(newId);
            setActiveTab('General');
            shouldAutoFillRef.current = true; 
        }
    }, [newSurveyData]);

    // Handle External Selection (e.g. from Map)
    useEffect(() => {
        if (selectedSurveyId) {
            handleSurveySelect(selectedSurveyId);
        }
    }, [selectedSurveyId]);

    const handleAutoFill = async () => {
        const activeSurvey = surveys.find(s => s.id === activeSurveyId);
        if (!apiKey || !activeSurvey?.address) {
            setMessage("API Key or Address missing.");
            return;
        }
        setIsAutoFilling(true);
        setMessage("Searching public records for homeowner info...");
        
        try {
            const ai = new GoogleGenAI({ apiKey: apiKey });
            const prompt = `Search deeply for public property records for the address: "${activeSurvey.address}".
            
            Perform the following steps:
            1. Identify the County and State for this address.
            2. Search for the address on real estate sites (Zillow, Redfin, Realtor) to get: SqFt, Bed, Bath, Year Built.
            3. **CRITICAL:** Search the specific [County] Property Appraiser or Tax Assessor website for this address to find the registered **Owner Name**, **Parcel ID (APN)**, and **Legal Description**. This is the most important step.
            
            Extract the following details and return them as a JSON object:
            - ownerName
            - parcelId
            - legalDescription
            - sqFootage
            - bedrooms
            - bathrooms
            - constructionType (Infer from year built: "Wood-frame" if post-1950, "Brick" or "Masonry" if mentioned)

            If a specific value is not found, return null for that key. Do not return error strings.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });
            
            const text = response.text;
            if (text) {
                let jsonString = text;
                const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
                if (jsonMatch) {
                    jsonString = jsonMatch[1];
                }

                try {
                    const data = JSON.parse(jsonString);
                    setFormData(prev => ({
                        ...prev,
                        ownerName: data.ownerName || prev.ownerName,
                        parcelId: data.parcelId || prev.parcelId,
                        legalDescription: data.legalDescription || prev.legalDescription,
                        sqFootage: data.sqFootage || prev.sqFootage,
                        bedrooms: data.bedrooms || prev.bedrooms,
                        bathrooms: data.bathrooms || prev.bathrooms,
                        constructionType: data.constructionType || prev.constructionType
                    }));
                    
                    if (!data.ownerName) {
                         setMessage("Found property stats, but Owner Name was hidden. Check County Records link.");
                    } else {
                         setMessage("Auto-filled details from public records.");
                    }
                } catch (parseError) {
                    console.error("JSON parse error", parseError);
                    setMessage("Could not extract structured data. Please enter manually.");
                }
            } else {
                setMessage("No info found.");
            }

        } catch (e) {
            console.error("Auto-fill failed", e);
            setMessage("Auto-fill failed. Please check network or API key.");
        } finally {
            setIsAutoFilling(false);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    // Auto-trigger AutoFill when survey becomes active and flag is set
    useEffect(() => {
        if (shouldAutoFillRef.current && activeSurveyId) {
            const survey = surveys.find(s => s.id === activeSurveyId);
            if (survey) {
                shouldAutoFillRef.current = false;
                setTimeout(() => handleAutoFill(), 500);
            }
        }
    }, [activeSurveyId, surveys]);

    // Populate form when switching surveys
    const handleSurveySelect = (id: string) => {
        const survey = surveys.find(s => s.id === id);
        if (survey) {
             setFormData(prev => ({ ...prev, ...survey.data }));
             setActiveSurveyId(id);
             setActiveTab('General');
        }
    };

    const handleUpdate = (field: string, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Logic: If Owner Occupied is checked, we sync Contact -> Owner fields to prevent data loss
            // for the waiver, but if unchecked (Renters), they remain separate.
            if (newData.ownerOccupied) {
                if (field === 'contactName') newData.ownerName = value;
                if (field === 'contactPhone') newData.ownerPhone = value;
            }
            
            // If toggling Owner Occupied to TRUE, sync current contact to owner
            if (field === 'ownerOccupied' && value === true) {
                newData.ownerName = prev.contactName;
                newData.ownerPhone = prev.contactPhone;
            }

            return newData;
        });
    };
    
    const handleNestedUpdate = (parent: string, key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [parent]: { ...(prev as any)[parent], [key]: value }
        }));
    };

    const handleSave = () => {
        const survey = surveys.find(s => s.id === activeSurveyId);
        if (onSave && survey) {
            onSave({
                ...formData,
                address: survey.address,
                lat: survey.data.lat,
                lon: survey.data.lon,
                geojson: survey.data.fullData?.geojson
            });
        }
    };

    if (!activeSurveyId) {
        return (
            <div className="p-6 h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">My Strike Team's Site Surveys</h2>
                    <button 
                        className="bg-[#A92128] hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded"
                        onClick={onSearchProperty}
                    >
                        + New Survey (Search Property)
                    </button>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1">
                    {surveys.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">No surveys started. Search a property to begin.</p>
                    ) : surveys.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => handleSurveySelect(s.id)}
                            className="bg-[#343a40] p-4 rounded-lg border border-gray-600 hover:bg-[#3e454d] cursor-pointer flex justify-between items-center"
                        >
                            <div>
                                <h3 className="font-bold text-white">{s.address}</h3>
                                <p className="text-sm text-gray-400">{s.status}</p>
                            </div>
                            <div className="text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const activeSurvey = surveys.find(s => s.id === activeSurveyId);

    return (
        <div className="h-full flex flex-col bg-[#212529]">
            {/* Top Bar */}
            <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-[#2d2d2d]">
                <button onClick={() => setActiveSurveyId(null)} className="text-gray-400 text-sm font-semibold hover:text-white">Close</button>
                <div className="flex flex-col items-center">
                    <span className="text-white font-bold">{activeSurvey?.address}</span>
                    <span className="text-xs text-gray-400">Site Survey Form</span>
                </div>
                <button onClick={handleSave} className="text-[#A92128] text-sm font-semibold hover:text-red-400 uppercase">Save</button>
            </div>
            
            {message && (
                <div className="bg-green-900/80 text-green-100 text-center text-sm p-2 flex justify-center items-center gap-2">
                    {isAutoFilling && <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></span>}
                    {message}
                </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-gray-700 bg-[#262626]">
                {['General', 'Assess', 'Notes', 'Complete'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-3 text-sm font-medium ${activeTab === tab ? 'text-[#A92128] border-b-2 border-[#A92128]' : 'text-gray-400 hover:text-white'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Content with padding-bottom to prevent cut-off */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {activeTab === 'General' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        
                        {/* STREET VIEW PRIMARY */}
                        {activeSurvey?.data?.fullData && (
                            <StreetView lat={activeSurvey.data.lat} lon={activeSurvey.data.lon} />
                        )}

                        <div className="bg-[#343a40] rounded-lg p-4 border border-gray-600">
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">Step 1: General Details</h3>
                            
                            <div className="mb-4">
                                <div className="text-xs text-gray-400">Property Address</div>
                                <div className="text-white font-semibold text-lg">{activeSurvey?.address}</div>
                            </div>

                            {/* County Records Helper */}
                            <CountyRecordsHelper 
                                addressDetails={activeSurvey?.data?.fullData?.address} 
                                addressString={activeSurvey?.address || ""}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <Input 
                                    label="Contact Name" 
                                    value={formData.contactName} 
                                    onChange={(v) => handleUpdate('contactName', v)} 
                                    className="bg-gray-800/50 p-3 rounded border border-gray-700 mb-0"
                                />
                                <Input 
                                    label="Contact Phone" 
                                    value={formData.contactPhone} 
                                    onChange={(v) => handleUpdate('contactPhone', v)} 
                                    className="bg-gray-800/50 p-3 rounded border border-gray-700 mb-0"
                                />
                            </div>

                            <div className="space-y-2">
                                <Toggle 
                                    label="Owner Occupied?" 
                                    checked={formData.ownerOccupied} 
                                    onChange={(v) => handleUpdate('ownerOccupied', v)} 
                                />
                                {!formData.ownerOccupied && (
                                    <div className="bg-gray-700/30 p-3 rounded mt-2 border border-gray-600">
                                        <div className="flex justify-between items-center mb-2">
                                            <h5 className="text-xs text-blue-300 font-bold uppercase">Owner Details</h5>
                                            <button 
                                                onClick={handleAutoFill} 
                                                disabled={isAutoFilling}
                                                className="text-xs bg-[#A92128] hover:bg-red-700 text-white px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {isAutoFilling ? (
                                                    <span className="animate-spin">⟳</span> 
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
                                                )}
                                                Re-Run Public Records Search
                                            </button>
                                        </div>
                                        <Input label="Owner Name" value={formData.ownerName} onChange={(v) => handleUpdate('ownerName', v)} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Owner Phone" value={formData.ownerPhone} onChange={(v) => handleUpdate('ownerPhone', v)} />
                                            <Input label="Owner Email" value={formData.ownerEmail} onChange={(v) => handleUpdate('ownerEmail', v)} />
                                        </div>
                                        <Input label="Insurance Provider" value={formData.insuranceProvider} onChange={(v) => handleUpdate('insuranceProvider', v)} />
                                    </div>
                                )}
                                
                                <div className="bg-gray-700/30 p-3 rounded mt-2 border border-gray-600">
                                    <h5 className="text-xs text-gray-400 font-bold uppercase mb-2">Property Data</h5>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input label="Parcel ID (APN)" value={formData.parcelId} onChange={(v) => handleUpdate('parcelId', v)} placeholder="e.g. 123-456-789" />
                                        <Input label="Gate / Access Code" value={formData.accessCode} onChange={(v) => handleUpdate('accessCode', v)} />
                                    </div>
                                    <Input label="Legal Description" value={formData.legalDescription} onChange={(v) => handleUpdate('legalDescription', v)} placeholder="Lot, Block, Tract..." />
                                </div>

                                {/* REPLACED: Digital Waiver Implementation */}
                                <div className="mt-4 p-4 border border-gray-600 bg-gray-800/50 rounded-lg">
                                    <h5 className="text-sm font-bold text-white mb-2">Legal Documents</h5>
                                    {formData.waiverData?.signed ? (
                                        <div className="flex items-center justify-between bg-green-900/30 border border-green-700 p-3 rounded">
                                            <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                Right of Entry & Waiver Signed
                                            </div>
                                            <button 
                                                onClick={() => setIsWaiverModalOpen(true)} 
                                                className="text-xs bg-green-800 hover:bg-green-700 text-white px-3 py-1.5 rounded font-bold uppercase"
                                            >
                                                View Signed Waiver
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs text-gray-400 mb-3">
                                                Homeowner must sign the Right of Entry and Liability Waiver before work begins.
                                            </p>
                                            <button 
                                                onClick={() => setIsWaiverModalOpen(true)}
                                                className="w-full bg-[#A92128] hover:bg-red-700 text-white text-sm font-bold py-3 px-4 rounded shadow-lg flex items-center justify-center gap-2 uppercase"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                Sign Right of Entry & Liability Waiver
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Assess' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <div className="bg-[#343a40] rounded-lg p-6 border border-gray-600">
                            <div className="flex justify-between items-center mb-6 border-b border-gray-600 pb-4">
                                <h3 className="text-xl font-bold text-white">Detailed Assessment</h3>
                                <span className="bg-[#A92128] text-white text-xs px-2 py-1 rounded font-bold uppercase">Form 2.0</span>
                            </div>

                            {/* OCCUPANCY & STRUCTURE */}
                            <SectionHeader title="Occupancy & Structure" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Toggle label="Occupants under 18?" checked={formData.occupantsUnder18} onChange={(v) => handleUpdate('occupantsUnder18', v)} />
                                    <Toggle label="Occupants over 62?" checked={formData.occupantsOver62} onChange={(v) => handleUpdate('occupantsOver62', v)} />
                                    <Toggle label="Accommodations needed?" checked={formData.accomodations} onChange={(v) => handleUpdate('accomodations', v)} subLabel="For disability/access" />
                                    <Toggle label="Currently living in structure?" checked={formData.currentlyLiving} onChange={(v) => handleUpdate('currentlyLiving', v)} />
                                    <Toggle label="Structure Habitable?" checked={formData.structureHabitable} onChange={(v) => handleUpdate('structureHabitable', v)} />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Structure Type</label>
                                        <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-[#A92128] focus:outline-none" value={formData.structureType} onChange={(e) => handleUpdate('structureType', e.target.value)}>
                                            <option>Single Family</option>
                                            <option>Multi-Family</option>
                                            <option>Business</option>
                                            <option>Non-Profit</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Occupancy</label>
                                        <div className="flex gap-4">
                                            <label className="flex items-center"><input type="radio" checked={formData.occupancyType === 'Own'} onChange={() => handleUpdate('occupancyType', 'Own')} className="mr-2 accent-[#A92128]"/> Own</label>
                                            <label className="flex items-center"><input type="radio" checked={formData.occupancyType === 'Rent'} onChange={() => handleUpdate('occupancyType', 'Rent')} className="mr-2 accent-[#A92128]"/> Rent</label>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <Input label="Sq Ft" value={formData.sqFootage} onChange={(v) => handleUpdate('sqFootage', v)} />
                                        <Input label="Beds" value={formData.bedrooms} onChange={(v) => handleUpdate('bedrooms', v)} />
                                        <Input label="Baths" value={formData.bathrooms} onChange={(v) => handleUpdate('bathrooms', v)} />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Construction</label>
                                        <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-[#A92128] focus:outline-none" value={formData.constructionType} onChange={(e) => handleUpdate('constructionType', e.target.value)}>
                                            <option>Wood-frame</option>
                                            <option>Brick</option>
                                            <option>Mobile Home</option>
                                            <option>Reinforced Masonry</option>
                                            <option>Steel</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* INSURANCE */}
                            <SectionHeader title="Insurance" />
                            <div className="space-y-3">
                                <Toggle label="Insurance on Structure?" checked={formData.insurance} onChange={(v) => handleUpdate('insurance', v)} />
                                {formData.insurance && (
                                    <div className="bg-gray-700/30 p-4 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Input label="Insurance Provider" value={formData.insuranceProvider} onChange={(v) => handleUpdate('insuranceProvider', v)} />
                                        <div>
                                            <label className="block text-xs text-gray-400 mb-1">Insurance Type</label>
                                            <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-[#A92128] focus:outline-none" value={formData.insuranceType} onChange={(e) => handleUpdate('insuranceType', e.target.value)}>
                                                <option>Homeowners</option>
                                                <option>Flood</option>
                                                <option>Earthquake</option>
                                                <option>Wind Damage</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2 flex gap-8">
                                             <label className="flex items-center text-sm"><input type="checkbox" checked={formData.metAdjuster} onChange={(e) => handleUpdate('metAdjuster', e.target.checked)} className="mr-2 accent-[#A92128]"/> Owner Met Adjuster</label>
                                             <label className="flex items-center text-sm"><input type="checkbox" checked={formData.damageCovered} onChange={(e) => handleUpdate('damageCovered', e.target.checked)} className="mr-2 accent-[#A92128]"/> Damage Covered</label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* UTILITIES & HAZARDS */}
                            <SectionHeader title="Utilities & Hazards" />
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm font-medium text-gray-200 mb-2">Active Utilities</div>
                                    <div className="flex gap-4 flex-wrap">
                                        {Object.keys(formData.utilities).map(u => (
                                            <label key={u} className="flex items-center bg-gray-700 px-3 py-2 rounded border border-gray-600 capitalize text-sm cursor-pointer hover:bg-gray-600">
                                                <input 
                                                    type="checkbox" 
                                                    checked={(formData.utilities as any)[u]} 
                                                    onChange={(e) => handleNestedUpdate('utilities', u, e.target.checked)}
                                                    className="mr-2 accent-[#A92128]"
                                                />
                                                {u}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-t border-gray-700 pt-2">
                                    <Toggle label="Downed Wires on Site?" checked={formData.downedWires} onChange={(v) => handleUpdate('downedWires', v)} />
                                    <Toggle label="Hazardous Materials Present?" checked={formData.hazmatPresent} onChange={(v) => handleUpdate('hazmatPresent', v)} />
                                    {formData.hazmatPresent && (
                                        <div className="bg-red-900/20 p-3 rounded border border-red-900/50 flex gap-4 mt-2">
                                             <label className="flex items-center text-sm"><input type="checkbox" checked={formData.hazmatTypes.asbestos} onChange={(e) => handleNestedUpdate('hazmatTypes', 'asbestos', e.target.checked)} className="mr-2 accent-[#A92128]"/> Asbestos</label>
                                             <label className="flex items-center text-sm"><input type="checkbox" checked={formData.hazmatTypes.lead} onChange={(e) => handleNestedUpdate('hazmatTypes', 'lead', e.target.checked)} className="mr-2 accent-[#A92128]"/> Lead Paint</label>
                                             <Input label="Other" value={formData.hazmatTypes.other} onChange={(v) => handleNestedUpdate('hazmatTypes', 'other', v)} className="flex-grow mb-0" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DAMAGE ASSESSMENT */}
                            <SectionHeader title="Damage Assessment" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                <Toggle label="Roof Breached?" checked={formData.roofBreached} onChange={(v) => handleUpdate('roofBreached', v)} />
                                <Toggle label="Roof Structurally Sound?" checked={formData.roofSound} onChange={(v) => handleUpdate('roofSound', v)} />
                                <Toggle label="Vegetative Debris?" checked={formData.vegDebris} onChange={(v) => handleUpdate('vegDebris', v)} />
                                <Toggle label="Non-Veg Debris?" checked={formData.nonVegDebris} onChange={(v) => handleUpdate('nonVegDebris', v)} />
                                <Toggle label="Sifting Needed?" checked={formData.sifting} onChange={(v) => handleUpdate('sifting', v)} />
                                <Toggle label="Basement?" checked={formData.basement} onChange={(v) => handleUpdate('basement', v)} />
                                <div className="md:col-span-2 mt-2">
                                     <label className="block text-xs text-gray-400 mb-1">Chimney Status</label>
                                     <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-[#A92128] focus:outline-none" value={formData.chimney} onChange={(e) => handleUpdate('chimney', e.target.value)}>
                                        <option>Stable</option>
                                        <option>Unstable</option>
                                        <option>Needs Removal</option>
                                        <option>N/A</option>
                                     </select>
                                </div>
                            </div>

                            {/* MUCK OUT */}
                            <SectionHeader title="Muck Out" />
                            <Toggle label="Muck-out Needed?" checked={formData.muckOutNeeded} onChange={(v) => handleUpdate('muckOutNeeded', v)} />
                            {formData.muckOutNeeded && (
                                <div className="bg-gray-700/20 p-4 rounded border border-gray-600 mt-2 space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Input label="Flood Height (ft)" value={formData.floodHeight} onChange={(v) => handleUpdate('floodHeight', v)} type="number" />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div className="space-y-2">
                                            <label className="font-semibold block">Basement</label>
                                            <input type="checkbox" checked={formData.basementAffected} onChange={(e) => handleUpdate('basementAffected', e.target.checked)} className="accent-[#A92128]"/> Affected
                                            {formData.basementAffected && <Input label="Water Depth" value={formData.basementDepth} onChange={(v) => handleUpdate('basementDepth', v)} />}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-semibold block">Ground Floor</label>
                                            <input type="checkbox" checked={formData.groundFloorAffected} onChange={(e) => handleUpdate('groundFloorAffected', e.target.checked)} className="accent-[#A92128]"/> Affected
                                            {formData.groundFloorAffected && <Input label="Water Depth" value={formData.groundFloorDepth} onChange={(v) => handleUpdate('groundFloorDepth', v)} />}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="font-semibold block">2nd Floor</label>
                                            <input type="checkbox" checked={formData.secondFloorAffected} onChange={(e) => handleUpdate('secondFloorAffected', e.target.checked)} className="accent-[#A92128]"/> Affected
                                            {formData.secondFloorAffected && <Input label="Water Depth" value={formData.secondFloorDepth} onChange={(v) => handleUpdate('secondFloorDepth', v)} />}
                                        </div>
                                    </div>
                                    <div className="border-t border-gray-600 pt-3">
                                        <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Removal Needed</div>
                                        <div className="flex gap-6">
                                            <label className="flex items-center text-sm"><input type="checkbox" checked={formData.flooringRemoval.carpet} onChange={(e) => handleNestedUpdate('flooringRemoval', 'carpet', e.target.checked)} className="mr-2 accent-[#A92128]"/> Carpet</label>
                                            <label className="flex items-center text-sm"><input type="checkbox" checked={formData.flooringRemoval.hardwood} onChange={(e) => handleNestedUpdate('flooringRemoval', 'hardwood', e.target.checked)} className="mr-2 accent-[#A92128]"/> Hardwood</label>
                                            <label className="flex items-center text-sm"><input type="checkbox" checked={formData.flooringRemoval.drywall} onChange={(e) => handleNestedUpdate('flooringRemoval', 'drywall', e.target.checked)} className="mr-2 accent-[#A92128]"/> Drywall</label>
                                        </div>
                                    </div>
                                    <Toggle label="Debris too unsafe for hand crew?" checked={formData.debrisUnsafe} onChange={(v) => handleUpdate('debrisUnsafe', v)} />
                                </div>
                            )}

                            {/* TARPING */}
                            <SectionHeader title="Tarping" />
                            <Toggle label="Tarping Needed?" checked={formData.tarpingNeeded} onChange={(v) => handleUpdate('tarpingNeeded', v)} />
                            {formData.tarpingNeeded && (
                                <div className="bg-gray-700/20 p-4 rounded border border-gray-600 mt-2 grid grid-cols-2 gap-4">
                                    <Input label="Area Size (sq ft)" value={formData.tarpSize} onChange={(v) => handleUpdate('tarpSize', v)} />
                                    <Input label="Roof Slope" value={formData.roofSlope} onChange={(v) => handleUpdate('roofSlope', v)} placeholder="e.g. 4/12" />
                                </div>
                            )}
                            <div className="mt-2">
                                <Toggle label="Window Boarding?" checked={formData.windowBoarding} onChange={(v) => handleUpdate('windowBoarding', v)} />
                                {formData.windowBoarding && <Input label="# Windows" value={formData.windowCount} onChange={(v) => handleUpdate('windowCount', v)} type="number" className="mt-2 w-1/3" />}
                            </div>

                            {/* SAWYER */}
                            <SectionHeader title="Sawyer Work" />
                            <Toggle label="Sawyer Work Needed?" checked={formData.sawyerNeeded} onChange={(v) => handleUpdate('sawyerNeeded', v)} />
                            {formData.sawyerNeeded && (
                                <div className="bg-gray-700/20 p-4 rounded border border-gray-600 mt-2">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <Toggle label="Trees Leaning on Structure?" checked={formData.treesLeaning} onChange={(v) => handleUpdate('treesLeaning', v)} />
                                        <Toggle label="Trees Blocking Access?" checked={formData.treesBlocking} onChange={(v) => handleUpdate('treesBlocking', v)} />
                                        <Toggle label="Bucking/Limbing?" checked={formData.buckingLimbing} onChange={(v) => handleUpdate('buckingLimbing', v)} />
                                        <Toggle label="Tree Felling?" checked={formData.treeFelling} onChange={(v) => handleUpdate('treeFelling', v)} />
                                    </div>
                                    <div className="text-xs font-bold text-gray-400 mb-2 uppercase">Tree Counts (Diameter)</div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label="&lt; 12&quot;" value={formData.treeCounts.small} onChange={(v) => handleNestedUpdate('treeCounts', 'small', v)} type="number" />
                                        <Input label="12-23&quot;" value={formData.treeCounts.medium} onChange={(v) => handleNestedUpdate('treeCounts', 'medium', v)} type="number" />
                                        <Input label="25-36&quot;" value={formData.treeCounts.large} onChange={(v) => handleNestedUpdate('treeCounts', 'large', v)} type="number" />
                                    </div>
                                </div>
                            )}

                            {/* HEAVY EQUIPMENT */}
                            <SectionHeader title="Heavy Equipment" />
                            <Toggle label="Heavy Equipment Needed?" checked={formData.heNeeded} onChange={(v) => handleUpdate('heNeeded', v)} />
                            {formData.heNeeded && (
                                <div className="bg-gray-700/20 p-4 rounded border border-gray-600 mt-2 space-y-3">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Type of Equipment</label>
                                        <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm focus:border-[#A92128] focus:outline-none" value={formData.heType} onChange={(e) => handleUpdate('heType', e.target.value)}>
                                            <option value="">Select...</option>
                                            <option>Skid Steer / CTL</option>
                                            <option>Excavator</option>
                                            <option>Crane</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <Toggle label="Debris Blocking Access?" checked={formData.debrisBlockingAccess} onChange={(v) => handleUpdate('debrisBlockingAccess', v)} />
                                    <Toggle label="Structure Demolition Needed?" checked={formData.demolitionNeeded} onChange={(v) => handleUpdate('demolitionNeeded', v)} />
                                    <Toggle label="Missing Parts to Structure?" checked={formData.missingParts} onChange={(v) => handleUpdate('missingParts', v)} />
                                    {formData.missingParts && <Input label="Describe Missing Parts" value={formData.missingPartsDesc} onChange={(v) => handleUpdate('missingPartsDesc', v)} />}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'Notes' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        <div className="bg-[#343a40] rounded-lg p-4 border border-gray-600">
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">Step 5: Capture Notes & Photos</h3>
                            
                            {/* SATELLITE MAP NOW HERE WITH CONTROLS */}
                            {activeSurvey?.data?.fullData && (
                                <MiniPropertyMap 
                                    lat={activeSurvey.data.lat} 
                                    lon={activeSurvey.data.lon} 
                                    geojson={activeSurvey.data.fullData.geojson} 
                                    boundingBox={activeSurvey.data.fullData.boundingbox}
                                    viewport={activeSurvey.data.fullData.geometry?.viewport}
                                    annotations={formData.mapAnnotations}
                                    onAnnotationsChange={(anns) => handleUpdate('mapAnnotations', anns)}
                                />
                            )}

                            <div className="mb-4">
                                <textarea 
                                    className="w-full bg-gray-700 border border-gray-600 rounded p-3 text-white text-sm focus:outline-none focus:border-[#A92128]" 
                                    placeholder="Enter a note... share with C&G to better understand scope."
                                    rows={6}
                                    value={formData.notes}
                                    onChange={(e) => handleUpdate('notes', e.target.value)}
                                />
                            </div>
                            <div className="flex justify-center gap-6 p-4 bg-gray-700/30 rounded border border-gray-600 border-dashed">
                                <button className="flex flex-col items-center text-gray-400 hover:text-[#A92128]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-xs">Camera</span>
                                </button>
                                <button className="flex flex-col items-center text-gray-400 hover:text-[#A92128]">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                    <span className="text-xs">Voice Note</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Complete' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                         <div className="bg-[#343a40] rounded-lg p-4 border border-gray-600">
                            <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-600 pb-2">Step 6: Submit for Processing</h3>
                            <div className="space-y-4">
                                <Toggle 
                                    label="Ready to Submit Site Survey?" 
                                    checked={formData.readyToSubmit} 
                                    onChange={(v) => {
                                        handleUpdate('readyToSubmit', v);
                                        if(v) handleUpdate('cancelInquiry', false);
                                    }} 
                                    subLabel="Once submitted, the survey is available for Triage."
                                />
                                
                                <div className="bg-gray-700/30 p-3 rounded border border-gray-600 my-4">
                                     <Toggle label="Is All Work Within TR Scope?" checked={formData.withinScope} onChange={(v) => handleUpdate('withinScope', v)} />
                                     {!formData.withinScope && (
                                         <Input label="Out of Scope Reason" value={formData.oosReason} onChange={(v) => handleUpdate('oosReason', v)} placeholder="Why is it OOS?" className="mt-2" />
                                     )}
                                </div>

                                <div className="my-2 border-t border-gray-700"></div>
                                <Toggle 
                                    label="Cancel Inquiry?" 
                                    checked={formData.cancelInquiry} 
                                    onChange={(v) => {
                                        handleUpdate('cancelInquiry', v);
                                        if(v) handleUpdate('readyToSubmit', false);
                                    }} 
                                    subLabel="Select only if survey cannot be completed."
                                />
                                {formData.cancelInquiry && (
                                     <select className="w-full bg-gray-700 border border-gray-600 rounded p-2 text-white text-sm mt-2 focus:border-[#A92128] focus:outline-none">
                                        <option>Reason for cancellation...</option>
                                        <option>Duplicate</option>
                                        <option>Work Complete</option>
                                        <option>Homeowner Refused</option>
                                        <option>No Longer Needed</option>
                                        <option>Survivor Cancelled</option>
                                    </select>
                                )}

                                <button 
                                    onClick={handleSave}
                                    className={`w-full py-3 rounded font-bold text-white mt-4 ${formData.readyToSubmit || formData.cancelInquiry ? 'bg-[#A92128] hover:bg-red-700' : 'bg-gray-600 cursor-not-allowed opacity-50'}`}
                                    disabled={!formData.readyToSubmit && !formData.cancelInquiry}
                                >
                                    {formData.cancelInquiry ? 'Cancel Inquiry' : 'Submit Survey'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Waiver Modal Instance */}
            <WaiverModal 
                isOpen={isWaiverModalOpen}
                onClose={() => setIsWaiverModalOpen(false)}
                data={formData.waiverData}
                onSave={(waiverData) => handleUpdate('waiverData', waiverData)}
                defaults={{
                    address: activeSurvey?.address || '',
                    owner: formData.ownerName || '',
                    phone: formData.ownerPhone || '',
                    email: formData.ownerEmail || ''
                }}
            />
        </div>
    );
};
