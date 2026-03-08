import { motion } from 'framer-motion';
import { Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import LanguageBar from '@/components/dashboard/LanguageBar';
import FileTree from '@/components/dashboard/FileTree';
import { useScanById, useDependencies, useApiRoutes, useLatestScan } from '@/hooks/useScans';
import { CheckCircle, ExternalLink, FileText, GitBranch } from 'lucide-react';
import { FileTreeNode } from '@/types/analysis';

const ResultsPage = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const useSpecificScan = !!scanId;

  const { data: scanById, isLoading: loadingById } = useScanById(scanId);
  const { data: latestScan, isLoading: loadingLatest } = useLatestScan();

  const scan = useSpecificScan ? scanById : latestScan;
  const effectiveScanId = scanId ?? scan?.id;

  const { data: dependencies, isLoading: loadingDeps } = useDependencies(effectiveScanId);
  const { data: routes, isLoading: loadingRoutes } = useApiRoutes(effectiveScanId);

  if (loadingById || (!useSpecificScan && loadingLatest)) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>;
  }

  if (!scan) {
    return <p className="text-muted-foreground">{useSpecificScan ? 'Scan not found.' : 'No scans found yet.'}</p>;
  }

  if (scan.status !== 'complete') {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground text-sm">
          This scan is currently <span className="font-semibold">{scan.status}</span>. Results will be available once analysis completes.
        </p>
      </div>
    );
  }

  const languages = (scan.languages as any[]) || [];
  const fileTree = scan.file_tree as unknown as FileTreeNode | null;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-mono">{scan.repo_name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            Scanned {new Date(scan.scan_date).toLocaleString()}
            <Badge className="gap-1"><CheckCircle className="w-3 h-3" /> {scan.status}</Badge>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {scan.id && (
            <>
              <Link
                to={`/docs/${scan.id}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                title="View docs for this scan"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Docs</span>
              </Link>
              <Link
                to={`/diagrams/${scan.id}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                title="View diagrams for this scan"
              >
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">Diagrams</span>
              </Link>
            </>
          )}
          {scan.repo_url && (
            <a
              href={scan.repo_url}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              title="Open repository on GitHub"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>
      </motion.div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-secondary">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">File Tree</TabsTrigger>
          <TabsTrigger value="routes">API Routes</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Files', value: scan.total_files },
              { label: 'Lines', value: scan.total_lines.toLocaleString() },
              { label: 'Modules', value: scan.modules_count },
              { label: 'Routes', value: scan.routes_count },
            ].map(s => (
              <Card key={s.label} className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-bold font-mono text-foreground mt-1">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Languages</CardTitle></CardHeader>
            <CardContent><LanguageBar languages={languages} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Project Structure</CardTitle></CardHeader>
            <CardContent>
              {fileTree ? <FileTree node={fileTree} /> : <p className="text-muted-foreground text-sm">No file tree data available.</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Detected API Routes</CardTitle></CardHeader>
            <CardContent>
              {loadingRoutes ? <Skeleton className="h-32" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead>Controller</TableHead>
                      <TableHead>Handler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes?.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant={r.method === 'GET' ? 'secondary' : 'default'} className="font-mono text-[10px]">{r.method}</Badge></TableCell>
                        <TableCell className="font-mono text-sm">{r.path}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.controller}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{r.handler}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Module Metrics</CardTitle></CardHeader>
            <CardContent>
              {loadingDeps ? <Skeleton className="h-32" /> : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Lines</TableHead>
                      <TableHead>Imports</TableHead>
                      <TableHead>Complexity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dependencies?.map(dep => (
                      <TableRow key={dep.id}>
                        <TableCell className="font-mono text-sm">{dep.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{dep.type}</Badge></TableCell>
                        <TableCell className="font-mono">{dep.lines}</TableCell>
                        <TableCell className="font-mono">{dep.imports}</TableCell>
                        <TableCell>
                          <span className={`font-mono ${dep.complexity > 10 ? 'text-destructive' : 'text-primary'}`}>{dep.complexity}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResultsPage;
