import { useState, useEffect, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ═══ SETTINGS ════════════════════════════════════════ */
// قم بحفظ صورة الشعار في مجلد المشروع باسم logo.png
const LOGO_URL = "/logo.png"; 
const API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || (
  typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:3001"
    : "https://najd-academy-system-production.up.railway.app"
);

/* ═══ LOGO ═══════════════════════════════════════════ */
const NajdLogo = ({ size = 48 }) => {
  if (LOGO_URL) {
    return <img src={LOGO_URL} alt="نادي نجد" style={{ width: size, height: size, objectFit: "contain", borderRadius: size / 4 }} />;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 1420 1420" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path fill="#7C49A8" transform="scale(3.55 3.55)" d="M263.019 166.665C266.825 166.87 291.033 165.877 292.489 167.377C293.274 169.499 292.991 174.351 293.03 176.816C293.232 189.763 292.765 199.668 289.855 212.307C285.135 228.411 277.831 240.418 265.66 252.022C252.133 264.69 234.945 272.753 216.557 275.058C187.435 278.54 160.958 269.119 140.752 247.878C129.07 235.575 121.455 219.976 118.941 203.198C117.551 193.84 117.574 176.861 117.822 167.187C124.735 166.329 137.964 166.66 145.294 166.628L147.39 166.603C147.839 192.696 143.817 215.321 163.996 235.924C174.628 246.826 189.201 252.987 204.429 253.017C219.871 253.249 234.759 247.265 245.746 236.411C260.929 221.434 262.798 206.501 262.916 186.409L263.019 166.665Z"/>
      <path fill="#FCFAF2" transform="scale(3.55 3.55)" d="M222.808 157.965C222.799 156.832 222.621 157.07 223.195 156.412C224.701 155.869 226.517 156.253 228.191 156.276C228.45 158.315 228.782 172.032 228.478 174.162C228.765 177.046 229.288 178.849 232.382 179.684C232.856 176.13 232.997 168.227 233.241 156.553C234.939 156.26 236.747 156.409 238.478 156.477C238.695 172.958 238.704 189.441 238.505 205.923C238.538 208.396 237.267 211.188 235.175 216.872C232.277 221.968 223.866 231.602 210.851 235.152C198.488 233.115 179.136 227.452 171.3 199.56C170.728 192.036 171.533 178.229 172.128 157.274C173.459 156.224 175.733 156.567 177.481 156.63C177.701 159.023 177.81 162.235 177.702 164.623L177.742 171.19L181.921 170.626C181.549 168.572 182.336 156.38 184.198 156.294C185.578 156.261 187.436 156.341 187.669 170.849C189.391 171.295 190.474 169.979 191.554 165.527C191.264 161.064 192.183 156.499 194.223 156.295C195.529 156.327 197.555 156.374 197.802 171.059C199.686 171.64 202.422 171.788 202.487 156.355C204.324 156.284 207.958 156.286 208.144 172.519C211.837 172.726 212.432 172.782 212.514 165.675C212.376 162.754 212.567 156.293 214.529 156.273C216.218 156.276 218.189 156.378 218.453 171.573C218.83 173.317 221.146 174.413 222.237 173.728C222.773 172.155 222.585 160.934 222.808 157.965Z"/>
      <path fill="#D8A435" transform="scale(3.55 3.55)" d="M171.533 178.229C171.267 175.968 171.657 158.993 172.128 157.274C173.459 156.224 175.733 156.567 177.481 156.63C177.701 159.023 177.81 162.235 177.702 164.623C177.372 169.704 177.616 178.749 177.032 182.892C175.259 182.863 174.019 182.787 172.257 182.593C171.96 181.064 171.726 179.772 171.533 178.229Z"/>
      <path fill="#D8A435" transform="scale(3.55 3.55)" d="M212.184 229.616C212.895 229.089 215.398 226.759 216.008 226.493C220.415 224.575 225.588 222.903 230.244 221.642C231.453 221.315 232.277 221.968 223.866 231.602Q210.851 235.152 198.488 233.115C199.482 230.986 199.938 230.513 201.78 229.616Z"/>
    </svg>
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
const fmtMoney = n => Number(n).toLocaleString("ar-SA") + " ر.س";

/* ═══ DATE UTILS ══════════════════════════════════════ */
const AR_MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const getCurMonth = () => {
  const d = new Date();
  return `${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};
const CUR_MONTH = getCurMonth();

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

  const demos = [
    { label: "الإدارة",  email: "admin@najd.sa",      pass: "Najd@2026",  color: "#7C49A8" },
    { label: "مدرب",     email: "khaled@najd.sa",     pass: "Coach@5678", color: "#06B6D4" },
    { label: "ولي أمر",  email: "aalghamdi@mail.com", pass: "Parent@111", color: "#10B981" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#08071A", position: "relative", overflow: "hidden", padding: 20 }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 55% at 50% 20%,rgba(124,73,168,.2) 0%,transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(124,73,168,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(124,73,168,.04) 1px,transparent 1px)", backgroundSize: "55px 55px" }} />
      <div style={{ position: "absolute", top: "18%", right: "8%", width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle,rgba(216,164,53,.07),transparent 70%)", animation: "float 6s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "15%", left: "6%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle,rgba(124,73,168,.1),transparent 70%)", animation: "float 4s ease-in-out infinite 1.5s" }} />

      <div style={{ position: "relative", zIndex: 1, width: "min(430px,100%)" }}>
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeUp .6s ease both" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 110, height: 110, borderRadius: 28, background: "linear-gradient(135deg,rgba(124,73,168,.14),rgba(124,73,168,.04))", border: "1px solid rgba(124,73,168,.3)", marginBottom: 16, boxShadow: "0 0 40px rgba(124,73,168,.18)" }}>
            <NajdLogo size={85} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 6, letterSpacing: "-.02em" }}>
            نادي <span style={{ color: "#D8A435" }}>نجد</span> الرياض
          </h1>
          <p style={{ fontSize: 14, color: "#5A4E8A", fontWeight: 600 }}>أكاديمية كرة القدم — بوابة الدخول الموحدة</p>
        </div>

        <div style={{ background: "rgba(18,17,31,.88)", border: "1px solid rgba(124,73,168,.22)", borderRadius: 24, padding: "32px 28px", backdropFilter: "blur(20px)", animation: "fadeUp .6s .15s ease both", opacity: 0 }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 12, color: "#8B7FBB", fontWeight: 600, marginBottom: 8 }}>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@najd.sa"
              onFocus={e => e.target.style.borderColor = "#7C49A8"} onBlur={e => e.target.style.borderColor = "#2A2050"}
              style={{ width: "100%", background: "rgba(12,11,24,.8)", border: "1px solid #2A2050", borderRadius: 11, padding: "12px 15px", color: "#E8E3FF", fontSize: 14, outline: "none", fontFamily: "'Cairo',sans-serif", transition: "border .2s" }} />
          </div>
          <div style={{ marginBottom: 20, position: "relative" }}>
            <label style={{ display: "block", fontSize: 12, color: "#8B7FBB", fontWeight: 600, marginBottom: 8 }}>كلمة المرور</label>
            <input type={showP ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handle()}
              onFocus={e => e.target.style.borderColor = "#7C49A8"} onBlur={e => e.target.style.borderColor = "#2A2050"}
              style={{ width: "100%", background: "rgba(12,11,24,.8)", border: "1px solid #2A2050", borderRadius: 11, padding: "12px 42px 12px 15px", color: "#E8E3FF", fontSize: 14, outline: "none", fontFamily: "'Cairo',sans-serif", transition: "border .2s" }} />
            <button onClick={() => setShowP(s => !s)} style={{ position: "absolute", left: 13, top: 33, background: "none", border: "none", color: "#5A4E8A", cursor: "pointer", fontSize: 16 }}>
              {showP ? "🙈" : "👁️"}
            </button>
          </div>
          {error && <div style={{ background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#FCA5A5", marginBottom: 16, textAlign: "center" }}>⚠️ {error}</div>}
          <button onClick={handle} disabled={loading || !email || !pass}
            style={{ width: "100%", background: loading ? "#2A2050" : "linear-gradient(135deg,#7C49A8,#5A2D82)", color: "#fff", border: "none", borderRadius: 12, padding: 14, fontSize: 15, fontWeight: 800, cursor: loading || !email || !pass ? "not-allowed" : "pointer", transition: "all .3s", boxShadow: "0 6px 20px rgba(124,73,168,.32)", marginBottom: 6, opacity: loading || !email || !pass ? .65 : 1, fontFamily: "'Cairo',sans-serif" }}>
            {loading ? "جارٍ التحقق..." : "دخول ←"}
          </button>
          <div style={{ marginTop: 20, padding: "14px", background: "rgba(124,73,168,.06)", borderRadius: 12, border: "1px solid rgba(124,73,168,.1)" }}>
            <div style={{ fontSize: 11, color: "#5A4E8A", fontWeight: 600, marginBottom: 9, textAlign: "center" }}>تجربة سريعة</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {demos.map(d => (
                <button key={d.email} onClick={() => { setEmail(d.email); setPass(d.pass); }}
                  style={{ background: `${d.color}0E`, border: `1px solid ${d.color}22`, color: d.color, borderRadius: 9, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "'Cairo',sans-serif" }}>
                  <span>{d.label}</span>
                  <span style={{ color: "#4A3D7A", fontSize: 10 }}>{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <Footer t={t} />
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
  const [prices, setPrices] = useState(() => JSON.parse(localStorage.getItem('najd_prices') || JSON.stringify(PRICE_LIST)));
  const [trainings, setTrainings] = useState(() => JSON.parse(localStorage.getItem('najd_trainings') || '[]'));
  const [coachesAttendance, setCoachesAttendance] = useState(() => JSON.parse(localStorage.getItem('najd_coachesAttendance') || '[]'));

  const [groups, setGroups] = useState(() => JSON.parse(localStorage.getItem('najd_groups') || '[]'));
  const [coaches, setCoaches] = useState(() => JSON.parse(localStorage.getItem('najd_coaches') || '[]'));
  const [players, setPlayers] = useState(() => JSON.parse(localStorage.getItem('najd_players') || '[]'));
  const [parents, setParents] = useState(() => JSON.parse(localStorage.getItem('najd_parents') || '[]'));
  const [payments, setPayments] = useState(() => JSON.parse(localStorage.getItem('najd_payments') || '[]'));
  const [theme, setTheme] = useState(() => localStorage.getItem('najd_theme') || "dark");

  const [syncStatus, setSyncStatus] = useState("synced"); // 'synced', 'syncing', 'error'
  const [lastUpdate, setLastUpdateState] = useState(() => parseInt(localStorage.getItem('najd_last_update') || '0'));
  const [lastLocalWrite, setLastLocalWrite] = useState(0);
  const markLocalWrite = () => setLastLocalWrite(Date.now());

  const setLastUpdate = (val) => {
    const time = val !== undefined ? val : Date.now();
    setLastUpdateState(time);
    localStorage.setItem('najd_last_update', String(time));
  };

  const syncWithAPI = async (table, item, isDeleted = false) => {
    if (!API_URL) return;
    markLocalWrite();
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
        trainings: 'trainings'
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
      setSyncStatus("synced");
    } catch (e) {
      console.error(`Sync error for ${table}:`, e);
      setSyncStatus("error");
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
      // Skip background update if we are actively syncing or a local write occurred in the last 3 seconds
      if (syncStatus === "syncing" || Date.now() - lastLocalWrite < 3000) {
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/initial-data`);
        const data = await res.json();
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
  }, [user, syncStatus, lastLocalWrite]);

  useEffect(() => {
    localStorage.setItem('najd_players', JSON.stringify(players));
    localStorage.setItem('najd_coaches', JSON.stringify(coaches));
    localStorage.setItem('najd_groups', JSON.stringify(groups));
    localStorage.setItem('najd_parents', JSON.stringify(parents));
    localStorage.setItem('najd_payments', JSON.stringify(payments));
    localStorage.setItem('najd_attendance', JSON.stringify(attendance));
    localStorage.setItem('najd_coachesAttendance', JSON.stringify(coachesAttendance));
    localStorage.setItem('najd_evals', JSON.stringify(evals));
    localStorage.setItem('najd_messages', JSON.stringify(messages));
    localStorage.setItem('najd_prices', JSON.stringify(prices));
    localStorage.setItem('najd_trainings', JSON.stringify(trainings));
    localStorage.setItem('najd_theme', theme);
  }, [players, coaches, groups, parents, payments, attendance, coachesAttendance, evals, messages, prices, trainings, theme]);

  const t = THEMES[theme];

  const shared = { 
    syncStatus,
    groups, 
    setGroups: (val) => {
      if (typeof val === 'function') {
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
    attendance, 
    setAttendance: (val) => {
      if (typeof val === 'function') {
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
        setCoachesAttendance(prev => {
          const next = val(prev);
          setLastUpdate();
          return next;
        });
      } else {
        setCoachesAttendance(val);
      }
    },
    evals, 
    setEvals: (val) => {
      if (typeof val === 'function') {
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
function AdminPortal({ user, onLogout, groups, setGroups, coaches, setCoaches, players, setPlayers, parents, payments, setPayments, attendance, setAttendance, coachesAttendance, setCoachesAttendance, evals, messages, setMessages, prices, setPrices, trainings, setTrainings, t, syncStatus }) {
  const [tab, setTab] = useState("overview");
  const tabs = [
    { id: "overview",     icon: "dashboard",    label: "نظرة عامة"   },
    { id: "teams",        icon: "teams",        label: "الفرق"        },
    { id: "attendance",   icon: "attendance",   label: "التحضير"      },
    { id: "coaches",      icon: "coaches",      label: "المدربون"     },
    { id: "players",      icon: "players",      label: "اللاعبون"     },
    { id: "payments",     icon: "payments",     label: "المدفوعات"    },
    { id: "prices",       icon: "prices",       label: "الأسعار"      },
    { id: "schedule",     icon: "schedule",     label: "التمارين"     },
    { id: "messages",     icon: "messages",     label: "الرسائل",      badge: messages.filter(m => m.to === "admin" && !m.read).length || undefined },
  ];
  return (
    <Shell title="لوحة الإدارة" subtitle="نادي نجد الرياض" color="#7C49A8" icon="dashboard" tabs={tabs} activeTab={tab} setActiveTab={setTab} onLogout={onLogout} badge="مدير عام" user={user} t={t} syncStatus={syncStatus}>
      {tab === "overview"  && <AdminOverview players={players} coaches={coaches} groups={groups} payments={payments} t={t} />}
      {tab === "teams"     && <AdminTeams groups={groups} setGroups={setGroups} coaches={coaches} players={players} t={t} />}
      {tab === "attendance" && <AdminAttendance groups={groups} players={players} coaches={coaches} attendance={attendance} setAttendance={setAttendance} coachesAttendance={coachesAttendance} setCoachesAttendance={setCoachesAttendance} t={t} />}
      {tab === "coaches"   && <AdminCoaches coaches={coaches} setCoaches={setCoaches} groups={groups} players={players} payments={payments} t={t} />}
      {tab === "players"   && <AdminPlayers players={players} setPlayers={setPlayers} groups={groups} parents={parents} t={t} />}
      {tab === "payments"  && <AdminPayments payments={payments} setPayments={setPayments} players={players} coaches={coaches} prices={prices} t={t} />}
      {tab === "prices"    && <AdminPrices prices={prices} setPrices={setPrices} t={t} />}
      {tab === "schedule"  && <AdminTrainings trainings={trainings} setTrainings={setTrainings} groups={groups} coaches={coaches} t={t} />}
      {tab === "messages"  && <Messaging messages={messages} setMessages={setMessages} meId="admin" meName="الإدارة" coaches={coaches} parents={parents} t={t} />}
    </Shell>
  );
}

/* ── Admin Overview ─────────────────────────────────── */
function AdminOverview({ players, coaches, groups, payments, t }) {
  const total   = payments.reduce((a, p) => a + p.amount, 0);
  const month   = payments.filter(p => p.month === CUR_MONTH).reduce((a, p) => a + p.amount, 0);
  const active  = players.filter(p => p.status === "نشط").length;
  const unpaid  = players.filter(p => !payments.some(pay => pay.playerId === p.id && pay.type === "subscription" && pay.month === CUR_MONTH)).length;
  const byType  = Object.entries(PAY_TYPES).map(([k, v]) => ({ ...v, k, total: payments.filter(p => p.type === k).reduce((a, p) => a + p.amount, 0), count: payments.filter(p => p.type === k).length }));

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
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 14 }}>آخر 7 أشهر</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={REV_DATA}>
              <defs>
                <linearGradient id="gInc" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7C49A8" stopOpacity={.3}/><stop offset="95%" stopColor="#7C49A8" stopOpacity={0}/></linearGradient>
                <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#EF4444" stopOpacity={.2}/><stop offset="95%" stopColor="#EF4444" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} vertical={false}/>
              <XAxis dataKey="month" tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: t.textDim, fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`}/>
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
              <Pie data={POS_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={4} dataKey="value" animationDuration={1200}>
                {POS_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<ArabicTooltip />}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px 10px", marginTop: 6 }}>
            {POS_DATA.map((d, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: t.textDim }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }}/>{d.name} <span style={{ color: d.color, fontWeight: 700 }}>{d.value}</span></div>)}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="s3">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 4 }}>📋 الحضور الأسبوعي</div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 14 }}>آخر 6 أسابيع</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ATT_TREND} barSize={12} barCategoryGap="30%">
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
          <div style={{ fontWeight: 700, fontSize: 13, color: "#EF4444", marginBottom: 14 }}>⚠️ لم يدفعوا اشتراك {CUR_MONTH.split(" ")[0]}</div>
          {players.filter(p => isMonthAfterJoin(CUR_MONTH, p.joinDate) && !payments.some(pay => pay.playerId === p.id && pay.type === "subscription" && pay.month === CUR_MONTH)).map(p => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <Avatar name={p.name} size={28} color="#EF4444"/>
                <div><div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{p.name}</div><div style={{ fontSize: 10, color: t.textDim }}>{groups.find(g => g.id === p.groupId)?.name}</div></div>
              </div>
              <Chip text="متأخر" color="#EF4444"/>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ── Admin Teams (NEW) ──────────────────────────────── */
function AdminTeams({ groups, setGroups, coaches, players, t }) {
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState({ name: "", coachId: "", color: "#06B6D4" });
  const [selGroup, setSelGroup] = useState(null);
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

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
                    <td style={{ padding: "11px 12px" }}><Chip text={p.status} color={p.status === "نشط" ? "#10B981" : "#EF4444"}/></td>
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
      const email = `${form.name.split(" ")[0].toLowerCase()}${Math.floor(Math.random()*1000)}@najd.sa`;
      const password = `Najd@${Math.floor(Math.random()*9000)+1000}`;
      setCoaches(c => [...c, { ...form, id, email, password, joined: new Date().toISOString().split("T")[0] }]);
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
              {[["الهاتف", c.phone], ["الإيميل", c.email], ["كلمة المرور", c.password || "—"], ["الشهادة", c.cert], ["الخبرة", `${c.exp} سنة`], ["المجموعة", g?.name || "—"], ["الراتب", fmtMoney(c.salary)]].map(([k, v]) => (
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
function AdminPlayers({ players, setPlayers, groups, parents, t }) {
  const [sel, setSel]   = useState(null);
  const [modal, setModal] = useState(false);
  const [search, setSearch] = useState("");
  const emptyP = { name: "", age: "", groupId: "g1", phone: "", position: "مهاجم", status: "نشط", score: 80, speed: 75, stamina: 75, technique: 75, teamwork: 75, goals: 0, assists: 0, attendancePct: 90, weight: "", height: "", parentId: "par1", email: "", password: "" };
  const [form, setForm] = useState(emptyP);
  const filtered = players.filter(p => p.name.includes(search) || (groups.find(g => g.id === p.groupId)?.name || "").includes(search));

  if (sel) {
    const p   = players.find(x => x.id === sel);
    if (!p) { 
      setTimeout(() => setSel(null), 0);
      return <div style={{ padding: 40, textAlign: "center", color: t.textDim }}>جاري تحميل بيانات اللاعب...</div>;
    }
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
            {[
              ["العمر", `${p.age || '—'} سنة`],
              ["الطول", `${p.height || '—'} سم`],
              ["الوزن", `${p.weight || '—'} كجم`],
              ["الأهداف", p.goals || 0],
              ["التمريرات", p.assists || 0],
              ["الحضور", `${p.attendancePct || 0}%`],
              ["المجموعة", g?.name || "—"],
              ["ولي الأمر", par?.name || "—"],
              ["إيميل الدخول", par?.email || p.email || "—"],
              ["كلمة المرور", (p.parentId && String(p.parentId).startsWith('par_')) ? (p.password || `najd_${p.phone?.slice(-4)}`) : "كلمة مرور ولي الأمر الحالية"]
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                <span style={{ color: t.textDim }}>{k}</span>
                <span style={{ fontWeight: 600, color: (k === "كلمة المرور" && v !== "كلمة مرور ولي الأمر الحالية") ? "#D8A435" : k === "إيميل الدخول" ? "#06B6D4" : t.text, fontFamily: k === "كلمة المرور" ? "monospace" : undefined, fontSize: k === "كلمة المرور" ? 11 : 12 }}>{v}</span>
              </div>
            ))}
            <Btn style={{ width: "100%", marginTop: 14 }} onClick={() => { setForm({ ...p }); setModal("edit"); }}>
              <AnimIcon type="edit" size={14} color="#fff" /> تعديل
            </Btn>
          </Card>
          <Card t={t} style={{ padding: 22 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📊 المهارات</div>
            <SkillBar label="السرعة"         val={p.speed}     color="#06B6D4" t={t}/>
            <SkillBar label="التحمل"         val={p.stamina}   color="#10B981" t={t}/>
            <SkillBar label="التقنية"        val={p.technique} color="#7C49A8" t={t}/>
            <SkillBar label="العمل الجماعي" val={p.teamwork}  color="#F59E0B" t={t}/>
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: t.textDim }}>التقييم الكلي</span>
                <span style={{ fontWeight: 800, color: p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444" }}>{p.score}/100</span>
              </div>
              <div style={{ height: 8, background: t.border, borderRadius: 4 }}>
                <div style={{ height: "100%", borderRadius: 4, background: `linear-gradient(90deg,${p.score > 80 ? "#10B981" : p.score > 60 ? "#F59E0B" : "#EF4444"},transparent)`, width: `${p.score}%` }}/>
              </div>
            </div>
          </Card>
        </div>
        {modal && (
          <Modal title="تعديل بيانات اللاعب" onClose={() => setModal(null)} wide t={t}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0 14px" }}>
              {[["الاسم", "name"], ["الهاتف", "phone"], ["الإيميل", "email"], ["كلمة المرور", "password"]].map(([l, f]) => (
                <div key={f} style={{ flex: "1 1 calc(50% - 7px)" }}><Input label={l} value={form[f] || ""} onChange={v => setForm(x => ({ ...x, [f]: v }))} t={t}/></div>
              ))}
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="المجموعة" value={form.groupId} onChange={v => setForm(x => ({ ...x, groupId: v }))} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/></div>
              <div style={{ flex: "1 1 calc(50% - 7px)" }}><Input label="الحالة" value={form.status} onChange={v => setForm(x => ({ ...x, status: v }))} options={["نشط", "موقوف"]} t={t}/></div>
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
        <Btn onClick={() => { setForm(emptyP); setModal("add"); }}>
          <AnimIcon type="plus" size={14} color="#fff" /> إضافة لاعب
        </Btn>
      </div>
      <Card t={t} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
              {["اللاعب", "الفريق", "المركز", "الإيميل", "الحالة", "التقييم", ""].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "right", fontSize: 10, color: t.textDim, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const g = groups.find(x => x.id === p.groupId);
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
                  <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{p.email || "—"}</td>
                  <td style={{ padding: "11px 14px" }}><Chip text={p.status} color={p.status === "نشط" ? "#10B981" : "#EF4444"}/></td>
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
                joinDate: new Date().toISOString().split("T")[0] 
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
function AdminPayments({ payments, setPayments, players, coaches, prices, t }) {
  const [modal, setModal] = useState(false);
  const [fc, setFc] = useState("الكل");
  const [ft, setFt] = useState("الكل");
  
  const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"].map(m => `${m} 2026`);
  
  const empty = { playerId: "p1", coachId: "none", types: ["subscription"], month: CUR_MONTH, note: "", date: new Date().toISOString().split("T")[0] };
  const [form, setForm] = useState(empty);
  const filtered = payments.filter(p => (fc === "الكل" || p.coachId === fc) && (ft === "الكل" || p.type === ft));

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
    
    const newPayments = form.types.map(type => ({
      id: `pay${Date.now()}-${type}`,
      playerId: form.playerId,
      playerName: player?.name || "",
      coachId: form.coachId,
      coachName: coach?.name || (form.coachId === "none" ? "الإدارة" : ""),
      type: type,
      amount: prices[type] || 0,
      month: form.month,
      date: form.date,
      note: form.note
    }));

    setPayments(ps => [...ps, ...newPayments]);
    setModal(false);
  };

  const totalAmount = form.types.reduce((sum, type) => sum + (prices[type] || 0), 0);

  return (
    <div>
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
        <Btn onClick={() => { setForm(empty); setModal(true); }}>
          <AnimIcon type="plus" size={14} color="#fff"/> تسجيل دفعة
        </Btn>
      </div>
      <Card t={t} style={{ overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: t.bg, borderBottom: `1px solid ${t.border}` }}>
              {["اللاعب", "النوع", "الشهر", "المبلغ", "المستلم", "التاريخ", "ملاحظة"].map(h => (
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
                  <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{p.date}</td>
                  <td style={{ padding: "11px 14px", fontSize: 11, color: t.textDim }}>{p.note || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ padding: "12px 18px", borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: t.textDim }}>{filtered.length} عملية</span>
          <span style={{ fontWeight: 800, color: "#10B981" }}>الإجمالي: {fmtMoney(filtered.reduce((a, p) => a + p.amount, 0))}</span>
        </div>
      </Card>
      {modal && (
        <Modal title="تسجيل دفعة جديدة" onClose={() => setModal(false)} t={t}>
          <Input label="اللاعب" value={form.playerId} onChange={v => setForm(f => ({ ...f, playerId: v }))} options={players.map(p => ({ v: p.id, l: p.name }))} t={t}/>
          <Input label="المستلم" value={form.coachId} onChange={v => setForm(f => ({ ...f, coachId: v }))} options={[{ v: "none", l: "الإدارة (لا يوجد مدرب)" }, ...coaches.map(c => ({ v: c.id, l: c.name }))]} t={t}/>
          
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, color: t.textDim, fontWeight: 600, marginBottom: 8 }}>النوع (يمكن اختيار أكثر من نوع)</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.entries(PAY_TYPES).map(([k, v]) => (
                <button key={k} onClick={() => toggleType(k)} 
                  style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px", borderRadius: 10, border: "1px solid", borderColor: form.types.includes(k) ? v.color : t.border, background: form.types.includes(k) ? `${v.color}15` : t.inputBg, color: form.types.includes(k) ? v.color : t.textDim, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .2s", textAlign: "right" }}>
                  <span style={{ fontSize: 16 }}>{form.types.includes(k) ? "✅" : v.icon}</span>
                  <span>{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input label="الشهر" value={form.month} onChange={v => setForm(f => ({ ...f, month: v }))} options={MONTHS} t={t}/>
          <Input label="التاريخ" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          <Input label="ملاحظة" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="اختياري" t={t}/>
          
          <div style={{ background: t.bg, borderRadius: 12, padding: "14px", marginBottom: 18, border: `1px dashed ${t.border2}` }}>
            <div style={{ fontSize: 11, color: t.textDim, marginBottom: 4 }}>إجمالي المبلغ المستحق:</div>
            <div style={{ color: "#10B981", fontWeight: 900, fontSize: 20 }}>{fmtMoney(totalAmount)}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
              {form.types.map(ty => <Chip key={ty} text={PAY_TYPES[ty]?.label} color={PAY_TYPES[ty]?.color} size={9}/>)}
            </div>
          </div>
          
          <div style={{ display: "flex", gap: 10 }}><Btn onClick={save} style={{ flex: 1 }}>💾 تسجيل المدفوعات</Btn><Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn></div>
        </Modal>
      )}
    </div>
  );
}

function AdminPrices({ prices, setPrices, t }) {
  const [form, setForm] = useState({ ...prices });
  const [saved, setSaved] = useState(false);
  return (
    <div style={{ maxWidth: 460 }}>
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
    note: "" 
  };
  const [form, setForm] = useState(empty);
  const DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

  const save = () => {
    if (!form.groupId) {
      alert("الرجاء اختيار مجموعة");
      return;
    }
    if (!form.coachId) {
      alert("الرجاء اختيار مدرب");
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
        <div style={{ fontWeight: 800, fontSize: 15, color: t.text }}>📅 جدول التمارين</div>
        <Btn onClick={() => { setForm({ ...empty }); setModal(true); }}>
          <AnimIcon type="plus" size={14} color="#fff"/> إضافة تمرين
        </Btn>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        {trainings.slice().reverse().map(tr => {
          const group = groups.find(g => g.id === tr.groupId);
          const coach = coaches.find(c => c.id === tr.coachId);
          return (
            <Card key={tr.id} t={t} style={{ padding: 20, borderLeft: `4px solid ${group?.color || t.purple}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <Chip text={group?.name} color={group?.color}/>
                <div style={{ display: "flex", gap: 5 }}>
                  {tr.days?.map(d => <Chip key={d} text={d} color={t.textDim} size={9}/>)}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 8 }}>{tr.title}</div>
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
        <Modal title="إضافة موعد تدريب" onClose={() => setModal(false)} t={t}>
          <Input label="المجموعة / الفريق" value={form.groupId} onChange={handleGroupChange} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/>
          <Input label="المدرب" value={form.coachId} onChange={v => setForm(f => ({ ...f, coachId: v }))} options={coaches.map(c => ({ v: c.id, l: c.name }))} t={t}/>
          <Input label="عنوان التمرين" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="مثال: مهارات التسديد" t={t}/>
          
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="التاريخ (اختياري)" value={form.date || ""} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
            <Input label="الوقت" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} t={t}/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input label="الوقت" value={form.time} onChange={v => setForm(f => ({ ...f, time: v }))} t={t}/>
            <Input label="المدة (دقيقة)" value={form.duration} onChange={v => setForm(f => ({ ...f, duration: +v }))} type="number" t={t}/>
          </div>
          <Input label="الملعب" value={form.field} onChange={v => setForm(f => ({ ...f, field: v }))} t={t}/>
          <Input label="تركيز التدريب (المهارة)" value={form.trainingFocus} onChange={v => setForm(f => ({ ...f, trainingFocus: v }))} placeholder="مثال: تمرير قصير" t={t}/>
          <Input label="ملاحظات" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="اختياري" t={t}/>
          
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Btn onClick={save} style={{ flex: 1 }}>💾 حفظ التمرين</Btn>
            <Btn variant="secondary" onClick={() => setModal(false)}>إلغاء</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COACH PORTAL (Permissions-aware)
══════════════════════════════════════════════════════════ */
/* ── Admin Attendance (NEW) ─────────────────────────── */
function AdminAttendance({ groups, players, coaches, attendance, setAttendance, coachesAttendance, setCoachesAttendance, t }) {
  const [subTab, setSubTab] = useState("players");
  const [selGroup, setSelGroup] = useState(groups[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState({});

  useEffect(() => {
    if (subTab === "players") {
      const existing = attendance.find(a => a.date === date && a.groupId === selGroup);
      setRecords(existing?.records || {});
    } else {
      const existing = coachesAttendance.find(a => a.date === date);
      setRecords(existing?.records || {});
    }
  }, [date, selGroup, subTab, attendance, coachesAttendance]);

  const save = () => {
    if (subTab === "players") {
      const newAtt = { id: `att${Date.now()}`, date, groupId: selGroup, records };
      setAttendance(prev => {
        const filtered = prev.filter(a => !(a.date === date && a.groupId === selGroup));
        return [...filtered, newAtt];
      });
    } else {
      const newAtt = { id: `ca${Date.now()}`, date, records };
      setCoachesAttendance(prev => {
        const filtered = prev.filter(a => a.date === date);
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
          <div style={{ flex: 1, minWidth: 150 }}><Input label="التاريخ" type="date" value={date} onChange={setDate} t={t}/></div>
          {subTab === "players" && (
            <div style={{ flex: 1, minWidth: 150 }}><Input label="المجموعة" value={selGroup} onChange={setSelGroup} options={groups.map(g => ({ v: g.id, l: g.name }))} t={t}/></div>
          )}
        </div>

        <div style={{ border: `1px solid ${t.border}`, borderRadius: 12, overflow: "hidden" }}>
          {list.map((item, idx) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: idx < list.length - 1 ? `1px solid ${t.border}` : "none", background: idx % 2 === 0 ? "transparent" : `${t.bg}44` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name={item.name} size={36} color={subTab === "players" ? "#7C49A8" : "#D8A435"}/>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: t.textDim }}>{subTab === "players" ? item.position : item.specialty}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {Object.entries(ATT_C).map(([status, color]) => (
                  <button key={status} onClick={() => setRecords(r => ({ ...r, [item.id]: status }))}
                    style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid", borderColor: records[item.id] === status ? color : t.border, background: records[item.id] === status ? `${color}18` : "transparent", color: records[item.id] === status ? color : t.textFaint, fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all .2s" }}>
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {list.length === 0 && <div style={{ padding: 40, textAlign: "center", color: t.textFaint }}>لا يوجد بيانات</div>}
        </div>

        <Btn onClick={save} style={{ width: "100%", marginTop: 20 }}>💾 حفظ التحضير</Btn>
      </Card>
    </div>
  );
}

function CoachPortal({ user, onLogout, groups, coaches, players, payments, setPayments, attendance, setAttendance, coachesAttendance, setCoachesAttendance, evals, setEvals, messages, setMessages, prices, trainings, setTrainings, t, syncStatus }) {
  const coach = coaches.find(c => c.id === user.id) || coaches[0];
  const perms = coach?.perms || { ...DEFAULT_PERMS };
  const group = groups.find(g => g.id === coach.groupId);
  const myPlayers = players.filter(p => p.groupId === coach.groupId);
  const unread = messages.filter(m => m.to === user.id && !m.read).length;

  const allTabs = [
    { id: "home",       icon: "dashboard",  label: "الرئيسية",       perm: null },
    { id: "sessions",   icon: "schedule",   label: "التدريبات",       perm: null },
    { id: "players",    icon: "players",    label: "اللاعبون",         perm: null },
    { id: "attendance", icon: "attendance", label: "تسجيل الحضور",    perm: "attendance" },
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
      {tab === "players"    && <CoachPlayers myPlayers={myPlayers} group={group} evals={evals} t={t}/>}
      {tab === "attendance" && perms.attendance !== false && <CoachAttendance coachId={user.id} group={group} myPlayers={myPlayers} attendance={attendance} setAttendance={setAttendance} t={t}/>}
      {tab === "eval"       && perms.evals !== false      && <CoachEval coachId={user.id} myPlayers={myPlayers} evals={evals} setEvals={setEvals} t={t}/>}
      {tab === "payments"   && perms.payments !== false   && <CoachPayments coachId={user.id} myPlayers={myPlayers} payments={payments} setPayments={setPayments} prices={prices} coaches={coaches} t={t}/>}
      {tab === "messages"   && perms.messages !== false   && <Messaging messages={messages} setMessages={setMessages} meId={user.id} meName={coach.name} coaches={coaches} parents={parents} t={t} role="coach" myGroupId={coach.groupId} players={players} />}
    </Shell>
  );
}

/* ── Coach Home ─────────────────────────────────────── */
function CoachHome({ coach, group, groups, myPlayers, attendance, evals, trainings, t }) {
  const lastAtt = attendance.filter(a => a.coachId === coach.id).slice(-1)[0];
  const avgScore = myPlayers.length ? Math.round(myPlayers.reduce((a, p) => a + p.score, 0) / myPlayers.length) : 0;
  const myTrainings = trainings.filter(tr => tr.groupId === coach.groupId);
  const nextTr = myTrainings[0];
  
  return (
    <div>
      <Card t={t} style={{ padding: 26, marginBottom: 18, background: t.name === "dark" ? "linear-gradient(135deg,#060A20,#0A1030)" : `linear-gradient(135deg,#EFF8FF,#F0F9FF)`, borderColor: "rgba(6,182,212,.2)" }} className="s1">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: t.textDim, marginBottom: 6 }}>📅 التدريب القادم</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#06B6D4", marginBottom: 4 }}>{nextTr?.days.join(" و ") || "—"} الساعة {nextTr?.time || "—"}</div>
            <div style={{ fontSize: 14, color: t.textMid, marginBottom: 10 }}>🏟 {nextTr?.field || "—"} · ⏱ {nextTr?.duration || 0} دقيقة</div>
            {nextTr?.trainingFocus && (
              <div style={{ background: "rgba(6,182,212,.1)", border: "1px solid rgba(6,182,212,.2)", borderRadius: 10, padding: "10px 16px", display: "inline-block" }}>
                <div style={{ fontSize: 11, color: t.textDim, marginBottom: 4 }}>🎯 تركيز التدريب القادم</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#06B6D4" }}>{nextTr.trainingFocus}</div>
              </div>
            )}
          </div>
          <div style={{ textAlign: "center", background: "rgba(6,182,212,.07)", borderRadius: 16, padding: "18px 22px", border: "1px solid rgba(6,182,212,.14)" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#06B6D4" }}>{myPlayers.length}</div>
            <div style={{ fontSize: 12, color: t.textDim }}>لاعب</div>
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }} className="s2">
        <StatCard label="اللاعبون"     counter={myPlayers.length}                             icon="⚽" color="#06B6D4" t={t}/>
        <StatCard label="جلسات مسجلة" counter={attendance.filter(a => a.coachId === coach.id).length} icon="📋" color="#7C49A8" t={t}/>
        <StatCard label="تقييمات"      counter={evals.filter(e => e.coachId === coach.id).length}      icon="⭐" color="#F59E0B" t={t}/>
        <StatCard label="متوسط التقييم" counter={avgScore}                                   icon="📊" color="#10B981" t={t}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }} className="s3">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>⚽ لاعبو مجموعتي</div>
          {myPlayers.map((p, i) => {
            const lastEval = evals.filter(e => e.playerId === p.id && e.coachId === coach.id).slice(-1)[0];
            return (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: i < myPlayers.length - 1 ? `1px solid ${t.border}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar name={p.name} size={30} color="#06B6D4"/>
                  <div><div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{p.name}</div><div style={{ fontSize: 10, color: t.textDim }}>{p.position} · {p.attendancePct}% حضور</div></div>
                </div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#F59E0B" }}>{lastEval?.technique || p.technique}</div>
                  <div style={{ fontSize: 10, color: t.textDim }}>تقنية</div>
                </div>
              </div>
            );
          })}
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>📋 آخر جلسة حضور</div>
          {lastAtt
            ? <>
                <div style={{ fontSize: 11, color: t.textDim, marginBottom: 10 }}>📅 {lastAtt.date}</div>
                {Object.entries(lastAtt.records).map(([pid, status]) => {
                  const p = myPlayers.find(x => x.id === pid);
                  return (
                    <div key={pid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                      <span style={{ color: t.textMid }}>{p?.name || pid}</span>
                      <Chip text={status} color={ATT_C[status]}/>
                    </div>
                  );
                })}
              </>
            : <div style={{ textAlign: "center", color: t.textFaint, padding: 30 }}>لم يتم تسجيل حضور بعد</div>
          }
        </Card>
      </div>
    </div>
  );
}

/* ── Coach Sessions ─────────────────────────────────── */
function CoachSessions({ coach, group, groups, trainings, t }) {
  if (!group) return <div style={{ textAlign: "center", color: t.textFaint, padding: 60 }}>لا توجد مجموعة محددة</div>;
  const myTrainings = trainings.filter(tr => tr.groupId === coach.groupId);
  
  return (
    <div>
      <Card t={t} style={{ padding: 24, marginBottom: 16, background: t.name === "dark" ? "linear-gradient(135deg,#060A20,#0A1030)" : "linear-gradient(135deg,#EFF8FF,#F0FBFF)", borderColor: "rgba(6,182,212,.2)" }} className="s1">
        <div style={{ fontWeight: 700, fontSize: 14, color: "#06B6D4", marginBottom: 4 }}>📅 الجدول الأسبوعي لمجموعة {group.name}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
          {myTrainings.map((tr, i) => (
            <div key={tr.id} style={{ background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.15)", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(6,182,212,.15)", border: "1px solid rgba(6,182,212,.3)", display: "grid", placeItems: "center", fontSize: 20 }}>📅</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#06B6D4" }}>{tr.days.join(" · ")}</div>
                  <div style={{ fontSize: 12, color: t.textDim }}>{tr.time} · {tr.duration} دق</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: t.textDim }}>🏟 {tr.field}</div>
              <div style={{ fontSize: 11, color: "#06B6D4", fontWeight: 700, marginTop: 6 }}>🎯 {tr.trainingFocus}</div>
            </div>
          ))}
          {myTrainings.length === 0 && <div style={{ padding: 20, color: t.textDim }}>لا توجد تمارين مجدولة حالياً</div>}
        </div>
      </Card>
      <Card t={t} style={{ padding: 22, marginBottom: 16 }} className="s2">
        <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📋 خطة التدريب الأسبوعية</div>
        {myTrainings.map((tr, i) => {
          const colors = ["#06B6D4", "#A855F7"];
          return (
            <div key={tr.id} style={{ background: `${colors[i % 2]}08`, border: `1px solid ${colors[i % 2]}20`, borderRadius: 12, padding: 18, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>⚽</span>
                <div>
                  <div style={{ display: "flex", gap: 4 }}>{tr.days.map(d => <Chip key={d} text={d} color={colors[i % 2]}/>)}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors[i % 2], marginTop: 4 }}>{tr.title} — {tr.trainingFocus}</div>
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
function CoachPlayers({ myPlayers, group, evals, t }) {
  const [sel, setSel] = useState(null);
  if (sel) {
    const p  = myPlayers.find(x => x.id === sel);
    const pe = evals.filter(e => e.playerId === p.id).slice(-3);
    const lastEval = evals.filter(e => e.playerId === p.id).slice(-1)[0];
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
            {[["العمر", `${p.age} سنة`], ["الطول", `${p.height} سم`], ["الوزن", `${p.weight} كجم`], ["الأهداف", p.goals], ["التمريرات", p.assists], ["الحضور", `${p.attendancePct}%`]].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                <span style={{ color: t.textDim }}>{k}</span><span style={{ fontWeight: 600, color: t.text }}>{v}</span>
              </div>
            ))}
          </Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card t={t} style={{ padding: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>📊 المهارات</div>
              <SkillBar label="السرعة"        val={p.speed}     color="#06B6D4" t={t}/>
              <SkillBar label="التحمل"        val={p.stamina}   color="#10B981" t={t}/>
              <SkillBar label="التقنية"       val={p.technique} color="#7C49A8" t={t}/>
              <SkillBar label="العمل الجماعي" val={p.teamwork}  color="#F59E0B" t={t}/>
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
          </div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14 }}>
      {myPlayers.map(p => (
        <Card key={p.id} hover t={t} style={{ padding: 20, cursor: "pointer" }} onClick={() => setSel(p.id)}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Avatar name={p.name} size={40} color="#06B6D4"/>
            <div><div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.name}</div><div style={{ fontSize: 11, color: t.textDim }}>{p.position}</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            {[["أهداف", p.goals, "#EF4444"], ["تمريرات", p.assists, "#10B981"], ["حضور", `${p.attendancePct}%`, "#7C49A8"], ["تقييم", p.score, "#F59E0B"]].map(([l, v, c]) => (
              <div key={l} style={{ background: t.bg, borderRadius: 7, padding: "7px 9px" }}>
                <div style={{ fontSize: 10, color: t.textDim }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ── Coach Attendance ───────────────────────────────── */
function CoachAttendance({ coachId, group, myPlayers, attendance, setAttendance, t }) {
  const [date, setDate]     = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState({});
  const save = () => {
    if (!Object.keys(records).length) return;
    setAttendance(a => [...a, { id: `att${Date.now()}`, date, groupId: group?.id, coachId, records }]);
    setRecords({});
    alert("✅ تم حفظ الحضور");
  };
  const counts = { حاضر: Object.values(records).filter(v => v === "حاضر").length, غائب: Object.values(records).filter(v => v === "غائب").length, بعذر: Object.values(records).filter(v => v === "بعذر").length };
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }} className="s1">
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ background: t.bg2, border: `1px solid ${t.border}`, borderRadius: 9, padding: "8px 14px", color: t.text, fontSize: 13, fontFamily: "'Cairo',sans-serif" }}/>
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
        {myPlayers.map((p, i) => (
          <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: i < myPlayers.length - 1 ? `1px solid ${t.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={p.name} size={34} color="#06B6D4"/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{p.name}</div>
                <div style={{ fontSize: 11, color: t.textDim }}>{p.position} · حضور موسمي: <span style={{ color: p.attendancePct > 90 ? "#10B981" : p.attendancePct > 75 ? "#F59E0B" : "#EF4444" }}>{p.attendancePct}%</span></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {["حاضر", "غائب", "بعذر"].map(s => (
                <button key={s} onClick={() => setRecords(r => ({ ...r, [p.id]: s }))}
                  style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid", borderColor: records[p.id] === s ? ATT_C[s] : t.border2, background: records[p.id] === s ? `${ATT_C[s]}20` : t.inputBg, color: records[p.id] === s ? ATT_C[s] : t.textDim, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all .15s", fontFamily: "'Cairo',sans-serif" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ── Coach Eval ─────────────────────────────────────── */
function CoachEval({ coachId, myPlayers, evals, setEvals, t }) {
  const [modal, setModal] = useState(false);
  const [form, setForm]   = useState({ playerId: myPlayers[0]?.id || "", speed: 80, technique: 80, teamwork: 80, note: "", date: new Date().toISOString().split("T")[0] });
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
  const [form, setForm]   = useState({ playerId: myPlayers[0]?.id || "", type: "subscription", month: CUR_MONTH, note: "", date: new Date().toISOString().split("T")[0] });
  const myPays = payments.filter(p => p.coachId === coachId);
  const total  = myPays.reduce((a, p) => a + p.amount, 0);
  const save   = () => {
    const player = myPlayers.find(p => p.id === form.playerId);
    const coach  = coaches.find(c => c.id === coachId);
    setPayments(ps => [...ps, { ...form, id: `pay${Date.now()}`, coachId, coachName: coach?.name || "", playerName: player?.name || "", amount: prices[form.type] || 0 }]);
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
          <Input label="النوع" value={form.type} onChange={v => setForm(f => ({ ...f, type: v }))} options={Object.entries(PAY_TYPES).map(([k, v]) => ({ v: k, l: `${v.icon} ${v.label} — ${prices[k]} ر.س` }))} t={t}/>
          <Input label="الشهر" value={form.month} onChange={v => setForm(f => ({ ...f, month: v }))} placeholder={CUR_MONTH} t={t}/>
          <Input label="التاريخ" value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} type="date" t={t}/>
          <Input label="ملاحظة" value={form.note} onChange={v => setForm(f => ({ ...f, note: v }))} placeholder="اختياري" t={t}/>
          <div style={{ background: t.bg, borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: t.text }}>
            المبلغ: <span style={{ color: "#10B981", fontWeight: 900, fontSize: 16 }}>{fmtMoney(prices[form.type] || 0)}</span>
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
  const childPays  = child ? payments.filter(p => p.playerId === child.id) : [];
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
      {tab === "overview"   && <ParentOverview child={child} childGroup={childGroup} childCoach={childCoach} childPays={childPays} childEvals={childEvals} prices={prices} t={t}/>}
      {tab === "scores"     && <ParentScores child={child} childEvals={childEvals} childCoach={childCoach} t={t}/>}
      {tab === "attendance" && <ParentAttendance child={child} childAtt={childAtt} t={t}/>}
      {tab === "payments"   && <ParentPayments child={child} childPays={childPays} prices={prices} t={t}/>}
      {tab === "schedule"   && <ParentSchedule childGroup={childGroup} childCoach={childCoach} trainings={trainings} t={t}/>}
      {tab === "messages"   && <Messaging messages={messages} setMessages={setMessages} meId={user.id} meName={parent.name} coaches={coaches} parents={parents} t={t} role="parent" myCoachIds={myCoachIds} />}
    </Shell>
  );
}

function ParentOverview({ child, childGroup, childCoach, childPays, childEvals, prices, t }) {
  if (!child) return <div style={{ textAlign: "center", color: t.textFaint, padding: 60 }}>لا يوجد أبناء مسجلين</div>;
  const lastEval  = childEvals.slice(-1)[0];
  const monthPaid = childPays.some(p => p.type === "subscription" && p.month === CUR_MONTH);
  const totalPaid = childPays.reduce((a, p) => a + p.amount, 0);
  return (
    <div>
      <Card t={t} style={{ padding: 26, marginBottom: 18, background: t.name === "dark" ? "linear-gradient(135deg,#0A1F12,#0C2A1A)" : "linear-gradient(135deg,#EFFDF5,#F0FFF4)", borderColor: "rgba(16,185,129,.2)" }} className="s1">
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#10B981,#065F46)", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 900, color: "#fff", boxShadow: "0 0 22px rgba(16,185,129,.3)" }}>{child.name[0]}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6, color: t.text }}>{child.name}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Chip text={child.position} color="#10B981"/>
              <Chip text={childGroup?.name || "—"} color="#06B6D4"/>
              <Chip text={`مدرب: ${childCoach?.name || "—"}`} color="#7C49A8"/>
              <Chip text={child.status} color={child.status === "نشط" ? "#10B981" : "#EF4444"}/>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#10B981" }}>{child.score}</div>
            <div style={{ fontSize: 11, color: t.textDim }}>التقييم الكلي</div>
          </div>
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 18 }} className="s2">
        <StatCard label="الأهداف"   counter={child.goals || 0}         icon="⚽" color="#EF4444" t={t}/>
        <StatCard label="التمريرات" counter={child.assists || 0}       icon="🎯" color="#10B981" t={t}/>
        <StatCard label="الحضور"    counter={child.attendancePct ? `${child.attendancePct}%` : "—"} icon="📅" color="#7C49A8" t={t}/>
        <StatCard label="التقييم"   counter={child.score || "—"}       icon="⭐" color="#F59E0B" t={t}/>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="s3">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>📝 حالة التقييم</div>
          {lastEval 
            ? (
              <div>
                <div style={{ fontSize: 11, color: t.textDim, marginBottom: 12 }}>آخر تقييم بتاريخ: {lastEval.date} · {childCoach?.name}</div>
                <SkillBar label="السرعة" val={lastEval.speed} color="#06B6D4" t={t}/>
                <SkillBar label="التقنية" val={lastEval.technique} color="#7C49A8" t={t}/>
                <SkillBar label="العمل الجماعي" val={lastEval.teamwork} color="#F59E0B" t={t}/>
                {lastEval.note && <div style={{ background: t.bg, borderRadius: 8, padding: "10px 12px", fontSize: 12, color: t.textDim, lineHeight: 1.7, marginTop: 10 }}>"{lastEval.note}"</div>}
              </div>
            )
            : <div style={{ textAlign: "center", color: t.textFaint, padding: "40px 0", fontSize: 13 }}>لم يتم تقييم اللاعب بعد من قبل المدرب.</div>
          }
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>💰 ملخص المدفوعات</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#10B981", marginBottom: 4 }}>{fmtMoney(totalPaid)}</div>
          <div style={{ fontSize: 11, color: t.textDim, marginBottom: 14 }}>إجمالي ما تم دفعه</div>
          {childPays.slice(-3).map(p => {
            const pt = PAY_TYPES[p.type];
            return (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12 }}>
                <span style={{ color: t.textDim }}>{pt.icon} {pt.label} · {p.month}</span>
                <span style={{ fontWeight: 700, color: pt.color }}>{fmtMoney(p.amount)}</span>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}

function ParentScores({ child, childEvals, childCoach, t }) {
  if (!child) return null;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }} className="s1">
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 16 }}>📊 المهارات الحالية</div>
          <SkillBar label="السرعة"         val={child.speed}     color="#06B6D4" t={t}/>
          <SkillBar label="التحمل"         val={child.stamina}   color="#10B981" t={t}/>
          <SkillBar label="التقنية"        val={child.technique} color="#7C49A8" t={t}/>
          <SkillBar label="العمل الجماعي" val={child.teamwork}  color="#F59E0B" t={t}/>
        </Card>
        <Card t={t} style={{ padding: 22 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 14 }}>⚽ إحصائيات الموسم</div>
          {[["الأهداف", child.goals, "⚽", "#EF4444"], ["التمريرات", child.assists, "🎯", "#10B981"], ["الحضور", `${child.attendancePct}%`, "📅", "#7C49A8"], ["التقييم", child.score, "⭐", "#F59E0B"]].map(([l, v, i, c]) => (
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

function ParentAttendance({ child, childAtt, t }) {
  const allRecords = childAtt.flatMap(a => Object.entries(a.records).filter(([pid]) => pid === child?.id).map(([, s]) => ({ date: a.date, status: s })));
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
              <span style={{ fontSize: 13, color: t.text }}>{r.date}</span>
              <Chip text={r.status} color={ATT_C[r.status]}/>
            </div>
          ))
        }
      </Card>
    </div>
  );
}

function ParentPayments({ child, childPays, prices, t }) {
  const total     = childPays.reduce((a, p) => a + p.amount, 0);
  const monthPaid = childPays.some(p => p.type === "subscription" && p.month === CUR_MONTH);
  const shouldHavePaid = isMonthAfterJoin(CUR_MONTH, child?.joinDate);
  const byType    = Object.entries(PAY_TYPES).map(([k, v]) => ({ k, ...v, paid: childPays.filter(p => p.type === k).reduce((a, p) => a + p.amount, 0), count: childPays.filter(p => p.type === k).length }));

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 18 }} className="s1">
        <StatCard label="إجمالي المدفوعات" counter={total} value={fmtMoney(total)} icon="💰" color="#10B981" t={t}/>
        <StatCard label="عدد العمليات" counter={childPays.length} icon="🧾" color="#7C49A8" t={t}/>
        <StatCard label={`اشتراك ${CUR_MONTH.split(" ")[0]}`} value={!shouldHavePaid ? "غير مطلوب ⚪" : monthPaid ? "مدفوع ✅" : "لم يُدفع ⚠️"} icon="📋" color={!shouldHavePaid ? t.textDim : monthPaid ? "#10B981" : "#EF4444"} t={t}/>
      </div>
      {(!monthPaid && shouldHavePaid) && <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)", borderRadius: 12, padding: 16, marginBottom: 18, fontSize: 13, color: "#FCA5A5" }}>⚠️ اشتراك {CUR_MONTH} لم يُدفع — المبلغ المطلوب: <strong>{fmtMoney(prices.subscription)}</strong></div>}
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
  const myTrainings = (trainings || []).filter(tr => tr.groupId === childGroup.id);
  
  return (
    <div>
      <Card t={t} style={{ padding: 26, marginBottom: 20, background: t.name === "dark" ? "rgba(124,73,168,.05)" : "rgba(124,73,168,.02)", borderColor: "rgba(124,73,168,.2)" }} className="s1">
        <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(124,73,168,.1)", display: "grid", placeItems: "center" }}>
            <AnimIcon type="schedule" size={24} color="#7C49A8"/>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: t.text }}>الجدول الزمني للتمارين</div>
            <div style={{ fontSize: 12, color: t.textDim }}>مجموعة {childGroup.name} · مدرب {childCoach?.name}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 14 }}>
          {myTrainings.map((tr, i) => (
            <div key={tr.id} style={{ background: t.bg, borderRadius: 10, padding: 14, border: `1px solid ${t.border}` }}>
              <div style={{ fontSize: 11, color: t.textDim, marginBottom: 6 }}>{tr.days.join(" و ")}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#10B981" }}>{tr.time}</div>
              <div style={{ fontSize: 11, color: t.textDim, marginTop: 4 }}>🏟 {tr.field} · ⏱ {tr.duration} دق</div>
            </div>
          ))}
          {myTrainings.length === 0 && <div style={{ color: t.textDim }}>لا توجد تمارين محددة بعد</div>}
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 20 }}>
        <Card t={t} style={{ padding: 22 }} className="s2">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
              <AnimIcon type="trophy" size={16} color="#D8A435"/> التمارين القادمة
            </div>
            <Chip text={`${myTrainings.length} تمرين مجدول`} color="#7C49A8"/>
          </div>
          
          {myTrainings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: t.textFaint }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: 13 }}>لا توجد تمارين إضافية مجدولة حالياً</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {myTrainings.slice().reverse().map((tr, idx) => {
                const trDate = tr.date ? new Date(tr.date) : null;
                const dateNum = trDate ? trDate.getDate() : "?";
                const monthName = trDate ? trDate.toLocaleDateString('ar-SA', { month: 'short' }) : (tr.days?.[0] || "موعد");
                
                return (
                  <div key={tr.id} style={{ display: "flex", gap: 16, padding: 16, borderRadius: 14, background: t.bg3, border: `1px solid ${t.border}`, animation: `fadeUp .4s ${idx * 0.1}s both` }}>
                    <div style={{ width: 60, textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: "#7C49A8" }}>{dateNum}</div>
                      <div style={{ fontSize: 10, color: t.textDim, textTransform: "uppercase" }}>{monthName}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, color: t.text, marginBottom: 4 }}>{tr.title || "تمرين دوري"}</div>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: t.textDim }}>
                        <span>⏰ {tr.time}</span>
                        <span>🏟 {tr.field}</span>
                      </div>
                      {tr.note && <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(124,73,168,.05)", borderRadius: 8, fontSize: 11, color: t.textMid, borderRight: "3px solid #7C49A8" }}>{tr.note}</div>}
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
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#06B6D4" }}>{tr.days.join(" · ")}</div>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>{tr.time} ({tr.duration} دق)</div>
                  <div style={{ fontSize: 11, color: t.textDim }}>{tr.field} · {tr.trainingFocus}</div>
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
    
    const currentLastDate = new Date(conversationsMap[partnerId].lastMessage.date || 0);
    const msgDate = new Date(m.date || 0);
    if (msgDate >= currentLastDate) {
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
        date: new Date().toISOString().split("T")[0],
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
      date: new Date().toISOString().split("T")[0],
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
    const myGroupPlayerIds = (players || []).filter(p => p.groupId === myGroupId).map(p => p.parentId);
    filteredContacts = filteredContacts.filter(c => c.type === "admin" || (c.type === "parent" && myGroupPlayerIds.includes(c.id)));
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
        const chatMsgs = conv ? conv.messages.slice().reverse() : [];

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
                  <button onClick={() => setFilterType("admin")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "admin" ? "#7C49A8" : "transparent", color: filterType === "admin" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>الإدارة</button>
                  <button onClick={() => setFilterType("coach")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "coach" ? "#06B6D4" : "transparent", color: filterType === "coach" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>المدربين</button>
                  {role !== "parent" && (
                    <button onClick={() => setFilterType("parent")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: filterType === "parent" ? "#10B981" : "transparent", color: filterType === "parent" ? "#fff" : t.textDim, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>أولياء الأمور</button>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                  <button onClick={() => selectGroup(filterType)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${filterType === 'all' ? '#7C49A8' : filterType === 'coach' ? '#06B6D4' : '#10B981'}`, background: "transparent", color: t.text, fontSize: 10, cursor: "pointer", fontWeight: 600 }}>تحديد كل {filterType === "all" ? "القائمة" : filterType === "coach" ? "المدربين" : "أولياء الأمور"}</button>
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
                {QUICK_TEMPLATES.map((tmp, idx) => (
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
