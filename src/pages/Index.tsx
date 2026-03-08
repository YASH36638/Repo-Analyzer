import { motion } from 'framer-motion';
import { FileCode, Layers, Route, Box, ArrowRight, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatCard from '@/components/dashboard/StatCard';
import LanguageBar from '@/components/dashboard/LanguageBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLatestScan, useScans } from '@/hooks/useScans';

const Index = () => {
  const { data: latestScan, isLoading: loadingScan } = useLatestScan();
  const { data: allScans, isLoading: loadingScans } = useScans();

  const languages = (latestScan?.languages as any[]) || [];

  if (loadingScan || loadingScans) {
    return (
      <div className="space-y-8">
        <div><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64 mt-2" /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  const hasData = !!latestScan;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {hasData ? 'Overview of your latest repository analysis' : 'No scans yet — start by analyzing a repository'}
        </p>
      </motion.div>

      {hasData ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={FileCode} label="Total Files" value={latestScan.total_files} subtitle="across all modules" variant="primary" />
            <StatCard icon={Layers} label="Modules" value={latestScan.modules_count} subtitle={`${latestScan.controllers_count} controllers`} />
            <StatCard icon={Route} label="API Routes" value={latestScan.routes_count} subtitle="HTTP endpoints" variant="accent" />
            <StatCard icon={Box} label="Services" value={latestScan.services_count} subtitle="injectable providers" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Language Distribution</CardTitle>
                <span className="text-xs font-mono text-muted-foreground">
                  {Number(latestScan.total_lines ?? 0).toLocaleString()} total lines
                </span>
              </CardHeader>
              <CardContent>
                <LanguageBar languages={languages} />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Link to="/scan"><Button variant="outline" className="w-full justify-between">New Scan <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link to="/diagrams"><Button variant="outline" className="w-full justify-between">View Diagrams <ArrowRight className="w-4 h-4" /></Button></Link>
                <Link to="/docs"><Button variant="outline" className="w-full justify-between">Generate Docs <ArrowRight className="w-4 h-4" /></Button></Link>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
            <FileCode className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">No scans found. Start your first analysis!</p>
            <Link to="/scan"><Button className="gap-2">New Scan <ArrowRight className="w-4 h-4" /></Button></Link>
          </CardContent>
        </Card>
      )}

      {allScans && allScans.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Recent Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allScans.slice(0, 5).map((scan) => (
                <Link key={scan.id} to={`/results/${scan.id}`} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: scan.status === 'complete' ? 'hsl(142, 72%, 50%)' : scan.status === 'error' ? 'hsl(0, 72%, 55%)' : 'hsl(45, 90%, 55%)' }} />
                    <span className="font-mono text-sm text-foreground">{scan.repo_name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={scan.status === 'complete' ? 'default' : 'destructive'} className="text-[10px]">{scan.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(scan.scan_date).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Index;
