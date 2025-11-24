
export const FIELD_MAPPINGS = {
    address: [
        'address line 1', 'street address', 'address', 'street', 'location', 'site address', 
        'property address', 'service address', 'full address', 'incident address', 'destination', 
        'addr', 'site', 'property', 'home address', 'physical address', 'house number', 'functional location'
    ],
    address2: ['address line 2', 'unit', 'apt', 'apartment', 'suite', 'bldg', 'building'],
    city: ['city', 'municipality', 'town', 'city name', 'city (site survey)'],
    state: ['state', 'province', 'region', 'state/province', 'state (site survey)'],
    zip: ['zip code', 'zip', 'postal code', 'postal', 'post code', 'zipcode', 'zip code (site survey)'],
    lat: ['lat', 'latitude', 'y', 'gps lat', 'start lat', 'latitude (functional location)', 'latitude (site survey)'],
    lon: ['lon', 'lng', 'longitude', 'long', 'x', 'gps lon', 'start lon', 'longitude (functional location)', 'longitude (site survey)'],
    work_type: ['primary help needed', 'primary help needed (site survey)', 'help needed', 'service requested', 'primary help', 'work type', 'type', 'work requested', 'incident type', 'task', 'classification', 'category', 'job type', 'request type'],
    status: ['status - tr wo', 'status', 'assignment', 'sub status', 'system status', 'state', 'current status'],
    wo_number: ['work order number', 'work order', 'wo number', 'wo #', 'work order #', 'workord', 'work ord', 'case number', 'id', 'ticket #', 'reference number', 'ref #', 'incident #'],
    strike_team: ['strike team', 'assigned team', 'team', 'resource', 'crew', 'assigned to'],
    notes: ['notes', 'description', 'comments', 'details', 'instructions', 'remarks', 'info'],
    contact_name: ['contact name', 'contact', 'owner name', 'name', 'first name', 'last name', 'survivor name', 'poc', 'point of contact'],
    contact_phone: ['contact phone', 'phone', 'phone number', 'mobile', 'cell', 'owner phone', 'contact #']
};

export const WORK_TYPE_BORDER_COLORS: { [key: string]: string } = {
    'Sawyer': '#2E7D32', // Darker Green for better contrast
    'Muck Out': '#795548', // Brown
    'Tarp': '#1976D2', // Blue
    'Vegetative Debris Removal': '#4CAF50', // Light Green
    'Non-Vegetative Debris Removal': '#673AB7', // Purple
    'Heavy Equipment': '#F57C00', // Orange
    'Site Survey': '#FBC02D', // Yellow
    'Other': '#607D8B', // Blue Grey
};

export const STATIC_WORK_TYPES = ['Sawyer', 'Muck Out', 'Tarp', 'Vegetative Debris Removal', 'Non-Vegetative Debris Removal', 'Heavy Equipment', 'Site Survey', 'Other'];
export const STATIC_STATUSES = ['Active', 'Unscheduled', 'Completed', 'On Hold', 'Canceled'];
export const ALL_TEAMS = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa', 'Quebec', 'Romeo', 'Sierra', 'Tango', 'Uniform', 'Victor', 'Whiskey', 'X-ray', 'Yankee', 'Zulu'];

export const MARKER_CATEGORIES = {
    'Response Work': ['Sawyer Work', 'Muck Out', 'Roof Tarping', 'Vegetative Debris Removal', 'Non-Vegetative Debris Removal', 'Heavy Equipment Needed', 'Site Survey', 'Other/Unspecified', 'Search and Rescue', 'Point of Distribution'],
    'Infrastructure Hazard': ['Downed Power Line', 'Gas Leak', 'Compromised Bridge', 'Road Blocked', 'Unstable Structure', 'Communications Outage', 'Broken Water Main', 'Sewage Hazard', 'Sinkhole', 'Damaged Dam/Levee'],
    'Acute Hazard': ['Flash Flood', 'Swift Moving Water', 'Active Landslide', 'Wildfire', 'HazMat Spill', 'Chemical Plume', 'Falling Debris Risk', 'Widowmaker', 'Electrified Water', 'Unexploded Ordnance'],
    'Health & Bio Hazard': ['Contaminated Water Source', 'Mold Hazard', 'Dangerous Wildlife', 'Vector-Borne Disease Risk', 'Stray Animals', 'Biohazard Waste', 'Air Quality Alert', 'Waterborne Pathogen', 'Avian Flu Risk', 'Viral Outbreak'],
    'Community Status': ['Evacuation Zone', 'Shelter-in-Place', 'Curfew Area', 'Looting Risk', 'Isolated Community', 'Missing Persons', 'Fatality Site', 'Vulnerable Population', 'Food/Water Scarcity', 'Debris Staging Area']
};

// Flatten categories for easy lookup, plus legacy support
export const HAZARD_TYPES = [
    ...MARKER_CATEGORIES['Response Work'],
    ...MARKER_CATEGORIES['Infrastructure Hazard'],
    ...MARKER_CATEGORIES['Acute Hazard'],
    ...MARKER_CATEGORIES['Health & Bio Hazard'],
    ...MARKER_CATEGORIES['Community Status'],
    'Other'
];

export const HAZARD_COLORS: { [key: string]: string } = {
    // Defaults
    'Other': '#607D8B',
    
    // Response Work
    'Sawyer Work': '#1976D2',
    'Muck Out': '#1976D2',
    'Roof Tarping': '#1976D2',
    'Vegetative Debris Removal': '#1976D2',
    'Non-Vegetative Debris Removal': '#1976D2',
    'Heavy Equipment Needed': '#1976D2',
    'Site Survey': '#1976D2',
    'Other/Unspecified': '#1976D2',
    'Search and Rescue': '#1976D2',
    'Point of Distribution': '#1976D2',

    // Infrastructure Hazard
    'Downed Power Line': '#F57C00',
    'Gas Leak': '#F57C00',
    'Compromised Bridge': '#F57C00',
    'Road Blocked': '#F57C00',
    'Unstable Structure': '#F57C00',
    'Communications Outage': '#F57C00',
    'Broken Water Main': '#F57C00',
    'Sewage Hazard': '#F57C00',
    'Sinkhole': '#F57C00',
    'Damaged Dam/Levee': '#F57C00',

    // Acute Hazard
    'Flash Flood': '#D32F2F',
    'Swift Moving Water': '#D32F2F',
    'Active Landslide': '#D32F2F',
    'Wildfire': '#D32F2F',
    'HazMat Spill': '#D32F2F',
    'Chemical Plume': '#D32F2F',
    'Falling Debris Risk': '#D32F2F',
    'Widowmaker': '#D32F2F',
    'Electrified Water': '#D32F2F',
    'Unexploded Ordnance': '#D32F2F',

    // Health & Bio Hazard
    'Contaminated Water Source': '#7B1FA2',
    'Mold Hazard': '#7B1FA2',
    'Dangerous Wildlife': '#7B1FA2',
    'Vector-Borne Disease Risk': '#7B1FA2',
    'Stray Animals': '#7B1FA2',
    'Biohazard Waste': '#7B1FA2',
    'Air Quality Alert': '#7B1FA2',
    'Waterborne Pathogen': '#7B1FA2',
    'Avian Flu Risk': '#7B1FA2',
    'Viral Outbreak': '#7B1FA2',

    // Community Status
    'Evacuation Zone': '#455A64',
    'Shelter-in-Place': '#455A64',
    'Curfew Area': '#455A64',
    'Looting Risk': '#455A64',
    'Isolated Community': '#455A64',
    'Missing Persons': '#455A64',
    'Fatality Site': '#455A64',
    'Vulnerable Population': '#455A64',
    'Food/Water Scarcity': '#455A64',
    'Debris Staging Area': '#FBC02D'
};

export const HAZARD_ICONS: { [key: string]: string } = {
    // --- Work Type Icons Refreshed (Corresponding to provided image) ---
    
    // Sawyer Work: Chainsaw cutting log
    'Sawyer': `<path d="M22.2 13.6l-4.9-4.9-1.4 1.4 1.4 1.4H12.5V9.5h-2v5h2v-2h3.8l-1.4 1.4 1.4 1.4 4.9-4.9c.4-.4.4-1 0-1.4zM4 15h8v2H4zM18 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>`, 
    'Sawyer Work': `<path d="M22.2 13.6l-4.9-4.9-1.4 1.4 1.4 1.4H12.5V9.5h-2v5h2v-2h3.8l-1.4 1.4 1.4 1.4 4.9-4.9c.4-.4.4-1 0-1.4zM4 15h8v2H4zM18 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm0 4a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>`,

    // Muck Out: Shovel inside House
    'Muck Out': `<path d="M12 3L2 12h3v8h14v-8h3L12 3zm2 13h-4v-1c0-1.5 1-2 2-2s2 .5 2 2v1zm-1-2.5V10h-2v3.5c-.8 0-1.5.7-1.5 1.5H10v1h4v-1h.5c0-.8-.7-1.5-1.5-1.5z"/>`,

    // Roof Tarping: House with roof overlay
    'Tarp': `<path d="M12 3L2 12h3v8h14v-8h3L12 3z"/><path d="M5.5 9L12 3.5 18.5 9H16v2h-8V9H5.5z" fill="currentColor" opacity="0.8"/>`, 
    'Roof Tarping': `<path d="M12 3L2 12h3v8h14v-8h3L12 3z"/><path d="M5.5 9L12 3.5 18.5 9H16v2h-8V9H5.5z" fill="currentColor" opacity="0.8"/>`,

    // Vegetative Debris Removal: Branches pile with arrow out
    'Vegetative Debris Removal': `<path d="M14 12l-3-3-2 2 3 3-2 2-3-3-2 2 3 3c1.1 1.1 2.9 1.1 4 0l2-2 2 2 1.4-1.4-2-2 2-2L14 12z"/><path d="M17 5v4l4-4-4-4v4h-3c-2.8 0-5 2.2-5 5h2c0-1.7 1.3-3 3-3h3z"/>`, 

    // Non-Vegetative Debris Removal: Furniture pile with arrow out
    'Non-Vegetative Debris Removal': `<path d="M4 15h3v4H4z M8 15h3v4H8z M12 15h3v4h-3z M4 11h11v3H4z"/><path d="M17 5v4l4-4-4-4v4h-3c-2.8 0-5 2.2-5 5h2c0-1.7 1.3-3 3-3h3z"/>`, 

    // Heavy Equipment: Excavator
    'Heavy Equipment': `<path d="M21 14V9h-5v2h-2V9H6c-1.1 0-2 .9-2 2v3H2v6h13v-2h3v2h5v-6h-2zm-9 4H4v-4h8v4z M20 9h-2V7h2v2z"/>`, 
    'Heavy Equipment Needed': `<path d="M21 14V9h-5v2h-2V9H6c-1.1 0-2 .9-2 2v3H2v6h13v-2h3v2h5v-6h-2zm-9 4H4v-4h8v4z M20 9h-2V7h2v2z"/>`,

    // Site Survey: Clipboard with Check
    'Site Survey': `<path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/><path d="M15 11l-4 4-2-2 1.4-1.4 1.6 1.6 3-3z"/>`, 

    // Other/Unspecified: Question Mark
    'Other': `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>`,
    'Other/Unspecified': `<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>`,

    // Search and Rescue: Dog and Hand
    'Search and Rescue': `<path d="M20 12c0-1.1-.9-2-2-2V6c0-2.2-1.8-4-4-4-1.8 0-3.3 1.2-3.8 2.8L9.7 3.3C9.3 2.5 8.5 2 7.6 2 6.2 2 5 3.2 5 4.6c0 .5.1.9.4 1.3L8 10H5c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h10l4-6v-1h1z"/>`, 

    // Point of Distribution: Box with items
    'Point of Distribution': `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" opacity="0"/><path d="M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm10 16H4V8h16v12z"/><path d="M13 10h2v3h-2zm-4 0h2v3H9z"/>`,

    // --- Hazards ---
    'Downed Power Line': `<path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.29-.62L9 11.24V11l8.48-6.12c.44-.32.78-.09.64.43l-1.31 5.33 3.71.53c.53.08.55.39.11.74l-7.68 8.52z"/>`, // Lightning
    'Gas Leak': `<path d="M19 14.5c0-2.5-2-4.5-4.5-4.5S10 12 10 14.5 12 19 14.5 19 19 17 19 14.5zM7 14h2v2H7zm0-3h2v2H7zm0-3h2v2H7z"/>`, // Fumes/Pipe
    'Unstable Structure': `<path d="M12 2L2 22h20L12 2zm2 15h-4v-2h4v2zm0-4h-4V8h4v5z"/>`, // Warning triangle (cracked)
    'Wildfire': `<path d="M17.5 10c-.8 0-1.5.7-1.5 1.5 0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5c0-.8-.7-1.5-1.5-1.5zM12 2C9.5 2 7.3 3.2 6 5c0 0 3.5 2 3.5 6 0 2.2-1.8 4-4 4-1.5 0-2.8-.8-3.5-2 0 3.3 2.7 6 6 6 3.3 0 6-2.7 6-6 0-4-2.5-6-4.5-8.5 2.5-2 4.5-2.5 4.5-2.5z"/>`, // Fire
    'HazMat Spill': `<path d="M12 2L2 22h20L12 2zm2 16h-4v-2h4v2zm0-4h-4v-4h4v4z"/><path d="M10 10h4v4h-4z"/>`, // Warning barrel
    'Chemical Plume': `<path d="M19.5 10c-2.5 0-4.5 2-4.5 4.5S17 19 19.5 19 24 17 24 14.5 22 10 19.5 10zM4 12h10v2H4zm0-4h10v2H4zm0 8h6v2H4z"/>`, // Smoke
    'Falling Debris Risk': `<path d="M12 2L2 22h20L12 2zm-1 15h2v2h-2zm0-6h2v4h-2z"/>`, // Falling rocks
    'Widowmaker': `<path d="M10 21l4-18h-3l-4 18z M16 8l2 6h-2z"/>`, // Broken Branch
    'Electrified Water': `<path d="M11 21l1-7H7.5l1.7-2.4L7 12l8.5-6 1.3 5.3H19l-7.7 8.5zM2 12c0-2.8 4-4 10-4s10 1.2 10 4c0 2.8-4 4-10 4S2 14.8 2 12z"/>`, // Bolt + Water
    'Unexploded Ordnance': `<path d="M12 2c-4.4 0-8 3.6-8 8 0 3.3 2 6.2 5 7.4V22h6v-4.6c3-1.2 5-4.1 5-7.4 0-4.4-3.6-8-8-8z"/>`, // Bomb

    // --- Water & Flood ---
    'Flash Flood': `<path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/><path d="M1 20h22v2H1z"/>`, // Car in water
    'Swift Moving Water': `<path d="M2 12c0-2.8 4-4 10-4s10 1.2 10 4c0 2.8-4 4-10 4S2 14.8 2 12z M14 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>`, // Swimmer
    'Broken Water Main': `<path d="M19 12h-2V8h-2v4h-2V8H9v4H7V8H5v4H3v2h18v-2zM12 6c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"/>`, // Spray
    'Sewage Hazard': `<path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>`, // Bio/Circle
    'Contaminated Water Source': `<path d="M12 2L2 22h20L12 2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c1.1 0 2 .9 2 2v2h-4V8c0-1.1.9-2 2-2z"/>`, // Drop hazard
    'Waterborne Pathogen': `<path d="M12 2c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>`, // Germ

    // --- Access & Roads ---
    'Road Blocked': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm5 11H7v-2h10v2z"/>`, // Do Not Enter
    'Compromised Bridge': `<path d="M2 8v4h3v-4H2zm5 0v4h3v-4H7zm5 0v4h3v-4h-3zm5 0v4h3v-4h-3zM2 14v2h20v-2H2z"/>`, // Bridge
    'Sinkhole': `<path d="M12 4c-4.4 0-8 3.6-8 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6zm0-10c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/>`, // Hole
    'Damaged Dam/Levee': `<path d="M2 12v10h20V12l-10-8z M12 16h-2v-2h2v2z M12 12h-2v-2h2v2z"/>`, // Wall
    'Road Obstruction': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 15c-.6 0-1-.4-1-1s.4-1 1-1 1 .4 1 1-.4 1-1 1zm1-4h-2V7h2v6z"/>`, // Generic Warning
    'Washed Out Bridge': `<path d="M2 8v4h3v-4H2zm5 0v4h3v-4H7zm5 0v4h3v-4h-3zm5 0v4h3v-4h-3zM2 14v2h20v-2H2z"/>`, // Bridge

    // --- Health & Bio ---
    'Mold Hazard': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 14h2v2h-2zm0-10h2v8h-2z"/>`, // Spores
    'Biohazard Waste': `<path d="M12 2L2 22h20L12 2zm0 10c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z"/>`, // Bio
    'Air Quality Alert': `<path d="M10 4c-2.2 0-4 1.8-4 4v5h8V8c0-2.2-1.8-4-4-4zM4 14v2h16v-2H4z"/>`, // Mask
    'Viral Outbreak': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-2-9h4v2h-4z"/>`, // Virus
    'Avian Flu Risk': `<path d="M12 2L2 12h3v8h14v-8h3L12 2zm0 2.8L17.2 10H6.8L12 4.8z"/>`, // Bird/House
    'Vector-Borne Disease Risk': `<path d="M12 2L2 22h20L12 2zm0 13c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>`, // Mosquito/Bug
    'Stray Animals': `<path d="M4.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM19.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM12 13c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4z"/>`, // Paw
    'Dangerous Wildlife': `<path d="M12 2L2 22h20L12 2zm0 16c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>`, // Warning

    // --- Community ---
    'Evacuation Zone': `<path d="M12 3L2 12h3v8h14v-8h3L12 3zm4 10h-2v4h-4v-4H8l4-4 4 4z"/>`, // House Arrow Out
    'Shelter-in-Place': `<path d="M12 3L2 12h3v8h14v-8h3L12 3zm-1 14h2v-2h-2v2zm0-4h2V9h-2v4z"/>`, // House Lock
    'Curfew Area': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/>`, // Clock
    'Looting Risk': `<path d="M12 2L2 22h20L12 2zm-1 15h2v2h-2zm0-6h2v4h-2z"/>`, // Broken Window
    'Isolated Community': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 14c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z"/>`, // Island
    'Missing Persons': `<path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c4.4 0 8 1.8 8 4v2H4v-2c0-2.2 3.6-4 8-4z"/>`, // Silhouette
    'Fatality Site': `<path d="M20.5 6c-2.6 0-4.8 1.3-6 3.3-1.2-2-3.4-3.3-6-3.3C4.8 6 2 9 2 13c0 5 7.4 11 10 11s10-6 10-11c0-4-2.8-7-6.5-7z"/>`, // Heart/Body
    'Vulnerable Population': `<path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 10c4.4 0 8 1.8 8 4v2H4v-2c0-2.2 3.6-4 8-4z"/>`, // Group
    'Food/Water Scarcity': `<path d="M11 9H9V2H7v7H5V2H3v7c0 2.1 1.6 3.9 3.5 4.1v5.9h4.1v-5.9c1.9-.2 3.5-2 3.5-4.1V2h-2v7zm5.3-1.1l3.5-3.5 1.4 1.4-3.5 3.5 3.5 3.5-1.4 1.4-3.5-3.5-3.5 3.5-1.4-1.4 3.5 3.5z"/>`, // Cutlery Slash

    // --- Logistics ---
    'Communications Outage': `<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15h2v-2h-2v2zm0-4h2V7h-2v6z"/>`, // Tower
    'Debris Staging Area': `<path d="M1 18v3h22v-3h-2v-2h-4v2H7v-2H3v2H1zm4-8h14v4h-2v-2H7v2H5v-4z"/>`, // Truck
};

export const WORK_TYPE_ICONS = HAZARD_ICONS; // Alias for now as we share icons

export const INFRASTRUCTURE_TYPES = ['FOB', 'Airport', 'Hospital', 'Fire Station', 'Police Department', 'Disaster Incident'];
export const INFRASTRUCTURE_STATUSES = ['Operational', 'Damaged', 'Closed'];

// Refined infrastructure icons: Bold, Filled, Legible.
export const INFRASTRUCTURE_ICONS: { [key: string]: { icon: string, color: string, isLogo?: boolean } } = {
    'FOB': { icon: 'LogoIcon', color: '#5B6771', isLogo: true },
    'Airport': { icon: `<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>`, color: '#607D8B' },
    'Hospital': { icon: `<path d="M19 3H5c-1.1 0-1.99.9-1.99 2L3 19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>`, color: '#C32033' },
    'Fire Station': { icon: `<path d="M19.48 12.35c-1.57-4.08-7.16-4.3-5.81-10.23.1-.44-.37-.78-.75-.55C9.29 3.71 6.68 8 8.87 13.62c.18.46-.36.89-.75.59-.27-.21-.36-.26-2.12-2.18-.3-.33-.86-.07-.81.37.34 3.06 1.8 6.03 4.81 7.59 3.27 1.7 7.26.65 9.33-2.48.37-.56.62-1.13.73-1.7.15-.79-.46-1.35-1.25-1.13l-.03-.01z"/>`, color: '#FF9800' },
    'Police Department': { icon: `<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>`, color: '#2196F3' },
    'Disaster Incident': { icon: `<path d="M12 2L1 21h22L12 2zm1 16h-2v-2h2v2zm0-4h-2v-4h2v4z"/>`, color: '#FFEB3B' },
};
