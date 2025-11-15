import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import KanbanBoardPage from '@/pages/KanbanBoardPage';
import { DependencyGraphPage } from '@/pages/DependencyGraphPage';
import { EscalationsPage } from '@/pages/EscalationsPage';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Project routes */}
            <Route path="/projects" element={<ProjectsListPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/projects/:projectId/stories" element={<KanbanBoardPage />} />
            <Route path="/projects/:projectId/dependencies" element={<DependencyGraphPage />} />

            {/* Escalations route */}
            <Route path="/escalations" element={<EscalationsPage />} />

            {/* Placeholder routes for future stories */}
            <Route path="/stories" element={<PlaceholderPage title="Stories" />} />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
        <Toaster />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

/**
 * Placeholder page component for routes not yet implemented
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground">
        This page will be implemented in a future story.
      </p>
    </div>
  );
}

export default App;
