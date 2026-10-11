import DetailPanel from "./DetailPanel";

export default function TransactionDrawer({ id, onClose, onChanged }) {
  if (!id) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30 print:hidden" onClick={onClose}>
      <div className="h-full w-full max-w-sm overflow-y-auto bg-canvas p-3" onClick={(e) => e.stopPropagation()}>
        <DetailPanel id={id} onClose={onClose} onChanged={onChanged} />
      </div>
    </div>
  );
}
