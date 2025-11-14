import { useState } from 'react';
import { EscalationCard } from '../components/escalations/EscalationCard';
import { EscalationDetailModal } from '../components/escalations/EscalationDetailModal';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { useEscalations, useEscalation } from '../hooks/useEscalations';
import { useEscalationWebSocket } from '../hooks/useEscalationWebSocket';
import { AlertCircle } from 'lucide-react';

type FilterStatus = 'all' | 'pending' | 'resolved';

export function EscalationsPage() {
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [selectedEscalationId, setSelectedEscalationId] = useState<string | null>(null);

  // Subscribe to real-time escalation updates
  useEscalationWebSocket();

  // Fetch escalations based on filter
  const statusFilter = filter === 'all' ? undefined : filter === 'resolved' ? 'resolved' : 'pending';
  const { data: escalations, isLoading, error } = useEscalations(statusFilter);

  // Fetch selected escalation details
  const { data: selectedEscalation } = useEscalation(selectedEscalationId || '');

  const handleCardClick = (id: string) => {
    setSelectedEscalationId(id);
  };

  const handleModalClose = () => {
    setSelectedEscalationId(null);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Escalations</h1>
          <p className="text-muted-foreground mt-1">
            Review and respond to workflow escalations that require your attention
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterStatus)} className="mb-6">
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Error State */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-100">Failed to load escalations</p>
            <p className="text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      )}

      {/* Escalations Grid */}
      {!isLoading && escalations && escalations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {escalations.map((escalation) => (
            <EscalationCard
              key={escalation.id}
              escalation={escalation}
              onClick={() => handleCardClick(escalation.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && escalations && escalations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No escalations found</h3>
          <p className="text-muted-foreground max-w-md">
            {filter === 'pending'
              ? "You're all caught up! There are no pending escalations at the moment."
              : filter === 'resolved'
              ? 'No resolved escalations to display.'
              : 'No escalations have been created yet.'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      <EscalationDetailModal
        escalation={selectedEscalation || null}
        open={!!selectedEscalationId}
        onOpenChange={(open) => {
          if (!open) handleModalClose();
        }}
      />
    </div>
  );
}
