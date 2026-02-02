
export type BodyPart = 'Chest' | 'Shoulders' | 'Arms' | 'Waist' | 'Thighs' | 'Calves' | 'Weight' | 'Body Fat %';

export interface MeasurementEntry {
  id: string;
  date: string; // ISO string or YYYY-MM-DD
  values: Record<string, number>; // Part name -> Value
}

export interface Goal {
  part: string;
  target: number;
}

export interface AppState {
  entries: MeasurementEntry[];
  goals: Goal[];
}

export const MAIN_CHART_PARTS: BodyPart[] = ['Chest', 'Shoulders', 'Arms', 'Waist', 'Thighs', 'Calves'];
export const SECONDARY_CHART_PARTS: BodyPart[] = ['Weight', 'Body Fat %'];
// Reordered to swap 'Waist' (index 3) and 'Weight' (index 6) for display purposes
export const DEFAULT_PARTS: BodyPart[] = [
  'Chest', 
  'Shoulders', 
  'Arms', 
  'Weight', 
  'Thighs', 
  'Calves', 
  'Waist', 
  'Body Fat %'
];

export const PART_COLORS: Record<string, string> = {
  Chest: '#ff0000',        // Red
  Shoulders: '#ffff00',    // Yellow
  Arms: '#ff7b00',         // Orange
  Waist: '#00ff00',        // Green
  Thighs: '#00a2ff',       // Blue
  Calves: '#af00ff',       // Violet
  Weight: '#ced4da',       // Light Grey
  'Body Fat %': '#ced4da'  // Light Grey
};
