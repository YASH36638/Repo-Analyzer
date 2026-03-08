import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type ScanRow = Tables<'scan_results'>;
export type DependencyRow = Tables<'dependencies'>;
export type DiagramRow = Tables<'diagrams'>;
export type ApiRouteRow = Tables<'api_routes'>;

export const useScans = () => {
  return useQuery({
    queryKey: ['scans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .order('scan_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};

export const useLatestScan = () => {
  return useQuery({
    queryKey: ['latest-scan'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .order('scan_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
};

export const useScanById = (scanId: string | undefined) => {
  return useQuery({
    queryKey: ['scan', scanId],
    enabled: !!scanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_results')
        .select('*')
        .eq('id', scanId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
};

export const useDependencies = (scanId: string | undefined) => {
  return useQuery({
    queryKey: ['dependencies', scanId],
    enabled: !!scanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dependencies')
        .select('*')
        .eq('scan_id', scanId!);
      if (error) throw error;
      return data;
    },
  });
};

export const useDiagrams = (scanId: string | undefined) => {
  return useQuery({
    queryKey: ['diagrams', scanId],
    enabled: !!scanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('diagrams')
        .select('*')
        .eq('scan_id', scanId!);
      if (error) throw error;
      return data;
    },
  });
};

export const useApiRoutes = (scanId: string | undefined) => {
  return useQuery({
    queryKey: ['api-routes', scanId],
    enabled: !!scanId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_routes')
        .select('*')
        .eq('scan_id', scanId!);
      if (error) throw error;
      return data;
    },
  });
};

export const useCreateScan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { repoUrl: string; branch?: string }) => {
      const { data, error } = await supabase.functions.invoke('analyze-repo', {
        body: { repoUrl: input.repoUrl, branch: input.branch || 'main' },
      });

      if (error) throw new Error(error.message || 'Analysis failed');
      if (data?.error) throw new Error(data.error);

      return data as { scanId: string; status: string; stats: Record<string, number> };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scans'] });
      queryClient.invalidateQueries({ queryKey: ['latest-scan'] });
    },
  });
};
