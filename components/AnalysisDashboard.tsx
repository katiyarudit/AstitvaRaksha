import React, { useState, useMemo } from 'react';
import { StateSummary, InsightType, DistrictSummary } from '../types';
import IndiaMap from './IndiaMap';
import RiskInsightPanel from './RiskInsightPanel';
import ComparisonChart from './ComparisonChart';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadialBarChart, RadialBar
} from 'recharts';

interface Props {
  summaries: Record<string, StateSummary>;
  monthlyStateData: Record<string, Record<string, number>>;
  months: string[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b'];

const AnalysisDashboard: React.FC<Props> = ({ summaries, months }) => {
  const [activeTab, setActiveTab] = useState<InsightType>('MIGRATION');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'drill' | 'compare'>('drill');
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);
  const [comparisonStates, setComparisonStates] = useState<string[]>([]);

  const summaryValues = useMemo(() => {
    return (Object.values(summaries) as StateSummary[]).filter(s => s.state && s.state.length > 3 && s.state !== "1000");
  }, [summaries]);

  const selectedSummary = selectedState ? summaries[selectedState] : null;

  const overview = useMemo(() => {
    let total = 0, critical = 0;
    summaryValues.forEach(s => {
      total += s.totalEnrolments;
      const isRed = activeTab === 'MIGRATION' ? s.hasMigrationRisk : (activeTab === 'WELFARE' ? s.hasWelfareRisk : s.hasChildRisk);
      if (isRed) critical++;
    });
    return { total, critical };
  }, [summaryValues, activeTab]);

  const stateRanking = useMemo(() => {
    const sorted = [...summaryValues];
    if (activeTab === 'MIGRATION') {
      return sorted.sort((a, b) => b.totalEnrolments - a.totalEnrolments);
    } else if (activeTab === 'WELFARE') {
      return sorted.sort((a, b) => (b.ageDist.adults / b.totalEnrolments) - (a.ageDist.adults / a.totalEnrolments));
    } else {
      return sorted.sort((a, b) => (a.ageDist.infants / a.totalEnrolments) - (b.ageDist.infants / b.totalEnrolments));
    }
  }, [summaryValues, activeTab]);

  const toggleStateForComparison = (state: string) => {
    setComparisonStates(prev => 
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state].slice(0, 5)
    );
  };

  const selectedStatesForChart = useMemo(() => {
    return comparisonStates.map(s => summaries[s]).filter(Boolean);
  }, [comparisonStates, summaries]);

  const comparisonDistricts = useMemo(() => {
    if (selectedStatesForChart.length === 0) return [];
    
    let allDistricts: Array<{ district: string; state: string; val: number; d: DistrictSummary }> = [];
    
    selectedStatesForChart.forEach(s => {
      Object.values(s.districts).forEach((d: DistrictSummary) => {
        let val = 0;
        if (activeTab === 'MIGRATION') val = d.totalEnrolments;
        else if (activeTab === 'WELFARE') val = (d.ageDist.adults / d.totalEnrolments) * 100;
        else val = (d.ageDist.infants / d.totalEnrolments) * 100;
        
        allDistricts.push({ district: d.district, state: s.state, val, d });
      });
    });

    if (activeTab === 'CHILD') {
      return allDistricts.sort((a, b) => a.val - b.val).slice(0, 10);
    }
    return allDistricts.sort((a, b) => b.val - a.val).slice(0, 10);
  }, [selectedStatesForChart, activeTab]);

  const metricLabel = activeTab === 'MIGRATION' ? 'Total Volume' : activeTab === 'WELFARE' ? 'Adult %' : 'Child %';
  
  const getMetricValue = (s: StateSummary) => {
    if (activeTab === 'MIGRATION') return s.totalEnrolments.toLocaleString();
    if (activeTab === 'WELFARE') return ((s.ageDist.adults / s.totalEnrolments) * 100).toFixed(1) + '%';
    return ((s.ageDist.infants / s.totalEnrolments) * 100).toFixed(1) + '%';
  };

  const getComparisonMetricValue = (s: StateSummary) => {
    if (activeTab === 'MIGRATION') return s.totalEnrolments;
    if (activeTab === 'WELFARE') return (s.ageDist.adults / s.totalEnrolments) * 100;
    return (s.ageDist.infants / s.totalEnrolments) * 100;
  };

  const landingContext = {
    MIGRATION: {
      title: "Frontier Surveillance",
      problem: "Audit of border enrolments indicates a critical convergence of risks characteried by potential fraudulent identity creation and suspicious migration pressure. These issues are often compounded by state-specific distress migration and low digital literacy in remote border districts.",
      impact: "Security integrity is compromised by the potential legitimization of non-citizens near international borders, creating national security vulnerabilities and fiscal hemorrhage through Direct Benefit Transfer (DBT) leakages to fake identities."
    },
    WELFARE: {
      title: "Welfare Diagnostic",
      problem: "The detection of an unusually high proportion of adult (18+) Aadhaar enrolments indicates widespread late identity registration. This suggests that a large section of the population lived for many years without formal identity coverage, entering the Aadhaar system only after adulthood due to lack of awareness or administrative inaccessibility.",
      impact: "Late enrolment translates into delayed or denied access to essential services such as the Public Distribution System (ration), old-age and disability pensions, Jan Dhan banking access, and scholarship schemes for families. This leads to intergenerational exclusion and poverty persistence."
    },
    CHILD: {
      title: "Child Identity Gap",
      problem: "Extremely low enrolment of children aged 0–5 indicates that early-life identity creation is failing. Children are entering the Aadhaar system late, often only when required for school, scholarships, or healthcare, instead of being registered at birth or early childhood. This reveals a breakdown in the birth-to-identity pipeline.",
      impact: "Children without early Aadhaar face delays in school admission, denial of scholarships, and gaps in vaccination tracking. This creates long-term human development risks and widens inequality from childhood itself, increasing the risk of becoming “invisible” in government systems."
    }
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Top Navigation and Description Section - Centered and Enlarged */}
      <div className="flex flex-col items-center gap-12 w-full max-w-5xl mx-auto text-center">
        <div className="bg-slate-900/60 p-2 rounded-3xl border border-slate-800 shadow-2xl inline-flex gap-2 backdrop-blur-md">
          {(['MIGRATION', 'WELFARE', 'CHILD'] as InsightType[]).map(t => (
            <button
              key={t}
              onClick={() => { setActiveTab(t); setSelectedState(null); }}
              className={`px-12 py-5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === t ? `bg-indigo-600 text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] scale-105` : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
            >
              {t === 'MIGRATION' ? 'Border Spikes' : (t === 'WELFARE' ? 'Welfare Gaps' : 'Child Gaps')}
            </button>
          ))}
        </div>
        
        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
           {activeTab === 'WELFARE' && (
             <div className="space-y-6">
                <p className="text-xl text-orange-400 font-black uppercase tracking-[0.2em] border-b-2 border-orange-500/20 pb-4 inline-block">Audit Insight: Structural Welfare Delays</p>
                <p className="text-lg text-slate-300 font-medium leading-relaxed px-12">
                  High adult enrollment ratios signal populations entering the identity net only after age 18, indicating long-term welfare exclusion. 
                  This creates "identity invisibility" for significant demographics who have lived without formal recognition.
                </p>
                <div className="bg-orange-500/10 p-6 rounded-3xl border border-orange-500/20 inline-block">
                  <p className="text-sm text-orange-200 font-black uppercase tracking-widest italic">
                    <i className="fas fa-lightbulb mr-3"></i> Suggested Solution: Proactive mobile enrollment drives at PDS shops and Panchayat offices to capture the remaining adult demographic.
                  </p>
                </div>
             </div>
           )}
           {activeTab === 'CHILD' && (
             <div className="space-y-6">
                <p className="text-xl text-blue-400 font-black uppercase tracking-[0.2em] border-b-2 border-blue-500/20 pb-4 inline-block">Audit Insight: Birth-to-Identity Breakdown</p>
                <p className="text-lg text-slate-300 font-medium leading-relaxed px-12">
                  Low registration in the 0-5 age group suggests a failure to link birth certificates with identity generation. 
                  Children missing this window suffer from delayed educational, healthcare, and nutritional benefit access.
                </p>
                <div className="bg-blue-500/10 p-6 rounded-3xl border border-blue-500/20 inline-block">
                  <p className="text-sm text-blue-200 font-black uppercase tracking-widest italic">
                    <i className="fas fa-lightbulb mr-3"></i> Suggested Solution: Mandate identity counters at maternity wards and integrate enrollment with early childhood vaccination cycles.
                  </p>
                </div>
             </div>
           )}
           {activeTab === 'MIGRATION' && (
             <div className="space-y-6">
                <p className="text-xl text-red-400 font-black uppercase tracking-[0.2em] border-b-2 border-red-500/20 pb-4 inline-block">Audit Insight: Frontier Security Risk</p>
                <p className="text-lg text-slate-300 font-medium leading-relaxed px-12">
                  Sudden spikes in border districts often correlate with unauthorized cross-border movement or document forgery attempts.
                  Legitimacy of identity in these zones is critical for national security and resource integrity.
                </p>
                <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20 inline-block">
                  <p className="text-sm text-red-200 font-black uppercase tracking-widest italic">
                    <i className="fas fa-lightbulb mr-3"></i> Suggested Solution: Implement secondary physical verification for all new adult enrollments in designated frontier districts.
                  </p>
                </div>
             </div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 space-y-10">
          <div className="relative h-[700px] bg-slate-900/80 p-4 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-slate-800/60 overflow-hidden backdrop-blur-sm">
             <IndiaMap 
               summaries={summaries} 
               onStateSelect={setSelectedState} 
               selectedState={selectedState} 
               activeInsight={activeTab} 
             />

             <div className="absolute top-10 right-10 z-[1000] flex bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
                <button onClick={() => setViewMode('drill')} className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${viewMode === 'drill' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Local Focus</button>
                <button onClick={() => setViewMode('compare')} className={`px-6 py-2.5 text-[10px] font-black uppercase rounded-xl transition-all ${viewMode === 'compare' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Cluster Compare</button>
             </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
             <div className="bg-slate-900/50 p-10 rounded-[3rem] border border-slate-800 shadow-2xl backdrop-blur-md">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Enrolment Volume</p>
                <p className="text-4xl font-black text-white tracking-tighter">{overview.total.toLocaleString()}</p>
             </div>
             <div className="bg-red-950/20 p-10 rounded-[3rem] border border-red-900/40 shadow-xl backdrop-blur-md">
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Critical Nodes</p>
                <p className="text-4xl font-black text-red-600 tracking-tighter">{overview.critical}</p>
             </div>
             <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-800 flex flex-col justify-center group overflow-hidden relative backdrop-blur-md">
                <p className="text-2xl font-black text-white tracking-tight relative z-10">Vigilance Status</p>
                <p className="text-[10px] font-black text-indigo-400 uppercase mt-2">Active Surveillance</p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-5 h-[850px] overflow-y-auto custom-scrollbar bg-slate-900/90 p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.6)] border border-slate-800 backdrop-blur-sm">
          {viewMode === 'drill' ? (
            selectedSummary ? (
              <div className="space-y-12 animate-in slide-in-from-right-8">
                <div>
                  <button onClick={() => setSelectedState(null)} className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-3 hover:text-indigo-300 transition-all">
                     <i className="fas fa-arrow-left"></i> Full Network Map
                  </button>
                  <h3 className="text-6xl font-black text-white uppercase tracking-tighter leading-none">{selectedState}</h3>
                  <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.4em] mt-4">Node Analysis: {activeTab === 'MIGRATION' ? 'Security' : activeTab === 'WELFARE' ? 'Inclusion' : 'Development'}</p>
                </div>

                <div className="bg-slate-950/60 p-10 rounded-[3.5rem] border border-slate-800/80 shadow-inner">
                  <h4 className="text-[11px] font-black text-indigo-500 uppercase tracking-widest mb-10 text-center">Metric Distribution Matrix</h4>
                  <div className="relative h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      {activeTab === 'MIGRATION' ? (
                        <PieChart>
                          <Pie 
                            data={[
                              { name: '0-5', value: selectedSummary.ageDist.infants },
                              { name: '5-17', value: selectedSummary.ageDist.students },
                              { name: '18+', value: selectedSummary.ageDist.adults }
                            ]} 
                            innerRadius={75} outerRadius={105} dataKey="value" stroke="none" paddingAngle={10}
                          >
                            {COLORS.map((c, i) => <Cell key={i} fill={c} className="drop-shadow-lg" />)}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} />
                        </PieChart>
                      ) : activeTab === 'WELFARE' ? (
                        <BarChart data={[
                          { name: 'Infant', val: selectedSummary.ageDist.infants },
                          { name: 'Student', val: selectedSummary.ageDist.students },
                          { name: 'Adult', val: selectedSummary.ageDist.adults }
                        ]} layout="vertical">
                           <XAxis type="number" hide />
                           <YAxis type="category" dataKey="name" tick={{fill: '#64748b', fontSize: 10, fontWeight: 900}} width={60} axisLine={false} tickLine={false} />
                           <Bar dataKey="val" fill="#f59e0b" radius={[0, 10, 10, 0]} barSize={40} />
                           <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ color: '#fff' }} />
                        </BarChart>
                      ) : (
                        <RadialBarChart innerRadius="20%" outerRadius="100%" data={[
                          { name: 'Target: Child 0-5', val: selectedSummary.ageDist.infants, fill: '#6366f1' },
                        ]} startAngle={180} endAngle={0}>
                           <RadialBar background dataKey="val" cornerRadius={30} />
                           <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} itemStyle={{ color: '#fff' }} />
                        </RadialBarChart>
                      )}
                    </ResponsiveContainer>
                    <div className="absolute inset-x-0 bottom-[-30px] grid grid-cols-3 gap-4">
                       {[
                         { l: '0-5 INF', v: selectedSummary.ageDist.infants, c: '#6366f1' },
                         { l: '5-17 EDU', v: selectedSummary.ageDist.students, c: '#10b981' },
                         { l: '18+ ADL', v: selectedSummary.ageDist.adults, c: '#f59e0b' }
                       ].map((item, i) => (
                         <div key={i} className="bg-slate-900/50 p-4 rounded-3xl border border-slate-800 text-center">
                            <p className="text-[8px] font-black text-slate-500 uppercase mb-1">{item.l}</p>
                            <p className="text-xs font-black" style={{ color: item.c }}>{item.v.toLocaleString()}</p>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-12">
                  <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-6">Top Regional Nodes (Districts)</h4>
                  {(Object.values(selectedSummary.districts) as DistrictSummary[])
                    .sort((a, b) => b.totalEnrolments - a.totalEnrolments)
                    .slice(0, 10)
                    .map((d, idx) => (
                    <div key={d.district} className="group">
                      <div 
                        onClick={() => setExpandedDistrict(expandedDistrict === d.district ? null : d.district)}
                        className={`bg-slate-950/40 p-7 rounded-[2.5rem] border transition-all flex items-center justify-between cursor-pointer ${expandedDistrict === d.district ? 'border-indigo-500 shadow-2xl bg-slate-950' : 'border-slate-800 hover:border-slate-700'}`}
                      >
                         <div className="flex items-center gap-6">
                            <span className="text-[12px] font-black text-slate-700">#{(idx+1).toString().padStart(2, '0')}</span>
                            <span className="text-sm font-black text-white uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{d.district}</span>
                         </div>
                         <div className="flex items-center gap-5">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{d.totalEnrolments.toLocaleString()} flow</span>
                            <i className={`fas fa-chevron-right text-slate-700 transition-transform ${expandedDistrict === d.district ? 'rotate-90 text-indigo-500' : ''}`}></i>
                         </div>
                      </div>
                      {expandedDistrict === d.district && (
                        <div className="bg-slate-950 mt-4 p-8 rounded-[3rem] border border-indigo-500/30 grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                           <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Child Seg</p>
                              <p className="text-xl font-black text-white">{d.ageDist.infants.toLocaleString()}</p>
                           </div>
                           <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Adult Ratio</p>
                              <p className="text-xl font-black text-white">{((d.ageDist.adults / d.totalEnrolments) * 100).toFixed(1)}%</p>
                           </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <RiskInsightPanel summary={selectedSummary} activeTab={activeTab} />
              </div>
            ) : (
              <div className="animate-in fade-in h-full flex flex-col space-y-12">
                <div className="flex justify-between items-center">
                   <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Strategic Intelligence Hub</h3>
                   <span className="px-4 py-1.5 bg-indigo-600/20 text-indigo-400 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/30">Live Sync</span>
                </div>

                <div className="bg-indigo-950/20 p-10 rounded-[3.5rem] border border-indigo-500/20 space-y-8 relative overflow-hidden group backdrop-blur-md">
                   <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
                      <i className="fas fa-satellite-dish text-6xl text-indigo-500"></i>
                   </div>
                   <div className="flex items-center gap-5 text-indigo-400 relative z-10">
                      <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                        <i className="fas fa-brain text-xl"></i>
                      </div>
                      <h4 className="text-xl font-black uppercase tracking-tight leading-none">{landingContext[activeTab].title} Unit</h4>
                   </div>
                   <div className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-500/80 uppercase tracking-widest">Core Problem</p>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">{landingContext[activeTab].problem}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-red-500/80 uppercase tracking-widest">Projected Impact</p>
                        <p className="text-sm font-medium text-slate-400 leading-relaxed">{landingContext[activeTab].impact}</p>
                      </div>
                   </div>
                </div>

                <div className="flex-1 space-y-6">
                   <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-4 border-l-4 border-indigo-600">Metric Intensity Ranking</h4>
                   {stateRanking.slice(0, 10).map((s) => (
                     <div key={s.state} onClick={() => setSelectedState(s.state)} className="bg-slate-950/40 p-8 rounded-[3rem] border border-slate-800/60 hover:border-indigo-500 hover:bg-slate-950 transition-all cursor-pointer flex justify-between items-center group shadow-xl">
                        <div className="flex items-center gap-6">
                           <div className={`w-3 h-3 rounded-full ${
                             (activeTab === 'MIGRATION' && s.hasMigrationRisk) || (activeTab === 'WELFARE' && s.hasWelfareRisk) || (activeTab === 'CHILD' && s.hasChildRisk) ? 'bg-red-500 shadow-[0_0_12px_#ef4444]' : 'bg-emerald-500 shadow-[0_0_12px_#10b981]'
                           }`}></div>
                           <span className="text-sm font-black text-slate-200 uppercase tracking-tight group-hover:text-white transition-colors">{s.state}</span>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-black text-white tracking-tighter leading-none group-hover:text-indigo-400 transition-colors">{getMetricValue(s)}</p>
                           <p className="text-[10px] font-black text-slate-600 uppercase mt-2">{metricLabel}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )
          ) : (
            <div className="h-full flex flex-col space-y-12 animate-in zoom-in-95">
               <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Strategic Comparison</h3>
                  <div className="px-6 py-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">Cluster size: {comparisonStates.length} / 5</div>
               </div>

               {comparisonStates.length > 0 ? (
                 <div className="space-y-12 animate-in fade-in duration-500">
                    <div className="bg-slate-950/80 p-12 rounded-[4rem] border border-slate-800 shadow-2xl">
                       <ComparisonChart selectedStates={selectedStatesForChart} activeTab={activeTab} />
                    </div>
                    
                    <div className="bg-slate-950/60 p-10 rounded-[3.5rem] border border-slate-800 h-[350px]">
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-10 text-center">Relative {metricLabel} Correlation</p>
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={selectedStatesForChart} margin={{ bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                              <XAxis dataKey="state" tick={{fontSize: 9, fontWeight: 900, fill: '#64748b'}} axisLine={false} tickLine={false} />
                              <YAxis tick={{fontSize: 9, fontWeight: 700, fill: '#64748b'}} axisLine={false} tickLine={false} />
                              <Tooltip 
                                 contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} 
                                 itemStyle={{ color: '#fff', fontWeight: 900, fontSize: '11px' }} 
                                 labelStyle={{ color: '#fff' }}
                                 cursor={{fill: 'rgba(99,102,241,0.05)'}} 
                              />
                              <Bar dataKey={getComparisonMetricValue} name={metricLabel} fill={activeTab === 'MIGRATION' ? '#ef4444' : activeTab === 'WELFARE' ? '#f59e0b' : '#3b82f6'} radius={[12, 12, 0, 0]} />
                           </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center text-center py-32 space-y-10">
                    <div className="w-32 h-32 bg-indigo-600/10 rounded-full flex items-center justify-center animate-pulse">
                      <i className="fas fa-layer-group text-6xl text-indigo-500"></i>
                    </div>
                    <div className="space-y-4">
                      <p className="text-white font-black uppercase text-xl tracking-[0.2em]">Comparative Engine Offline</p>
                      <p className="text-slate-500 font-bold uppercase text-xs tracking-widest px-12 leading-loose">
                        SELECT DIFFERENT STATES BELOW FOR COMPARATIVE AUDIT DISCOVERY. <br/>
                        IDENTIFY ANOMALY CLUSTERS THROUGH MULTI-POINT CORRELATION.
                      </p>
                    </div>
                 </div>
               )}

               <div className="space-y-6">
                  <h4 className="text-[11px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-800 pb-4">State Inventory Matrix</h4>
                  <div className="grid grid-cols-1 gap-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                     {summaryValues.map(s => (
                        <div 
                          key={s.state} 
                          onClick={() => toggleStateForComparison(s.state)}
                          className={`p-7 rounded-[3rem] border cursor-pointer transition-all flex justify-between items-center group ${comparisonStates.includes(s.state) ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_15px_40px_rgba(79,70,229,0.3)] scale-[0.98]' : 'bg-slate-950/40 border-slate-800/60 hover:border-slate-600 hover:bg-slate-900/60'}`}
                        >
                           <div className="flex items-center gap-6">
                              <div className={`w-5 h-5 rounded-full border-2 transition-all ${comparisonStates.includes(s.state) ? 'bg-white border-white scale-110' : 'border-slate-800 group-hover:border-slate-600'}`}></div>
                              <span className="text-sm font-black uppercase tracking-tight">{s.state}</span>
                           </div>
                           <div className="text-right">
                              <span className={`text-[11px] font-black tracking-widest ${comparisonStates.includes(s.state) ? 'text-indigo-200' : 'text-slate-600'}`}>{getMetricValue(s)}</span>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;