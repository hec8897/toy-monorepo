import { ConceptGrowthChart } from './ConceptGrowthChart';
import { KpiCardGrid } from './KpiCardGrid';
import { WeeklyHeatmap } from './WeeklyHeatmap';

export function DashboardPageView() {
  return (
    <section className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">대시보드</h1>
      <KpiCardGrid />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ConceptGrowthChart />
        <WeeklyHeatmap />
      </div>
    </section>
  );
}
