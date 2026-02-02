
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AppState, 
  MeasurementEntry, 
  Goal, 
  DEFAULT_PARTS, 
  MAIN_CHART_PARTS,
  SECONDARY_CHART_PARTS,
  PART_COLORS 
} from './types';
import { getInitialData, saveData } from './services/dataService';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';

// --- Utils ---

/**
 * Interpolates between a base hex color and white based on proximity to goal.
 * @param baseHex The starting color
 * @param current The current value
 * @param goal The target value
 * @returns An rgb string
 */
const getDynamicColor = (baseHex: string, current: number, goal: number): string => {
  const diff = Math.abs(current - goal);
  // Keep saturated longer: use a smaller range for the transition to white
  const range = Math.max(goal * 0.1, 0.5); 
  const progress = Math.max(0, 1 - (diff / range));
  
  const r1 = parseInt(baseHex.slice(1, 3), 16);
  const g1 = parseInt(baseHex.slice(3, 5), 16);
  const b1 = parseInt(baseHex.slice(5, 7), 16);

  const r = Math.round(r1 + (255 - r1) * progress);
  const g = Math.round(g1 + (255 - g1) * progress);
  const b = Math.round(b1 + (255 - b1) * progress);

  return `rgb(${r}, ${g}, ${b})`;
};

// --- Subcomponents ---

const Header: React.FC = () => (
  <header className="py-8 px-6 border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-purple-500 animate-pulse flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tighter text-white uppercase italic">
          BodyMetrics <span className="text-cyan-400">Pro</span>
        </h1>
      </div>
      <div className="text-xs font-mono text-cyan-400 hidden sm:block">
        STATUS: BIOMETRIC_FEED_ACTIVE // SYNC_OK
      </div>
    </div>
  </header>
);

const MetricCard: React.FC<{ 
  part: string; 
  value: number; 
  goal: number; 
  color: string;
  isEditing?: boolean;
  onValueChange?: (val: number) => void;
}> = ({ part, value, goal, color, isEditing, onValueChange }) => {
  const displayProgress = Math.min(Math.round((value / goal) * 100), 100);
  const isClosing = Math.abs(value - goal) < 0.5;
  const unit = part === 'Weight' ? 'LBS' : part === 'Body Fat %' ? '%' : 'IN';
  
  // Dynamic color based on goal proximity
  const dynamicColor = getDynamicColor(color, value, goal);

  // Calculate units left until goal
  const diffToGoal = Math.abs(goal - value);
  const unitSuffix = unit === 'IN' ? '"' : unit;
  const diffLabel = diffToGoal <= 0.05 ? "MET" : `${diffToGoal.toFixed(1)}${unitSuffix}`;

  return (
    <div 
      className={`glass-panel p-5 rounded-2xl relative overflow-hidden group transition-all border-t-2 ${isEditing ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'}`}
      style={{ borderTopColor: color }}
    >
      <div 
        className="absolute top-0 left-0 w-full h-full opacity-[0.03] group-hover:opacity-[0.07] transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle at top right, ${color}, transparent)` }}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <span className="text-[11px] font-bold font-mono uppercase tracking-widest" style={{ color: color }}>{part}</span>
          {!isEditing && isClosing && <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/30 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.2)]">OPTIMAL</span>}
          {isEditing && <span className="text-[8px] bg-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded-sm font-mono animate-pulse">EDITING</span>}
        </div>
        
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col flex-1">
            <span className="text-[8px] font-mono text-gray-500 uppercase mb-0.5">Actual</span>
            <div className="flex items-baseline gap-1">
              {isEditing ? (
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-white/10 border-b border-white/30 text-xl font-black text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  value={value}
                  onChange={(e) => onValueChange?.(parseFloat(e.target.value) || 0)}
                  autoFocus
                />
              ) : (
                <span className="text-2xl font-black text-white tracking-tight">{value.toFixed(1)}</span>
              )}
              <span className="text-[9px] text-gray-500 font-mono uppercase">{unit === 'IN' ? '"' : unit}</span>
            </div>
          </div>
          {!isEditing && (
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-gray-500 uppercase mb-0.5">Goal</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white/30 tracking-tight">{goal.toFixed(1)}</span>
                <span className="text-[9px] text-gray-600 font-mono uppercase">{unit === 'IN' ? '"' : unit}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-end text-[10px] font-bold font-mono mb-1 uppercase" style={{ color: dynamicColor }}>
            <span>{diffLabel}</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-1000 ease-out rounded-full"
              style={{ 
                width: `${displayProgress}%`, 
                backgroundColor: dynamicColor, 
                boxShadow: `0 0 15px ${dynamicColor}` 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader: React.FC<{ 
  title: string; 
  subtitle?: string;
  action?: React.ReactNode;
}> = ({ title, subtitle, action }) => (
  <div className="mb-6 border-l-4 border-cyan-400 pl-4 flex justify-between items-start">
    <div>
      <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
      {subtitle && <p className="text-[11px] text-gray-500 font-mono uppercase tracking-widest mt-1 opacity-70">{subtitle}</p>}
    </div>
    {action && <div className="flex gap-4 items-center">{action}</div>}
  </div>
);

const ZoomButton: React.FC<{
  isZoomedOut: boolean;
  onToggle: () => void;
}> = ({ isZoomedOut, onToggle }) => (
  <button
    onClick={onToggle}
    className="flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all active:scale-95"
  >
    <svg className={`w-3 h-3 transition-transform duration-300 ${isZoomedOut ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m4-3H6" />
    </svg>
    {isZoomedOut ? 'Focus View' : 'All Time'}
  </button>
);

// --- Main App Component ---

const App: React.FC = () => {
  const [data, setData] = useState<AppState>(getInitialData());
  const [selectedParts, setSelectedParts] = useState<string[]>(['Waist', 'Chest', 'Shoulders']);
  const [isAdding, setIsAdding] = useState(false);
  const [newEntry, setNewEntry] = useState<Record<string, string>>({});
  
  // Dashboard Snapshot Edit state
  const [isEditingLatest, setIsEditingLatest] = useState(false);
  const [editedLatestValues, setEditedLatestValues] = useState<Record<string, number>>({});

  // Chart zoom states
  const [zoomMain, setZoomMain] = useState(false);
  const [zoomWeight, setZoomWeight] = useState(false);
  const [zoomBF, setZoomBF] = useState(false);
  
  // Local state for goals being edited
  const [tempGoals, setTempGoals] = useState<Record<string, number>>({});

  useEffect(() => {
    saveData(data);
    // Sync local temp goals
    const goalsMap: Record<string, number> = {};
    data.goals.forEach(g => goalsMap[g.part] = g.target);
    setTempGoals(goalsMap);

    // Sync edited latest values when data changes (and we aren't editing)
    if (!isEditingLatest && data.entries.length > 0) {
      setEditedLatestValues({ ...data.entries[data.entries.length - 1].values });
    }
  }, [data.entries, data.goals]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const values: Record<string, number> = {};
    DEFAULT_PARTS.forEach(part => {
      values[part] = parseFloat(newEntry[part]) || (data.entries[data.entries.length - 1]?.values[part] ?? 0);
    });

    const entry: MeasurementEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      values
    };

    setData(prev => ({
      ...prev,
      entries: [...prev.entries, entry].sort((a, b) => a.date.localeCompare(b.date))
    }));
    setIsAdding(false);
    setNewEntry({});
  };

  const handleSaveLatest = () => {
    setData(prev => {
      const entries = [...prev.entries];
      if (entries.length > 0) {
        entries[entries.length - 1] = {
          ...entries[entries.length - 1],
          values: { ...editedLatestValues }
        };
      }
      return { ...prev, entries };
    });
    setIsEditingLatest(false);
  };

  const handleSaveGoals = () => {
    setData(prev => ({
      ...prev,
      goals: prev.goals.map(g => ({
        ...g,
        target: tempGoals[g.part] ?? g.target
      }))
    }));
  };

  const latestEntry = data.entries[data.entries.length - 1];

  // Helper to get goal for a part
  const getGoalFor = (part: string) => data.goals.find(g => g.part === part)?.target || 0;

  // Chart Data Filtering logic
  const mainChartData = useMemo(() => zoomMain ? data.entries : data.entries.slice(-13), [data.entries, zoomMain]);
  const weightChartData = useMemo(() => zoomWeight ? data.entries : data.entries.slice(-13), [data.entries, zoomWeight]);
  const bfChartData = useMemo(() => zoomBF ? data.entries : data.entries.slice(-13), [data.entries, zoomBF]);

  // Generate dynamic gradients for each line
  const lineGradients = useMemo(() => {
    return DEFAULT_PARTS.map(part => {
      const goal = getGoalFor(part);
      const baseColor = PART_COLORS[part];
      const stops = data.entries.map((entry, idx) => {
        const value = entry.values[part] || 0;
        const color = getDynamicColor(baseColor, value, goal);
        const offset = `${(idx / (data.entries.length - 1 || 1)) * 100}%`;
        return <stop key={`${part}-${idx}`} offset={offset} stopColor={color} />;
      });
      return (
        <linearGradient key={`line-grad-${part}`} id={`line-grad-${part}`} x1="0" y1="0" x2="1" y2="0">
          {stops}
        </linearGradient>
      );
    });
  }, [data.entries, data.goals]);

  // Compute dynamic Y-axis domain
  const yDomain = useMemo(() => {
    if (selectedParts.length === 0 || mainChartData.length === 0) return ['auto', 'auto'];
    
    const allRelevantValues: number[] = [];
    selectedParts.forEach(part => {
      mainChartData.forEach(entry => {
        if (entry.values[part] !== undefined) {
          allRelevantValues.push(entry.values[part]);
        }
      });
      allRelevantValues.push(getGoalFor(part));
    });

    if (allRelevantValues.length === 0) return ['auto', 'auto'];

    const min = Math.min(...allRelevantValues);
    const max = Math.max(...allRelevantValues);
    const padding = (max - min) * 0.15 || 2;
    
    return [min - padding, max + padding];
  }, [mainChartData, data.goals, selectedParts]);

  return (
    <div className="min-h-screen pb-20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Dashboard Grid Header */}
        <SectionHeader 
          title="Biometric Snapshot" 
          subtitle={`REAL-TIME FEED // LATEST SYNC: ${latestEntry?.date || 'N/A'}`} 
          action={
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (isEditingLatest) handleSaveLatest();
                  else setIsEditingLatest(true);
                }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono uppercase transition-all flex items-center gap-2 border-2 ${
                  isEditingLatest 
                    ? 'bg-cyan-400 border-cyan-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]' 
                    : 'bg-white/5 border-white/10 text-white hover:border-white/40'
                }`}
              >
                {isEditingLatest ? (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Snapshot
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Sync Current
                  </>
                )}
              </button>
              {isEditingLatest && (
                <button
                  onClick={() => setIsEditingLatest(false)}
                  className="px-4 py-1.5 rounded-full text-[10px] font-bold font-mono uppercase border-2 border-white/10 text-gray-500 hover:text-white hover:border-white/30 transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          }
        />

        {/* Dashboard Grid */}
        <div className="relative mb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {DEFAULT_PARTS.map(part => {
              const goal = getGoalFor(part);
              const current = isEditingLatest 
                ? (editedLatestValues[part] || 0) 
                : (latestEntry?.values[part] || 0);
              return (
                <MetricCard 
                  key={part} 
                  part={part} 
                  value={current} 
                  goal={goal} 
                  color={PART_COLORS[part]}
                  isEditing={isEditingLatest}
                  onValueChange={(val) => setEditedLatestValues(prev => ({ ...prev, [part]: val }))}
                />
              );
            })}
          </div>
          
          <div className="hidden md:block absolute h-full w-[2px] bg-white shadow-[0_0_15px_rgba(255,255,255,0.4)] left-[75%] -translate-x-1/2 top-0 pointer-events-none rounded-full z-10 opacity-60" />
        </div>

        {/* Primary Chart Section */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row justify-between items-end gap-4 mb-8">
            <SectionHeader 
              title="Metric Projection" 
              subtitle="DYNAMIC COLOR SYNTHESIS // WHITE = TARGET ACQUIRED" 
              action={<ZoomButton isZoomedOut={zoomMain} onToggle={() => setZoomMain(!zoomMain)} />}
            />
            <div className="flex flex-wrap gap-2">
              {MAIN_CHART_PARTS.map(part => (
                <button
                  key={part}
                  onClick={() => setSelectedParts(prev => 
                    prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
                  )}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold font-mono uppercase transition-all border-2 ${
                    selectedParts.includes(part) 
                      ? 'bg-white/10 text-white' 
                      : 'bg-transparent border-white/5 text-gray-600 hover:border-white/20'
                  }`}
                  style={{ borderColor: selectedParts.includes(part) ? PART_COLORS[part] : '' }}
                >
                  {part}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel p-8 rounded-3xl h-[500px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mainChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  {lineGradients}
                </defs>
                <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                  fontFamily="JetBrains Mono"
                  dy={10}
                />
                <YAxis 
                  stroke="rgba(255,255,255,0.3)" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono"
                  domain={yDomain}
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(5, 5, 10, 0.95)', 
                    border: '2px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                  }} 
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                  formatter={(value: any, name: string) => [
                    `${parseFloat(value).toFixed(1)}"`, 
                    name.toUpperCase()
                  ]}
                />
                <Legend 
                  iconType="rect" 
                  wrapperStyle={{ paddingTop: '30px', fontSize: '11px', fontWeight: 'bold', fontFamily: 'JetBrains Mono' }} 
                />
                
                {selectedParts.map(part => (
                  <ReferenceLine 
                    key={`goal-${part}`}
                    y={getGoalFor(part)} 
                    stroke={PART_COLORS[part]} 
                    strokeOpacity={0.4}
                    strokeDasharray="5 5" 
                    label={{ 
                      position: 'insideRight', 
                      value: `GOAL: ${getGoalFor(part)}"`, 
                      fill: PART_COLORS[part], 
                      fontSize: 10,
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 'bold',
                      opacity: 0.8,
                      dy: -10
                    }} 
                  />
                ))}

                {selectedParts.map(part => (
                  <Line
                    key={part}
                    type="monotone"
                    dataKey={`values.${part}`}
                    name={part}
                    stroke={`url(#line-grad-${part})`}
                    strokeWidth={4}
                    dot={(props: any) => {
                       const { cx, cy, payload } = props;
                       const val = payload.values[part];
                       const color = getDynamicColor(PART_COLORS[part], val, getGoalFor(part));
                       return (
                         <circle 
                           cx={cx} 
                           cy={cy} 
                           r={5} 
                           fill={color} 
                           stroke="#000" 
                           strokeWidth={1.5} 
                           style={{ filter: `drop-shadow(0 0 5px ${color})` }}
                         />
                       );
                    }}
                    activeDot={{ r: 8, strokeWidth: 0, fill: '#fff' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Secondary Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          <div className="space-y-6">
            <SectionHeader 
              title="Mass Vector" 
              subtitle="TOTAL BIOMASS TRENDLINE" 
              action={<ZoomButton isZoomedOut={zoomWeight} onToggle={() => setZoomWeight(!zoomWeight)} />}
            />
            <div className="glass-panel p-8 rounded-3xl h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weightChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="area-grad-Weight" x1="0" y1="0" x2="1" y2="0">
                       {data.entries.map((entry, idx) => (
                         <stop 
                           key={`w-${idx}`} 
                           offset={`${(idx / (data.entries.length - 1 || 1)) * 100}%`} 
                           stopColor={getDynamicColor(PART_COLORS['Weight'], entry.values['Weight'] || 0, getGoalFor('Weight'))} 
                         />
                       ))}
                    </linearGradient>
                    <linearGradient id="fill-Weight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PART_COLORS['Weight']} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={PART_COLORS['Weight']} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    fontFamily="JetBrains Mono"
                    dy={10}
                  />
                  <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(5,5,10,0.95)', border: 'none', borderRadius: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  />
                  <ReferenceLine 
                    y={getGoalFor('Weight')} 
                    stroke={PART_COLORS['Weight']} 
                    strokeOpacity={0.3}
                    strokeDasharray="4 4" 
                    label={{ 
                      position: 'insideRight', 
                      value: `TARGET: ${getGoalFor('Weight')} LBS`, 
                      fill: PART_COLORS['Weight'], 
                      fontSize: 9,
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 'bold',
                      opacity: 0.4
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="values.Weight" 
                    stroke="url(#area-grad-Weight)" 
                    fillOpacity={1} 
                    fill="url(#fill-Weight)" 
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeader 
              title="Composition" 
              subtitle="ADIPOSE TISSUE RATIO" 
              action={<ZoomButton isZoomedOut={zoomBF} onToggle={() => setZoomBF(!zoomBF)} />}
            />
            <div className="glass-panel p-8 rounded-3xl h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bfChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                  <defs>
                    <linearGradient id="area-grad-BF" x1="0" y1="0" x2="1" y2="0">
                       {data.entries.map((entry, idx) => (
                         <stop 
                           key={`bf-${idx}`} 
                           offset={`${(idx / (data.entries.length - 1 || 1)) * 100}%`} 
                           stopColor={getDynamicColor(PART_COLORS['Body Fat %'], entry.values['Body Fat %'] || 0, getGoalFor('Body Fat %'))} 
                         />
                       ))}
                    </linearGradient>
                    <linearGradient id="fill-BF" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PART_COLORS['Body Fat %']} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={PART_COLORS['Body Fat %']} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(255,255,255,0.3)" 
                    fontSize={10} 
                    tickFormatter={(val) => val.split('-').slice(1).join('/')}
                    fontFamily="JetBrains Mono"
                    dy={10}
                  />
                  <YAxis domain={['auto', 'auto']} stroke="rgba(255,255,255,0.3)" fontSize={10} fontFamily="JetBrains Mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(5,5,10,0.95)', border: 'none', borderRadius: '12px', fontSize: '11px', fontFamily: 'JetBrains Mono' }}
                  />
                  <ReferenceLine 
                    y={getGoalFor('Body Fat %')} 
                    stroke={PART_COLORS['Body Fat %']} 
                    strokeOpacity={0.3}
                    strokeDasharray="4 4" 
                    label={{ 
                      position: 'insideRight', 
                      value: `TARGET: ${getGoalFor('Body Fat %')}%`, 
                      fill: PART_COLORS['Body Fat %'], 
                      fontSize: 9,
                      fontFamily: 'JetBrains Mono',
                      fontWeight: 'bold',
                      opacity: 0.4
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="values.Body Fat %" 
                    stroke="url(#area-grad-BF)" 
                    fillOpacity={1} 
                    fill="url(#fill-BF)" 
                    strokeWidth={4}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Manual Entry Form */}
        <section className="mb-16">
           <div className="flex justify-between items-center mb-8">
            <SectionHeader title="Update Stream" subtitle="MANUAL BIOMETRIC NODE SYNC" />
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="px-8 py-3 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-cyan-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d={isAdding ? "M20 12H4" : "M12 4v16m8-8H4"} />
              </svg>
              {isAdding ? "Cancel" : "New Sync"}
            </button>
          </div>

          {isAdding && (
            <div className="glass-panel p-10 rounded-3xl animate-in fade-in slide-in-from-bottom-6 duration-700">
              <form onSubmit={handleAddEntry} className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {DEFAULT_PARTS.map(part => (
                  <div key={part} className="space-y-2">
                    <label className="text-[10px] font-bold font-mono text-gray-400 uppercase tracking-widest block" style={{ color: PART_COLORS[part] }}>{part}</label>
                    <input 
                      type="number"
                      step="0.1"
                      required
                      placeholder={latestEntry?.values[part]?.toString() || "0.0"}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-white font-mono text-lg focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all placeholder:opacity-30"
                      onChange={(e) => setNewEntry(prev => ({ ...prev, [part]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="col-span-2 md:col-span-4 pt-6">
                  <button type="submit" className="w-full py-5 bg-cyan-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white hover:shadow-[0_0_40px_rgba(34,211,238,0.3)] transition-all active:scale-95 text-sm">
                    Initialize Neural Integration
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* Goal Configuration */}
        <section>
          <SectionHeader title="Neural Calibration" subtitle="REMAP TARGET BIOMETRIC OBJECTIVES" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {DEFAULT_PARTS.map(part => {
              const unit = part === 'Weight' ? 'lbs' : part === 'Body Fat %' ? '%' : '"';
              return (
                <div 
                  key={part} 
                  className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border-l-4 transition-all hover:bg-white/[0.02]"
                  style={{ borderLeftColor: PART_COLORS[part] }}
                >
                   <span className="text-[11px] font-bold font-mono text-gray-500 uppercase tracking-widest">{part} Goal</span>
                   <div className="relative">
                     <input 
                       type="number"
                       step="0.1"
                       value={tempGoals[part] ?? ''}
                       onChange={(e) => {
                         const val = parseFloat(e.target.value);
                         setTempGoals(prev => ({ ...prev, [part]: isNaN(val) ? 0 : val }));
                       }}
                       className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white font-mono text-xl focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all"
                     />
                     <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-600 uppercase font-bold">{unit}</span>
                   </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <button 
              onClick={handleSaveGoals}
              className="px-16 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-xs rounded-2xl hover:bg-cyan-400 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 group"
            >
              <span className="group-hover:scale-110 transition-transform inline-block">Lock Target Configuration</span>
            </button>
          </div>
        </section>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 opacity-30">
        <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] right-[5%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[180px]" />
      </div>
    </div>
  );
};

export default App;
