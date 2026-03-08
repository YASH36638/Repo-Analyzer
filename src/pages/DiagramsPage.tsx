import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useLatestScan, useDiagrams, useScanById } from '@/hooks/useScans';
import { Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

const DiagramsPage = () => {
  const { scanId } = useParams<{ scanId?: string }>();
  const useSpecificScan = !!scanId;

  const [copied, setCopied] = useState<string | null>(null);

  const { data: scanById, isLoading: loadingById } = useScanById(scanId);
  const { data: latestScan, isLoading: loadingLatest } = useLatestScan();

  const scan = useSpecificScan ? scanById : latestScan;
  const effectiveScanId = scanId ?? scan?.id;

  const { data: diagrams, isLoading: loadingDiagrams } = useDiagrams(effectiveScanId);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loadingDiagrams || (useSpecificScan ? loadingById : loadingLatest)) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-48" />)}</div>;
  }

  if (!scan || scan.status !== 'complete') {
    return (
      <p className="text-muted-foreground">
        {useSpecificScan
          ? 'Diagrams will be available once this scan has completed.'
          : 'No diagrams available. Run a scan first.'}
      </p>
    );
  }

  if (!diagrams?.length) {
    return (
      <p className="text-muted-foreground">
        No diagrams were generated for this scan.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">UML Diagrams</h1>
        <p className="text-muted-foreground mt-1">
          Auto-generated PlantUML diagrams for {scan.repo_name}
        </p>
      </motion.div>

      <div className="grid gap-6">
        {diagrams.map((diagram, i) => (
          <motion.div key={diagram.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{diagram.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">{diagram.type}</Badge>
                    PlantUML source
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleCopy(diagram.id, diagram.content)}>
                    {copied === diagram.id ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="bg-background rounded-lg p-4 overflow-x-auto border border-border">
                  <code className="text-sm font-mono text-muted-foreground">{diagram.content}</code>
                </pre>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DiagramsPage;
