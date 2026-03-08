import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import ScanPage from "./pages/ScanPage";
import ResultsPage from "./pages/ResultsPage";
import DependenciesPage from "./pages/DependenciesPage";
import DiagramsPage from "./pages/DiagramsPage";
import DocsPage from "./pages/DocsPage";
import NotFound from "./pages/NotFound";
import ErrorBoundary from "./components/common/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ErrorBoundary>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/scan" element={<ScanPage />} />
              <Route path="/results/:scanId" element={<ResultsPage />} />
              <Route path="/results" element={<ResultsPage />} />
              <Route path="/dependencies" element={<DependenciesPage />} />
              <Route path="/diagrams/:scanId" element={<DiagramsPage />} />
              <Route path="/diagrams" element={<DiagramsPage />} />
              <Route path="/docs/:scanId" element={<DocsPage />} />
              <Route path="/docs" element={<DocsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
