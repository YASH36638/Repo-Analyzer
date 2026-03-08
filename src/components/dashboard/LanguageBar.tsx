import { motion } from 'framer-motion';

interface LanguageBarProps {
  languages: { name: string; percentage: number; color: string }[];
}

const LanguageBar = ({ languages }: LanguageBarProps) => {
  return (
    <div className="space-y-3">
      <div className="flex rounded-full overflow-hidden h-3 bg-secondary">
        {languages.map((lang, i) => (
          <motion.div
            key={lang.name}
            initial={{ width: 0 }}
            animate={{ width: `${lang.percentage}%` }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            style={{ backgroundColor: lang.color }}
            className="h-full"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {languages.map((lang) => (
          <div key={lang.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
            <span className="text-xs text-muted-foreground">
              {lang.name} <span className="font-mono text-foreground">{lang.percentage}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageBar;
