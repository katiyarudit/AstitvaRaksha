
import { AadhaarRecord, StateSummary, AgeDistribution, MonthlyTrend } from '../types';
import { BORDER_STATES, RED_ZONE_PERCENTILE, ALL_STATES, normalizeStateName } from '../constants';

const getMonthKey = (dateStr: string): string => {
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}`;
    return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  return "UNKNOWN";
};

const parseDateString = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return new Date().toISOString().split('T')[0];
};

export const parseCSV = (csvText: string): AadhaarRecord[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    const standardDate = parseDateString(row.date);
    const age0_5 = parseInt(row.age_0_5) || 0;
    const age5_17 = parseInt(row.age_5_17) || 0;
    const age18 = parseInt(row.age_18_greater) || 0;
    const total = age0_5 + age5_17 + age18;

    return {
      date: standardDate,
      state: normalizeStateName(row.state),
      district: (row.district || "Default District").toUpperCase(),
      pincode: row.pincode || "000000",
      age_0_5: age0_5,
      age_5_17: age5_17,
      age_18_greater: age18,
      total,
      adult_ratio: total > 0 ? age18 / total : 0,
      child_ratio: total > 0 ? age0_5 / total : 0
    };
  });
};

export const processAnalysis = (data: AadhaarRecord[]) => {
  const stateData: Record<string, AadhaarRecord[]> = {};
  const monthlyStateData: Record<string, Record<string, number>> = {};
  const monthsFound = new Set<string>();

  data.forEach(record => {
    if (!stateData[record.state]) stateData[record.state] = [];
    stateData[record.state].push(record);
    
    const month = getMonthKey(record.date);
    monthsFound.add(month);
    if (!monthlyStateData[month]) monthlyStateData[month] = {};
    monthlyStateData[month][record.state] = (monthlyStateData[month][record.state] || 0) + record.total;
  });

  const stateSummaries: Record<string, StateSummary> = {};

  Object.entries(stateData).forEach(([stateName, records]) => {
    const dailyTotals: Record<string, number> = {};
    const monthlyTotals: Record<string, number> = {};
    const ageDist: AgeDistribution = { infants: 0, students: 0, adults: 0 };
    const districts: Record<string, any> = {};

    records.forEach(r => {
      dailyTotals[r.date] = (dailyTotals[r.date] || 0) + r.total;
      const m = getMonthKey(r.date);
      monthlyTotals[m] = (monthlyTotals[m] || 0) + r.total;
      ageDist.infants += r.age_0_5;
      ageDist.students += r.age_5_17;
      ageDist.adults += r.age_18_greater;

      const dName = r.district;
      if (!districts[dName]) {
        districts[dName] = { 
          district: dName, 
          totalEnrolments: 0, 
          ageDist: { infants: 0, students: 0, adults: 0 }, 
          pincodes: {}
        };
      }
      districts[dName].totalEnrolments += r.total;
      districts[dName].ageDist.infants += r.age_0_5;
      districts[dName].ageDist.students += r.age_5_17;
      districts[dName].ageDist.adults += r.age_18_greater;
      districts[dName].pincodes[r.pincode] = (districts[dName].pincodes[r.pincode] || 0) + r.total;
    });

    const dailyValues = Object.values(dailyTotals).sort((a, b) => a - b);
    const p95Daily = dailyValues[Math.floor(dailyValues.length * RED_ZONE_PERCENTILE)] || 0;
    const isBorder = BORDER_STATES.includes(stateName);

    // Rule 1: Migration Risk (Border state + Spike > 95th percentile)
    let hasMigrationRisk = false;
    Object.entries(dailyTotals).forEach(([date, total]) => {
      if (isBorder && total > p95Daily && total > 50) hasMigrationRisk = true;
    });

    const totalStateEnrol = records.reduce((acc, r) => acc + r.total, 0);
    const stateAdultRatio = totalStateEnrol > 0 ? ageDist.adults / totalStateEnrol : 0;
    const stateChildRatio = totalStateEnrol > 0 ? ageDist.infants / totalStateEnrol : 0;

    // Rule 2: Welfare Risk (Adult Ratio > 0.6)
    const hasWelfareRisk = stateAdultRatio > 0.6;

    // Rule 3: Child Risk (Child Ratio < 0.1)
    const hasChildRisk = stateChildRatio < 0.1;

    const monthlyTrends: MonthlyTrend[] = Object.entries(monthlyTotals)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    stateSummaries[stateName] = {
      state: stateName,
      totalEnrolments: totalStateEnrol,
      status: (hasMigrationRisk || hasWelfareRisk || hasChildRisk) ? 'RED' : 'GREEN',
      hasMigrationRisk,
      hasWelfareRisk,
      hasChildRisk,
      ageDist,
      monthlyTrends,
      districts
    };
  });

  return { 
    stateSummaries, 
    monthlyStateData, 
    months: Array.from(monthsFound).sort() 
  };
};

export const generateMockCSV = (): string => {
  let csv = 'date,state,district,pincode,age_0_5,age_5_17,age_18_greater\n';
  const now = new Date();
  ALL_STATES.forEach(state => {
    const districts = [`${state} District 1`, `${state} District 2`, `${state} District 3`];
    for (let m = 0; m < 5; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = monthDate.getFullYear();
      const month = (monthDate.getMonth() + 1).toString().padStart(2, '0');
      
      for (let d = 0; d < 10; d++) {
        const day = (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const isBorder = BORDER_STATES.includes(state);
        
        let a1 = Math.floor(Math.random() * 50) + 10;
        let a2 = Math.floor(Math.random() * 100) + 20;
        let a3 = Math.floor(Math.random() * 150) + 30;

        // Custom spikes to trigger the 3 rules for specific states to make the demo meaningful
        if (isBorder && state === 'WEST BENGAL' && d === 0) { a1 = 1500; a2 = 2000; a3 = 3000; } // Migration
        if (state === 'BIHAR') { a3 = 4500; a1 = 50; a2 = 100; } // Welfare (High Adult Ratio)
        if (state === 'KERALA') { a1 = 5; a2 = 150; a3 = 300; } // Child (Low Child Ratio)
        if (state === 'UTTAR PRADESH') { a1 = 800; a2 = 1200; a3 = 1000; } // Mixed large volume

        const dist = districts[Math.floor(Math.random() * districts.length)];
        csv += `${dateStr},${state},${dist},${Math.floor(100000+Math.random()*800000)},${a1},${a2},${a3}\n`;
      }
    }
  });
  return csv;
};
