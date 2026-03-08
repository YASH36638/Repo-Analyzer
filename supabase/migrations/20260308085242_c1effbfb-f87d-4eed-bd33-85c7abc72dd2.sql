
-- Create scan_results table
CREATE TABLE public.scan_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repo_name TEXT NOT NULL,
  repo_url TEXT,
  scan_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scanning', 'analyzing', 'complete', 'error')),
  progress INTEGER NOT NULL DEFAULT 0,
  total_files INTEGER NOT NULL DEFAULT 0,
  total_lines INTEGER NOT NULL DEFAULT 0,
  languages JSONB NOT NULL DEFAULT '[]'::jsonb,
  modules_count INTEGER NOT NULL DEFAULT 0,
  controllers_count INTEGER NOT NULL DEFAULT 0,
  services_count INTEGER NOT NULL DEFAULT 0,
  routes_count INTEGER NOT NULL DEFAULT 0,
  file_tree JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dependencies table
CREATE TABLE public.dependencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('controller', 'service', 'module', 'model', 'util', 'middleware')),
  connections TEXT[] NOT NULL DEFAULT '{}',
  lines INTEGER NOT NULL DEFAULT 0,
  imports INTEGER NOT NULL DEFAULT 0,
  exports INTEGER NOT NULL DEFAULT 0,
  complexity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create diagrams table
CREATE TABLE public.diagrams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('class', 'component', 'sequence')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create api_routes table
CREATE TABLE public.api_routes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id UUID NOT NULL REFERENCES public.scan_results(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  controller TEXT NOT NULL,
  handler TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_routes ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth for this tool)
CREATE POLICY "Anyone can read scan results" ON public.scan_results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scan results" ON public.scan_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update scan results" ON public.scan_results FOR UPDATE USING (true);

CREATE POLICY "Anyone can read dependencies" ON public.dependencies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert dependencies" ON public.dependencies FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read diagrams" ON public.diagrams FOR SELECT USING (true);
CREATE POLICY "Anyone can insert diagrams" ON public.diagrams FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read api_routes" ON public.api_routes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert api_routes" ON public.api_routes FOR INSERT WITH CHECK (true);

-- Indexes
CREATE INDEX idx_dependencies_scan_id ON public.dependencies(scan_id);
CREATE INDEX idx_diagrams_scan_id ON public.diagrams(scan_id);
CREATE INDEX idx_api_routes_scan_id ON public.api_routes(scan_id);
CREATE INDEX idx_scan_results_status ON public.scan_results(status);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_scan_results_updated_at
  BEFORE UPDATE ON public.scan_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
