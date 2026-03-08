import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import DependencyGraph from '@/components/dashboard/DependencyGraph';
import { useLatestScan, useDependencies } from '@/hooks/useScans';
import { DependencyNode } from '@/types/analysis';

const DependenciesPage = () => {
  const { data: latestScan, isLoading: loadingScan } = useLatestScan();
  const { data: deps, isLoading: loadingDeps } = useDependencies(latestScan?.id);

  const isLoading = loadingScan || loadingDeps;

  const nodes: DependencyNode[] = (deps || []).map(d => ({
    id: d.id,
    name: d.name,
    type: d.type as DependencyNode['type'],
    connections: d.connections || [],
    metrics: { lines: d.lines, imports: d.imports, exports: d.exports, complexity: d.complexity },
  }));

  const controllers = nodes.filter(n => n.type === 'controller').length;
  const services = nodes.filter(n => n.type === 'service').length;
  const models = nodes.filter(n => n.type === 'model').length;

  if (isLoading) {
    return <div className="space-y-4">{[1,2].map(i => <Skeleton key={i} className="h-48" />)}</div>;
  }

  if (!latestScan) {
    return <p className="text-muted-foreground">No scan data available. Run a scan first.</p>;
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dependency Graph</h1>
        <p className="text-muted-foreground mt-1">Visualize module relationships and data flow</p>
      </motion.div>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg">Module Dependencies</CardTitle></CardHeader>
        <CardContent><DependencyGraph nodes={nodes} /></CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg">Flow: Controller → Service → Model</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-8">
            {[
              { label: 'Controllers', count: controllers },
              { label: 'Services', count: services },
              { label: 'Models', count: models },
            ].map((layer, i) => (
              <div key={layer.label} className="flex items-center gap-4">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.2 }} className="rounded-xl border border-border bg-secondary px-6 py-4 text-center">
                  <p className="text-sm font-semibold text-foreground">{layer.label}</p>
                  <p className="text-2xl font-bold font-mono text-primary mt-1">{layer.count}</p>
                </motion.div>
                {i < 2 && <div className="text-muted-foreground text-lg">→</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DependenciesPage;
