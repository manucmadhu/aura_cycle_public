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
// DEFAULT SAMPLE DATA GENERATOR (Realistic 5-Cycle History for Instant Demo)
// ============================================================================
const generateSampleData = () => {
  const today = getTodayStr();
  // Create 5 realistic cycles leading up to current cycle (currently on Day 11 of cycle)
  const c5Start = addDays(today, -10); // Current cycle started 10 days ago (Day 11 today)
  const c4Start = addDays(c5Start, -29); // 29-day cycle
  const c3Start = addDays(c4Start, -28); // 28-day cycle
  const c2Start = addDays(c3Start, -30); // 30-day cycle
  const c1Start = addDays(c2Start, -28); // 28-day cycle

  const starts = [c1Start, c2Start, c3Start, c4Start, c5Start];
  const logs = {};

  starts.forEach((start, idx) => {
    const duration = idx % 2 === 0 ? 5 : 4;
    for (let i = 0; i < duration; i++) {
      const d = addDays(start, i);
      const flows = ['medium', 'heavy', 'medium', 'light', 'spotting'];
      logs[d] = {
        date: d,
        flow: flows[i] || 'light',
        pain: i < 2 ? 'moderate' : i === 2 ? 'mild' : 'none',
        mood: i === 0 ? ['Fatigued', 'Sensitive'] : ['Calm'],
        symptoms: i < 2 ? ['Cramps', 'Lower Backache', 'Bloating'] : ['Fatigue'],
        mucus: 'none',
        bbt: (36.25 + Math.random() * 0.15).toFixed(2),
        notes: i === 0 ? 'Cycle started in the morning. Took magnesium.' : ''
      };
    }

    // Add mid-cycle ovulation logs & BBT shift for past cycles
    for (let dayOffset = duration; dayOffset < 28; dayOffset++) {
      const d = addDays(start, dayOffset);
      if (diffDays(d, today) > 0) continue; // Don't log future dates

      const isFollicular = dayOffset < 14;
      const isOvulation = dayOffset >= 12 && dayOffset <= 15;
      const isPMS = dayOffset >= 24;

      const baseBbt = isFollicular ? 36.32 : 36.68;
      const randomVar = (Math.random() * 0.12 - 0.06);
      const bbtVal = (baseBbt + randomVar).toFixed(2);

      if (isOvulation || isPMS || dayOffset % 3 === 0) {
        logs[d] = {
          date: d,
          flow: null,
          pain: dayOffset === 14 ? 'ovulation_twinge' : 'none',
          mood: isOvulation ? ['Energetic', 'Happy'] : isPMS ? ['Irritable', 'Anxious'] : ['Balanced'],
          symptoms: isOvulation
            ? ['High Energy', 'Increased Libido']
            : isPMS
              ? ['Breast Tenderness', 'Bloating', 'Food Cravings']
              : [],
          mucus: dayOffset === 13 || dayOffset === 14 ? 'eggwhite' : dayOffset === 11 || dayOffset === 12 ? 'watery' : isPMS ? 'dry' : 'creamy',
          bbt: bbtVal,
          notes: dayOffset === 14 ? 'Clear thermal shift & egg-white CM noticed.' : ''
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
    "Dear Nechu, I know you're having a hard time. Hydrate and have your favorite chocolates.",
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
// CORE CYCLE ENGINE (Adaptive Weighted Moving Average + Luteal Calibration)
// ============================================================================
function analyzeCycleData(logs, settings) {
  const today = getTodayStr();

  // 1. Find all dates with actual period flow (excluding 'spotting' unless adjacent to flow, or treat light/medium/heavy as true period)
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

  // 2. Calculate historical cycles from episodes
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
        isOutlier: cycleLength < 21 || cycleLength > 45
      });
    } else {
      // Ongoing/Latest cycle
      cycles.push({
        startDate: current.startDate,
        endDate: null,
        periodEndDate: current.endDate,
        cycleLength: null,
        periodLength,
        isCurrent: true
      });
    }
  }

  // 3. Calculate Predicted Cycle Length & Period Duration
  const completedCycles = cycles.filter((c) => c.cycleLength !== null);
  const validCycles = settings.outlierFilter
    ? completedCycles.filter((c) => !c.isOutlier)
    : completedCycles;

  let expectedCycleLength = Number(settings.manualCycleLength) || 28;
  let expectedPeriodLength = Number(settings.manualPeriodLength) || 5;
  let stdDev = 1.5;

  if (settings.calculationMode === 'smart' && validCycles.length > 0) {
    // Weighted Moving Average of up to last 6 cycles (more recent cycles get higher weight: 1, 2, 3, 4, 5, 6)
    const recent = validCycles.slice(-6);
    let weightedSum = 0;
    let weightTotal = 0;
    recent.forEach((c, idx) => {
      const weight = idx + 1;
      weightedSum += c.cycleLength * weight;
      weightTotal += weight;
    });
    expectedCycleLength = Math.round(weightedSum / weightTotal);

    // Period length average
    const pSum = recent.reduce((acc, c) => acc + c.periodLength, 0);
    expectedPeriodLength = Math.max(2, Math.min(10, Math.round(pSum / recent.length)));

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
    const recent = completedCycles.slice(-6);
    const mean = recent.reduce((acc, c) => acc + c.cycleLength, 0) / recent.length;
    const variance =
      recent.reduce((acc, c) => acc + Math.pow(c.cycleLength - mean, 2), 0) / recent.length;
    stdDev = Math.sqrt(variance);
  }

  const lutealLength = Number(settings.lutealPhaseLength) || 14;
  const latestEpisode = episodes.length > 0 ? episodes[episodes.length - 1] : null;

  // 4. Current Cycle State & Future Projections (Next 3 cycles)
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

    // Project 4 cycles forward from the latest logged period start
    for (let c = 0; c < 4; c++) {
      const cycleStart = addDays(baseStart, c * expectedCycleLength);
      const nextStart = addDays(baseStart, (c + 1) * expectedCycleLength);
      const periodEnd = addDays(cycleStart, expectedPeriodLength - 1);
      // Ovulation happens `lutealLength` days before the NEXT period start
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

    // Determine exact physiological phase today
    const todayLog = logs[today];
    const isCurrentlyBleeding =
      (todayLog?.flow && todayLog.flow !== 'none' && todayLog.flow !== 'spotting') ||
      (currentCycleDay >= 1 && currentCycleDay <= expectedPeriodLength && currentCycleDay <= 7);

    const ovDayInCycle = expectedCycleLength - lutealLength;

    if (isCurrentlyBleeding) {
      currentPhase = 'Menstrual';
    } else if (currentCycleDay >= ovDayInCycle - 2 && currentCycleDay <= ovDayInCycle + 1) {
      currentPhase = 'Ovulatory';
    } else if (currentCycleDay > 0 && currentCycleDay < ovDayInCycle - 2) {
      currentPhase = 'Follicular';
    } else if (currentCycleDay > ovDayInCycle + 1) {
      currentPhase = 'Luteal';
    }
  }

  // 5. Build Lookup Sets for Fast Calendar Rendering
  const calendarMarkers = {};
  predictedCycles.forEach((pc, idx) => {
    // Only mark predicted period for future cycles (idx >= 1) or remaining days of current period
    if (idx >= 1) {
      for (let i = 0; i < expectedPeriodLength; i++) {
        const d = addDays(pc.cycleStart, i);
        calendarMarkers[d] = { ...calendarMarkers[d], isPredictedPeriod: true };
      }
    }
    // Mark fertile window & ovulation
    for (let i = -5; i <= 1; i++) {
      const d = addDays(pc.ovulationDate, i);
      calendarMarkers[d] = {
        ...calendarMarkers[d],
        isFertile: true,
        isOvulation: i === 0
      };
    }
  });

  // 6. Summary Statistics
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
    calendarMarkers,
    latestEpisode
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
    hormones: 'Estrogen & Progesterone are at baseline lows.',
    insight:
      'Uterine lining is shedding. Energy and iron stores dip naturally—prioritize warm nutrient-dense foods, magnesium, gentle movement, and restorative sleep.',
    fertility: 'Very Low Fertility'
  },
  Follicular: {
    name: 'Follicular Phase',
    color: 'from-violet-500 to-purple-600',
    badgeBg: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    accent: '#8b5cf6',
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
    hormones: 'Corpus luteum secretes Progesterone; BBT stays elevated (+0.3°C).',
    insight:
      'Progesterone warms the body and raises resting metabolic rate slightly. In the late luteal days, falling hormones can trigger PMS—complex carbs and B6 help stabilize mood.',
    fertility: 'Low Fertility (Post-Ovulation)'
  },
  Unknown: {
    name: 'Awaiting First Period Log',
    color: 'from-slate-600 to-slate-700',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    accent: '#94a3b8',
    hormones: 'Log your most recent period start date to calibrate.',
    insight:
      'Tap "Log Period" or select any date on the Calendar to begin 100% private local predictions.',
    fertility: 'Uncalibrated'
  }
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function App() {
  // --- Persistent State in localStorage ---
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_local_logs_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to read localStorage logs:', e);
    }
    const sample = generateSampleData();
    localStorage.setItem('aura_local_logs_v1', JSON.stringify(sample));
    return sample;
  });

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_local_settings_v1');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Failed to read localStorage settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem('aura_local_logs_v1', JSON.stringify(logs));
    } catch (e) {
      console.error('Storage quota error:', e);
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem('aura_local_settings_v1', JSON.stringify(settings));
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- Cycle Analytics Computation ---
  const cycleStats = useMemo(() => analyzeCycleData(logs, settings), [logs, settings]);

  // --- Quick Period Toggle for Selected Date ---
  const handleQuickLogPeriod = (dateStr = getTodayStr()) => {
    const existing = logs[dateStr] || { date: dateStr };
    const hasFlow = existing.flow && existing.flow !== 'none';

    if (hasFlow) {
      // Remove flow on this date
      const updated = { ...existing, flow: null };
      setLogs((prev) => ({ ...prev, [dateStr]: updated }));
      showToast(`Removed period flow for ${formatDisplayDate(dateStr)}`);
    } else {
      // Check if previous day had flow; if not, ask/auto-fill or log Medium flow
      const updated = { ...existing, flow: 'medium' };
      setLogs((prev) => ({ ...prev, [dateStr]: updated }));
      showToast(`Logged period flow for ${formatDisplayDate(dateStr)}`);
      setShowCarePopup(true);
    }
  };

  // --- Log multiple period days at once (e.g. "Log 5-day Period Starting Today") ---
  const handleLogFullPeriodEpisode = (startDateStr) => {
    const len = cycleStats.expectedPeriodLength || 5;
    const today = getTodayStr();
    const newLogs = { ...logs };
    const defaultFlows = ['medium', 'heavy', 'medium', 'light', 'spotting'];

    let daysLogged = 0;
    for (let i = 0; i < len; i++) {
      const d = addDays(startDateStr, i);
      if (diffDays(d, today) <= 0) {
        newLogs[d] = {
          ...(newLogs[d] || { date: d }),
          flow: newLogs[d]?.flow || defaultFlows[i] || 'light'
        };
        daysLogged++;
      }
    }
    setLogs(newLogs);
    showToast(`Logged ${daysLogged} period day(s) starting ${formatDisplayDate(startDateStr)}`);
    setShowCarePopup(true);
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
              onLogFullPeriodEpisode={handleLogFullPeriodEpisode}
              displayTemp={displayTemp}
              onTriggerCareModal={() => setShowCarePopup(true)}
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
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              isDark={isDark}
              logs={logs}
              settings={settings}
              cycleStats={cycleStats}
              displayTemp={displayTemp}
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
            />
          )}
        </main>

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
                    "Dear Nechu, I know you're having a hard time. Hydrate and have your favorite chocolates."}
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
  onLogFullPeriodEpisode,
  displayTemp,
  onTriggerCareModal
}) {
  const today = getTodayStr();
  const todayLog = logs[today] || {};
  const phaseInfo = PHASE_DETAILS[cycleStats.currentPhase] || PHASE_DETAILS.Unknown;
  const [previewCareCard, setPreviewCareCard] = useState(false);

  // Dial calculations
  const cycleLen = cycleStats.expectedCycleLength || 28;
  const periodLen = cycleStats.expectedPeriodLength || 5;
  const ovDay = cycleLen - (cycleStats.lutealLength || 14);
  const currentDay = cycleStats.currentCycleDay || 1;
  const clampedDay = Math.min(Math.max(currentDay, 1), cycleLen);

  // SVG Ring Parameters
  const size = 250;
  const strokeWidth = 18;
  const center = size / 2;
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;

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
              🍫 {previewCareCard ? 'Hide Care Note' : 'Care Note'}
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
                  "Dear Nechu, I know you're having a hard time. Hydrate and have your favorite chocolates."}
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
        {/* Subtle Ambient Glow */}
        <div
          className="w-48 h-48 rounded-full blur-3xl opacity-20 absolute -top-10 pointer-events-none"
          style={{ backgroundColor: phaseInfo.accent }}
        />

        <div className="relative flex items-center justify-center my-1">
          <svg width={size} height={size} className="overflow-visible">
            {/* Base Track Circle */}
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

        {/* Dynamic SVG Hormone Curve calibrated to user's cycle length & ovulation day */}
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
// HORMONE CURVE SVG VISUALIZER COMPONENT
// ============================================================================
function HormoneCurveChart({ cycleLen, ovDay, currentDay, isDark }) {
  const width = 340;
  const height = 105;

  // Generate smooth paths for Estrogen, Progesterone, and LH across 1..cycleLen
  const pointsEstrogen = [];
  const pointsProgesterone = [];
  const pointsLH = [];

  for (let d = 1; d <= cycleLen; d++) {
    const x = ((d - 1) / (cycleLen - 1)) * width;
    const normOv = ovDay;

    // Estrogen peaks just before ovulation, dips, and has a secondary smaller dome in mid-luteal
    const ePeak1 = Math.exp(-Math.pow((d - (normOv - 1)) / 3.2, 2)) * 0.78;
    const ePeak2 = Math.exp(-Math.pow((d - (normOv + (cycleLen - normOv) * 0.5)) / 4.5, 2)) * 0.42;
    const eVal = 0.12 + ePeak1 + ePeak2;
    const yE = height - Math.min(0.95, eVal) * (height - 18) - 8;
    pointsEstrogen.push(`${x.toFixed(1)},${yE.toFixed(1)}`);

    // LH surges sharply at normOv
    const lhSurge = Math.exp(-Math.pow((d - normOv) / 1.1, 2)) * 0.85;
    const yLH = height - (0.08 + lhSurge) * (height - 18) - 8;
    pointsLH.push(`${x.toFixed(1)},${yLH.toFixed(1)}`);

    // Progesterone stays flat in follicular, rises strongly in luteal phase
    const lutealMid = normOv + (cycleLen - normOv) * 0.52;
    const pRise = d > normOv - 1 ? Math.exp(-Math.pow((d - lutealMid) / 4.0, 2)) * 0.82 : 0.02;
    const yP = height - (0.08 + pRise) * (height - 18) - 8;
    pointsProgesterone.push(`${x.toFixed(1)},${yP.toFixed(1)}`);
  }

  const currentX = ((Math.min(cycleLen, Math.max(1, currentDay)) - 1) / (cycleLen - 1)) * width;

  return (
    <div className="w-full overflow-hidden">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible">
        {/* Background Grid Lines */}
        <line
          x1="0"
          y1={height - 8}
          x2={width}
          y2={height - 8}
          stroke={isDark ? '#27272a' : '#f4f4f5'}
          strokeWidth="1"
        />

        {/* LH Curve (Teal) */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeDasharray="3 2"
          points={pointsLH.join(' ')}
          opacity="0.85"
        />

        {/* Estrogen Curve (Violet/Rose) */}
        <polyline
          fill="none"
          stroke="#c084fc"
          strokeWidth="2.5"
          points={pointsEstrogen.join(' ')}
        />

        {/* Progesterone Curve (Amber) */}
        <polyline
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.5"
          points={pointsProgesterone.join(' ')}
        />

        {/* Current Day Vertical Marker */}
        <line
          x1={currentX}
          y1="6"
          x2={currentX}
          y2={height - 6}
          stroke="#f43f5e"
          strokeWidth="2"
        />
        <circle cx={currentX} cy="10" r="4" fill="#f43f5e" />
      </svg>

      <div className="flex items-center justify-between text-[10px] mt-1 px-1">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> Estrogen
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> LH Surge
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Progesterone
          </span>
        </div>
        <span className="text-rose-400 font-semibold">▲ Today</span>
      </div>
    </div>
  );
}

// ============================================================================
// 2. INTERACTIVE MONTHLY CALENDAR VIEW
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
  displayTemp
}) {
  const today = getTodayStr();
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
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

  return (
    <div className="space-y-4">
      {/* Month Header Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h2>
          <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            Tap any date to inspect or log flow & symptoms
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={goToToday}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border ${isDark
              ? 'bg-zinc-900 border-zinc-800 text-rose-300'
              : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className={`p-1.5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-rose-100'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className={`p-1.5 rounded-xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-rose-100'
              }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
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

                {/* Today Indicator */}
                {isToday && !hasFlow && (
                  <span className="text-[8px] font-bold uppercase text-rose-400 leading-none">
                    Today
                  </span>
                )}

                {/* Ovulation Star */}
                {isOvulation && (
                  <span className="absolute -top-1 -right-1 text-[10px]" title="Estimated Ovulation">
                    ✦
                  </span>
                )}

                {/* Symptom/BBT Dot Indicator */}
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

      {/* Selected Date Inspector Sheet */}
      <div
        className={`rounded-3xl p-4 border ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-bold text-sm">
              {formatDisplayDate(selectedDate, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {selMarker.isOvulation
                ? 'Peak Fertility • Estimated Ovulation Day'
                : selMarker.isFertile
                  ? 'High Fertility Window'
                  : selMarker.isPredictedPeriod
                    ? 'Predicted Period Day'
                    : 'Tap below to log or edit records'}
            </p>
          </div>

          <div className="flex gap-2">
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

        {/* Details for Selected Day */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {selLog.bbt && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🌡️ {displayTemp(selLog.bbt)}°{settings.bbtUnit}
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
          {!selLog.flow &&
            !selLog.bbt &&
            (!selLog.symptoms || selLog.symptoms.length === 0) &&
            (!selLog.mood || selLog.mood.length === 0) && (
              <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                No specific symptoms logged on this date.
              </span>
            )}
        </div>
        {selLog.notes && (
          <p className={`mt-2 text-xs italic ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Note: "{selLog.notes}"
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. DAILY LOGGER & CUSTOM SYMPTOM BUILDER VIEW
// ============================================================================
function LoggerView({
  isDark,
  logs,
  settings,
  setSettings,
  selectedDate,
  setSelectedDate,
  updateDayLog,
  showToast
}) {
  const currentLog = logs[selectedDate] || { date: selectedDate };
  const [newCustomSymptom, setNewCustomSymptom] = useState('');
  const [bbtInput, setBbtInput] = useState(() => {
    if (!currentLog.bbt) return '';
    return settings.bbtUnit === 'F'
      ? ((parseFloat(currentLog.bbt) * 9) / 5 + 32).toFixed(2)
      : currentLog.bbt;
  });

  // Sync BBT input when selectedDate changes
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
    // Always store internally in Celsius for uniform charting
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

  return (
    <div className="space-y-4">
      {/* Date Switcher Bar */}
      <div
        className={`flex items-center justify-between p-3 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          className="p-2 rounded-xl hover:bg-zinc-800/50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">
            Daily Body Logger
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

      {/* 2. Basal Body Temperature (BBT) & Cervical Fluid */}
      <div
        className={`p-4 rounded-3xl border space-y-4 ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold">
                Basal Body Temperature (°{settings.bbtUnit})
              </h3>
            </div>
            <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Post-ovulation rises ~0.3°C
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              placeholder={settings.bbtUnit === 'F' ? 'e.g. 97.45' : 'e.g. 36.35'}
              value={bbtInput}
              onChange={(e) => handleSaveBbt(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-2xl border text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500 ${isDark
                ? 'bg-zinc-950 border-zinc-800 text-zinc-100'
                : 'bg-rose-50/40 border-rose-200 text-zinc-900'
                }`}
            />
            {bbtInput && (
              <button
                onClick={() => handleSaveBbt('')}
                className="px-3 py-2.5 rounded-2xl text-xs bg-zinc-800 text-zinc-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Cervical Mucus */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold">Cervical Fluid (Fertility Sign)</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mucusTypes.map((m) => {
              const active = (currentLog.mucus || 'none') === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => updateDayLog(selectedDate, { mucus: m.id })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${active
                    ? 'bg-emerald-500 text-white border-emerald-500 font-semibold shadow-sm'
                    : isDark
                      ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300'
                      : 'bg-rose-50/40 border-rose-100 text-zinc-700'
                    }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Custom Symptoms & Body Signals (With Custom Tag Builder) */}
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
// 4. ANALYTICS, BBT CHART & SYMPTOM CORRELATION VIEW
// ============================================================================
function AnalyticsView({ isDark, logs, settings, cycleStats, displayTemp }) {
  // Compute symptom frequency & typical cycle day correlation
  const symptomStats = useMemo(() => {
    const counts = {};
    Object.values(logs).forEach((entry) => {
      (entry.symptoms || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
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
      <div>
        <h2 className="text-lg font-bold">Cycle Intelligence & History</h2>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
          Calculated locally via weighted moving average & luteal calibration
        </p>
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
            Variation (SD): ±{cycleStats.stdDev} days
          </p>
        </div>
      </div>

      {/* Cycle History Bar Chart & Timeline */}
      <div
        className={`p-4 rounded-3xl border ${isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-rose-100 shadow-sm'
          }`}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">Logged Cycle History</h3>
          <span className="text-[11px] text-rose-400 font-semibold">
            {cycleStats.cycles.length} Cycles Tracked
          </span>
        </div>

        {cycleStats.cycles.length === 0 ? (
          <p className="text-xs text-zinc-400 py-4 text-center">
            Log at least two periods to see cycle length comparisons.
          </p>
        ) : (
          <div className="space-y-3">
            {cycleStats.cycles
              .slice()
              .reverse()
              .map((c, idx) => {
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
  onTriggerCareModal
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
                "Dear Nechu, I know you're having a hard time. Hydrate and have your favorite chocolates."
            }));
            showToast("Reset to Nechu's default care message");
          }}
          className="text-[11px] text-amber-400 font-semibold"
        >
          Reset to Default Message for Nechu
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
                  localStorage.removeItem('aura_local_logs_v1');
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