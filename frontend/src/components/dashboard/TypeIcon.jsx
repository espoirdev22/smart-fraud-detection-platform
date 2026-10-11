import { ArrowDown, ArrowUp, CreditCard, Landmark, Wallet } from "lucide-react";

const ICONS = { TRANSFER: ArrowUp, CASH_OUT: CreditCard, CASH_IN: ArrowDown, PAYMENT: Wallet, DEBIT: Landmark };

export default function TypeIcon({ type, flagged }) {
  const Icon = ICONS[type] || CreditCard;
  return <Icon size={15} className={flagged ? "text-danger" : "text-brand"} />;
}
