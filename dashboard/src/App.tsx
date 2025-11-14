import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { MainLayout } from '@/components/layout/MainLayout';
import { Dashboard } from '@/pages/Dashboard';
import { NotFound } from '@/pages/NotFound';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />

            {/* Placeholder routes for future stories */}
            <Route path="/projects" element={<PlaceholderPage title="Projects" />} />
            <Route path="/escalations" element={<PlaceholderPage title="Escalations" />} />
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
