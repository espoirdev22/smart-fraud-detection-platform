import { useState, useEffect } from "react";
import TransactionForm from "./components/TransactionForm";
import RiskGauge from "./components/RiskGauge";
import TransactionTable from "./components/TransactionTable";
import StatsChart from "./components/StatsChart";
import { getTransactions, getStatistics } from "./services/api";
import DashboardSkeleton from "./components/DashboardSkeleton";

function getRiskLevel(action) {
  if (action === "BLOCK") return { label: "Blocage recommande", color: "alert" };
  if (action === "VERIFY") return { label: "Verification requise", color: "warn" };
  return { label: "Transaction autorisee", color: "safe" };
}

function getMainFactor(transaction, action) {
  if (action === "PASS") {
    return "Aucun facteur de risque majeur detecte.";
  }
  if (transaction.newbalanceOrig === 0) {
    return "Facteur principal : le compte emetteur a ete entierement vide apres la transaction.";
  }
  if (transaction.amount > 200000) {
    return "Facteur principal : montant de transaction eleve.";
  }
  if (transaction.type === "TRANSFER" || transaction.type === "CASH_OUT") {
    return "Facteur principal : type de transaction a risque (TRANSFER ou CASH_OUT).";
  }
  return "Aucun facteur de risque majeur detecte.";
}

function App() {
  const [result, setResult] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ total: 0, fraudCount: 0, fraudRate: 0 });

  const risk = result ? getRiskLevel(result.action) : null;
  const percentage = result ? result.fraud_probability * 100 : 0;

  const loadData = async () => {
    const transactions = await getTransactions();
    const statistics = await getStatistics();
    setHistory(
      transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        fraud_probability: t.fraud_probability,
        is_fraud: t.is_fraud_predicted,
      }))
    );
    setStats({
      total: statistics.total_transactions,
      fraudCount: statistics.total_fraud_detected,
      fraudRate: statistics.fraud_rate_percent,
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResult = (newResult, transaction) => {
    setResult(newResult);
    setLastTransaction(transaction);
    loadData();
  };

  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="border-b border-border px-8 py-6 bg-gradient-to-b from-surface to-bg">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div>
            <h1 className="font-mono text-2xl tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safe inline-block"></span>
              Smart Fraud Detection
            </h1>
            <p className="text-muted text-sm mt-1">
              Detection de fraude mobile money | PaySim
            </p>
          </div>
          <span className="font-mono text-xs text-muted border border-border rounded-full px-3 py-1">
            XGBoost · F1 0.97
          </span>
        </div>
      </header>

      <div className="bg-surface border-b border-border px-8 py-4">
        <p className="text-muted text-sm max-w-3xl mx-auto">
          Cette IA analyse une transaction mobile money et evalue son niveau de risque
          de fraude en temps reel. Le modele a ete entraine sur plus de 6 millions de
          transactions simulees, avec un score de fiabilite de 0,97 (F1-score).
        </p>
      </div>

      <main className="px-8 py-10 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TransactionForm onResult={handleResult} />

          <div className="bg-surface border border-border border-t-2 border-t-alert rounded-lg shadow-card p-6 flex flex-col items-center">
            <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-4 self-start">
              Resultat
            </h2>

            {result ? (
              <div className={`flex flex-col items-center text-${risk.color}`}>
                <div className="relative">
                  <RiskGauge percentage={percentage} colorClass={`text-${risk.color}`} />
                  <p className="font-mono text-2xl absolute inset-x-0 bottom-2 text-center text-text">
                    {result.score}
                    <span className="text-muted text-xs"> / 1000</span>
                  </p>
                </div>
                <p className="mt-2 font-medium">{risk.label}</p>
                <p className="text-muted text-xs mt-1 text-center">
                    0 a 500 : autorisee · 500 a 630 : verification · au-dela : blocage
                </p>

                {result.factors && result.factors.length > 0 ? (
                  <div className="mt-4 w-full max-w-xs">
                    <p className="text-muted text-xs uppercase tracking-wide mb-2">
                      Facteurs determinants
                    </p>
                    <ul className="space-y-1">
                      {result.factors.map((f) => (
                        <li key={f.feature} className="flex justify-between gap-3 text-xs">
                          <span className="text-text">{f.feature}</span>
                          <span className={f.direction === "hausse" ? "text-alert" : "text-safe"}>
                           {f.direction === "hausse" ? "pousse vers la fraude" : "pousse vers le normal"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  lastTransaction && (
                    <p className="text-muted text-xs mt-3 text-center max-w-xs">
                      {getMainFactor(lastTransaction, result.action)}
                    </p>
                  )
                )}
              </div>
            ) : (
              <p className="text-muted text-sm self-start">
                Remplis le formulaire pour voir une prediction.
              </p>
            )}
          </div>
        </div>
        <DashboardSkeleton history={history} stats={stats} />
        <StatsChart stats={stats} />
        <TransactionTable history={history} />
      </main>
    </div>
  );
}

export default App;