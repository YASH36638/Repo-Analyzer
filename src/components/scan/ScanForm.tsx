import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { GitBranch, FolderOpen, Loader2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCreateScan } from '@/hooks/useScans';
import { toast } from 'sonner';

const ScanForm = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('');
  const navigate = useNavigate();
  const createScan = useCreateScan();

  const handleScan = async () => {
    if (!repoUrl) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (!/github\.com\/[\w.-]+\/[\w.-]+/.test(repoUrl)) {
      toast.error('Please enter a valid GitHub URL (e.g. https://github.com/user/repo)');
      return;
    }

    try {
      const result = await createScan.mutateAsync({
        repoUrl,
        branch: branch || 'main',
      });
      toast.success(`Analysis complete! Found ${result.stats.totalFiles} files, ${result.stats.routes} routes.`);
      navigate(`/results/${result.scanId}`);
    } catch (err: any) {
      toast.error(err?.message || 'Analysis failed. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <Tabs defaultValue="github" className="w-full">
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="github" className="flex-1 gap-2 data-[state=active]:bg-card">
            <GitBranch className="w-4 h-4" /> GitHub Repository
          </TabsTrigger>
          <TabsTrigger value="local" className="flex-1 gap-2 data-[state=active]:bg-card" disabled>
            <FolderOpen className="w-4 h-4" /> Local Folder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="github">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Analyze GitHub Repository</CardTitle>
              <CardDescription>Enter a public GitHub repository URL to scan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Repository URL</Label>
                <Input
                  placeholder="https://github.com/user/repo"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="font-mono text-sm bg-background"
                  disabled={createScan.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label>Branch (optional)</Label>
                <Input
                  placeholder="main"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="font-mono text-sm bg-background"
                  disabled={createScan.isPending}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="mt-4 bg-card border-border">
        <CardHeader><CardTitle className="text-lg">Analysis Options</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {['Dependency Graph', 'Code Analysis', 'File Tree', 'UML Diagrams', 'API Routes', 'Complexity Metrics'].map((opt) => (
              <label key={opt} className="flex items-center gap-3 cursor-pointer">
                <Checkbox defaultChecked disabled={createScan.isPending} />
                <span className="text-sm text-foreground">{opt}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {createScan.isPending && (
        <Card className="mt-4 bg-card border-border border-primary/30">
          <CardContent className="py-6 flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">Analyzing repository...</p>
              <p className="text-xs text-muted-foreground mt-1">Fetching files, detecting patterns, generating diagrams</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleScan}
        disabled={createScan.isPending || !repoUrl}
        size="lg"
        className="w-full mt-6 gap-2 font-semibold"
      >
        {createScan.isPending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Repository...</>
        ) : (
          <><Zap className="w-4 h-4" /> Start Analysis</>
        )}
      </Button>
    </motion.div>
  );
};

export default ScanForm;
