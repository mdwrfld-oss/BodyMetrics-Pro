
import { AppState, MeasurementEntry, Goal, DEFAULT_PARTS } from '../types';

const STORAGE_KEY = 'body_metrics_pro_data';

export const getInitialData = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored data', e);
    }
  }

  // Initial dummy data to make the app look good on first load
  const today = new Date();
  const initialEntries: MeasurementEntry[] = [];
  
  for (let i = 12; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - (i * 2)); // Spread data points
    initialEntries.push({
      id: Math.random().toString(36).substr(2, 9),
      date: date.toISOString().split('T')[0],
      values: {
        Chest: 42 - (i * 0.05),
        Shoulders: 48 - (i * 0.08),
        Arms: 15 + (i * 0.02),
        Waist: 34 + (i * 0.05),
        Thighs: 24 - (i * 0.03),
        Calves: 15.5 - (i * 0.01),
        Weight: 195 - (i * 0.2),
        'Body Fat %': 18 + (i * 0.1)
      }
    });
  }

  const initialGoals: Goal[] = DEFAULT_PARTS.map(part => {
    let target = 44;
    if (part === 'Waist') target = 32;
    if (part === 'Weight') target = 180;
    if (part === 'Body Fat %') target = 12;
    if (part === 'Arms') target = 16.5;
    if (part === 'Calves') target = 16;
    if (part === 'Shoulders') target = 50;
    if (part === 'Thighs') target = 25;
    return { part, target };
  });

  return { entries: initialEntries, goals: initialGoals };
};

export const saveData = (data: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
