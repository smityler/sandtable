
import { RawWorkOrder, ProcessedWorkOrder, ColumnMap, AppMessage } from '../types';
import { FIELD_MAPPINGS, STATIC_WORK_TYPES } from '../constants';

declare const Papa: any;
declare const XLSX: any;
declare const google: any;

const parseFile = async (
    fileName: string,
    content: ArrayBuffer | string,
    onProgress: (message: string, type?: AppMessage['type']) => void
): Promise<RawWorkOrder[]> => {
    try {
        if (fileName.toLowerCase().endsWith('.xlsx')) {
            const data = content as ArrayBuffer;
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetNames = workbook.SheetNames;
            
            let bestSheet = {
                name: '',
                score: -1,
                rowCount: 0,
                jsonData: [] as RawWorkOrder[],
                columnMap: {} as ColumnMap
            };

            const allMappableKeys = Object.keys(FIELD_MAPPINGS);

            for (const sheetName of sheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                if (!worksheet) continue;

                const jsonData: RawWorkOrder[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
                if (!jsonData || jsonData.length === 0) continue;

                const headers = Object.keys(jsonData[0]);
                const columnMap = findColumnHeaders(headers);
                
                // Relaxed Validation:
                // We accept the sheet if it has ANY location data (Address, City, Zip, or Lat/Lon)
                const hasLocationData = !!columnMap['address'] || !!columnMap['city'] || !!columnMap['zip'] || (!!columnMap['lat'] && !!columnMap['lon']);
                
                if (!hasLocationData) {
                    continue; 
                }

                let currentScore = 0;
                for (const key of allMappableKeys) {
                    if (columnMap[key as keyof ColumnMap]) {
                        if (['wo_number', 'address'].includes(key)) {
                            currentScore += 3;
                        } else if (['lat', 'lon', 'zip', 'city', 'state'].includes(key)) {
                            currentScore += 2;
                        } else {
                            currentScore += 1;
                        }
                    }
                }
                
                if (currentScore > bestSheet.score) {
                    bestSheet = { name: sheetName, score: currentScore, rowCount: jsonData.length, jsonData, columnMap };
                } else if (currentScore === bestSheet.score && jsonData.length > bestSheet.rowCount) {
                    bestSheet = { name: sheetName, score: currentScore, rowCount: jsonData.length, jsonData, columnMap };
                }
            }

            if (bestSheet.score === -1) {
                throw new Error("No valid data found. The file must contain at least one location column (Address, City, Zip, or Lat/Long).");
            }

            onProgress(`Using data from sheet: '${bestSheet.name}'. Processing ${bestSheet.rowCount} rows...`, 'info');

            const normalizedData = bestSheet.jsonData.map(row => {
                const newRow: RawWorkOrder = { ...row }; // Preserve unmapped columns
                for (const key of Object.keys(FIELD_MAPPINGS)) {
                    const internalKey = key as keyof ColumnMap;
                    const userFacingHeader = bestSheet.columnMap[internalKey];
                    if (userFacingHeader && row[userFacingHeader] !== undefined) {
                        newRow[internalKey] = row[userFacingHeader];
                    }
                }
                return newRow;
            });

            return normalizedData.filter(obj => 
                obj != null && Object.values(obj).some(val => val != null && String(val).trim() !== '')
            );

        } else { // CSV
            const text = content as string;
            return new Promise((resolve, reject) => {
                Papa.parse(text, {
                    header: true,
                    skipEmptyLines: 'greedy',
                    complete: (results: any) => {
                        if (results.errors && results.errors.length > 0) {
                            return reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
                        }
                        if (!results.data || results.data.length === 0) {
                            return reject(new Error("CSV file is empty or invalid."));
                        }
                        resolve(results.data);
                    },
                    error: (error: any) => reject(new Error(`CSV parsing failed: ${error.message}`)),
                });
            });
        }
    } catch (error) {
        console.error("File processing error:", error);
        throw error instanceof Error ? error : new Error("An unexpected error occurred during file processing.");
    }
};

const geocodeCache = new Map<string, { lat: number; lng: number }>();

const geocodeAddress = (geocoder: any, address: string): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
        if (geocodeCache.has(address)) {
            return resolve(geocodeCache.get(address)!);
        }

        let attempts = 0;
        const attemptGeocode = () => {
            geocoder.geocode({ 
                address,
                componentRestrictions: { country: 'US' } // RESTRICT TO US
            }, (results: any, status: any) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location.toJSON();
                    geocodeCache.set(address, location);
                    resolve(location);
                } else if (status === 'OVER_QUERY_LIMIT' && attempts < 3) {
                    attempts++;
                    setTimeout(() => attemptGeocode(), 500 * Math.pow(2, attempts));
                } else {
                    reject(new Error(`Geocoding failed for "${address}": ${status}`));
                }
            });
        };
        attemptGeocode();
    });
};

export const reverseGeocode = (geocoder: any, lat: number, lon: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        geocoder.geocode({ location: { lat, lng: lon } }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
                resolve(results[0].formatted_address);
            } else {
                reject(new Error(`Reverse geocoding failed: ${status}`));
            }
        });
    });
};

export const findColumnHeaders = (headers: string[]): ColumnMap => {
    const mapping: ColumnMap = {};
    const lowerCaseHeaders = headers.map(h => (h ? h.toLowerCase().trim() : ''));
    const usedHeaderIndices = new Set<number>();

    // Pass 1: Strict Mapping from Constants
    for (const key in FIELD_MAPPINGS) {
        // We rely on the order defined in FIELD_MAPPINGS constant.
        const variants = (FIELD_MAPPINGS as any)[key];
        
        for (const variant of variants) {
            let foundMatch = false;
            for (let i = 0; i < lowerCaseHeaders.length; i++) {
                if (usedHeaderIndices.has(i)) {
                    continue; 
                }
                
                if (lowerCaseHeaders[i] === variant || lowerCaseHeaders[i].includes(variant)) {
                    (mapping as any)[key] = headers[i];
                    usedHeaderIndices.add(i);
                    foundMatch = true;
                    break;
                }
            }
            if (foundMatch) {
                break;
            }
        }
    }

    // Pass 2: Fuzzy Fallback for Address if missing
    if (!mapping.address) {
        for (let i = 0; i < lowerCaseHeaders.length; i++) {
            if (usedHeaderIndices.has(i)) continue;
            const h = lowerCaseHeaders[i];
            // Look for common address keywords
            if (h.includes('addr') || h.includes('street') || h.includes('location') || h.includes('site') || h.includes('place')) {
                mapping.address = headers[i];
                usedHeaderIndices.add(i);
                break;
            }
        }
    }

    return mapping;
};

export const getStatusCategory = (status: string): string => {
    const s = (status || '').toLowerCase();
    if (s.includes('complete') || s.includes('closed')) return 'Completed';
    if (s.includes('cancel')) return 'Canceled';
    if (s.includes('hold')) return 'On Hold';
    if (s.includes('unscheduled')) return 'Unscheduled';
    if (!s || s.trim().length === 0 || s === 'unknown') return 'Unscheduled';
    return 'Active';
};

export const getWorkTypeCategory = (workTypeRaw: string): string => {
    const workTypeLower = (workTypeRaw || '').toLowerCase();
    for (const type of STATIC_WORK_TYPES) {
        if (workTypeLower.includes(type.toLowerCase().split(' ')[0])) {
            return type;
        }
    }
    // Special case for hyphens if not caught above
    if (workTypeLower.includes('muck-out')) return 'Muck Out';
    
    return 'Other';
};

export const processAndGeocodeFile = async (
    fileName: string,
    content: ArrayBuffer | string,
    allTeams: string[],
    onProgress: (message: string, type?: AppMessage['type']) => void
): Promise<{
    located: ProcessedWorkOrder[],
    unlocated: ProcessedWorkOrder[],
    parsedCount: number,
}> => {
    onProgress('Parsing file...', 'info');
    let rawData = await parseFile(fileName, content, onProgress);
    const parsedCount = rawData.length;

    if (parsedCount === 0) {
        throw new Error("No valid data rows found in the file.");
    }

    // Infer Site Survey file context - Broadened check
    const fileNameLower = fileName.toLowerCase();
    const isSiteSurveyFile = fileNameLower.includes('site survey') || fileNameLower.includes('sitesurvey') || fileNameLower.includes('survey');

    onProgress('Processing data...', 'info');
    
    const processedData: ProcessedWorkOrder[] = rawData.map((row, index) => {
        const addr1 = String(row['address'] || '').trim();
        const addr2 = String(row['address2'] || '').trim();
        const city = String(row['city'] || '').trim();
        const state = String(row['state'] || '').trim();
        const zip = String(row['zip'] || '').trim();
        
        const addressParts = [addr1, addr2, city, state, zip].filter(part => part && part !== '');
        const fullAddress = addressParts.join(', ');

        const originalStatus = String(row['status'] || 'Unknown');
        const originalWorkType = String(row['work_type'] || 'Unspecified');
        const contactName = String(row['contact_name'] || '').trim();
        const contactPhone = String(row['contact_phone'] || '').trim();
        
        let woNumber = String(row['wo_number'] || '');
        let isGeneratedWoNumber = false;
        
        if (!woNumber) {
            const potentialId = row['id'] || row['key'] || row['ticket'] || row['reference'];
            woNumber = potentialId ? String(potentialId) : `GEN-${Date.now()}-${index + 1}`;
            isGeneratedWoNumber = true;
        }
        
        // Determine Work Type
        let workType = 'Other';
        
        if (isSiteSurveyFile) {
            // If it's a site survey file, force the categorization to Site Survey.
            // This ensures correct labeling and icon usage in the UI, treating the task
            // fundamentally as a site survey regardless of the specific work details found in columns.
            workType = 'Site Survey';
        } else {
            if (originalWorkType !== 'Unspecified' && originalWorkType !== '') {
                 workType = getWorkTypeCategory(originalWorkType);
            } else {
                 // Fallback: Scan all columns for keywords
                 const allValues = Object.values(row).join(' ').toLowerCase();
                 workType = getWorkTypeCategory(allValues);
            }
        }

        let strikeTeam = 'Unassigned';
        const teamValue = row['strike_team'] ? String(row['strike_team'] || '') : '';
        if (teamValue) {
             const foundTeam = allTeams.find(team => new RegExp(`\\b${team}\\b`, 'i').test(teamValue));
             if (foundTeam) strikeTeam = foundTeam;
        }
        
        // Parse coordinates from file
        const fileLat = parseFloat(String(row['lat']));
        const fileLon = parseFloat(String(row['lon']));
        const hasFileCoords = !isNaN(fileLat) && !isNaN(fileLon);

        // Gather extra columns into notes
        let notes = row['notes'] ? String(row['notes']) : '';
        const standardKeys = ['address', 'address2', 'city', 'state', 'zip', 'lat', 'lon', 'status', 'work_type', 'wo_number', 'strike_team', 'notes', 'contact_name', 'contact_phone'];
        
        const extraData: string[] = [];
        Object.keys(row).forEach(key => {
            if (!standardKeys.includes(key)) {
                const val = row[key];
                if (val && String(val).trim() !== '') {
                   extraData.push(`${key}: ${val}`);
                }
            }
        });
        
        if (extraData.length > 0) {
            notes = notes ? `${notes}\n\n${extraData.join('\n')}` : extraData.join('\n');
        }
        
        // Prioritize Address Geocoding:
        // If we have a good address, we pretend we don't have coords initially.
        // This ensures we add it to the 'toGeocode' list.
        // If we don't have an address, we fallback to file coords immediately.
        let initialLat = hasFileCoords ? fileLat : undefined;
        let initialLon = hasFileCoords ? fileLon : undefined;
        
        if (fullAddress && fullAddress.length > 5) {
             initialLat = undefined;
             initialLon = undefined;
        }

        return {
            lat: initialLat,
            lon: initialLon,
            fileLat: hasFileCoords ? fileLat : undefined,
            fileLon: hasFileCoords ? fileLon : undefined,
            address: fullAddress,
            filterData: {
                woNumber: woNumber,
                workType: workType,
                originalWorkType: originalWorkType,
                status: getStatusCategory(originalStatus),
                strikeTeam: strikeTeam,
                fullAddress: fullAddress,
                originalStatus: originalStatus,
                notes: notes,
                lastContacted: undefined,
                isGeneratedWoNumber: isGeneratedWoNumber,
                contactName: contactName,
                contactPhone: contactPhone
            },
            originalRow: row
        };
    });

    onProgress('Geocoding addresses...', 'info');
    const geocoder = new google.maps.Geocoder();
    
    // Geocode any item that has an address, even if it technically has file coords
    // because we cleared the main 'lat'/'lon' above for those items.
    const toGeocode = processedData.filter(wo => wo.address && wo.address.length > 5 && (wo.lat === undefined || wo.lon === undefined));
    
    // Items that had NO address but DID have file coords are already "located"
    const alreadyLocated = processedData.filter(wo => 
        wo.lat !== undefined && wo.lon !== undefined
    );

    let geocodedCount = 0;
    const totalToGeocode = toGeocode.length;
    
    const geocodePromises = toGeocode.map(wo => 
        geocodeAddress(geocoder, wo.address)
            .then(location => {
                geocodedCount++;
                onProgress(`Geocoding ${geocodedCount} of ${totalToGeocode}...`, 'info');
                return { ...wo, lat: location.lat, lon: location.lng };
            })
            .catch(error => {
                geocodedCount++;
                onProgress(`Geocoding ${geocodedCount} of ${totalToGeocode}...`, 'info');
                console.warn(`Geocoding failed for ${wo.address}, falling back to file coords if available.`, error);
                
                // FALLBACK: If geocoding fails but we had file coordinates, use them now.
                if (wo.fileLat !== undefined && wo.fileLon !== undefined) {
                    return { ...wo, lat: wo.fileLat, lon: wo.fileLon };
                }
                return wo;
            })
    );

    const settledResults = await Promise.allSettled(geocodePromises);

    const located: ProcessedWorkOrder[] = [...alreadyLocated];
    const unlocated: ProcessedWorkOrder[] = [];

    settledResults.forEach(result => {
        if (result.status === 'fulfilled') {
            const wo = result.value;
            if (wo.lat && wo.lon && !isNaN(wo.lat) && !isNaN(wo.lon)) {
                located.push(wo);
            } else {
                unlocated.push(wo);
            }
        } else {
            console.error("A geocoding promise was rejected unexpectedly:", result.reason);
        }
    });
    
    const finalLocated = located.filter(wo => wo.lat && wo.lon && !isNaN(wo.lat) && !isNaN(wo.lon));
    const finalUnlocated = [...unlocated, ...processedData.filter(wo => 
        !finalLocated.includes(wo) && !toGeocode.includes(wo) && !alreadyLocated.includes(wo)
    )];

    return { located: finalLocated, unlocated: finalUnlocated, parsedCount };
};

export const geocodeSingleWorkOrder = async (workOrder: ProcessedWorkOrder): Promise<ProcessedWorkOrder | null> => {
    if (!workOrder.address) return null;
    const geocoder = new google.maps.Geocoder();
    try {
        const location = await geocodeAddress(geocoder, workOrder.address);
        return { ...workOrder, lat: location.lat, lon: location.lng };
    } catch (error) {
        console.error("Single geocode failed:", error);
        return null;
    }
};

export const geocodeSingleAddress = async (address: string): Promise<{ lat: number, lon: number } | null> => {
    if (!address) return null;
    const geocoder = new google.maps.Geocoder();
    try {
        const location = await geocodeAddress(geocoder, address);
        return { lat: location.lat, lon: location.lng };
    } catch (error) {
        console.error(`Geocoding failed for address: ${address}`, error);
        return null;
    }
};
