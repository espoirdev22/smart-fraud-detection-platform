import Card from "./Card";
import FlowChart from "./FlowChart";
import RepartitionBars from "./RepartitionBars";
import AlertsTable from "./AlertsTable";
import AnomalyList from "./AnomalyList";
import BucketChart from "./BucketChart";

function Placeholder() {
  return <p className="text-muted text-sm">A venir</p>;
}

function DashboardSkeleton({
  history = [],
  stats = { total: 0, fraudCount: 0, fraudRate: 0 },
}) {
  return (
    <div className="space-y-6">
      <Card title="Scores des dernieres transactions">
        <FlowChart history={history} />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Detection d'anomalies" accent="warn">
          <AnomalyList history={history} />
        </Card>
        <Card title="Repartition">
          <RepartitionBars stats={stats} />
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Scores par tranche" accent="safe">
          <BucketChart history={history} />
        </Card>
        <Card title="Alertes recentes">
          <AlertsTable history={history} />
        </Card>
      </div>
    </div>
  );
}

export default DashboardSkeleton;