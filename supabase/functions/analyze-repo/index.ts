// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Language detection from file extensions
const LANG_MAP: Record<string, { name: string; color: string }> = {
  ts: { name: "TypeScript", color: "hsl(200, 80%, 55%)" },
  tsx: { name: "TypeScript", color: "hsl(200, 80%, 55%)" },
  js: { name: "JavaScript", color: "hsl(50, 90%, 55%)" },
  jsx: { name: "JavaScript", color: "hsl(50, 90%, 55%)" },
  py: { name: "Python", color: "hsl(210, 60%, 50%)" },
  java: { name: "Java", color: "hsl(15, 80%, 50%)" },
  go: { name: "Go", color: "hsl(195, 70%, 55%)" },
  rs: { name: "Rust", color: "hsl(25, 80%, 50%)" },
  rb: { name: "Ruby", color: "hsl(0, 70%, 50%)" },
  php: { name: "PHP", color: "hsl(240, 50%, 55%)" },
  css: { name: "CSS", color: "hsl(264, 60%, 55%)" },
  scss: { name: "SCSS", color: "hsl(330, 60%, 55%)" },
  html: { name: "HTML", color: "hsl(14, 80%, 55%)" },
  json: { name: "JSON", color: "hsl(35, 90%, 55%)" },
  yaml: { name: "YAML", color: "hsl(340, 75%, 55%)" },
  yml: { name: "YAML", color: "hsl(340, 75%, 55%)" },
  md: { name: "Markdown", color: "hsl(215, 12%, 60%)" },
  prisma: { name: "Prisma", color: "hsl(265, 80%, 60%)" },
  sql: { name: "SQL", color: "hsl(180, 60%, 50%)" },
  sh: { name: "Shell", color: "hsl(120, 40%, 50%)" },
  dockerfile: { name: "Docker", color: "hsl(210, 80%, 55%)" },
  vue: { name: "Vue", color: "hsl(153, 47%, 49%)" },
  svelte: { name: "Svelte", color: "hsl(15, 100%, 50%)" },
  dart: { name: "Dart", color: "hsl(195, 85%, 45%)" },
  kt: { name: "Kotlin", color: "hsl(270, 60%, 55%)" },
  swift: { name: "Swift", color: "hsl(20, 90%, 55%)" },
  c: { name: "C", color: "hsl(210, 40%, 50%)" },
  cpp: { name: "C++", color: "hsl(210, 60%, 55%)" },
  h: { name: "C/C++ Header", color: "hsl(210, 30%, 55%)" },
  cs: { name: "C#", color: "hsl(270, 50%, 50%)" },
};

interface TreeItem {
  path: string;
  type: string;
  size?: number;
  url?: string;
}

interface FileTreeNode {
  name: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
  language?: string;
  lines?: number;
}

interface AnalyzedFile {
  path: string;
  content: string;
  lines: number;
  language: string;
}

interface DetectedModule {
  name: string;
  type: "controller" | "service" | "module" | "model" | "util" | "middleware";
  lines: number;
  imports: number;
  exports: number;
  complexity: number;
  connections: string[];
}

interface DetectedRoute {
  method: string;
  path: string;
  controller: string;
  handler: string;
}


function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(
    /github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function fetchRepoTree(
  owner: string,
  repo: string,
  branch = "main"
): Promise<TreeItem[]> {
  // Try the specified branch first, then fall back to master
  for (const b of [branch, "master"]) {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`,
      {
        headers: {
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "RepoAnalyzer/1.0",
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      return data.tree || [];
    }
    await res.text(); // consume body
  }
  throw new Error(`Could not fetch repo tree for ${owner}/${repo}`);
}

async function fetchFileContent(
  owner: string,
  repo: string,
  path: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      headers: {
        Accept: "application/vnd.github.v3.raw",
        "User-Agent": "RepoAnalyzer/1.0",
      },
    }
  );
  if (!res.ok) {
    await res.text();
    return "";
  }
  return await res.text();
}

function buildFileTree(items: TreeItem[], repoName: string): FileTreeNode {
  const root: FileTreeNode = { name: repoName, type: "directory", children: [] };

  for (const item of items) {
    if (item.type !== "blob") continue;
    const parts = item.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      if (isFile) {
        const ext = part.split(".").pop()?.toLowerCase() || "";
        const lang = LANG_MAP[ext];
        current.children = current.children || [];
        current.children.push({
          name: part,
          type: "file",
          language: lang?.name || "Other",
          lines: item.size ? Math.ceil(item.size / 40) : 0, 
        });
      } else {
        current.children = current.children || [];
        let dir = current.children.find(
          (c) => c.name === part && c.type === "directory"
        );
        if (!dir) {
          dir = { name: part, type: "directory", children: [] };
          current.children.push(dir);
        }
        current = dir;
      }
    }
  }

  return root;
}

function detectLanguages(
  items: TreeItem[]
): { name: string; percentage: number; color: string }[] {
  const counts: Record<string, { count: number; color: string }> = {};
  let total = 0;

  for (const item of items) {
    if (item.type !== "blob") continue;
    const ext = item.path.split(".").pop()?.toLowerCase() || "";
    const lang = LANG_MAP[ext];
    if (lang) {
      counts[lang.name] = counts[lang.name] || { count: 0, color: lang.color };
      counts[lang.name].count++;
      total++;
    } else {
      counts["Other"] = counts["Other"] || {
        count: 0,
        color: "hsl(215, 12%, 50%)",
      };
      counts["Other"].count++;
      total++;
    }
  }

  return Object.entries(counts)
    .map(([name, { count, color }]) => ({
      name,
      percentage: Math.round((count / total) * 100),
      color,
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8);
}

function analyzeFile(path: string, content: string): DetectedModule | null {
  const fileName = path.split("/").pop() || "";
  const lines = content.split("\n").length;

  let type: DetectedModule["type"] = "util";
  if (/\.controller\.(ts|js)$/.test(fileName) || /@Controller/.test(content))
    type = "controller";
  else if (/\.service\.(ts|js)$/.test(fileName) || /@Injectable/.test(content))
    type = "service";
  else if (/\.module\.(ts|js)$/.test(fileName) || /@Module/.test(content))
    type = "module";
  else if (
    /\.model\.(ts|js)$/.test(fileName) ||
    /\.entity\.(ts|js)$/.test(fileName) ||
    /\.schema\.(ts|js)$/.test(fileName) ||
    /@Entity/.test(content) ||
    /model/.test(fileName)
  )
    type = "model";
  else if (/\.middleware\.(ts|js)$/.test(fileName) || /middleware/i.test(fileName))
    type = "middleware";

  // Only track meaningful modules
  if (
    type === "util" &&
    !/(index|main|app)\.(ts|js)$/.test(fileName) &&
    lines < 20
  )
    return null;

  const importMatches = content.match(/^import\s/gm) || [];
  const requireMatches = content.match(/require\(/gm) || [];
  const imports = importMatches.length + requireMatches.length;

  const exportMatches = content.match(/^export\s/gm) || [];
  const exports = exportMatches.length;

  const ifs = (content.match(/\bif\s*\(/g) || []).length;
  const loops = (content.match(/\b(for|while|do)\s*[\({]/g) || []).length;
  const catches = (content.match(/\bcatch\s*\(/g) || []).length;
  const ternaries = (content.match(/\?.*:/g) || []).length;
  const switches = (content.match(/\bswitch\s*\(/g) || []).length;
  const complexity = 1 + ifs + loops + catches + Math.floor(ternaries / 2) + switches * 2;

  const classMatch = content.match(/class\s+(\w+)/);
  const name = classMatch ? classMatch[1] : fileName.replace(/\.(ts|js|tsx|jsx)$/, "");

  const connections: string[] = [];
  const importFrom = content.matchAll(/from\s+['"](.+?)['"]/g);
  for (const m of importFrom) {
    const importPath = m[1];
    if (importPath.startsWith(".")) {
      const importName = importPath.split("/").pop()?.replace(/\.(ts|js)$/, "") || "";
      if (importName) connections.push(importName);
    }
  }

  return { name, type, lines, imports, exports, complexity, connections };
}

function detectRoutes(path: string, content: string): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const fileName = path.split("/").pop() || "";

  const controllerMatch = content.match(/@Controller\(['"](.+?)['"]\)/);
  const basePath = controllerMatch ? controllerMatch[1] : "";
  const className =
    content.match(/class\s+(\w+)/)?.[1] ||
    fileName.replace(/\.(ts|js)$/, "");

  const decoratorRegex =
    /@(Get|Post|Put|Delete|Patch)\(\s*['"]?([^'")\s]*)?['"]?\s*\)/g;
  let match;
  while ((match = decoratorRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const routePath = match[2] || "";
    const fullPath = `/${basePath}/${routePath}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

    const afterDecorator = content.slice(match.index + match[0].length);
    const handlerMatch = afterDecorator.match(
      /(?:async\s+)?(\w+)\s*\(/
    );
    const handler = handlerMatch ? handlerMatch[1] : "handler";

    routes.push({ method, path: fullPath, controller: className, handler });
  }

  const expressRegex =
    /(?:app|router)\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
  while ((match = expressRegex.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      controller: className,
      handler: "handler",
    });
  }

  const fastifyRegex =
    /fastify\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
  while ((match = fastifyRegex.exec(content)) !== null) {
    routes.push({
      method: match[1].toUpperCase(),
      path: match[2],
      controller: className,
      handler: "handler",
    });
  }

  return routes;
}

function generateDiagrams(
  modules: DetectedModule[],
  routes: DetectedRoute[]
): { type: string; title: string; content: string }[] {
  const diagrams: { type: string; title: string; content: string }[] = [];

  const controllers = modules.filter((m) => m.type === "controller");
  const services = modules.filter((m) => m.type === "service");
  const models = modules.filter((m) => m.type === "model");

  let componentUml = "@startuml\nskinparam packageStyle rectangle\n";
  if (controllers.length) {
    componentUml += '\npackage "Controllers" {\n';
    controllers.forEach((c) => (componentUml += `  [${c.name}]\n`));
    componentUml += "}\n";
  }
  if (services.length) {
    componentUml += '\npackage "Services" {\n';
    services.forEach((s) => (componentUml += `  [${s.name}]\n`));
    componentUml += "}\n";
  }
  if (models.length) {
    componentUml += '\npackage "Models" {\n';
    models.forEach((m) => (componentUml += `  [${m.name}]\n`));
    componentUml += "}\n";
  }
  for (const mod of modules) {
    for (const conn of mod.connections) {
      const target = modules.find(
        (m) => m.name.toLowerCase().includes(conn.toLowerCase())
      );
      if (target && target.name !== mod.name) {
        componentUml += `[${mod.name}] --> [${target.name}]\n`;
      }
    }
  }
  componentUml += "@enduml";
  diagrams.push({
    type: "component",
    title: "System Architecture",
    content: componentUml,
  });

  let classUml = "@startuml\n";
  for (const mod of modules) {
    if (mod.type === "model" || mod.type === "service" || mod.type === "controller") {
      const stereotype =
        mod.type === "model"
          ? "<<entity>>"
          : mod.type === "service"
            ? "<<service>>"
            : "<<controller>>";
      classUml += `class ${mod.name} ${stereotype} {\n`;
      classUml += `  lines: ${mod.lines}\n`;
      classUml += `  complexity: ${mod.complexity}\n`;
      classUml += "}\n";
    }
  }
  classUml += "@enduml";
  diagrams.push({
    type: "class",
    title: "Module Classes",
    content: classUml,
  });

  if (routes.length > 0) {
    let seqUml = "@startuml\nactor Client\n";
    const uniqueControllers = [...new Set(routes.map((r) => r.controller))];
    uniqueControllers.forEach((c) => (seqUml += `participant ${c}\n`));

    for (const route of routes.slice(0, 10)) {
      seqUml += `Client -> ${route.controller}: ${route.method} ${route.path}\n`;
      seqUml += `${route.controller} --> Client: response\n`;
    }
    seqUml += "@enduml";
    diagrams.push({
      type: "sequence",
      title: "API Request Flow",
      content: seqUml,
    });
  }

  return diagrams;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  let scanId: string | null = null;

  try {
    const { repoUrl, branch = "main" } = await req.json();

    if (!repoUrl) {
      return new Response(
        JSON.stringify({ error: "repoUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return new Response(
        JSON.stringify({ error: "Invalid GitHub URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { owner, repo } = parsed;

    const { data: scanRecord, error: insertError } = await supabase
      .from("scan_results")
      .insert({
        repo_name: repo,
        repo_url: repoUrl,
        status: "scanning",
        progress: 10,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    scanId = scanRecord.id;

    const tree = await fetchRepoTree(owner, repo, branch);
    const files = tree.filter((t: TreeItem) => t.type === "blob");

    await supabase
      .from("scan_results")
      .update({ progress: 30, status: "scanning" })
      .eq("id", scanId);

    const languages = detectLanguages(files);
    const totalFiles = files.length;
    const totalLines = files.reduce(
      (sum: number, f: TreeItem) => sum + Math.ceil((f.size || 0) / 40),
      0
    );

    const fileTree = buildFileTree(files, repo);

    await supabase
      .from("scan_results")
      .update({ progress: 50, status: "analyzing" })
      .eq("id", scanId);

    const sourceFiles = files
      .filter((f: TreeItem) => {
        const ext = f.path.split(".").pop()?.toLowerCase() || "";
        return ["ts", "js", "tsx", "jsx", "py", "java", "go", "rb"].includes(ext);
      })
      .filter(
        (f: TreeItem) =>
          !f.path.includes("node_modules") &&
          !f.path.includes("dist/") &&
          !f.path.includes(".test.") &&
          !f.path.includes(".spec.") &&
          !f.path.includes("__tests__")
      )
      .slice(0, 50); 

    const analyzedModules: DetectedModule[] = [];
    const allRoutes: DetectedRoute[] = [];

    
    for (let i = 0; i < sourceFiles.length; i += 5) {
      const batch = sourceFiles.slice(i, i + 5);
      const contents = await Promise.all(
        batch.map((f: TreeItem) => fetchFileContent(owner, repo, f.path))
      );

      for (let j = 0; j < batch.length; j++) {
        const content = contents[j];
        if (!content) continue;

        const mod = analyzeFile(batch[j].path, content);
        if (mod) analyzedModules.push(mod);

        const routes = detectRoutes(batch[j].path, content);
        allRoutes.push(...routes);
      }

      const progress = 50 + Math.floor((i / sourceFiles.length) * 35);
      await supabase
        .from("scan_results")
        .update({ progress })
        .eq("id", scanId);
    }

    const diagrams = generateDiagrams(analyzedModules, allRoutes);

    await supabase
      .from("scan_results")
      .update({ progress: 90, status: "analyzing" })
      .eq("id", scanId);

    const modulesCount = analyzedModules.filter(
      (m) => m.type === "module"
    ).length;
    const controllersCount = analyzedModules.filter(
      (m) => m.type === "controller"
    ).length;
    const servicesCount = analyzedModules.filter(
      (m) => m.type === "service"
    ).length;

    if (analyzedModules.length > 0) {
      await supabase.from("dependencies").insert(
        analyzedModules.map((m) => ({
          scan_id: scanId,
          name: m.name,
          type: m.type,
          connections: m.connections,
          lines: m.lines,
          imports: m.imports,
          exports: m.exports,
          complexity: m.complexity,
        }))
      );
    }

    if (diagrams.length > 0) {
      await supabase.from("diagrams").insert(
        diagrams.map((d) => ({
          scan_id: scanId,
          type: d.type,
          title: d.title,
          content: d.content,
        }))
      );
    }

    if (allRoutes.length > 0) {
      await supabase.from("api_routes").insert(
        allRoutes.map((r) => ({
          scan_id: scanId,
          method: r.method,
          path: r.path,
          controller: r.controller,
          handler: r.handler,
        }))
      );
    }

    const { data: finalResult, error: updateError } = await supabase
      .from("scan_results")
      .update({
        status: "complete",
        progress: 100,
        total_files: totalFiles,
        total_lines: totalLines,
        languages,
        modules_count: modulesCount || analyzedModules.length,
        controllers_count: controllersCount,
        services_count: servicesCount,
        routes_count: allRoutes.length,
        file_tree: fileTree,
      })
      .eq("id", scanId)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        scanId: finalResult.id,
        status: "complete",
        stats: {
          totalFiles,
          totalLines,
          modules: analyzedModules.length,
          controllers: controllersCount,
          services: servicesCount,
          routes: allRoutes.length,
          diagrams: diagrams.length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Analysis error:", error);

    const message = error instanceof Error ? error.message : "Analysis failed";

    if (scanId) {
      try {
        await supabase
          .from("scan_results")
          .update({ status: "error" })
          .eq("id", scanId);
      } catch (updateErr) {
        console.error("Failed to mark scan as error:", updateErr);
      }
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
