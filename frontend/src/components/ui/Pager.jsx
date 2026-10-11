import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pager({ offset, limit, total, onChange }) {
  if (total <= limit) return null;
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-soft">
      <span>{offset + 1} à {Math.min(offset + limit, total)} sur {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(offset - limit)} className="rounded-md border border-line p-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
        <span>Page {page} / {pages}</span>
        <button disabled={page >= pages} onClick={() => onChange(offset + limit)} className="rounded-md border border-line p-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
      </div>
    </div>
  );
}
