import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { ProjectsListPage } from '@/pages/ProjectsListPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import KanbanBoardPage from '@/pages/KanbanBoardPage';
import { DependencyGraphPage } from '@/pages/DependencyGraphPage';
import { EscalationsPage } from '@/pages/EscalationsPage';
import { Login } from '@/pages/Login';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Login route without MainLayout */}
          <Route path="/login" element={<Login />} />

          {/* All other routes with MainLayout */}
          <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/projects" element={<MainLayout><ProjectsListPage /></MainLayout>} />
          <Route path="/projects/:id" element={<MainLayout><ProjectDetailPage /></MainLayout>} />
          <Route path="/projects/:projectId/stories" element={<MainLayout><KanbanBoardPage /></MainLayout>} />
          <Route path="/projects/:projectId/dependencies" element={<MainLayout><DependencyGraphPage /></MainLayout>} />
          <Route path="/escalations" element={<MainLayout><EscalationsPage /></MainLayout>} />
          <Route path="/stories" element={<MainLayout><PlaceholderPage title="Stories" /></MainLayout>} />
          <Route path="*" element={<MainLayout><NotFound /></MainLayout>} />
        </Routes>
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
