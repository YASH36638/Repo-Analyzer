export interface ScanResult {
  id: string;
  repoName: string;
  repoUrl?: string;
  scanDate: string;
  status: 'pending' | 'scanning' | 'analyzing' | 'complete' | 'error';
  progress: number;
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: { name: string; percentage: number; color: string }[];
    modules: number;
    controllers: number;
    services: number;
    routes: number;
  };
  dependencies: DependencyNode[];
  diagrams: DiagramResult[];
}

export interface DependencyNode {
  id: string;
  name: string;
  type: 'controller' | 'service' | 'module' | 'model' | 'util' | 'middleware';
  connections: string[];
  metrics: {
    lines: number;
    imports: number;
    exports: number;
    complexity: number;
  };
}

export interface DiagramResult {
  id: string;
  type: 'class' | 'component' | 'sequence';
  title: string;
  content: string;
}

export interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  language?: string;
  lines?: number;
}
