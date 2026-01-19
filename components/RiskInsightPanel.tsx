
import React, { useState, useEffect } from 'react';
import { StateSummary, InsightData, InsightType } from '../types';
import { generateRiskInsight } from '../services/gemini';

interface Props {
  summary: StateSummary;
  activeTab: InsightType;
}

const RiskInsightPanel: React.FC<Props> = ({ summary, activeTab }) => {
  const [insight, setInsight] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);

  const getSpecificInsight = (type: InsightType, state: string, enrolments: number): InsightData => {
    if (type === 'WELFARE') {
      return {
        problem: `The detection of an unusually high proportion of adult (18+) Aadhaar enrolments in ${state} indicates widespread late identity registration. This suggests that a large section of the population lived for many years without formal identity coverage, entering the Aadhaar system only after adulthood due to lack of awareness, documentation barriers, or administrative inaccessibility. This pattern reflects structural identity delays rather than population growth and signals systemic gaps in early-life identity inclusion.`,
        impact: "Late enrolment directly translates into delayed or denied access to essential services such as the Public Distribution System (ration), old-age and disability pensions, Jan Dhan and banking access, and Scholarship and DBT schemes for families. Generations may have grown up without legal identity, leading to intergenerational exclusion, poverty persistence, and weak financial inclusion in already vulnerable communities.",
        solution: [
          "Launch doorstep Aadhaar enrolment drives in high adult-ratio districts using mobile biometric units.",
          "Relax document requirements by expanding use of Introducer and Head-of-Family verification models.",
          "Integrate Aadhaar enrolment with welfare delivery points such as ration shops, pension offices, and panchayat centers.",
          "Use analytics to identify villages with persistent adult-first enrolment and prioritize them for awareness campaigns."
        ]
      };
    }
    if (type === 'CHILD') {
      return {
        problem: `Extremely low enrolment of children aged 0–5 indicates that early-life identity creation is failing in this region. Children are entering the Aadhaar system late, often only when required for school, scholarships, or healthcare, instead of being registered at birth or early childhood. This reveals a breakdown in the birth-to-identity pipeline involving hospitals, Anganwadis, and local administration.`,
        impact: "Children without early Aadhaar face delays in school admission and exam registration, denial of scholarships and mid-day meal schemes, and gaps in vaccination and nutrition tracking. Registration deficits create invisible populations, increasing the risk of becoming “invisible” in government systems and widening inequality from childhood itself.",
        solution: [
          "Mandate Aadhaar initiation at birth through hospitals and maternity centers with assisted enrolment desks.",
          "Integrate Aadhaar enrolment with Anganwadi and ICDS services for children under 5.",
          "Run school-based Aadhaar camps during admission and board exam registration.",
          "Track low-child-enrolment villages digitally and assign local officers accountability for coverage improvement."
        ]
      };
    }
    return {
      problem: `The audit of ${enrolments.toLocaleString()} Aadhaar enrolments in ${state} reveals systemic vulnerabilities in identity verification protocols, characterized by high-volume processing spikes in border districts, potential document fraud, and gaps in biometric capture for manual laborers and children. These issues are often compounded by state-specific distress migration and low digital literacy.`,
      impact: "Security integrity is compromised by the potential legitimization of non-citizens near the international border, creating national security vulnerabilities. Economically, the state faces fiscal hemorrhage through Direct Benefit Transfer (DBT) leakages to fake identities. Socially, aggressive fraud prevention measures without safeguards risk disenfranchising genuine citizens.",
      solution: [
        "Implement mandatory GPS-fencing and multi-factor operator authentication for enrolment kits in border districts.",
        "Deploy specialized mobile enrolment units for nomadic tribes and remote border villages.",
        "Conduct periodic multi-point biometric cross-referencing audit for new adult enrolments.",
        "Strengthen physical document verification with secondary verification tiers."
      ]
    };
  };

  useEffect(() => {
    const isAtRisk = 
      (activeTab === 'MIGRATION' && summary.hasMigrationRisk) ||
      (activeTab === 'WELFARE' && summary.hasWelfareRisk) ||
      (activeTab === 'CHILD' && summary.hasChildRisk);

    if (!isAtRisk) {
      setInsight(null);
      return;
    }

    const fetchInsight = async () => {
      setInsight(null);
      setLoading(true);
      
      const apiKey = process.env.API_KEY;
      if (!apiKey || apiKey === "undefined" || apiKey === "") {
        setInsight(getSpecificInsight(activeTab, summary.state, summary.totalEnrolments));
      } else {
        const res = await generateRiskInsight(summary.state, summary.totalEnrolments, 0, "");
        if (res.problem.includes("System identified multiple")) {
          setInsight(getSpecificInsight(activeTab, summary.state, summary.totalEnrolments));
        } else {
          setInsight(res);
        }
      }
      setLoading(false);
    };
    fetchInsight();
  }, [summary, activeTab]);

  const isAtRisk = 
    (activeTab === 'MIGRATION' && summary.hasMigrationRisk) ||
    (activeTab === 'WELFARE' && summary.hasWelfareRisk) ||
    (activeTab === 'CHILD' && summary.hasChildRisk);

  if (!isAtRisk) return null;

  if (loading) {
    return (
      <div className="bg-slate-950 p-10 rounded-[3rem] border border-slate-800 shadow-sm animate-pulse mt-10">
        <div className="h-4 bg-slate-800 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-slate-900 rounded"></div>
      </div>
    );
  }

  const accentColor = activeTab === 'MIGRATION' ? 'red' : activeTab === 'WELFARE' ? 'orange' : 'blue';

  return (
    <div className="space-y-6 pt-10">
       <h4 className={`text-[9px] font-black text-${accentColor}-500 uppercase tracking-[0.4em] flex items-center gap-2`}>
          <i className="fas fa-triangle-exclamation"></i> Intelligence Audit: {summary.state}
       </h4>
       
       <div className={`bg-slate-950 rounded-[4rem] border border-${accentColor}-900/40 shadow-[0_30px_100px_rgba(0,0,0,0.6)] overflow-hidden animate-in slide-in-from-bottom-12 duration-500`}>
          <div className={`bg-${accentColor}-950/20 p-12 border-b border-${accentColor}-900/30 flex items-center justify-between`}>
             <div className="flex items-center gap-6">
                <div className={`w-16 h-16 bg-${accentColor}-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-${accentColor}-500/20`}>
                   <i className={`fas ${activeTab === 'MIGRATION' ? 'fa-magnifying-glass-location' : activeTab === 'WELFARE' ? 'fa-hand-holding-heart' : 'fa-baby-carriage'} text-3xl`}></i>
                </div>
                <div>
                   <h3 className={`text-2xl font-black text-white uppercase tracking-tighter leading-none`}>
                     {activeTab === 'MIGRATION' ? 'Border Spike Intelligence' : activeTab === 'WELFARE' ? 'Welfare Exclusion Risk' : 'Child Identity Gap'}
                   </h3>
                   <p className={`text-[10px] font-black text-${accentColor}-400/80 uppercase mt-2 tracking-widest`}>Risk Assessment Active // {new Date().toLocaleDateString()}</p>
                </div>
             </div>
             <span className={`px-6 py-2.5 bg-${accentColor}-600/20 text-${accentColor}-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-${accentColor}-500/30`}>
               Active Alert
             </span>
          </div>

          <div className="p-14 space-y-14">
             <section className="space-y-5">
                <h5 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-4">
                   <i className="fas fa-search text-indigo-500"></i> THE PROBLEM
                </h5>
                <p className="text-slate-400 text-sm font-medium leading-relaxed tracking-wide">{insight?.problem}</p>
             </section>

             <section className="space-y-5">
                <h5 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-4">
                   <i className="fas fa-bolt-lightning text-red-500"></i> IMPACT ASSESSMENT
                </h5>
                <p className="text-slate-400 text-sm font-medium leading-relaxed tracking-wide">{insight?.impact}</p>
             </section>

             <section className="space-y-8">
                <h5 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-4">
                   <i className="fas fa-gears text-emerald-500"></i> RECOMMENDED ACTIONS
                </h5>
                <div className="space-y-6">
                   {insight?.solution.map((step, idx) => (
                      <div key={idx} className="flex gap-6 items-start group">
                         <span className={`w-10 h-10 bg-${accentColor}-600 text-white rounded-full flex items-center justify-center text-[12px] font-black flex-shrink-0 border border-${accentColor}-500 group-hover:scale-110 transition-transform shadow-xl shadow-${accentColor}-500/30`}>{idx + 1}</span>
                         <span className="text-sm font-bold text-slate-300 leading-relaxed pt-2 group-hover:text-white transition-colors">{step}</span>
                      </div>
                   ))}
                </div>
             </section>
          </div>
       </div>
    </div>
  );
};

export default RiskInsightPanel;
