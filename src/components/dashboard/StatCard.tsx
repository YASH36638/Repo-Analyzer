import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  variant?: 'default' | 'primary' | 'accent';
}

const StatCard = ({ icon: Icon, label, value, subtitle, variant = 'default' }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30',
        variant === 'primary' && 'glow-green border-primary/20',
        variant === 'accent' && 'glow-purple border-accent/20'
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn(
          'w-9 h-9 rounded-lg flex items-center justify-center',
          variant === 'primary' ? 'bg-primary/15 text-primary' :
          variant === 'accent' ? 'bg-accent/15 text-accent' :
          'bg-secondary text-muted-foreground'
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-3xl font-bold text-foreground font-mono">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </motion.div>
  );
};

export default StatCard;
