import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import * as XLSX from "xlsx";
import logoImg from "./logo.png";
import bgImg from "./خلفية.webp";

/* ═══ SETTINGS ════════════════════════════════════════ */
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || (
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:3001"
    : "https://najd-academy-system-production.up.railway.app"
);

const isTrainingActive = (tr) => {
  if (tr.isRecurring || tr.isRecurring === undefined) return true;
  if (!tr.date) return true;
  try {
    const sessionDate = new Date(tr.date);
    let hours = 16;
    let minutes = 0;
    if (tr.time) {
      const timeStr = tr.time.trim();
      const match = timeStr.match(/(\d+):(\d+)\s*(م|ص)?/);
      if (match) {
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        const ampm = match[3];
        if (ampm === "م" && hours < 12) hours += 12;
        if (ampm === "ص" && hours === 12) hours = 0;
      }
    }
    sessionDate.setHours(hours, minutes, 0, 0);
    const durationMin = parseInt(tr.duration) || 90;
    const expiryTime = sessionDate.getTime() + (durationMin * 60 * 1000);
    return Date.now() < expiryTime;
  } catch (e) {
    return true;
  }
};

const getLocalDateString = (date) => {
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const compareDates = (dateVal1, dateVal2) => {
  if (!dateVal1 || !dateVal2) return false;
  const d1 = typeof dateVal1 === "string" ? dateVal1.substring(0, 10) : getLocalDateString(dateVal1);
  const d2 = typeof dateVal2 === "string" ? dateVal2.substring(0, 10) : getLocalDateString(dateVal2);
  return d1 === d2;
};

const formatArabicDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const cleanStr = typeof dateStr === "string" ? dateStr.substring(0, 10) : getLocalDateString(new Date(dateStr));
    const parts = cleanStr.split("-");
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  } catch (e) {
    return dateStr;
  }
};

const getGroupScheduledDates = (groupId, trainings, daysBack = 45, daysForward = 7) => {
  if (!groupId) return [];
  const groupTrainings = (trainings || []).filter(tr => tr.groupId === groupId);
  const trainingDays = [];
  groupTrainings.forEach(tr => {
    if (tr.days && Array.isArray(tr.days)) {
      tr.days.forEach(d => {
        if (!trainingDays.includes(d)) trainingDays.push(d);
      });
    }
  });

  if (trainingDays.length === 0) return [];

  const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const dates = [];
  
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setDate(end.getDate() + daysForward);
  end.setHours(0, 0, 0, 0);

  let current = new Date(start);
  let loopCount = 0;
  while (current <= end && loopCount < 1000) {
    loopCount++;
    const dayName = ARABIC_DAYS[current.getDay()];
    if (trainingDays.includes(dayName)) {
      dates.push(getLocalDateString(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates.reverse();
};

const getPlayerSubscriptionDetails = (player, trainings, attendance, payments) => {
  const todayStr = getLocalDateString(new Date());
  const joinDate = player ? (player.joinDate || todayStr) : "";
  if (!player || !player.groupId || !joinDate) {
    return {
      cycleSessions: [],
      attendedCount: 0,
      absentCount: 0,
      excusedCount: 0,
      remainingCount: 0,
      cycleIndex: 1,
      isUnpaid: false,
      isExpired: false,
      isActive: false
    };
  }

  const playerSubPays = (payments || []).filter(pay => String(pay.playerId) === String(player.id) && pay.type === "subscription");
  const P = playerSubPays.length;

  if (P === 0) {
    return {
      cycleSessions: [],
      attendedCount: 0,
      absentCount: 0,
      excusedCount: 0,
      remainingCount: 0,
      cycleIndex: 0,
      isUnpaid: true,
      isExpired: false,
      isActive: false
    };
  }

  const groupTrainings = (trainings || []).filter(tr => tr.groupId === player.groupId);
  const groupAttendance = (attendance || []).filter(a => a.groupId === player.groupId);

  if (groupTrainings.length === 0 && groupAttendance.length === 0) {
    return {
      cycleSessions: [],
      attendedCount: 0,
      absentCount: 0,
      excusedCount: 0,
      remainingCount: 0,
      cycleIndex: 1,
      isUnpaid: false,
      isExpired: false,
      isActive: false
    };
  }

  const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const isGroupTrainingDay = (dateObj, dateStr) => {
    const dayName = ARABIC_DAYS[dateObj.getDay()];
    
    // Match days should not count towards subscription training sessions
    const isMatchDay = groupTrainings.some(tr => {
      if (tr.type === "match") {
        if (tr.isRecurring === false || tr.isRecurring === undefined) {
          return tr.date && compareDates(tr.date, dateStr);
        } else {
          return tr.days && tr.days.includes(dayName);
        }
      }
      return false;
    });

    if (isMatchDay) {
      return false;
    }

    // Check if the date falls within any freeze period of the player
    if (player.freezePeriods) {
      try {
        const periods = JSON.parse(player.freezePeriods);
        for (const period of periods) {
          if (period.start && dateStr >= period.start) {
            if (period.end) {
              if (dateStr <= period.end) {
                return false; // Skip training day because player is frozen during this period
              }
            } else {
              return false; // Active freeze to infinity - skip all training days on/after start
            }
          }
        }
      } catch (e) {
        console.error("Error parsing freeze periods:", e);
      }
    }

    // 2. Check current training schedules
    for (const tr of groupTrainings) {
      if (tr.type === "match") continue;
      
      if (tr.isRecurring === false || tr.isRecurring === undefined) {
        if (tr.date && compareDates(tr.date, dateStr)) {
          return true;
        }
      } else {
        if (tr.days && tr.days.includes(dayName)) {
          return true;
        }
      }
    }
    return false;
  };

  // Sort sub payments chronologically
  const sortedSubPays = [...playerSubPays].sort((a, b) => {
    const da = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
    const db = typeof b.date === "string" ? b.date.substring(0, 10) : getLocalDateString(b.date);
    return da.localeCompare(db);
  });

  const cycles = [];
  let lastCycleEndDate = null;

  for (let c = 1; c <= P; c++) {
    const pay = sortedSubPays[c - 1];
    let startDateStr = typeof pay.date === "string" ? pay.date.substring(0, 10) : getLocalDateString(pay.date);
    
    if (lastCycleEndDate) {
      if (startDateStr < lastCycleEndDate) {
        startDateStr = lastCycleEndDate;
      }
    }

    const cycleDates = [];
    
    // Parse the start date string safely
    const parts = startDateStr.split("-");
    let current = new Date(parts[0], parts[1] - 1, parts[2]);
    if (lastCycleEndDate && startDateStr === lastCycleEndDate) {
      current.setDate(current.getDate() + 1);
    }
    current.setHours(0, 0, 0, 0);

    let safety = 0;
    while (cycleDates.length < 12 && safety < 5000) {
      safety++;
      const dateStr = getLocalDateString(current);
      if (isGroupTrainingDay(current, dateStr)) {
        cycleDates.push(dateStr);
      }
      current.setDate(current.getDate() + 1);
    }

    lastCycleEndDate = cycleDates[cycleDates.length - 1];
    cycles.push({
      cycleIndex: c,
      sessions: cycleDates
    });
  }

  // The active cycle is the P-th cycle
  const currentCycle = cycles[P - 1];
  const lastSessionDate = currentCycle ? (currentCycle.sessions[currentCycle.sessions.length - 1] || "") : "";
  
  // A cycle is expired if its last session is already in the past (strictly < todayStr)
  const isExpired = player.status === "مجمّد" ? false : (lastSessionDate ? lastSessionDate < todayStr : false);
  
  // Let's populate cycleSessions details for the active cycle P
  const cycleSessions = [];
  if (currentCycle && currentCycle.sessions) {
    currentCycle.sessions.forEach(dateStr => {
      const isFuture = dateStr > todayStr;
      let status = "حاضر";
      if (!isFuture) {
        const record = (attendance || []).find(a => compareDates(a.date, dateStr) && a.groupId === player.groupId);
        if (record && record.records) {
          const playerRecKey = Object.keys(record.records).find(k => String(k) === String(player.id));
          if (playerRecKey) {
            status = record.records[playerRecKey];
          }
        }
      } else {
        status = "قادم";
      }

      cycleSessions.push({
        date: dateStr,
        isFuture,
        status
      });
    });
  }

  // Pad the cycleSessions to 12 if currently frozen
  if (player.status === "مجمّد") {
    while (cycleSessions.length < 12) {
      cycleSessions.push({
        date: null,
        isFuture: true,
        status: "مجمّد",
        isFrozen: true
      });
    }
  }

  let attendedCount = 0;
  let absentCount = 0;
  let excusedCount = 0;
  let remainingCount = 0;

  cycleSessions.forEach(s => {
    if (s.isFrozen) {
      remainingCount++;
    } else if (s.isFuture) {
      remainingCount++;
    } else {
      if (s.status === "حاضر") attendedCount++;
      else if (s.status === "غائب") absentCount++;
      else if (s.status === "بعذر") excusedCount++;
    }
  });

  return {
    cycleSessions,
    attendedCount,
    absentCount,
    excusedCount,
    remainingCount,
    cycleIndex: P,
    isUnpaid: false,
    isExpired,
    isActive: !isExpired
  };
}

/* ── INTERACTIVE PLAYER ATTENDANCE GRID ──────────────── */
const PlayerAttendanceGrid = ({ player, subDetails, attendance, setAttendance, t }) => {
  const [activeCell, setActiveCell] = useState(null);

  const handleStatusSelect = (s, status) => {
    // Find group attendance record
    const existing = (attendance || []).find(a => compareDates(a.date, s.date) && a.groupId === player.groupId);
    if (existing) {
      const updated = {
        ...existing,
        records: {
          ...existing.records,
          [player.id]: status
        }
      };
      setAttendance(prev => prev.map(x => x.id === existing.id ? updated : x));
    } else {
      const newAtt = {
        id: `att${Date.now()}`,
        date: s.date,
        groupId: player.groupId,
        records: {
          [player.id]: status
        }
      };
      setAttendance(prev => [...prev, newAtt]);
    }
    setActiveCell(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 }}>
      {subDetails.cycleSessions.map((s, idx) => {
        const isActive = activeCell === idx;
        const isBlurred = activeCell !== null && activeCell !== idx;
        
        let bgColor = t.bg2;
        let borderCol = t.border;
        let textColor = t.textDim;
        let icon = "⭕";
        
        if (s.isFrozen) {
          bgColor = "rgba(59,130,246,0.08)";
          borderCol = "rgba(59,130,246,0.2)";
          textColor = "#3B82F6";
          icon = "❄️";
        } else if (!s.isFuture) {
          if (s.status === "حاضر") {
            bgColor = "rgba(16,185,129,0.08)";
            borderCol = "rgba(16,185,129,0.2)";
            textColor = "#10B981";
            icon = "✅";
          } else if (s.status === "غائب") {
            bgColor = "rgba(239,68,68,0.08)";
            borderCol = "rgba(239,68,68,0.2)";
            textColor = "#EF4444";
            icon = "❌";
          } else if (s.status === "بعذر") {
            bgColor = "rgba(245,158,11,0.08)";
            borderCol = "rgba(245,158,11,0.2)";
            textColor = "#F59E0B";
            icon = "⚠️";
          }
        }
        
        return (
          <div key={idx} 
            onClick={() => {
              if (!s.isFuture && !s.isFrozen && setAttendance) {
                setActiveCell(activeCell === idx ? null : idx);
              }
            }}
            style={{ 
              background: bgColor, 
              border: `1px solid ${borderCol}`, 
              padding: "10px 6px", 
              borderRadius: 14, 
              textAlign: "center", 
              display: "flex", 
              flexDirection: "column", 
              gap: 4, 
              alignItems: "center", 
              boxShadow: "0 2px 6px rgba(0,0,0,0.01)",
              transition: "all 0.3s ease",
              filter: isBlurred ? "blur(2.5px)" : "none",
              opacity: isBlurred ? 0.35 : 1,
              pointerEvents: isBlurred ? "none" : "auto",
              cursor: (s.isFuture || s.isFrozen || !setAttendance) ? "default" : "pointer",
              minHeight: 68,
              justifyContent: "center"
            }}
          >
            {isActive ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }} onClick={(e) => e.stopPropagation()}>
                <button title="حاضر" onClick={() => handleStatusSelect(s, "حاضر")} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", padding: "4px 2px", outline: "none" }}>✅</button>
                <button title="غائب" onClick={() => handleStatusSelect(s, "غائب")} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", padding: "4px 2px", outline: "none" }}>❌</button>
                <button title="بعذر" onClick={() => handleStatusSelect(s, "بعذر")} style={{ border: "none", background: "none", fontSize: 16, cursor: "pointer", padding: "4px 2px", outline: "none" }}>⚠️</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: t.textFaint, fontWeight: 700 }}>حصة {idx + 1}</div>
                <div style={{ fontSize: 14 }}>{icon}</div>
                <div style={{ fontSize: 9, fontWeight: 800, color: textColor }}>{s.isFrozen ? "مجمّد" : formatArabicDate(s.date)}</div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};


/* ═══ LOGO ═══════════════════════════════════════════ */
const NajdLogo = ({ size = 48 }) => {
  return (
    <img 
      src={logoImg} 
      alt="نادي نجد" 
      style={{ 
        width: size, 
        height: size, 
        objectFit: "contain", 
        borderRadius: size / 4 
      }} 
      onError={(e) => {
        // Fallback to SVG if image fails to load
        e.target.style.display = "none";
      }}
    />
  );
};

/* ═══ ANIMATED ICONS ══════════════════════════════════ */
const AnimIcon = ({ type, size = 20, color = "#C4B5FD" }) => {
  const icons = {
    dashboard: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes db1{0%,100%{opacity:1}50%{opacity:.35}}
          @keyframes db2{0%,100%{opacity:.5}50%{opacity:1}}
          .db-r1{animation:db1 2s ease-in-out infinite}
          .db-r2{animation:db2 2s ease-in-out infinite .3s}
          .db-r3{animation:db1 2s ease-in-out infinite .6s}
          .db-r4{animation:db2 2s ease-in-out infinite .9s}
        `}</style>
        <rect className="db-r1" x="3" y="3" width="7" height="7" rx="1.5" fill={color}/>
        <rect className="db-r2" x="14" y="3" width="7" height="7" rx="1.5" fill={color}/>
        <rect className="db-r3" x="3" y="14" width="7" height="7" rx="1.5" fill={color}/>
        <rect className="db-r4" x="14" y="14" width="7" height="7" rx="1.5" fill={color}/>
      </svg>
    ),
    teams: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes tm-orb{0%,100%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
          @keyframes tm-p{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
          .tm-ring{animation:tm-orb 6s linear infinite;transform-origin:12px 12px}
          .tm-p1{animation:tm-p 1.6s ease-in-out infinite}
          .tm-p2{animation:tm-p 1.6s ease-in-out infinite .4s}
          .tm-p3{animation:tm-p 1.6s ease-in-out infinite .8s}
        `}</style>
        <g className="tm-p1"><circle cx="12" cy="7" r="3" fill={color}/></g>
        <g className="tm-p2"><circle cx="5.5" cy="17" r="2.3" fill={color} opacity=".7"/></g>
        <g className="tm-p3"><circle cx="18.5" cy="17" r="2.3" fill={color} opacity=".7"/></g>
        <g className="tm-ring" opacity=".3">
          <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1" strokeDasharray="4 2"/>
        </g>
      </svg>
    ),
    players: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes pl-b{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
          @keyframes pl-s{0%,100%{transform:translateX(0)}50%{transform:translateX(2px)}}
          .pl-m{animation:pl-b 1.8s ease-in-out infinite;transform-origin:9px 8px}
          .pl-s2{animation:pl-s 1.8s ease-in-out infinite .4s;transform-origin:17px 8px}
        `}</style>
        <g className="pl-m">
          <circle cx="9" cy="7" r="3.5" fill={color}/>
          <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </g>
        <g className="pl-s2" opacity=".55">
          <circle cx="17" cy="7" r="2.5" fill={color}/>
          <path d="M15.5 21v-.5a3.5 3.5 0 0 1 3.5-3.5h.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    coaches: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes co-star{0%{transform:rotate(0) scale(1)}50%{transform:rotate(180deg) scale(1.2)}100%{transform:rotate(360deg) scale(1)}}
          .co-star{animation:co-star 3s ease-in-out infinite;transform-origin:19px 5px}
        `}</style>
        <circle cx="10" cy="8" r="4" fill={color}/>
        <path d="M4 20v-1a6 6 0 0 1 12 0v1" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        <g className="co-star">
          <polygon points="19,2 20.2,4.8 23.2,4.8 21,6.6 21.9,9.5 19,7.6 16.1,9.5 17,6.6 14.8,4.8 17.8,4.8" fill="#D8A435" opacity=".9"/>
        </g>
      </svg>
    ),
    schedule: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes sc-blink{0%,100%{opacity:1}50%{opacity:0}}
          .sc-d1{animation:sc-blink 1.2s ease-in-out infinite}
          .sc-d2{animation:sc-blink 1.2s ease-in-out infinite .4s}
          .sc-d3{animation:sc-blink 1.2s ease-in-out infinite .8s}
        `}</style>
        <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8"/>
        <line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8"  y1="2" x2="8"  y2="6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.8"/>
        <circle className="sc-d1" cx="8"  cy="15" r="1.5" fill={color}/>
        <circle className="sc-d2" cx="12" cy="15" r="1.5" fill={color}/>
        <circle className="sc-d3" cx="16" cy="15" r="1.5" fill={color}/>
      </svg>
    ),
    attendance: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes att-draw{0%{stroke-dashoffset:30}100%{stroke-dashoffset:0}}
          @keyframes att-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
          .att-check{stroke-dasharray:30;animation:att-draw 1s ease-out infinite alternate}
          .att-box{animation:att-pulse 2s ease-in-out infinite;transform-origin:12px 12px}
        `}</style>
        <g className="att-box">
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </g>
        <path className="att-check" d="M9 12l3 3 9-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    payments: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes pay-slide{0%{transform:translateX(5px);opacity:0}30%{opacity:1}100%{transform:translateX(-5px);opacity:0}}
          @keyframes pay-glow{0%,100%{opacity:.6}50%{opacity:1}}
          .pay-coin{animation:pay-slide 2s ease-in-out infinite}
          .pay-card{animation:pay-glow 2s ease-in-out infinite}
        `}</style>
        <g className="pay-card">
          <rect x="1" y="5" width="22" height="15" rx="2" stroke={color} strokeWidth="1.8"/>
          <line x1="1" y1="10" x2="23" y2="10" stroke={color} strokeWidth="1.8"/>
        </g>
        <g className="pay-coin">
          <circle cx="12" cy="15" r="2" fill={color} opacity=".85"/>
        </g>
      </svg>
    ),
    notify: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes bell-ring{0%,100%{transform:rotate(0)}15%{transform:rotate(14deg)}30%{transform:rotate(-11deg)}45%{transform:rotate(7deg)}60%{transform:rotate(-4deg)}75%{transform:rotate(2deg)}}
          .bell-b{animation:bell-ring 2.5s ease-in-out infinite;transform-origin:12px 6px}
        `}</style>
        <g className="bell-b">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    messages: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes msg-bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
          @keyframes msg-dot{0%,100%{transform:scale(1)}50%{transform:scale(1.5)}}
          .msg-b{animation:msg-bounce 2s ease-in-out infinite}
          .msg-d1{animation:msg-dot 1.2s ease-in-out infinite}
          .msg-d2{animation:msg-dot 1.2s ease-in-out infinite .2s}
          .msg-d3{animation:msg-dot 1.2s ease-in-out infinite .4s}
        `}</style>
        <g className="msg-b">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <circle className="msg-d1" cx="9"  cy="10" r="1.2" fill={color}/>
          <circle className="msg-d2" cx="12" cy="10" r="1.2" fill={color}/>
          <circle className="msg-d3" cx="15" cy="10" r="1.2" fill={color}/>
        </g>
      </svg>
    ),
    prices: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes pr-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
          .pr-tag{animation:pr-spin 6s linear infinite;transform-origin:12px 12px}
        `}</style>
        <g className="pr-tag">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <line x1="7" y1="7" x2="7.01" y2="7" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </svg>
    ),
    permissions: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes sh-lock{0%,70%,100%{transform:translateY(0)}40%{transform:translateY(-2px)}}
          @keyframes sh-glow{0%,100%{opacity:.5}50%{opacity:1}}
          .sh-body{animation:sh-lock 2.5s ease-in-out infinite;transform-origin:12px 14px}
          .sh-glow{animation:sh-glow 2s ease-in-out infinite}
        `}</style>
        <g className="sh-body">
          <rect x="5" y="11" width="14" height="10" rx="2" fill={`${color}20`} stroke={color} strokeWidth="1.8"/>
          <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <circle className="sh-glow" cx="12" cy="16" r="1.5" fill={color}/>
        </g>
      </svg>
    ),
    sun: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes sun-spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
          @keyframes sun-pulse{0%,100%{r:4.5}50%{r:5.5}}
          .sun-rays{animation:sun-spin 8s linear infinite;transform-origin:12px 12px}
          .sun-core{animation:sun-pulse 2s ease-in-out infinite}
        `}</style>
        <g className="sun-rays">
          {[0,45,90,135,180,225,270,315].map((a,i)=>(
            <line key={i}
              x1={12 + 7*Math.cos(a*Math.PI/180)} y1={12 + 7*Math.sin(a*Math.PI/180)}
              x2={12 + 9.5*Math.cos(a*Math.PI/180)} y2={12 + 9.5*Math.sin(a*Math.PI/180)}
              stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          ))}
        </g>
        <circle className="sun-core" cx="12" cy="12" r="4.5" fill={color}/>
      </svg>
    ),
    moon: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes moon-glow{0%,100%{filter:drop-shadow(0 0 3px #A855F7)}50%{filter:drop-shadow(0 0 8px #A855F7)}}
          .moon-icon{animation:moon-glow 2s ease-in-out infinite}
        `}</style>
        <g className="moon-icon">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill={color} opacity=".9"/>
        </g>
      </svg>
    ),
    freeze: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes frz-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
          .frz-icon{animation:frz-spin 12s linear infinite;transform-origin:12px 12px}
        `}</style>
        <g className="frz-icon" stroke={color} strokeWidth="1.8" strokeLinecap="round">
          <line x1="12" y1="2" x2="12" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="5" y1="5" x2="19" y2="19" />
          <line x1="5" y1="19" x2="19" y2="5" />
          <path d="M12 5l-2-2M12 5l2-2" />
          <path d="M12 19l-2 2M12 19l2 2" />
          <path d="M5 12l-2-2M5 12l-2 2" />
          <path d="M19 12l2-2M19 12l2 2" />
        </g>
      </svg>
    ),
    unfreeze: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes unf-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
          .unf-icon{animation:unf-pulse 2s ease-in-out infinite;transform-origin:12px 12px}
        `}</style>
        <g className="unf-icon" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeJoin="round">
          <path d="M12 2c0 0-4 4.5-4 8.5C8 13 9.8 15 12 15s4-2 4-4.5c0-4-4-8.5-4-8.5z" fill={`${color}20`} />
          <path d="M12 6c0 0-2 2-2 4 0 1.1.9 2 2 2s2-.9 2-2c0-2-2-4-2-4z" />
          <path d="M12 21h.01" strokeWidth="3" />
        </g>
      </svg>
    ),
    search: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes srch-p{0%,100%{r:7}50%{r:8}} .srch-c{animation:srch-p 2s ease-in-out infinite}`}</style>
        <circle className="srch-c" cx="11" cy="11" r="7" stroke={color} strokeWidth="1.8"/>
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    trophy: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`@keyframes tr-shine{0%,100%{opacity:.6}50%{opacity:1}} .tr-g{animation:tr-shine 2s ease-in-out infinite}`}</style>
        <g className="tr-g">
          <path d="M8 21h8M12 17v4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M5 3H3v5a4 4 0 0 0 4 4M19 3h2v5a4 4 0 0 1-4 4" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M7 3h10v7a5 5 0 0 1-10 0V3z" stroke={color} strokeWidth="1.8"/>
        </g>
      </svg>
    ),
    chart: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <style>{`
          @keyframes ch-g{0%{transform:scaleY(0.2)}100%{transform:scaleY(1)}}
          .ch-b1{transform-origin:bottom;animation:ch-g 1s ease-out .1s both}
          .ch-b2{transform-origin:bottom;animation:ch-g 1s ease-out .3s both}
          .ch-b3{transform-origin:bottom;animation:ch-g 1s ease-out .5s both}
        `}</style>
        <line x1="3" y1="20" x2="21" y2="20" stroke={color} strokeWidth="1.5"/>
        <rect className="ch-b1" x="5"  y="12" width="4" height="8" rx="1" fill={color} opacity=".5"/>
        <rect className="ch-b2" x="10" y="7"  width="4" height="13" rx="1" fill={color} opacity=".75"/>
        <rect className="ch-b3" x="15" y="3"  width="4" height="17" rx="1" fill={color}/>
      </svg>
    ),
    edit:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></svg>,
    trash: <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><polyline points="3 6 5 6 21 6" stroke={color} strokeWidth="1.8"/><path d="M19 6l-1 14H6L5 6" stroke={color} strokeWidth="1.8"/><path d="M10 11v6M14 11v6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M9 6V4h6v2" stroke={color} strokeWidth="1.8"/></svg>,
    eye:   <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8"/></svg>,
    plus:  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  };
  return icons[type] || null;
};

/* ═══ CONSTANTS ═══════════════════════════════════════ */
const PRICE_LIST = { subscription: 350, bus: 200, uniform: 180, bag: 95, jersey: 120 };
const PAY_TYPES = {
  subscription: { label: "اشتراك شهري", icon: "💳", color: "#A855F7" },
  bus:          { label: "اشتراك الباص",  icon: "🚌", color: "#3B82F6" },
  uniform:      { label: "لبس / طقم",   icon: "👕", color: "#06B6D4" },
  bag:          { label: "شنطة",         icon: "🎒", color: "#F59E0B" },
  jersey:       { label: "قميص رسمي",   icon: "🏷️", color: "#10B981" },
};
const ATT_C = { حاضر: "#10B981", غائب: "#EF4444", بعذر: "#F59E0B" };
const fmtMoney = n => Number(n || 0).toLocaleString("en-US") + " ر.س";

const parseExpenseNote = (expense) => {
  if (!expense || !expense.note) {
    return {
      items: expense ? [{ name: expense.item, qty: 1, price: expense.amount }] : [],
      note: ""
    };
  }
  try {
    const parsed = JSON.parse(expense.note);
    if (parsed && Array.isArray(parsed.items)) {
      return {
        items: parsed.items,
        note: parsed.note || ""
      };
    }
  } catch (e) {
    // Not JSON
  }
  return {
    items: [{ name: expense.item, qty: 1, price: expense.amount }],
    note: expense.note
  };
};

/* ═══ DATE UTILS ══════════════════════════════════════ */
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const getCurMonth = () => {
  const d = new Date();
  return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const CUR_MONTH = getCurMonth();
const getMonthFromDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const isMonthAfterJoin = (monthStr, joinDateStr) => {
  if (!joinDateStr) return true;
  const [mName, y] = monthStr.split(" ");
  const mIdx = AR_MONTHS.indexOf(mName);
  const monthDate = new Date(parseInt(y), mIdx, 1);
  const joinDate = new Date(joinDateStr);
  // Compare year and month
  return monthDate.getFullYear() > joinDate.getFullYear() || 
         (monthDate.getFullYear() === joinDate.getFullYear() && monthDate.getMonth() >= joinDate.getMonth());
};

/* ═══ DEFAULT PERMISSIONS ═════════════════════════════ */
const DEFAULT_PERMS = { attendance: true, payments: true, evals: true, messages: true };

/* ═══ DATA ════════════════════════════════════════════ */
const INIT_GROUPS = [
  { id: "g1", name: "تحت 11", coachId: "c1", color: "#06B6D4" },
  { id: "g2", name: "تحت 13", coachId: "c2", color: "#A855F7" },
  { id: "g3", name: "تحت 15", coachId: "c3", color: "#F59E0B" },
];
const INIT_COACHES = [
  { id: "c1", name: "أحمد سالم البقمي",   phone: "0501110001", email: "ahmed@najd.sa",  password: "Coach@1234", specialty: "مهارات فردية", exp: 8,  cert: "UEFA B", groupId: "g1", joined: "2021-01-15", salary: 4500, perms: { ...DEFAULT_PERMS } },
  { id: "c2", name: "خالد مبارك العسيري", phone: "0502220002", email: "khaled@najd.sa", password: "Coach@5678", specialty: "تكتيك وخطط",  exp: 12, cert: "AFC Pro",groupId: "g2", joined: "2019-06-01", salary: 5500, perms: { ...DEFAULT_PERMS } },
  { id: "c3", name: "سعد الرشيدي",        phone: "0503330003", email: "saad@najd.sa",   password: "Coach@9012", specialty: "لياقة بدنية", exp: 6,  cert: "UEFA C", groupId: "g3", joined: "2022-03-10", salary: 4000, perms: { ...DEFAULT_PERMS } },
];
const INIT_PLAYERS = [
  { id:"p1", name:"محمد عبدالله الغامدي",   age:12, groupId:"g2", phone:"0501234567", status:"نشط",   score:85, speed:78, stamina:82, technique:90, teamwork:88, goals:12, assists:7,  attendancePct:92, weight:48, height:158, position:"مهاجم",    parentId:"par1", joinDate:"2024-09-01", email:"p1@najd.sa",  password:"Player@001" },
  { id:"p2", name:"فيصل سعد القحطاني",      age:10, groupId:"g1", phone:"0507654321", status:"نشط",   score:90, speed:88, stamina:85, technique:92, teamwork:91, goals:18, assists:11, attendancePct:96, weight:38, height:142, position:"جناح أيمن",parentId:"par2", joinDate:"2024-08-15", email:"p2@najd.sa",  password:"Player@002" },
  { id:"p3", name:"عمر خالد الزهراني",      age:14, groupId:"g3", phone:"0509876543", status:"نشط",   score:78, speed:80, stamina:75, technique:76, teamwork:80, goals:8,  assists:14, attendancePct:85, weight:58, height:170, position:"وسط",       parentId:"par3", joinDate:"2024-10-01", email:"p3@najd.sa",  password:"Player@003" },
  { id:"p4", name:"يوسف أحمد الشهري",      age:11, groupId:"g2", phone:"0501112233", status:"موقوف", score:65, speed:62, stamina:60, technique:68, teamwork:65, goals:3,  assists:2,  attendancePct:60, weight:42, height:150, position:"مدافع",     parentId:"par4", joinDate:"2024-07-20", email:"p4@najd.sa",  password:"Player@004" },
  { id:"p5", name:"بندر علي الدوسري",      age:13, groupId:"g3", phone:"0504445566", status:"نشط",   score:92, speed:94, stamina:90, technique:91, teamwork:93, goals:22, assists:9,  attendancePct:98, weight:54, height:165, position:"جناح أيسر",parentId:"par5", joinDate:"2024-09-10", email:"p5@najd.sa",  password:"Player@005" },
  { id:"p6", name:"سلطان محمد العتيبي",    age:9,  groupId:"g1", phone:"0506667788", status:"نشط",   score:88, speed:85, stamina:87, technique:89, teamwork:86, goals:15, assists:8,  attendancePct:94, weight:32, height:135, position:"مهاجم",    parentId:"par1", joinDate:"2024-11-01", email:"p6@najd.sa",  password:"Player@006" },
  { id:"p7", name:"نايف عبدالرحمن الحربي", age:12, groupId:"g2", phone:"0508889900", status:"نشط",   score:81, speed:79, stamina:83, technique:80, teamwork:84, goals:9,  assists:12, attendancePct:89, weight:46, height:155, position:"وسط",       parentId:"par6", joinDate:"2024-09-05", email:"p7@najd.sa",  password:"Player@007" },
  { id:"p8", name:"ريان فهد السبيعي",      age:10, groupId:"g1", phone:"0502223344", status:"نشط",   score:74, speed:72, stamina:70, technique:76, teamwork:77, goals:6,  assists:5,  attendancePct:80, weight:36, height:140, position:"مدافع",     parentId:"par7", joinDate:"2024-10-20", email:"p8@najd.sa",  password:"Player@008" },
];
const INIT_PARENTS = [
  { id:"par1", name:"عبدالله الغامدي",  phone:"0551234567", email:"aalghamdi@mail.com", playerIds:["p1","p6"], password:"Parent@111" },
  { id:"par2", name:"سعد القحطاني",     phone:"0557654321", email:"saqahtani@mail.com", playerIds:["p2"],      password:"Parent@222" },
  { id:"par3", name:"خالد الزهراني",    phone:"0559876543", email:"kzahrani@mail.com",  playerIds:["p3"],      password:"Parent@333" },
  { id:"par4", name:"أحمد الشهري",      phone:"0551112233", email:"ashahri@mail.com",   playerIds:["p4"],      password:"Parent@444" },
  { id:"par5", name:"علي الدوسري",      phone:"0554445566", email:"adosari@mail.com",   playerIds:["p5"],      password:"Parent@555" },
  { id:"par6", name:"عبدالرحمن الحربي", phone:"0558889900", email:"aharbi@mail.com",    playerIds:["p7"],      password:"Parent@666" },
  { id:"par7", name:"فهد السبيعي",      phone:"0552223344", email:"fsobiee@mail.com",   playerIds:["p8"],      password:"Parent@777" },
];
const INIT_PAYMENTS = [
  { id:"pay1", playerId:"p1", playerName:"محمد عبدالله الغامدي", coachId:"c2", coachName:"خالد مبارك العسيري", type:"subscription", month:"مارس 2026",  amount:350, date:"2026-03-05", note:"دفع نقدي" },
  { id:"pay2", playerId:"p1", playerName:"محمد عبدالله الغامدي", coachId:"c2", coachName:"خالد مبارك العسيري", type:"subscription", month:CUR_MONTH, amount:350, date:"2026-04-03", note:"تحويل بنكي" },
  { id:"pay3", playerId:"p1", playerName:"محمد عبدالله الغامدي", coachId:"c2", coachName:"خالد مبارك العسيري", type:"uniform",      month:"مارس 2026",  amount:180, date:"2026-03-10", note:"طقم تدريب" },
  { id:"pay4", playerId:"p2", playerName:"فيصل سعد القحطاني",    coachId:"c1", coachName:"أحمد سالم البقمي",   type:"subscription", month:CUR_MONTH, amount:350, date:"2026-04-02", note:"دفع نقدي" },
  { id:"pay5", playerId:"p2", playerName:"فيصل سعد القحطاني",    coachId:"c1", coachName:"أحمد سالم البقمي",   type:"bag",          month:CUR_MONTH, amount:95,  date:"2026-04-08", note:"شنطة رياضية" },
  { id:"pay6", playerId:"p5", playerName:"بندر علي الدوسري",     coachId:"c3", coachName:"سعد الرشيدي",        type:"subscription", month:CUR_MONTH, amount:350, date:"2026-04-01", note:"تحويل بنكي" },
  { id:"pay7", playerId:"p5", playerName:"بندر علي الدوسري",     coachId:"c3", coachName:"سعد الرشيدي",        type:"jersey",       month:"مارس 2026",  amount:120, date:"2026-03-20", note:"قميص رسمي" },
  { id:"pay8", playerId:"p6", playerName:"سلطان محمد العتيبي",   coachId:"c1", coachName:"أحمد سالم البقمي",   type:"subscription", month:CUR_MONTH, amount:350, date:"2026-04-04", note:"دفع نقدي" },
];
const INIT_ATTENDANCE = [
  { id:"att1", date:"2026-04-20", groupId:"g2", coachId:"c2", records:{ p1:"حاضر", p4:"غائب", p7:"حاضر" } },
  { id:"att2", date:"2026-04-17", groupId:"g1", coachId:"c1", records:{ p2:"حاضر", p6:"حاضر", p8:"بعذر" } },
  { id:"att3", date:"2026-04-22", groupId:"g2", coachId:"c2", records:{ p1:"حاضر", p4:"بعذر", p7:"حاضر" } },
];
const INIT_EVALS = [
  { id:"ev1", playerId:"p1", coachId:"c2", date:"2026-04-20", note:"أداء ممتاز في التمرير، يحتاج تحسين الضربات الرأسية", speed:80, technique:88, teamwork:90 },
  { id:"ev2", playerId:"p7", coachId:"c2", date:"2026-04-20", note:"تحسن ملحوظ في الدفاع، يجب التركيز على اللياقة",       speed:75, technique:78, teamwork:85 },
  { id:"ev3", playerId:"p2", coachId:"c1", date:"2026-04-17", note:"سرعة رائعة، التكتيك يحتاج تطوير",                     speed:90, technique:85, teamwork:88 },
];
const INIT_MESSAGES = [
  { id:"msg1", from:"admin", fromName:"الإدارة",              to:"par1", toName:"عبدالله الغامدي",   text:"تذكير: موعد التدريب غداً الساعة 5 مساءً في ملعب B",                   date:"2026-04-22", read:false },
  { id:"msg2", from:"c2",   fromName:"خالد مبارك العسيري",  to:"par1", toName:"عبدالله الغامدي",   text:"أداء محمد ممتاز هذا الأسبوع، أنصح بإضافة تمارين في المنزل",           date:"2026-04-20", read:true  },
  { id:"msg3", from:"admin", fromName:"الإدارة",              to:"par4", toName:"أحمد الشهري",       text:"لاحظنا تغيباً متكرراً ليوسف، نرجو التواصل مع الإدارة",               date:"2026-04-19", read:false },
  { id:"msg4", from:"par1", fromName:"عبدالله الغامدي",      to:"c2",   toName:"خالد مبارك",         text:"شكراً على الاهتمام، هل يمكن تدريب إضافي الجمعة؟",                    date:"2026-04-21", read:true  },
];
const REV_DATA = [
  { month:"أكتوبر", income:8400,  expenses:2100 },
  { month:"نوفمبر", income:9100,  expenses:2300 },
  { month:"ديسمبر", income:8700,  expenses:2000 },
  { month:"يناير",  income:10200, expenses:2500 },
  { month:"فبراير", income:11000, expenses:2700 },
  { month:"مارس",   income:10500, expenses:2400 },
  { month:"أبريل",  income:12400, expenses:2900 },
];
const INIT_COACH_ATTENDANCE = [
  { id: "ca1", date: "2026-04-20", records: { c1: "حاضر", c2: "حاضر", c3: "غائب" } },
  { id: "ca2", date: "2026-04-22", records: { c1: "حاضر", c2: "بعذر", c3: "حاضر" } },
];
const ATT_TREND = [
  { week:"أ1", حاضر:22, غائب:4, بعذر:2 },
  { week:"أ2", حاضر:24, غائب:3, بعذر:1 },
  { week:"أ3", حاضر:20, غائب:6, بعذر:2 },
  { week:"أ4", حاضر:25, غائب:2, بعذر:1 },
  { week:"أ5", حاضر:23, غائب:4, بعذر:1 },
  { week:"أ6", حاضر:26, غائب:2, بعذر:0 },
];
const POS_DATA = [
  { name:"مهاجم", value:3, color:"#EF4444" },
  { name:"وسط",   value:2, color:"#A855F7" },
  { name:"مدافع", value:2, color:"#3B82F6" },
  { name:"جناح",  value:2, color:"#10B981" },
  { name:"حارس",  value:1, color:"#F59E0B" },
];
const USERS = [
  { id:"admin", email:"admin@najd.sa",      password:"Najd@2026",  role:"admin",  name:"مدير النادي"          },
  { id:"c1",    email:"ahmed@najd.sa",      password:"Coach@1234", role:"coach",  name:"أحمد سالم البقمي"    },
  { id:"c2",    email:"khaled@najd.sa",     password:"Coach@5678", role:"coach",  name:"خالد مبارك العسيري"  },
  { id:"c3",    email:"saad@najd.sa",       password:"Coach@9012", role:"coach",  name:"سعد الرشيدي"          },
  { id:"par1",  email:"aalghamdi@mail.com", password:"Parent@111", role:"parent", name:"عبدالله الغامدي"      },
  { id:"par2",  email:"saqahtani@mail.com", password:"Parent@222", role:"parent", name:"سعد القحطاني"          },
  { id:"par3",  email:"kzahrani@mail.com",  password:"Parent@333", role:"parent", name:"خالد الزهراني"         },
  { id:"par4",  email:"ashahri@mail.com",   password:"Parent@444", role:"parent", name:"أحمد الشهري"           },
  { id:"par5",  email:"adosari@mail.com",   password:"Parent@555", role:"parent", name:"علي الدوسري"           },
  { id:"par6",  email:"aharbi@mail.com",    password:"Parent@666", role:"parent", name:"عبدالرحمن الحربي"     },
  { id:"par7",  email:"fsobiee@mail.com",   password:"Parent@777", role:"parent", name:"فهد السبيعي"           },
];

const INIT_TRAININGS = [
  { id: "tr1", groupId: "g1", coachId: "c1", days: ["الأحد", "الأربعاء"], time: "4:00 م", duration: 90, field: "ملعب A", title: "مهارات المراوغة والتحكم", trainingFocus: "مهارات فردية — تمرير قصير", note: "يرجى إحضار الحذاء الخاص بالملاعب الصناعية" },
  { id: "tr2", groupId: "g2", coachId: "c2", days: ["الاثنين", "الخميس"], time: "5:00 م", duration: 90, field: "ملعب B", title: "تطوير دقة التمرير", trainingFocus: "التكتيك الدفاعي — خطة 4-3-3", note: "التركيز على التمرير القصير" },
  { id: "tr3", groupId: "g3", coachId: "c3", days: ["الثلاثاء", "الخميس"], time: "5:30 م", duration: 90, field: "ملعب C", title: "تمارين التحمل اللياقي", trainingFocus: "لياقة بدنية — تمارين تحمّل", note: "إحضار عبوات مياه إضافية" },
];

/* ═══ HOOKS ═══════════════════════════════════════════ */
function useCounter(end, dur = 1600) {
  const [v, setV] = useState(0);
  const r = useRef();
  useEffect(() => {
    let s = null;
    const step = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / dur, 1);
      setV(Math.floor(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) r.current = requestAnimationFrame(step);
    };
    r.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(r.current);
  }, [end, dur]);
  return v;
}

/* ═══ THEME ═══════════════════════════════════════════ */
const THEMES = {
  dark: {
    bg: "#0B091A", bg2: "#12111F", bg3: "#0C0B18",
    border: "#1E1B35", border2: "#2A2050",
    text: "#E8E3FF", textMid: "#B0A4E0", textDim: "#5A4E8A", textFaint: "#3A3060",
    header: "#08071A", shadow: "rgba(124,73,168,.15)",
    cardBg: "#12111F", inputBg: "#0C0B18",
    purple: "#7C49A8", gold: "#D8A435",
    gradCard: "linear-gradient(135deg,#12111F,#0E0C1C)",
    name: "dark",
  },
  light: {
    bg: "#F4F2FB", bg2: "#FFFFFF", bg3: "#F0EDF9",
    border: "#E2DDEE", border2: "#CEC7E8",
    text: "#1A1030", textMid: "#4A3F6B", textDim: "#8B7FBB", textFaint: "#C4B8E0",
    header: "#FEFEFF", shadow: "rgba(124,73,168,.10)",
    cardBg: "#FFFFFF", inputBg: "#F8F6FF",
    purple: "#7C49A8", gold: "#B8900A",
    gradCard: "linear-gradient(135deg,#FFFFFF,#F8F5FF)",
    name: "light",
  },
};

/* ═══ SHARED UI ═══════════════════════════════════════ */
const Chip = ({ text, color = "#A855F7", size = 11 }) => (
  <span style={{ background: `${color}18`, color, fontSize: size, fontWeight: 700, padding: "3px 11px", borderRadius: 20, whiteSpace: "nowrap" }}>{text}</span>
);

function Card({ children, style, onClick, hover, t }) {
  const theme = t || THEMES.dark;
  return (
    <div onClick={onClick}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 14px 40px ${theme.shadow}`; } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; } : undefined}
      style={{ background: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 16, transition: hover ? "transform .2s,box-shadow .2s" : undefined, ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, style, small, disabled }) {
  const base = { border: "none", borderRadius: 10, fontFamily: "'Cairo',sans-serif", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700, transition: "all .2s", fontSize: small ? 12 : 13, padding: small ? "6px 14px" : "10px 20px", opacity: disabled ? .6 : 1, display: "inline-flex", alignItems: "center", gap: 6, ...style };
  const vs = {
    primary:   { background: "linear-gradient(135deg,#7C49A8,#5A2D82)", color: "#fff", boxShadow: "0 4px 14px rgba(124,73,168,.3)" },
    secondary: { background: "rgba(124,73,168,.1)", color: "#C4B5FD", border: "1px solid rgba(124,73,168,.22)" },
    danger:    { background: "rgba(239,68,68,.1)", color: "#EF4444", border: "1px solid rgba(239,68,68,.22)" },
    success:   { background: "rgba(16,185,129,.1)", color: "#10B981", border: "1px solid rgba(16,185,129,.22)" },
    gold:      { background: "linear-gradient(135deg,#D8A435,#A87820)", color: "#fff", boxShadow: "0 4px 14px rgba(216,164,53,.3)" },
    ghost:     { background: "transparent", color: "#8B7FBB", border: "1px solid #2A2050" },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...vs[variant] }}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", options, placeholder, t }) {
  const theme = t || THEMES.dark;
  const base = { width: "100%", background: theme.inputBg, border: `1px solid ${theme.border2}`, borderRadius: 9, padding: "10px 12px", color: theme.text, fontSize: 13, outline: "none", fontFamily: "'Cairo',sans-serif" };
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 11, color: theme.textDim, fontWeight: 600, marginBottom: 6 }}>{label}</label>}
      {options
        ? <select value={value} onChange={e => onChange(e.target.value)} style={base}>
            {options.map(o => <option key={o.v ?? o} value={o.v ?? o}>{o.l ?? o}</option>)}
          </select>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />}
    </div>
  );
}

function Avatar({ name, size = 36, color = "#A855F7" }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg,${color},${color}88)`, display: "grid", placeItems: "center", fontSize: size * .38, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
      {name?.[0]}
    </div>
  );
}

function Footer({ t }) {
  const theme = t || THEMES.dark;
  return (
    <div style={{ textAlign: "center", padding: "20px", marginTop: "auto", borderTop: `1px solid ${theme.border}`, fontSize: 11, color: theme.textDim, opacity: 0.8 }}>
      <div>تم تطوير نظام إدارة الأكاديميات والنوادي الرياضية <span style={{ color: "#7C49A8", fontWeight: 700 }}>" مُحْـكَـم (Mohkam) "</span></div>
      <div style={{ marginTop: 4 }}>بواسطة <span style={{ fontWeight: 600 }}>Badawi for Software Solutions and Marketing</span></div>
      <div style={{ marginTop: 4, direction: "ltr" }}>+201091089983</div>
    </div>
  );
}

function Modal({ title, onClose, children, wide, t }) {
  const theme = t || THEMES.dark;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.8)", display: "grid", placeItems: "center", zIndex: 9999, backdropFilter: "blur(8px)" }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: theme.bg2, border: `1px solid ${theme.border2}`, borderRadius: 22, padding: 30, width: `min(${wide ? "700px" : "480px"},93vw)`, maxHeight: "90vh", overflowY: "auto", animation: "scaleIn .25s ease", color: theme.text }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>{title}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: theme.textDim, fontSize: 22, cursor: "pointer" }}><AnimIcon type="close" size={18} color={theme.textDim} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SkillBar({ label, val, color, t }) {
  const theme = t || THEMES.dark;
  return (
    <div style={{ marginBottom: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: theme.textDim }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{val}</span>
      </div>
      <div style={{ height: 6, background: theme.border, borderRadius: 3 }}>
        <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${color},${color}66)`, width: `${val}%`, transition: "width 1.2s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function StatCard({ label, counter, value, icon, color, sub, t }) {
  const theme = t || THEMES.dark;
  const cnt = useCounter(counter ?? 0, 1600);
  const display = counter !== undefined ? cnt.toLocaleString() : value;
  return (
    <Card hover t={theme} style={{ padding: "20px 18px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: color, opacity: .07 }} />
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: theme.textDim, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 18 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, letterSpacing: "-.02em" }}>{display}</div>
      {sub && <div style={{ fontSize: 11, color: theme.textFaint, marginTop: 4 }}>{sub}</div>}
    </Card>
  );
}

const ArabicTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1A1430", border: "1px solid #2A2050", borderRadius: 10, padding: "10px 14px", direction: "rtl", fontSize: 12 }}>
      <div style={{ color: "#C4B5FD", fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => <div key={i} style={{ color: p.color, marginBottom: 3 }}>{p.name}: <b>{typeof p.value === "number" ? p.value.toLocaleString() : p.value}</b></div>)}
    </div>
  );
};

/* ═══ LOGIN ═══════════════════════════════════════════ */
function LoginPage({ onLogin, players = [], coaches = [], t }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [showP, setShowP] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setLoading(true); setError("");
    setTimeout(async () => {
      if (API_URL) {
        try {
          const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password: pass })
          });
          const data = await res.json();
          if (res.ok) onLogin(data);
          else setError(data.error || "خطأ في الدخول");
        } catch (e) {
          setError("تعذر الاتصال بالسيرفر");
        }
      } else {
        // 1. Check static USERS
        let found = USERS.find(u => u.email === email.trim() && u.password === pass);
        
        // 2. Check dynamic Players (Parents)
        if (!found) {
          const p = players.find(x => x.email === email.trim() && x.password === pass);
          if (p) {
            found = { id: `par_${p.id}`, email: p.email, role: "parent", name: `ولي أمر ${p.name}`, playerIds: [p.id] };
          }
        }

        // 3. Check dynamic Coaches
        if (!found) {
          const c = coaches.find(x => x.email === email.trim() && x.password === pass);
          if (c) {
            found = { ...c, role: "coach" };
          }
        }

        if (found) onLogin(found);
        else setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      }
      setLoading(false);
    }, 700);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      backgroundImage: `linear-gradient(135deg, rgba(8, 7, 26, 0.42) 0%, rgba(12, 11, 24, 0.65) 100%), url(${bgImg})`, 
      backgroundSize: "cover", 
      backgroundPosition: "center", 
      backgroundRepeat: "no-repeat", 
      position: "relative", 
      overflow: "hidden", 
      padding: 20 
    }}>
      <style>{`
        @keyframes wordSlogan1 {
          0%, 8% { opacity: 0; transform: translateY(5px); }
          12%, 80% { opacity: 1; transform: translateY(0); }
          84%, 100% { opacity: 0; transform: translateY(-5px); }
        }
        @keyframes wordSlogan2 {
          0%, 30% { opacity: 0; transform: translateY(5px); }
          34%, 80% { opacity: 1; transform: translateY(0); }
          84%, 100% { opacity: 0; transform: translateY(-5px); }
        }
        @keyframes wordSlogan3 {
          0%, 54% { opacity: 0; transform: translateY(5px); }
          58%, 80% { opacity: 1; transform: translateY(0); }
          84%, 100% { opacity: 0; transform: translateY(-5px); }
        }
      `}</style>

      {/* Background effects */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 55% at 50% 20%,rgba(124,73,168,.12) 0%,transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 50% at 50% 85%,rgba(216,164,53,.06) 0%,transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,73,168,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(124,73,168,.02) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      <div style={{ position: "absolute", top: "12%", right: "10%", width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,rgba(216,164,53,.04),transparent 70%)", animation: "float 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "10%", left: "8%", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,73,168,.05),transparent 70%)", animation: "float 6s ease-in-out infinite 2s" }} />
      <div style={{ position: "absolute", top: "50%", left: "50%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,73,168,.02),transparent 60%)", transform: "translate(-50%,-50%)", animation: "pulse 4s ease-in-out infinite" }} />

      <div style={{ position: "relative", zIndex: 1, width: "min(440px,100%)" }}>
        {/* Logo & Title */}
        <div style={{ textAlign: "center", marginBottom: 30, animation: "fadeUp .6s ease both" }}>
          <div style={{ marginBottom: 16 }}>
            <img src={logoImg} alt="نادي نجد" style={{ width: 110, height: 110, objectFit: "contain" }} />
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 8, letterSpacing: "-.02em" }}>
            نادي <span style={{ color: "#D8A435" }}>نجد</span> الرياض
          </h1>

          {/* Animated Slogan under the club name */}
          <div style={{ 
            display: "flex", 
            gap: "8px", 
            justifyContent: "center", 
            fontSize: 20, 
            fontWeight: 800, 
            color: "#D8A435", 
            textShadow: "0 0 15px rgba(216, 164, 53, 0.45)",
            direction: "rtl", 
            marginTop: 10, 
            marginBottom: 10, 
            height: 30 
          }}>
            <span style={{ animation: "wordSlogan1 4.5s infinite ease-in-out" }}>نجد</span>
            <span style={{ animation: "wordSlogan2 4.5s infinite ease-in-out" }}>سارعي</span>
            <span style={{ animation: "wordSlogan3 4.5s infinite ease-in-out" }}>للمجد</span>
          </div>
        </div>

        {/* Login Card */}
        <div style={{ background: "rgba(18,17,31,.82)", border: "1px solid rgba(124,73,168,.18)", borderRadius: 28, padding: "36px 30px 30px", backdropFilter: "blur(24px)", animation: "fadeUp .6s .15s ease both", opacity: 0, boxShadow: "0 20px 60px rgba(0,0,0,.4), 0 0 0 1px rgba(124,73,168,.08)" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#E8E3FF", marginBottom: 4 }}>تسجيل الدخول</div>
            <div style={{ fontSize: 11, color: "#5A4E8A" }}>أدخل بيانات حسابك للوصول إلى النظام</div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8B7FBB", fontWeight: 600, marginBottom: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#8B7FBB" strokeWidth="1.5"/><polyline points="22,6 12,13 2,6" stroke="#8B7FBB" strokeWidth="1.5"/></svg>
              البريد الإلكتروني
            </label>
            <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="أدخل بريدك الإلكتروني"
              onFocus={e => { e.target.style.borderColor = "#7C49A8"; e.target.style.boxShadow = "0 0 0 3px rgba(124,73,168,.12)"; }} 
              onBlur={e => { e.target.style.borderColor = "#2A2050"; e.target.style.boxShadow = "none"; }}
              style={{ width: "100%", background: "rgba(12,11,24,.7)", border: "1.5px solid #2A2050", borderRadius: 13, padding: "13px 16px", color: "#E8E3FF", fontSize: 14, outline: "none", fontFamily: "'Cairo',sans-serif", transition: "all .25s" }} />
          </div>
          <div style={{ marginBottom: 22, position: "relative" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#8B7FBB", fontWeight: 600, marginBottom: 8 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#8B7FBB" strokeWidth="1.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#8B7FBB" strokeWidth="1.5"/></svg>
              كلمة المرور
            </label>
            <input id="login-password" type={showP ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="أدخل كلمة المرور"
              onKeyDown={e => e.key === "Enter" && handle()}
              onFocus={e => { e.target.style.borderColor = "#7C49A8"; e.target.style.boxShadow = "0 0 0 3px rgba(124,73,168,.12)"; }} 
              onBlur={e => { e.target.style.borderColor = "#2A2050"; e.target.style.boxShadow = "none"; }}
              style={{ width: "100%", background: "rgba(12,11,24,.7)", border: "1.5px solid #2A2050", borderRadius: 13, padding: "13px 44px 13px 16px", color: "#E8E3FF", fontSize: 14, outline: "none", fontFamily: "'Cairo',sans-serif", transition: "all .25s" }} />
            <button onClick={() => setShowP(s => !s)} style={{ position: "absolute", left: 14, top: 36, background: "none", border: "none", color: "#5A4E8A", cursor: "pointer", fontSize: 16, transition: "color .2s" }}
              onMouseEnter={e => e.target.style.color = "#8B7FBB"} onMouseLeave={e => e.target.style.color = "#5A4E8A"}>
              {showP ? "🙈" : "👁️"}
            </button>
          </div>
          {error && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 12, padding: "11px 16px", fontSize: 13, color: "#FCA5A5", marginBottom: 18, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span style={{ fontSize: 16 }}>⚠️</span> {error}
          </div>}
          <button id="login-submit" onClick={handle} disabled={loading || !email || !pass}
            onMouseEnter={e => { if (!e.target.disabled) e.target.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.target.style.transform = "none"; }}
            style={{ width: "100%", background: loading ? "#2A2050" : "linear-gradient(135deg,#7C49A8,#5A2D82)", color: "#fff", border: "none", borderRadius: 14, padding: 15, fontSize: 15, fontWeight: 800, cursor: loading || !email || !pass ? "not-allowed" : "pointer", transition: "all .3s", boxShadow: loading || !email || !pass ? "none" : "0 8px 24px rgba(124,73,168,.35)", opacity: loading || !email || !pass ? .6 : 1, fontFamily: "'Cairo',sans-serif", letterSpacing: ".01em" }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />
                جارٍ التحقق...
              </span>
            ) : "تسجيل الدخول"}
          </button>
        </div>

        {/* Security badge */}
        <div style={{ textAlign: "center", marginTop: 20, animation: "fadeUp .6s .3s ease both", opacity: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, color: "#3A3060", background: "rgba(124,73,168,.05)", padding: "6px 14px", borderRadius: 20, border: "1px solid rgba(124,73,168,.08)" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#5A4E8A" strokeWidth="1.5"/></svg>
            اتصال مشفّر وآمن
          </div>
        </div>

        {/* Custom footer styled for the login background */}
        <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "rgba(255, 255, 255, 0.45)", opacity: 0.8, borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: 16 }}>
          <div>تم تطوير نظام إدارة الأكاديميات والنوادي الرياضية <span style={{ color: "#9c6fd6", fontWeight: 700 }}>" مُحْـكَـم (Mohkam) "</span></div>
          <div style={{ marginTop: 4 }}>بواسطة <span style={{ fontWeight: 600 }}>Badawi for Software Solutions and Marketing</span></div>
          <div style={{ marginTop: 4, direction: "ltr" }}>+201091089983</div>
        </div>
      </div>
    </div>
  );
}

/* ═══ SHELL ═══════════════════════════════════════════ */
function Shell({ title, subtitle, color, icon, tabs, activeTab, setActiveTab, onLogout, badge, user, t, syncStatus, children }) {
  const theme = t || THEMES.dark;
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: theme.bg }}>
      <header style={{ background: theme.header, borderBottom: `1px solid ${theme.border}`, padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 66, flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <NajdLogo size={38} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, color: theme.text }}>{title}</div>
            <div style={{ fontSize: 11, color: theme.textDim }}>{subtitle}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {syncStatus && (
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              fontSize: 11, 
              fontWeight: 700, 
              padding: "4px 10px", 
              borderRadius: 12, 
              background: syncStatus === "synced" ? "rgba(16,185,129,.1)" : syncStatus === "syncing" ? "rgba(59,130,246,.1)" : "rgba(239,68,68,.1)", 
              color: syncStatus === "synced" ? "#10B981" : syncStatus === "syncing" ? "#3B82F6" : "#EF4444", 
              border: `1px solid ${syncStatus === "synced" ? "rgba(16,185,129,.2)" : syncStatus === "syncing" ? "rgba(59,130,246,.2)" : "rgba(239,68,68,.2)"}` 
            }}>
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: "50%", 
                background: syncStatus === "synced" ? "#10B981" : syncStatus === "syncing" ? "#3B82F6" : "#EF4444", 
                animation: syncStatus === "syncing" ? "pulse 1.5s infinite" : "none" 
              }}></span>
              {syncStatus === "synced" ? "تم الحفظ" : syncStatus === "syncing" ? "جارٍ الحفظ..." : "خطأ في المزامنة"}
            </div>
          )}
          {badge && <div style={{ background: `${color}18`, border: `1px solid ${color}30`, color, fontSize: 12, fontWeight: 700, padding: "5px 13px", borderRadius: 20 }}>{badge}</div>}
          <div style={{ fontSize: 12, color: theme.textDim, textAlign: "left" }}>{user?.name}</div>
          <button onClick={onLogout} style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)", color: "#EF4444", borderRadius: 9, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>خروج</button>
        </div>
      </header>
      <div style={{ background: theme.header, borderBottom: `1px solid ${theme.border}`, padding: "0 24px", display: "flex", gap: 0, overflowX: "auto", flexShrink: 0 }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setActiveTab(tb.id)}
            style={{ background: "transparent", border: "none", borderBottom: activeTab === tb.id ? `2.5px solid ${color}` : "2.5px solid transparent", color: activeTab === tb.id ? theme.text : theme.textDim, padding: "13px 18px", fontSize: 13, fontWeight: activeTab === tb.id ? 700 : 500, whiteSpace: "nowrap", cursor: "pointer", transition: "all .15s", display: "flex", alignItems: "center", gap: 7, fontFamily: "'Cairo',sans-serif" }}>
            <AnimIcon type={tb.icon} size={15} color={activeTab === tb.id ? color : theme.textDim} />
            {tb.label}
            {tb.badge ? <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, fontSize: 10, padding: "1px 6px", fontWeight: 800 }}>{tb.badge}</span> : null}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: theme.bg, display: "flex", flexDirection: "column" }}>
        <div key={activeTab} style={{ flex: 1 }}>{children}</div>
        <Footer t={theme} />
      </div>
    </div>
  );
}

/* ═══ ROOT APP ════════════════════════════════════════ */
export default function App() {
  const [user, setUser]         = useState(() => {
    const saved = localStorage.getItem('najd_logged_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [attendance, setAttendance] = useState(() => JSON.parse(localStorage.getItem('najd_attendance') || '[]'));
  const [evals, setEvals] = useState(() => JSON.parse(localStorage.getItem('najd_evals') || '[]'));
  const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem('najd_messages') || '[]'));
  const [prices, setPrices] = useState(() => {
    try {
      const saved = localStorage.getItem('najd_prices');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...PRICE_LIST, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return PRICE_LIST;
  });
  const [trainings, setTrainings] = useState(() => JSON.parse(localStorage.getItem('najd_trainings') || '[]'));
  const [coachesAttendance, setCoachesAttendance] = useState(() => JSON.parse(localStorage.getItem('najd_coachesAttendance') || '[]'));

  const [groups, setGroups] = useState(() => JSON.parse(localStorage.getItem('najd_groups') || '[]'));
  const [coaches, setCoaches] = useState(() => JSON.parse(localStorage.getItem('najd_coaches') || '[]'));
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem('najd_players') || '[]'));
  const [parents, setParents] = useState(() => JSON.parse(localStorage.getItem('najd_parents') || '[]'));
  const [payments, setPayments] = useState(() => JSON.parse(localStorage.getItem('najd_payments') || '[]'));
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('najd_expenses') || '[]'));
  const [theme, setTheme] = useState(() => localStorage.getItem('najd_theme') || "dark");

  const [syncStatus, setSyncStatus] = useState("synced"); // 'synced', 'syncing', 'error'
  const [lastUpdate, setLastUpdateState] = useState(() => parseInt(localStorage.getItem('najd_last_update') || '0'));
  const lastLocalWriteRef = useRef(0);
  const pendingSyncsRef = useRef(0);
  const markLocalWrite = () => {
    lastLocalWriteRef.current = Date.now();
  };

  const setLastUpdate = (val) => {
    const time = val !== undefined ? val : Date.now();
    setLastUpdateState(time);
    localStorage.setItem('najd_last_update', String(time));
  };

  const syncWithAPI = async (table, item, isDeleted = false) => {
    if (!API_URL) return;
    markLocalWrite();
    pendingSyncsRef.current++;
    setSyncStatus("syncing");
    try {
      const endpointMap = {
        groups: 'groups',
        coaches: 'coaches',
        players: 'players',
        payments: 'payments',
        attendance: 'attendance',
        evals: 'evaluations',
        messages: 'messages',
        trainings: 'trainings',
        expenses: 'expenses'
      };
      
      const path = endpointMap[table] || table;
      let url = `${API_URL}/api/${path}`;
      let method = 'POST';
      let headers = { 'Content-Type': 'application/json' };
      let body = JSON.stringify(item);

      if (isDeleted) {
        url = `${API_URL}/api/${path}/${item.id}`;
        method = 'DELETE';
        body = undefined;
      }

      const res = await fetch(url, { method, headers, body });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }
      markLocalWrite();
    } catch (e) {
      console.error(`Sync error for ${table}:`, e);
      setSyncStatus("error");
    } finally {
      pendingSyncsRef.current--;
      if (pendingSyncsRef.current <= 0) {
        pendingSyncsRef.current = 0;
        setSyncStatus(s => s === "error" ? "error" : "synced");
      }
    }
  };

  useEffect(() => {
    if (user) localStorage.setItem('najd_logged_user', JSON.stringify(user));
    else localStorage.removeItem('najd_logged_user');
  }, [user]);

  // Fetch from API if configured (with automatic background polling every 6s)
  useEffect(() => {
    if (!API_URL) return;

    const fetchData = async () => {
      // Skip background update if we are actively syncing or a local write occurred recently
      if (pendingSyncsRef.current > 0 || Date.now() - lastLocalWriteRef.current < 8000) {
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/initial-data`);
        const data = await res.json();
        
        // Double check right before setting the state in case a write happened while the fetch was in flight
        if (Date.now() - lastLocalWriteRef.current < 8000 || pendingSyncsRef.current > 0) {
          return;
        }
        if (data.players) {
          // Auto-repair missing logins/data for display
          const repaired = data.players.map(p => {
            if (p.email && p.password) return p;
            const phone = p.phone || "0500000000";
            return { 
              ...p, 
              email: p.email || `najd_${phone}@najd.sa`,
              password: p.password || `najd_${phone.slice(-4)}`
            };
          });
          setPlayers(repaired);
        }
        if (data.coaches) setCoaches(data.coaches);
        if (data.groups) setGroups(data.groups);
        if (data.payments) setPayments(data.payments);
        if (data.expenses) setExpenses(data.expenses);
        if (data.attendance) setAttendance(data.attendance);
        if (data.coachesAttendance) setCoachesAttendance(data.coachesAttendance);
        if (data.evals) setEvals(data.evals);
        if (data.messages) setMessages(data.messages);
        if (data.trainings) setTrainings(data.trainings);
        if (data.parents) setParents(data.parents);
      } catch (e) {
        console.error("API Fetch Error:", e);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    localStorage.setItem('najd_players', JSON.stringify(players));
    localStorage.setItem('najd_coaches', JSON.stringify(coaches));
    localStorage.setItem('najd_groups', JSON.stringify(groups));
    localStorage.setItem('najd_parents', JSON.stringify(parents));
    localStorage.setItem('najd_payments', JSON.stringify(payments));
    localStorage.setItem('najd_expenses', JSON.stringify(expenses));
    localStorage.setItem('najd_attendance', JSON.stringify(attendance));
    localStorage.setItem('najd_coachesAttendance', JSON.stringify(coachesAttendance));
    localStorage.setItem('najd_evals', JSON.stringify(evals));
    localStorage.setItem('najd_messages', JSON.stringify(messages));
    localStorage.setItem('najd_prices', JSON.stringify(prices));
    localStorage.setItem('najd_trainings', JSON.stringify(trainings));
    localStorage.setItem('najd_theme', theme);
  }, [players, coaches, groups, parents, payments, attendance, coachesAttendance, evals, messages, prices, trainings, theme, expenses]);

  const t = THEMES[theme];

  const shared = { 
    syncStatus,
    groups, 
    setGroups: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setGroups(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(n => {
              const old = prev.find(p => p.id === n.id);
              return !old || JSON.stringify(old) !== JSON.stringify(n);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(i => syncWithAPI('groups', i));
            deleted.forEach(i => syncWithAPI('groups', i, true));
          }
          return next;
        });
      } else {
        setGroups(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(i => syncWithAPI('groups', i));
      }
    },
    coaches,
    setCoaches: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setCoaches(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(n => {
              const old = prev.find(p => p.id === n.id);
              return !old || JSON.stringify(old) !== JSON.stringify(n);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(i => syncWithAPI('coaches', i));
            deleted.forEach(i => syncWithAPI('coaches', i, true));
          }
          return next;
        });
      } else {
        setCoaches(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(i => syncWithAPI('coaches', i));
      }
    },
    players,
    setPlayers: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setPlayers(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(n => {
              const old = prev.find(p => p.id === n.id);
              return !old || JSON.stringify(old) !== JSON.stringify(n);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(i => syncWithAPI('players', i));
            deleted.forEach(i => syncWithAPI('players', i, true));
          }
          return next;
        });
      } else {
        setPlayers(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(i => syncWithAPI('players', i));
      }
    },
    parents: (parents && parents.length > 0) ? parents : (players || []).reduce((acc, p) => {
      if (p && p.parentId && !acc.find(x => String(x.id) === String(p.parentId))) {
        acc.push({ id: p.parentId, name: `ولي أمر ${p.name}`, phone: p.phone, email: p.email });
      }
      return acc;
    }, []),
    payments,
    setPayments: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setPayments(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(n => {
              const old = prev.find(p => p.id === n.id);
              return !old || JSON.stringify(old) !== JSON.stringify(n);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(i => syncWithAPI('payments', i));
            deleted.forEach(i => syncWithAPI('payments', i, true));
          }
          return next;
        });
      } else {
        setPayments(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(i => syncWithAPI('payments', i));
      }
    },
    expenses,
    setExpenses: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setExpenses(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(n => {
              const old = prev.find(p => p.id === n.id);
              return !old || JSON.stringify(old) !== JSON.stringify(n);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(i => syncWithAPI('expenses', i));
            deleted.forEach(i => syncWithAPI('expenses', i, true));
          }
          return next;
        });
      } else {
        setExpenses(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(i => syncWithAPI('expenses', i));
      }
    },
    attendance, 
    setAttendance: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setAttendance(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(item => {
              const old = prev.find(x => x.id === item.id);
              return !old || JSON.stringify(old) !== JSON.stringify(item);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(item => syncWithAPI('attendance', item));
            deleted.forEach(item => syncWithAPI('attendance', item, true));
          }
          return next;
        });
      } else {
        setAttendance(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(item => syncWithAPI('attendance', item));
      }
    },
    coachesAttendance, 
    setCoachesAttendance: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setCoachesAttendance(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(item => {
              const old = prev.find(x => x.id === item.id);
              return !old || JSON.stringify(old) !== JSON.stringify(item);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(item => syncWithAPI('attendance', item));
            deleted.forEach(item => syncWithAPI('attendance', item, true));
          }
          return next;
        });
      } else {
        setCoachesAttendance(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(item => syncWithAPI('attendance', item));
      }
    },
    evals, 
    setEvals: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setEvals(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(item => {
              const old = prev.find(x => x.id === item.id);
              return !old || JSON.stringify(old) !== JSON.stringify(item);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(item => syncWithAPI('evals', item));
            deleted.forEach(item => syncWithAPI('evals', item, true));
          }
          return next;
        });
      } else {
        setEvals(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(item => syncWithAPI('evals', item));
      }
    },
    messages, 
    setMessages: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setMessages(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(item => {
              const old = prev.find(x => x.id === item.id);
              return !old || JSON.stringify(old) !== JSON.stringify(item);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(item => syncWithAPI('messages', item));
            deleted.forEach(item => syncWithAPI('messages', item, true));
          }
          return next;
        });
      } else {
        setMessages(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(item => syncWithAPI('messages', item));
      }
    },
    prices, setPrices, 
    trainings, 
    setTrainings: (val) => {
      if (typeof val === 'function') {
        markLocalWrite();
        setTrainings(prev => {
          const next = val(prev);
          setLastUpdate();
          if (API_URL) {
            const addedOrChanged = next.filter(item => {
              const old = prev.find(x => x.id === item.id);
              return !old || JSON.stringify(old) !== JSON.stringify(item);
            });
            const deleted = prev.filter(p => !next.find(n => n.id === p.id));
            addedOrChanged.forEach(item => syncWithAPI('trainings', item));
            deleted.forEach(item => syncWithAPI('trainings', item, true));
          }
          return next;
        });
      } else {
        setTrainings(val);
        setLastUpdate();
        if (API_URL && Array.isArray(val)) val.forEach(item => syncWithAPI('trainings', item));
      }
    },
    t,
    forceRefresh: () => {
      setLastUpdate(0); // Clear lock
      localStorage.setItem('najd_last_update', '0');
      window.location.reload(); 
    }
  };
  return (
    <div style={{ fontFamily: "'Cairo',sans-serif", direction: "rtl", background: t.bg, minHeight: "100vh", color: t.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2A2050;border-radius:8px}
        input,select,textarea,button{font-family:'Cairo',sans-serif;direction:rtl}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
        .rh:hover{background:rgba(124,73,168,.06)!important}
        .rhl:hover{background:rgba(0,0,0,.03)!important}
        .s1{animation:fadeUp .4s .05s ease both;opacity:0}
        .s2{animation:fadeUp .4s .12s ease both;opacity:0}
        .s3{animation:fadeUp .4s .20s ease both;opacity:0}
        .s4{animation:fadeUp .4s .28s ease both;opacity:0}
        .s5{animation:fadeUp .4s .36s ease both;opacity:0}
      `}</style>

      {/* Theme toggle button — fixed */}
      {user && (
        <button onClick={() => setTheme(s => s === "dark" ? "light" : "dark")}
          style={{ position: "fixed", bottom: 24, left: 24, zIndex: 9000, width: 46, height: 46, borderRadius: "50%", background: t.bg2, border: `1px solid ${t.border}`, cursor: "pointer", display: "grid", placeItems: "center", boxShadow: `0 4px 16px ${t.shadow}`, transition: "all .3s" }}>
          <AnimIcon type={theme === "dark" ? "sun" : "moon"} size={20} color={theme === "dark" ? "#D8A435" : "#A855F7"} />
        </button>
      )}

      {!user
        ? <LoginPage onLogin={setUser} players={players} coaches={coaches} t={t} />
        : user.role === "admin"
          ? <AdminPortal  user={user} onLogout={() => setUser(null)} {...shared} />
          : user.role === "coach"
            ? <CoachPortal  user={user} onLogout={() => setUser(null)} {...shared} />
            : <ParentPortal user={user} onLogout={() => setUser(null)} {...shared} loginUser={user} />
      }
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN PORTAL
══════════════════════════════════════════════════════════ */
function AdminPortal({ user, onLogout, groups, setGroups, coaches, setCoaches, players, setPlayers, parents, payments, setPayments, attendance, setAttendance, coachesAttendance, setCoachesAttendance, evals, messages, setMessages, prices, setPrices, trainings, setTrainings, t, syncStatus, expenses, setExpenses }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview",     icon: "dashboard",    label: "نظرة عامة"   },
    { id: "teams",        icon: "teams",        label: "الفرق"        },
    { id: "coaches",      icon: "coaches",      label: "المدربون"     },
    { id: "players",      icon: "players",      label: "اللاعبون"     },
    { id: "payments",     icon: "payments",     label: "المدفوعات"    },
    { id: "prices",       icon: "prices",       label: "الإعدادات"    },
    { id: "schedule",     icon: "schedule",     label: "التمارين"     },
    { id: "reports",      icon: "chart",        label: "التقارير"     },
    { id: "messages",     icon: "messages",     label: "الرسائل",      badge: messages.filter(m => m.to === "admin" && !m.read).length || undefined },
  ];
  return (
    <Shell title="لوحة الإدارة" subtitle="نادي نجد الرياض" color="#7C49A8" icon="dashboard" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} badge="مدير عام" user={user} t={t} syncStatus={syncStatus}>
      {tab === "overview"  && <AdminOverview players={players} coaches={coaches} groups={groups} payments={payments} attendance={attendance} t={t} trainings={trainings} expenses={expenses} setMessages={setMessages} parents={parents} />}
      {tab === "teams"     && <AdminTeams groups={groups} setGroups={setGroups} coaches={coaches} players={players} t={t} trainings={trainings} attendance={attendance} payments={payments} />}
      {tab === "coaches"   && <AdminCoaches coaches={coaches} setCoaches={setCoaches} groups={groups} players={players} payments={payments} t={t} />}
      {tab === "players"   && <AdminPlayers players={players} setPlayers={setPlayers} groups={groups} parents={parents} evals={evals} coaches={coaches} t={t} trainings={trainings} attendance={attendance} payments={payments} setAttendance={setAttendance} />}
      {tab === "payments"  && <AdminPayments payments={payments} setPayments={setPayments} players={players} coaches={coaches} parents={parents} prices={prices} t={t} expenses={expenses} setExpenses={setExpenses} />}
      {tab === "prices"    && <AdminPrices prices={prices} setPrices={setPrices} t={t} />}
      {tab === "schedule"  && <AdminTrainings trainings={trainings} setTrainings={setTrainings} groups={groups} coaches={coaches} t={t} />}
      {tab === "reports"   && <AdminReports players={players} coaches={coaches} groups={groups} payments={payments} attendance={attendance} evals={evals} t={t} trainings={trainings} />}
      {tab === "messages"  && <Messaging messages={messages} setMessages={setMessages} meId="admin" meName="الإدارة" coaches={coaches} parents={parents} t={t} />}
    </Shell>
  );
}

/* ── Admin Overview ─────────────────────────────────── */
function AdminOverview({ players, coaches, groups, payments, attendance = [], t, trainings, expenses = [], setMessages, parents }) {
  const [alertFilter, setAlertFilter] = useState("all"); // "all" (expired/unpaid) or "nearing" (starting session 11+)
  const total   = payments.reduce((a, p) => a + p.amount, 0);
  const month   = payments.filter(p => p.month === CUR_MONTH).reduce((a, p) => a + p.amount, 0);
  const active  = players.filter(p => {
    if (p.status === "موقوف" || p.status === "مجمّد") return false;
    const sd = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
    return !sd.isUnpaid && !sd.isExpired;
  }).length;
  const unpaid  = players.filter(p => {
    if (p.status === "موقوف" || p.status === "مجمّد") return false;
    const sd = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
    return sd.isUnpaid || sd.isExpired;
  }).length;
  const byType  = Object.entries(PAY_TYPES).map(([k, v]) => ({ ...v, k, total: payments.filter(p => p.type === k).reduce((a, p) => a + p.amount, 0), count: payments.filter(p => p.type === k).length }));

  // Dynamic Revenue data for the last 6 months
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const revData = [];
  const now = new Date();
  const monthlyExpenses = coaches.reduce((sum, c) => sum + (Number(c.salary) || 0), 0);

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = monthNames[d.getMonth()];
    const year = d.getFullYear();
    const monthKey = `${monthName} ${year}`;
    
    const monthIncome = payments
      .filter(p => p.month === monthKey || (p.date && p.date.startsWith(`${year}-&month`.replace('&month', String(d.getMonth() + 1).padStart(2, '0')))))
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const monthRegisteredExpenses = (expenses || [])
      .filter(e => e.month === monthKey || (e.date && e.date.startsWith(`${year}-&month`.replace('&month', String(d.getMonth() + 1).padStart(2, '0')))))
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    revData.push({
      month: monthName,
      income: monthIncome,
      expenses: monthlyExpenses + monthRegisteredExpenses
    });
  }

  // Dynamic Player Position distribution data
  const posCounts = {};
  players.forEach(p => {
    const pos = p.position || "غير محدد";
    posCounts[pos] = (posCounts[pos] || 0) + 1;
  });
  const posColors = ["#EF4444", "#A855F7", "#3B82F6", "#10B981", "#F59E0B", "#06B6D4", "#6B7280"];
  const dynamicPosData = Object.entries(posCounts).map(([name, value], i) => ({
    name,
    value,
    color: posColors[i % posColors.length]
  }));
  const posData = dynamicPosData.length > 0 ? dynamicPosData : [{ name: "لا يوجد لاعبين", value: 1, color: t.border }];

  // Dynamic Weekly/Session Attendance trend (last 6 sessions)
  const sortedAtt = [...(attendance || [])]
    .filter(a => a.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const lastSessions = sortedAtt.slice(-6);
  
  const attTrend = lastSessions.map(session => {
    let present = 0;
    let absent = 0;
    let excused = 0;
    
    if (session.records) {
      Object.values(session.records).forEach(status => {
        if (status === "حاضر") present++;
        else if (status === "غائب") absent++;
        else if (status === "بعذر") excused++;
      });
    }
    
    const dateObj = new Date(session.date);
    const formattedDate = isNaN(dateObj) ? session.date : `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
    
    return {
      week: formattedDate,
      "حاضر": present,
      "غائب": absent,
      "بعذر": excused
    };
  });

  const finalAttTrend = attTrend.length > 0 ? attTrend : [{ week: "لا يوجد بيانات", "حاضر": 0, "غائب": 0, "بعذر": 0 }];

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }} className="s1">
        <StatCard label="إجمالي اللاعبين"    counter={players.length} icon="⚽" color="#7C49A8" sub={`${active} نشط`} t={t}/>
        <StatCard label={`إيرادات ${CUR_MONTH.split(" ")[0]}`} counter={month}          icon="💰" color="#10B981" value={fmtMoney(month)} t={t}/>
        <StatCard label="اشتراكات متأخرة"    counter={unpaid}         icon="⚠️" color="#EF4444" sub={CUR_MONTH} t={t}/>
        <StatCard label="إجمالي الإيرادات"   counter={total}          icon="📈" color="#D8A435" value={fmtMoney(total)} t={t}/>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 14, marginBottom: 14 }} className="s2">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 4 }}>💰 الإيرادات مقابل المصروفات</div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 14 }}>آخر 6 أشهر</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revData}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C49A8" stopOpacity={.3}/><stop offset="95%" stopColor="#7C49A8" stopOpacity={0}/></linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${v / 1000}k` : v}/>
              <Tooltip content={<ArabicTooltip />}/>
              <Area type="monotone" dataKey="income"   name="الإيرادات"  stroke="#7C49A8" strokeWidth={2.5} fill="url(#gInc)" dot={{ fill: "#7C49A8", r: 4 }} activeDot={{ r: 6 }}/>
              <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#EF4444" strokeWidth={2}   fill="url(#gExp)" dot={{ fill: "#EF4444", r: 3 }} activeDot={{ r: 5 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 4 }}>⚽ توزيع المراكز</div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 10 }}>{players.length} لاعب</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={posData} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={4} dataKey="value" animationDuration={1200}>
                {posData.map((e, i) => <Cell key={i} fill={e.color || t.border} />)}
              </Pie>
              <Tooltip content={<ArabicTooltip />}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", marginTop: 6 }}>
            {players.length > 0 ? posData.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: t.textDim }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }}/>{d.name} <span style={{ color: d.color, fontWeight: 700 }}>{d.value}</span></div>) : <div style={{ fontSize: 11, color: t.textFaint }}>لا توجد بيانات مواضع للاعبين</div>}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="s3">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 4 }}>📋 الحضور الأسبوعي</div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 14 }}>آخر 6 حصص تدريبية</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={finalAttTrend} barSize={12} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="week" tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip content={<ArabicTooltip />}/>
              <Bar dataKey="حاضر" fill="#10B981" radius={[4, 4, 0, 0]} animationBegin={200}/>
              <Bar dataKey="غائب" fill="#EF4444" radius={[4, 4, 0, 0]} animationBegin={400}/>
              <Bar dataKey="بعذر" fill="#F59E0B" radius={[4, 4, 0, 0]} animationBegin={600}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>💳 الإيرادات حسب النوع</div>
          {byType.map(tb => (
            <div key={tb.k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 17 }}>{tb.icon}</span><div><div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{tb.label}</div><div style={{ fontSize: 10, color: t.textDim }}>{tb.count} عملية</div></div></div>
              <span style={{ fontSize: 13, fontWeight: 800, color: tb.color }}>{fmtMoney(tb.total)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 4 }}>
            <span style={{ fontWeight: 700, color: t.text }}>الإجمالي</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: "#10B981" }}>{fmtMoney(total)}</span>
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="s4">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>🏆 أداء المدربين</div>
          {coaches.map(c => {
            const cPays = payments.filter(p => p.coachId === c.id);
            const rev   = cPays.reduce((a, p) => a + p.amount, 0);
            const g     = groups.find(x => x.id === c.groupId);
            return (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={c.name} size={32} color="#7C49A8"/>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{c.name}</div><div style={{ fontSize: 10, color: t.textDim }}>{g?.name} · {cPays.length} دفعة</div></div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>{fmtMoney(rev)}</span>
              </div>
            );
          })}
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#EF4444", display: "flex", alignItems: "center", gap: 6 }}>
              <span>⚠️</span> تنبيهات السداد العاجلة للأعضاء
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button 
                onClick={() => setAlertFilter("all")} 
                style={{ 
                  padding: "4px 8px", 
                  borderRadius: 6, 
                  border: "none", 
                  background: alertFilter === "all" ? "rgba(239,68,68,0.12)" : "transparent", 
                  color: alertFilter === "all" ? "#EF4444" : t.textDim, 
                  fontSize: 10, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  fontFamily: "'Cairo',sans-serif"
                }}
              >
                منتهية / غير مسددة
              </button>
              <button 
                onClick={() => setAlertFilter("nearing")} 
                style={{ 
                  padding: "4px 8px", 
                  borderRadius: 6, 
                  border: "none", 
                  background: alertFilter === "nearing" ? "rgba(245,158,11,0.12)" : "transparent", 
                  color: alertFilter === "nearing" ? "#F59E0B" : t.textDim, 
                  fontSize: 10, 
                  fontWeight: 700, 
                  cursor: "pointer",
                  fontFamily: "'Cairo',sans-serif"
                }}
              >
                شارفت على الانتهاء (الحصة 11+)
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
            {(() => {
              const list = players.filter(p => {
                if (p.status === "موقوف" || p.status === "مجمّد") return false;
                const sd = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
                if (alertFilter === "all") {
                  return sd.isUnpaid || sd.isExpired;
                } else {
                  const totalPast = sd.attendedCount + sd.absentCount + sd.excusedCount;
                  return !sd.isUnpaid && !sd.isExpired && totalPast >= 10 && totalPast < 12;
                }
              });

              if (list.length === 0) {
                return (
                  <div style={{ textAlign: "center", color: t.textFaint, padding: "20px 0", fontSize: 11 }}>
                    لا توجد تنبيهات سداد حالياً.
                  </div>
                );
              }

              return list.map(p => {
                const sd = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
                const g = groups.find(x => x.id === p.groupId);
                const par = parents.find(x => x.id === p.parentId);
                const totalPast = sd.attendedCount + sd.absentCount + sd.excusedCount;
                
                // Get last payment date
                const playerPays = (payments || []).filter(pay => String(pay.playerId) === String(p.id) && pay.type === "subscription");
                const sortedPays = [...playerPays].sort((a, b) => {
                  const da = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
                  const db = typeof b.date === "string" ? b.date.substring(0, 10) : getLocalDateString(b.date);
                  return db.localeCompare(da);
                });
                const renewalDate = sortedPays.length > 0 ? formatArabicDate(sortedPays[0].date) : "تجديد تلقائي عند التسجيل";
                const joinDateStr = formatArabicDate(p.joinDate);

                // Build message text
                const isNearing = alertFilter === "nearing";
                const msgText = [
                  "السلام عليكم ورحمة الله وبركاته،",
                  `نود إحاطتكم علماً بشأن اشتراك اللاعب: *${p.name}* (مجموعة: *${g?.name || "—"}*):`,
                  "",
                  isNearing 
                    ? "⚠️ اشتراك اللاعب شارف على الانتهاء." 
                    : "🚨 انتهت حصص الاشتراك الحالي أو الاشتراك غير مسدد.",
                  "",
                  "*تفاصيل الاشتراك:*",
                  `- الحصص المستهلكة: ${isNearing ? totalPast : sd.attendedCount} من أصل 12 حصة.`,
                  `- الحصص المتبقية: ${12 - (isNearing ? totalPast : sd.attendedCount)} حصة.`,
                  "",
                  "*التواريخ:*",
                  `- تاريخ الانضمام: ${joinDateStr}`,
                  `- تاريخ آخر تجديد: ${renewalDate}`,
                  "",
                  "يرجى سداد رسوم الاشتراك لضمان استمرارية حضور التمارين.",
                  "شاكرين لكم تعاونكم وثقتكم بنا.",
                  "نادي نجد الرياضي 🏆"
                ].join("\n");

                const handleWhatsApp = () => {
                  const parentPhone = par?.phone || p.phone;
                  if (!parentPhone) {
                    alert("⚠️ لا يوجد رقم هاتف مسجل لولي الأمر أو اللاعب!");
                    return;
                  }
                  
                  // Clean and format number for WhatsApp
                  let cleanNum = parentPhone.replace(/\D/g, "");
                  if (cleanNum.startsWith("00966")) {
                    cleanNum = cleanNum.slice(2);
                  }
                  if (cleanNum.startsWith("05") && cleanNum.length === 10) {
                    cleanNum = "966" + cleanNum.slice(1);
                  } else if (cleanNum.startsWith("5") && cleanNum.length === 9) {
                    cleanNum = "966" + cleanNum;
                  } else if (!cleanNum.startsWith("966") && cleanNum.startsWith("0")) {
                    cleanNum = "966" + cleanNum.slice(1);
                  } else if (!cleanNum.startsWith("966")) {
                    cleanNum = "966" + cleanNum;
                  }

                  const waLink = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msgText)}`;
                  window.open(waLink, "_blank");
                };

                const handlePlatform = () => {
                  const parentId = par?.id || p.parentId;
                  const parentName = par?.name || "ولي الأمر";
                  if (!parentId) {
                    alert("⚠️ لا يوجد معرف لولي الأمر لإرسال رسالة عبر المنصة!");
                    return;
                  }

                  const newMsg = {
                    id: `msg${Date.now()}-${parentId}`,
                    from: "admin",
                    fromName: "الإدارة",
                    to: parentId,
                    toName: parentName,
                    text: msgText,
                    files: [],
                    date: getLocalDateString(new Date()),
                    read: false
                  };

                  if (setMessages) {
                    setMessages(ms => [...ms, newMsg]);
                  }
                  
                  if (API_URL) {
                    fetch(`${API_URL}/api/messages`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newMsg)
                    }).catch(console.error);
                  }
                  
                  alert("✅ تم إرسال الرسالة بنجاح عبر المنصة!");
                };

                return (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0, flex: 1 }}>
                      <Avatar name={p.name} size={28} color={isNearing ? "#F59E0B" : "#EF4444"}/>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 10, color: t.textDim }}>{g?.name || "—"}</div>
                      </div>
                    </div>
                    
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: isNearing ? "#F59E0B" : "#EF4444", background: isNearing ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)", padding: "3px 8px", borderRadius: 6 }}>
                        {isNearing ? `الحصة ${totalPast}/12` : (sd.isUnpaid ? "غير مسدد" : "منتهي")}
                      </span>
                      
                      {/* WhatsApp Button */}
                      <button 
                        onClick={handleWhatsApp}
                        title="إرسال عبر واتساب"
                        style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8, 
                          border: "none", 
                          background: "rgba(16,185,129,0.1)", 
                          color: "#10B981", 
                          cursor: "pointer", 
                          display: "grid", 
                          placeItems: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(16,185,129,0.2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(16,185,129,0.1)"}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.488 2.01 14.025 1 11.997 1c-5.442 0-9.865 4.372-9.87 9.802 0 1.714.464 3.39 1.343 4.869l-.997 3.641 3.734-.978l-.16.09zM15.97 13.06c-.328-.164-1.94-.959-2.24-1.07-.3-.11-.52-.165-.74.165-.22.33-.85 1.071-1.04 1.29-.19.22-.38.242-.7.078-.328-.164-1.386-.511-2.64-1.629-.977-.872-1.637-1.95-1.828-2.28-.19-.33-.02-.508.145-.671.15-.147.33-.384.495-.577.165-.19.22-.328.328-.548.11-.22.05-.411-.025-.575-.075-.164-.74-1.782-1.01-2.436-.27-.648-.54-.56-.74-.571-.192-.01-.413-.011-.634-.011-.22 0-.58.083-.884.417-.305.333-1.162 1.137-1.162 2.772 0 1.636 1.192 3.217 1.356 3.436.165.22 2.348 3.585 5.688 5.03 2.78 1.203 3.344 1.218 4.545 1.107 1.192-.11 2.47-.984 2.82-1.942.35-.957.35-1.777.24-1.942-.11-.165-.33-.263-.66-.427z"/>
                        </svg>
                      </button>
                      
                      {/* Platform Message Button */}
                      <button 
                        onClick={handlePlatform}
                        title="إرسال عبر المنصة"
                        style={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: 8, 
                          border: "none", 
                          background: "rgba(124,73,168,0.1)", 
                          color: "#7C49A8", 
                          cursor: "pointer", 
                          display: "grid", 
                          placeItems: "center",
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(124,73,168,0.2)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(124,73,168,0.1)"}
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Admin Teams (NEW) ──────────────────────────────── */
function AdminTeams({ groups, setGroups, coaches, players, t, trainings, attendance, payments }) {
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({ name: "", coachId: "", color: "#06B6D4" });
  const [selGroup, setSelGroup] = useState(null);
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const save = () => {
    if (!form.name.trim()) return;
    if (modal === "add") setGroups(g => [...g, { ...form, id: `g${Date.now()}` }]);
    else setGroups(g => g.map(x => x.id === form.id ? form : x));
    setModal(null);
  };

  if (selGroup) {
    const g = groups.find(x => x.id === selGroup);
    if (!g) {
      setTimeout(() => setSelGroup(null), 0);
      return <div style={{ padding: 40, textAlign: "center", color: t.textDim }}>جاري تحميل بيانات الفريق...</div>;
    }
    const coach = coaches.find(c => c.id === g?.coachId);
    const gPlayers = players.filter(p => p.groupId === selGroup);
    return (
      <div>
        <button onClick={() => setSelGroup(null)} style={{ background: `${t.bg2}`, border: `1px solid ${t.border}`, color: t.textDim, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 18, fontFamily: "'Cairo',sans-serif" }}>← رجوع للفرق</button>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
          <Card t={t} style={{ padding: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg,${g.color},${g.color}88)`, display: "grid", placeItems: "center", fontSize: 26, color: "#fff", margin: "0 auto 12px", boxShadow: `0 0 20px ${g.color}40` }}>
                <NajdLogo size={44} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 18, color: g.color, marginBottom: 4 }}>{g.name}</div>
              <div style={{ fontSize: 12, color: t.textDim }}>{gPlayers.length} لاعب مسجل</div>
            </div>
            {[["المدرب", coach?.name || "—"]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                <span style={{ color: t.textDim }}>{k}</span>
                <span style={{ fontWeight: 600, color: t.text }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <Btn small onClick={() => { setForm({ ...g }); setModal("edit"); }} style={{ flex: 1 }}><AnimIcon type="edit" size={13} color="#fff" /> تعديل</Btn>
              <Btn small variant="danger" onClick={() => { setGroups(gs => gs.filter(x => x.id !== g.id)); setSelGroup(null); }}><AnimIcon type="trash" size={13} color="#EF4444" /></Btn>
            </div>
          </Card>

          <Card t={t} style={{ padding: 22, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>⚽ لاعبو الفريق ({gPlayers.length})</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Avatar name={coach?.name || "؟"} size={32} color="#7C49A8"/>
                  <div><div style={{ fontSize: 11, color: t.textDim }}>المدرب</div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{coach?.name || "—"}</div></div>
                </div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
                  {["اللاعب", "المركز", "الحضور", "الأهداف", "التقييم", "الحالة"].map(h => (
                    <th key={h} style={{ padding: "11px 12px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gPlayers.map((p, i) => (
                  <tr key={p.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s" }}>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <Avatar name={p.name} size={30} color={g.color}/>
                        <div><div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{p.name}</div><div style={{ fontSize: 10, color: t.textDim }}>{p.age} سنة</div></div>
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px" }}><Chip text={p.position} color="#06B6D4"/></td>
                    <td style={{ padding: "11px 12px", fontSize: 12, fontWeight: 700, color: p.attendancePct > 90 ? "#10B981" : p.attendancePct > 75 ? "#F59E0B" : "#EF4444" }}>{p.attendancePct}%</td>
                    <td style={{ padding: "11px 12px", fontSize: 13, fontWeight: 700, color: "#EF4444" }}>{p.goals} ⚽</td>
                    <td style={{ padding: "11px 12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ flex: 1, height: 5, background: t.border, borderRadius: 3, minWidth: 40 }}>
                          <div style={{ height: "100%", borderRadius: 3, background: p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444", width: `${p.score}%`, transition: "width 1s" }}/>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444" }}>{p.score}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 12px" }}>
                      {(() => {
                        const sd = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
                        const status = (p.status === "موقوف") ? "موقوف" : (p.status === "مجمّد") ? "مجمّد" : (sd.isUnpaid || sd.isExpired) ? "غير نشط" : "نشط";
                        return <Chip text={status} color={status === "نشط" ? "#10B981" : status === "مجمّد" ? "#3B82F6" : "#EF4444"}/>;
                      })()}
                    </td>
                  </tr>
                ))}
                {gPlayers.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: t.textFaint }}>لا يوجد لاعبون في هذه الفريق</td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
        {modal && (
          <Modal title="تعديل الفريق" onClose={() => setModal(null)} t={t}>
            <Input label="الاسم" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} t={t}/>
            <Input label="المدرب" value={form.coachId} onChange={v => setForm(f => ({ ...f, coachId: v }))} options={[{ v: "", l: "بدون مدرب" }, ...coaches.map(c => ({ v: c.id, l: c.name }))]} t={t}/>
            <Input label="اللون" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} type="color" t={t}/>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>💾 حفظ</Btn><Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn></div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn onClick={() => { setForm({ name: "", coachId: "", color: "#06B6D4" }); setModal("add"); }}>
          <AnimIcon type="plus" size={14} color="#fff" /> إضافة فريق
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 18 }}>
        {groups.map(g => {
          const coach = coaches.find(c => c.id === g.coachId);
          const gPlayers = players.filter(p => p.groupId === g.id);
          const avgScore = gPlayers.length ? Math.round(gPlayers.reduce((a, p) => a + p.score, 0) / gPlayers.length) : 0;
          return (
            <Card key={g.id} hover t={t} style={{ padding: 0, overflow: "hidden", cursor: "pointer", borderTop: `3px solid ${g.color}` }} onClick={() => setSelGroup(g.id)}>
              {/* Header */}
              <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: g.color, marginBottom: 4 }}>{g.name}</div>
                  </div>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: `${g.color}14`, border: `1px solid ${g.color}30`, display: "grid", placeItems: "center" }}>
                    <NajdLogo size={32} />
                  </div>
                </div>
              </div>

              {/* Coach card */}
              <div style={{ padding: "12px 20px", background: `${g.color}07`, borderBottom: `1px solid ${t.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={coach?.name || "؟"} size={34} color="#7C49A8"/>
                <div>
                  <div style={{ fontSize: 10, color: t.textDim }}>المدرب المسؤول</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{coach?.name || "غير محدد"}</div>
                  <div style={{ fontSize: 10, color: t.textDim }}>{coach?.specialty || ""} · {coach?.cert || ""}</div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["لاعبون", gPlayers.length, g.color], ["متوسط التقييم", avgScore, "#D8A435"], ["نسبة الحضور", `${gPlayers.length ? Math.round(gPlayers.reduce((a, p) => a + p.attendancePct, 0) / gPlayers.length) : 0}%`, "#10B981"]].map(([label, val, c]) => (
                  <div key={label} style={{ background: t.bg, borderRadius: 10, padding: "9px 10px", textAlign: "center", border: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: c }}>{val}</div>
                    <div style={{ fontSize: 10, color: t.textDim, marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Players avatars */}
              <div style={{ padding: "10px 20px 16px", display: "flex", alignItems: "center", gap: 6 }}>
                {gPlayers.slice(0, 6).map(p => <Avatar key={p.id} name={p.name} size={26} color={g.color}/>)}
                {gPlayers.length > 6 && <div style={{ width: 26, height: 26, borderRadius: "50%", background: t.border, display: "grid", placeItems: "center", fontSize: 10, color: t.textDim }}>+{gPlayers.length - 6}</div>}
              </div>
            </Card>
          );
        })}
      </div>

      {modal === "add" && (
        <Modal title="إضافة فريق جديد" onClose={() => setModal(null)} t={t}>
          <Input label="اسم الفريق" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} t={t}/>
          <Input label="المدرب المسؤول" value={form.coachId} onChange={v => setForm(f => ({ ...f, coachId: v }))} options={[{ v: "", l: "بدون مدرب" }, ...coaches.map(c => ({ v: c.id, l: c.name }))]} t={t}/>
          <Input label="اللون" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} type="color" t={t}/>
          <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>✅ إضافة الفريق</Btn><Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ── Admin Coaches with Permissions ─────────────────── */
function AdminCoaches({ coaches, setCoaches, groups, players, payments, t }) {
  const [sel, setSel] = useState(null);
  const [modal, setModal] = useState(null);
  const empty = { name: "", phone: "", email: "", password: "", specialty: "", exp: 0, cert: "", groupId: "", salary: 0, perms: { ...DEFAULT_PERMS } };
  const [form, setForm] = useState(empty);

  const PERM_LABELS = [
    { key: "attendance", label: "تسجيل الحضور والغياب", icon: "attendance" },
    { key: "payments",   label: "استلام وتسجيل المدفوعات", icon: "payments" },
    { key: "evals",      label: "إضافة تقييمات اللاعبين", icon: "trophy" },
    { key: "messages",   label: "إرسال واستقبال الرسائل", icon: "messages" },
  ];

  const save = () => {
    if (!form.name.trim()) return;
    if (modal === "add") {
      const id = `c${Date.now()}`;
      const email = (form.email && form.email.trim()) ? form.email.trim() : `coach_${(form.phone || '').replace(/\D/g, '') || Math.floor(Math.random()*1000)}@najd.sa`;
      const password = `Najd@${(form.phone || '').replace(/\D/g, '').slice(-4) || Math.floor(Math.random()*9000)+1000}`;
      setCoaches(c => [...c, { ...form, id, email, password, joined: getLocalDateString(new Date()) }]);
    }
    else setCoaches(c => c.map(x => x.id === form.id ? form : x));
    setModal(null);
    if (sel) setSel(null);
  };

  const togglePerm = (coachId, permKey) => {
    setCoaches(cs => cs.map(c => c.id === coachId ? { ...c, perms: { ...c.perms, [permKey]: !c.perms[permKey] } } : c));
  };

  if (sel) {
    const c = coaches.find(x => x.id === sel);
    if (!c) { 
      setTimeout(() => setSel(null), 0);
      return <div style={{ padding: 40, textAlign: "center", color: t.textDim }}>جاري تحميل بيانات المدرب...</div>;
    }
    const g = groups.find(x => x.id === c.groupId);
    const cPays = payments.filter(p => p.coachId === c.id);
    const rev = cPays.reduce((a, p) => a + p.amount, 0);
    const cPlayers = players.filter(p => p.groupId === c.groupId);
    const perms = c.perms || { ...DEFAULT_PERMS };

    return (
      <div>
        <button onClick={() => setSel(null)} style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.textDim, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 18, fontFamily: "'Cairo',sans-serif" }}>← رجوع</button>
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card t={t} style={{ padding: 24 }}>
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <Avatar name={c.name} size={64} color="#7C49A8"/>
                <div style={{ fontWeight: 800, fontSize: 16, marginTop: 12, marginBottom: 6, color: t.text }}>{c.name}</div>
                <Chip text={c.specialty} color="#7C49A8"/>
              </div>
              {[["الهاتف", c.phone], ["الإيميل", c.email], ["كلمة المرور", (c.password && c.password !== '••••••••' && !c.password.includes(':') && c.password.length <= 20) ? c.password : (c.phone ? `Najd@${c.phone.replace(/\D/g, '').slice(-4)}` : `Najd@${(c.id || '').replace(/\D/g, '').slice(-4) || '1234'}`)], ["الشهادة", c.cert], ["الخبرة", `${c.exp} سنة`], ["المجموعة", g?.name || "—"], ["الراتب", fmtMoney(c.salary)]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                  <span style={{ color: t.textDim }}>{k}</span>
                  <span style={{ fontWeight: 600, color: k === "كلمة المرور" ? "#D8A435" : k === "الإيميل" ? "#06B6D4" : t.text, fontFamily: k === "كلمة المرور" ? "monospace" : undefined }}>{v}</span>
                </div>
              ))}
              <Btn style={{ width: "100%", marginTop: 14 }} onClick={() => { setForm({ ...c }); setModal("edit"); }}>
                <AnimIcon type="edit" size={14} color="#fff" /> تعديل البيانات
              </Btn>
            </Card>

            {/* Permissions Panel */}
            <Card t={t} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <AnimIcon type="permissions" size={16} color="#D8A435"/>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#D8A435" }}>الصلاحيات</div>
              </div>
              {PERM_LABELS.map(({ key, label, icon }) => {
                const enabled = perms[key] !== false;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: `1px solid ${t.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <AnimIcon type={icon} size={15} color={enabled ? "#10B981" : t.textFaint}/>
                      <span style={{ fontSize: 12, fontWeight: 600, color: enabled ? t.text : t.textDim }}>{label}</span>
                    </div>
                    {/* Toggle */}
                    <button onClick={() => togglePerm(c.id, key)}
                      style={{ width: 42, height: 22, borderRadius: 11, border: "none", cursor: "pointer", transition: "all .25s", background: enabled ? "#10B981" : t.border, position: "relative", flexShrink: 0 }}>
                      <div style={{ position: "absolute", top: 3, right: enabled ? 3 : 21, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "right .25s", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }}/>
                    </button>
                  </div>
                );
              })}
              <div style={{ marginTop: 12, fontSize: 11, color: t.textFaint, lineHeight: 1.6 }}>
                الصلاحيات المُلغاة تُزال فوراً من بوابة المدرب
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              <StatCard label="اللاعبون"    counter={cPlayers.length} icon="⚽" color="#06B6D4" t={t}/>
              <StatCard label="المدفوعات"  counter={cPays.length}    icon="💳" color="#7C49A8" t={t}/>
              <StatCard label="الإيرادات"  counter={rev}             icon="💰" color="#10B981" value={fmtMoney(rev)} t={t}/>
            </div>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>💰 سجل المدفوعات المستلمة</div>
              {cPays.map(p => {
                const pt = PAY_TYPES[p.type];
                return (
                  <div key={p.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 4px", borderBottom: `1px solid ${t.border}`, transition: "background .15s" }}>
                    <div style={{ display: "flex", gap: 9, alignItems: "center" }}><span style={{ fontSize: 17 }}>{pt.icon}</span><div><div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{p.playerName}</div><div style={{ fontSize: 10, color: t.textDim }}>{pt.label} · {p.month}</div></div></div>
                    <div style={{ textAlign: "left" }}><div style={{ fontSize: 13, fontWeight: 800, color: pt.color }}>{fmtMoney(p.amount)}</div><div style={{ fontSize: 10, color: t.textDim }}>{p.date}</div></div>
                  </div>
                );
              })}
              {cPays.length === 0 && <div style={{ padding: 30, textAlign: "center", color: t.textFaint }}>لا يوجد سجل مدفوعات</div>}
            </Card>
          </div>
        </div>
        {modal && (
          <Modal title="تعديل بيانات المدرب" onClose={() => setModal(null)} wide t={t}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0 14px" }}>
              {[["الاسم", "name"], ["الهاتف", "phone"], ["الإيميل", "email"], ["كلمة المرور", "password"], ["التخصص", "specialty"], ["الشهادة", "cert"]].map(([l, f]) => (
                <div key={f} style={{ flex: "1 1 calc(50% - 7px)" }}><Input label={l} value={form[f] || ""} onChange={v => setForm(x => ({ ...x, [f]: v }))} t={t}/></div>
              ))}
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الخبرة (سنوات)" value={form.exp} onChange={v => setForm(x => ({ ...x, exp: +v }))} type="number" t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الراتب" value={form.salary} onChange={v => setForm(x => ({ ...x, salary: +v }))} type="number" t={t}/></div>
              <div style={{ flex: "1 1 100%" }}><Input label="المجموعة" value={form.groupId} onChange={v => setForm(x => ({ ...x, groupId: v }))} options={[{ v: "", l: "بدون مجموعة" }, ...groups.map(g => ({ v: g.id, l: g.name }))]} t={t}/></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>💾 حفظ</Btn><Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn></div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Btn onClick={() => { setForm(empty); setModal("add"); }}>
          <AnimIcon type="plus" size={14} color="#fff" /> إضافة مدرب
        </Btn>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
        {coaches.map(c => {
          const g   = groups.find(x => x.id === c.groupId);
          const rev = payments.filter(p => p.coachId === c.id).reduce((a, p) => a + p.amount, 0);
          const perms = c.perms || { ...DEFAULT_PERMS };
          const enabledCount = Object.values(perms).filter(Boolean).length;
          return (
            <Card key={c.id} hover t={t} style={{ padding: 22, cursor: "pointer" }} onClick={() => setSel(c.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <Avatar name={c.name} size={46} color="#7C49A8"/>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: t.text }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: t.textDim }}>{c.specialty} · {c.cert}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[["المجموعة", g?.name || "—", "#06B6D4"], ["الراتب", fmtMoney(c.salary), "#D8A435"], ["الخبرة", `${c.exp} سنة`, "#7C49A8"]].map(([l, v, col]) => (
                  <div key={l} style={{ background: t.bg, borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: t.textDim }}>{l}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: col }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Permissions summary */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", borderRadius: 8, background: enabledCount === 4 ? "rgba(16,185,129,.08)" : "rgba(239,68,68,.06)", border: `1px solid ${enabledCount === 4 ? "rgba(16,185,129,.2)" : "rgba(239,68,68,.15)"}` }}>
                <AnimIcon type="permissions" size={13} color={enabledCount === 4 ? "#10B981" : "#F59E0B"}/>
                <span style={{ fontSize: 11, fontWeight: 600, color: enabledCount === 4 ? "#10B981" : "#F59E0B" }}>{enabledCount === 4 ? "جميع الصلاحيات مفعّلة" : `${enabledCount}/4 صلاحيات مفعّلة`}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {modal === "add" && (
        <Modal title="إضافة مدرب جديد" onClose={() => setModal(null)} wide t={t}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 14px" }}>
            {[["الاسم", "name"], ["الهاتف", "phone"], ["التخصص", "specialty"], ["الشهادة", "cert"]].map(([l, f]) => (
              <div key={f} style={{ flex: "1 1 calc(50% - 7px)" }}><Input label={l} value={form[f] || ""} onChange={v => setForm(x => ({ ...x, [f]: v }))} t={t}/></div>
            ))}
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الخبرة (سنوات)" value={form.exp} onChange={v => setForm(x => ({ ...x, exp: +v }))} type="number" t={t}/></div>
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الراتب" value={form.salary} onChange={v => setForm(x => ({ ...x, salary: +v }))} type="number" t={t}/></div>
            <div style={{ flex: "1 1 100%" }}><Input label="المجموعة" value={form.groupId} onChange={v => setForm(x => ({ ...x, groupId: v }))} options={[{ v: "", l: "بدون مجموعة" }, ...groups.map(g => ({ v: g.id, l: g.name }))]} t={t}/></div>
          </div>
          <div style={{ padding: "10px", background: "rgba(124,73,168,.06)", borderRadius: 10, marginBottom: 14, fontSize: 11, color: t.textDim }}>
            ℹ️ سيتم إنشاء البريد الإلكتروني وكلمة المرور تلقائياً بعد الحفظ.
          </div>
          <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>✅ إضافة المدرب</Btn><Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ── Admin Players ──────────────────────────────────── */
function AdminPlayers({ players, setPlayers, groups, parents, evals, coaches, t, trainings, attendance, payments, setAttendance }) {
  const [sel, setSel]   = useState(null);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const emptyP = { name: "", age: "", groupId: groups[0]?.id || "", phone: "", position: "مهاجم", status: "نشط", score: 80, speed: 75, stamina: 75, technique: 75, teamwork: 75, goals: 0, assists: 0, attendancePct: 90, weight: "", height: "", parentId: "__new__", email: "", password: "" };
  const [form, setForm] = useState(emptyP);
  const [freezeStartDate, setFreezeStartDate] = useState("");
  const filtered = players.filter(p => p.name.includes(search) || (groups.find(g => g.id === p.groupId)?.name || "").includes(search));

  if (sel) {
    const p   = players.find(x => x.id === sel);
    if (!p) { 
      setTimeout(() => setSel(null), 0);
      return <div style={{ padding: 40, textAlign: "center", color: t.textDim }}>جاري تحميل بيانات اللاعب...</div>;
    }
    const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
    const totalPast = subDetails.attendedCount + subDetails.absentCount + subDetails.excusedCount;
    const computedAttendancePct = totalPast > 0 ? Math.round((subDetails.attendedCount / totalPast) * 100) : 100;

    const playerPays = (payments || []).filter(pay => String(pay.playerId) === String(p.id) && pay.type === "subscription");
    const sortedPays = [...playerPays].sort((a, b) => {
      const da = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
      const db = typeof b.date === "string" ? b.date.substring(0, 10) : getLocalDateString(b.date);
      return db.localeCompare(da);
    });
    const latestRenewalDate = sortedPays.length > 0 ? formatArabicDate(sortedPays[0].date) : "تجديد تلقائي عند التسجيل";

    const lastEval = (evals || []).filter(e => e.playerId === p.id).slice(-1)[0];
    const g   = groups.find(x => x.id === p.groupId);
    const par = parents.find(x => x.id === p.parentId);
    return (
      <div>
        <button onClick={() => setSel(null)} style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.textDim, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 18, fontFamily: "'Cairo',sans-serif" }}>← رجوع</button>
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 16 }}>
          <Card t={t} style={{ padding: 24 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar name={p.name} size={60} color={g?.color || "#7C49A8"}/>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 12, marginBottom: 6, color: t.text }}>{p.name}</div>
              <Chip text={p.position} color={g?.color || "#7C49A8"}/>
            </div>
            {(() => {
              const rows = [
                ["العمر", `${p.age || '—'} سنة`],
                ["الطول", `${p.height || '—'} سم`],
                ["الوزن", `${p.weight || '—'} كجم`],
                ["الأهداف", p.goals || 0],
                ["التمريرات", p.assists || 0],
                ["حضور الاشتراك الحالي", `${subDetails.attendedCount} / 12 حصة`],
                ["نسبة حضور الدورة", `${computedAttendancePct}%`],
                ["المجموعة", g?.name || "—"],
                ["ولي الأمر", par?.name || "—"],
                ["تاريخ التسجيل", formatArabicDate(p.joinDate)],
                ["تجديد الاشتراك", latestRenewalDate],
                ["إيميل الدخول", par?.email || p.email || "—"],
                ["كلمة المرور", (par?.password && par.password !== '••••••••' && !par.password.includes(':') && par.password.length <= 20) ? par.password : (p.password && p.password !== '••••••••' && !p.password.includes(':') && p.password.length <= 20) ? p.password : ((par?.phone || p.phone) ? `najd_${(par?.phone || p.phone).replace(/\D/g, '').slice(-4)}` : `najd_${(p.id || '').replace(/\D/g, '').slice(-4) || '0000'}`)]
              ];
              if (p.freezePeriods) {
                try {
                  const periods = JSON.parse(p.freezePeriods);
                  if (periods.length > 0) {
                    const disp = periods.map(per => {
                      const st = formatArabicDate(per.start);
                      const en = per.end ? formatArabicDate(per.end) : "مستمر";
                      return `${st} ← ${en}`;
                    }).join(" | ");
                    rows.push(["فترات التجميد", disp]);
                  }
                } catch (e) {
                  console.error("Error formatting freeze periods:", e);
                }
              }
              return rows.map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                  <span style={{ color: t.textDim }}>{k}</span>
                  <span style={{ fontWeight: 600, color: (k === "كلمة المرور" && v !== "كلمة مرور ولي الأمر الحالية") ? "#D8A435" : k === "إيميل الدخول" ? "#06B6D4" : t.text, fontFamily: k === "كلمة المرور" ? "monospace" : undefined, fontSize: k === "كلمة المرور" ? 11 : 12 }}>{v}</span>
                </div>
              ));
            })()}
            <Btn style={{ width: "100%", marginTop: 14 }} onClick={() => { setForm({ ...p, email: par?.email || "", password: par?.password || "" }); setModal("edit"); }}>
              <AnimIcon type="edit" size={14} color="#fff" /> تعديل
            </Btn>
            {p.status === "مجمّد" ? (
              <Btn 
                style={{ width: "100%", marginTop: 8, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} 
                onClick={() => {
                  setFreezeStartDate(getLocalDateString(new Date()));
                  setModal("unfreeze");
                }}
              >
                <AnimIcon type="unfreeze" size={14} color="#fff" /> إلغاء التجميد / عودة اللاعب
              </Btn>
            ) : (
              p.status !== "موقوف" && (
                <Btn 
                  style={{ width: "100%", marginTop: 8, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }} 
                  onClick={() => {
                    setFreezeStartDate(getLocalDateString(new Date()));
                    setModal("freeze");
                  }}
                >
                  <AnimIcon type="freeze" size={14} color="#fff" /> تجميد الاشتراك
                </Btn>
              )
            )}
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📊 المهارات</div>
              {lastEval ? (
                <div>
                  <SkillBar label="السرعة"         val={lastEval.speed}     color="#06B6D4" t={t}/>
                  <SkillBar label="التقنية"        val={lastEval.technique} color="#7C49A8" t={t}/>
                  <SkillBar label="العمل الجماعي" val={lastEval.teamwork}  color="#F59E0B" t={t}/>
                  <div style={{ marginTop: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: t.textDim }}>التقييم الكلي</span>
                      <span style={{ fontWeight: 800, color: p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444" }}>{p.score}/100</span>
                    </div>
                    <div style={{ height: 8, background: t.border, borderRadius: 4 }}>
                      <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444"},transparent)`, width: `${p.score}%` }}/>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: t.textFaint, padding: "30px 0", fontSize: 13 }}>لم يتم تقييم مهارات اللاعب بعد</div>
              )}
            </Card>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📝 حالة التقييم والملاحظات</div>
              {lastEval ? (
                <div>
                  <div style={{ fontSize: 11, color: t.textDim, marginBottom: 8 }}>
                    آخر تقييم بتاريخ: {lastEval.date} · بواسطة الكابتن {coaches?.find(c => c.id === lastEval.coachId)?.name || "طاقم التدريب"}
                  </div>
                  <div style={{ fontSize: 14, color: t.textMid, lineHeight: 1.6 }}>
                    "{lastEval.note || "لا توجد ملاحظات إضافية."}"
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: t.textFaint, padding: "20px 0", fontSize: 12 }}>لا توجد ملاحظات تقييمية مسجلة بعد</div>
              )}
            </Card>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span> تفاصيل الاشتراك والتحضير (الدورة {subDetails.cycleIndex})
              </div>
              
              {subDetails.isUnpaid ? (
                <div style={{ textAlign: "center", color: "#EF4444", padding: 30, border: `1px dashed #EF4444`, borderRadius: 16, background: "rgba(239,68,68,0.05)" }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div style={{ fontWeight: 800, marginTop: 10 }}>الاشتراك غير نشط</div>
                  <div style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>يرجى سداد دفعة الاشتراك الشهري لتفعيل الحصص التدريبية.</div>
                </div>
              ) : (
                <>
                  {subDetails.isExpired && (
                    <div style={{ textAlign: "center", color: "#EF4444", padding: 16, border: `1px dashed #EF4444`, borderRadius: 16, background: "rgba(239,68,68,0.05)", marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>🚨</span>
                      <div style={{ fontWeight: 800, marginTop: 6 }}>انتهت الحصص المتاحة (12 / 12)</div>
                      <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>يرجى سداد قيمة الاشتراك الشهري للدورة الجديدة لتفعيل حصص إضافية.</div>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 60, background: "rgba(16,185,129,0.08)", padding: "10px 6px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(16,185,129,0.12)" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981" }}>{subDetails.attendedCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>حاضر</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, background: "rgba(239,68,68,0.08)", padding: "10px 6px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(239,68,68,0.12)" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#EF4444" }}>{subDetails.absentCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>غائب</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, background: "rgba(245,158,11,0.08)", padding: "10px 6px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B" }}>{subDetails.excusedCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>بعذر</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, background: t.bg2, padding: "10px 6px", borderRadius: 12, textAlign: "center", border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: t.textDim }}>{subDetails.remainingCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>متبقي</div>
                    </div>
                  </div>

                  <PlayerAttendanceGrid player={p} subDetails={subDetails} attendance={attendance} setAttendance={setAttendance} t={t} />
                </>
              )}
            </Card>
          </div>
        </div>
        {modal === "edit" && (
          <Modal title="تعديل بيانات اللاعب" onClose={() => setModal(null)} wide t={t}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0 14px" }}>
              {[["الاسم", "name"], ["الهاتف", "phone"], ["الإيميل", "email"], ["كلمة المرور", "password"]].map(([l, f]) => (
                <div key={f} style={{ flex: "1 1 calc(50% - 7px)" }}><Input label={l} value={form[f] || ""} onChange={v => setForm(x => ({ ...x, [f]: v }))} t={t}/></div>
              ))}
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="المجموعة" value={form.groupId} onChange={v => setForm(x => ({ ...x, groupId: v }))} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الحالة" value={form.status} onChange={v => setForm(x => ({ ...x, status: v }))} options={["نشط", "موقوف", "مجمّد"]} t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="المركز" value={form.position} onChange={v => setForm(x => ({ ...x, position: v }))} options={["مهاجم", "جناح أيمن", "جناح أيسر", "وسط", "مدافع", "حارس مرمى"]} t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="العمر" value={form.age} onChange={v => setForm(x => ({ ...x, age: +v }))} type="number" t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الطول (سم)" value={form.height} onChange={v => setForm(x => ({ ...x, height: +v }))} type="number" t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الوزن (كجم)" value={form.weight} onChange={v => setForm(x => ({ ...x, weight: +v }))} type="number" t={t}/></div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => { setPlayers(ps => ps.map(x => x.id === form.id ? { ...form } : x)); setModal(null); }} style={{ flex: 1 }}>💾 حفظ</Btn>
              <Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn>
            </div>
          </Modal>
        )}
        {modal === "freeze" && (
          <Modal title="تجميد اشتراك اللاعب" onClose={() => setModal(null)} t={t}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.5 }}>
                سيتم إيقاف احتساب الحصص التدريبية للاعب مؤقتاً ابتداءً من التاريخ المحدد. عند عودة اللاعب وإلغاء التجميد، سيتم ترحيل الحصص المتبقية تلقائياً.
              </div>
              <Input 
                label="تاريخ بدء التجميد" 
                type="date" 
                value={freezeStartDate} 
                onChange={v => setFreezeStartDate(v)} 
                t={t}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Btn 
                  onClick={() => {
                    let periods = [];
                    if (p.freezePeriods) {
                      try {
                        periods = JSON.parse(p.freezePeriods);
                      } catch (e) {
                        console.error("Error parsing periods:", e);
                      }
                    }
                    periods.push({ start: freezeStartDate, end: null });
                    const updatedPlayer = {
                      ...p,
                      status: "مجمّد",
                      freezePeriods: JSON.stringify(periods)
                    };
                    setPlayers(ps => ps.map(x => x.id === p.id ? updatedPlayer : x));
                    setModal(null);
                  }} 
                  style={{ flex: 1, background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <AnimIcon type="freeze" size={14} color="#fff" /> تأكيد التجميد
                </Btn>
                <Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn>
              </div>
            </div>
          </Modal>
        )}
        {modal === "unfreeze" && (
          <Modal title="إنهاء تجميد الاشتراك" onClose={() => setModal(null)} t={t}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, color: t.textDim, lineHeight: 1.5 }}>
                سيتم استئناف احتساب الحصص التدريبية للاعب بدءاً من تاريخ العودة المحدد.
              </div>
              <Input 
                label="تاريخ عودة اللاعب" 
                type="date" 
                value={freezeStartDate} 
                onChange={v => setFreezeStartDate(v)} 
                t={t}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Btn 
                  onClick={() => {
                    let periods = [];
                    if (p.freezePeriods) {
                      try {
                        periods = JSON.parse(p.freezePeriods);
                      } catch (e) {
                        console.error("Error parsing periods:", e);
                      }
                    }
                    
                    const returnDateObj = new Date(freezeStartDate);
                    const dayBeforeReturn = new Date(returnDateObj);
                    dayBeforeReturn.setDate(dayBeforeReturn.getDate() - 1);
                    const dayBeforeReturnStr = getLocalDateString(dayBeforeReturn);
                    
                    const updatedPeriods = periods.map(per => {
                      if (!per.end) {
                        return { ...per, end: dayBeforeReturnStr };
                      }
                      return per;
                    });
                    
                    const updatedPlayer = {
                      ...p,
                      status: "نشط",
                      freezePeriods: JSON.stringify(updatedPeriods)
                    };
                    
                    setPlayers(ps => ps.map(x => x.id === p.id ? updatedPlayer : x));
                    setModal(null);
                  }} 
                  style={{ flex: 1, background: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <AnimIcon type="unfreeze" size={14} color="#fff" /> تأكيد العودة
                </Btn>
                <Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn>
              </div>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 9, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px" }}>
          <AnimIcon type="search" size={15} color={t.textDim}/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث..." style={{ background: "none", border: "none", outline: "none", color: t.text, fontSize: 13, width: "100%", fontFamily: "'Cairo',sans-serif" }}/>
        </div>
        <Btn onClick={() => { 
          if (groups.length === 0) {
            alert("الرجاء إضافة فريق (مجموعة) أولاً قبل إضافة اللاعبين.");
            return;
          }
          setForm({ ...emptyP, groupId: groups[0].id }); 
          setModal("add"); 
        }}>
          <AnimIcon type="plus" size={14} color="#fff" /> إضافة لاعب
        </Btn>
      </div>
      <Card t={t} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
              {["اللاعب", "الفريق", "المركز", "الحصص المحضورة", "الحالة", "التقييم", ""].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const g = groups.find(x => x.id === p.groupId);
              const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
              return (
                <tr key={p.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s", cursor: "pointer" }} onClick={() => setSel(p.id)}>
                  <td style={{ padding: "11px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <Avatar name={p.name} size={30} color={g?.color || "#7C49A8"}/>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{p.name}</div>
                    </div>
                  </td>
                  <td style={{ padding: "11px 14px" }}><Chip text={g?.name || "—"} color={g?.color || "#7C49A8"}/></td>
                  <td style={{ padding: "11px 14px" }}><Chip text={p.position} color="#06B6D4"/></td>
                  <td style={{ padding: "11px 14px" }}>
                    {subDetails.isUnpaid ? (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#EF4444", background: "rgba(239,68,68,0.1)", padding: "3px 8px", borderRadius: 6 }}>⚠️ غير مسدد</span>
                    ) : subDetails.isExpired ? (
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "3px 8px", borderRadius: 6 }}>⚠️ منتهي ({subDetails.attendedCount} / 12)</span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{subDetails.attendedCount} / 12</span>
                    )}
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    {(() => {
                      const status = (p.status === "موقوف") ? "موقوف" : (p.status === "مجمّد") ? "مجمّد" : (subDetails.isUnpaid || subDetails.isExpired) ? "غير نشط" : "نشط";
                      return <Chip text={status} color={status === "نشط" ? "#10B981" : status === "مجمّد" ? "#3B82F6" : "#EF4444"}/>;
                    })()}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 800, color: p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444" }}>{p.score}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <button onClick={e => { e.stopPropagation(); setPlayers(ps => ps.filter(x => x.id !== p.id)); }}
                      style={{ width: 26, height: 26, borderRadius: 7, border: "none", background: "rgba(239,68,68,.1)", color: "#EF4444", cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <AnimIcon type="trash" size={13} color="#EF4444"/>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
      {modal === "add" && (
        <Modal title="إضافة لاعب جديد" onClose={() => setModal(null)} wide t={t}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 14px" }}>
            {[["الاسم الكامل", "name"], ["رقم الهاتف (للدخول)", "phone"]].map(([l, f]) => (
              <div key={f} style={{ flex: "1 1 calc(50% - 7px)" }}><Input label={l} value={form[f] || ""} onChange={v => setForm(x => ({ ...x, [f]: v }))} t={t}/></div>
            ))}
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="المجموعة" value={form.groupId} onChange={v => setForm(x => ({ ...x, groupId: v }))} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/></div>
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="المركز" value={form.position} onChange={v => setForm(x => ({ ...x, position: v }))} options={["مهاجم", "جناح أيمن", "جناح أيسر", "وسط", "مدافع", "حارس مرمى"]} t={t}/></div>
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="العمر" value={form.age} onChange={v => setForm(x => ({ ...x, age: +v }))} type="number" t={t}/></div>
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الطول (سم)" value={form.height} onChange={v => setForm(x => ({ ...x, height: +v }))} type="number" t={t}/></div>
            <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الوزن (كجم)" value={form.weight} onChange={v => setForm(x => ({ ...x, weight: +v }))} type="number" t={t}/></div>
            {/* ولي الأمر: اختيار من الحسابات الموجودة أو إنشاء جديد */}
            <div style={{ flex: "1 1 100%" }}>
              <Input
                label="ولي الأمر (اختر حساباً موجوداً)"
                value={form.parentId}
                onChange={v => setForm(x => ({ ...x, parentId: v }))}
                options={[
                  { v: "__new__", l: "➕ إنشاء حساب جديد بناءً على رقم الهاتف" },
                  ...parents.map(par => ({ v: par.id, l: par.name }))
                ]}
                t={t}
              />
            </div>
          </div>
          <div style={{ padding: 12, background: "rgba(16,185,129,.05)", borderRadius: 10, border: "1px dashed rgba(16,185,129,.2)", marginBottom: 15, fontSize: 11, color: t.textDim }}>
            {form.parentId === "__new__" || !form.parentId
              ? "💡 سيتم إنشاء حساب ولي أمر جديد تلقائياً بناءً على رقم الهاتف."
              : `✅ سيتم ربط اللاعب بحساب ولي الأمر: ${parents.find(p => p.id === form.parentId)?.name}`
            }
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => { 
              if (!form.name || !form.name.trim()) {
                alert("الرجاء إدخال اسم اللاعب الكامل");
                return;
              }
              if (!form.phone || !form.phone.trim()) {
                alert("الرجاء إدخال رقم الهاتف (مطلوب للدخول)");
                return;
              }
              if (!form.age || isNaN(form.age) || +form.age <= 0) {
                alert("الرجاء إدخال عمر اللاعب (مطلوب)");
                return;
              }
              const phone = form.phone.trim();
              // إذا اختار المدير ولي أمر موجود → استخدم ID الحساب الموجود
              // إذا اختار "جديد" أو لم يختر → أنشئ parentId من رقم الهاتف
              const resolvedParentId = (form.parentId && form.parentId !== "__new__")
                ? form.parentId
                : `par_${phone}`;
              const generatedEmail = `najd_${phone}@najd.sa`;
              const generatedPass  = `najd_${phone.slice(-4)}`;
              setPlayers(ps => [...ps, { 
                ...form, 
                id: `p${Date.now()}`, 
                parentId: resolvedParentId,
                email: generatedEmail, 
                password: generatedPass, 
                score: +form.score || 80, 
                attendancePct: 90, 
                goals: 0, 
                assists: 0, 
                joinDate: getLocalDateString(new Date()) 
              }]); 
              setModal(null); 
            }} style={{ flex: 1 }}>✅ إضافة وتوليد بيانات الدخول</Btn>
            <Btn variant="secondary" onClick={() => setModal(null)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ── Admin Payments ─────────────────────────────────── */
/* ══════════════════════════════════════════════════════════
   INVOICE MODAL — A4 Arabic Invoice: Logo, QR, Credentials, PDF
══════════════════════════════════════════════════════════ */
const ACADEMY_WEBSITE = "https://najd-academy-system.vercel.app/";

function InvoiceModal({ payment, allPayments, players, parents, onClose }) {
  const invoiceRef = useRef(null);
  const isExpense = !!payment.purchaser;
  const { items, note: parsedNote } = isExpense ? parseExpenseNote(payment) : { items: [], note: "" };

  // Collect all payments for the same player in the same month
  const relatedPayments = isExpense ? [payment] : (allPayments || []).filter(
    p => p.playerId === payment.playerId && p.month === payment.month
  );

  const player = isExpense ? null : (players || []).find(p => p.id === payment.playerId);
  const parent = !isExpense && parents ? parents.find(par => par.id === player?.parentId) : null;
  const totalAmount = isExpense ? payment.amount : relatedPayments.reduce((sum, p) => sum + p.amount, 0);
  const invoiceNum = isExpense
    ? `EXP-${payment.id.replace(/\D/g, '').slice(-8).padStart(8, '0')}`
    : `INV-${payment.id.replace(/\D/g, '').slice(-8).padStart(8, '0')}`;

  const TERMS = [
    "لا يحق للمشترك المطالبة بأي مبلغ في حال أراد عدم الاكمال في التدريبات لأي ظرف كان.",
    "في حال اكتشفت الأكاديمية أي مشكلة مرضية أو سلوكية على المشترك لم يتم الإفصاح عنها يحق للأكاديمية استبعاد المشترك دون الرجوع لولي الأمر.",
    "المشترك هو المسؤول عن نظافة اللبس المخصص للأكاديمية ولا يسمح له بدخول أي تمرين ألا به ولا يسمح له بمشاركة المشترك في أي نشاط في حال كان اللبس غير لائق.",
    "يتدرب المشترك 12 تدريب شهرياً يكون من بداية تاريخ أول تدريب.",
    "الأكاديمية حلقة وصل بين المشترك وصاحب الباص والأمر هو المسؤول من إرسال الابن واستقباله بعد الانتهاء من التدريب.",
    "الأكاديمية مسؤوليه كامله عن استقبال المشتركين وتوديعهم ومتابعة حركة الباص."
  ];

  const todayStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(ACADEMY_WEBSITE)}&bgcolor=ffffff&color=6D28D9&margin=4`;

  // ── Opens a full standalone invoice page in a new window
  const openInvoiceWindow = (mode) => {
    const content = invoiceRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) { alert('يرجى السماح لفتح نوافذ منبثقة من المتصفح'); return; }

    const shareBtn = mode === 'share' ? `
      <button class="btn btn-gold" onclick="doShare()">📤 مشاركة</button>` : '';

    const shareScript = mode === 'share' ? `
      async function doShare() {
        const title = '${isExpense ? 'سند صرف مصروفات' : 'فاتورة مشترك'} — نادي نجد الرياض';
        const text = [
          '${isExpense ? 'سند صرف مصروفات' : 'فاتورة مشترك'} — نادي نجد الرياض',
          '${isExpense ? 'الغرض: ' + payment.item : 'اللاعب: ' + payment.playerName}',
          '${isExpense ? 'القائم بالصرف: ' + payment.purchaser : 'الشهر: ' + payment.month}',
          'المجموع: ${fmtMoney(totalAmount)}',
          '',
          'نادي نجد الرياض'
        ].join('\\n');
        if (navigator.share) {
          try {
            await navigator.share({ title, text, url: '${ACADEMY_WEBSITE}' });
            return;
          } catch(e) { /* cancelled */ }
        }
        // Fallback: open print dialog so user can save PDF and share
        window.print();
      }` : '';

    const autoPrint = mode === 'print' ?
      `window.addEventListener('load', function() { setTimeout(function(){ window.print(); }, 800); });` : '';

    win.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isExpense ? 'سند صرف' : 'فاتورة'} — ${isExpense ? payment.item : payment.playerName} — ${payment.month || ''}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { font-family: 'Cairo', sans-serif !important; direction: rtl; background: #120e28; }
    .action-bar {
      position: sticky; top: 0; z-index: 9999;
      background: linear-gradient(135deg,#4C1D95,#7C3AED);
      padding: 12px 20px; display: flex; align-items: center;
      justify-content: space-between; gap: 10px; flex-wrap: wrap;
    }
    .action-bar-title { color:#fff; font-weight:800; font-size:14px; font-family:'Cairo',sans-serif; }
    .btn {
      padding: 8px 18px; border-radius: 8px; border: none; cursor: pointer;
      font-family: 'Cairo', sans-serif; font-size: 13px; font-weight: 800;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .btn-gold { background: #FBBF24; color: #1a1a2e; }
    .btn-ghost { background: rgba(255,255,255,0.15); color: #fff; }
    .invoice-page {
      max-width: 794px; margin: 20px auto; background: #fff;
      box-shadow: 0 20px 60px rgba(0,0,0,.6);
    }
    @page { size: A4; margin: 0; }
    @media print {
      body { background: #fff !important; }
      .action-bar { display: none !important; }
      .invoice-page { margin: 0 !important; box-shadow: none !important; max-width: 100% !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    }
  </style>
</head>
<body>
  <div class="action-bar">
    <span class="action-bar-title">🧾 ${isExpense ? 'سند صرف مصروفات' : 'فاتورة مشترك'} — ${isExpense ? payment.item : payment.playerName}</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${shareBtn}
      <button class="btn btn-ghost" onclick="window.print()">🖨️ طباعة ‏/ حفظ PDF</button>
    </div>
  </div>
  <div class="invoice-page">${content.innerHTML}</div>
  <script>
    ${shareScript}
    ${autoPrint}
  </script>
</body>
</html>`);
    win.document.close();
  };

  const handlePrint = () => openInvoiceWindow('print');
  const handleShare = () => openInvoiceWindow('share');

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '20px 16px', overflowY: 'auto'
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: '100%', maxWidth: 820, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.6)' }}>

        {/* ── Action Bar ── */}
        <div style={{
          background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between'
        }}>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: "'Cairo',sans-serif" }}>
            🧾 {isExpense ? 'سند صرف مصروفات' : 'فاتورة مشترك'} — {isExpense ? payment.item : payment.playerName}
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={handleShare} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: '#FBBF24', color: '#1a1a2e',
              fontSize: 12, fontWeight: 800, cursor: 'pointer',
              fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 6
            }}>📤 مشاركة</button>
            <button onClick={handlePrint} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.15)', color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Cairo',sans-serif", display: 'flex', alignItems: 'center', gap: 6
            }}>🖨️ طباعة</button>
            <button onClick={onClose} style={{
              padding: '8px 14px', borderRadius: 8, border: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#fff',
              fontSize: 18, cursor: 'pointer', lineHeight: 1
            }}>✕</button>
          </div>
        </div>

        {/* ── A4 Invoice Body ── */}
        <div ref={invoiceRef} style={{
          background: '#ffffff',
          direction: 'rtl',
          fontFamily: "'Cairo', sans-serif",
          width: '794px',
          minHeight: '1123px',
          margin: '0 auto',
          position: 'relative'
        }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          `}</style>

          {/* ── Header: Logo Center + Invoice number right ── */}
          <div style={{ padding: '28px 40px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Invoice number on right */}
            <div style={{ minWidth: 120, textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 900, color: '#6D28D9' }}>{invoiceNum}</div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>{isExpense ? 'رقم السند' : 'رقم الفاتورة'}</div>
            </div>
            {/* Academy name + single logo */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <img src={logoImg} alt="نادي نجد" style={{ width: 70, height: 70, objectFit: 'contain' }}/>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#1a1a2e', letterSpacing: '-0.3px', lineHeight: 1.2 }}>نادي نجد الرياض</div>
              <div style={{ fontSize: 12, color: '#777' }}>أكاديمية كرة القدم</div>
            </div>
            {/* Empty spacer to keep layout balanced */}
            <div style={{ minWidth: 120 }}></div>
          </div>

          {/* Divider */}
          <div style={{ margin: '18px 40px 0', height: 3, background: 'linear-gradient(90deg,#6D28D9,#A855F7,#FBBF24)' }}/>

          {/* ── Title Bar ── */}
          <div style={{ background: 'linear-gradient(135deg,#5B21B6,#7C3AED)', margin: '0 0 20px', padding: '12px 40px', textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
              {isExpense ? 'سند صرف مصروفات' : 'فاتورة مشترك'}
            </div>
          </div>

          {/* ── Details Block ── */}
          {isExpense ? (
            <div style={{ margin: '0 40px 18px', background: '#fffbeb', borderRadius: 10, padding: '18px 22px', border: '1px solid #fde68a' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>الغرض / البيان</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{payment.item}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>القائم بالصرف</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{payment.purchaser}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>تاريخ الصرف</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{payment.date ? (typeof payment.date === "string" ? payment.date.substring(0, 10) : getLocalDateString(payment.date)) : todayStr}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>الشهر المالي</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{payment.month}</div>
                </div>
                {((isExpense && parsedNote) || (!isExpense && payment.note)) && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>الملاحظات</div>
                    <div style={{ fontSize: 12, color: '#555' }}>{isExpense ? parsedNote : payment.note}</div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ margin: '0 40px 18px', background: '#f8f5ff', borderRadius: 10, padding: '18px 22px', border: '1px solid #e0d0ff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px 20px' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>اسم اللاعب</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{payment.playerName}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>الشهر</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1a1a2e' }}>{payment.month}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>تاريخ الإصدار</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{todayStr}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>المستلم</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>{payment.coachName || 'الإدارة'}</div>
                </div>
                {parent && (
                  <div>
                    <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>ولي الأمر</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{parent.name}</div>
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 10, color: '#999', marginBottom: 2 }}>المجموع</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#7C3AED' }}>{fmtMoney(totalAmount)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Items Table ── */}
          <div style={{ margin: '0 40px 18px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg,#5B21B6,#7C3AED)' }}>
                  {isExpense
                    ? ['#', 'البيان / الغرض', 'القائم بالصرف', 'المبلغ'].map(h => (
                        <th key={h} style={{
                          padding: '11px 14px',
                          textAlign: h === 'المبلغ' ? 'left' : 'right',
                          fontSize: 12, fontWeight: 800, color: '#fff'
                        }}>{h}</th>
                      ))
                    : ['#', 'البند', 'التفاصيل', 'المبلغ'].map(h => (
                        <th key={h} style={{
                          padding: '11px 14px',
                          textAlign: h === 'المبلغ' ? 'left' : 'right',
                          fontSize: 12, fontWeight: 800, color: '#fff'
                        }}>{h}</th>
                      ))
                  }
                </tr>
              </thead>
              <tbody>
                {isExpense ? (
                  items.map((it, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#fbf8ff', borderBottom: '1px solid #ede9f9' }}>
                      <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#666', width: 36 }}>{idx + 1}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{it.name}</td>
                      <td style={{ padding: '11px 14px', fontSize: 11, color: '#777' }}>الكمية: {it.qty} × {fmtMoney(it.price)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 900, color: '#7C3AED', textAlign: 'left' }}>{fmtMoney(it.qty * it.price)}</td>
                    </tr>
                  ))
                ) : (
                  relatedPayments.map((p, idx) => {
                    const pt = PAY_TYPES[p.type];
                    return (
                      <tr key={p.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fbf8ff', borderBottom: '1px solid #ede9f9' }}>
                        <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#666', width: 36 }}>{idx + 1}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#1a1a2e' }}>{pt?.icon} {pt?.label || p.type}</td>
                        <td style={{ padding: '11px 14px', fontSize: 11, color: '#777' }}>{p.month}{p.note ? ` — ${p.note}` : ''}</td>
                        <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 900, color: '#7C3AED', textAlign: 'left' }}>{fmtMoney(p.amount)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Total Bar ── */}
          <div style={{ margin: '0 40px 18px', background: 'linear-gradient(135deg,#5B21B6,#7C3AED)', borderRadius: 10, padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#E9D5FF', fontSize: 14, fontWeight: 800 }}>
              {isExpense ? 'إجمالي قيمة المصروفات' : 'إجمالي مبلغ الاشتراك المستحق'}
            </div>
            <div style={{ color: '#FBBF24', fontSize: 20, fontWeight: 900 }}>{fmtMoney(totalAmount)}</div>
          </div>

          {/* ── Terms / Authorization ── */}
          {isExpense ? (
            <div style={{ margin: '0 40px 18px', background: '#F9FAFB', borderRadius: 10, padding: '16px 22px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>✍️ اعتماد الصرف</div>
                <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4 }}>تمت هذه العملية بقرار واعتماد الإدارة المالية لنادي نجد الرياض.</div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#10B981' }}>✓ معتمد ومسجل مالياً</div>
            </div>
          ) : (
            <div style={{ margin: '0 40px 18px', background: '#FFFBEB', borderRadius: 10, padding: '16px 22px', border: '1px solid #FDE68A' }}>
              <div style={{ color: '#D97706', fontWeight: 800, fontSize: 12, marginBottom: 10 }}>📋 الشروط والأحكام</div>
              <ol style={{ paddingRight: 16, margin: 0 }}>
                {TERMS.map((term, i) => (
                  <li key={i} style={{ fontSize: 10.5, color: '#374151', lineHeight: '1.75', marginBottom: 3 }}>{term}</li>
                ))}
              </ol>
            </div>
          )}

          {/* ── Parent Login Credentials ── */}
          {!isExpense && parent && (parent.email || parent.password) && (
            <div style={{ margin: '0 40px 18px', background: '#EFF6FF', borderRadius: 10, padding: '16px 22px', border: '1px solid #BFDBFE' }}>
              <div style={{ color: '#1D4ED8', fontWeight: 800, fontSize: 12, marginBottom: 10 }}>🔐 بيانات دخول ولي الأمر — بوابة الأكاديمية</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px' }}>
                <div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>البريد الإلكتروني</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', direction: 'ltr', textAlign: 'right' }}>{parent.email || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 2 }}>كلمة المرور</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', direction: 'ltr', textAlign: 'right', letterSpacing: 0.5 }}>{(parent.password && parent.password !== '••••••••' && !parent.password.includes(':') && parent.password.length <= 20) ? parent.password : `najd_${(parent.phone || '').replace(/\D/g, '').slice(-4) || '0000'}`}</div>
                </div>
              </div>
              <div style={{ marginTop: 10 }}>
                <a href={ACADEMY_WEBSITE} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'linear-gradient(135deg,#1D4ED8,#3B82F6)',
                  color: '#fff', textDecoration: 'none',
                  padding: '8px 18px', borderRadius: 8,
                  fontSize: 12, fontWeight: 800
                }}>🔐 التوجه إلى لوحة تحكم ولي الأمر</a>
              </div>
            </div>
          )}

          {/* ── Signature + QR ── */}
          <div style={{ margin: '0 40px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '2px dashed #ddd', paddingTop: 20 }}>
            {isExpense ? (
              <>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>توقيع المستلم</div>
                  <div style={{ width: 180, borderBottom: '1.5px solid #555', marginBottom: 6 }}></div>
                  <div style={{ fontSize: 10, color: '#999' }}>{payment.purchaser}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>المدير المالي والختم</div>
                  <div style={{ width: 180, borderBottom: '1.5px solid #555', marginBottom: 6 }}></div>
                  <div style={{ fontSize: 10, color: '#999' }}>نادي نجد الرياض</div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>توقيع ولي الأمر</div>
                  <div style={{ width: 200, borderBottom: '1.5px solid #555', marginBottom: 6 }}></div>
                  <div style={{ fontSize: 10, color: '#999' }}>الاسم والتوقيع</div>
                </div>
                {/* QR Code */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    crossOrigin="anonymous"
                    style={{ width: 100, height: 100, borderRadius: 8, border: '2px solid #6D28D9' }}
                  />
                  <div style={{ fontSize: 9.5, color: '#888', textAlign: 'center' }}>امسح للوصول للموقع</div>
                  <div style={{ fontSize: 9, color: '#6D28D9', fontWeight: 700, direction: 'ltr' }}>{ACADEMY_WEBSITE}</div>
                </div>
              </>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ borderTop: '1px solid #eee', padding: '12px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 10, color: '#bbb' }}>تم إنشاء هذا السند إلكترونياً</div>
            <div style={{ fontSize: 10, color: '#888', fontWeight: 600 }}>نادي نجد الرياض · الإدارة المالية</div>
            <img src={logoImg} alt="" style={{ width: 28, height: 28, objectFit: 'contain', opacity: 0.4 }}/>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminPayments({ payments, setPayments, players, coaches, parents, prices, t, expenses, setExpenses }) {
  const [subTab, setSubTab] = useState("payments"); // "payments" or "expenses"
  const [modal, setModal] = useState(false); // payments modal
  const [expModal, setExpModal] = useState(false); // expenses modal
  const [invoicePay, setInvoicePay] = useState(null);
  const [fc, setFc] = useState("الكل");
  const [ft, setFt] = useState("الكل");
  const [fe, setFe] = useState("الكل"); // expense month filter
  
  const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"].map(m => `${m} 2026`);
  
  const empty = { playerId: players[0]?.id || "", coachId: coaches[0]?.id || "none", types: ["subscription"], note: "", date: getLocalDateString(new Date()) };
  const [form, setForm] = useState(empty);
  
  const emptyExpense = { item: "", amount: "", purchaser: "", date: getLocalDateString(new Date()), month: CUR_MONTH, note: "" };
  const [expForm, setExpForm] = useState(emptyExpense);

  const filtered = payments.filter(p => (fc === "الكل" || p.coachId === fc) && (ft === "الكل" || p.type === ft));
  const filteredExpenses = (expenses || []).filter(e => fe === "الكل" || e.month === fe);

  const toggleType = (type) => {
    setForm(f => {
      const types = f.types.includes(type) 
        ? (f.types.length > 1 ? f.types.filter(t => t !== type) : f.types)
        : [...f.types, type];
      return { ...f, types };
    });
  };

  const save = () => {
    const player = players.find(p => p.id === form.playerId);
    const coach  = coaches.find(c => c.id === form.coachId);
    
    if (form.id) {
      // Edit payment
      const updated = {
        id: form.id,
        playerId: form.playerId,
        playerName: player?.name || "",
        coachId: form.coachId,
        coachName: coach?.name || (form.coachId === "none" ? "الإدارة" : ""),
        type: form.type || form.types[0],
        amount: parseFloat(form.amount) || prices[form.type] || PRICE_LIST[form.type] || 0,
        month: getMonthFromDate(form.date),
        date: form.date,
        note: form.note
      };
      setPayments(ps => ps.map(x => x.id === form.id ? updated : x));
    } else {
      // Add payment
      const newPayments = form.types.map(type => ({
        id: `pay${Date.now()}-${type}`,
        playerId: form.playerId,
        playerName: player?.name || "",
        coachId: form.coachId,
        coachName: coach?.name || (form.coachId === "none" ? "الإدارة" : ""),
        type: type,
        amount: prices[type] || PRICE_LIST[type] || 0,
        month: getMonthFromDate(form.date),
        date: form.date,
        note: form.note
      }));
      setPayments(ps => [...ps, ...newPayments]);
    }
    setModal(false);
  };

  const deletePayment = (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه الدفعة نهائياً؟")) return;
    setPayments(ps => ps.filter(x => x.id !== id));
  };

  const saveExpense = () => {
    if (!expForm.item.trim() || !expForm.purchaser.trim()) {
      alert("الرجاء تعبئة الحقول الأساسية: البيان العام والقائم بالصرف.");
      return;
    }
    const validItems = (expForm.items || []).filter(it => it.name.trim() !== "");
    if (validItems.length === 0) {
      alert("الرجاء إضافة بند تفصيلي واحد على الأقل للمصروف.");
      return;
    }

    const calculatedAmount = validItems.reduce((sum, it) => sum + (parseInt(it.qty) || 0) * (parseFloat(it.price) || 0), 0);
    const serializedNote = JSON.stringify({
      items: validItems,
      note: (expForm.note || "").trim()
    });

    const isEdit = !!expForm.id;
    const itemData = {
      id: isEdit ? expForm.id : `exp-${Date.now()}`,
      item: expForm.item.trim(),
      amount: calculatedAmount,
      purchaser: expForm.purchaser.trim(),
      date: expForm.date,
      month: expForm.month,
      note: serializedNote
    };

    setExpenses(prev => {
      if (isEdit) {
        return prev.map(x => x.id === itemData.id ? itemData : x);
      } else {
        return [...prev, itemData];
      }
    });
    setExpModal(false);
  };

  const deleteExpense = (id) => {
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذا المصروف نهائياً؟")) return;
    setExpenses(prev => prev.filter(x => x.id !== id));
  };

  const totalAmount = form.types ? form.types.reduce((sum, type) => sum + (prices[type] || PRICE_LIST[type] || 0), 0) : form.amount;

  return (
    <div>
      {/* ── Sub Tabs ── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18, borderBottom: `1px solid ${t.border}`, paddingBottom: 10 }}>
        <button onClick={() => setSubTab("payments")}
          style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: subTab === "payments" ? "rgba(124,73,168,.12)" : "transparent", color: subTab === "payments" ? "#C4B5FD" : t.textDim, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Cairo',sans-serif" }}>
          💰 إيرادات الاشتراكات
        </button>
        <button onClick={() => setSubTab("expenses")}
          style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: subTab === "expenses" ? "rgba(239,68,68,.12)" : "transparent", color: subTab === "expenses" ? "#FCA5A5" : t.textDim, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Cairo',sans-serif" }}>
          💸 مصروفات الأكاديمية
        </button>
      </div>

      {subTab === "payments" ? (
        <>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {["الكل", ...coaches.map(c => c.id)].map(id => (
                <button key={id} onClick={() => setFc(id)} style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid", borderColor: fc === id ? "#7C49A8" : t.border, background: fc === id ? "rgba(124,73,168,.12)" : t.bg2, color: fc === id ? "#C4B5FD" : t.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  {id === "الكل" ? "الكل" : coaches.find(c => c.id === id)?.name.split(" ")[0]}
                </button>
              ))}
              {Object.entries(PAY_TYPES).map(([k, v]) => (
                <button key={k} onClick={() => setFt(k === ft ? "الكل" : k)} style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid", borderColor: ft === k ? v.color : t.border, background: ft === k ? `${v.color}18` : t.bg2, color: ft === k ? v.color : t.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
            <Btn onClick={() => { 
              if (players.length === 0) {
                alert("الرجاء إضافة لاعب واحد على الأقل أولاً لتتمكن من تسجيل المدفوعات.");
                return;
              }
              setForm({ ...empty, playerId: players[0].id, coachId: coaches[0]?.id || "none" }); 
              setModal(true); 
            }}>
              <AnimIcon type="plus" size={14} color="#fff"/> تسجيل دفعة
            </Btn>
          </div>

          <Card t={t} style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
                  {["اللاعب", "النوع", "الشهر", "المبلغ", "المستلم", "التاريخ", "ملاحظة", "العمليات"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice().reverse().map(p => {
                  const pt = PAY_TYPES[p.type];
                  return (
                    <tr key={p.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s" }}>
                      <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: t.text }}>{p.playerName}</td>
                      <td style={{ padding: "11px 14px" }}><Chip text={pt ? `${pt.icon} ${pt.label}` : p.type} color={pt?.color || "#7C49A8"}/></td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: t.textDim }}>{p.month}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 800, color: pt?.color || "#10B981" }}>{fmtMoney(p.amount)}</td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>{p.coachName || "الإدارة"}</td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{p.date ? (typeof p.date === "string" ? p.date.substring(0, 10) : getLocalDateString(p.date)) : ""}</td>
                      <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{p.note || "—"}</td>
                      <td style={{ padding: "8px 14px" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <button
                            onClick={() => setInvoicePay(p)}
                            title="الفاتورة"
                            style={{
                              padding: "4px 8px", borderRadius: 6, border: "1px solid #7C3AED",
                              background: "rgba(124,58,237,0.1)", color: "#A78BFA",
                              fontSize: 10, fontWeight: 700, cursor: "pointer",
                              fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 3
                            }}
                          >
                            🧾 فاتورة
                          </button>
                          <button
                            onClick={() => {
                              setForm({ ...p, types: [p.type] });
                              setModal(true);
                            }}
                            title="تعديل"
                            style={{
                              width: 26, height: 26, borderRadius: 7, border: "none",
                              background: "rgba(245,158,11,.1)", color: "#F59E0B",
                              cursor: "pointer", display: "grid", placeItems: "center"
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deletePayment(p.id)}
                            title="حذف"
                            style={{
                              width: 26, height: 26, borderRadius: 7, border: "none",
                              background: "rgba(239,68,68,.1)", color: "#EF4444",
                              cursor: "pointer", display: "grid", placeItems: "center"
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: t.textFaint }}>لا توجد مدفوعات مسجلة تطابق التصفية.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {["الكل", ...MONTHS].map(m => (
                <button key={m} onClick={() => setFe(m)} style={{ padding: "7px 13px", borderRadius: 8, border: "1px solid", borderColor: fe === m ? "#EF4444" : t.border, background: fe === m ? "rgba(239,68,68,.12)" : t.bg2, color: fe === m ? "#FCA5A5" : t.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                  {m}
                </button>
              ))}
            </div>
            <Btn onClick={() => {
              setExpForm({ ...emptyExpense, items: [{ name: "", qty: 1, price: "" }] });
              setExpModal(true);
            }} style={{ background: "#EF4444", color: "#fff" }}>
              <AnimIcon type="plus" size={14} color="#fff"/> تسجيل مصروف
            </Btn>
          </div>

          <Card t={t} style={{ overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
                  {["الغرض", "القيمة", "القائم بالصرف", "الشهر المالي", "التاريخ", "ملاحظة", "العمليات"].map(h => (
                    <th key={h} style={{ padding: "12px 14px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.slice().reverse().map(e => (
                  <tr key={e.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s" }}>
                    <td style={{ padding: "11px 14px", fontSize: 12, fontWeight: 600, color: t.text }}>{e.item}</td>
                    <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 800, color: "#EF4444" }}>{fmtMoney(e.amount)}</td>
                    <td style={{ padding: "11px 14px", fontSize: 12, color: t.text }}>{e.purchaser}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{e.month}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{e.date ? (typeof e.date === "string" ? e.date.substring(0, 10) : getLocalDateString(e.date)) : ""}</td>
                    <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{parseExpenseNote(e).note || "—"}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          onClick={() => setInvoicePay(e)}
                          title="سند صرف"
                          style={{
                            padding: "4px 8px", borderRadius: 6, border: "1px solid #EF4444",
                            background: "rgba(239,68,68,0.1)", color: "#FCA5A5",
                            fontSize: 10, fontWeight: 700, cursor: "pointer",
                            fontFamily: "'Cairo',sans-serif", display: "flex", alignItems: "center", gap: 3
                          }}
                        >
                          🧾 سند صرف
                        </button>
                        <button
                          onClick={() => {
                            const parsed = parseExpenseNote(e);
                            setExpForm({
                              ...e,
                              items: parsed.items,
                              note: parsed.note
                            });
                            setExpModal(true);
                          }}
                          title="تعديل"
                          style={{
                            width: 26, height: 26, borderRadius: 7, border: "none",
                            background: "rgba(245,158,11,.1)", color: "#F59E0B",
                            cursor: "pointer", display: "grid", placeItems: "center"
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => deleteExpense(e.id)}
                          title="حذف"
                          style={{
                            width: 26, height: 26, borderRadius: 7, border: "none",
                            background: "rgba(239,68,68,.1)", color: "#EF4444",
                            cursor: "pointer", display: "grid", placeItems: "center"
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: t.textFaint }}>لا توجد مصروفات مسجلة.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {/* ── Payments Modal ── */}
      {modal && (
        <Modal title={form.id ? "تعديل دفعة" : "تسجيل دفعة جديدة للطلاب"} onClose={() => setModal(false)} t={t}>
          {!form.id && (
            <div style={{ flex: "1 1 100%" }}>
              <Input label="اللاعب المشترك" value={form.playerId} onChange={v => setForm(f => ({ ...f, playerId: v }))} options={players.map(p => ({ v: p.id, l: p.name }))} t={t}/>
            </div>
          )}
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Input label="استلمها (المدرب المستلم)" value={form.coachId} onChange={v => setForm(f => ({ ...f, coachId: v }))} options={[{ v: "none", l: "🏛️ الإدارة" }, ...coaches.map(c => ({ v: c.id, l: c.name }))]} t={t}/>
            {form.id ? (
              <Input label="النوع" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={Object.entries(PAY_TYPES).map(([k,v]) => ({ v: k, l: v.label }))} t={t}/>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: t.textDim }}>الرسوم والخدمات المطلوبة</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {Object.entries(PAY_TYPES).map(([k, v]) => {
                    const has = form.types.includes(k);
                    return (
                      <button key={k} onClick={() => toggleType(k)}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid", borderColor: has ? v.color : t.border, background: has ? `${v.color}15` : t.bg2, color: has ? v.color : t.textDim, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                        {v.icon} {v.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <Input label="التاريخ" value={form.date ? (typeof form.date === "string" ? form.date.substring(0, 10) : getLocalDateString(form.date)) : ""} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          
          {form.id && (
            <Input label="المبلغ (ريال)" value={form.amount} onChange={v => setForm(f => ({ ...f, amount: v }))} type="number" t={t}/>
          )}
          
          <Input label="ملاحظة" value={form.note || ""} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="أدخل أي ملاحظات إضافية هنا..." t={t}/>
          
          {!form.id && (
            <div style={{ background: t.bg, borderRadius: 12, padding: "14px", marginBottom: 18, border: `1px dashed ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.textDim, marginBottom: 4 }}>إجمالي المبلغ المستحق:</div>
              <div style={{ color: "#10B981", fontWeight: 900, fontSize: 20 }}>{fmtMoney(totalAmount)}</div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                {form.types.map(ty => <Chip key={ty} text={PAY_TYPES[ty]?.label} color={PAY_TYPES[ty]?.color} size={9}/>)}
              </div>
            </div>
          )}
          
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={save} style={{ flex: 1 }}>💾 حفظ البيانات</Btn>
            <Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* ── Expenses Modal ── */}
      {expModal && (
        <Modal title={expForm.id ? "تعديل المصروف" : "تسجيل مصروف جديد للأكاديمية"} onClose={() => setExpModal(false)} t={t}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
            <Input label="البيان العام للمصروف" value={expForm.item} onChange={v => setExpForm(f => ({ ...f, item: v }))} placeholder="البيان العام (مثال: أدوات رياضية ومياه)" t={t}/>
            <Input label="من اللي جابه (القائم بالصرف)" value={expForm.purchaser} onChange={v => setExpForm(f => ({ ...f, purchaser: v }))} placeholder="اسم الشخص" t={t}/>
          </div>

          <div style={{ marginTop: 12, marginBottom: 12, borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>📋 البنود التفصيلية للمصروف:</span>
              <button 
                type="button"
                onClick={() => setExpForm(f => ({ ...f, items: [...(f.items || []), { name: "", qty: 1, price: "" }] }))}
                style={{ padding: "4px 8px", background: "rgba(16,185,129,0.12)", color: "#10B981", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}
              >
                ➕ إضافة بند
              </button>
            </div>
            
            {((expForm.items && expForm.items.length > 0) ? expForm.items : [{ name: "", qty: 1, price: "" }]).map((it, idx) => (
              <div key={idx} style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1.2fr 35px", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <input 
                  type="text" 
                  value={it.name} 
                  placeholder="اسم البند (مثل: كرتون مياه)" 
                  onChange={v => {
                    const next = [...(expForm.items || [])];
                    next[idx].name = v.target.value;
                    setExpForm(f => ({ ...f, items: next }));
                  }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, fontFamily: "'Cairo',sans-serif" }}
                />
                <input 
                  type="number" 
                  dir="ltr"
                  inputMode="decimal"
                  value={it.qty} 
                  placeholder="الكمية" 
                  onChange={v => {
                    const next = [...(expForm.items || [])];
                    next[idx].qty = parseInt(v.target.value) || 0;
                    setExpForm(f => ({ ...f, items: next }));
                  }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, fontFamily: "'Cairo',sans-serif", textAlign: "right" }}
                />
                <input 
                  type="number" 
                  dir="ltr"
                  inputMode="decimal"
                  value={it.price} 
                  placeholder="سعر الوحدة" 
                  onChange={v => {
                    const next = [...(expForm.items || [])];
                    next[idx].price = parseFloat(v.target.value) || 0;
                    setExpForm(f => ({ ...f, items: next }));
                  }}
                  style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${t.border}`, background: t.bg2, color: t.text, fontSize: 12, fontFamily: "'Cairo',sans-serif", textAlign: "right" }}
                />
                <button 
                  type="button"
                  disabled={(expForm.items || []).length <= 1}
                  onClick={() => {
                    const next = (expForm.items || []).filter((_, i) => i !== idx);
                    setExpForm(f => ({ ...f, items: next }));
                  }}
                  style={{ height: 32, display: "grid", placeItems: "center", background: "rgba(239,68,68,0.12)", color: "#EF4444", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>

          <div style={{ background: t.bg, borderRadius: 12, padding: "14px", marginBottom: 12, border: `1px dashed ${t.border}` }}>
            <div style={{ fontSize: 11, color: t.textDim, marginBottom: 4 }}>إجمالي مبلغ المصروف:</div>
            <div style={{ color: "#EF4444", fontWeight: 900, fontSize: 20 }}>
              {fmtMoney(
                ((expForm.items && expForm.items.length > 0) ? expForm.items : [])
                  .reduce((sum, it) => sum + (parseInt(it.qty) || 0) * (parseFloat(it.price) || 0), 0)
              )}
            </div>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="الشهر المالي" value={expForm.month} onChange={v => setExpForm(f => ({ ...f, month: v }))} options={MONTHS} t={t}/>
            <Input label="التاريخ" value={expForm.date ? (typeof expForm.date === "string" ? expForm.date.substring(0, 10) : getLocalDateString(expForm.date)) : ""} onChange={v => setExpForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          </div>
          
          <Input label="ملاحظات" value={expForm.note || ""} onChange={v => setExpForm(f => ({ ...f, note: v }))} placeholder="أدخل أي ملاحظات إضافية هنا..." t={t}/>
          
          <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
            <Btn onClick={saveExpense} style={{ flex: 1, background: "#EF4444", color: "#fff" }}>💾 حفظ المصروف</Btn>
            <Btn variant="secondary" onClick={() => setExpModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}

      {/* ── Invoice Modal ── */}
      {invoicePay && (
        <InvoiceModal
          payment={invoicePay}
          allPayments={payments}
          players={players}
          parents={parents}
          onClose={() => setInvoicePay(null)}
        />
      )}
    </div>
  );
}
function AdminPrices({ prices, setPrices, t }) {
  const [form, setForm] = useState({ ...prices });
  const [saved, setSaved] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDatabase = async () => {
    const confirm1 = window.confirm("⚠️ تحذير هام جداً:\n\nهل أنت متأكد من رغبتك في حذف كافة بيانات النظام بالكامل؟\nسيتم حذف جميع اللاعبين، الفرق، المدربين، الحضور، والمدفوعات بشكل نهائي.");
    if (!confirm1) return;

    const confirm2 = window.confirm("⚠️ تأكيد أخير:\n\nلا يمكن التراجع عن هذا الإجراء أبداً. هل تريد المتابعة وتصفير النظام للتشغيل الرسمي؟");
    if (!confirm2) return;

    setIsResetting(true);
    try {
      const res = await fetch(`${API_URL}/api/reset-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: "NajdLaunch2026" })
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        alert("✅ تم إعادة تهيئة النظام وتصفير البيانات بنجاح!");
        // Clear all cached local data keys to prevent dirty sync
        localStorage.removeItem('najd_players');
        localStorage.removeItem('najd_coaches');
        localStorage.removeItem('najd_groups');
        localStorage.removeItem('najd_parents');
        localStorage.removeItem('najd_payments');
        localStorage.removeItem('najd_attendance');
        localStorage.removeItem('najd_coachesAttendance');
        localStorage.removeItem('najd_evals');
        localStorage.removeItem('najd_messages');
        localStorage.removeItem('najd_trainings');
        
        // Reload to fetch clean database state
        window.location.reload();
      } else {
        alert("❌ فشلت عملية إعادة التهيئة: " + (data.message || "خطأ غير معروف"));
      }
    } catch (e) {
      console.error(e);
      alert("❌ حدث خطأ أثناء الاتصال بالخادم لإعادة التهيئة.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
      <div style={{ flex: "1 1 420px", maxWidth: 460 }}>
        <Card t={t} style={{ padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <AnimIcon type="prices" size={18} color="#D8A435"/>
            <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>تسعيرة الأكاديمية</div>
          </div>
          {Object.entries(PAY_TYPES).map(([k, v]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 22 }}>{v.icon}</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{v.label}</div><div style={{ fontSize: 11, color: t.textDim }}>السعر الحالي: {fmtMoney(prices[k])}</div></div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input type="number" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: +e.target.value }))}
                  style={{ width: 90, background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 8, padding: "7px 10px", color: v.color, fontSize: 14, fontWeight: 700, outline: "none", textAlign: "center", fontFamily: "'Cairo',sans-serif" }}/>
                <span style={{ fontSize: 12, color: t.textDim }}>ر.س</span>
              </div>
            </div>
          ))}
          <button onClick={() => { setPrices({ ...form }); setSaved(true); setTimeout(() => setSaved(false), 2200); }}
            style={{ width: "100%", marginTop: 20, background: saved ? "linear-gradient(135deg,#10B981,#065F46)" : "linear-gradient(135deg,#7C49A8,#5A2D82)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .3s", fontFamily: "'Cairo',sans-serif" }}>
            {saved ? "✅ تم الحفظ!" : "💾 حفظ الأسعار"}
          </button>
        </Card>
      </div>

      <div style={{ flex: "1 1 420px", maxWidth: 460 }}>
        <Card t={t} style={{ padding: 28, border: `1px solid rgba(239, 68, 68, 0.15)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#EF4444" }}>منطقة الخطورة - إدارة البيانات</div>
          </div>
          
          <div style={{ fontSize: 13, color: t.text, fontWeight: 600, marginBottom: 8 }}>إعادة تهيئة النظام وتصفير البيانات</div>
          <div style={{ fontSize: 11, color: t.textDim, lineHeight: "1.6", marginBottom: 20 }}>
            هذا الإجراء يقوم بحذف كافة البيانات التجريبية والمدخلة في النظام (اللاعبين، الفرق، المدربين، التحضير، والمدفوعات) لإعداد النظام للتشغيل الرسمي الفعلي.
            <br />
            <span style={{ color: "#EF4444", fontWeight: 700 }}>تحذير:</span> لا يمكن استرجاع البيانات بعد حذفها. سيتم الاحتفاظ بحساب الإدارة فقط.
          </div>
          
          <button onClick={handleResetDatabase} disabled={isResetting}
            style={{ width: "100%", background: isResetting ? "rgba(239, 68, 68, 0.4)" : "linear-gradient(135deg,#EF4444,#B91C1C)", color: "#fff", border: "none", borderRadius: 10, padding: 13, fontSize: 14, fontWeight: 700, cursor: isResetting ? "not-allowed" : "pointer", transition: "all .3s", fontFamily: "'Cairo',sans-serif" }}>
            {isResetting ? "🔄 جاري إعادة تهيئة النظام..." : "🗑️ إعادة تهيئة النظام وتصفير البيانات"}
          </button>
        </Card>
      </div>
    </div>
  );
}

function AdminTrainings({ trainings, setTrainings, groups, coaches, t }) {
  const [modal, setModal] = useState(false);
  const empty = { 
    groupId: groups[0]?.id || "", 
    coachId: groups[0]?.coachId || coaches[0]?.id || "", 
    days: [], 
    time: "4:00 م", 
    duration: 90, 
    field: "ملعب A", 
    title: "", 
    trainingFocus: "", 
    note: "",
    isRecurring: true,
    date: "",
    type: "training",
    isFriendly: false
  };
  const [form, setForm] = useState(empty);
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const save = () => {
    if (!form.groupId) {
      alert("الرجاء اختيار مجموعة");
      return;
    }
    if (!form.coachId) {
      alert("الرجاء اختيار مدرب");
      return;
    }
    if (!form.isRecurring && !form.date) {
      alert("الرجاء تحديد تاريخ الموعد لمرة واحدة");
      return;
    }
    if (form.isRecurring && form.days.length === 0) {
      alert("الرجاء تحديد يوم واحد على الأقل للموعد المتكرر");
      return;
    }
    setTrainings(ts => [...ts, { ...form, id: `tr${Date.now()}` }]);
    setModal(false);
  };

  const handleGroupChange = (gid) => {
    const group = groups.find(g => g.id === gid);
    setForm(f => ({ ...f, groupId: gid, coachId: group?.coachId || coaches[0]?.id || "" }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: t.text }}>📅 جدول التمارين والمباريات</div>
        <Btn onClick={() => { setForm({ ...empty }); setModal(true); }}>
          <AnimIcon type="plus" size={14} color="#fff"/> إضافة فعالية
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {trainings.slice().reverse().map(tr => {
          const group = groups.find(g => g.id === tr.groupId);
          const coach = coaches.find(c => c.id === tr.coachId);
          const typeLabel = tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة رسمية") : "تمرين";
          const typeColor = tr.type === "match" ? "#EF4444" : "#06B6D4";
          return (
            <Card key={tr.id} t={t} style={{ padding: 20, borderLeft: `4px solid ${group?.color || t.purple}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Chip text={group?.name} color={group?.color}/>
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <Chip text={typeLabel} color={typeColor} size={9}/>
                  {tr.isRecurring ? (
                    tr.days?.map(d => <Chip key={d} text={d} color={t.textDim} size={9}/>)
                  ) : (
                    <span style={{ fontSize: 11, color: t.textDim, fontWeight: 700 }}>
                      📅 {tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { day: 'numeric', month: 'short' }) : "مرة واحدة"}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 8 }}>{tr.title || (tr.type === "match" ? "مباراة" : "تمرين")}</div>
              <div style={{ display: "flex", gap: 15, fontSize: 12, color: t.textDim, flexWrap: "wrap" }}>
                <span>⏰ {tr.time} ({tr.duration} دق)</span>
                <span>🏟 {tr.field}</span>
                <span>👤 {coach?.name}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: "#06B6D4", fontWeight: 700 }}>🎯 {tr.trainingFocus || "مهارات عامة"}</div>
              {tr.note && <div style={{ marginTop: 10, fontSize: 11, color: t.textFaint, fontStyle: "italic" }}>* {tr.note}</div>}
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                <Btn small variant="ghost" onClick={() => setTrainings(ts => ts.filter(x => x.id !== tr.id))}><AnimIcon type="trash" size={12} color="#EF4444"/> حذف</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      {modal && (
        <Modal title="إضافة موعد فعالية" onClose={() => setModal(false)} t={t}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="نوع الفعالية" value={form.type} onChange={v => setForm(f => ({ ...f, type: v, isFriendly: v === "match" ? f.isFriendly : false }))} options={[{ v: "training", l: "تمرين" }, { v: "match", l: "مباراة" }]} t={t}/>
            <Input label="طريقة التكرار" value={form.isRecurring ? "recurring" : "once"} onChange={v => setForm(f => ({ ...f, isRecurring: v === "recurring" }))} options={[{ v: "recurring", l: "متكرر أسبوعياً" }, { v: "once", l: "مرة واحدة" }]} t={t}/>
          </div>

          {form.type === "match" && (
            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" id="isFriendly" checked={form.isFriendly} onChange={e => setForm(f => ({ ...f, isFriendly: e.target.checked }))} style={{ width: 16, height: 16, accentColor: t.purple, cursor: "pointer" }} />
              <label htmlFor="isFriendly" style={{ fontSize: 12, color: t.text, fontWeight: 700, cursor: "pointer" }}>مباراة ودية</label>
            </div>
          )}

          <Input label="المجموعة / الفريق" value={form.groupId} onChange={handleGroupChange} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/>
          <Input label="المدرب المسؤول" value={form.coachId} onChange={v => setForm(f => ({ ...f, coachId: v }))} options={coaches.map(c => ({ v: c.id, l: c.name }))} t={t}/>
          <Input label="العنوان / الاسم" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="مثال: مباراة ودية ضد نادي النصر" t={t}/>
          
          {form.isRecurring ? (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: t.textDim, fontWeight: 600, display: "block", marginBottom: 8 }}>أيام التدريب</label>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                {DAYS.map(d => (
                  <button key={d} onClick={() => setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }))}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid", borderColor: form.days.includes(d) ? t.purple : t.border2, background: form.days.includes(d) ? `${t.purple}18` : t.inputBg, color: form.days.includes(d) ? t.purple : t.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Cairo',sans-serif" }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Input label="التاريخ" value={form.date || ""} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="الوقت" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} placeholder="مثال: 4:00 م" t={t}/>
            <Input label="المدة (دقيقة)" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: +v }))} type="number" t={t}/>
          </div>
          <Input label="الملعب" value={form.field} onChange={v => setForm(f => ({ ...f, field: v }))} t={t}/>
          <Input label="التركيز الفني / المهارات" value={form.trainingFocus} onChange={v => setForm(f => ({ ...f, trainingFocus: v }))} placeholder="مثال: التمركز والدفاع" t={t}/>
          <Input label="ملاحظات" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="أدخل أي ملاحظات إضافية هنا..." t={t}/>
          
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Btn onClick={save} style={{ flex: 1 }}>💾 حفظ الفعالية</Btn>
            <Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN REPORTS — Excel Export (Monthly & Annual)
══════════════════════════════════════════════════════════ */
function AdminReports({ players, coaches, groups, payments, attendance, evals, t, trainings }) {
  const [reportType, setReportType] = useState("monthly");
  const [selMonth, setSelMonth] = useState(CUR_MONTH);
  const [selYear, setSelYear] = useState(new Date().getFullYear().toString());
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState(null);

  const MONTHS_LIST = AR_MONTHS.map(m => `${m} ${selYear}`);
  const YEARS_LIST = ["2024", "2025", "2026", "2027"];

  const filterPayments = () => {
    if (reportType === "monthly") {
      return payments.filter(p => p.month === selMonth);
    } else {
      return payments.filter(p => p.month?.includes(selYear));
    }
  };

  const filterAttendance = () => {
    if (reportType === "monthly") {
      const [mName, y] = selMonth.split(" ");
      const mIdx = AR_MONTHS.indexOf(mName);
      return attendance.filter(a => {
        const d = new Date(a.date);
        return d.getMonth() === mIdx && d.getFullYear() === parseInt(y);
      });
    } else {
      return attendance.filter(a => {
        const d = new Date(a.date);
        return d.getFullYear() === parseInt(selYear);
      });
    }
  };

  const exportExcel = () => {
    setExporting(true);
    setTimeout(() => {
      try {
        const wb = XLSX.utils.book_new();
        const periodLabel = reportType === "monthly" ? selMonth : `سنة ${selYear}`;

        // Sheet 1: Players
        const playersData = players.map(p => {
          const g = groups.find(x => x.id === p.groupId);
          const coach = coaches.find(c => c.groupId === p.groupId);
          const playerPayments = filterPayments().filter(pay => pay.playerId === p.id);
          const totalPaid = playerPayments.reduce((sum, pay) => sum + pay.amount, 0);
          const hasSub = playerPayments.some(pay => pay.type === "subscription");
          return {
            "الاسم": p.name,
            "العمر": p.age,
            "المركز": p.position || "—",
            "المجموعة": g?.name || "—",
            "المدرب": coach?.name || "—",
            "الحالة": (() => {
              if (p.status === "موقوف") return "موقوف";
              if (p.status === "مجمّد") return "مجمّد";
              const sd = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
              return (sd.isUnpaid || sd.isExpired) ? "غير نشط" : "نشط";
            })(),
            "التقييم": p.score || 0,
            "نسبة الحضور": `${p.attendancePct || 0}%`,
            "الأهداف": p.goals || 0,
            "التمريرات الحاسمة": p.assists || 0,
            "إجمالي المدفوعات": totalPaid,
            "حالة الاشتراك": hasSub ? "مدفوع ✅" : "غير مدفوع ❌",
            "تاريخ الانضمام": p.joinDate || "—",
            "الهاتف": p.phone || "—",
          };
        });
        const wsPlayers = XLSX.utils.json_to_sheet(playersData);
        wsPlayers["!cols"] = Object.keys(playersData[0] || {}).map(() => ({ wch: 18 }));
        XLSX.utils.book_append_sheet(wb, wsPlayers, "اللاعبون");

        // Sheet 2: Payments
        const fPay = filterPayments();
        const paymentsData = fPay.map(p => ({
          "اللاعب": p.playerName || "—",
          "النوع": PAY_TYPES[p.type]?.label || p.type,
          "المبلغ": p.amount,
          "الشهر": p.month,
          "التاريخ": p.date || "—",
          "المستلم": p.coachName || "الإدارة",
          "ملاحظة": p.note || "—",
        }));
        if (paymentsData.length > 0) {
          const totalRow = { "اللاعب": "الإجمالي", "النوع": "", "المبلغ": fPay.reduce((s, p) => s + p.amount, 0), "الشهر": "", "التاريخ": "", "المستلم": "", "ملاحظة": "" };
          paymentsData.push(totalRow);
        }
        const wsPayments = XLSX.utils.json_to_sheet(paymentsData);
        wsPayments["!cols"] = Object.keys(paymentsData[0] || {}).map(() => ({ wch: 18 }));
        XLSX.utils.book_append_sheet(wb, wsPayments, "المدفوعات");

        // Sheet 3: Attendance Summary
        const fAtt = filterAttendance();
        const attSummary = players.map(p => {
          let present = 0, absent = 0, excused = 0;
          fAtt.forEach(a => {
            if (a.records?.[p.id] === "حاضر") present++;
            if (a.records?.[p.id] === "غائب") absent++;
            if (a.records?.[p.id] === "بعذر") excused++;
          });
          const total = present + absent + excused;
          return {
            "اللاعب": p.name,
            "المجموعة": groups.find(g => g.id === p.groupId)?.name || "—",
            "حاضر": present,
            "غائب": absent,
            "بعذر": excused,
            "إجمالي الأيام": total,
            "نسبة الحضور": total > 0 ? `${Math.round((present / total) * 100)}%` : "—",
          };
        });
        const wsAtt = XLSX.utils.json_to_sheet(attSummary);
        wsAtt["!cols"] = Object.keys(attSummary[0] || {}).map(() => ({ wch: 16 }));
        XLSX.utils.book_append_sheet(wb, wsAtt, "الحضور");

        // Sheet 4: Coaches Summary
        const coachesData = coaches.map(c => {
          const g = groups.find(x => x.id === c.groupId);
          const cPlayers = players.filter(p => p.groupId === c.groupId);
          const cPayments = filterPayments().filter(p => p.coachId === c.id);
          const totalCollected = cPayments.reduce((s, p) => s + p.amount, 0);
          return {
            "المدرب": c.name,
            "التخصص": c.specialty || "—",
            "الشهادة": c.cert || "—",
            "المجموعة": g?.name || "—",
            "عدد اللاعبين": cPlayers.length,
            "المدفوعات المستلمة": cPayments.length,
            "إجمالي المبالغ المحصلة": totalCollected,
            "الراتب": c.salary || 0,
          };
        });
        const wsCoaches = XLSX.utils.json_to_sheet(coachesData);
        wsCoaches["!cols"] = Object.keys(coachesData[0] || {}).map(() => ({ wch: 20 }));
        XLSX.utils.book_append_sheet(wb, wsCoaches, "المدربون");

        // Sheet 5: Revenue by Type
        const revenueByType = Object.entries(PAY_TYPES).map(([k, v]) => {
          const typePayments = filterPayments().filter(p => p.type === k);
          return {
            "النوع": v.label,
            "عدد العمليات": typePayments.length,
            "إجمالي المبلغ": typePayments.reduce((s, p) => s + p.amount, 0),
          };
        });
        const totalRevenue = filterPayments().reduce((s, p) => s + p.amount, 0);
        revenueByType.push({ "النوع": "الإجمالي الكلي", "عدد العمليات": filterPayments().length, "إجمالي المبلغ": totalRevenue });
        const wsRevenue = XLSX.utils.json_to_sheet(revenueByType);
        wsRevenue["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, wsRevenue, "الإيرادات حسب النوع");

        const fileName = `تقرير_نادي_نجد_${periodLabel.replace(/ /g, "_")}.xlsx`;
        XLSX.writeFile(wb, fileName);
        setLastExport({ time: new Date().toLocaleTimeString("ar-SA"), period: periodLabel, fileName });
      } catch (e) {
        console.error("Export error:", e);
        alert("حدث خطأ أثناء التصدير: " + e.message);
      }
      setExporting(false);
    }, 500);
  };

  const fPay = filterPayments();
  const totalRevenue = fPay.reduce((s, p) => s + p.amount, 0);
  const subCount = fPay.filter(p => p.type === "subscription").length;
  const fAtt = filterAttendance();

  return (
    <div className="s1">
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <AnimIcon type="chart" size={22} color="#D8A435"/>
          <div style={{ fontWeight: 900, fontSize: 18, color: t.text }}>مركز التقارير والبيانات</div>
        </div>
        <div style={{ fontSize: 12, color: t.textDim }}>تصدير بيانات شاملة بصيغة Excel — تقارير شهرية وسنوية</div>
      </div>

      {/* Period Selection */}
      <Card t={t} style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <button onClick={() => setReportType("monthly")}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: reportType === "monthly" ? "linear-gradient(135deg,#7C49A8,#5A2D82)" : t.bg, color: reportType === "monthly" ? "#fff" : t.textDim, fontWeight: 800, cursor: "pointer", transition: "all .3s", fontSize: 14, fontFamily: "'Cairo',sans-serif", boxShadow: reportType === "monthly" ? "0 6px 20px rgba(124,73,168,.3)" : "none" }}>
            📅 تقرير شهري
          </button>
          <button onClick={() => setReportType("annual")}
            style={{ flex: 1, padding: "14px", borderRadius: 14, border: "none", background: reportType === "annual" ? "linear-gradient(135deg,#D8A435,#A87820)" : t.bg, color: reportType === "annual" ? "#fff" : t.textDim, fontWeight: 800, cursor: "pointer", transition: "all .3s", fontSize: 14, fontFamily: "'Cairo',sans-serif", boxShadow: reportType === "annual" ? "0 6px 20px rgba(216,164,53,.3)" : "none" }}>
            📊 تقرير سنوي
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: reportType === "monthly" ? "1fr 1fr" : "1fr", gap: 14 }}>
          {reportType === "monthly" && (
            <Input label="الشهر" value={selMonth} onChange={setSelMonth} options={MONTHS_LIST} t={t}/>
          )}
          <Input label="السنة" value={selYear} onChange={v => { setSelYear(v); if (reportType === "monthly") { const parts = selMonth.split(" "); setSelMonth(`${parts[0]} ${v}`); } }} options={YEARS_LIST} t={t}/>
        </div>
      </Card>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }} className="s2">
        <StatCard label="إجمالي الإيرادات" counter={totalRevenue} icon="💰" color="#10B981" value={fmtMoney(totalRevenue)} t={t}/>
        <StatCard label="عدد المدفوعات" counter={fPay.length} icon="💳" color="#7C49A8" t={t}/>
        <StatCard label="الاشتراكات المدفوعة" counter={subCount} icon="📋" color="#06B6D4" t={t}/>
        <StatCard label="سجلات الحضور" counter={fAtt.length} icon="✅" color="#D8A435" t={t}/>
      </div>

      {/* Report Contents */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }} className="s3">
        {/* Revenue by Type */}
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>💳 الإيرادات حسب النوع</div>
          {Object.entries(PAY_TYPES).map(([k, v]) => {
            const typePayments = fPay.filter(p => p.type === k);
            const typeTotal = typePayments.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={k} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 17 }}>{v.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{v.label}</div>
                    <div style={{ fontSize: 10, color: t.textDim }}>{typePayments.length} عملية</div>
                  </div>
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: v.color }}>{fmtMoney(typeTotal)}</span>
              </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", marginTop: 4 }}>
            <span style={{ fontWeight: 700, color: t.text }}>الإجمالي</span>
            <span style={{ fontWeight: 900, fontSize: 16, color: "#10B981" }}>{fmtMoney(totalRevenue)}</span>
          </div>
        </Card>

        {/* Groups Summary */}
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>⚽ ملخص المجموعات</div>
          {groups.map(g => {
            const gPlayers = players.filter(p => p.groupId === g.id);
            const coach = coaches.find(c => c.groupId === g.id);
            const gPayments = fPay.filter(p => gPlayers.some(pl => pl.id === p.playerId));
            const gTotal = gPayments.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${g.color}18`, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900, color: g.color }}>{gPlayers.length}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: g.color }}>{g.name}</div>
                    <div style={{ fontSize: 10, color: t.textDim }}>{coach?.name || "بدون مدرب"}</div>
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>{fmtMoney(gTotal)}</span>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Export Section */}
      <Card t={t} style={{ padding: 28, background: t.name === "dark" ? "linear-gradient(135deg, #12111F, #1A1530)" : "linear-gradient(135deg, #FEFEFF, #F8F5FF)", borderColor: "rgba(124,73,168,.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 24 }}>📥</span>
              <div style={{ fontWeight: 800, fontSize: 16, color: t.text }}>تصدير التقرير كملف Excel</div>
            </div>
            <div style={{ fontSize: 12, color: t.textDim }}>
              يتضمن: اللاعبون، المدفوعات، الحضور، المدربون، الإيرادات حسب النوع
            </div>
            <div style={{ fontSize: 11, color: t.textFaint, marginTop: 4 }}>
              الفترة: <span style={{ color: "#D8A435", fontWeight: 700 }}>{reportType === "monthly" ? selMonth : `سنة ${selYear}`}</span>
              {" — "} 5 صفحات تفصيلية
            </div>
          </div>
          <button onClick={exportExcel} disabled={exporting}
            onMouseEnter={e => { if (!e.target.disabled) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(16,185,129,.3)"; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(16,185,129,.2)"; }}
            style={{ background: exporting ? t.border : "linear-gradient(135deg,#10B981,#065F46)", color: "#fff", border: "none", borderRadius: 16, padding: "16px 36px", fontSize: 15, fontWeight: 800, cursor: exporting ? "wait" : "pointer", transition: "all .3s", boxShadow: "0 6px 20px rgba(16,185,129,.2)", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Cairo',sans-serif", minWidth: 200, justifyContent: "center" }}>
            {exporting ? (
              <>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .6s linear infinite", display: "inline-block" }} />
                جارٍ التصدير...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><polyline points="7 10 12 15 17 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="15" x2="12" y2="3" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
                تحميل ملف Excel
              </>
            )}
          </button>
        </div>

        {lastExport && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(16,185,129,.08)", borderRadius: 12, border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>تم التصدير بنجاح!</div>
              <div style={{ fontSize: 10, color: t.textDim }}>{lastExport.fileName} — {lastExport.time}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Info Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 20 }} className="s4">
        <Card t={t} style={{ padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 4 }}>صفحة اللاعبين</div>
          <div style={{ fontSize: 10, color: t.textDim, lineHeight: 1.6 }}>بيانات كاملة: الاسم، العمر، المركز، التقييم، الحضور، المدفوعات</div>
        </Card>
        <Card t={t} style={{ padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 4 }}>صفحة المدفوعات</div>
          <div style={{ fontSize: 10, color: t.textDim, lineHeight: 1.6 }}>سجل تفصيلي لكل دفعة مع النوع والمبلغ والمستلم</div>
        </Card>
        <Card t={t} style={{ padding: 18, textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 4 }}>صفحة الحضور والمدربين</div>
          <div style={{ fontSize: 10, color: t.textDim, lineHeight: 1.6 }}>ملخص حضور كل لاعب + أداء المدربين والمبالغ المحصّلة</div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COACH PORTAL (Permissions-aware)
══════════════════════════════════════════════════════════ */
/* ── Admin Attendance (NEW) ─────────────────────────── */
function AdminAttendance({ groups, players, coaches, attendance, setAttendance, coachesAttendance, setCoachesAttendance, t, payments, trainings }) {
  const [subTab, setSubTab] = useState("players");
  const [selGroup, setSelGroup] = useState(groups[0]?.id || "");
  const [date, setDate] = useState("");
  const [records, setRecords] = useState({});

  useEffect(() => {
    if (subTab === "players") {
      const scheduledDates = getGroupScheduledDates(selGroup, trainings);
      const todayStr = getLocalDateString(new Date());
      const defaultDate = scheduledDates.find(d => d <= todayStr) || scheduledDates[0] || todayStr;
      setDate(defaultDate);
    } else {
      setDate(getLocalDateString(new Date()));
    }
  }, [selGroup, subTab, trainings]);

  useEffect(() => {
    if (subTab === "players") {
      const existing = attendance.find(a => compareDates(a.date, date) && a.groupId === selGroup);
      if (existing) {
        setRecords(existing.records || {});
      } else {
        const defaultRecs = {};
        players.filter(p => p.groupId === selGroup).forEach(p => {
          const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
          defaultRecs[p.id] = (subDetails.isUnpaid || subDetails.isExpired) ? "غائب" : "حاضر";
        });
        setRecords(defaultRecs);
      }
    } else {
      const existing = coachesAttendance.find(a => compareDates(a.date, date));
      if (existing) {
        setRecords(existing.records || {});
      } else {
        const defaultRecs = {};
        coaches.forEach(c => {
          defaultRecs[c.id] = "حاضر";
        });
        setRecords(defaultRecs);
      }
    }
  }, [date, selGroup, subTab, attendance, coachesAttendance, players, coaches, payments, trainings]);

  const save = () => {
    if (subTab === "players") {
      const newAtt = { id: `att${Date.now()}`, date, groupId: selGroup, records };
      setAttendance(prev => {
        const filtered = prev.filter(a => !(compareDates(a.date, date) && a.groupId === selGroup));
        return [...filtered, newAtt];
      });
    } else {
      const newAtt = { id: `ca${Date.now()}`, date, records };
      setCoachesAttendance(prev => {
        const filtered = prev.filter(a => compareDates(a.date, date));
        return [...filtered, newAtt];
      });
    }
    alert("تم حفظ التحضير بنجاح");
  };

  const list = subTab === "players" ? players.filter(p => p.groupId === selGroup) : coaches;

  return (
    <div className="s1">
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button onClick={() => setSubTab("players")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: subTab === "players" ? "linear-gradient(135deg,#7C49A8,#5A2D82)" : t.bg2, color: subTab === "players" ? "#fff" : t.textDim, fontWeight: 700, cursor: "pointer", transition: "all .3s" }}>تحضير اللاعبين</button>
        <button onClick={() => setSubTab("coaches")} style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: subTab === "coaches" ? "linear-gradient(135deg,#D8A435,#A87820)" : t.bg2, color: subTab === "coaches" ? "#fff" : t.textDim, fontWeight: 700, cursor: "pointer", transition: "all .3s" }}>تحضير المدربين</button>
      </div>

      <Card t={t} style={{ padding: 22 }}>
        <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            {subTab === "players" ? (
              <Input 
                label="التاريخ (أيام التمارين المجدولة فقط)" 
                value={date} 
                onChange={setDate} 
                options={getGroupScheduledDates(selGroup, trainings).map(dStr => {
                  const parts = dStr.split("-");
                  const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
                  const dayName = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][dObj.getDay()];
                  return {
                    v: dStr,
                    l: `${dayName} - ${formatArabicDate(dStr)} (${dStr})`
                  };
                })} 
                t={t}
              />
            ) : (
              <Input label="التاريخ" type="date" value={date} onChange={setDate} t={t}/>
            )}
          </div>
          {subTab === "players" && (
            <div style={{ flex: 1, minWidth: 150 }}><Input label="المجموعة" value={selGroup} onChange={setSelGroup} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/></div>
          )}
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" }}>
          {list.map((item, idx) => {
            const subDetails = subTab === "players" ? getPlayerSubscriptionDetails(item, trainings, attendance, payments) : null;
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < list.length - 1 ? `1px solid ${t.border}` : "none", background: idx % 2 === 0 ? "transparent" : `${t.bg}44` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Avatar name={item.name} size={36} color={subTab === "players" ? "#7C49A8" : "#D8A435"}/>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: t.textDim }}>{subTab === "players" ? item.position : item.specialty}</div>
                  </div>
                </div>
                {subTab === "players" && subDetails.isUnpaid ? (
                  <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 800, background: "rgba(239,68,68,0.1)", padding: "6px 12px", borderRadius: 8 }}>
                    ⚠️ غير مسدد (الاشتراك غير نشط)
                  </span>
                ) : subTab === "players" && subDetails.isExpired ? (
                  <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 800, background: "rgba(239,68,68,0.1)", padding: "6px 12px", borderRadius: 8 }}>
                    ⚠️ منتهي الاشتراك ({subDetails.attendedCount}/12)
                  </span>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    {Object.entries(ATT_C).map(([status, color]) => (
                      <button key={status} onClick={() => setRecords(r => ({ ...r, [item.id]: status }))}
                        style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid", borderColor: records[item.id] === status ? color : t.border, background: records[item.id] === status ? `${color}18` : "transparent", color: records[item.id] === status ? color : t.textFaint, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>لا يوجد بيانات</div>}
        </div>

        <Btn onClick={save} style={{ width: "100%", marginTop: 20 }}>💾 حفظ التحضير</Btn>
      </Card>
    </div>
  );
}

function CoachPortal({ user, onLogout, groups, coaches, players, parents, payments, setPayments, attendance, setAttendance, coachesAttendance, setCoachesAttendance, evals, setEvals, messages, setMessages, prices, trainings, setTrainings, t, syncStatus }) {
  const coach = coaches.find(c => c.id === user.id) || coaches[0];
  const perms = coach?.perms || { ...DEFAULT_PERMS };
  const group = groups.find(g => g.id === coach.groupId);
  const myPlayers = players.filter(p => p.groupId === coach.groupId);
  const unread = messages.filter(m => m.to === user.id && !m.read).length;

  const allTabs = [
    { id: "home",       icon: "dashboard",  label: "الرئيسية",       perm: null },
    { id: "sessions",   icon: "schedule",   label: "التدريبات",       perm: null },
    { id: "players",    icon: "players",    label: "اللاعبون",         perm: null },
    { id: "eval",       icon: "trophy",     label: "التقييمات",        perm: "evals" },
    { id: "payments",   icon: "payments",   label: "المدفوعات",        perm: "payments" },
    { id: "messages",   icon: "messages",   label: "الرسائل",           perm: "messages", badge: unread || undefined },
  ];
  const tabs = allTabs.filter(tb => tb.perm === null || perms[tb.perm] !== false);
  const [tab, setTab] = useState("home");

  useEffect(() => {
    if (!tabs.find(tb => tb.id === tab)) setTab("home");
  }, [perms]);

  return (
    <Shell title={coach.name} subtitle={`مدرب ${group?.name || ""}`} color="#06B6D4" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} badge={group?.name} user={user} t={t} syncStatus={syncStatus}>
      {tab === "home"       && <CoachHome coach={coach} group={group} groups={groups} myPlayers={myPlayers} attendance={attendance} evals={evals} trainings={trainings} t={t}/>}
      {tab === "sessions"   && <CoachSessions coach={coach} group={group} groups={groups} trainings={trainings} t={t}/>}
      {tab === "players"    && <CoachPlayers myPlayers={myPlayers} group={group} evals={evals} t={t} trainings={trainings} attendance={attendance} payments={payments} setAttendance={setAttendance}/>}
      {tab === "eval"       && perms.evals !== false      && <CoachEval coachId={user.id} myPlayers={myPlayers} evals={evals} setEvals={setEvals} t={t}/>}
      {tab === "payments"   && perms.payments !== false   && <CoachPayments coachId={user.id} myPlayers={myPlayers} payments={payments} setPayments={setPayments} prices={prices} coaches={coaches} t={t}/>}
      {tab === "messages"   && perms.messages !== false   && <Messaging messages={messages} setMessages={setMessages} meId={user.id} meName={coach.name} coaches={coaches} parents={parents} t={t} role="coach" myGroupId={coach.groupId} players={players} />}
    </Shell>
  );
}

function CoachHome({ coach, group, groups, myPlayers, attendance, evals, trainings, t }) {
  const lastAtt = attendance.filter(a => a.coachId === coach.id).slice(-1)[0];
  const avgScore = myPlayers.length ? Math.round(myPlayers.reduce((a, p) => a + p.score, 0) / myPlayers.length) : 0;
  const myTrainings = (trainings || []).filter(tr => tr.groupId === coach.groupId && isTrainingActive(tr));
  const currentDayAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][new Date().getDay()];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. Upcoming Trainings Timeline Card */}
      {myTrainings.length > 0 && (
        <Card t={t} style={{ 
          padding: 24, 
          background: t.name === "dark" 
            ? "linear-gradient(135deg, #083344, #111827)" 
            : "linear-gradient(135deg, #ecfeff, #e0f7fa)", 
          borderColor: "rgba(6,182,212,0.35)",
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          boxShadow: t.name === "dark" ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(6,182,212,0.06)",
          animation: "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both"
        }}>
          {/* Glowing particle orb */}
          <div style={{
            position: "absolute",
            top: "-30px",
            left: "-30px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: "rgba(6,182,212,0.15)",
            filter: "blur(25px)"
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, position: "relative", zIndex: 1, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>📅</span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: t.name === "dark" ? "#67e8f9" : "#0891b2" }}>مواعيد الفعاليات والتمارين القادمة لمجموعتك</span>
                <div style={{ fontSize: 11, color: t.textDim }}>المجموعة: {group?.name || ""}</div>
              </div>
            </div>
            
            <div style={{ 
              background: t.name === "dark" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.6)", 
              padding: "6px 12px", 
              borderRadius: 12, 
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: 8
            }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "#06B6D4" }}>{myPlayers.length}</div>
              <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>لاعب في المجموعة</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, position: "relative", zIndex: 1 }}>
            {myTrainings.map((tr, idx) => {
              const isToday = tr.isRecurring ? tr.days.includes(currentDayAr) : (tr.date && new Date(tr.date).toDateString() === new Date().toDateString());
              const typeLabel = tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة") : "تمرين";
              const typeColor = tr.type === "match" ? "#EF4444" : "#06B6D4";
              
              return (
                <div key={tr.id} style={{ 
                  background: isToday 
                    ? (t.name === "dark" ? "rgba(6,182,212,0.18)" : "rgba(6,182,212,0.08)")
                    : (t.name === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)"), 
                  border: `1px solid ${isToday ? typeColor : t.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isToday ? `0 4px 15px ${typeColor}15` : "none",
                  transition: "transform 0.2s"
                }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{
                        background: typeColor,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 20
                      }}>
                        {typeLabel}
                      </span>
                      {isToday && (
                        <span style={{
                          background: "#EF4444",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 900,
                          padding: "2px 6px",
                          borderRadius: 20,
                          animation: "pulse 1.8s infinite"
                        }}>
                          اليوم
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 16, fontWeight: 900, color: t.text, marginBottom: 4 }}>
                      {tr.isRecurring ? tr.days.join(" و ") : (tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { weekday: 'long', day: 'numeric', month: 'short' }) : "مرة واحدة")}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: typeColor, marginBottom: 8 }}>
                      الساعة {tr.time} ({tr.duration} دقيقة)
                    </div>
                    
                    <div style={{ fontSize: 12, color: t.text, fontWeight: 800, marginBottom: 4 }}>
                      {tr.title || (tr.type === "match" ? "مباراة كرة قدم" : "تمرين اعتيادي")}
                    </div>
                    
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: t.textDim, marginBottom: 8 }}>
                      <span>🏟️ {tr.field}</span>
                      {tr.trainingFocus && <span>🎯 {tr.trainingFocus}</span>}
                    </div>
                  </div>

                  {tr.note && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: "6px 10px", 
                      background: t.name === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", 
                      borderRadius: 8, 
                      fontSize: 10, 
                      color: t.textFaint, 
                      fontStyle: "italic",
                      borderRight: `2px solid ${typeColor}`
                    }}>
                      * {tr.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 2. Stat Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="s2">
        <StatCard label="اللاعبون"     counter={myPlayers.length}                             icon="⚽" color="#06B6D4" t={t}/>
        <StatCard label="جلسات مسجلة" counter={attendance.filter(a => a.coachId === coach.id).length} icon="📋" color="#7C49A8" t={t}/>
        <StatCard label="تقييمات"      counter={evals.filter(e => e.coachId === coach.id).length}      icon="⭐" color="#F59E0B" t={t}/>
        <StatCard label="متوسط التقييم" counter={avgScore}                                   icon="📊" color="#10B981" t={t}/>
      </div>

      {/* 3. Details Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }} className="s3">
        <Card t={t} style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚽</span> لاعبو مجموعتي التدريبية ({myPlayers.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {myPlayers.map((p, i) => {
              const lastEval = evals.filter(e => e.playerId === p.id).slice(-1)[0];
              return (
                <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: i < myPlayers.length - 1 ? `1px solid ${t.border}` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <Avatar name={p.name} size={32} color="#06B6D4"/>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.name}</div>
                      <div style={{ fontSize: 10, color: t.textDim }}>{p.position} · {p.attendancePct}% حضور</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "left", display: "flex", alignItems: "center", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B", textAlign: "left" }}>{lastEval ? lastEval.technique : "—"}</div>
                      <div style={{ fontSize: 10, color: t.textDim }}>تقنية</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#10B981", textAlign: "left" }}>{lastEval ? lastEval.speed : "—"}</div>
                      <div style={{ fontSize: 10, color: t.textDim }}>سرعة</div>
                    </div>
                  </div>
                </div>
              );
            })}
            {myPlayers.length === 0 && (
              <div style={{ textAlign: "center", color: t.textFaint, padding: 40 }}>لا يوجد لاعبون مسجلون في مجموعتك حالياً.</div>
            )}
          </div>
        </Card>

        <Card t={t} style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📋</span> آخر جلسة تحضير حضور وغياب
          </div>
          {lastAtt ? (
            <div>
              <div style={{ fontSize: 11, color: t.textDim, marginBottom: 12 }}>📅 تاريخ الجلسة: {lastAtt.date}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(lastAtt.records).map(([pid, status]) => {
                  const p = myPlayers.find(x => x.id === pid);
                  return (
                    <div key={pid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 10, background: t.bg2, fontSize: 12, border: `1px solid ${t.border}` }}>
                      <span style={{ color: t.textMid, fontWeight: 600 }}>{p?.name || pid}</span>
                      <Chip text={status} color={ATT_C[status]}/>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: t.textFaint, padding: "50px 0" }}>لم يتم تسجيل حضور بعد للمجموعة.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ── Coach Sessions ─────────────────────────────────── */
function CoachSessions({ coach, group, groups, trainings, t }) {
  if (!group) return <div style={{ textAlign: "center", color: t.textFaint, padding: 60 }}>لا توجد مجموعة محددة</div>;
  const myTrainings = trainings.filter(tr => tr.groupId === coach.groupId && isTrainingActive(tr));
  
  return (
    <div>
      <Card t={t} style={{ padding: 24, marginBottom: 16, background: t.name === "dark" ? "linear-gradient(135deg,#060A20,#0A1030)" : "linear-gradient(135deg,#EFF8FF,#F0FBFF)", borderColor: "rgba(6,182,212,.2)" }} className="s1">
        <div style={{ fontWeight: 700, fontSize: 14, color: "#06B6D4", marginBottom: 12 }}>📅 الجدول الفعلي لمجموعة {group.name}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 14 }}>
          {myTrainings.map((tr, i) => {
            const typeLabel = tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة") : "تمرين";
            const typeColor = tr.type === "match" ? "#EF4444" : "#06B6D4";
            return (
              <div key={tr.id} style={{ background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.15)", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(6,182,212,.15)", border: "1px solid rgba(6,182,212,.3)", display: "grid", placeItems: "center", fontSize: 20 }}>
                    {tr.type === "match" ? "⚽" : "🏃‍♂️"}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#06B6D4" }}>
                      {tr.isRecurring ? tr.days.join(" · ") : (tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { day: 'numeric', month: 'short' }) : "مرة واحدة")}
                    </div>
                    <div style={{ fontSize: 12, color: t.textDim }}>{tr.time} · {tr.duration} دق</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, marginBottom: 6 }}>
                  <Chip text={typeLabel} color={typeColor} size={9}/>
                  <Chip text={tr.isRecurring ? "متكرر" : "مرة واحدة"} color={t.textDim} size={9}/>
                </div>
                <div style={{ fontSize: 12, color: t.text, fontWeight: 700 }}>{tr.title || (tr.type === "match" ? "مباراة" : "تمرين")}</div>
                <div style={{ fontSize: 11, color: t.textDim }}>🏟 {tr.field}</div>
                {tr.trainingFocus && <div style={{ fontSize: 11, color: "#06B6D4", fontWeight: 700, marginTop: 6 }}>🎯 {tr.trainingFocus}</div>}
              </div>
            );
          })}
          {myTrainings.length === 0 && <div style={{ padding: 20, color: t.textDim }}>لا توجد فعاليات مجدولة حالياً</div>}
        </div>
      </Card>
      <Card t={t} style={{ padding: 22, marginBottom: 16 }} className="s2">
        <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📋 خطة التدريب والفعاليات الأسبوعية</div>
        {myTrainings.map((tr, i) => {
          const colors = ["#06B6D4", "#A855F7"];
          return (
            <div key={tr.id} style={{ background: `${colors[i % 2]}08`, border: `1px solid ${colors[i % 2]}20`, borderRadius: 12, padding: 18, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{tr.type === "match" ? "🏆" : "⚽"}</span>
                <div>
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    {tr.isRecurring ? (
                      tr.days.map(d => <Chip key={d} text={d} color={colors[i % 2]}/>)
                    ) : (
                      <Chip text={tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { weekday: 'long', day: 'numeric', month: 'long' }) : ""} color="#EF4444"/>
                    )}
                    <Chip text={tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة") : "تمرين"} color={colors[i % 2]}/>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors[i % 2], marginTop: 4 }}>{tr.title || (tr.type === "match" ? "مباراة" : "تمرين")} — {tr.trainingFocus || "مهارات"}</div>
                </div>
              </div>
              {tr.note && <div style={{ fontSize: 11, color: t.textDim, fontStyle: "italic" }}>* {tr.note}</div>}
            </div>
          );
        })}
      </Card>
      <Card t={t} style={{ padding: 22 }} className="s3">
        <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>📋 جدول كل المجموعات</div>
        {groups.map(g => {
          const gTr = trainings.filter(tr => tr.groupId === g.id);
          return (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: g.color, flexShrink: 0 }}/>
              <div style={{ flex: 1 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: g.color }}>{g.name}</span>
                <span style={{ fontSize: 11, color: t.textDim, marginRight: 10 }}>
                  {gTr.length ? gTr.map(tr => `${tr.days.join(" · ")} (${tr.time})`).join(" | ") : "لا يوجد تمرين"}
                </span>
              </div>
              {g.id === coach.groupId && <Chip text="مجموعتي" color="#06B6D4"/>}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ── Coach Players ──────────────────────────────────── */
function CoachPlayers({ myPlayers, group, evals, t, trainings, attendance, payments, setAttendance }) {
  const [sel, setSel] = useState(null);
  if (sel) {
    const p  = myPlayers.find(x => x.id === sel);
    const pe = evals.filter(e => e.playerId === p.id).slice(-3);
    const lastEval = evals.filter(e => e.playerId === p.id).slice(-1)[0];
    const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
    const totalPast = subDetails.attendedCount + subDetails.absentCount + subDetails.excusedCount;
    const computedAttendancePct = totalPast > 0 ? Math.round((subDetails.attendedCount / totalPast) * 100) : 100;

    const playerPays = (payments || []).filter(pay => String(pay.playerId) === String(p.id) && pay.type === "subscription");
    const sortedPays = [...playerPays].sort((a, b) => {
      const da = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
      const db = typeof b.date === "string" ? b.date.substring(0, 10) : getLocalDateString(b.date);
      return db.localeCompare(da);
    });
    const latestRenewalDate = sortedPays.length > 0 ? formatArabicDate(sortedPays[0].date) : "تجديد تلقائي عند التسجيل";
    return (
      <div>
        <button onClick={() => setSel(null)} style={{ background: t.bg2, border: `1px solid ${t.border}`, color: t.textDim, borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 18, fontFamily: "'Cairo',sans-serif" }}>← رجوع</button>
        <div style={{ display: "grid", gridTemplateColumns: "230px 1fr", gap: 16 }}>
          <Card t={t} style={{ padding: 22 }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Avatar name={p.name} size={56} color="#06B6D4"/>
              <div style={{ fontWeight: 800, fontSize: 15, marginTop: 10, marginBottom: 6, color: t.text }}>{p.name}</div>
              <Chip text={p.position} color="#06B6D4"/>
            </div>
            {[
              ["العمر", `${p.age} سنة`], 
              ["الطول", `${p.height || '—'} سم`], 
              ["الوزن", `${p.weight || '—'} كجم`], 
              ["الأهداف", p.goals || 0], 
              ["التمريرات", p.assists || 0], 
              ["حضور الاشتراك الحالي", `${subDetails.attendedCount} / 12 حصة`], 
              ["نسبة حضور الدورة", `${computedAttendancePct}%`],
              ["تاريخ التسجيل", formatArabicDate(p.joinDate)],
              ["تجديد الاشتراك", latestRenewalDate]
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                <span style={{ color: t.textDim }}>{k}</span><span style={{ fontWeight: 600, color: t.text }}>{v}</span>
              </div>
            ))}
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card t={t} style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>📊 المهارات</div>
              {lastEval ? (
                <div>
                  <SkillBar label="السرعة"        val={lastEval.speed}     color="#06B6D4" t={t}/>
                  <SkillBar label="التقنية"       val={lastEval.technique} color="#7C49A8" t={t}/>
                  <SkillBar label="العمل الجماعي" val={lastEval.teamwork}  color="#F59E0B" t={t}/>
                  <div style={{ marginTop: 14, fontSize: 11, color: t.textDim, display: "flex", justifyContent: "space-between" }}>
                    <span>التقييم الكلي</span>
                    <span style={{ fontWeight: 800, color: "#10B981" }}>{p.score}/100</span>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: t.textFaint, padding: "20px 0", fontSize: 12 }}>لم يتم تقييم مهارات اللاعب بعد</div>
              )}
            </Card>
            <Card t={t} style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📝 حالة التقييم</div>
              {lastEval 
                ? (
                  <div>
                    <div style={{ fontSize: 11, color: t.textDim, marginBottom: 8 }}>آخر تقييم بتاريخ: {lastEval.date}</div>
                    <div style={{ fontSize: 14, color: t.textMid, lineHeight: 1.6 }}>{lastEval.note || "لا توجد ملاحظات إضافية."}</div>
                  </div>
                )
                : <div style={{ textAlign: "center", color: t.textFaint, padding: "20px 0", fontSize: 12 }}>لم يتم تقييم اللاعب بعد</div>
              }
            </Card>
            <Card t={t} style={{ padding: 22 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span>📅</span> تفاصيل الاشتراك والتحضير (الدورة {subDetails.cycleIndex})
              </div>
              
              {subDetails.isUnpaid ? (
                <div style={{ textAlign: "center", color: "#EF4444", padding: 30, border: `1px dashed #EF4444`, borderRadius: 16, background: "rgba(239,68,68,0.05)" }}>
                  <span style={{ fontSize: 24 }}>⚠️</span>
                  <div style={{ fontWeight: 800, marginTop: 10 }}>الاشتراك غير نشط</div>
                  <div style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>يرجى سداد دفعة الاشتراك الشهري لتفعيل الحصص التدريبية.</div>
                </div>
              ) : (
                <>
                  {subDetails.isExpired && (
                    <div style={{ textAlign: "center", color: "#EF4444", padding: 16, border: `1px dashed #EF4444`, borderRadius: 16, background: "rgba(239,68,68,0.05)", marginBottom: 16 }}>
                      <span style={{ fontSize: 20 }}>🚨</span>
                      <div style={{ fontWeight: 800, marginTop: 6 }}>انتهت الحصص المتاحة (12 / 12)</div>
                      <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>يرجى سداد قيمة الاشتراك الشهري للدورة الجديدة لتفعيل حصص إضافية.</div>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 60, background: "rgba(16,185,129,0.08)", padding: "10px 6px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(16,185,129,0.12)" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#10B981" }}>{subDetails.attendedCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>حاضر</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, background: "rgba(239,68,68,0.08)", padding: "10px 6px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(239,68,68,0.12)" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#EF4444" }}>{subDetails.absentCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>غائب</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, background: "rgba(245,158,11,0.08)", padding: "10px 6px", borderRadius: 12, textAlign: "center", border: "1px solid rgba(245,158,11,0.12)" }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#F59E0B" }}>{subDetails.excusedCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>بعذر</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 60, background: t.bg2, padding: "10px 6px", borderRadius: 12, textAlign: "center", border: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: t.textDim }}>{subDetails.remainingCount}</div>
                      <div style={{ fontSize: 10, color: t.textDim, fontWeight: 700 }}>متبقي</div>
                    </div>
                  </div>

                  <PlayerAttendanceGrid player={p} subDetails={subDetails} attendance={attendance} setAttendance={setAttendance} t={t} />
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
      {myPlayers.map(p => {
        const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
        const subText = subDetails.isUnpaid ? "غير مسدد" : subDetails.isExpired ? `منتهي (${subDetails.attendedCount} / 12)` : `${subDetails.attendedCount} / 12`;
        return (
          <Card key={p.id} hover t={t} style={{ padding: 20, cursor: "pointer" }} onClick={() => setSel(p.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <Avatar name={p.name} size={40} color="#06B6D4"/>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.name}</div><div style={{ fontSize: 11, color: t.textDim }}>{p.position}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {[["أهداف", p.goals || 0, "#EF4444"], ["تمريرات", p.assists || 0, "#10B981"], ["الاشتراك", subText, "#7C49A8"], ["التقييم", p.score || 0, "#F59E0B"]].map(([l, v, c]) => (
                <div key={l} style={{ background: t.bg, borderRadius: 7, padding: "7px 9px" }}>
                  <div style={{ fontSize: 10, color: t.textDim }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ── Coach Attendance ───────────────────────────────── */
function CoachAttendance({ coachId, group, myPlayers, attendance, setAttendance, t, payments, trainings }) {
  const [date, setDate]     = useState("");
  const [records, setRecords] = useState({});

  const scheduledDates = getGroupScheduledDates(group?.id, trainings);
  useEffect(() => {
    const todayStr = getLocalDateString(new Date());
    const defaultDate = scheduledDates.find(d => d <= todayStr) || scheduledDates[0] || todayStr;
    setDate(defaultDate);
  }, [group, trainings]);

  useEffect(() => {
    const existing = (attendance || []).find(a => compareDates(a.date, date) && a.groupId === group?.id);
    if (existing) {
      setRecords(existing.records || {});
    } else {
      const defaultRecs = {};
      myPlayers.forEach(p => {
        const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
        defaultRecs[p.id] = (subDetails.isUnpaid || subDetails.isExpired) ? "غائب" : "حاضر";
      });
      setRecords(defaultRecs);
    }
  }, [date, group, myPlayers, attendance, payments, trainings]);

  const save = () => {
    setAttendance(prev => {
      const filtered = prev.filter(a => !(compareDates(a.date, date) && a.groupId === group?.id));
      return [...filtered, { id: `att${Date.now()}`, date, groupId: group?.id, coachId, records }];
    });
    alert("✅ تم حفظ الحضور");
  };

  const counts = { حاضر: Object.values(records).filter(v => v === "حاضر").length, غائب: Object.values(records).filter(v => v === "غائب").length, بعذر: Object.values(records).filter(v => v === "بعذر").length };
  
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }} className="s1">
        <select value={date} onChange={e => setDate(e.target.value)} style={{ background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 9, padding: "8px 14px", color: t.text, fontSize: 13, fontFamily: "'Cairo',sans-serif", outline: "none", cursor: "pointer" }}>
          {scheduledDates.map(dStr => {
            const parts = dStr.split("-");
            const dObj = new Date(parts[0], parts[1] - 1, parts[2]);
            const dayName = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][dObj.getDay()];
            return (
              <option key={dStr} value={dStr}>
                {dayName} - {formatArabicDate(dStr)} ({dStr})
              </option>
            );
          })}
        </select>
        {Object.keys(records).length > 0 && (
          <div style={{ display: "flex", gap: 8 }}>
            {Object.entries(counts).map(([l, v]) => (
              <div key={l} style={{ background: `${ATT_C[l]}15`, border: `1px solid ${ATT_C[l]}30`, borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: ATT_C[l] }}>{l}: {v}</div>
            ))}
          </div>
        )}
        <Btn variant="success" onClick={save}>💾 حفظ الحضور</Btn>
      </div>
      <Card t={t} style={{ overflow: "hidden" }} className="s2">
        {myPlayers.map((p, i) => {
          const subDetails = getPlayerSubscriptionDetails(p, trainings, attendance, payments);
          return (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: i < myPlayers.length - 1 ? `1px solid ${t.border}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={p.name} size={34} color="#06B6D4"/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: t.textDim }}>{p.position} · حضور موسمي: <span style={{ color: p.attendancePct > 90 ? "#10B981" : p.attendancePct > 75 ? "#F59E0B" : "#EF4444" }}>{p.attendancePct}%</span></div>
                </div>
              </div>
              {subDetails.isUnpaid ? (
                <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 800, background: "rgba(239,68,68,0.1)", padding: "6px 12px", borderRadius: 8 }}>
                  ⚠️ غير مسدد (الاشتراك غير نشط)
                </span>
              ) : subDetails.isExpired ? (
                <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 800, background: "rgba(239,68,68,0.1)", padding: "6px 12px", borderRadius: 8 }}>
                  ⚠️ منتهي الاشتراك ({subDetails.attendedCount}/12)
                </span>
              ) : (
                <div style={{ display: "flex", gap: 7 }}>
                  {["حاضر", "غائب", "بعذر"].map(s => (
                    <button key={s} onClick={() => setRecords(r => ({ ...r, [p.id]: s }))}
                      style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: records[p.id] === s ? ATT_C[s] : t.border2, background: records[p.id] === s ? `${ATT_C[s]}20` : t.inputBg, color: records[p.id] === s ? ATT_C[s] : t.textDim, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s", fontFamily: "'Cairo',sans-serif" }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

/* ── Coach Eval ─────────────────────────────────────── */
function CoachEval({ coachId, myPlayers, evals, setEvals, t }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ playerId: myPlayers[0]?.id || "", speed: 80, technique: 80, teamwork: 80, note: "", date: getLocalDateString(new Date()) });
  const save = () => { setEvals(e => [...e, { ...form, id: `ev${Date.now()}`, coachId }]); setModal(false); };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}><Btn onClick={() => setModal(true)}><AnimIcon type="plus" size={14} color="#fff"/> إضافة تقييم</Btn></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {evals.filter(e => e.coachId === coachId).slice().reverse().map(e => {
          const p = myPlayers.find(x => x.id === e.playerId);
          return (
            <Card key={e.id} t={t} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={p?.name || "؟"} size={34} color="#F59E0B"/>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p?.name}</div><div style={{ fontSize: 11, color: t.textDim }}>{e.date}</div></div>
                </div>
                <div style={{ display: "flex", gap: 7 }}>
                  <Chip text={`سرعة ${e.speed}`} color="#06B6D4"/>
                  <Chip text={`تقنية ${e.technique}`} color="#7C49A8"/>
                  <Chip text={`فريق ${e.teamwork}`} color="#F59E0B"/>
                </div>
              </div>
              {e.note && <div style={{ fontSize: 12, color: t.textDim, lineHeight: 1.7, background: t.bg, borderRadius: 8, padding: "10px 14px" }}>{e.note}</div>}
            </Card>
          );
        })}
      </div>
      {modal && (
        <Modal title="إضافة تقييم" onClose={() => setModal(false)} t={t}>
          <Input label="اللاعب" value={form.playerId} onChange={v => setForm(f => ({ ...f, playerId: v }))} options={myPlayers.map(p => ({ v: p.id, l: p.name }))} t={t}/>
          <Input label="التاريخ" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          {[["السرعة", "speed", "#06B6D4"], ["التقنية", "technique", "#7C49A8"], ["العمل الجماعي", "teamwork", "#F59E0B"]].map(([l, k, c]) => (
            <div key={k} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: t.textDim, fontWeight: 600, display: "block", marginBottom: 6 }}>{l}: <span style={{ color: c, fontWeight: 800 }}>{form[k]}</span></label>
              <input type="range" min={0} max={100} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: +e.target.value }))} style={{ width: "100%", accentColor: c }}/>
            </div>
          ))}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: t.textDim, fontWeight: 600, display: "block", marginBottom: 6 }}>ملاحظات</label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3}
              style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border2}`, borderRadius: 8, padding: "9px 12px", color: t.text, fontSize: 13, resize: "none", outline: "none", fontFamily: "'Cairo',sans-serif" }}/>
          </div>
          <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>💾 حفظ</Btn><Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ── Coach Payments ─────────────────────────────────── */
function CoachPayments({ coachId, myPlayers, payments, setPayments, prices, coaches, t }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ playerId: myPlayers[0]?.id || "", type: "subscription", note: "", date: getLocalDateString(new Date()) });
  const myPays = payments.filter(p => p.coachId === coachId);
  const total  = myPays.reduce((a, p) => a + p.amount, 0);
  const save   = () => {
    const player = myPlayers.find(p => p.id === form.playerId);
    const coach  = coaches.find(c => c.id === coachId);
    setPayments(ps => [...ps, { ...form, id: `pay${Date.now()}`, coachId, coachName: coach?.name || "", playerName: player?.name || "", amount: prices[form.type] || PRICE_LIST[form.type] || 0, month: getMonthFromDate(form.date) }]);
    setModal(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>استلمت إجمالاً: {fmtMoney(total)}</div>
        <Btn onClick={() => setModal(true)}><AnimIcon type="plus" size={14} color="#fff"/> تسجيل استلام دفعة</Btn>
      </div>
      <Card t={t} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
              {["اللاعب", "النوع", "الشهر", "المبلغ", "التاريخ", "ملاحظة"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myPays.map(p => {
              const pt = PAY_TYPES[p.type];
              return (
                <tr key={p.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 600, color: t.text }}>{p.playerName}</td>
                  <td style={{ padding: "10px 14px" }}><Chip text={`${pt.icon} ${pt.label}`} color={pt.color}/></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: t.textDim }}>{p.month}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: pt.color }}>{fmtMoney(p.amount)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: t.textDim }}>{p.date}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: t.textDim }}>{p.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {myPays.length === 0 && <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>لم تستلم أي مدفوعات بعد</div>}
      </Card>
      {modal && (
        <Modal title="تسجيل استلام دفعة" onClose={() => setModal(false)} t={t}>
          <Input label="اللاعب" value={form.playerId} onChange={v => setForm(f => ({ ...f, playerId: v }))} options={myPlayers.map(p => ({ v: p.id, l: p.name }))} t={t}/>
          <Input label="النوع" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={Object.entries(PAY_TYPES).map(([k, v]) => ({ v: k, l: `${v.icon} ${v.label} — ${prices[k] || PRICE_LIST[k]} ر.س` }))} t={t}/>

          <Input label="التاريخ" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          <Input label="ملاحظة" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="اختياري" t={t}/>
          <div style={{ background: t.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: t.text }}>
            المبلغ: <span style={{ color: "#10B981", fontWeight: 900, fontSize: 16 }}>{fmtMoney(prices[form.type] || PRICE_LIST[form.type] || 0)}</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>💾 تسجيل</Btn><Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PARENT PORTAL
══════════════════════════════════════════════════════════ */
function ParentPortal({ user, onLogout, players, groups, coaches, parents, payments, attendance, evals, messages, setMessages, prices, trainings, t, syncStatus }) {
  // 1. Identify the parent from the dynamic parents list
  const parent = parents.find(p => p.id === user.id) || { name: user.name, id: user.id };
  
  // 2. Filter players by parentId — use String() to handle type mismatches
  const myPlayers = players.filter(p => String(p.parentId) === String(user.id));
  
  const [activeChild, setActiveChild] = useState(myPlayers[0]?.id);

  useEffect(() => {
    if (!activeChild && myPlayers.length > 0) {
      setActiveChild(myPlayers[0].id);
    }
  }, [myPlayers, activeChild]);
  const [tab, setTab] = useState("overview");
  const unread = messages.filter(m => m.to === user.id && !m.read).length;
  
  const child      = myPlayers.find(p => p.id === activeChild) || myPlayers[0];
  const childGroup = child ? groups.find(g => g.id === child.groupId) : null;
  const childCoach = childGroup ? coaches.find(c => c.id === childGroup.coachId) : null;
  const childPays  = child ? payments.filter(p => String(p.playerId) === String(child.id)) : [];
  const childAtt   = child ? attendance.filter(a => a.groupId === child.groupId) : [];
  const childEvals = child ? evals.filter(e => e.playerId === child.id) : [];

  // My coaches: find all unique coaches of my children
  const myCoachIds = [...new Set(myPlayers.map(p => {
    const g = groups.find(x => x.id === p.groupId);
    return g?.coachId;
  }).filter(Boolean))];

  const tabs = [
    { id: "overview",   icon: "dashboard",  label: "الرئيسية"    },
    { id: "scores",     icon: "chart",      label: "الأداء"       },
    { id: "attendance", icon: "attendance", label: "الحضور"       },
    { id: "payments",   icon: "payments",   label: "المصاريف"     },
    { id: "schedule",   icon: "schedule",   label: "المواعيد"     },
    { id: "messages",   icon: "messages",   label: "الرسائل",      badge: unread || undefined },
  ];

  return (
    <Shell title={`أهلاً، ${parent.name}`} subtitle="بوابة ولي الأمر" color="#10B981" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} badge="ولي أمر" user={user} t={t} syncStatus={syncStatus}>
      {myPlayers.length > 1 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 18, borderBottom: `1px solid ${t.border}`, paddingBottom: 14 }}>
          {myPlayers.map(p => (
            <button key={p.id} onClick={() => setActiveChild(p.id)}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid", borderColor: activeChild === p.id ? "#10B981" : t.border, background: activeChild === p.id ? "rgba(16,185,129,.12)" : t.bg2, color: activeChild === p.id ? "#10B981" : t.textDim, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Cairo',sans-serif" }}>
              <Avatar name={p.name} size={22} color="#10B981"/>{p.name}
            </button>
          ))}
        </div>
      )}
      {tab === "overview"   && <ParentOverview child={child} childGroup={childGroup} childCoach={childCoach} childPays={childPays} childEvals={childEvals} prices={prices} trainings={trainings} coaches={coaches} t={t} attendance={attendance}/>}
      {tab === "scores"     && <ParentScores child={child} childEvals={childEvals} childCoach={childCoach} t={t}/>}
      {tab === "attendance" && <ParentAttendance child={child} childAtt={childAtt} childPays={childPays} t={t}/>}
      {tab === "payments"   && <ParentPayments child={child} childPays={childPays} prices={prices} t={t} trainings={trainings} attendance={attendance}/>}
      {tab === "schedule"   && <ParentSchedule childGroup={childGroup} childCoach={childCoach} trainings={trainings} t={t}/>}
      {tab === "messages"   && <Messaging messages={messages} setMessages={setMessages} meId={user.id} meName={parent.name} coaches={coaches} parents={parents} t={t} role="parent" myCoachIds={myCoachIds} />}
    </Shell>
  );
}

function ParentOverview({ child, childGroup, childCoach, childPays, childEvals, prices, trainings, coaches, t, attendance }) {
  if (!child) return <div style={{ textAlign: "center", color: t.textFaint, padding: 60 }}>لا يوجد أبناء مسجلين</div>;
  const lastEval  = childEvals.slice(-1)[0];
  const evalCoach = lastEval ? (coaches || []).find(c => c.id === lastEval.coachId) : null;
  const evalCoachName = evalCoach ? evalCoach.name : (childCoach?.name || "طاقم التدريب");
  const monthPaid = childPays.some(p => p.type === "subscription" && p.month === CUR_MONTH);
  const totalPaid = childPays.reduce((a, p) => a + (p.amount || PRICE_LIST[p.type] || 0), 0);

  const subDetails = getPlayerSubscriptionDetails(child, trainings, attendance, childPays);
  const totalPast = subDetails.attendedCount + subDetails.absentCount + subDetails.excusedCount;
  const computedAttendancePct = totalPast > 0 ? Math.round((subDetails.attendedCount / totalPast) * 100) : 100;

  const childSubPays = (childPays || []).filter(pay => pay.type === "subscription");
  const sortedChildPays = [...childSubPays].sort((a, b) => {
    const da = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
    const db = typeof b.date === "string" ? b.date.substring(0, 10) : getLocalDateString(b.date);
    return db.localeCompare(da);
  });
  const latestRenewalDate = sortedChildPays.length > 0 ? formatArabicDate(sortedChildPays[0].date) : "تجديد تلقائي عند التسجيل";

  // Next / Upcoming training logic
  const childTrainings = (trainings || []).filter(tr => tr.groupId === child.groupId && isTrainingActive(tr));
  const currentDayAr = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"][new Date().getDay()];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* 1. Upcoming Trainings Container */}
      {childTrainings.length > 0 && (
        <Card t={t} style={{ 
          padding: 24, 
          background: t.name === "dark" 
            ? "linear-gradient(135deg, #064e3b, #022c22)" 
            : "linear-gradient(135deg, #e6fcf5, #c3fae8)", 
          borderColor: "rgba(16,185,129,0.35)",
          position: "relative",
          overflow: "hidden",
          borderRadius: 20,
          boxShadow: t.name === "dark" ? "0 10px 30px rgba(0,0,0,0.3)" : "0 10px 30px rgba(16,185,129,0.08)",
          animation: "scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both"
        }}>
          {/* Glowing particle orb */}
          <div style={{
            position: "absolute",
            top: "-30px",
            left: "-30px",
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            background: t.name === "dark" ? "rgba(20,184,166,0.18)" : "rgba(16,185,129,0.15)",
            filter: "blur(25px)"
          }} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, position: "relative", zIndex: 1, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22 }}>⚽</span>
              <div>
                <span style={{ fontSize: 14, fontWeight: 800, color: t.name === "dark" ? "#a7f3d0" : "#059669" }}>الجدول القادم للابن {child.name}</span>
                <div style={{ fontSize: 11, color: t.textDim }}>الفريق: {childGroup?.name || ""}</div>
              </div>
            </div>
            
            <div style={{ 
              background: t.name === "dark" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.75)", 
              padding: "8px 16px", 
              borderRadius: 14, 
              border: `1px solid ${t.border}`,
              display: "flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
            }}>
              <Avatar name={childCoach?.name || "كابتن"} size={32} color="#7C49A8" />
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 9, color: t.textFaint, fontWeight: 700 }}>المدرب المسؤول</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: t.text }}>{childCoach?.name || "طاقم التدريب"}</div>
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, position: "relative", zIndex: 1 }}>
            {childTrainings.map((tr, idx) => {
              const isToday = tr.isRecurring ? tr.days.includes(currentDayAr) : (tr.date && new Date(tr.date).toDateString() === new Date().toDateString());
              const typeLabel = tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة") : "تمرين";
              const typeColor = tr.type === "match" ? "#EF4444" : "#10B981";
              
              return (
                <div key={tr.id} style={{ 
                  background: isToday 
                    ? (t.name === "dark" ? "rgba(16,185,129,0.18)" : "rgba(16,185,129,0.08)")
                    : (t.name === "dark" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.5)"), 
                  border: `1px solid ${isToday ? typeColor : t.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isToday ? `0 4px 15px ${typeColor}15` : "none",
                  transition: "transform 0.2s"
                }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{
                        background: typeColor,
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 900,
                        padding: "3px 8px",
                        borderRadius: 20
                      }}>
                        {typeLabel}
                      </span>
                      {isToday && (
                        <span style={{
                          background: "#EF4444",
                          color: "#fff",
                          fontSize: 9,
                          fontWeight: 900,
                          padding: "2px 6px",
                          borderRadius: 20,
                          animation: "pulse 1.8s infinite"
                        }}>
                          اليوم
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: 16, fontWeight: 900, color: t.text, marginBottom: 4 }}>
                      {tr.isRecurring ? tr.days.join(" و ") : (tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { weekday: 'long', day: 'numeric', month: 'short' }) : "مرة واحدة")}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: typeColor, marginBottom: 8 }}>
                      الساعة {tr.time} ({tr.duration} دقيقة)
                    </div>
                    
                    <div style={{ fontSize: 12, color: t.text, fontWeight: 800, marginBottom: 4 }}>
                      {tr.title || (tr.type === "match" ? "مباراة كرة قدم" : "تمرين اعتيادي")}
                    </div>
                    
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: t.textDim, marginBottom: 8 }}>
                      <span>🏟️ {tr.field}</span>
                      {tr.trainingFocus && <span>🎯 {tr.trainingFocus}</span>}
                    </div>
                  </div>

                  {tr.note && (
                    <div style={{ 
                      marginTop: 8, 
                      padding: "6px 10px", 
                      background: t.name === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)", 
                      borderRadius: 8, 
                      fontSize: 10, 
                      color: t.textFaint, 
                      fontStyle: "italic",
                      borderRight: `2px solid ${typeColor}`
                    }}>
                      * {tr.note}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 2. Child Welcome Card */}
      <Card t={t} style={{ 
        padding: 26, 
        background: t.name === "dark" ? "linear-gradient(135deg,#0A1F12,#0C2A1A)" : "linear-gradient(135deg,#EFFDF5,#F0FFF4)", 
        borderColor: "rgba(16,185,129,.2)",
        borderRadius: 20,
        boxShadow: t.name === "dark" ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.02)",
        animation: "fadeUp .5s ease-out both"
      }} className="s1">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ 
              width: 72, 
              height: 72, 
              borderRadius: "50%", 
              background: "linear-gradient(135deg,#10B981,#065F46)", 
              display: "grid", 
              placeItems: "center", 
              fontSize: 28, 
              fontWeight: 900, 
              color: "#fff", 
              boxShadow: "0 0 22px rgba(16,185,129,.3)" 
            }}>{child.name[0]}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 8, color: t.text }}>{child.name}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Chip text={child.position} color="#10B981"/>
                <Chip text={childGroup?.name || "—"} color="#06B6D4"/>
                <Chip text={`مدرب: ${childCoach?.name || "—"}`} color="#7C49A8"/>
                {(() => {
                  const status = (child.status === "موقوف") ? "موقوف" : (child.status === "مجمّد") ? "مجمّد" : (subDetails.isUnpaid || subDetails.isExpired) ? "غير نشط" : "نشط";
                  return <Chip text={status} color={status === "نشط" ? "#10B981" : status === "مجمّد" ? "#3B82F6" : "#EF4444"}/>;
                })()}
              </div>
            </div>
          </div>
          <div style={{ 
            textAlign: "center", 
            background: t.name === "dark" ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.05)",
            padding: "12px 20px",
            borderRadius: 16,
            border: "1px solid rgba(16,185,129,0.12)"
          }}>
            <div style={{ fontSize: lastEval ? 36 : 12, fontWeight: 900, color: "#10B981" }}>{lastEval ? child.score : "لم يتم التقييم"}</div>
            <div style={{ fontSize: 11, color: t.textDim }}>التقييم الكلي</div>
          </div>
        </div>
      </Card>

      {/* 3. Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14 }} className="s2">
        <StatCard label="الأهداف"   counter={child.goals || 0}         icon="⚽" color="#EF4444" t={t}/>
        <StatCard label="التمريرات" counter={child.assists || 0}       icon="🎯" color="#10B981" t={t}/>
        <StatCard label="حضور الاشتراك" value={`${subDetails.attendedCount} / 12`} icon="📅" color="#7C49A8" t={t}/>
        <StatCard label="التقييم"   counter={lastEval ? child.score : undefined} value={lastEval ? undefined : "لم يتم التقييم"} icon="⭐" color="#F59E0B" t={t}/>
      </div>

      {/* Premium Subscription Card */}
      <Card t={t} style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 15, color: t.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <span>📅</span> تفاصيل اشتراك وتحضير الابن (الدورة {subDetails.cycleIndex})
        </div>

        <div style={{ display: "flex", gap: 16, marginBottom: 16, fontSize: 12, color: t.textDim, flexWrap: "wrap", borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }}>
          <span>📅 <strong>تاريخ التسجيل:</strong> {formatArabicDate(child.joinDate)}</span>
          <span>🔄 <strong>آخر تجديد اشتراك:</strong> {latestRenewalDate}</span>
        </div>
        
        {subDetails.isUnpaid ? (
          <div style={{ textAlign: "center", color: "#EF4444", padding: 30, border: `1px dashed #EF4444`, borderRadius: 16, background: "rgba(239,68,68,0.05)" }}>
            <span style={{ fontSize: 24 }}>⚠️</span>
            <div style={{ fontWeight: 800, marginTop: 10 }}>الاشتراك غير نشط</div>
            <div style={{ fontSize: 12, color: t.textDim, marginTop: 4 }}>يرجى سداد دفعة الاشتراك الشهري لتفعيل الحصص التدريبية للابن.</div>
          </div>
        ) : (
          <>
            {subDetails.isExpired && (
              <div style={{ textAlign: "center", color: "#EF4444", padding: 16, border: `1px dashed #EF4444`, borderRadius: 16, background: "rgba(239,68,68,0.05)", marginBottom: 16 }}>
                <span style={{ fontSize: 20 }}>🚨</span>
                <div style={{ fontWeight: 800, marginTop: 6 }}>انتهت الحصص المتاحة (12 / 12)</div>
                <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>يرجى سداد قيمة الاشتراك الشهري للدورة الجديدة لتفعيل حصص إضافية.</div>
              </div>
            )}
            
            <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(16,185,129,0.08)", padding: "12px 8px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(16,185,129,0.12)" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#10B981" }}>{subDetails.attendedCount}</div>
                <div style={{ fontSize: 11, color: t.textDim, fontWeight: 700 }}>حاضر</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(239,68,68,0.08)", padding: "12px 8px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(239,68,68,0.12)" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#EF4444" }}>{subDetails.absentCount}</div>
                <div style={{ fontSize: 11, color: t.textDim, fontWeight: 700 }}>غائب</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: "rgba(245,158,11,0.08)", padding: "12px 8px", borderRadius: 14, textAlign: "center", border: "1px solid rgba(245,158,11,0.12)" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#F59E0B" }}>{subDetails.excusedCount}</div>
                <div style={{ fontSize: 11, color: t.textDim, fontWeight: 700 }}>بعذر</div>
              </div>
              <div style={{ flex: 1, minWidth: 80, background: t.bg2, padding: "12px 8px", borderRadius: 14, textAlign: "center", border: `1px solid ${t.border}` }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: t.textDim }}>{subDetails.remainingCount}</div>
                <div style={{ fontSize: 11, color: t.textDim, fontWeight: 700 }}>متبقي</div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 12 }}>
              {subDetails.cycleSessions.map((s, idx) => {
                let bgColor = t.bg2;
                let borderCol = t.border;
                let textColor = t.textDim;
                let icon = "⭕";
                
                if (s.isFrozen) {
                  bgColor = "rgba(59,130,246,0.08)";
                  borderCol = "rgba(59,130,246,0.2)";
                  textColor = "#3B82F6";
                  icon = "❄️";
                } else if (!s.isFuture) {
                  if (s.status === "حاضر") {
                    bgColor = "rgba(16,185,129,0.08)";
                    borderCol = "rgba(16,185,129,0.2)";
                    textColor = "#10B981";
                    icon = "✅";
                  } else if (s.status === "غائب") {
                    bgColor = "rgba(239,68,68,0.08)";
                    borderCol = "rgba(239,68,68,0.2)";
                    textColor = "#EF4444";
                    icon = "❌";
                  } else if (s.status === "بعذر") {
                    bgColor = "rgba(245,158,11,0.08)";
                    borderCol = "rgba(245,158,11,0.2)";
                    textColor = "#F59E0B";
                    icon = "⚠️";
                  }
                }
                
                return (
                  <div key={idx} style={{ background: bgColor, border: `1px solid ${borderCol}`, padding: "12px 8px", borderRadius: 16, textAlign: "center", display: "flex", flexDirection: "column", gap: 5, alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.01)" }}>
                    <div style={{ fontSize: 11, color: t.textFaint, fontWeight: 700 }}>حصة {idx + 1}</div>
                    <div style={{ fontSize: 16 }}>{icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: textColor }}>{s.isFrozen ? "مجمّد" : formatArabicDate(s.date)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {/* 4. Active details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="s3">
        <Card t={t} style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>📝</span> حالة التقييم المهارى
          </div>
          {lastEval ? (
            <div>
              <div style={{ fontSize: 11, color: t.textDim, marginBottom: 16 }}>آخر تقييم بتاريخ: {lastEval.date} · الكابتن {evalCoachName}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <SkillBar label="السرعة" val={lastEval.speed} color="#06B6D4" t={t}/>
                <SkillBar label="التقنية" val={lastEval.technique} color="#7C49A8" t={t}/>
                <SkillBar label="العمل الجماعي" val={lastEval.teamwork} color="#F59E0B" t={t}/>
              </div>
              {lastEval.note && (
                <div style={{ 
                  background: t.name === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)", 
                  borderRadius: 14, 
                  padding: "12px 16px", 
                  fontSize: 12, 
                  color: t.textDim, 
                  lineHeight: 1.7, 
                  marginTop: 18,
                  border: `1px dashed ${t.border}`
                }}>
                  " {lastEval.note} "
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", color: t.textFaint, padding: "40px 0", fontSize: 13 }}>لم يتم تقييم اللاعب بعد من قبل المدرب.</div>
          )}
        </Card>

        <Card t={t} style={{ padding: 22, borderRadius: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span>💰</span> ملخص المدفوعات والاشتراك
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }}>
            <div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "#10B981" }}>{fmtMoney(totalPaid)}</div>
              <div style={{ fontSize: 11, color: t.textDim }}>إجمالي المدفوعات المستلمة</div>
            </div>
            <div style={{ textAlign: "left" }}>
              <span style={{
                background: subDetails.isUnpaid ? "rgba(239,68,68,0.12)" : subDetails.isExpired ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
                color: subDetails.isUnpaid ? "#EF4444" : subDetails.isExpired ? "#F59E0B" : "#10B981",
                padding: "6px 12px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 800
              }}>
                {subDetails.isUnpaid ? "⚠️ اشتراك غير مسدد" : subDetails.isExpired ? "🚨 الحصص منتهية" : `✅ الاشتراك نشط (${subDetails.attendedCount} / 12)`}
              </span>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {childPays.slice(-3).map((p, idx) => {
              const pt = PAY_TYPES[p.type] || { icon: "💳", label: "رسوم", color: "#10B981" };
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 12, background: t.bg2, fontSize: 12, border: `1px solid ${t.border}` }}>
                  <span style={{ color: t.textDim, fontWeight: 600 }}>{pt.icon} {pt.label} · {p.month}</span>
                  <span style={{ fontWeight: 800, color: pt.color }}>{fmtMoney(p.amount || PRICE_LIST[p.type] || 0)}</span>
                </div>
              );
            })}
            {childPays.length === 0 && (
              <div style={{ textAlign: "center", color: t.textFaint, padding: "20px 0" }}>لا يوجد فواتير مسجلة</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ParentScores({ child, childEvals, childCoach, t }) {
  if (!child) return null;
  const lastEval = childEvals.slice(-1)[0];
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="s1">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📊 المهارات الحالية</div>
          {lastEval ? (
            <div>
              <SkillBar label="السرعة"         val={lastEval.speed}     color="#06B6D4" t={t}/>
              <SkillBar label="التقنية"        val={lastEval.technique} color="#7C49A8" t={t}/>
              <SkillBar label="العمل الجماعي" val={lastEval.teamwork}  color="#F59E0B" t={t}/>
            </div>
          ) : (
            <div style={{ textAlign: "center", color: t.textFaint, padding: "30px 0", fontSize: 13 }}>لم يتم تقييم مهارات اللاعب بعد</div>
          )}
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>⚽ إحصائيات الموسم</div>
          {[["الأهداف", child.goals, "⚽", "#EF4444"], ["التمريرات", child.assists, "🎯", "#10B981"], ["الحضور", `${child.attendancePct}%`, "📅", "#7C49A8"], ["التقييم", lastEval ? child.score : "لم يتم التقييم", "⭐", "#F59E0B"]].map(([l, v, i, c]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
              <span style={{ color: t.textDim }}>{i} {l}</span>
              <span style={{ fontWeight: 800, color: c }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card t={t} style={{ padding: 22 }} className="s2">
        <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>📝 تقييمات المدرب ({childCoach?.name})</div>
        {childEvals.length === 0
          ? <div style={{ textAlign: "center", color: t.textFaint, padding: 30 }}>لا توجد تقييمات بعد</div>
          : childEvals.slice().reverse().map(e => (
            <div key={e.id} style={{ padding: "14px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#A78BFA" }}>{e.date}</span>
                <div style={{ display: "flex", gap: 7 }}>
                  <Chip text={`سرعة ${e.speed}`} color="#06B6D4"/>
                  <Chip text={`تقنية ${e.technique}`} color="#7C49A8"/>
                  <Chip text={`فريق ${e.teamwork}`} color="#F59E0B"/>
                </div>
              </div>
              {e.note && <div style={{ background: t.bg, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: t.textDim, lineHeight: 1.7 }}>"{e.note}"</div>}
            </div>
          ))
        }
      </Card>
    </div>
  );
}

function ParentAttendance({ child, childAtt, childPays, t }) {
  // Find the first subscription payment date
  const childSubPays = (childPays || []).filter(pay => pay.type === "subscription");
  const sortedSubPays = [...childSubPays].sort((a, b) => {
    const da = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
    const db = typeof b.date === "string" ? b.date.substring(0, 10) : getLocalDateString(b.date);
    return da.localeCompare(db);
  });
  const firstSubDate = sortedSubPays[0]
    ? (typeof sortedSubPays[0].date === "string" ? sortedSubPays[0].date.substring(0, 10) : getLocalDateString(sortedSubPays[0].date))
    : "";

  const allRecords = childAtt.flatMap(a => {
    const aDateStr = typeof a.date === "string" ? a.date.substring(0, 10) : getLocalDateString(a.date);
    // Ignore attendance records before the child's subscription start date
    if (firstSubDate && aDateStr < firstSubDate) {
      return [];
    }
    return Object.entries(a.records)
      .filter(([pid]) => String(pid) === String(child?.id))
      .map(([, s]) => ({ date: aDateStr, status: s }));
  });
  const present = allRecords.filter(r => r.status === "حاضر").length;
  const absent  = allRecords.filter(r => r.status === "غائب").length;
  const excuse  = allRecords.filter(r => r.status === "بعذر").length;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }} className="s1">
        <StatCard label="إجمالي الجلسات" counter={allRecords.length} icon="📅" color="#7C49A8" t={t}/>
        <StatCard label="حاضر"   counter={present} icon="✅" color="#10B981" t={t}/>
        <StatCard label="غائب"   counter={absent}  icon="❌" color="#EF4444" t={t}/>
        <StatCard label="بعذر"   counter={excuse}  icon="⚠️" color="#F59E0B" t={t}/>
      </div>
      <Card t={t} style={{ overflow: "hidden" }} className="s2">
        <div style={{ background: t.bg, padding: "12px 18px", borderBottom: `1px solid ${t.border}`, fontWeight: 700, fontSize: 13, color: t.text }}>سجل حضور {child?.name}</div>
        {allRecords.length === 0
          ? <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>لا يوجد سجل حضور بعد</div>
          : allRecords.slice().reverse().map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: `1px solid ${t.border}` }}>
              <span style={{ fontSize: 13, color: t.text }}>{formatArabicDate(r.date)} ({r.date})</span>
              <Chip text={r.status} color={ATT_C[r.status]}/>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

function ParentPayments({ child, childPays, prices, t, trainings, attendance }) {
  const total     = childPays.reduce((a, p) => a + p.amount, 0);
  const byType    = Object.entries(PAY_TYPES).map(([k, v]) => ({ k, ...v, paid: childPays.filter(p => p.type === k).reduce((a, p) => a + p.amount, 0), count: childPays.filter(p => p.type === k).length }));
  const subDetails = getPlayerSubscriptionDetails(child, trainings, attendance, childPays);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }} className="s1">
        <StatCard label="إجمالي المدفوعات" counter={total} value={fmtMoney(total)} icon="💰" color="#10B981" t={t}/>
        <StatCard label="عدد العمليات" counter={childPays.length} icon="🧾" color="#7C49A8" t={t}/>
        <StatCard label="حالة الاشتراك الحالي" value={subDetails.isUnpaid ? "غير مسدد ⚠️" : subDetails.isExpired ? "منتهي 🚨" : "نشط ✅"} icon="📋" color={subDetails.isUnpaid ? "#EF4444" : subDetails.isExpired ? "#F59E0B" : "#10B981"} t={t}/>
      </div>
      {subDetails.isUnpaid && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: 16, marginBottom: 18, fontSize: 13, color: "#FCA5A5" }}>⚠️ الاشتراك الحالي غير مسدد — يرجى سداد دفعة الاشتراك لتفعيل الحصص التدريبية. المبلغ المطلوب: <strong>{fmtMoney(prices.subscription)}</strong></div>}
      {(!subDetails.isUnpaid && subDetails.isExpired) && <div style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 12, padding: 16, marginBottom: 18, fontSize: 13, color: "#FBCFE8" }}>🚨 انتهت حصص الاشتراك الحالي (12 / 12) — يرجى تجديد الاشتراك لتفعيل الحصص الجديدة. المبلغ المطلوب: <strong>{fmtMoney(prices.subscription)}</strong></div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18 }} className="s2">
        {byType.filter(tb => tb.count > 0).map(tb => (
          <Card key={tb.k} t={t} style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{tb.icon}</span>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{tb.label}</div><div style={{ fontSize: 11, color: t.textDim }}>{tb.count} مرة</div></div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: tb.color }}>{fmtMoney(tb.paid)}</div>
          </Card>
        ))}
      </div>
      <Card t={t} style={{ overflow: "hidden" }} className="s3">
        <div style={{ background: t.bg, padding: "12px 18px", borderBottom: `1px solid ${t.border}`, fontWeight: 700, fontSize: 13, color: t.text }}>📋 تفاصيل الدفعات</div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
              {["النوع", "الشهر", "المبلغ", "استلم المدرب", "التاريخ", "ملاحظة"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {childPays.slice().reverse().map(p => {
              const pt = PAY_TYPES[p.type];
              return (
                <tr key={p.id} className={t.name === "dark" ? "rh" : "rhl"} style={{ borderBottom: `1px solid ${t.border}`, transition: "background .15s" }}>
                  <td style={{ padding: "10px 14px" }}><Chip text={`${pt.icon} ${pt.label}`} color={pt.color}/></td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: t.textDim }}>{p.month}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: pt.color }}>{fmtMoney(p.amount)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>{p.coachName}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: t.textDim }}>{p.date}</td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: t.textDim }}>{p.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function ParentSchedule({ childGroup, childCoach, trainings, t }) {
  if (!childGroup) return <div style={{ textAlign: "center", color: t.textFaint, padding: 60 }}>لا توجد بيانات</div>;
  const myTrainings = (trainings || []).filter(tr => tr.groupId === childGroup.id && isTrainingActive(tr));
  
  return (
    <div>
      <Card t={t} style={{ padding: 26, marginBottom: 20, background: t.name === "dark" ? "rgba(124,73,168,.05)" : "rgba(124,73,168,.02)", borderColor: "rgba(124,73,168,.2)" }} className="s1">
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(124,73,168,.1)", display: "grid", placeItems: "center" }}>
            <AnimIcon type="schedule" size={24} color="#7C49A8"/>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: t.text }}>الجدول الزمني للفعاليات والتمارين</div>
            <div style={{ fontSize: 12, color: t.textDim }}>مجموعة {childGroup.name} · مدرب {childCoach?.name}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {myTrainings.map((tr, i) => {
            const typeLabel = tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة") : "تمرين";
            const typeColor = tr.type === "match" ? "#EF4444" : "#10B981";
            return (
              <div key={tr.id} style={{ background: t.bg, borderRadius: 10, padding: 14, border: `1px solid ${t.border}` }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                  <Chip text={typeLabel} color={typeColor} size={9}/>
                  <Chip text={tr.isRecurring ? "متكرر" : "مرة واحدة"} color={t.textDim} size={9}/>
                </div>
                <div style={{ fontSize: 12, color: t.textDim, marginBottom: 6 }}>
                  {tr.isRecurring ? tr.days.join(" و ") : (tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { day: 'numeric', month: 'short' }) : "مرة واحدة")}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: typeColor }}>{tr.time}</div>
                <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>🏟 {tr.field} · ⏱ {tr.duration} دق</div>
              </div>
            );
          })}
          {myTrainings.length === 0 && <div style={{ color: t.textDim }}>لا توجد تمارين محددة بعد</div>}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <Card t={t} style={{ padding: 22 }} className="s2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
              <AnimIcon type="trophy" size={16} color="#D8A435"/> الفعاليات القادمة
            </div>
            <Chip text={`${myTrainings.length} فعالية مجدولة`} color="#7C49A8"/>
          </div>
          
          {myTrainings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: t.textFaint }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: 13 }}>لا توجد تمارين أو مباريات إضافية مجدولة حالياً</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myTrainings.slice().reverse().map((tr, idx) => {
                const trDate = tr.date ? new Date(tr.date) : null;
                const dateNum = trDate ? trDate.getDate() : (tr.isRecurring ? "🔄" : "?");
                const monthName = trDate ? trDate.toLocaleDateString('ar-EG', { month: 'short' }) : (tr.days?.[0] || "موعد");
                const typeLabel = tr.type === "match" ? (tr.isFriendly ? "مباراة ودية" : "مباراة") : "تمرين";
                const typeColor = tr.type === "match" ? "#EF4444" : "#7C49A8";
                
                return (
                  <div key={tr.id} style={{ display: "flex", gap: 16, padding: 16, borderRadius: 14, background: t.bg3, border: `1px solid ${t.border}`, animation: `fadeUp .4s ${idx * 0.1}s both` }}>
                    <div style={{ width: 60, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: typeColor }}>{dateNum}</div>
                      <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase" }}>{monthName}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                        <Chip text={typeLabel} color={typeColor} size={9}/>
                        <Chip text={tr.isRecurring ? "متكرر" : "مرة واحدة"} color={t.textDim} size={9}/>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 4 }}>{tr.title || (tr.type === "match" ? "مباراة" : "تمرين")}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: t.textDim }}>
                        <span>⏰ {tr.time}</span>
                        <span>🏟 {tr.field}</span>
                      </div>
                      {tr.note && <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(124,73,168,.05)", borderRadius: 8, fontSize: 11, color: t.textMid, borderRight: `3px solid ${typeColor}` }}>{tr.note}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card t={t} style={{ padding: 22 }} className="s3">
          <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
            <AnimIcon type="schedule" size={16} color="#06B6D4"/> المواعيد المجدولة
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {myTrainings.map((tr, i) => (
              <div key={tr.id} style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 12, borderBottom: i < myTrainings.length - 1 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ width: 80, textAlign: "center", background: `rgba(6,182,212,.1)`, border: `1px solid rgba(6,182,212,.2)`, borderRadius: 8, padding: "6px" }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#06B6D4" }}>
                    {tr.isRecurring ? tr.days.join(" · ") : (tr.date ? new Date(tr.date).toLocaleDateString("ar-EG", { day: 'numeric', month: 'short' }) : "مرة واحدة")}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{tr.time} ({tr.duration} دق)</div>
                  <div style={{ fontSize: 11, color: t.textDim }}>{tr.field} · {tr.trainingFocus || "تطوير مهارات"}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, padding: 14, background: "rgba(216,164,53,.06)", borderRadius: 12, border: "1px solid rgba(216,164,53,.1)" }}>
            <div style={{ fontSize: 11, color: "#D8A435", fontWeight: 700, marginBottom: 4 }}>💡 ملاحظة هامة:</div>
            <div style={{ fontSize: 10, color: t.textMid, lineHeight: 1.5 }}>يرجى الالتزام بالحضور قبل موعد التمرين بـ 15 دقيقة على الأقل لتجهيز اللاعبين.</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MESSAGING (shared)
══════════════════════════════════════════════════════════ */
const QUICK_TEMPLATES = [
  { label: "ترحيب", text: "أهلاً بك في نادي نجد الرياضي. يسعدنا انضمامكم إلينا." },
  { label: "تذكير سداد", text: "نحيطكم علماً بضرورة سداد الرسوم الشهرية لضمان استمرارية التدريب." },
  { label: "تأجيل تدريب", text: "نعتذر عن إلغاء تدريب اليوم لظروف طارئة، وسيتم التعويض في وقت لاحق." },
  { label: "تقييم جديد", text: "تم تحديث التقييم الفني للاعب، يرجى الاطلاع عليه من لوحة التحكم." },
];

function Messaging({ messages, setMessages, meId, meName, coaches, parents, t, role, myGroupId, myPlayerIds, myCoachIds, players }) {
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ to: [], text: "", files: [] });
  const [filterType, setFilterType] = useState("all");
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [chatText, setChatText] = useState("");
  const chatEndRef = useRef(null);

  const mine = (messages || []).filter(m => m.from === meId || m.to === meId);
  const markRead = id => setMessages(ms => ms.map(m => m.id === id ? { ...m, read: true } : m));

  const templates = (() => {
    if (role === "admin") {
      return [
        { label: "ترحيب باللاعبين", text: "أهلاً بك في نادي نجد الرياضي. يسعدنا انضمامكم إلينا متمنين لكم رحلة تدريبية متميزة." },
        { label: "تذكير سداد الرسوم", text: "نحيطكم علماً بضرورة سداد الرسوم الشهرية المستحقة لضمان استمرارية التدريب." },
        { label: "إشعار إداري", text: "نود تذكيركم بضرورة الالتزام بالقواعد والزي الرسمي للأكاديمية خلال الحصص التدريبية." },
        { label: "عطلة رسمية", text: "نحيطكم علماً بأنه سيتم إيقاف التدريبات مؤقتاً خلال فترة الإجازة الرسمية المعلنة." }
      ];
    } else if (role === "coach") {
      return [
        { label: "تأجيل تمرين", text: "نعتذر عن إلغاء تمرين اليوم لظروف طارئة، وسيتم تعويض الحصة في موعد يُحدد لاحقاً." },
        { label: "تقييم جديد للابن", text: "تم تحديث التقييم الفني والبدني للاعب، يرجى الاطلاع عليه من بوابتكم لمتابعة أدائه." },
        { label: "التزام بالموعد", text: "نرجو حث اللاعبين على الحضور في الوقت المحدد تماماً للتمرين مع لبس الزي الرسمي." },
        { label: "استفسار عن غياب", text: "السلام عليكم، نود الاطمئنان على صحة اللاعب وسبب غيابه عن الحصص التدريبية الأخيرة." }
      ];
    } else { // parent
      return [
        { label: "إخطار غياب لاعب", text: "السلام عليكم، أود إبلاغكم بغياب ابني عن تمرين اليوم لظرف طارئ/صحي." },
        { label: "استفسار عن مستوى", text: "السلام عليكم كابتن، أود الاستفسار عن تطور مستوى ابني الفني والبدني في التدريبات." },
        { label: "مشكلة سداد رسوم", text: "السلام عليكم، واجهتني مشكلة أثناء سداد الرسوم الشهرية، أرجو توجيهي لكيفية حلها." },
        { label: "رسالة شكر", text: "خالص الشكر والتقدير لكم كابتن ولإدارة النادي على جهودكم الملموسة ورعايتكم لأبنائنا." }
      ];
    }
  })();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activePartnerId, messages]);

  // Mark incoming messages as read when chat is open
  useEffect(() => {
    if (activePartnerId) {
      mine.forEach(m => {
        if (m.from === activePartnerId && m.to === meId && !m.read) {
          markRead(m.id);
        }
      });
    }
  }, [activePartnerId, messages]);

  // Helper to check if msg A is newer than msg B
  const isNewer = (a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    if (dateA - dateB !== 0) return dateA > dateB;
    const tsA = parseInt(a.id?.match(/\d+/)?.[0] || 0);
    const tsB = parseInt(b.id?.match(/\d+/)?.[0] || 0);
    return tsA > tsB;
  };

  // Group messages into WhatsApp-style conversations
  const conversationsMap = {};
  mine.forEach(m => {
    const partnerId = m.from === meId ? m.to : m.from;
    const partnerName = m.from === meId ? m.toName : m.fromName;
    
    if (!conversationsMap[partnerId]) {
      conversationsMap[partnerId] = {
        partnerId,
        partnerName,
        messages: [],
        lastMessage: m,
        unreadCount: 0
      };
    }
    
    conversationsMap[partnerId].messages.push(m);
    
    if (isNewer(m, conversationsMap[partnerId].lastMessage)) {
      conversationsMap[partnerId].lastMessage = m;
    }

    if (m.to === meId && !m.read) {
      conversationsMap[partnerId].unreadCount++;
    }
  });

  const sortedConversations = Object.values(conversationsMap).sort((a, b) => {
    const dateA = new Date(a.lastMessage.date || 0);
    const dateB = new Date(b.lastMessage.date || 0);
    return dateB - dateA;
  });

  const send = () => {
    if (!form.to.length || !form.text.trim()) return;
    
    const newMsgs = form.to.map(targetId => {
      let targetName = "";
      if (targetId === "admin") targetName = "الإدارة";
      else {
        const c = (coaches || []).find(x => x.id === targetId);
        const p = (parents || []).find(x => x.id === targetId);
        targetName = c?.name || p?.name || "مستخدم";
      }

      return {
        id: `msg${Date.now()}-${targetId}`,
        from: meId,
        fromName: meName,
        to: targetId,
        toName: targetName,
        text: form.text,
        files: form.files,
        date: getLocalDateString(new Date()),
        read: false
      };
    });

    if (API_URL) {
      newMsgs.forEach(m => {
        fetch(`${API_URL}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(m)
        }).catch(console.error);
      });
    }

    setMessages(ms => [...ms, ...newMsgs]);
    setForm({ to: [], text: "", files: [] });
    setCompose(false);
    alert("تم إرسال الرسائل بنجاح");
  };

  const sendQuickMessage = () => {
    if (!chatText.trim() || !activePartnerId) return;

    const partnerConv = conversationsMap[activePartnerId];
    const targetName = partnerConv ? partnerConv.partnerName : "مستخدم";

    const newMsg = {
      id: `msg${Date.now()}-${activePartnerId}`,
      from: meId,
      fromName: meName,
      to: activePartnerId,
      toName: targetName,
      text: chatText.trim(),
      files: [],
      date: getLocalDateString(new Date()),
      read: false
    };

    if (API_URL) {
      fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMsg)
      }).catch(console.error);
    }

    setMessages(ms => [...ms, newMsg]);
    setChatText("");
  };

  // Role-based Contact Filtering
  let filteredContacts = [
    { id: "admin", name: "الإدارة", type: "admin" },
    ...(coaches || []).map(c => ({ id: c.id, name: c.name, type: "coach", groupId: c.groupId })),
    ...(parents || []).map(p => ({ id: p.id, name: p.name, type: "parent" })),
  ].filter(c => c.id !== meId);

  if (role === "parent") {
    const safeCoachIds = myCoachIds || [];
    filteredContacts = filteredContacts.filter(c => c.type === "admin" || (c.type === "coach" && safeCoachIds.includes(c.id)));
  } else if (role === "coach") {
    if (myGroupId) {
      const myGroupPlayerIds = (players || []).filter(p => p.groupId === myGroupId).map(p => p.parentId);
      filteredContacts = filteredContacts.filter(c => c.type === "admin" || (c.type === "parent" && myGroupPlayerIds.includes(c.id)));
    } else {
      filteredContacts = filteredContacts.filter(c => c.type === "admin" || c.type === "parent");
    }
  }

  const allContacts = filteredContacts;

  const toggleRecipient = (id) => {
    setForm(f => {
      const isSelected = f.to.includes(id);
      return { ...f, to: isSelected ? f.to.filter(x => x !== id) : [...f.to, id] };
    });
  };

  const selectGroup = (type) => {
    const ids = allContacts.filter(c => type === "all" || c.type === type).map(c => c.id);
    setForm(f => ({ ...f, to: ids }));
  };

  const getPartnerDisplay = (partnerId, partnerName) => {
    if (partnerId === "admin") return { type: "إدارة", color: "#7C49A8" };
    const isCoach = (coaches || []).some(c => c.id === partnerId);
    if (isCoach) return { type: "مدرب", color: "#06B6D4" };
    return { type: "ولي أمر", color: "#10B981" };
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: t.textDim }}>{sortedConversations.length} محادثة نشطة</div>
        <Btn onClick={() => setCompose(true)} style={{ padding: "10px 22px", borderRadius: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "inline-block" }}>✉️</span>
            <span>إنشاء رسالة جديدة</span>
          </div>
        </Btn>
      </div>

      {/* Conversations List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {sortedConversations.map((conv, i) => {
          const display = getPartnerDisplay(conv.partnerId, conv.partnerName);
          const hasUnread = conv.unreadCount > 0;
          return (
            <div key={conv.partnerId} onClick={() => setActivePartnerId(conv.partnerId)}
              style={{ 
                background: hasUnread ? (t.name === "dark" ? "rgba(124,73,168,.08)" : "#F5F0FF") : t.bg2, 
                border: `1px solid ${hasUnread ? "rgba(124,73,168,.4)" : t.border}`, 
                borderRadius: 18, 
                padding: "16px 20px", 
                cursor: "pointer", 
                transition: "all .2s", 
                boxShadow: hasUnread ? "0 5px 15px rgba(124,73,168,.05)" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "none"}>
              
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
                <Avatar name={conv.partnerName} size={42} color={display.color}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{conv.partnerName}</span>
                    <Chip text={display.type} color={display.color} size={9}/>
                  </div>
                  <div style={{ fontSize: 12, color: hasUnread ? t.text : t.textDim, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "90%" }}>
                    {conv.lastMessage.from === meId ? "أنت: " : ""}{conv.lastMessage.text}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <span style={{ fontSize: 10, color: t.textFaint }}>{conv.lastMessage.date}</span>
                {hasUnread && (
                  <div style={{ background: "#7C49A8", color: "#fff", minWidth: 18, height: 18, borderRadius: 9, display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700, padding: "0 5px" }}>
                    {conv.unreadCount}
                  </div>
                )}
              </div>

            </div>
          );
        })}
        
        {sortedConversations.length === 0 && (
          <div style={{ padding: 80, textAlign: "center", color: t.textFaint }}>
            <div style={{ fontSize: 40, marginBottom: 15 }}>📨</div>
            <div>لا توجد محادثات نشطة حالياً. ابدأ بإرسال رسالة جديدة.</div>
          </div>
        )}
      </div>

      {/* WhatsApp Chat Modal */}
      {activePartnerId && (() => {
        const conv = conversationsMap[activePartnerId];
        const partnerName = conv ? conv.partnerName : "محادثة";
        const display = getPartnerDisplay(activePartnerId, partnerName);
        const chatMsgs = conv ? conv.messages.slice().sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          if (dateA - dateB !== 0) return dateA - dateB;
          const tsA = parseInt(a.id?.match(/\d+/)?.[0] || 0);
          const tsB = parseInt(b.id?.match(/\d+/)?.[0] || 0);
          return tsA - tsB;
        }) : [];

        return (
          <Modal title="" onClose={() => setActivePartnerId(null)} wide t={t} footer={null} style={{ padding: 0 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${t.border}`, padding: "16px 20px", background: t.bg2, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={partnerName} size={40} color={display.color}/>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{partnerName}</div>
                  <div style={{ fontSize: 10, color: display.color, fontWeight: 700 }}>{display.type}</div>
                </div>
              </div>
              <button onClick={() => setActivePartnerId(null)} style={{ background: "transparent", border: "none", color: t.textDim, fontSize: 18, cursor: "pointer", marginRight: "auto" }}>✕</button>
            </div>

            {/* Chat Messages Body */}
            <div style={{ height: 350, overflowY: "auto", padding: 20, background: t.name === "dark" ? "#0A0812" : "#F8F6FC", display: "flex", flexDirection: "column", gap: 14 }}>
              {chatMsgs.map(m => {
                const isMe = m.from === meId;
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", width: "100%" }}>
                    <div style={{ 
                      maxWidth: "75%", 
                      background: isMe ? (t.name === "dark" ? "linear-gradient(135deg,#7C49A8,#5A2D82)" : "#7C49A8") : (t.name === "dark" ? "#1B172C" : "#fff"), 
                      color: isMe ? "#fff" : t.text, 
                      borderRadius: 16, 
                      borderTopRightRadius: isMe ? 4 : 16,
                      borderTopLeftRadius: isMe ? 16 : 4,
                      padding: "12px 16px", 
                      boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                      border: isMe ? "none" : `1px solid ${t.border}`
                    }}>
                      <div style={{ fontSize: 13, lineHeight: 1.6, wordBreak: "break-word" }}>{m.text}</div>
                      
                      {m.files?.length > 0 && (
                        <div style={{ marginTop: 8, borderTop: `1px solid ${isMe ? "rgba(255,255,255,.2)" : t.border}`, paddingTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {m.files.map((f, fi) => (
                            <div key={fi} style={{ background: isMe ? "rgba(255,255,255,.15)" : t.bg2, padding: "4px 8px", borderRadius: 6, fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                              📎 {f.name}
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ fontSize: 9, opacity: .7, textAlign: "left", marginTop: 4 }}>{m.date}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div style={{ padding: "14px 20px", background: t.bg2, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, display: "flex", gap: 10, alignItems: "center", borderTop: `1px solid ${t.border}` }}>
              <input type="text" value={chatText} onChange={e => setChatText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendQuickMessage()}
                placeholder="اكتب رسالتك هنا واضغط Enter للإرسال..."
                style={{ flex: 1, background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: "12px 16px", color: t.text, fontSize: 13, outline: "none", fontFamily: "'Cairo',sans-serif" }}/>
              
              <button onClick={sendQuickMessage} disabled={!chatText.trim()}
                style={{ 
                  background: chatText.trim() ? "linear-gradient(135deg,#7C49A8,#5A2D82)" : t.border, 
                  color: "#fff", 
                  border: "none", 
                  width: 44, 
                  height: 44, 
                  borderRadius: 12, 
                  display: "grid", 
                  placeItems: "center", 
                  cursor: chatText.trim() ? "pointer" : "default", 
                  fontSize: 16,
                  transition: "all .2s"
                }}>
                🚀
              </button>
            </div>
          </Modal>
        );
      })()}

      {compose && (
        <Modal title="✉️ إنشاء رسالة ذكية" onClose={() => setCompose(false)} wide t={t}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20 }}>
            <div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: t.textDim, fontWeight: 700, display: "block", marginBottom: 10 }}>المستلمون ({form.to.length})</label>
                
                {/* Section Filters */}
                <div style={{ display: "flex", background: t.bg, borderRadius: 10, padding: 4, marginBottom: 12, border: `1px solid ${t.border}` }}>
                  <button onClick={() => setFilterType("all")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "all" ? "#7C49A8" : "transparent", color: filterType === "all" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>الكل</button>
                  
                  {role !== "admin" && (
                    <button onClick={() => setFilterType("admin")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "admin" ? "#7C49A8" : "transparent", color: filterType === "admin" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>الإدارة</button>
                  )}
                  
                  {role !== "coach" && (
                    <button onClick={() => setFilterType("coach")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "coach" ? "#06B6D4" : "transparent", color: filterType === "coach" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>المدربين</button>
                  )}
                  
                  {role !== "parent" && (
                    <button onClick={() => setFilterType("parent")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "parent" ? "#10B981" : "transparent", color: filterType === "parent" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>أولياء الأمور</button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <button onClick={() => selectGroup(filterType)} 
                    style={{ 
                      padding: "6px 14px", 
                      borderRadius: 8, 
                      border: `1px solid ${
                        filterType === 'all' ? '#7C49A8' : 
                        filterType === 'coach' ? '#06B6D4' : 
                        filterType === 'admin' ? '#7C49A8' : '#10B981'
                      }`, 
                      background: "transparent", 
                      color: t.text, 
                      fontSize: 10, 
                      cursor: "pointer", 
                      fontWeight: 600 
                    }}>
                    تحديد كل {
                      filterType === "all" ? "القائمة" : 
                      filterType === "coach" ? "المدربين" : 
                      filterType === "admin" ? "الإدارة" : "أولياء الأمور"
                    }
                  </button>
                  <button onClick={() => setForm(f => ({ ...f, to: [] }))} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent", color: t.textDim, fontSize: 10, cursor: "pointer" }}>إلغاء التحديد</button>
                </div>

                <div style={{ maxHeight: 180, overflowY: "auto", background: t.inputBg, borderRadius: 12, padding: 10, border: `1px solid ${t.border}` }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {allContacts.filter(c => filterType === "all" || c.type === filterType).map(c => (
                      <div key={c.id} onClick={() => toggleRecipient(c.id)} style={{ padding: "8px 10px", borderRadius: 8, background: form.to.includes(c.id) ? "rgba(124,73,168,.12)" : "transparent", border: `1px solid ${form.to.includes(c.id) ? "#7C49A8" : "transparent"}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `1px solid ${form.to.includes(c.id) ? "#7C49A8" : t.border}`, display: "grid", placeItems: "center" }}>
                          {form.to.includes(c.id) && <div style={{ width: 8, height: 8, borderRadius: 2, background: "#7C49A8" }}/>}
                        </div>
                        <span style={{ color: form.to.includes(c.id) ? t.text : t.textDim }}>{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={{ fontSize: 12, color: t.textDim, fontWeight: 700 }}>نص الرسالة</label>
                  <div style={{ fontSize: 10, color: t.textFaint }}>{form.text.length}/500</div>
                </div>
                <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={5} placeholder="اكتب رسالتك هنا..."
                  style={{ width: "100%", background: t.inputBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: "14px 16px", color: t.text, fontSize: 14, resize: "none", outline: "none", fontFamily: "'Cairo',sans-serif", lineHeight: 1.6 }}/>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: t.textDim, fontWeight: 700, display: "block", marginBottom: 10 }}>المرفقات 📎</label>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {form.files.map((f, idx) => (
                    <div key={idx} style={{ background: "rgba(124,73,168,.1)", padding: "8px 12px", borderRadius: 10, fontSize: 11, display: "flex", alignItems: "center", gap: 10 }}>
                      <span>📄 {f.name}</span>
                      <button onClick={() => setForm(f => ({ ...f, files: f.files.filter((_, i) => i !== idx) }))} style={{ border: "none", background: "none", color: "#EF4444", cursor: "pointer", fontWeight: 900 }}>✕</button>
                    </div>
                  ))}
                  <label style={{ width: 40, height: 40, borderRadius: 10, background: t.bg2, border: `2px dashed ${t.border}`, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 18 }}>
                    +
                    <input type="file" multiple style={{ display: "none" }} onChange={e => {
                      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, size: f.size }));
                      setForm(f => ({ ...f, files: [...f.files, ...newFiles] }));
                    }} />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ borderRight: `1px solid ${t.border}`, paddingRight: 20 }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: "#7C49A8", marginBottom: 15, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ animation: "pulse 2s infinite" }}>⚡</span> رسائل جاهزة
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {templates.map((tmp, idx) => (
                  <button key={idx} onClick={() => setForm(f => ({ ...f, text: tmp.text }))}
                    style={{ textAlign: "right", padding: "12px 14px", borderRadius: 12, background: t.bg2, border: `1px solid ${t.border}`, color: t.textMid, fontSize: 11, cursor: "pointer", transition: "all .2s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = "#7C49A8"} onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
                    <div style={{ fontWeight: 800, marginBottom: 4, color: "#7C49A8" }}>{tmp.label}</div>
                    <div style={{ opacity: .7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{tmp.text}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 25, background: "linear-gradient(135deg,rgba(216,164,53,.1),transparent)", padding: 15, borderRadius: 14, border: "1px solid rgba(216,164,53,.2)" }}>
                <div style={{ fontSize: 11, color: "#D8A435", fontWeight: 800, marginBottom: 6 }}>💡 نصيحة الإدارة</div>
                <div style={{ fontSize: 10, color: t.textDim, lineHeight: 1.6 }}>استخدام الرسائل الجاهزة يوفر الوقت ويضمن وصول المعلومة بشكل موحد ومهني.</div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
            <Btn onClick={send} style={{ flex: 1, height: 48, fontSize: 15 }}>إرسال الرسالة الآن 🚀</Btn>
            <Btn variant="secondary" onClick={() => setCompose(false)} style={{ height: 48 }}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
