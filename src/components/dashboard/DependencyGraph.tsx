import { motion } from 'framer-motion';
import { DependencyNode } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface DependencyGraphProps {
  nodes: DependencyNode[];
}

const typeColors: Record<string, string> = {
  module: 'border-primary/50 bg-primary/10 text-primary',
  controller: 'border-accent/50 bg-accent/10 text-accent',
  service: 'border-[hsl(200,80%,55%)]/50 bg-[hsl(200,80%,55%)]/10 text-[hsl(200,80%,55%)]',
  model: 'border-[hsl(35,90%,55%)]/50 bg-[hsl(35,90%,55%)]/10 text-[hsl(35,90%,55%)]',
  util: 'border-muted-foreground/50 bg-muted text-muted-foreground',
  middleware: 'border-[hsl(340,75%,55%)]/50 bg-[hsl(340,75%,55%)]/10 text-[hsl(340,75%,55%)]',
};

const DependencyGraph = ({ nodes }: DependencyGraphProps) => {
  const grouped = {
    module: nodes.filter(n => n.type === 'module'),
    controller: nodes.filter(n => n.type === 'controller'),
    service: nodes.filter(n => n.type === 'service'),
    model: nodes.filter(n => n.type === 'model'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([type, items]) => (
        items.length > 0 && (
          <div key={type}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {type}s ({items.length})
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((node, i) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'rounded-lg border p-3 cursor-pointer transition-all hover:scale-[1.02]',
                    typeColors[node.type]
                  )}
                >
                  <p className="text-sm font-semibold font-mono truncate">{node.name}</p>
                  <div className="flex gap-3 mt-2 text-[10px] opacity-70">
                    <span>{node.metrics.lines} lines</span>
                    <span>{node.connections.length} deps</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
};

export default DependencyGraph;
