
export type RawWorkOrder = Record<string, any>;

export interface FilterData {
  woNumber: string;
  workType: string;
  originalWorkType: string;
  status: string;
  strikeTeam: string;
  fullAddress: string;
  originalStatus: string;
  notes?: string;
  lastContacted?: {
    date: string;
    result: string;
    otherResult?: string;
  };
  isGeneratedWoNumber?: boolean;
  contactName?: string;
  contactPhone?: string;
}

export interface ProcessedWorkOrder {
  lat?: number;
  lon?: number;
  fileLat?: number;
  fileLon?: number;
  address: string;
  filterData: FilterData;
  originalRow: RawWorkOrder;
}

export interface HazardMarker {
  id: string;
  lat: number;
  lon: number;
  type: string;
  description: string;
  address?: string;
  status?: string;
}

export type InfrastructureType = 'FOB' | 'Airport' | 'Hospital' | 'Fire Station' | 'Police Department' | 'Disaster Incident';
export type InfrastructureStatus = 'Operational' | 'Damaged' | 'Closed';

export interface InfrastructureMarker {
  id: string;
  lat: number;
  lon: number;
  type: InfrastructureType;
  name: string;
  description: string;
  status: InfrastructureStatus;
}

export interface ImpactZone {
    id: string;
    type: 'Primary' | 'Secondary';
    path: { lat: number; lng: number }[];
}

export interface MapLayer {
    id: string;
    name: string;
    data: any; // GeoJSON object
    type?: 'boundary' | 'property';
}

export interface MapAnnotation {
    type: 'polygon' | 'line' | 'marker';
    path?: { lat: number; lng: number }[]; // For polygons and lines
    position?: { lat: number; lng: number }; // For markers
    color?: string;
    notes?: string;
}

export interface SiteSurvey {
    id: string;
    address: string;
    status: string;
    data: any;
    lastUpdated?: string;
}

export interface ColumnMap {
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: string;
  lon?: string;
  work_type?: string;
  status?: string;
  wo_number?: string;
  strike_team?: string;
}

export interface AppMessage {
    text: string;
    type: 'success' | 'error' | 'info' | 'warning';
}
