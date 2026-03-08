import { motion } from 'framer-motion';
import ScanForm from '@/components/scan/ScanForm';

const ScanPage = () => {
  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">New Scan</h1>
        <p className="text-muted-foreground mt-1">Analyze a GitHub repository or local project</p>
      </motion.div>
      <ScanForm />
    </div>
  );
};

export default ScanPage;
