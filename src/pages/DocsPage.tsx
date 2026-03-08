import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { useLatestScan, useDependencies, useApiRoutes, useScanById } from '@/hooks/useScans';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useParams } from 'react-router-dom';

const DocsPage = () => {
  const { scanId } = useParams<{ scanId?: string }>();
  const useSpecificScan = !!scanId;

  const { data: scanById, isLoading: loadingById } = useScanById(scanId);
  const { data: latestScan, isLoading: loadingLatest } = useLatestScan();

  const scan = useSpecificScan ? scanById : latestScan;
  const effectiveScanId = scanId ?? scan?.id;

  const { data: dependencies, isLoading: loadingDeps } = useDependencies(effectiveScanId);
  const { data: routes, isLoading: loadingRoutes } = useApiRoutes(effectiveScanId);

  const loading =
    (useSpecificScan ? loadingById : loadingLatest) ||
    (scan && (loadingDeps || loadingRoutes));

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Documentation</h1>
            <p className="text-muted-foreground mt-1">
              {useSpecificScan
                ? 'No analysis data found for this scan.'
                : 'Run an analysis to generate documentation for your codebase.'}
            </p>
          </div>
        </motion.div>

        <Card className="bg-card border-border">
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-muted-foreground text-sm">No analysis results found. Start by scanning a repository.</p>
            <Link to="/scan">
              <Button>New Scan</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (scan.status !== 'complete') {
    return (
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Documentation</h1>
          <p className="text-muted-foreground mt-1">
            Documentation will be available once the analysis for this scan is complete. Current status:{' '}
            <span className="font-semibold">{scan.status}</span>.
          </p>
        </motion.div>
      </div>
    );
  }

  const languages = (scan.languages as any[]) || [];
  const primaryLanguage = languages[0]?.name as string | undefined;
  const totalRoutes = routes?.length ?? scan.routes_count;
  const totalModules = scan.modules_count;
  const controllersCount = scan.controllers_count;
  const servicesCount = scan.services_count;

  const sortedDeps = (dependencies || []).slice().sort((a, b) => b.complexity - a.complexity);
  const mostComplex = sortedDeps[0];
  const highComplexityCount = (dependencies || []).filter((d) => d.complexity > 10).length;

  const methodCounts = (routes || []).reduce<Record<string, number>>((acc, r) => {
    acc[r.method] = (acc[r.method] || 0) + 1;
    return acc;
  }, {});

  const sections = [
    {
      title: 'Architecture Overview',
      content: `The **${scan.repo_name}** repository was analyzed on ${new Date(scan.scan_date).toLocaleString()}.

The codebase contains **${totalModules} modules**, including ${controllersCount} controllers and ${servicesCount} services.
The analyzer detected **${scan.total_files} files** and approximately **${scan.total_lines.toLocaleString()} lines of code**.

${primaryLanguage ? `The primary language is **${primaryLanguage}**, with ${languages.length} languages detected in total.` : 'The project uses multiple languages across the codebase.'}`,
    },
    {
      title: 'API Summary',
      content: `The analyzer detected **${totalRoutes} HTTP routes** in the project.

${Object.keys(methodCounts).length > 0
  ? `Routes by HTTP method:
${Object.entries(methodCounts)
  .map(([method, count]) => `- ${method}: ${count} route${count === 1 ? '' : 's'}`)
  .join('\n')}`
  : 'No explicit HTTP routes were detected in the analyzed files.'}`,
    },
    {
      title: 'Dependency Graph Highlights',
      content: `The dependency analysis identified **${dependencies?.length ?? 0} modules** with import/export relationships.

${mostComplex
  ? `The most complex module is \`${mostComplex.name}\` (type: ${mostComplex.type}) with a complexity score of **${mostComplex.complexity}**, ${mostComplex.imports} imports, and ${mostComplex.exports} exports.`
  : 'No significant module dependencies were detected in the analyzed files.'}

${highComplexityCount > 0
  ? `${highComplexityCount} module${highComplexityCount === 1 ? ' has' : 's have'} a complexity score greater than 10 and may benefit from refactoring or additional tests.`
  : 'Overall complexity appears manageable with no modules flagged above the default threshold.'}`,
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Documentation</h1>
          <p className="text-muted-foreground mt-1">Auto-generated documentation for your latest repository analysis.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export All (.md)
        </Button>
      </motion.div>

      <div className="space-y-6">
        {sections.map((section, i) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-sm max-w-none">
                  {section.content.split('\n').map((line, j) => {
                    if (line.startsWith('|')) {
                      return (
                        <code key={j} className="block text-xs font-mono text-muted-foreground">
                          {line}
                        </code>
                      );
                    }
                    if (line.startsWith('- ')) {
                      return (
                        <p key={j} className="text-sm text-muted-foreground ml-4">
                          • {line.slice(2)}
                        </p>
                      );
                    }
                    if (line.match(/^\d+\./)) {
                      return (
                        <p key={j} className="text-sm text-muted-foreground ml-4">
                          {line}
                        </p>
                      );
                    }
                    if (line.trim() === '') return <br key={j} />;
                    return (
                      <p
                        key={j}
                        className="text-sm text-muted-foreground leading-relaxed"
                      >
                        {line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1')}
                      </p>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DocsPage;
