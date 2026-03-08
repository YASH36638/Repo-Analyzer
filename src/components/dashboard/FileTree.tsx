import { useState } from 'react';
import { FileTreeNode } from '@/types/analysis';
import { ChevronRight, Folder, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileTreeProps {
  node: FileTreeNode;
  depth?: number;
}

const FileTree = ({ node, depth = 0 }: FileTreeProps) => {
  const [open, setOpen] = useState(depth < 2);
  const isDir = node.type === 'directory';

  return (
    <div>
      <button
        onClick={() => isDir && setOpen(!open)}
        className={cn(
          'flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-secondary',
          isDir ? 'text-foreground cursor-pointer' : 'text-muted-foreground cursor-default'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {isDir && (
          <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
        )}
        {isDir ? (
          <Folder className="w-4 h-4 text-primary" />
        ) : (
          <FileText className="w-4 h-4" />
        )}
        <span className="font-mono text-xs truncate">{node.name}</span>
        {node.lines && (
          <span className="ml-auto text-[10px] text-muted-foreground font-mono">{node.lines}L</span>
        )}
      </button>
      {isDir && open && node.children?.map((child, i) => (
        <FileTree key={i} node={child} depth={depth + 1} />
      ))}
    </div>
  );
};

export default FileTree;
