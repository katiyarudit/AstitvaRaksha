import React, { useState } from 'react';
import { parseCSV, processAnalysis, generateMockCSV } from './utils/dataProcessor';
import { StateSummary } from './types';
import AnalysisDashboard from './components/AnalysisDashboard';

const App: React.FC = () => {
  const [summaries, setSummaries] = useState<Record<string, StateSummary>>({});
  const [monthlyStateData, setMonthlyStateData] = useState<Record<string, Record<string, number>>>({});
  const [months, setMonths] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasData, setHasData] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const data = parseCSV(text);
      if (data.length === 0) {
        alert("Invalid dataset.");
        setIsProcessing(false);
        return;
      }
      const res = processAnalysis(data);
      setSummaries(res.stateSummaries);
      setMonthlyStateData(res.monthlyStateData);
      setMonths(res.months);
      setHasData(true);
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockCSV = generateMockCSV();
      const data = parseCSV(mockCSV);
      const res = processAnalysis(data);
      setSummaries(res.stateSummaries);
      setMonthlyStateData(res.monthlyStateData);
      setMonths(res.months);
      setHasData(true);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex flex-col font-sans antialiased text-slate-100">
      <header className="bg-slate-900/40 border-b border-slate-800/60 px-12 py-6 flex items-center justify-between sticky top-0 z-[2000] backdrop-blur-2xl">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-[0_0_30px_rgba(79,70,229,0.3)]">
              <i className="fas fa-fingerprint text-3xl"></i>
          </div>
          <div>
            <h1 className="font-black text-white tracking-tighter leading-none uppercase text-2xl">AstitvaRaksha – Protection of existence</h1>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                National Identity Guard // v3.5
            </p>
          </div>
        </div>

        {hasData && (
          <div className="flex items-center gap-4">
             <label className="flex items-center gap-3 px-6 py-3 bg-slate-800/50 hover:bg-slate-700/50 text-white rounded-2xl text-[9px] font-black cursor-pointer transition-all border border-slate-700 uppercase tracking-widest shadow-xl">
                <i className="fas fa-arrows-rotate text-indigo-400"></i> Refresh Audit
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
             </label>
             <button onClick={() => setHasData(false)} className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-red-500 transition-all">
                <i className="fas fa-power-off text-lg"></i>
             </button>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-[1900px] mx-auto w-full p-8 lg:p-12">
        {!hasData ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-1000">
             <div className="mb-12 p-14 bg-slate-900/50 border border-slate-800/50 rounded-[4rem] shadow-[0_0_100px_rgba(79,70,229,0.1)] rotate-3">
                 <i className="fas fa-shield-halved text-8xl text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"></i>
             </div>
             <h2 className="text-8xl font-black text-white tracking-tighter mb-6">AstitvaRaksha</h2>
             <p className="text-slate-400 text-2xl max-w-xl mb-12 font-medium leading-relaxed">Identity Intelligence for National Security and Welfare Integrity.</p>
             
             <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] mb-10 opacity-80">Not sure where to start?</p>

             <div className="flex flex-col sm:flex-row gap-8">
                <label className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-[3rem] px-16 py-12 flex flex-col items-center gap-6 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-900/50 transition-all group shadow-2xl min-w-[400px]">
                   <i className="fas fa-upload text-4xl text-slate-700 group-hover:text-indigo-400 transition-colors"></i>
                   <div className="flex flex-col items-center gap-2">
                      <span className="font-black text-[11px] text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors">Ingest Real-time Audit Logs</span>
                      <span className="text-[10px] text-indigo-500/60 font-bold tracking-tight">Real-Time Mode: Analyze your own aadhar enrolment dataset</span>
                   </div>
                   <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={handleLoadDemo} className="bg-indigo-600 rounded-[3rem] px-16 py-12 flex flex-col items-center gap-6 text-white hover:bg-indigo-500 transition-all shadow-[0_20px_60px_rgba(79,70,229,0.3)] border border-indigo-400 min-w-[400px]">
                   <i className="fas fa-bolt-lightning text-4xl"></i>
                   <div className="flex flex-col items-center gap-2">
                      <span className="font-black text-[11px] uppercase tracking-widest">Execute Tactical Simulation</span>
                      <span className="text-[10px] text-indigo-200 font-bold tracking-tight opacity-80">Simulation Mode: Explore features with built-in data</span>
                   </div>
                </button>
             </div>
          </div>
        ) : isProcessing ? (
          <div className="h-[70vh] flex flex-col items-center justify-center space-y-10 animate-in fade-in">
            <div className="relative">
               <div className="w-24 h-24 border-[8px] border-slate-900 border-t-indigo-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fas fa-microchip text-indigo-400 animate-pulse text-xl"></i>
               </div>
            </div>
            <p className="font-black text-indigo-400 uppercase text-[10px] tracking-[0.6em] animate-pulse">Synchronizing Intelligence Streams...</p>
          </div>
        ) : (
          <AnalysisDashboard summaries={summaries} monthlyStateData={monthlyStateData} months={months} />
        )}
      </main>

      <footer className="py-12 px-16 text-[10px] text-slate-700 font-black uppercase tracking-[0.4em] flex justify-between items-center border-t border-slate-900/60 bg-black/10">
        <span>© 2025 NATIONAL SECURITY ANALYTICS UNIT // STRATEGIC ACCESS ONLY</span>
        <div className="flex gap-12">
           <i className="fas fa-shield-virus hover:text-indigo-500 transition-colors cursor-help"></i>
           <i className="fas fa-network-wired hover:text-indigo-500 transition-colors cursor-help"></i>
           <i className="fas fa-satellite hover:text-indigo-500 transition-colors cursor-help"></i>
        </div>
      </footer>
    </div>
  );
};

export default App;
