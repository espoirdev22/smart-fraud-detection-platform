import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { fmtDay, toIsoDate } from "../../lib/format";

const PRESETS = [
  { label: "Aujourd'hui", days: 0 },
  { label: "7 derniers jours", days: 6 },
  { label: "8 derniers jours", days: 7 },
  { label: "30 derniers jours", days: 29 },
];

export default function DateRangePicker({ range, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const applyPreset = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onChange({ start: toIsoDate(start), end: toIsoDate(end) });
    setOpen(false);
  };

  const setField = (field, value) => {
    if (!value) return;
    const next = { ...range, [field]: value };
    if (next.start > next.end) return;
    onChange(next);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-2.5 text-sm shadow-card"
      >
        <Calendar size={16} className="text-soft" />
        <span>
          {fmtDay(range.start)} - {fmtDay(range.end)}
        </span>
        <ChevronDown size={16} className="text-soft" />
      </button>
      {open && (
        <div className="absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line bg-white p-4 shadow-lg">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-soft">
              Du
              <input
                type="date"
                value={range.start}
                max={range.end}
                onChange={(e) => setField("start", e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm text-ink"
              />
            </label>
            <label className="text-xs text-soft">
              Au
              <input
                type="date"
                value={range.end}
                min={range.start}
                onChange={(e) => setField("end", e.target.value)}
                className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-sm text-ink"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p.days)}
                className="rounded-full border border-line px-3 py-1 text-xs text-ink hover:bg-canvas"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
