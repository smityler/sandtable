
import React, { useEffect, useRef, useState } from 'react';
import { ProcessedWorkOrder, HazardMarker, InfrastructureMarker, MapLayer, ImpactZone, SiteSurvey } from '../types';
import { WORK_TYPE_BORDER_COLORS, HAZARD_ICONS, INFRASTRUCTURE_ICONS, WORK_TYPE_ICONS, HAZARD_COLORS } from '../constants';

declare const google: any;
declare const markerClusterer: any;

interface MapComponentProps {
    apiKey: string;
    workOrders: ProcessedWorkOrder[];
    hazardMarkers: HazardMarker[];
    infrastructureMarkers: InfrastructureMarker[];
    mapLayers?: MapLayer[];
    impactZones?: ImpactZone[];
    showPrimaryZones?: boolean;
    showSecondaryZones?: boolean;
    drawingZoneType?: 'Primary' | 'Secondary' | null;
    onZoneCreated?: (type: 'Primary' | 'Secondary', path: { lat: number; lng: number }[]) => void;
    isAddingHazard: boolean;
    isPlacingWorkOrder: boolean;
    placingInfrastructureType: string | null;
    onApiKeyMissing: () => void;
    onApiLoaded: () => void;
    focusedWorkOrderNumber: string | null;
    onEditWorkOrder?: (woNumber: string) => void;
    onDeleteWorkOrder?: (woNumber: string) => void;
    onFocusWorkOrder?: (wo: ProcessedWorkOrder) => void;
    onMapClickForHazard: (lat: number, lon: number) => void;
    onMapClickForWorkOrder: (lat: number, lon: number) => void;
    onMapClickForInfrastructure: (lat: number, lon: number) => void;
    onDeleteHazard: (id: string) => void;
    onEditHazard?: (id: string) => void;
    onDeleteInfrastructure: (id: string) => void;
    viewConfig?: { center: { lat: number, lng: number }, zoom: number, mapTypeId: string } | null;
    siteSurveys?: SiteSurvey[]; // New prop for site survey lookups
    onOpenSiteSurvey?: (surveyId: string) => void; // New callback
}

const isValidCoordinate = (lat: any, lon: any): boolean => {
    return typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon);
};

const createCombinedIcon = (group: ProcessedWorkOrder[], count: number) => {
    const uniqueWorkTypes = [...new Set(group.map(wo => wo.filterData.workType || 'Other'))];
    const borderColors = uniqueWorkTypes.map(wt => WORK_TYPE_BORDER_COLORS[wt] || WORK_TYPE_BORDER_COLORS.Other).slice(0, 4);
    
    const uniqueTeams = [...new Set(group.map(wo => wo.filterData.strikeTeam).filter(t => t && t !== 'Unassigned'))].sort();
    let initialsText = '?';
    if (uniqueTeams.length > 0) {
        initialsText = uniqueTeams.map(t => t.charAt(0).toUpperCase()).slice(0, 3).join('');
    }

    let fontSize = 20; let yPos = 27; let letterSpacing = 0;
    if (initialsText.length === 2) { fontSize = 18; yPos = 26; letterSpacing = 4; } 
    else if (initialsText.length >= 3) { fontSize = 14; yPos = 25; letterSpacing = 2; }
    
    const allCompleted = group.every(wo => wo.filterData.status === 'Completed');
    const textColor = allCompleted ? '#28a745' : '#FFFFFF';

    // Check if all WOs in the group are Unscheduled/Unassigned
    const allUnassigned = group.every(wo => wo.filterData.strikeTeam === 'Unassigned' || wo.filterData.status === 'Unscheduled');
    
    // --- NEW LOGIC FOR UNSCHEDULED ICONS (Standalone Shapes) ---
    if (allUnassigned) {
        const primaryType = group[0].filterData.workType || 'Other';
        const iconPath = WORK_TYPE_ICONS[primaryType] || WORK_TYPE_ICONS['Other'];
        const fillColor = WORK_TYPE_BORDER_COLORS[primaryType] || WORK_TYPE_BORDER_COLORS['Other'];
        
        // Remove any existing fill or stroke attributes from the raw icon string to ensure our styling takes precedence
        const cleanedIconPath = iconPath
            .replace(/fill="[^"]*"/g, '')
            .replace(/stroke="[^"]*"/g, '');

        const countBadge = count > 1
            ? `<g transform="translate(30, -5)"><circle cx="10" cy="10" r="10" fill="#D32F2F" stroke="#FFFFFF" stroke-width="2"/><text x="10" y="14" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial">${count}</text></g>` 
            : '';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-5 -5 50 50" width="50" height="50">
            <defs>
                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="1" dy="2" stdDeviation="1" flood-opacity="0.5"/>
                </filter>
            </defs>
            <g transform="scale(1.8) translate(1,1)" filter="url(#shadow)" fill="${fillColor}" stroke="white" stroke-width="1">
                 <svg viewBox="0 0 24 24" width="24" height="24">
                    ${cleanedIconPath}
                 </svg>
            </g>
            ${countBadge}
        </svg>`;

        return {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
            scaledSize: new google.maps.Size(50, 50),
            anchor: new google.maps.Point(25, 25),
        };
    }

    // --- EXISTING LOGIC FOR ASSIGNED CLUSTERS (Circular Badges) ---
    let centerContent = `<text x="20" y="${yPos}" font-size="${fontSize}" font-weight="bold" fill="${textColor}" text-anchor="middle" font-family="Arial" letter-spacing="${letterSpacing}" stroke="#000" stroke-width="0.5" paint-order="stroke">${initialsText}</text>`;

    const countBadge = count > 1
        ? `<g><circle cx="36" cy="4" r="10" fill="#A92128" stroke="#FFFFFF" stroke-width="1.5"/><text x="36" y="8" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle" font-family="Arial">${count}</text></g>` : '';
        
    let borderSvg = '';
    const totalBorderWidth = 5; 
    const numRings = borderColors.length;
    if (numRings <= 1) {
        borderSvg = `<circle cx="20" cy="20" r="18" fill="#343a40" stroke="${borderColors[0] || WORK_TYPE_BORDER_COLORS.Other}" stroke-width="${totalBorderWidth}"/>`;
    } else {
        const ringWidth = totalBorderWidth / numRings;
        const contentRadius = 18 - totalBorderWidth;
        borderSvg = '';
        for (let i = 0; i < numRings; i++) {
            borderSvg += `<circle cx="20" cy="20" r="${18 - (i * ringWidth) - (ringWidth / 2)}" fill="none" stroke="${borderColors[i]}" stroke-width="${ringWidth}"/>`;
        }
        borderSvg += `<circle cx="20" cy="20" r="${contentRadius}" fill="#343a40" stroke="none"/>`;
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 48 48" width="48" height="48">
        ${borderSvg}
        ${centerContent}
        ${countBadge}
      </svg>`;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(48, 48),
        anchor: new google.maps.Point(24, 24),
    };
};

const createHazardIcon = (type: string) => {
    const iconPath = HAZARD_ICONS[type] || HAZARD_ICONS['Other'];
    const color = HAZARD_COLORS[type] || HAZARD_COLORS['Other'];
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 44 44" width="44" height="44">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" x="8" y="8" width="24" height="24">
            ${iconPath}
        </svg>
    </svg>`;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(44, 44),
        anchor: new google.maps.Point(22, 44),
    };
};

const createInfrastructureIcon = (type: string) => {
    const iconData = INFRASTRUCTURE_ICONS[type];
    if (!iconData) return null;

    let innerContent = '';
    let fillColor = iconData.color;
    let strokeColor = "#FFFFFF";

    if (iconData.isLogo) {
        fillColor = "#FFFFFF";
        strokeColor = "#5B6771";
        innerContent = `<g transform="translate(3, 3) scale(0.55)">
            <path d="M30.9005 9.38449L21.1916 0.0426025L0 20.5229L9.98898 30.2241L0 39.9253L21.1916 60.3158C21.3783 60.1361 22.0318 59.5073 22.872 58.6989C24.8324 56.9024 28.1932 53.7585 29.9669 50.9739C30.8071 49.5366 31.3673 47.1113 31.2739 45.4945C30.9938 37.9491 22.7786 33.9968 28.66 27.17C33.9812 21.4212 36.2217 14.8639 30.9005 9.38449Z" fill="#5B6771"/>
            <path d="M52.5591 30.2241L62.5481 20.5229L41.3565 0.0426025L35.0084 6.15076C30.8074 10.5522 43.4103 13.9656 33.4213 27.6191C30.2473 32.0206 34.635 35.434 37.0622 39.6558C39.3961 43.6081 39.116 47.83 37.529 51.8721C36.7821 54.0279 37.7157 56.9024 41.2632 60.2259L62.5481 39.7456L52.5591 30.2241Z" fill="#C32033"/>
        </g>`;
    } else {
        innerContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" x="8" y="8" width="24" height="24">${iconData.icon}</svg>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 44 44" width="44" height="44">
        <circle cx="20" cy="20" r="18" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
        ${innerContent}
    </svg>`;

    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(44, 44),
        anchor: new google.maps.Point(22, 44),
    };
};


const MapComponent: React.FC<MapComponentProps> = ({ 
    apiKey, 
    workOrders, 
    hazardMarkers, 
    infrastructureMarkers, 
    mapLayers = [], 
    impactZones = [],
    showPrimaryZones = true,
    showSecondaryZones = true,
    drawingZoneType = null,
    onZoneCreated,
    isAddingHazard, 
    isPlacingWorkOrder, 
    placingInfrastructureType, 
    onApiKeyMissing, 
    onApiLoaded, 
    focusedWorkOrderNumber, 
    onEditWorkOrder, 
    onDeleteWorkOrder,
    onFocusWorkOrder, 
    onMapClickForHazard, 
    onMapClickForWorkOrder, 
    onMapClickForInfrastructure, 
    onDeleteHazard, 
    onEditHazard,
    onDeleteInfrastructure,
    viewConfig,
    siteSurveys = [],
    onOpenSiteSurvey
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<any>(null);
    const infoWindowInstance = useRef<any>(null);
    const [isApiLoaded, setIsApiLoaded] = useState(false);
    const [isMapInitialized, setIsMapInitialized] = useState(false);
    const markersRef = useRef<any[]>([]);
    const hazardMarkersRef = useRef<any[]>([]);
    const infrastructureMarkersRef = useRef<any[]>([]);
    const markerClustererRef = useRef<any>(null);
    const mapClickListenerRef = useRef<any>(null);
    const drawingManagerRef = useRef<any>(null);
    const zonePolygonsRef = useRef<any[]>([]);

    useEffect(() => {
        if (!isMapInitialized) return;

        (window as any).handleCloseInfoWindow = () => {
            if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
        (window as any).handleEditFromMap = (woNumber: string) => {
            if (onEditWorkOrder) onEditWorkOrder(woNumber);
        };
        (window as any).handleDeleteWorkOrder = (woNumber: string) => {
            if (onDeleteWorkOrder) onDeleteWorkOrder(woNumber);
            if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
        (window as any).handleDeleteHazard = (id: string) => {
            if (onDeleteHazard) onDeleteHazard(id);
            if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
        (window as any).handleEditHazard = (id: string) => {
             if (onEditHazard) onEditHazard(id);
             if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
         (window as any).handleDeleteInfrastructure = (id: string) => {
            if (onDeleteInfrastructure) onDeleteInfrastructure(id);
            if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
        (window as any).handleFocusFromMap = (woNumber: string) => {
            if (onFocusWorkOrder) {
                const wo = workOrders.find(w => w.filterData.woNumber === woNumber);
                if (wo) onFocusWorkOrder(wo);
            }
            if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
        (window as any).handleOpenSiteSurvey = (surveyId: string) => {
            if (onOpenSiteSurvey) onOpenSiteSurvey(surveyId);
            if (infoWindowInstance.current) infoWindowInstance.current.close();
        };
        return () => {
            delete (window as any).handleCloseInfoWindow;
            delete (window as any).handleEditFromMap;
            delete (window as any).handleDeleteWorkOrder;
            delete (window as any).handleDeleteHazard;
            delete (window as any).handleEditHazard;
            delete (window as any).handleDeleteInfrastructure;
            delete (window as any).handleFocusFromMap;
            delete (window as any).handleOpenSiteSurvey;
        };
    }, [isMapInitialized, onEditWorkOrder, onDeleteWorkOrder, onDeleteHazard, onEditHazard, onDeleteInfrastructure, onFocusWorkOrder, workOrders, onOpenSiteSurvey]);

    // Handle View Config Updates (Zoom, Center, MapType)
    useEffect(() => {
        if (!isMapInitialized || !mapInstance.current || !viewConfig) return;
        mapInstance.current.setCenter(viewConfig.center);
        mapInstance.current.setZoom(viewConfig.zoom);
        if (viewConfig.mapTypeId) {
            mapInstance.current.setMapTypeId(viewConfig.mapTypeId);
        }
    }, [viewConfig, isMapInitialized]);


    useEffect(() => {
        if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY") { onApiKeyMissing(); return; }
        if (!(window as any).googleMapsPromise) {
            (window as any).googleMapsPromise = new Promise<void>((resolve, reject) => {
                if ((window as any).google?.maps) return resolve();
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geocoding,geometry,drawing,places`;
                script.async = true;
                script.onload = () => resolve();
                script.onerror = (error) => reject(error);
                document.head.appendChild(script);
            });
        }
        (window as any).googleMapsPromise.then(() => {
            setIsApiLoaded(true);
            onApiLoaded();
        }).catch(() => onApiKeyMissing());
    }, [apiKey, onApiKeyMissing, onApiLoaded]);

    useEffect(() => {
        if (!isApiLoaded || !mapRef.current || mapInstance.current) return;
        const observer = new ResizeObserver(entries => {
            if (entries[0]?.contentRect.width > 0 && !mapInstance.current) {
                mapInstance.current = new google.maps.Map(mapRef.current!, { 
                    center: { lat: 39.8283, lng: -98.5795 }, 
                    zoom: 4, 
                    mapTypeControl: false, 
                    streetViewControl: false, 
                    mapTypeId: 'hybrid', 
                    disableDoubleClickZoom: true,
                    gestureHandling: 'greedy' 
                });
                infoWindowInstance.current = new google.maps.InfoWindow({ content: '', pixelOffset: new google.maps.Size(0, -40) });
                setIsMapInitialized(true);
                observer.disconnect();
            }
        });
        observer.observe(mapRef.current);
        return () => observer.disconnect();
    }, [isApiLoaded]);

    useEffect(() => {
        if (!isMapInitialized || !mapInstance.current) return;

        const isInPlacementMode = isAddingHazard || isPlacingWorkOrder || placingInfrastructureType;

        if (isInPlacementMode) {
            mapInstance.current.setOptions({ draggableCursor: 'crosshair' });
            mapClickListenerRef.current = mapInstance.current.addListener('click', (e: any) => {
                if (isAddingHazard) onMapClickForHazard(e.latLng.lat(), e.latLng.lng());
                else if (isPlacingWorkOrder) onMapClickForWorkOrder(e.latLng.lat(), e.latLng.lng());
                else if (placingInfrastructureType) onMapClickForInfrastructure(e.latLng.lat(), e.latLng.lng());
            });
        } else {
            mapInstance.current.setOptions({ draggableCursor: null });
            if (mapClickListenerRef.current) {
                google.maps.event.removeListener(mapClickListenerRef.current);
                mapClickListenerRef.current = null;
            }
        }
        return () => {
             if (mapClickListenerRef.current) {
                google.maps.event.removeListener(mapClickListenerRef.current);
            }
        };
    }, [isAddingHazard, isPlacingWorkOrder, placingInfrastructureType, isMapInitialized, onMapClickForHazard, onMapClickForWorkOrder, onMapClickForInfrastructure]);

    // --- Drawing Manager for Impact Zones ---
    const currentDrawingTypeRef = useRef(drawingZoneType);
    useEffect(() => { currentDrawingTypeRef.current = drawingZoneType; }, [drawingZoneType]);

    useEffect(() => {
        if (!isMapInitialized || !mapInstance.current) return;

        if (!drawingManagerRef.current) {
             const googleMaps = (window as any).google.maps;
             if (googleMaps.drawing) {
                drawingManagerRef.current = new googleMaps.drawing.DrawingManager({
                    drawingControl: false, // We use custom buttons
                });
                drawingManagerRef.current.setMap(mapInstance.current);

                // Bind event listener once
                googleMaps.event.addListener(drawingManagerRef.current, 'overlaycomplete', (event: any) => {
                    if (event.type === googleMaps.drawing.OverlayType.POLYGON) {
                        const path = event.overlay.getPath().getArray().map((latLng: any) => ({
                            lat: latLng.lat(),
                            lng: latLng.lng()
                        }));
                        
                        // Remove the drawn polygon immediately, we will render it via state
                        event.overlay.setMap(null);

                        // Notify parent
                        if (currentDrawingTypeRef.current && onZoneCreated) {
                            onZoneCreated(currentDrawingTypeRef.current, path);
                        }
                    }
                });
             }
        }
    }, [isMapInitialized, onZoneCreated]);

    // Update Drawing Mode based on props
    useEffect(() => {
        if (!drawingManagerRef.current || !isMapInitialized) return;
        const googleMaps = (window as any).google.maps;
        
        if (drawingZoneType) {
            drawingManagerRef.current.setDrawingMode(googleMaps.drawing.OverlayType.POLYGON);
            const color = drawingZoneType === 'Primary' ? '#FF0000' : '#FFFF00';
            drawingManagerRef.current.setOptions({
                polygonOptions: {
                    fillColor: color,
                    fillOpacity: 0.35,
                    strokeColor: color,
                    strokeWeight: 2,
                    clickable: false,
                    editable: false,
                    zIndex: 1
                }
            });
            mapInstance.current.setOptions({ draggableCursor: 'crosshair' });
        } else {
            drawingManagerRef.current.setDrawingMode(null);
             if (!isAddingHazard && !isPlacingWorkOrder && !placingInfrastructureType) {
                 mapInstance.current.setOptions({ draggableCursor: null });
             }
        }
    }, [drawingZoneType, isMapInitialized, isAddingHazard, isPlacingWorkOrder, placingInfrastructureType]);

    // Render Impact Zones
    useEffect(() => {
        if (!isMapInitialized || !mapInstance.current) return;

        // Clear existing
        zonePolygonsRef.current.forEach(poly => poly.setMap(null));
        zonePolygonsRef.current = [];

        const googleMaps = (window as any).google.maps;

        impactZones.forEach(zone => {
            const isVisible = zone.type === 'Primary' ? showPrimaryZones : showSecondaryZones;
            if (!isVisible) return;

            const color = zone.type === 'Primary' ? '#FF0000' : '#FFFF00';
            const polygon = new googleMaps.Polygon({
                paths: zone.path,
                fillColor: color,
                fillOpacity: 0.35,
                strokeColor: color,
                strokeWeight: 2,
                clickable: false,
                zIndex: 0, // Below markers
                map: mapInstance.current
            });
            zonePolygonsRef.current.push(polygon);
        });

    }, [impactZones, showPrimaryZones, showSecondaryZones, isMapInitialized]);

    // Effect to render imported GeoJSON layers (e.g., county lines)
    useEffect(() => {
        if (!isMapInitialized || !mapInstance.current) return;
        
        // Safer Data Layer Cleanup: Collect then remove to avoid iteration issues
        const featuresToRemove: any[] = [];
        mapInstance.current.data.forEach((feature: any) => {
            featuresToRemove.push(feature);
        });
        featuresToRemove.forEach((feature: any) => mapInstance.current.data.remove(feature));

        if (mapLayers && mapLayers.length > 0) {
            mapLayers.forEach(layer => {
                try {
                    // Deep copy the GeoJSON to modify it safely
                    const geoJsonData = JSON.parse(JSON.stringify(layer.data));
                    
                    // Inject the layer type into the properties of each feature
                    const layerType = layer.type || 'boundary';
                    
                    if (geoJsonData.type === 'FeatureCollection' && geoJsonData.features) {
                        geoJsonData.features.forEach((f: any) => {
                            if (!f.properties) f.properties = {};
                            f.properties.layerType = layerType;
                        });
                    } else if (geoJsonData.type === 'Feature') {
                         if (!geoJsonData.properties) geoJsonData.properties = {};
                         geoJsonData.properties.layerType = layerType;
                    }

                    mapInstance.current.data.addGeoJson(geoJsonData);
                } catch (e) {
                    console.error(`Failed to add GeoJSON layer: ${layer.name}`, e);
                }
            });
            
            // Style the data layer based on property type
            mapInstance.current.data.setStyle((feature: any) => {
                const type = feature.getProperty('layerType');
                const strokeColor = feature.getProperty('strokeColor');
                const strokeWeight = feature.getProperty('strokeWeight');
                const fillColor = feature.getProperty('fillColor');
                const fillOpacity = feature.getProperty('fillOpacity');

                if (type === 'property') {
                    return {
                        fillColor: 'transparent',
                        strokeColor: '#FF9800', // Orange for property boundaries
                        strokeWeight: 3,
                        clickable: false
                    };
                }
                // Custom styles from annotations or default boundary style
                return {
                    fillColor: fillColor || '#2196F3',
                    fillOpacity: fillOpacity !== undefined ? fillOpacity : 0.1,
                    strokeColor: strokeColor || '#2196F3',
                    strokeWeight: strokeWeight || 2,
                    clickable: false 
                };
            });
        }
    }, [mapLayers, isMapInitialized]);

    useEffect(() => {
        if (!isMapInitialized || !mapInstance.current) return;

        // --- Clear and draw work order markers ---
        markersRef.current.forEach(marker => marker.setMap(null));
        markerClustererRef.current?.clearMarkers();
        markersRef.current = [];

        if (workOrders.length > 0) {
            const workOrdersByLocation = new Map<string, ProcessedWorkOrder[]>();
            workOrders.forEach(wo => {
                if (isValidCoordinate(wo.lat, wo.lon)) {
                    const key = `${wo.lat}:${wo.lon}`;
                    if (!workOrdersByLocation.has(key)) workOrdersByLocation.set(key, []);
                    workOrdersByLocation.get(key)!.push(wo);
                }
            });

            const bounds = new google.maps.LatLngBounds();
            const newMarkers: any[] = [];

            workOrdersByLocation.forEach((group, key) => {
                const [latStr, lonStr] = key.split(':');
                const position = { lat: parseFloat(latStr), lng: parseFloat(lonStr) };
                // Double check parsed result just in case
                if (!isValidCoordinate(position.lat, position.lng)) return;

                const marker = new google.maps.Marker({ position, icon: createCombinedIcon(group, group.length), label: undefined }); 
                if (group.length === 1) marker.set('workOrder', group[0]); else marker.set('woGroup', group);
                marker.addListener('click', () => {
                    const currentGroup = marker.get('woGroup') || [marker.get('workOrder')];
                    if (!currentGroup || currentGroup.length === 0) return;
                    const closeButton = `<button onclick="window.handleCloseInfoWindow()" title="Close" style="position: absolute; top: 8px; right: 10px; background: none; border: none; font-size: 1.5rem; color: #ced4da; cursor: pointer; line-height: 1; padding: 0; z-index: 99;">&times;</button>`;
                    let content = `<div class="info-window-content-wrapper" style="position: relative;">` + closeButton;
                     if (currentGroup.length > 1) {
                        content += `<h3 style="padding-right: 25px;">${currentGroup.length} Work Orders at this location</h3><p><strong>Address:</strong> ${currentGroup[0].address}</p><hr class="border-gray-500 my-2">`;
                        currentGroup.forEach((wo: ProcessedWorkOrder) => {
                             // If ID is generated AND work type is Site Survey, show "Site Survey" as label
                             const isSiteSurvey = wo.filterData.isGeneratedWoNumber && wo.filterData.workType === 'Site Survey';
                             const woLabel = isSiteSurvey ? 'Site Survey' : (wo.filterData.isGeneratedWoNumber ? 'Work Order' : `WO #${wo.filterData.woNumber}`);
                             
                            content += `<div class="py-1 border-b border-gray-600 last:border-b-0"><div class="flex justify-between items-center"><p><strong>Team:</strong> ${wo.filterData.strikeTeam}</p><div class="flex gap-1"><button onclick="window.handleEditFromMap('${wo.filterData.woNumber}')" class="bg-gray-600 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-gray-500 self-start">Edit</button><button onclick="window.handleDeleteWorkOrder('${wo.filterData.woNumber}')" class="bg-red-700/80 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-red-600 self-start">Delete</button></div></div><p><strong>${woLabel}:</strong> ${wo.filterData.originalWorkType}</p><p><strong>Status:</strong> ${wo.filterData.status}</p></div>`;
                        });
                        content += `<div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #4f4f4f;"><a href="https://www.google.com/maps/dir/?api=1&destination=${currentGroup[0].lat},${currentGroup[0].lon}" target="_blank" class="text-[#8ab4f8] font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:underline self-start">Navigate Here</a></div>`;
                    } else {
                        const wo = currentGroup[0];
                        const isSiteSurvey = wo.filterData.isGeneratedWoNumber && wo.filterData.workType === 'Site Survey';
                        const title = isSiteSurvey ? 'Site Survey' : (wo.filterData.isGeneratedWoNumber ? 'Work Order' : `Work Order #${wo.filterData.woNumber}`);
                        
                        // Find matching Site Survey if any
                        const matchingSurvey = siteSurveys?.find(s => s.address === wo.address);
                        const surveyButton = matchingSurvey 
                            ? `<button onclick="window.handleOpenSiteSurvey('${matchingSurvey.id}')" class="bg-[#A92128] text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-red-700 self-start">View Site Survey</button>`
                            : '';

                        content += `<h3 style="padding-right: 25px;">${title}</h3><p><strong>Address:</strong> ${wo.address}</p><p><strong>Primary Help Needed:</strong> ${wo.filterData.workType}</p><p><strong>Status:</strong> ${wo.filterData.status}</p><p><strong>Team:</strong> ${wo.filterData.strikeTeam}</p><div style="display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #4f4f4f;"><a href="https://www.google.com/maps/dir/?api=1&destination=${wo.lat},${wo.lon}" target="_blank" class="text-[#8ab4f8] font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:underline self-start">Navigate Here</a>${surveyButton}<button onclick="window.handleEditFromMap('${wo.filterData.woNumber}')" class="bg-gray-600 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-gray-500 self-start">Edit</button><button onclick="window.handleDeleteWorkOrder('${wo.filterData.woNumber}')" class="bg-red-700/80 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-red-600 self-start">Delete</button></div>`;
                    }
                    content += `</div>`;
                    infoWindowInstance.current.setContent(content);
                    infoWindowInstance.current.open({ anchor: marker, map: mapInstance.current });
                });
                newMarkers.push(marker);
                bounds.extend(position);
            });
            markersRef.current = newMarkers;
            const MC = (window as any).markerClusterer?.MarkerClusterer;
            if (MC) markerClustererRef.current = new MC({ map: mapInstance.current, markers: newMarkers }); else newMarkers.forEach(m => m.setMap(mapInstance.current));
            if (!bounds.isEmpty() && !viewConfig) mapInstance.current.fitBounds(bounds); // Only fit bounds if no specific view config is set
        }

        // --- Clear and draw hazard markers ---
        hazardMarkersRef.current.forEach(marker => marker.setMap(null));
        hazardMarkersRef.current = [];
        hazardMarkers.forEach(hazard => {
            if (!isValidCoordinate(hazard.lat, hazard.lon)) return; // Skip invalid coordinates
            const marker = new google.maps.Marker({ position: { lat: hazard.lat, lng: hazard.lon }, map: mapInstance.current, icon: createHazardIcon(hazard.type), zIndex: 1000 });
            marker.addListener('click', () => {
                const closeButton = `<button onclick="window.handleCloseInfoWindow()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 1.5rem; color: #ced4da; cursor: pointer; line-height: 1; padding: 0; z-index: 10;">&times;</button>`;
                const deleteButton = `<button onclick="window.handleDeleteHazard('${hazard.id}')" class="bg-red-700/80 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-red-600 self-start">Delete</button>`;
                const editButton = `<button onclick="window.handleEditHazard('${hazard.id}')" class="bg-gray-600 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-gray-500 self-start">Edit Notes</button>`;
                
                let content = `<div class="info-window-content-wrapper" style="position: relative;">` + closeButton +
                              `<h3 style="padding-right: 25px; color: #FFFFFF;">${hazard.type}</h3>` +
                              (hazard.address ? `<p><strong>Location:</strong> ${hazard.address}</p>` : '') +
                              `<p><strong>Status:</strong> ${hazard.status || 'Active Hazard'}</p>` +
                              (hazard.description ? `<p><strong>Notes:</strong> ${hazard.description}</p>` : '') +
                              `<div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px solid #4f4f4f;">${editButton}${deleteButton}</div>` +
                              `</div>`;
                infoWindowInstance.current.setContent(content);
                infoWindowInstance.current.open({ anchor: marker, map: mapInstance.current });
            });
            hazardMarkersRef.current.push(marker);
        });

        // --- Clear and draw infrastructure markers ---
        infrastructureMarkersRef.current.forEach(marker => marker.setMap(null));
        infrastructureMarkersRef.current = [];
        infrastructureMarkers.forEach(infra => {
            if (!isValidCoordinate(infra.lat, infra.lon)) return; // Skip invalid coordinates
            const marker = new google.maps.Marker({ position: { lat: infra.lat, lng: infra.lon }, map: mapInstance.current, icon: createInfrastructureIcon(infra.type), zIndex: 900 });
            marker.addListener('click', () => {
                const closeButton = `<button onclick="window.handleCloseInfoWindow()" style="position: absolute; top: 5px; right: 10px; background: none; border: none; font-size: 1.5rem; color: #ced4da; cursor: pointer; line-height: 1; padding: 0; z-index: 10;">&times;</button>`;
                const deleteButton = `<button onclick="window.handleDeleteInfrastructure('${infra.id}')" class="bg-red-700/80 text-white font-bold cursor-pointer p-1 px-2 rounded-md text-xs hover:bg-red-600 self-start">Delete</button>`;
                let content = `<div class="info-window-content-wrapper" style="position: relative;">` + closeButton +
                              `<h3 style="padding-right: 25px; color: #FFFFFF;">${infra.name} <span class="text-sm text-gray-400">(${infra.type})</span></h3>` +
                              `<p><strong>Status:</strong> ${infra.status}</p>` +
                              (infra.description ? `<p><strong>Notes:</strong> ${infra.description}</p>` : '') +
                              `<div style="display: flex; justify-content: flex-end; margin-top: 8px; padding-top: 8px; border-top: 1px solid #4f4f4f;">${deleteButton}</div>` +
                              `</div>`;
                infoWindowInstance.current.setContent(content);
                infoWindowInstance.current.open({ anchor: marker, map: mapInstance.current });
            });
            infrastructureMarkersRef.current.push(marker);
        });

    }, [workOrders, hazardMarkers, infrastructureMarkers, isMapInitialized, onDeleteHazard, onDeleteInfrastructure, onEditHazard, viewConfig, siteSurveys]); 

    useEffect(() => {
        if (!focusedWorkOrderNumber || !isMapInitialized || !mapInstance.current || markersRef.current.length === 0) return;
        const targetMarker = markersRef.current.find(m => (m.get('workOrder')?.filterData.woNumber === focusedWorkOrderNumber) || (m.get('woGroup')?.some((wo: ProcessedWorkOrder) => wo.filterData.woNumber === focusedWorkOrderNumber)));
        if (targetMarker) {
            mapInstance.current.setZoom(Math.max(mapInstance.current.getZoom(), 15));
            mapInstance.current.panTo(targetMarker.getPosition());
            setTimeout(() => google.maps.event.trigger(targetMarker, 'click'), 300);
        }
    }, [focusedWorkOrderNumber, isMapInitialized]);

    return <div className="absolute inset-0 w-full h-full"><div ref={mapRef} className="absolute inset-0 w-full h-full" /></div>;
};

export default MapComponent;
