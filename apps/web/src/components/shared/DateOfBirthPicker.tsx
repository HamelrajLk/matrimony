'use client';
import { useState, useRef, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

interface Props {
  value: string;          // ISO date string "YYYY-MM-DD" or ""
  onChange: (iso: string) => void;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function parseIso(iso: string): Date | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? undefined : d;
}

function toIso(d: Date): string {
  return d.toISOString().split('T')[0];
}

function calcAge(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function DateOfBirthPicker({ value, onChange }: Props) {
  const selected    = parseIso(value);
  const [open, setOpen]           = useState(false);
  const [month, setMonth]         = useState<Date>(
    selected ?? new Date(new Date().getFullYear() - 25, 0, 1)
  );
  const [navYear, setNavYear]     = useState(month.getFullYear());
  const [navMonth, setNavMonth]   = useState(month.getMonth());
  const wrapRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  /* keep nav selectors in sync with calendar month navigation */
  function handleMonthChange(m: Date) {
    setMonth(m);
    setNavYear(m.getFullYear());
    setNavMonth(m.getMonth());
  }

  /* apply nav dropdowns → jump calendar */
  function applyNav() {
    setMonth(new Date(navYear, navMonth, 1));
  }

  function handleSelect(day: Date | undefined) {
    if (!day) return;
    onChange(toIso(day));
    setOpen(false);
  }

  const age        = selected ? calcAge(selected) : null;
  const displayStr = selected
    ? selected.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  /* year range: 1940 → 18 years ago */
  const maxYear    = new Date().getFullYear() - 18;
  const minYear    = 1940;
  const yearRange  = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);

  /* max selectable date: 18 years ago */
  const maxDate    = new Date(new Date().setFullYear(new Date().getFullYear() - 18));

  return (
    <div className="relative" ref={wrapRef}>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#D0C0B0] bg-white text-left transition-all hover:border-[#F4A435] focus:outline-none focus:border-[#F4A435] focus:ring-2 focus:ring-[#F4A435]/20"
        style={{ fontFamily: "'Outfit',sans-serif" }}
      >
        <span className="text-[#9A8A7A] text-base flex-shrink-0">📅</span>
        {selected ? (
          <span className="flex-1 text-sm text-[#2A1A1A] font-medium">
            {displayStr}
            {age !== null && (
              <span className="ml-2 text-xs text-[#9A8A7A] font-normal">({age} years old)</span>
            )}
          </span>
        ) : (
          <span className="flex-1 text-sm text-[#9A8A7A]">Select date of birth</span>
        )}
        <svg
          className={`w-4 h-4 text-[#9A8A7A] transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute z-50 mt-2 bg-white rounded-2xl shadow-2xl border border-[#F0E4D0] overflow-hidden"
          style={{ minWidth: 320 }}
        >
          {/* Month / Year quick jump */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <select
              value={navMonth}
              onChange={e => setNavMonth(Number(e.target.value))}
              className="flex-1 text-sm font-semibold text-[#2A1A1A] border border-[#F0E4D0] rounded-lg px-2 py-1.5 bg-white cursor-pointer focus:outline-none focus:border-[#F4A435]"
              style={{ fontFamily: "'Outfit',sans-serif" }}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={navYear}
              onChange={e => setNavYear(Number(e.target.value))}
              className="w-24 text-sm font-semibold text-[#2A1A1A] border border-[#F0E4D0] rounded-lg px-2 py-1.5 bg-white cursor-pointer focus:outline-none focus:border-[#F4A435]"
              style={{ fontFamily: "'Outfit',sans-serif" }}
            >
              {yearRange.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={applyNav}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-white border-none cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
            >
              Go
            </button>
          </div>

          <div className="px-2 pb-3">
            {/* DayPicker — styled via Tailwind via classNames prop */}
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              month={month}
              onMonthChange={handleMonthChange}
              disabled={{ after: maxDate }}
              startMonth={new Date(minYear, 0)}
              endMonth={maxDate}
              classNames={{
                root:         'rdp-root',
                months:       'flex flex-col',
                month:        'w-full',
                month_caption: 'hidden',          /* we use our own header */
                nav:          'flex justify-between items-center px-2 mb-1',
                button_previous: 'w-7 h-7 rounded-full bg-[#F5F0EB] hover:bg-[#F0E4D0] flex items-center justify-center cursor-pointer border-none text-[#5A4A3A] text-lg leading-none',
                button_next:  'w-7 h-7 rounded-full bg-[#F5F0EB] hover:bg-[#F0E4D0] flex items-center justify-center cursor-pointer border-none text-[#5A4A3A] text-lg leading-none',
                month_grid:   'w-full border-collapse',
                weekdays:     'flex',
                weekday:      'flex-1 text-center text-[10px] font-bold text-[#9A8A7A] uppercase pb-1',
                week:         'flex mt-1',
                day:          'flex-1 flex items-center justify-center',
                day_button:   'w-8 h-8 rounded-full text-sm font-medium text-[#2A1A1A] hover:bg-[#FFF3E0] hover:text-[#E8735A] transition-colors cursor-pointer border-none bg-transparent',
                selected:     '!bg-gradient-to-br !from-[#F4A435] !to-[#E8735A] !text-white !rounded-full',
                today:        'font-extrabold text-[#E8735A]',
                disabled:     'opacity-30 cursor-not-allowed pointer-events-none',
                outside:      'opacity-25',
                hidden:       'invisible',
              }}
            />
          </div>

          {/* Clear */}
          {selected && (
            <div className="px-4 pb-3 border-t border-[#F0E4D0] pt-2">
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className="text-xs text-[#9A8A7A] hover:text-[#E8735A] transition-colors cursor-pointer bg-transparent border-none"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}

      {/* Inline age validation message */}
      {selected && age !== null && age < 18 && (
        <p className="mt-1 text-xs text-red-500 font-medium">Must be at least 18 years old</p>
      )}
    </div>
  );
}
