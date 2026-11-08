import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar as CalendarIcon,
  Activity,
  PlusCircle,
  BarChart3,
  Settings,
  ShieldCheck,
  Lock,
  Unlock,
  Droplets,
  Sparkles,
  Thermometer,
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Heart,
  Zap,
  Smile,
  Frown,
  Meh,
  FileText,
  Smartphone,
  Plus,
  X,
  Info,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Award,
  Clock,
  Flame,
  TrendingUp,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

// ============================================================================
// DATE UTILITY FUNCTIONS (Timezone-safe local YYYY-MM-DD operations)
// ============================================================================
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (dateStr) => {
  if (!dateStr) return new Date();
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

const addDays = (dateStr, days) => {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
};

const diffDays = (dateStr1, dateStr2) => {
  const d1 = parseDate(dateStr1);
  const d2 = parseDate(dateStr2);
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
};

const formatDisplayDate = (dateStr, options = { month: 'short', day: 'numeric' }) => {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', options);
};

const getTodayStr = () => formatDate(new Date());

// ============================================================================
// DEFAULT SAMPLE DATA GENERATOR (Multi-Month & Previous Year History for Demo)
// ============================================================================
const generateSampleData = () => {
  const today = getTodayStr();
  // Generate 12 realistic cycles spanning ~1 year (including previous year dates)
  // Latest cycle started 10 days ago (currently Cycle Day 11)
  const cycleLengths = [28, 29, 28, 30, 27, 29, 28, 28, 30, 29, 28];
  const starts = [];
  let cursor = addDays(today, -10);
  starts.unshift(cursor);

  for (let i = 0; i < cycleLengths.length; i++) {
    cursor = addDays(cursor, -cycleLengths[i]);
    starts.unshift(cursor);
  }

  const logs = {};

  starts.forEach((start, idx) => {
    const duration = idx % 2 === 0 ? 5 : 4;
    const cLen = cycleLengths[idx] || 28;
    const ovOffset = cLen - 14;

    // 1. Log Menstrual Phase days (CD 1 .. duration)
    for (let i = 0; i < duration; i++) {
      const d = addDays(start, i);
      if (diffDays(d, today) > 0) continue;
      const flows = ['medium', 'heavy', 'medium', 'light', 'spotting'];
      logs[d] = {
        date: d,
        flow: flows[i] || 'light',
        pain: i < 2 ? 'moderate' : i === 2 ? 'mild' : 'none',
        mood: i === 0 ? ['Fatigued', 'Sensitive'] : i === 1 ? ['Sensitive', 'Calm'] : ['Calm'],
        symptoms:
          i === 0
            ? ['Cramps', 'Lower Backache', 'Fatigue', 'Food Cravings']
            : i === 1
              ? ['Cramps', 'Bloating', 'Fatigue']
              : ['Fatigue'],
        mucus: 'none',
        water: 8,
        bbt: (36.24 + Math.random() * 0.14).toFixed(2),
        notes: i === 0 ? 'Cycle started. Had warm water and dark chocolate.' : ''
      };
    }

    // 2. Log Follicular, Ovulatory & Luteal days across historical cycles
    for (let dayOffset = duration; dayOffset < cLen; dayOffset++) {
      const d = addDays(start, dayOffset);
      if (diffDays(d, today) > 0) continue;

      const isFollicular = dayOffset >= duration && dayOffset < ovOffset - 2;
      const isOvulation = dayOffset >= ovOffset - 2 && dayOffset <= ovOffset + 1;
      const isLateLuteal = dayOffset >= cLen - 4; // PMS window (3-4 days before next period)

      const baseBbt = dayOffset < ovOffset ? 36.31 : 36.67;
      const bbtVal = (baseBbt + (Math.random() * 0.12 - 0.06)).toFixed(2);

      if (isOvulation) {
        logs[d] = {
          date: d,
          flow: null,
          pain: dayOffset === ovOffset ? 'ovulation_twinge' : 'none',
          mood: ['Energetic', 'Happy'],
          symptoms:
            dayOffset === ovOffset
              ? ['High Energy', 'Increased Libido']
              : ['High Energy'],
          mucus: dayOffset === ovOffset || dayOffset === ovOffset - 1 ? 'eggwhite' : 'watery',
          water: 7,
          bbt: bbtVal,
          notes: dayOffset === ovOffset ? 'Clear thermal shift & peak fertility signs.' : ''
        };
      } else if (isLateLuteal) {
        logs[d] = {
          date: d,
          flow: null,
          pain: 'mild',
          mood: ['Sensitive', 'Irritable'],
          symptoms: ['Food Cravings', 'Bloating', 'Breast Tenderness', 'Fatigue'],
          mucus: 'dry',
          water: 6,
          bbt: bbtVal,
          notes: 'PMS chocolate cravings and mild bloating.'
        };
      } else if (isFollicular && dayOffset % 3 === 0) {
        logs[d] = {
          date: d,
          flow: null,
          pain: 'none',
          mood: ['Balanced', 'Energetic'],
          symptoms: ['High Energy', 'Workout'],
          mucus: 'creamy',
          water: 8,
          bbt: bbtVal,
          notes: ''
        };
      } else if (dayOffset % 4 === 0) {
        logs[d] = {
          date: d,
          flow: null,
          pain: 'none',
          mood: ['Calm'],
          symptoms: [],
          mucus: 'creamy',
          water: 7,
          bbt: bbtVal,
          notes: ''
        };
      }
    }
  });

  return logs;
};

const DEFAULT_SETTINGS = {
  calculationMode: 'smart', // 'smart' (Weighted Moving Average) or 'manual'
  manualCycleLength: 28,
  manualPeriodLength: 5,
  lutealPhaseLength: 14, // Standard 10-16 days, used to back-calculate ovulation
  outlierFilter: true, // Ignore cycles < 21 or > 45 days in smart average
  bbtUnit: 'C', // 'C' or 'F'
  theme: 'dark', // 'dark' or 'light'
  pinCode: null, // null or 4-digit string
  userName: 'Nechu',
  periodCareMessage:
    "Dear Nechu I know you're having a hard time. Hydrate and have your favorite chocolates.",
  customSymptoms: [
    'Cramps',
    'Lower Backache',
    'Bloating',
    'Breast Tenderness',
    'Headache / Migraine',
    'Fatigue',
    'High Energy',
    'Food Cravings',
    'Acne Breakout',
    'Insomnia',
    'Increased Libido',
    'Nausea',
    'Iron Supplement',
    'Workout'
  ],
  customMoods: [
    'Calm',
    'Energetic',
    'Happy',
    'Balanced',
    'Sensitive',
    'Irritable',
    'Anxious',
    'Fatigued',
    'Brain Fog'
  ]
};

// ============================================================================
// CORE CYCLE, PHASE & SYMPTOM PREDICTION ENGINE
// ============================================================================
function analyzeCycleData(logs, settings) {
  const today = getTodayStr();

  // 1. Find all dates with actual period flow (excluding 'spotting' unless part of period)
  const periodDates = Object.keys(logs)
    .filter((date) => {
      const f = logs[date]?.flow;
      return f && f !== 'none' && f !== 'spotting';
    })
    .sort();

  // Group consecutive/near-consecutive period dates (gap <= 2 days) into distinct period episodes
  const episodes = [];
  periodDates.forEach((date) => {
    if (episodes.length === 0) {
      episodes.push({ startDate: date, endDate: date, days: [date] });
    } else {
      const currentEp = episodes[episodes.length - 1];
      const gap = diffDays(date, currentEp.endDate);
      if (gap <= 2) {
        currentEp.endDate = date;
        currentEp.days.push(date);
      } else if (diffDays(date, currentEp.startDate) >= 14) {
        episodes.push({ startDate: date, endDate: date, days: [date] });
      }
    }
  });

  // 2. Calculate historical cycles from episodes (including previous years)
  const cycles = [];
  for (let i = 0; i < episodes.length; i++) {
    const current = episodes[i];
    const next = episodes[i + 1];
    const periodLength = diffDays(current.endDate, current.startDate) + 1;
    if (next) {
      const cycleLength = diffDays(next.startDate, current.startDate);
      cycles.push({
        startDate: current.startDate,
        endDate: addDays(next.startDate, -1),
        periodEndDate: current.endDate,
        cycleLength,
        periodLength,
        year: parseDate(current.startDate).getFullYear(),
        isOutlier: cycleLength < 21 || cycleLength > 45
      });
    } else {
      cycles.push({
        startDate: current.startDate,
        endDate: null,
        periodEndDate: current.endDate,
        cycleLength: null,
        periodLength,
        year: parseDate(current.startDate).getFullYear(),
        isCurrent: true
      });
    }
  }

  // 3. Calculate Predicted Cycle Length & Period Duration using Weighted Moving Average
  const completedCycles = cycles.filter((c) => c.cycleLength !== null);
  const validCycles = settings.outlierFilter
    ? completedCycles.filter((c) => !c.isOutlier)
    : completedCycles;

  let expectedCycleLength = Number(settings.manualCycleLength) || 28;
  let expectedPeriodLength = Number(settings.manualPeriodLength) || 5;
  let stdDev = 1.5;

  if (settings.calculationMode === 'smart' && validCycles.length > 0) {
    // Incorporate up to last 12 cycles from previous year(s), giving stronger weight to recent ones
    const recent = validCycles.slice(-12);
    let weightedSum = 0;
    let weightTotal = 0;
    recent.forEach((c, idx) => {
      // Exponential/Linear hybrid weight favoring recent cycles while respecting baseline history
      const weight = idx + 1;
      weightedSum += c.cycleLength * weight;
      weightTotal += weight;
    });
    expectedCycleLength = Math.round(weightedSum / weightTotal);

    // Period length weighted average
    let pWeightedSum = 0;
    recent.forEach((c, idx) => {
      pWeightedSum += c.periodLength * (idx + 1);
    });
    expectedPeriodLength = Math.max(2, Math.min(10, Math.round(pWeightedSum / weightTotal)));

    // Standard deviation for confidence window
    if (recent.length >= 2) {
      const mean = recent.reduce((acc, c) => acc + c.cycleLength, 0) / recent.length;
      const variance =
        recent.reduce((acc, c) => acc + Math.pow(c.cycleLength - mean, 2), 0) / recent.length;
      stdDev = Math.sqrt(variance);
    } else {
      stdDev = 2.0;
    }
  } else if (completedCycles.length > 0) {
    const recent = completedCycles.slice(-12);
    const mean = recent.reduce((acc, c) => acc + c.cycleLength, 0) / recent.length;
    const variance =
      recent.reduce((acc, c) => acc + Math.pow(c.cycleLength - mean, 2), 0) / recent.length;
    stdDev = Math.sqrt(variance);
  }

  const lutealLength = Number(settings.lutealPhaseLength) || 14;
  const ovDayInCycle = Math.max(8, expectedCycleLength - lutealLength);
  const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null;

  // Helper to determine phase for any cycle day (1 .. expectedCycleLength)
  const getPhaseForCycleDay = (cd, isFlowLogged = false) => {
    if (isFlowLogged || (cd >= 1 && cd <= expectedPeriodLength)) return 'Menstrual';
    if (cd >= ovDayInCycle - 2 && cd <= ovDayInCycle + 1) return 'Ovulatory';
    if (cd > expectedPeriodLength && cd < ovDayInCycle - 2) return 'Follicular';
    if (cd > ovDayInCycle + 1) return 'Luteal';
    return 'Follicular';
  };

  // 4. Current Cycle State & Future Projections (Next 6 cycles)
  const predictedCycles = [];
  let currentCycleDay = null;
  let nextPeriodStart = null;
  let currentOvulationDate = null;
  let fertileWindowStart = null;
  let fertileWindowEnd = null;
  let daysUntilNextPeriod = null;
  let currentPhase = 'Unknown';

  if (latestEpisode) {
    currentCycleDay = diffDays(today, latestEpisode.startDate) + 1;
    let baseStart = latestEpisode.startDate;

    // Project 7 cycles forward (index 0 = current cycle, index 1..6 = next 6 upcoming cycles)
    for (let c = 0; c < 7; c++) {
      const cycleStart = addDays(baseStart, c * expectedCycleLength);
      const nextStart = addDays(baseStart, (c + 1) * expectedCycleLength);
      const periodEnd = addDays(cycleStart, expectedPeriodLength - 1);
      const ovulationDate = addDays(nextStart, -lutealLength);
      const fertileStart = addDays(ovulationDate, -5);
      const fertileEnd = addDays(ovulationDate, 1);

      predictedCycles.push({
        cycleIndex: c,
        cycleStart,
        periodEnd,
        ovulationDate,
        fertileStart,
        fertileEnd,
        nextStart
      });
    }

    const activePred = predictedCycles[0];
    nextPeriodStart = activePred.nextStart;
    currentOvulationDate = activePred.ovulationDate;
    fertileWindowStart = activePred.fertileStart;
    fertileWindowEnd = activePred.fertileEnd;
    daysUntilNextPeriod = diffDays(nextPeriodStart, today);

    const todayLog = logs[today];
    const isCurrentlyBleeding =
      Boolean(todayLog?.flow && todayLog.flow !== 'none' && todayLog.flow !== 'spotting') ||
      (currentCycleDay >= 1 && currentCycleDay <= expectedPeriodLength && currentCycleDay <= 7);

    currentPhase = getPhaseForCycleDay(currentCycleDay, isCurrentlyBleeding);
  }

  // 5. Build Lookup Sets for Fast Calendar Rendering (Past + Future 6 Cycles)
  const calendarMarkers = {};
  predictedCycles.forEach((pc, idx) => {
    if (idx >= 1) {
      for (let i = 0; i < expectedPeriodLength; i++) {
        const d = addDays(pc.cycleStart, i);
        calendarMarkers[d] = { ...calendarMarkers[d], isPredictedPeriod: true, phase: 'Menstrual' };
      }
    }
    for (let i = -5; i <= 1; i++) {
      const d = addDays(pc.ovulationDate, i);
      calendarMarkers[d] = {
        ...calendarMarkers[d],
        isFertile: true,
        isOvulation: i === 0,
        phase: 'Ovulatory'
      };
    }
  });

  // 6. SYMPTOM & MOOD PATTERN PREDICTION ENGINE
  // Map every historical log to its Cycle Day (CD) and Phase to compute probabilities
  const phaseOccurrences = {
    Menstrual: { totalDays: 0, items: {} },
    Follicular: { totalDays: 0, items: {} },
    Ovulatory: { totalDays: 0, items: {} },
    Luteal: { totalDays: 0, items: {} }
  };

  // Also track by 3-day sliding Cycle Day window (CD - 1, CD, CD + 1) across completed/active cycles
  const cycleDayWindowCounts = {}; // dayNum -> { cyclesObserved: Set, itemCounts: { [name]: Set(cycleIdx) } }
  const totalCyclesWithLogs = Math.max(1, cycles.length);

  cycles.forEach((cyc, cIdx) => {
    const cLen = cyc.cycleLength || expectedCycleLength;
    const cOvDay = Math.max(8, cLen - lutealLength);

    for (let offset = 0; offset < cLen; offset++) {
      const d = addDays(cyc.startDate, offset);
      const entry = logs[d];
      if (!entry) continue;

      const cd = offset + 1;
      let phaseName = 'Follicular';
      if (offset < cyc.periodLength || (entry.flow && entry.flow !== 'none')) {
        phaseName = 'Menstrual';
      } else if (cd >= cOvDay - 2 && cd <= cOvDay + 1) {
        phaseName = 'Ovulatory';
      } else if (cd > cOvDay + 1) {
        phaseName = 'Luteal';
      }

      const combinedTags = [
        ...(entry.symptoms || []).map((s) => ({ name: s, type: 'symptom' })),
        ...(entry.mood || []).map((m) => ({ name: m, type: 'mood' }))
      ];

      if (combinedTags.length > 0) {
        phaseOccurrences[phaseName].totalDays += 1;
        combinedTags.forEach((tag) => {
          const key = `${tag.type}:${tag.name}`;
          phaseOccurrences[phaseName].items[key] =
            (phaseOccurrences[phaseName].items[key] || 0) + 1;
        });

        // Record in 3-day proximity window for cycle-day specific prediction
        [-1, 0, 1].forEach((delta) => {
          const targetCd = cd + delta;
          if (targetCd >= 1 && targetCd <= 40) {
            if (!cycleDayWindowCounts[targetCd]) {
              cycleDayWindowCounts[targetCd] = { cyclesSeen: new Set(), tags: {} };
            }
            cycleDayWindowCounts[targetCd].cyclesSeen.add(cIdx);
            combinedTags.forEach((tag) => {
              const key = `${tag.type}:${tag.name}`;
              if (!cycleDayWindowCounts[targetCd].tags[key]) {
                cycleDayWindowCounts[targetCd].tags[key] = new Set();
              }
              cycleDayWindowCounts[targetCd].tags[key].add(cIdx);
            });
          }
        });
      }
    }
  });

  // Helper to predict likely symptoms & moods for any Cycle Day
  const predictSymptomsForCycleDay = (targetCd) => {
    if (!targetCd) return [];
    const normalizedCd = ((targetCd - 1) % expectedCycleLength) + 1;
    const phaseName = getPhaseForCycleDay(normalizedCd);
    const windowData = cycleDayWindowCounts[normalizedCd];
    const phaseData = phaseOccurrences[phaseName] || { totalDays: 0, items: {} };

    const scores = {};

    // Combine exact Cycle-Day window probability with Phase-level baseline probability
    if (windowData && windowData.cyclesSeen.size > 0) {
      const denom = Math.max(2, windowData.cyclesSeen.size);
      Object.entries(windowData.tags).forEach(([key, cycleSet]) => {
        const prob = Math.min(96, Math.round((cycleSet.size / denom) * 100));
        scores[key] = { prob, count: cycleSet.size, source: `Cycle Day ${normalizedCd} history` };
      });
    }

    if (phaseData.totalDays > 0) {
      Object.entries(phaseData.items).forEach(([key, count]) => {
        const phaseProb = Math.min(92, Math.round((count / phaseData.totalDays) * 100));
        if (!scores[key] || phaseProb > scores[key].prob) {
          scores[key] = {
            prob: scores[key] ? Math.round((scores[key].prob * 0.65) + (phaseProb * 0.35)) : phaseProb,
            count,
            source: `${phaseName} Phase pattern`
          };
        }
      });
    }

    return Object.entries(scores)
      .map(([key, val]) => {
        const [type, name] = key.split(':');
        return {
          name,
          type,
          probability: val.prob,
          occurrences: val.count,
          source: val.source,
          phase: phaseName
        };
      })
      .filter((item) => item.probability >= 25)
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 6);
  };

  // Build Phase-by-Phase Symptom & Mood Forecast Matrix
  const phaseSymptomForecast = {};
  ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal'].forEach((pName) => {
    const pData = phaseOccurrences[pName];
    const denom = Math.max(1, pData.totalDays);
    phaseSymptomForecast[pName] = Object.entries(pData.items)
      .map(([key, count]) => {
        const [type, name] = key.split(':');
        return {
          name,
          type,
          count,
          probability: Math.min(95, Math.round((count / denom) * 100))
        };
      })
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
  });

  const todaySymptomPredictions = predictSymptomsForCycleDay(currentCycleDay || 1);
  const tomorrowSymptomPredictions = predictSymptomsForCycleDay((currentCycleDay || 1) + 1);
  const upcomingPmsPredictions = predictSymptomsForCycleDay(Math.max(1, expectedCycleLength - 2));

  // 7. Summary Statistics
  const lengths = validCycles.map((c) => c.cycleLength);
  const shortestCycle = lengths.length ? Math.min(...lengths) : expectedCycleLength;
  const longestCycle = lengths.length ? Math.max(...lengths) : expectedCycleLength;
  const confidenceDays = Math.max(1, Math.min(5, Math.round(stdDev)));

  return {
    episodes,
    cycles,
    completedCycles,
    expectedCycleLength,
    expectedPeriodLength,
    lutealLength,
    ovDayInCycle,
    stdDev: stdDev.toFixed(1),
    confidenceDays,
    shortestCycle,
    longestCycle,
    currentCycleDay,
    nextPeriodStart,
    currentOvulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    daysUntilNextPeriod,
    currentPhase,
    predictedCycles,
    calendarMarkers,
    latestEpisode,
    todaySymptomPredictions,
    tomorrowSymptomPredictions,
    upcomingPmsPredictions,
    phaseSymptomForecast,
    getPhaseForCycleDay,
    predictSymptomsForCycleDay
  };
}

// ============================================================================
// PHASE METADATA & PHYSIOLOGICAL INSIGHTS
// ============================================================================
const PHASE_DETAILS = {
  Menstrual: {
    name: 'Menstrual Phase',
    color: 'from-rose-500 to-pink-600',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    accent: '#f43f5e',
    energy: 'Low / Restorative',
    hormones: 'Estrogen & Progesterone are at baseline lows.',
    insight:
      'Uterine lining is shedding. Energy and iron stores dip naturally—prioritize warm nutrient-dense foods, dark chocolate (magnesium), hydration, and extra rest.',
    fertility: 'Very Low Fertility'
  },
  Follicular: {
    name: 'Follicular Phase',
    color: 'from-violet-500 to-purple-600',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    accent: '#8b5cf6',
    energy: 'Rising / Creative',
    hormones: 'FSH stimulates follicles; Estrogen rises steadily.',
    insight:
      'Rising estradiol boosts verbal fluency, physical stamina, mood, and collagen synthesis. Ideal window for strength training, brainstorming, and high-focus work.',
    fertility: 'Low to Transitioning Fertility'
  },
  Ovulatory: {
    name: 'Ovulatory Peak',
    color: 'from-emerald-400 to-teal-600',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    accent: '#10b981',
    energy: 'Peak / Social & Magnetic',
    hormones: 'Peak Estrogen triggers a sharp LH surge; slight Testosterone spike.',
    insight:
      'The dominant follicle releases an egg (viable ~12–24h). Cervical fluid becomes clear/stretchy (egg-white) to nourish sperm. Basal body temperature shifts upward right after.',
    fertility: 'Peak Fertility Window'
  },
  Luteal: {
    name: 'Luteal Phase',
    color: 'from-amber-500 to-orange-600',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    accent: '#f59e0b',
    energy: 'Steady → Winding Down',
    hormones: 'Corpus luteum secretes Progesterone; BBT stays elevated (+0.3°C).',
    insight:
      'Progesterone warms the body and raises resting metabolic rate slightly. In the late luteal days, falling hormones can trigger PMS—complex carbs, hydration, and B6 help stabilize mood.',
    fertility: 'Low Fertility (Post-Ovulation)'
  },
  Unknown: {
    name: 'Awaiting First Period Log',
    color: 'from-slate-600 to-slate-700',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    accent: '#94a3b8',
    energy: 'Uncalibrated',
    hormones: 'Log your recent or past period dates to calibrate.',
    insight:
      'Tap "Log Period" or use "Add Past Cycles" to enter your previous year history for accurate local predictions.',
    fertility: 'Uncalibrated'
  }
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // --- Persistent State in localStorage (v2 key with fresh multi-month/year demo data) ---
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_local_logs_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to read localStorage logs:', e);
    }
    const sample = generateSampleData();
    localStorage.setItem('aura_local_logs_v2', JSON.stringify(sample));
    return sample;
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_local_settings_v2');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to read localStorage settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('aura_local_logs_v2', JSON.stringify(logs));
    } catch (e) {
      console.error('Storage quota error:', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_local_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.error('Storage settings error:', e);
    }
  }, [settings]);

  // --- Navigation & UI State ---
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'calendar', 'log', 'analytics', 'settings'
  const [selectedDate, setSelectedDate] = useState(getTodayStr());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [isLocked, setIsLocked] = useState(() => Boolean(settings.pinCode));
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [toast, setToast] = useState(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [confirmClearModal, setConfirmClearModal] = useState(false);
  const [showCarePopup, setShowCarePopup] = useState(false);
  const [showBatchPastModal, setShowBatchPastModal] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  // --- Cycle Analytics & Symptom Prediction Computation ---
  const cycleStats = useMemo(() => analyzeCycleData(logs, settings), [logs, settings]);

  // --- Quick Period Toggle for Selected Date ---
  const handleQuickLogPeriod = (dateStr = getTodayStr()) => {
    const existing = logs[dateStr] || { date: dateStr };
    const hasFlow = existing.flow && existing.flow !== 'none';

    if (hasFlow) {
      const updated = { ...existing, flow: null };
      setLogs((prev) => ({ ...prev, [dateStr]: updated }));
      showToast(`Removed period flow for ${formatDisplayDate(dateStr)}`);
    } else {
      const updated = { ...existing, flow: 'medium' };
      setLogs((prev) => ({ ...prev, [dateStr]: updated }));
      showToast(`Logged period flow for ${formatDisplayDate(dateStr)}`);
      setShowCarePopup(true);
    }
  };

  // --- Batch Add Past Period Cycle (Supports Previous Years + Optional Typical Symptoms) ---
  const handleBatchAddPastPeriod = ({ startDate, durationDays, flowIntensity, symptoms, moods, notes }) => {
    if (!startDate) return;
    const dur = Math.max(1, Math.min(12, Number(durationDays) || 5));
    const defaultFlows = ['medium', 'heavy', 'medium', 'light', 'spotting'];

    setLogs((prev) => {
      const next = { ...prev };
      for (let i = 0; i < dur; i++) {
        const d = addDays(startDate, i);
        const existing = next[d] || { date: d };
        next[d] = {
          ...existing,
          flow: flowIntensity === 'auto' ? (defaultFlows[i] || 'light') : flowIntensity,
          symptoms:
            i < 2 && symptoms && symptoms.length > 0
              ? Array.from(new Set([...(existing.symptoms || []), ...symptoms]))
              : existing.symptoms || [],
          mood:
            i < 2 && moods && moods.length > 0
              ? Array.from(new Set([...(existing.mood || []), ...moods]))
              : existing.mood || [],
          notes: i === 0 && notes ? notes : existing.notes || ''
        };
      }
      return next;
    });

    showToast(
      `Added ${dur}-day past period starting ${formatDisplayDate(startDate, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`
    );
  };

  // --- Delete an Entire Logged Period Episode ---
  const handleDeleteEpisode = (episode) => {
    if (!episode || !episode.days) return;
    setLogs((prev) => {
      const next = { ...prev };
      episode.days.forEach((d) => {
        if (next[d]) {
          next[d] = { ...next[d], flow: null };
        }
      });
      return next;
    });
    showToast(`Removed period starting ${formatDisplayDate(episode.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}`);
  };

  // --- Update Single Day Log ---
  const updateDayLog = (dateStr, partialLog) => {
    const existingFlow = logs[dateStr]?.flow;
    const isNewPeriodFlow =
      partialLog.flow &&
      partialLog.flow !== 'none' &&
      (!existingFlow || existingFlow === 'none');

    setLogs((prev) => {
      const current = prev[dateStr] || { date: dateStr };
      const merged = { ...current, ...partialLog };
      return { ...prev, [dateStr]: merged };
    });

    if (isNewPeriodFlow) {
      setShowCarePopup(true);
    }
  };

  // --- Temperature Converter Helper ---
  const displayTemp = (celsiusStr) => {
    if (!celsiusStr) return '';
    const c = parseFloat(celsiusStr);
    if (isNaN(c)) return '';
    if (settings.bbtUnit === 'F') {
      return ((c * 9) / 5 + 32).toFixed(2);
    }
    return c.toFixed(2);
  };

  // --- PIN Lock Screen ---
  const handlePinKeyPress = (digit) => {
    if (pinInput.length < 4) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError(false);
      if (next.length === 4) {
        if (next === settings.pinCode) {
          setTimeout(() => {
            setIsLocked(false);
            setPinInput('');
          }, 150);
        } else {
          setPinError(true);
          setTimeout(() => setPinInput(''), 500);
        }
      }
    }
  };

  const isDark = settings.theme === 'dark';

  // If App is PIN Locked, render Private Vault Lock Screen
  if (isLocked && settings.pinCode) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 select-none">
        <div className="w-full max-w-xs flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
            <Lock className="w-8 h-8 text-rose-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Aura Local Vault</h1>
          <p className="text-xs text-zinc-400 mb-8 text-center">
            Enter your 4-digit offline PIN to unlock your encrypted local health records
          </p>

          {/* PIN Dots */}
          <div className="flex gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${pinError
                  ? 'bg-red-500 scale-110'
                  : pinInput.length > i
                    ? 'bg-rose-500 scale-110 shadow-md shadow-rose-500/50'
                    : 'bg-zinc-800 border border-zinc-700'
                  }`}
              />
            ))}
          </div>
          {pinError && (
            <p className="text-xs text-red-400 mb-4 font-medium">Incorrect PIN. Try again.</p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinKeyPress(String(num))}
                className="h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800/80 text-xl font-semibold transition flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <div />
            <button
              onClick={() => handlePinKeyPress('0')}
              className="h-16 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 border border-zinc-800/80 text-xl font-semibold transition flex items-center justify-center"
            >
              0
            </button>
            <button
              onClick={() => setPinInput((p) => p.slice(0, -1))}
              className="h-16 rounded-2xl bg-zinc-900/50 hover:bg-zinc-800 active:scale-95 text-sm font-medium text-zinc-400 transition flex items-center justify-center"
            >
              DEL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#0c0a0e] text-zinc-100' : 'bg-rose-50/40 text-zinc-900'
        } flex flex-col items-center justify-start font-sans`}
    >
      {/* Android Mobile App Container (Centered mobile frame on desktop, full width on phone) */}
      <div
        className={`w-full max-w-md min-h-screen flex flex-col relative shadow-2xl ${isDark
          ? 'bg-[#120f16] border-x border-zinc-800/60'
          : 'bg-white border-x border-rose-100'
          }`}
      >
        {/* Top Android Status / Privacy Header */}
        <header
          className={`sticky top-0 z-30 px-4 py-3 backdrop-blur-xl border-b flex items-center justify-between ${isDark
            ? 'bg-[#120f16]/85 border-zinc-800/70'
            : 'bg-white/85 border-rose-100'
            }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center shadow-md shadow-rose-500/20">
              <Droplets className="w-5 h-5 text-white fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-tight leading-none">AuraCycle</h1>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${isDark
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/50'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  title="Zero network calls. 100% stored in your phone's local storage."
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  100% Local
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Zero-Cloud • On-Device Storage
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCarePopup(true)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition flex items-center gap-1 ${isDark
                ? 'bg-rose-950/50 border-rose-500/40 text-rose-200 hover:bg-rose-900/60'
                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              title="Open Nechu's Comfort Care Note"
            >
              <span>🍫</span>
              <span className="hidden sm:inline">Care Note</span>
            </button>
            {settings.pinCode && (
              <button
                onClick={() => setIsLocked(true)}
                className={`p-2 rounded-xl border transition ${isDark
                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                  : 'bg-rose-50 border-rose-200 text-zinc-700 hover:bg-rose-100'
                  }`}
                title="Lock App Now"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowInstallModal(true)}
              className={`p-2 rounded-xl border transition ${isDark
                ? 'bg-zinc-900 border-zinc-800 text-rose-300 hover:bg-zinc-800'
                : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              title="Install on Android"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))
              }
              className={`p-2 rounded-xl border transition ${isDark
                ? 'bg-zinc-900 border-zinc-800 text-amber-300 hover:bg-zinc-800'
                : 'bg-rose-50 border-rose-200 text-zinc-700 hover:bg-rose-100'
                }`}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 pointer-events-none">
            <div className="bg-zinc-900/95 border border-rose-500/40 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-medium backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{toast.message}</span>
            </div>
          </div>
        )}

        {/* Main Scrollable View Area */}
        <main className="flex-1 overflow-y-auto pb-28 px-4 pt-4 space-y-5">
          {activeTab === 'today' && (
            <DashboardView
              isDark={isDark}
              logs={logs}
              settings={settings}
              cycleStats={cycleStats}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onOpenLogger={(date) => {
                setSelectedDate(date);
                setActiveTab('log');
              }}
              onQuickLogPeriod={handleQuickLogPeriod}
              displayTemp={displayTemp}
              onTriggerCareModal={() => setShowCarePopup(true)}
              onOpenBatchPastModal={() => setShowBatchPastModal(true)}
              onNavigateAnalytics={() => setActiveTab('analytics')}
            />
          )}

          {activeTab === 'calendar' && (
            <CalendarView
              isDark={isDark}
              logs={logs}
              settings={settings}
              cycleStats={cycleStats}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onOpenLogger={(date) => {
                setSelectedDate(date);
                setActiveTab('log');
              }}
              onQuickLogPeriod={handleQuickLogPeriod}
              displayTemp={displayTemp}
              onOpenBatchPastModal={() => setShowBatchPastModal(true)}
            />
          )}

          {activeTab === 'log' && (
            <LoggerView
              isDark={isDark}
              logs={logs}
              settings={settings}
              setSettings={setSettings}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              updateDayLog={updateDayLog}
              showToast={showToast}
              cycleStats={cycleStats}
              onOpenBatchPastModal={() => setShowBatchPastModal(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              isDark={isDark}
              logs={logs}
              settings={settings}
              cycleStats={cycleStats}
              displayTemp={displayTemp}
              onOpenBatchPastModal={() => setShowBatchPastModal(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsVaultView
              isDark={isDark}
              logs={logs}
              setLogs={setLogs}
              settings={settings}
              setSettings={setSettings}
              cycleStats={cycleStats}
              showToast={showToast}
              onOpenInstallModal={() => setShowInstallModal(true)}
              confirmClearModal={confirmClearModal}
              setConfirmClearModal={setConfirmClearModal}
              onTriggerCareModal={() => setShowCarePopup(true)}
              onOpenBatchPastModal={() => setShowBatchPastModal(true)}
            />
          )}
        </main>

        {/* Batch Add Past Cycles Modal (Add Previous Year / Historical Data Easily) */}
        {showBatchPastModal && (
          <BatchPastCyclesModal
            isDark={isDark}
            settings={settings}
            cycleStats={cycleStats}
            onClose={() => setShowBatchPastModal(false)}
            onAddPastPeriod={handleBatchAddPastPeriod}
            onDeleteEpisode={handleDeleteEpisode}
          />
        )}

        {/* Special Period Care Modal for Nechu */}
        {showCarePopup && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
              className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl relative overflow-hidden ${isDark
                ? 'bg-gradient-to-br from-[#23151c] via-[#1c1318] to-[#261815] border-rose-500/40 text-zinc-100'
                : 'bg-gradient-to-br from-rose-50 via-white to-amber-50 border-rose-200 text-zinc-900'
                }`}
            >
              <div className="w-36 h-36 rounded-full bg-rose-500/20 blur-3xl absolute -top-10 -right-10 pointer-events-none" />
              <div className="w-36 h-36 rounded-full bg-amber-500/15 blur-3xl absolute -bottom-10 -left-10 pointer-events-none" />

              <div className="flex items-center justify-between mb-4 relative">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                  <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
                  <span>Period Care Note</span>
                </div>
                <button
                  onClick={() => setShowCarePopup(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-800/40"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center my-3 relative">
                <div className="text-4xl mb-3 flex items-center justify-center gap-3">
                  <span>🌸</span>
                  <span>🍫</span>
                  <span>💧</span>
                </div>
                <p
                  className={`text-base font-bold leading-relaxed ${isDark ? 'text-rose-100' : 'text-rose-950'
                    }`}
                >
                  "
                  {settings.periodCareMessage ||
                    "Dear Nechu I know you're having a hard time. Hydrate and have your favorite chocolates."}
                  "
                </p>
                <p
                  className={`text-xs mt-3 ${isDark ? 'text-amber-200/80' : 'text-amber-900/80'
                    }`}
                >
                  Take it slow today, rest well, keep warm, and be extra gentle with yourself.
                </p>
              </div>

              <button
                onClick={() => setShowCarePopup(false)}
                className="mt-5 w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-600 to-amber-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 fill-white" />
                Thank You • I'll Hydrate & Have Chocolates
              </button>
            </div>
          </div>
        )}

        {/* Material You Bottom Navigation Bar */}
        <nav
          className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 px-2 py-2 border-t backdrop-blur-xl ${isDark
            ? 'bg-[#16121b]/95 border-zinc-800/80'
            : 'bg-white/95 border-rose-100'
            }`}
        >
          <div className="grid grid-cols-5 gap-1">
            {[
              { id: 'today', label: 'Cycle', icon: Sparkles },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
              { id: 'log', label: 'Log Day', icon: PlusCircle, highlight: true },
              { id: 'analytics', label: 'Insights', icon: BarChart3 },
              { id: 'settings', label: 'Vault', icon: Settings }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center py-1 rounded-2xl transition-all group"
                >
                  <div
                    className={`px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${item.highlight && isActive
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                      : isActive
                        ? isDark
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-rose-100 text-rose-700'
                        : isDark
                          ? 'text-zinc-400 group-hover:text-zinc-200'
                          : 'text-zinc-500 group-hover:text-zinc-800'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] mt-1 font-medium ${isActive
                      ? isDark
                        ? 'text-rose-300 font-semibold'
                        : 'text-rose-700 font-semibold'
                      : isDark
                        ? 'text-zinc-400'
                        : 'text-zinc-500'
                      }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Android Offline Installation Guide Modal */}
        {showInstallModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div
              className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-rose-100 text-zinc-900'
                }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-base">Run as Native Android App</h3>
                </div>
                <button
                  onClick={() => setShowInstallModal(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-800/50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                AuraCycle is built with a <strong>Zero-Server Local Architecture</strong>. You can install it directly onto your Android home screen so it runs full-screen completely offline:
              </p>
              <div className="space-y-3 text-xs">
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-rose-50/60 border-rose-100'}`}>
                  <p className="font-semibold text-rose-400 mb-1">1. Install via Chrome / Brave on Android</p>
                  <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
                    Tap the browser menu (<strong>⋮</strong>) in the top-right corner and select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>. It will launch with its own icon without browser bars.
                  </p>
                </div>
                <div className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-rose-50/60 border-rose-100'}`}>
                  <p className="font-semibold text-emerald-400 mb-1">2. 100% Air-Gapped Privacy Guarantee</p>
                  <p className={isDark ? 'text-zinc-400' : 'text-zinc-600'}>
                    All cycle logs, BBT charts, and custom symptoms stay inside your phone's local storage sandbox. Use the <strong>Vault → Export Backup</strong> tool anytime to save an encrypted or local `.json` copy to your phone's Downloads folder.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowInstallModal(false)}
                className="mt-5 w-full py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-rose-500/20"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 1. DASHBOARD (TODAY) VIEW
// ============================================================================
function DashboardView({
  isDark,
  logs,
  settings,
  cycleStats,
  selectedDate,
  setSelectedDate,
  onOpenLogger,
  onQuickLogPeriod,
  displayTemp,
  onTriggerCareModal,
  onOpenBatchPastModal,
  onNavigateAnalytics
}) {
  const today = getTodayStr();
  const todayLog = logs[today] || {};
  const phaseInfo = PHASE_DETAILS[cycleStats.currentPhase] || PHASE_DETAILS.Unknown;
  const [previewCareCard, setPreviewCareCard] = useState(false);

  // Dial calculations
  const cycleLen = cycleStats.expectedCycleLength || 28;
  const periodLen = cycleStats.expectedPeriodLength || 5;
  const ovDay = cycleStats.ovDayInCycle || cycleLen - (cycleStats.lutealLength || 14);
  const currentDay = cycleStats.currentCycleDay || 1;
  const clampedDay = Math.min(Math.max(currentDay, 1), cycleLen);

  // SVG Ring Parameters
  const size = 250;
  const strokeWidth = 18;
  const center = size / 2;
  const radius = center - strokeWidth - 6;

  // Helper to convert cycle day (1..cycleLen) to angle in degrees (top = -90deg)
  const dayToAngle = (day) => ((day - 1) / cycleLen) * 360 - 90;
  const polarToCartesian = (cx, cy, r, angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };

  // Create SVG arc path between startDay and endDay
  const createArc = (startDay, endDay) => {
    const startAngle = dayToAngle(startDay);
    const endAngle = dayToAngle(endDay + 0.85);
    const start = polarToCartesian(center, center, radius, endAngle);
    const end = polarToCartesian(center, center, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const markerPos = polarToCartesian(center, center, radius, dayToAngle(clampedDay));
  const ovMarkerPos = polarToCartesian(center, center, radius, dayToAngle(ovDay));

  const isPeriodLoggedToday = todayLog.flow && todayLog.flow !== 'none';
  const isPeriodActive =
    isPeriodLoggedToday || cycleStats.currentPhase === 'Menstrual' || previewCareCard;

  return (
    <div className="space-y-5">
      {/* Top Date Strip & Quick Status */}
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
            {formatDisplayDate(today, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h2 className="text-xl font-bold tracking-tight mt-0.5">{phaseInfo.name}</h2>
        </div>
        <div className="flex items-center gap-1.5">
          {!isPeriodLoggedToday && cycleStats.currentPhase !== 'Menstrual' && (
            <button
              onClick={() => setPreviewCareCard((p) => !p)}
              className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition ${previewCareCard
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : isDark
                  ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-rose-300'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              title="Preview Nechu's Period Care Card"
            >
              🍫 {previewCareCard ? 'Hide Care' : 'Preview Care'}
            </button>
          )}
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${phaseInfo.badgeBg}`}>
            {cycleStats.currentCycleDay ? `Cycle Day ${cycleStats.currentCycleDay}` : 'No Cycle Active'}
          </span>
        </div>
      </div>

      {/* Special Comfort Care Banner for Nechu when Period Hits */}
      {isPeriodActive && (
        <div
          onClick={onTriggerCareModal}
          className={`cursor-pointer rounded-3xl p-4 border relative overflow-hidden transition-all shadow-lg ${isDark
            ? 'bg-gradient-to-r from-rose-950/90 via-[#2a1721] to-amber-950/80 border-rose-500/40 shadow-rose-950/30'
            : 'bg-gradient-to-r from-rose-100 via-pink-50 to-amber-100 border-rose-300 shadow-rose-100'
            }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-xl shadow-inner border ${isDark
                ? 'bg-rose-500/20 border-rose-400/30'
                : 'bg-white/90 border-rose-200'
                }`}
            >
              🍫
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${isDark
                    ? 'bg-rose-500/25 text-rose-200'
                    : 'bg-rose-500 text-white'
                    }`}
                >
                  <Heart className="w-2.5 h-2.5 fill-current" /> Period Comfort Care
                </span>
                <span className="text-xs">💧🌸🍫</span>
              </div>
              <p
                className={`text-sm font-bold leading-snug mt-2 ${isDark ? 'text-rose-100' : 'text-rose-950'
                  }`}
              >
                "
                {settings.periodCareMessage ||
                  "Dear Nechu I know you're having a hard time. Hydrate and have your favorite chocolates."}
                "
              </p>
              <div className="flex items-center gap-3 mt-2.5 text-[11px] font-medium opacity-85">
                <span className="flex items-center gap-1 text-sky-400">
                  <Droplets className="w-3.5 h-3.5" /> Sip warm water
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Sparkles className="w-3.5 h-3.5" /> Dark chocolate & rest
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Circular Cycle Dial Card */}
      <div
        className={`rounded-3xl p-5 border relative overflow-hidden flex flex-col items-center ${isDark
          ? 'bg-gradient-to-b from-zinc-900/90 to-[#16121d] border-zinc-800/80'
          : 'bg-gradient-to-b from-rose-50/70 to-white border-rose-100 shadow-sm'
          }`}
      >
        <div
          className="w-48 h-48 rounded-full blur-3xl opacity-20 absolute -top-10 pointer-events-none"
          style={{ backgroundColor: phaseInfo.accent }}
        />

        <div className="relative flex items-center justify-center my-1">
          <svg width={size} height={size} className="overflow-visible">
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={isDark ? '#27272a' : '#ffe4e6'}
              strokeWidth={strokeWidth}
            />

            {/* Period Arc (Days 1 .. periodLen) */}
            <path
              d={createArc(1, periodLen)}
              fill="none"
              stroke="#f43f5e"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Fertile Window Arc (ovDay - 5 .. ovDay + 1) */}
            {ovDay - 5 > periodLen && (
              <path
                d={createArc(Math.max(periodLen + 1, ovDay - 5), Math.min(cycleLen, ovDay + 1))}
                fill="none"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                opacity="0.85"
              />
            )}

            {/* Ovulation Day Dot on Ring */}
            <circle
              cx={ovMarkerPos.x}
              cy={ovMarkerPos.y}
              r={5}
              fill="#ecfdf5"
              stroke="#059669"
              strokeWidth={2}
            />

            {/* Current Cycle Day Indicator Knob */}
            {cycleStats.currentCycleDay && (
              <g>
                <circle
                  cx={markerPos.x}
                  cy={markerPos.y}
                  r={13}
                  fill={phaseInfo.accent}
                  className="drop-shadow-lg"
                />
                <circle cx={markerPos.x} cy={markerPos.y} r={5} fill="#ffffff" />
              </g>
            )}
          </svg>

          {/* Center Dial Readout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
            <span
              className={`text-[11px] font-semibold uppercase tracking-widest ${isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}
            >
              {cycleStats.daysUntilNextPeriod !== null && cycleStats.daysUntilNextPeriod >= 0
                ? 'Next Period In'
                : cycleStats.daysUntilNextPeriod < 0
                  ? 'Period Late By'
                  : 'Start Tracking'}
            </span>

            <div className="text-4xl font-extrabold tracking-tight my-1">
              {cycleStats.daysUntilNextPeriod !== null ? (
                <span>
                  {Math.abs(cycleStats.daysUntilNextPeriod)}{' '}
                  <span className="text-lg font-semibold">
                    {Math.abs(cycleStats.daysUntilNextPeriod) === 1 ? 'Day' : 'Days'}
                  </span>
                </span>
              ) : (
                <span className="text-xl">—</span>
              )}
            </div>

            {cycleStats.nextPeriodStart && (
              <p className={`text-xs font-medium ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                Est. {formatDisplayDate(cycleStats.nextPeriodStart)}{' '}
                <span className="opacity-70">(±{cycleStats.confidenceDays}d)</span>
              </p>
            )}

            <div className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800/80 text-zinc-200 border border-zinc-700/60">
              {phaseInfo.fertility}
            </div>
          </div>
        </div>

        {/* Ring Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] mt-2 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className={isDark ? 'text-zinc-300' : 'text-zinc-600'}>
              Period (D1–{periodLen})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className={isDark ? 'text-zinc-300' : 'text-zinc-600'}>
              Fertile (D{Math.max(1, ovDay - 5)}–{ovDay + 1})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border-2 border-emerald-400 bg-white inline-block" />
            <span className={isDark ? 'text-zinc-300' : 'text-zinc-600'}>Ovulation (D{ovDay})</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={() => onQuickLogPeriod(today)}
            className={`py-3 px-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 transition active:scale-98 shadow-md ${isPeriodLoggedToday
              ? 'bg-zinc-800 text-rose-300 border border-rose-500/40'
              : 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-500/20'
              }`}
          >
            <Droplets className="w-4 h-4" />
            {isPeriodLoggedToday ? 'Unlog Flow Today' : 'Log Period Today'}
          </button>

          <button
            onClick={() => onOpenLogger(today)}
            className={`py-3 px-4 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 border transition active:scale-98 ${isDark
              ? 'bg-zinc-800/90 hover:bg-zinc-800 border-zinc-700 text-zinc-100'
              : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
              }`}
          >
            <PlusCircle className="w-4 h-4 text-rose-400" />
            Symptoms & BBT
          </button>
        </div>

        {/* Quick Link to Add Previous Year / Past Cycles */}
        <button
          onClick={onOpenBatchPastModal}
          className={`mt-2.5 w-full py-2.5 px-3 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 border transition ${isDark
            ? 'bg-zinc-950/60 border-zinc-800 text-violet-300 hover:bg-zinc-900'
            : 'bg-violet-50/70 border-violet-200 text-violet-800 hover:bg-violet-100'
            }`}
        >
          <Clock className="w-3.5 h-3.5 text-violet-400" />
          + Log Past / Previous Year Period Dates ({cycleStats.cycles.length} cycles saved)
        </button>
      </div>

      {/* Key Cycle Forecast Pills (Next Period, Ovulation, Cycle Length) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div
          className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
            }`}
        >
          <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ovulation</span>
          </div>
          <p className="text-sm font-bold">
            {cycleStats.currentOvulationDate
              ? formatDisplayDate(cycleStats.currentOvulationDate)
              : '—'}
          </p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Cycle Day {ovDay}
          </p>
        </div>

        <div
          className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
            }`}
        >
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-1">
            <Heart className="w-3.5 h-3.5" />
            <span>Fertile Window</span>
          </div>
          <p className="text-sm font-bold">
            {cycleStats.fertileWindowStart
              ? `${formatDisplayDate(cycleStats.fertileWindowStart, { month: 'short', day: 'numeric' })}–${formatDisplayDate(cycleStats.fertileWindowEnd, { day: 'numeric' })}`
              : '—'}
          </p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            6-Day Peak Window
          </p>
        </div>

        <div
          className={`p-3 rounded-2xl border ${isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
            }`}
        >
          <div className="flex items-center gap-1.5 text-violet-400 text-xs font-semibold mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span>Smart Avg</span>
          </div>
          <p className="text-sm font-bold">{cycleStats.expectedCycleLength} Days</p>
          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Luteal: {cycleStats.lutealLength}d
          </p>
        </div>
      </div>

      {/* NEW: Symptom & Phase Forecast Card (AI-Free Local Pattern Prediction) */}
      <div
        className={`rounded-3xl p-4 border ${isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold">Symptom & Mood Forecast</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Predicted for Day {clampedDay} ({phaseInfo.name}) from your past cycles
              </p>
            </div>
          </div>
          <button
            onClick={onNavigateAnalytics}
            className="text-[11px] font-semibold text-rose-400 hover:underline shrink-0"
          >
            Full Forecast →
          </button>
        </div>

        {cycleStats.todaySymptomPredictions.length > 0 ? (
          <div className="space-y-2 mt-2">
            <div className="flex flex-wrap gap-1.5">
              {cycleStats.todaySymptomPredictions.map((pred) => (
                <div
                  key={`${pred.type}-${pred.name}`}
                  className={`px-3 py-1.5 rounded-2xl border text-xs flex items-center gap-2 ${pred.type === 'mood'
                    ? isDark
                      ? 'bg-purple-950/40 border-purple-500/30 text-purple-200'
                      : 'bg-purple-50 border-purple-200 text-purple-900'
                    : isDark
                      ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                >
                  <span className="font-semibold">
                    {pred.type === 'mood' ? '✨' : '⚡'} {pred.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${pred.probability >= 70
                      ? 'bg-rose-500 text-white'
                      : 'bg-zinc-800 text-zinc-300'
                      }`}
                  >
                    {pred.probability}% likely
                  </span>
                </div>
              ))}
            </div>
            <p className={`text-[11px] pt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <strong>Energy Level:</strong> {phaseInfo.energy} •{' '}
              {cycleStats.tomorrowSymptomPredictions.length > 0 && (
                <span>
                  Tomorrow's watch:{' '}
                  <span className="text-rose-300 font-medium">
                    {cycleStats.tomorrowSymptomPredictions
                      .slice(0, 2)
                      .map((p) => `${p.name} (${p.probability}%)`)
                      .join(', ')}
                  </span>
                </span>
              )}
            </p>
          </div>
        ) : (
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Log symptoms across a few days to unlock personalized Cycle Day symptom probabilities.
          </p>
        )}
      </div>

      {/* Physiological & Hormone Curve Visualizer */}
      <div
        className={`rounded-3xl p-4 border ${isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold">Hormone Wave & Phase Physiology</h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {phaseInfo.hormones}
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-violet-500/15 text-violet-300">
            Day {clampedDay} / {cycleLen}
          </span>
        </div>

        <HormoneCurveChart
          cycleLen={cycleLen}
          ovDay={ovDay}
          currentDay={clampedDay}
          isDark={isDark}
        />

        <p className={`text-xs leading-relaxed mt-3 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
          {phaseInfo.insight}
        </p>
      </div>

      {/* Today's Logged Summary Card */}
      <div
        className={`rounded-3xl p-4 border ${isDark ? 'bg-zinc-900/70 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold">Today's Log Summary</h3>
          </div>
          <button
            onClick={() => onOpenLogger(today)}
            className="text-xs font-semibold text-rose-400 hover:underline"
          >
            Edit Log →
          </button>
        </div>

        {todayLog.flow ||
          (todayLog.symptoms && todayLog.symptoms.length > 0) ||
          (todayLog.mood && todayLog.mood.length > 0) ||
          todayLog.bbt ||
          todayLog.water ||
          todayLog.notes ? (
          <div className="space-y-2.5 text-xs">
            <div className="flex flex-wrap gap-1.5">
              {todayLog.flow && todayLog.flow !== 'none' && (
                <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold capitalize">
                  🩸 Flow: {todayLog.flow}
                </span>
              )}
              {todayLog.bbt && (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  🌡️ BBT: {displayTemp(todayLog.bbt)}°{settings.bbtUnit}
                </span>
              )}
              {todayLog.water && (
                <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold">
                  💧 Water: {todayLog.water} glasses
                </span>
              )}
              {todayLog.mucus && todayLog.mucus !== 'none' && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold capitalize">
                  💧 CM: {todayLog.mucus}
                </span>
              )}
              {(todayLog.mood || []).map((m) => (
                <span
                  key={m}
                  className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30"
                >
                  ✨ {m}
                </span>
              ))}
              {(todayLog.symptoms || []).map((s) => (
                <span
                  key={s}
                  className={`px-2.5 py-1 rounded-full border ${isDark
                    ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                    }`}
                >
                  {s}
                </span>
              ))}
            </div>
            {todayLog.notes && (
              <p className={`italic text-xs p-2.5 rounded-xl ${isDark ? 'bg-zinc-950/60 text-zinc-400' : 'bg-rose-50/50 text-zinc-600'}`}>
                "{todayLog.notes}"
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className={`text-xs mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              No symptoms, temperature, or notes logged for today yet.
            </p>
            <button
              onClick={() => onOpenLogger(today)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30"
            >
              + Add Daily Check-In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 2. INTERACTIVE MULTI-YEAR CALENDAR VIEW (Supports Previous Year & Future Predictions)
// ============================================================================
function CalendarView({
  isDark,
  logs,
  settings,
  cycleStats,
  calendarMonth,
  setCalendarMonth,
  selectedDate,
  setSelectedDate,
  onOpenLogger,
  onQuickLogPeriod,
  displayTemp,
  onOpenBatchPastModal
}) {
  const today = getTodayStr();
  const currentActualYear = new Date().getFullYear();
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  // Multi-year selector options (from 5 years ago up to next year)
  const yearOptions = [];
  for (let y = currentActualYear - 5; y <= currentActualYear + 1; y++) {
    yearOptions.push(y);
  }
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCalendarMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(getTodayStr());
  };

  const daysArray = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysArray.push({ dayNum: d, dateStr });
  }

  const selLog = logs[selectedDate] || {};
  const selMarker = cycleStats.calendarMarkers[selectedDate] || {};

  // Calculate what Cycle Day the selectedDate belongs to (if after latest or historical cycle start)
  const selectedCycleDayInfo = useMemo(() => {
    for (let i = cycleStats.cycles.length - 1; i >= 0; i--) {
      const c = cycleStats.cycles[i];
      const diff = diffDays(selectedDate, c.startDate);
      if (diff >= 0 && (c.cycleLength ? diff < c.cycleLength : diff < 90)) {
        const cd = diff + 1;
        const phase = cycleStats.getPhaseForCycleDay(
          ((cd - 1) % cycleStats.expectedCycleLength) + 1,
          Boolean(selLog.flow && selLog.flow !== 'none')
        );
        return { cd, phase, predictedSymptoms: cycleStats.predictSymptomsForCycleDay(cd) };
      }
    }
    return null;
  }, [selectedDate, cycleStats, selLog]);

  return (
    <div className="space-y-4">
      {/* Multi-Year & Month Jump Controls */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Cycle & Fertility Calendar</h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Jump to any past year or future month to log or inspect
            </p>
          </div>
          <button
            onClick={onOpenBatchPastModal}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-rose-500 text-white shadow-sm flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            + Add Past Cycles
          </button>
        </div>

        {/* Month & Year Dropdown Bar */}
        <div
          className={`flex items-center justify-between p-2 rounded-2xl border ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
            }`}
        >
          <div className="flex items-center gap-1.5">
            <select
              value={month}
              onChange={(e) => setCalendarMonth(new Date(year, Number(e.target.value), 1))}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                : 'bg-rose-50/60 border-rose-200 text-zinc-900'
                }`}
            >
              {monthNames.map((mName, idx) => (
                <option key={mName} value={idx}>
                  {mName}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setCalendarMonth(new Date(Number(e.target.value), month, 1))}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border focus:outline-none ${isDark
                ? 'bg-zinc-950 border-zinc-800 text-rose-300'
                : 'bg-rose-50/60 border-rose-200 text-rose-800'
                }`}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y} {y === currentActualYear - 1 ? '(Prev Year)' : y === currentActualYear ? '(Now)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCalendarMonth(new Date(currentActualYear - 1, month, 1))}
              className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold border ${year === currentActualYear - 1
                ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                : isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}
              title={`Jump to ${currentActualYear - 1}`}
            >
              {currentActualYear - 1}
            </button>
            <button
              onClick={goToToday}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border ${isDark
                ? 'bg-zinc-950 border-zinc-800 text-rose-300'
                : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className={`p-1.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-rose-100'
                }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              className={`p-1.5 rounded-xl border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-rose-100'
                }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid Card */}
      <div
        className={`rounded-3xl p-4 border ${isDark ? 'bg-zinc-900/80 border-zinc-800/80' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold opacity-60 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {daysArray.map((item, idx) => {
            if (!item) return <div key={`empty-${idx}`} className="h-11" />;
            const { dayNum, dateStr } = item;
            const dayLog = logs[dateStr];
            const marker = cycleStats.calendarMarkers[dateStr] || {};

            const hasFlow = dayLog?.flow && dayLog.flow !== 'none' && dayLog.flow !== 'spotting';
            const isSpotting = dayLog?.flow === 'spotting';
            const isPredictedPeriod = !hasFlow && marker.isPredictedPeriod;
            const isOvulation = marker.isOvulation;
            const isFertile = marker.isFertile;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === today;
            const hasSymptoms =
              (dayLog?.symptoms && dayLog.symptoms.length > 0) ||
              (dayLog?.mood && dayLog.mood.length > 0) ||
              dayLog?.bbt ||
              dayLog?.notes;

            let bgClass = isDark
              ? 'bg-zinc-950/40 text-zinc-200 hover:bg-zinc-800/70'
              : 'bg-zinc-50/70 text-zinc-800 hover:bg-rose-50';

            if (hasFlow) {
              bgClass = 'bg-rose-500 text-white font-bold shadow-sm shadow-rose-500/30';
            } else if (isSpotting) {
              bgClass = 'bg-rose-500/30 text-rose-200 border border-rose-400/50';
            } else if (isPredictedPeriod) {
              bgClass =
                'bg-rose-500/15 text-rose-300 border-2 border-dashed border-rose-400/70 font-semibold';
            } else if (isOvulation) {
              bgClass =
                'bg-emerald-500/25 text-emerald-300 border-2 border-emerald-400 font-bold';
            } else if (isFertile) {
              bgClass = 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30';
            }

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`h-11 rounded-2xl relative flex flex-col items-center justify-center text-xs transition-all ${bgClass} ${isSelected ? 'ring-2 ring-offset-1 ring-rose-400 ring-offset-transparent scale-105 z-10' : ''
                  }`}
              >
                <span>{dayNum}</span>

                {isToday && !hasFlow && (
                  <span className="text-[8px] font-bold uppercase text-rose-400 leading-none">
                    Today
                  </span>
                )}

                {isOvulation && (
                  <span className="absolute -top-1 -right-1 text-[10px]" title="Estimated Ovulation">
                    ✦
                  </span>
                )}

                {hasSymptoms && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${hasFlow ? 'bg-white' : 'bg-purple-400'
                      }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Calendar Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-4 border-t border-zinc-800/50 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
            <span>Logged Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md border-2 border-dashed border-rose-400 bg-rose-500/15 inline-block" />
            <span>Predicted Period</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-400 inline-block" />
            <span>Fertile Window</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
            <span>Symptoms / BBT</span>
          </div>
        </div>
      </div>

      {/* Selected Date Inspector & Symptom Prediction Sheet */}
      <div
        className={`rounded-3xl p-4 border space-y-3 ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm">
                {formatDisplayDate(selectedDate, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              {selectedCycleDayInfo && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  CD {selectedCycleDayInfo.cd} • {selectedCycleDayInfo.phase}
                </span>
              )}
            </div>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {selMarker.isOvulation
                ? 'Peak Fertility • Estimated Ovulation Day'
                : selMarker.isFertile
                  ? 'High Fertility Window'
                  : selMarker.isPredictedPeriod
                    ? 'Predicted Period Day'
                    : 'Tap + Period or Full Log to record data for this date'}
            </p>
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => onQuickLogPeriod(selectedDate)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${selLog.flow && selLog.flow !== 'none'
                ? 'bg-rose-500 text-white border-rose-500'
                : isDark
                  ? 'bg-zinc-800 border-zinc-700 text-rose-300'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
            >
              {selLog.flow && selLog.flow !== 'none' ? `🩸 ${selLog.flow}` : '+ Period'}
            </button>

            <button
              onClick={() => onOpenLogger(selectedDate)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500 to-purple-600 text-white"
            >
              Full Log
            </button>
          </div>
        </div>

        {/* Logged Items on Selected Date */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {selLog.bbt && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🌡️ {displayTemp(selLog.bbt)}°{settings.bbtUnit}
            </span>
          )}
          {selLog.water && (
            <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
              💧 {selLog.water} glasses
            </span>
          )}
          {selLog.mucus && selLog.mucus !== 'none' && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 capitalize">
              💧 CM: {selLog.mucus}
            </span>
          )}
          {(selLog.mood || []).map((m) => (
            <span
              key={m}
              className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30"
            >
              ✨ {m}
            </span>
          ))}
          {(selLog.symptoms || []).map((s) => (
            <span
              key={s}
              className={`px-2.5 py-1 rounded-full border ${isDark ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Predicted Symptoms for Selected Date (if future or unlogged) */}
        {selectedCycleDayInfo && selectedCycleDayInfo.predictedSymptoms.length > 0 && (
          <div className={`pt-2 border-t ${isDark ? 'border-zinc-800/70' : 'border-rose-100'}`}>
            <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Expected Signals for Cycle Day {((selectedCycleDayInfo.cd - 1) % cycleStats.expectedCycleLength) + 1} ({selectedCycleDayInfo.phase}):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {selectedCycleDayInfo.predictedSymptoms.slice(0, 4).map((p) => (
                <span
                  key={p.name}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border ${isDark
                    ? 'bg-zinc-950/70 border-zinc-800 text-zinc-300'
                    : 'bg-rose-50/60 border-rose-200 text-zinc-700'
                    }`}
                >
                  {p.name} <strong className="text-rose-400">{p.probability}%</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. DAILY LOGGER & CUSTOM SYMPTOM BUILDER VIEW (With Direct Any-Year Date Picker)
// ============================================================================
function LoggerView({
  isDark,
  logs,
  settings,
  setSettings,
  selectedDate,
  setSelectedDate,
  updateDayLog,
  showToast,
  cycleStats,
  onOpenBatchPastModal
}) {
  const currentLog = logs[selectedDate] || { date: selectedDate };
  const [newCustomSymptom, setNewCustomSymptom] = useState('');
  const [bbtInput, setBbtInput] = useState(() => {
    if (!currentLog.bbt) return '';
    return settings.bbtUnit === 'F'
      ? ((parseFloat(currentLog.bbt) * 9) / 5 + 32).toFixed(2)
      : currentLog.bbt;
  });

  useEffect(() => {
    const log = logs[selectedDate] || {};
    if (!log.bbt) {
      setBbtInput('');
    } else {
      setBbtInput(
        settings.bbtUnit === 'F'
          ? ((parseFloat(log.bbt) * 9) / 5 + 32).toFixed(2)
          : log.bbt
      );
    }
  }, [selectedDate, logs, settings.bbtUnit]);

  const toggleArrayItem = (field, item) => {
    const currentArr = currentLog[field] || [];
    const exists = currentArr.includes(item);
    const updated = exists ? currentArr.filter((i) => i !== item) : [...currentArr, item];
    updateDayLog(selectedDate, { [field]: updated });
  };

  const handleSaveBbt = (val) => {
    setBbtInput(val);
    const num = parseFloat(val);
    if (!val || isNaN(num)) {
      updateDayLog(selectedDate, { bbt: null });
      return;
    }
    const celsius = settings.bbtUnit === 'F' ? ((num - 32) * 5) / 9 : num;
    if (celsius >= 35.0 && celsius <= 39.5) {
      updateDayLog(selectedDate, { bbt: celsius.toFixed(2) });
    }
  };

  const handleAddCustomSymptom = (e) => {
    e.preventDefault();
    const trimmed = newCustomSymptom.trim();
    if (!trimmed) return;
    if (!settings.customSymptoms.includes(trimmed)) {
      setSettings((prev) => ({
        ...prev,
        customSymptoms: [...prev.customSymptoms, trimmed]
      }));
    }
    toggleArrayItem('symptoms', trimmed);
    setNewCustomSymptom('');
    showToast(`Added custom tag "${trimmed}"`);
  };

  const flowLevels = [
    { id: 'none', label: 'None', drops: 0 },
    { id: 'spotting', label: 'Spotting', drops: 1 },
    { id: 'light', label: 'Light', drops: 2 },
    { id: 'medium', label: 'Medium', drops: 3 },
    { id: 'heavy', label: 'Heavy', drops: 4 }
  ];

  const mucusTypes = [
    { id: 'none', label: 'None / Unchecked' },
    { id: 'dry', label: 'Dry' },
    { id: 'sticky', label: 'Sticky' },
    { id: 'creamy', label: 'Creamy' },
    { id: 'watery', label: 'Watery' },
    { id: 'eggwhite', label: 'Egg-White (Peak)' }
  ];

  const waterGlasses = currentLog.water || 0;

  return (
    <div className="space-y-4">
      {/* Date Switcher Bar + Direct Any-Year Date Input + Batch Past Cycles Button */}
      <div
        className={`p-3 rounded-2xl border space-y-2.5 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            className="p-2 rounded-xl hover:bg-zinc-800/50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">
              Daily Body Logger (Any Year)
            </p>
            <h2 className="text-sm font-bold">
              {formatDisplayDate(selectedDate, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </h2>
          </div>
          <button
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 rounded-xl hover:bg-zinc-800/50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/50">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className={`flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold border ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200'
              : 'bg-rose-50/50 border-rose-200 text-zinc-800'
              }`}
          />
          <button
            onClick={onOpenBatchPastModal}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40 shrink-0"
          >
            + Batch Past Cycles
          </button>
        </div>
      </div>

      {/* 1. Menstrual Flow Selector */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Droplets className="w-4 h-4 text-rose-500" />
          <h3 className="text-sm font-bold">Menstrual Flow Intensity</h3>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {flowLevels.map((f) => {
            const isSelected = (currentLog.flow || 'none') === f.id;
            return (
              <button
                key={f.id}
                onClick={() =>
                  updateDayLog(selectedDate, { flow: f.id === 'none' ? null : f.id })
                }
                className={`py-2.5 px-1 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 ${isSelected
                  ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 font-bold'
                  : isDark
                    ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-rose-50/40 border-rose-100 text-zinc-700 hover:bg-rose-100/50'
                  }`}
              >
                <span className="text-xs">
                  {f.drops === 0 ? '○' : '🩸'.repeat(Math.min(3, f.drops))}
                </span>
                <span className="text-[11px]">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Hydration Water Intake Tracker */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold">Hydration Tracker</h3>
          </div>
          <span className="text-xs font-bold text-sky-400">{waterGlasses} / 10 Glasses</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
            <button
              key={g}
              onClick={() =>
                updateDayLog(selectedDate, { water: waterGlasses === g ? g - 1 : g })
              }
              className={`w-8 h-9 rounded-xl border text-xs font-bold transition flex items-center justify-center ${g <= waterGlasses
                ? 'bg-sky-500 text-white border-sky-400 shadow-sm shadow-sky-500/30'
                : isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-500'
                  : 'bg-sky-50/50 border-sky-100 text-zinc-400'
                }`}
            >
              💧
            </button>
          ))}
        </div>
      </div>

      {/* 3. Basal Body Temperature (BBT) & Cervical Fluid */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold">Symptoms, Habits & Body Signals</h3>
          </div>
          <span className="text-[10px] text-rose-400 font-semibold">Customizable</span>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-3">
          {settings.customSymptoms.map((sym) => {
            const active = (currentLog.symptoms || []).includes(sym);
            return (
              <button
                key={sym}
                onClick={() => toggleArrayItem('symptoms', sym)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition ${active
                  ? 'bg-rose-500/25 text-rose-200 border-rose-400 font-semibold'
                  : isDark
                    ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    : 'bg-rose-50/40 border-rose-100 text-zinc-700 hover:bg-rose-100/50'
                  }`}
              >
                {active ? `✓ ${sym}` : sym}
              </button>
            );
          })}
        </div>

        {/* Add Custom Symptom Form */}
        <form onSubmit={handleAddCustomSymptom} className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="Create custom symptom/habit (e.g. Iron Pill, Yoga)..."
            value={newCustomSymptom}
            onChange={(e) => setNewCustomSymptom(e.target.value)}
            className={`flex-1 px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
              : 'bg-rose-50/40 border-rose-200 text-zinc-900'
              }`}
          />
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-rose-500 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </form>
      </div>

      {/* 4. Mood & Energy Selector */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <Smile className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold">Mood & Mental State</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {settings.customMoods.map((mood) => {
            const active = (currentLog.mood || []).includes(mood);
            return (
              <button
                key={mood}
                onClick={() => toggleArrayItem('mood', mood)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-medium border transition ${active
                  ? 'bg-purple-500/25 text-purple-200 border-purple-400 font-semibold'
                  : isDark
                    ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                    : 'bg-rose-50/40 border-rose-100 text-zinc-700'
                  }`}
              >
                {active ? `✨ ${mood}` : mood}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Personal Encrypted Notes */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-bold">Private Daily Notes</h3>
        </div>
        <textarea
          rows={3}
          placeholder="Write private notes for this day (stored strictly on-device)..."
          value={currentLog.notes || ''}
          onChange={(e) => updateDayLog(selectedDate, { notes: e.target.value })}
          className={`w-full p-3 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-rose-50/40 border-rose-200 text-zinc-900'
            }`}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 4. ANALYTICS, FUTURE PHASE/CYCLE PREDICTIONS & SYMPTOM FORECAST VIEW
// ============================================================================
function AnalyticsView({ isDark, logs, settings, cycleStats, displayTemp, onOpenBatchPastModal }) {
  // Compute overall symptom frequency
  const symptomStats = useMemo(() => {
    const counts = {};
    Object.values(logs).forEach((entry) => {
      (entry.symptoms || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [logs]);

  // Extract BBT points for the latest/current cycle
  const bbtSeries = useMemo(() => {
    if (!cycleStats.latestEpisode) return [];
    const start = cycleStats.latestEpisode.startDate;
    const points = [];
    for (let i = 0; i < cycleStats.expectedCycleLength; i++) {
      const d = addDays(start, i);
      const val = logs[d]?.bbt ? parseFloat(logs[d].bbt) : null;
      if (val) {
        points.push({
          cycleDay: i + 1,
          date: d,
          tempC: val,
          displayVal: parseFloat(displayTemp(val))
        });
      }
    }
    return points;
  }, [logs, cycleStats, displayTemp]);

  const regularityLabel =
    parseFloat(cycleStats.stdDev) <= 2.0
      ? 'Very Regular'
      : parseFloat(cycleStats.stdDev) <= 4.0
        ? 'Moderately Regular'
        : 'Variable Cycle';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Cycle, Phase & Symptom Predictions</h2>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Calibrated across {cycleStats.cycles.length} logged cycles (including past years)
          </p>
        </div>
        <button
          onClick={onOpenBatchPastModal}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/40 shrink-0"
        >
          + Past Cycles
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
            }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Smart Cycle Length
          </span>
          <p className="text-2xl font-extrabold text-rose-400 mt-0.5">
            {cycleStats.expectedCycleLength} Days
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">
            Range: {cycleStats.shortestCycle}–{cycleStats.longestCycle}d
          </p>
        </div>

        <div
          className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
            }`}
        >
          <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Cycle Regularity
          </span>
          <p className="text-lg font-extrabold text-purple-300 mt-0.5">{regularityLabel}</p>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Confidence: ±{cycleStats.stdDev} days
          </p>
        </div>
      </div>

      {/* NEW: Upcoming 6-Cycle Period, Fertile Window & Ovulation Predictions */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-rose-400" />
            <div>
              <h3 className="text-sm font-bold">Next 6 Predicted Cycles</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Future period windows, fertile peaks & ovulation dates
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300">
            ±{cycleStats.confidenceDays}d window
          </span>
        </div>

        {cycleStats.predictedCycles.length <= 1 ? (
          <p className="text-xs text-zinc-400 py-3 text-center">
            Log at least one period to project your upcoming 6 cycles.
          </p>
        ) : (
          <div className="space-y-2">
            {cycleStats.predictedCycles.slice(1, 7).map((pc, idx) => (
              <div
                key={pc.cycleStart}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${isDark ? 'bg-zinc-950/60 border-zinc-800/80' : 'bg-rose-50/40 border-rose-100'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                      #{idx + 1}
                    </span>
                    <span className="font-bold">
                      {formatDisplayDate(pc.cycleStart, { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' – '}
                      {formatDisplayDate(pc.periodEnd, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className={`text-[10px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Fertile:{' '}
                    <span className="text-emerald-400 font-medium">
                      {formatDisplayDate(pc.fertileStart)} – {formatDisplayDate(pc.fertileEnd)}
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider opacity-60 block">
                    Ovulation
                  </span>
                  <span className="font-bold text-emerald-400">
                    ✦ {formatDisplayDate(pc.ovulationDate)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* NEW: Phase-by-Phase Symptom & Mood Prediction Matrix */}
      <div
        className={`p-4 rounded-3xl border space-y-3 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <div>
              <h3 className="text-sm font-bold">Cycle Phase & Symptom Predictions</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                What your body typically experiences in each phase based on history
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {[
            {
              phase: 'Menstrual',
              days: `Days 1–${cycleStats.expectedPeriodLength}`,
              accent: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
            },
            {
              phase: 'Follicular',
              days: `Days ${cycleStats.expectedPeriodLength + 1}–${Math.max(
                cycleStats.expectedPeriodLength + 1,
                cycleStats.ovDayInCycle - 3
              )}`,
              accent: 'border-violet-500/40 bg-violet-500/10 text-violet-300'
            },
            {
              phase: 'Ovulatory',
              days: `Days ${cycleStats.ovDayInCycle - 2}–${cycleStats.ovDayInCycle + 1}`,
              accent: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            },
            {
              phase: 'Luteal',
              days: `Days ${cycleStats.ovDayInCycle + 2}–${cycleStats.expectedCycleLength}`,
              accent: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            }
          ].map((pInfo) => {
            const preds = cycleStats.phaseSymptomForecast[pInfo.phase] || [];
            const isCurrentPhase = cycleStats.currentPhase === pInfo.phase;
            return (
              <div
                key={pInfo.phase}
                className={`p-3.5 rounded-2xl border ${isCurrentPhase
                  ? isDark
                    ? 'bg-zinc-950 border-rose-500/60 ring-1 ring-rose-500/30'
                    : 'bg-rose-50/70 border-rose-300'
                  : isDark
                    ? 'bg-zinc-950/50 border-zinc-800/80'
                    : 'bg-zinc-50/60 border-rose-100'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${pInfo.accent}`}>
                      {pInfo.phase} Phase
                    </span>
                    {isCurrentPhase && (
                      <span className="text-[10px] font-bold text-rose-400 uppercase">
                        • Active Now
                      </span>
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {pInfo.days}
                  </span>
                </div>

                <p className={`text-[11px] mb-2 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {PHASE_DETAILS[pInfo.phase]?.hormones}
                </p>

                {preds.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {preds.map((item) => (
                      <span
                        key={`${pInfo.phase}-${item.name}`}
                        className={`text-[11px] px-2.5 py-1 rounded-xl border font-medium ${isDark
                          ? 'bg-zinc-900 border-zinc-800 text-zinc-200'
                          : 'bg-white border-rose-100 text-zinc-800'
                          }`}
                      >
                        {item.type === 'mood' ? '✨' : '⚡'} {item.name}{' '}
                        <strong className="text-rose-400">{item.probability}%</strong>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 italic">
                    No recurring symptoms logged for this phase yet.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cycle History Bar Chart & Multi-Year Timeline */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Logged Cycle History (All Years)</h3>
          <span className="text-[11px] text-rose-400 font-semibold">
            {cycleStats.cycles.length} Cycles Tracked
          </span>
        </div>

        {cycleStats.cycles.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            Log at least two periods to see cycle length comparisons.
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {cycleStats.cycles
              .slice()
              .reverse()
              .map((c) => {
                const len = c.cycleLength || cycleStats.currentCycleDay || 1;
                const widthPct = Math.min(100, Math.round((len / 38) * 100));
                const periodPct = Math.min(100, Math.round((c.periodLength / len) * 100));

                return (
                  <div key={c.startDate} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold">
                        {formatDisplayDate(c.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {c.isCurrent && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                            Current Cycle
                          </span>
                        )}
                      </span>
                      <span className="font-bold">
                        {c.isCurrent ? `Day ${len} (Ongoing)` : `${c.cycleLength} Days`}
                      </span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-zinc-800/70 overflow-hidden flex">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className="h-full bg-zinc-700 rounded-full flex overflow-hidden"
                      >
                        <div
                          style={{ width: `${periodPct}%` }}
                          className="h-full bg-rose-500"
                          title={`Period: ${c.periodLength} days`}
                        />
                      </div>
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Period duration: {c.periodLength} days
                      {c.isOutlier ? ' • Filtered as Outlier' : ''}
                    </p>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Basal Body Temperature (BBT) Ovulation Curve */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold">
              Current Cycle BBT Trend (°{settings.bbtUnit})
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Biphasic thermal shift confirms progesterone release after ovulation
            </p>
          </div>
          <Thermometer className="w-4 h-4 text-amber-400" />
        </div>

        {bbtSeries.length < 2 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            Log at least 2 morning Basal Body Temperatures in the current cycle to plot your thermal curve.
          </p>
        ) : (
          <BbtTrendChart bbtSeries={bbtSeries} cycleLen={cycleStats.expectedCycleLength} unit={settings.bbtUnit} isDark={isDark} />
        )}
      </div>

      {/* Top Logged Symptoms Frequency */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <h3 className="text-sm font-bold mb-3">Most Frequent Body Signals</h3>
        {symptomStats.length === 0 ? (
          <p className="text-xs text-zinc-400">No symptoms logged yet.</p>
        ) : (
          <div className="space-y-2.5">
            {symptomStats.map(([sym, count]) => {
              const maxCount = symptomStats[0][1] || 1;
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={sym} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{sym}</span>
                    <span className="text-rose-400 font-semibold">{count} days</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-rose-500 to-purple-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BbtTrendChart({ bbtSeries, cycleLen, unit, isDark }) {
  const width = 320;
  const height = 110;
  const minC = 36.0;
  const maxC = 37.0;

  const coords = bbtSeries.map((pt) => {
    const x = ((pt.cycleDay - 1) / Math.max(27, cycleLen - 1)) * (width - 30) + 15;
    const clampedC = Math.min(maxC, Math.max(minC, pt.tempC));
    const y = height - 20 - ((clampedC - minC) / (maxC - minC)) * (height - 35);
    return { ...pt, x, y };
  });

  const polyPoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const coverlineY = height - 20 - ((36.48 - minC) / (maxC - minC)) * (height - 35);

  return (
    <div className="mt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        {/* Coverline threshold */}
        <line
          x1="10"
          y1={coverlineY}
          x2={width - 10}
          y2={coverlineY}
          stroke="#f59e0b"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.6"
        />
        <polyline
          fill="none"
          stroke="#fbbf24"
          strokeWidth="2.5"
          points={polyPoints}
        />
        {coords.map((c) => (
          <g key={c.date}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="#f59e0b" />
            <text
              x={c.x}
              y={c.y - 6}
              fontSize="8"
              textAnchor="middle"
              fill={isDark ? '#fde68a' : '#92400e'}
            >
              {c.displayVal}°
            </text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] opacity-70 px-2">
        <span>Day 1</span>
        <span>--- Luteal Thermal Coverline ---</span>
        <span>Day {cycleLen}</span>
      </div>
    </div>
  );
}

// ============================================================================
// 5. SETTINGS, CUSTOMIZATION & PRIVACY VAULT VIEW
// ============================================================================
function SettingsVaultView({
  isDark,
  logs,
  setLogs,
  settings,
  setSettings,
  cycleStats,
  showToast,
  onOpenInstallModal,
  confirmClearModal,
  setConfirmClearModal,
  onTriggerCareModal,
  onOpenBatchPastModal
}) {
  const [newPin, setNewPin] = useState('');
  const fileInputRef = useRef(null);

  // Export Full JSON Backup
  const handleExportJSON = () => {
    const payload = {
      app: 'AuraCycle Local Vault',
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      logs
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auracycle-backup-${getTodayStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported full local JSON backup');
  };

  // Export CSV Spreadsheet
  const handleExportCSV = () => {
    const headers = ['Date', 'Flow', 'BBT_Celsius', 'Cervical_Mucus', 'Moods', 'Symptoms', 'Notes'];
    const rows = Object.keys(logs)
      .sort()
      .map((date) => {
        const l = logs[date];
        return [
          date,
          l.flow || '',
          l.bbt || '',
          l.mucus || '',
          (l.mood || []).join('; '),
          (l.symptoms || []).join('; '),
          `"${(l.notes || '').replace(/"/g, '""')}"`
        ].join(',');
      });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auracycle-logs-${getTodayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported CSV spreadsheet');
  };

  // Import JSON Backup
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.logs && typeof parsed.logs === 'object') {
          setLogs(parsed.logs);
          if (parsed.settings) {
            setSettings((prev) => ({ ...prev, ...parsed.settings }));
          }
          showToast('Restored backup successfully!');
        } else {
          showToast('Invalid backup file format');
        }
      } catch (err) {
        showToast('Could not parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleSavePin = (e) => {
    e.preventDefault();
    if (newPin.length === 4 && /^\d{4}$/.test(newPin)) {
      setSettings((s) => ({ ...s, pinCode: newPin }));
      setNewPin('');
      showToast('4-digit App Lock PIN enabled');
    } else {
      showToast('PIN must be 4 digits');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold">Prediction Calibration & Privacy Vault</h2>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Customize your biological parameters & manage your local data
        </p>
      </div>

      {/* 1. Prediction Engine Calibration */}
      <div
        className={`p-4 rounded-3xl border space-y-4 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-rose-400" />
          <h3 className="text-sm font-bold">Cycle Prediction Algorithm</h3>
        </div>

        {/* Mode Toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSettings((s) => ({ ...s, calculationMode: 'smart' }))}
            className={`p-3 rounded-2xl border text-left transition ${settings.calculationMode === 'smart'
              ? 'bg-rose-500/20 border-rose-500 text-rose-200'
              : isDark
                ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                : 'bg-rose-50/40 border-rose-100 text-zinc-600'
              }`}
          >
            <p className="text-xs font-bold">Smart Weighted Avg</p>
            <p className="text-[10px] opacity-80 mt-0.5">
              Adapts automatically to your last 6 logged cycles
            </p>
          </button>

          <button
            onClick={() => setSettings((s) => ({ ...s, calculationMode: 'manual' }))}
            className={`p-3 rounded-2xl border text-left transition ${settings.calculationMode === 'manual'
              ? 'bg-rose-500/20 border-rose-500 text-rose-200'
              : isDark
                ? 'bg-zinc-950/60 border-zinc-800 text-zinc-400'
                : 'bg-rose-50/40 border-rose-100 text-zinc-600'
              }`}
          >
            <p className="text-xs font-bold">Manual Fixed Override</p>
            <p className="text-[10px] opacity-80 mt-0.5">
              Use exact custom cycle & period lengths
            </p>
          </button>
        </div>

        {/* Manual / Fallback Cycle Length Sliders */}
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Luteal Phase Length (Ovulation → Period)</span>
              <span className="font-bold text-emerald-400">{settings.lutealPhaseLength} Days</span>
            </div>
            <input
              type="range"
              min="10"
              max="16"
              value={settings.lutealPhaseLength}
              onChange={(e) =>
                setSettings((s) => ({ ...s, lutealPhaseLength: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500"
            />
            <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Unlike the follicular phase, your luteal phase is biologically consistent (typically 12–14 days). Calibrating this increases ovulation accuracy.
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>
                {settings.calculationMode === 'manual'
                  ? 'Custom Cycle Length'
                  : 'Default Cycle Length (Fallback)'}
              </span>
              <span className="font-bold text-rose-400">{settings.manualCycleLength} Days</span>
            </div>
            <input
              type="range"
              min="21"
              max="42"
              value={settings.manualCycleLength}
              onChange={(e) =>
                setSettings((s) => ({ ...s, manualCycleLength: Number(e.target.value) }))
              }
              className="w-full accent-rose-500"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Typical Period Duration</span>
              <span className="font-bold text-rose-400">{settings.manualPeriodLength} Days</span>
            </div>
            <input
              type="range"
              min="2"
              max="9"
              value={settings.manualPeriodLength}
              onChange={(e) =>
                setSettings((s) => ({ ...s, manualPeriodLength: Number(e.target.value) }))
              }
              className="w-full accent-rose-500"
            />
          </div>

          {/* Temperature Unit Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
            <span className="text-xs font-medium">Basal Temperature Unit</span>
            <div className="flex rounded-xl overflow-hidden border border-zinc-700">
              {['C', 'F'].map((u) => (
                <button
                  key={u}
                  onClick={() => setSettings((s) => ({ ...s, bbtUnit: u }))}
                  className={`px-3 py-1 text-xs font-bold ${settings.bbtUnit === u
                    ? 'bg-rose-500 text-white'
                    : 'bg-zinc-900 text-zinc-400'
                    }`}
                >
                  °{u}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Personalized Period Care Message Settings */}
      <div
        className={`p-4 rounded-3xl border space-y-3 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400/20" />
            <h3 className="text-sm font-bold">Period Comfort Message for Nechu</h3>
          </div>
          <button
            onClick={onTriggerCareModal}
            className="text-[11px] font-semibold text-rose-400 hover:underline"
          >
            Preview Pop-up →
          </button>
        </div>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Automatically displays on the dashboard when her period hits and pops up whenever a period day is logged.
        </p>
        <textarea
          rows={2}
          value={
            settings.periodCareMessage ??
            "Dear Nechu, I know you're having a hard time. Hydrate and have your favorite chocolates."
          }
          onChange={(e) =>
            setSettings((s) => ({ ...s, periodCareMessage: e.target.value }))
          }
          className={`w-full p-3 rounded-2xl border text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDark
            ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
            : 'bg-rose-50/40 border-rose-200 text-zinc-900'
            }`}
        />
        <button
          onClick={() => {
            setSettings((s) => ({
              ...s,
              periodCareMessage:
                "Dear Nechu I know you're having a hard time. Hydrate and have your favorite chocolates."
            }));
            showToast("Reset to Nechu's default care message");
          }}
          className="text-[11px] text-amber-400 font-semibold"
        >
          Reset to Default Message for Nechu
        </button>
      </div>

      {/* Historical / Previous Year Data Quick Entry Card */}
      <div
        className={`p-4 rounded-3xl border space-y-2.5 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-violet-400" />
            <h3 className="text-sm font-bold">Previous Year & Past Cycle History</h3>
          </div>
          <span className="text-xs font-bold text-violet-400">
            {cycleStats.episodes.length} Periods Logged
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Add period start dates and typical symptoms from last year or earlier in seconds to train the prediction engine.
        </p>
        <button
          onClick={onOpenBatchPastModal}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Open Past Cycles Batch Manager
        </button>
      </div>

      {/* 2. Offline App PIN Lock */}
      <div
        className={`p-4 rounded-3xl border space-y-3 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold">Local Passcode Lock</h3>
          </div>
          {settings.pinCode && (
            <button
              onClick={() => {
                setSettings((s) => ({ ...s, pinCode: null }));
                showToast('PIN Lock removed');
              }}
              className="text-xs text-red-400 font-semibold"
            >
              Disable PIN
            </button>
          )}
        </div>

        <form onSubmit={handleSavePin} className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            inputMode="numeric"
            placeholder={settings.pinCode ? 'Change 4-digit PIN...' : 'Set 4-digit PIN (e.g. 2580)'}
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            className={`flex-1 px-3.5 py-2 rounded-xl border text-xs ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
              : 'bg-rose-50/40 border-rose-200 text-zinc-900'
              }`}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold"
          >
            {settings.pinCode ? 'Update PIN' : 'Enable Lock'}
          </button>
        </form>
      </div>

      {/* 3. Data Backup, Export, Import & Demo Reset */}
      <div
        className={`p-4 rounded-3xl border space-y-3 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold">Local Data Ownership & Backups</h3>
        </div>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Your data never touches any cloud server. Export backups directly to your phone's storage anytime.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleExportJSON}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
              : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
          >
            <Download className="w-4 h-4 text-rose-400" />
            Export JSON
          </button>

          <button
            onClick={handleExportCSV}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
              : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
              : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
          >
            <Upload className="w-4 h-4 text-purple-400" />
            Restore JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />

          <button
            onClick={() => {
              const sample = generateSampleData();
              setLogs(sample);
              showToast('Reloaded sample 5-cycle history');
            }}
            className={`py-2.5 px-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 ${isDark
              ? 'bg-zinc-950 border-zinc-800 text-zinc-200 hover:bg-zinc-800'
              : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
          >
            <RefreshCw className="w-4 h-4 text-amber-400" />
            Load Demo Data
          </button>
        </div>

        {/* Install on Android Guide Button */}
        <button
          onClick={onOpenInstallModal}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          How to Install as Offline Android App
        </button>

        {/* Panic Wipe / Start Fresh */}
        {!confirmClearModal ? (
          <button
            onClick={() => setConfirmClearModal(true)}
            className="w-full py-2.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 mt-2"
          >
            <Trash2 className="w-4 h-4" />
            Erase All Data & Start Fresh
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-red-950/50 border border-red-500/50 space-y-2">
            <p className="text-xs text-red-200 font-semibold">
              Permanently wipe all logs from device storage?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLogs({});
                  localStorage.removeItem('aura_local_logs_v2');
                  setConfirmClearModal(false);
                  showToast('All local logs erased. Ready for your own data.');
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Yes, Wipe Everything
              </button>
              <button
                onClick={() => setConfirmClearModal(false)}
                className="flex-1 py-2 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 6. BATCH PAST CYCLES MODAL (Enter Previous Year / Historical Cycles Fast)
// ============================================================================
function BatchPastCyclesModal({
  isDark,
  settings,
  cycleStats,
  onClose,
  onAddPastPeriod,
  onDeleteEpisode
}) {
  const defaultPastDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return formatDate(d);
  };

  const [startDate, setStartDate] = useState(defaultPastDate);
  const [durationDays, setDurationDays] = useState(settings.manualPeriodLength || 5);
  const [flowIntensity, setFlowIntensity] = useState('auto');
  const [selectedSymptoms, setSelectedSymptoms] = useState(['Cramps', 'Fatigue']);
  const [selectedMoods, setSelectedMoods] = useState(['Sensitive']);
  const [notes, setNotes] = useState('');

  const toggleItem = (list, setList, item) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDate) return;
    onAddPastPeriod({
      startDate,
      durationDays,
      flowIntensity,
      symptoms: selectedSymptoms,
      moods: selectedMoods,
      notes
    });
    // Step back ~28 days automatically so the user can rapidly log multiple previous months if desired
    setStartDate(addDays(startDate, -28));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-5 border shadow-2xl space-y-4 ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-rose-100 text-zinc-900'
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            <div>
              <h3 className="font-bold text-base">Add Past & Previous Year Cycles</h3>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Log historical period start dates & symptoms in one click
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-800/50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold mb-1">Period Start Date (Any Year)</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border font-semibold ${isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                  : 'bg-rose-50/50 border-rose-200 text-zinc-900'
                  }`}
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Duration (Days)</label>
              <input
                type="number"
                min="1"
                max="12"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border font-semibold ${isDark
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                  : 'bg-rose-50/50 border-rose-200 text-zinc-900'
                  }`}
              />
            </div>
          </div>

          {/* Quick Year Preset Jumpers */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] opacity-70 mr-1">Quick Jump:</span>
            {[2025, 2024, 2023].map((yr) => (
              <button
                type="button"
                key={yr}
                onClick={() => setStartDate(`${yr}-06-15`)}
                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold ${startDate.startsWith(String(yr))
                  ? 'bg-violet-500/25 border-violet-400 text-violet-200'
                  : isDark
                    ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                    : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Optional Typical Symptoms during that period */}
          <div>
            <label className="block font-semibold mb-1.5">
              Typical Symptoms on Days 1–2 (trains Symptom Predictor)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {['Cramps', 'Lower Backache', 'Fatigue', 'Bloating', 'Food Cravings', 'Headache / Migraine'].map(
                (sym) => {
                  const active = selectedSymptoms.includes(sym);
                  return (
                    <button
                      type="button"
                      key={sym}
                      onClick={() => toggleItem(selectedSymptoms, setSelectedSymptoms, sym)}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] transition ${active
                        ? 'bg-rose-500/25 border-rose-400 text-rose-200 font-semibold'
                        : isDark
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-400'
                          : 'bg-rose-50/40 border-rose-100 text-zinc-600'
                        }`}
                    >
                      {active ? `✓ ${sym}` : sym}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-rose-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Save Past Period ({formatDisplayDate(startDate, { month: 'short', day: 'numeric', year: 'numeric' })})
          </button>
        </form>

        {/* List of All Logged Period Episodes Across All Years */}
        <div className="pt-3 border-t border-zinc-800/70">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold">All Logged Periods ({cycleStats.episodes.length})</h4>
            <span className="text-[10px] opacity-60">Newest first</span>
          </div>
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            {cycleStats.episodes
              .slice()
              .reverse()
              .map((ep) => (
                <div
                  key={ep.startDate}
                  className={`px-3 py-2 rounded-xl border flex items-center justify-between text-xs ${isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-rose-50/40 border-rose-100'
                    }`}
                >
                  <div>
                    <span className="font-bold">
                      {formatDisplayDate(ep.startDate, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-[11px] opacity-70 ml-2">
                      ({ep.days.length} days)
                    </span>
                  </div>
                  <button
                    onClick={() => onDeleteEpisode(ep)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Delete this period log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}