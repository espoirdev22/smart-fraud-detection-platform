import { useState, useEffect } from "react";
import TransactionForm from "./components/TransactionForm";
import RiskGauge from "./components/RiskGauge";
import TransactionTable from "./components/TransactionTable";
import StatsChart from "./components/StatsChart";
import { getTransactions, getStatistics } from "./services/api";

function getRiskLevel(probability) {
  if (probability >= 0.7) return { label: "Risque eleve", color: "alert" };
  if (probability >= 0.3) return { label: "Risque modere", color: "warn" };
  return { label: "Risque faible", color: "safe" };
}

function getMainFactor(transaction) {
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

  const risk = result ? getRiskLevel(result.fraud_probability) : null;
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
      <header className="border-b border-border px-8 py-6">
        <h1 className="font-mono text-xl tracking-tight">
          Smart Fraud Detection
        </h1>
        <p className="text-muted text-sm mt-1">
          Detection de fraude mobile money — PaySim
        </p>
      </header>

      <div className="bg-surface border-b border-border px-8 py-4">
        <p className="text-muted text-sm max-w-3xl">
          Cette IA analyse une transaction mobile money et evalue son niveau de risque
          de fraude en temps reel. Le modele a ete entraine sur plus de 6 millions de
          transactions simulees, avec un score de fiabilite de 0,97 (F1-score).
        </p>
      </div>

      <main className="px-8 py-10 max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TransactionForm onResult={handleResult} />

          <div className="bg-surface border border-border rounded-lg p-6 flex flex-col items-center">
            <h2 className="font-mono text-sm text-muted uppercase tracking-wide mb-4 self-start">
              Resultat
            </h2>

            {result ? (
              <div className={`flex flex-col items-center text-${risk.color}`}>
                <div className="relative">
                  <RiskGauge percentage={percentage} colorClass={`text-${risk.color}`} />
                  <p className="font-mono text-2xl absolute inset-x-0 bottom-2 text-center text-text">
                    {percentage.toFixed(1)}%
                  </p>
                </div>
                <p className="mt-2 font-medium">{risk.label}</p>
                {lastTransaction && (
                  <p className="text-muted text-xs mt-3 text-center max-w-xs">
                    {getMainFactor(lastTransaction)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted text-sm self-start">
                Remplis le formulaire pour voir une prediction.
              </p>
            )}
          </div>
        </div>
        <StatsChart stats={stats} />
        <TransactionTable history={history} />
      </main>
    </div>
  );
}

export default App;