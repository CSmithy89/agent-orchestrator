# Story 6.7: Story Tracking Kanban Board

**Epic:** 6 - Remote Access & Monitoring
**Status:** ready-for-dev
**Assigned to:** Dev Agent
**Story Points:** 3-4

## User Story

As a user monitoring implementation progress,
I want a Kanban board showing story status,
So that I can visualize development progress.

## Context

This story delivers a Kanban board visualization for tracking story status across the development lifecycle. The board provides an intuitive, visual representation of stories as they move through different stages (Ready, In Progress, Code Review, Merged), enabling users to understand implementation progress at a glance.

The Kanban board integrates with the Project Detail View (Story 6.5) and State Query API (Story 6.3) to display real-time story status. Users can filter by epic, search by title, view story dependencies, and access story details with a click. The board updates automatically via WebSocket as stories progress through the development pipeline.

## Acceptance Criteria

1. [ ] Kanban board view at route `/projects/:id/stories`
2. [ ] Columns: Ready, In Progress, Code Review, Merged
3. [ ] Story cards showing: ID, title, epic, status, PR link (if exists)
4. [ ] Drag-and-drop to update status (if manual mode enabled)
5. [ ] Filter by epic or search by title
6. [ ] Click card for story details
7. [ ] Show story dependencies visually
8. [ ] Real-time updates as stories progress via WebSocket
9. [ ] Color-coding by epic for visual organization

## Technical Implementation

### Architecture

**UI Components:**
- **KanbanBoard**: Container component managing board state and columns
- **KanbanColumn**: Individual column component (Ready, In Progress, Code Review, Merged)
- **StoryCard**: Card component displaying story information
- **StoryDetailModal**: Modal for viewing detailed story information
- **StoryFilters**: Filter and search component for epic/title filtering

**State Management:**
- **TanStack Query** for story data:
  - `useProjectStories(projectId)` query (1min stale time, refetch every 30s)
  - `useUpdateStoryStatus(projectId)` mutation (if manual mode)
- **WebSocket subscriptions** for real-time updates:
  - Subscribe to `story.status.changed` events
  - Update TanStack Query cache on events
- **Local state** for filters (epic, search term)

**API Integration:**
- GET `/api/projects/:id/stories` - List all stories with status
- PATCH `/api/projects/:id/stories/:storyId/status` - Update story status (manual mode)
- WebSocket `/ws/status-updates` - Real-time story status events

### File Structure

```
dashboard/src/
├── pages/
│   └── KanbanBoardPage.tsx               # Kanban board page (AC 1)
├── components/
│   ├── kanban/
│   │   ├── KanbanBoard.tsx               # Board container (AC 2-9)
│   │   ├── KanbanColumn.tsx              # Column component (AC 2)
│   │   ├── StoryCard.tsx                 # Story card (AC 3, 7, 9)
│   │   ├── StoryDetailModal.tsx          # Story detail modal (AC 6)
│   │   └── StoryFilters.tsx              # Filter and search (AC 5)
│   └── projects/
│       └── ProjectDetailPage.tsx         # MODIFIED: Add Kanban board tab/link
├── hooks/
│   ├── useProjectStories.ts              # TanStack Query hook for stories
│   └── useStoryWebSocket.ts              # WebSocket subscription for story updates
├── api/
│   └── stories.ts                        # NEW: API client methods
└── types/
    └── story.ts                          # NEW: TypeScript types for stories
```

### Dependencies

**New Packages:**
- `@dnd-kit/core` - Drag-and-drop functionality (AC 4)
- `@dnd-kit/sortable` - Sortable lists for drag-and-drop

**shadcn/ui Components:**
- Card - Already installed ✅
- Badge - Already installed ✅
- Button - Already installed ✅
- Dialog - Already installed ✅ (for detail modal)
- Input - Already installed ✅ (for search)
- Select - Already installed ✅ (for epic filter)

**Integration Points:**
- Story 6.3: Stories API endpoints and WebSocket events
- Story 6.5: Project Detail View (add Kanban board tab)
- Story 6.4: React foundation, API client, WebSocket hook

### API Client Methods

```typescript
// dashboard/src/api/stories.ts

export interface Story {
  id: string;
  projectId: string;
  epicNumber: number;
  storyNumber: number;
  title: string;
  status: 'backlog' | 'ready' | 'in-progress' | 'review' | 'merged' | 'done';
  prUrl?: string;
  dependencies?: string[]; // Story IDs this story depends on
  epic: {
    number: number;
    title: string;
    color: string;
  };
}

export async function getProjectStories(projectId: string): Promise<Story[]> {
  return client.get<Story[]>(`/api/projects/${projectId}/stories`);
}

export async function updateStoryStatus(
  projectId: string,
  storyId: string,
  status: string
): Promise<void> {
  return client.patch(`/api/projects/${projectId}/stories/${storyId}/status`, { status });
}
```

### TanStack Query Hooks

```typescript
// dashboard/src/hooks/useProjectStories.ts

export function useProjectStories(projectId: string) {
  return useQuery({
    queryKey: ['project-stories', projectId],
    queryFn: () => getProjectStories(projectId),
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    enabled: !!projectId,
  });
}

export function useUpdateStoryStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ storyId, status }: { storyId: string; status: string }) =>
      updateStoryStatus(projectId, storyId, status),
    onSuccess: () => {
      // Invalidate project stories query to refetch
      queryClient.invalidateQueries(['project-stories', projectId]);
    },
  });
}
```

### WebSocket Integration

```typescript
// dashboard/src/hooks/useStoryWebSocket.ts

export function useStoryWebSocket(projectId: string) {
  const queryClient = useQueryClient();
  const { events } = useWebSocket(
    `${import.meta.env.VITE_WS_URL}/ws/status-updates`
  );

  useEffect(() => {
    events.forEach((event) => {
      if (event.eventType === 'story.status.changed' && event.projectId === projectId) {
        // Invalidate project stories query to refetch and show updated status
        queryClient.invalidateQueries(['project-stories', projectId]);
      }
    });
  }, [events, projectId, queryClient]);

  return { events };
}
```

### Drag-and-Drop Implementation (Optional Manual Mode)

```typescript
// dashboard/src/components/kanban/KanbanBoard.tsx

import { DndContext, DragEndEvent } from '@dnd-kit/core';

function KanbanBoard({ projectId }: { projectId: string }) {
  const { data: stories } = useProjectStories(projectId);
  const updateStatus = useUpdateStoryStatus(projectId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const storyId = active.id as string;
    const newStatus = over.id as string; // Column ID = status

    updateStatus.mutate({ storyId, status: newStatus });
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-4 gap-4">
        <KanbanColumn status="ready" stories={getStoriesForStatus('ready')} />
        <KanbanColumn status="in-progress" stories={getStoriesForStatus('in-progress')} />
        <KanbanColumn status="review" stories={getStoriesForStatus('review')} />
        <KanbanColumn status="merged" stories={getStoriesForStatus('merged')} />
      </div>
    </DndContext>
  );
}
```

### Testing Strategy

- **Framework:** Vitest + React Testing Library
- **Coverage Target:** >70%
- **Test Types:**
  - Unit tests for components (StoryCard, KanbanColumn, StoryFilters)
  - Integration tests for KanbanBoard
  - Hook tests (useProjectStories, useStoryWebSocket)
- **Test Scenarios:**
  - Kanban board renders with stories in correct columns
  - Filter by epic updates displayed stories
  - Search by title filters stories
  - Click story card opens detail modal
  - Drag-and-drop updates story status (manual mode)
  - WebSocket events trigger query refetch and UI update
  - Story cards show epic color-coding
  - Story dependencies displayed visually

## Tasks / Subtasks

### Task 1: Story Data Types and API Integration (AC 1, 3)
- [ ] 1.1: Define TypeScript types in `src/types/story.ts`
  - Story interface with all required fields
  - Epic interface for nested epic data
- [ ] 1.2: Create API methods in `src/api/stories.ts`
  - getProjectStories(), updateStoryStatus()
- [ ] 1.3: Create TanStack Query hooks in `src/hooks/useProjectStories.ts`
  - useProjectStories, useUpdateStoryStatus
- [ ] 1.4: Write unit tests for API methods and hooks

### Task 2: Kanban Board Layout (AC 1, 2)
- [ ] 2.1: Create KanbanBoardPage component
  - Route configuration at `/projects/:id/stories`
  - Page header with title and filters
  - Grid layout for 4 columns
- [ ] 2.2: Create KanbanColumn component
  - Column header with status name and story count
  - Droppable area for drag-and-drop
  - Vertical scrolling for overflow stories
- [ ] 2.3: Add Kanban board link to ProjectDetailPage
  - Add "Stories" tab or button in project detail view
  - Navigate to `/projects/:id/stories` on click
- [ ] 2.4: Write component tests for KanbanBoardPage

### Task 3: Story Cards (AC 3, 7, 9)
- [ ] 3.1: Create StoryCard component
  - Display story ID, title, epic badge, status badge
  - Show PR link icon if PR exists (AC 3)
  - Show dependency indicator if story has dependencies (AC 7)
  - Color-code by epic using epic color (AC 9)
  - Click handler to open detail modal
- [ ] 3.2: Implement epic color-coding system
  - Assign colors to epics (Epic 1: Blue, Epic 2: Green, etc.)
  - Apply color to card border or badge
- [ ] 3.3: Add dependency visualization
  - Show icon/badge if story has dependencies
  - Tooltip or indicator showing dependency count
- [ ] 3.4: Write component tests for StoryCard

### Task 4: Drag-and-Drop Functionality (AC 4)
- [ ] 4.1: Install @dnd-kit packages
  - `npm install @dnd-kit/core @dnd-kit/sortable`
- [ ] 4.2: Implement DndContext in KanbanBoard
  - Wrap board columns in DndContext
  - Handle drag events to detect column changes
- [ ] 4.3: Make StoryCard draggable
  - Use `useDraggable` hook from @dnd-kit
  - Provide drag handle or make entire card draggable
- [ ] 4.4: Make KanbanColumn droppable
  - Use `useDroppable` hook from @dnd-kit
  - Accept story cards as droppable items
- [ ] 4.5: Integrate mutation on drop
  - Call useUpdateStoryStatus mutation on successful drop
  - Optimistic update for immediate UI feedback
  - Show error toast if status update fails
- [ ] 4.6: Test drag-and-drop functionality
  - Mock drag events in tests
  - Verify mutation called with correct parameters

### Task 5: Filters and Search (AC 5)
- [ ] 5.1: Create StoryFilters component
  - Epic dropdown filter (All Epics, Epic 1, Epic 2, etc.)
  - Search input for story title
  - Clear filters button
- [ ] 5.2: Implement filter logic
  - Filter stories by selected epic
  - Filter stories by search term (case-insensitive)
  - Combine epic filter and search (AND logic)
- [ ] 5.3: Persist filter state in URL query params (optional)
  - Update URL when filters change
  - Load filters from URL on page load
- [ ] 5.4: Write component tests for StoryFilters

### Task 6: Story Detail Modal (AC 6)
- [ ] 6.1: Create StoryDetailModal component
  - Dialog layout with story information
  - Sections: User story, acceptance criteria, tasks, dependencies
  - Link to story file (if available)
  - Link to PR (if exists)
  - Status history (optional)
- [ ] 6.2: Integrate modal with StoryCard click
  - Pass story data to modal
  - Open modal on card click
  - Close modal on backdrop click or close button
- [ ] 6.3: Write component tests for StoryDetailModal

### Task 7: Real-Time WebSocket Updates (AC 8)
- [ ] 7.1: Create useStoryWebSocket hook
  - Subscribe to WebSocket events (story.status.changed)
  - Filter events by project ID
  - Invalidate TanStack Query cache on events
- [ ] 7.2: Integrate WebSocket into KanbanBoardPage
  - Use useStoryWebSocket hook with current project ID
  - Board updates automatically when stories change status
- [ ] 7.3: Test real-time updates
  - Mock WebSocket events
  - Verify query cache invalidation
  - Verify UI updates when story status changes

### Task 8: UI Polish and Testing
- [ ] 8.1: Add loading skeletons
  - Skeleton cards while stories load
  - Skeleton columns during initial fetch
- [ ] 8.2: Add error boundaries
  - Handle story not found
  - Handle API errors (error message with retry)
- [ ] 8.3: Add accessibility improvements
  - ARIA labels for columns, cards, filters
  - Keyboard navigation (Tab, Enter)
  - Screen reader text for status badges and dependencies
- [ ] 8.4: Responsive design
  - Mobile: Stack columns vertically or horizontal scroll
  - Tablet: 2 columns per row
  - Desktop: 4 columns side-by-side
- [ ] 8.5: Write integration tests for complete flow
  - View board → filter by epic → click card → view details
- [ ] 8.6: Run all tests and verify >70% coverage

## Dev Notes

### Learnings from Previous Story

**From Story 6-6-escalation-response-interface (Status: done)**

- **React Foundation Available:**
  - React 18.3.1 + TypeScript 5.5.4 with Vite 5.4.3 ✅
  - TanStack Query 5.56.2 configured with retry logic ✅
  - Zustand 4.5.5 for client state ✅
  - Tailwind CSS 3.4.10 with dark mode ✅
  - shadcn/ui component library (11+ components installed) ✅

- **API Client Layer Available:**
  - BaseAPI class at `dashboard/src/api/client.ts` ✅
  - Automatic JWT token injection ✅
  - Error handling with APIError class ✅
  - TypeScript types at `dashboard/src/api/types.ts` ✅

- **WebSocket Integration Available:**
  - useWebSocket hook at `dashboard/src/hooks/useWebSocket.ts` ✅
  - Exponential backoff reconnection ✅
  - Event subscription system ✅
  - Connection status tracking ✅

- **Layout Components Available:**
  - MainLayout with Header and Sidebar ✅
  - Project detail view at ProjectDetailPage (add Kanban tab here) ✅

- **shadcn/ui Components Available:**
  - button, card, dialog, badge, input, select, tabs ✅
  - All required components already installed ✅

- **Testing Infrastructure:**
  - Vitest 1.6.1 + React Testing Library configured ✅
  - Test utilities available at `dashboard/src/test-utils/` ✅
  - 120 tests passing in Story 6-6 (excellent quality) ✅

- **Files to Reuse:**
  - `dashboard/src/api/client.ts` - BaseAPI class ✅
  - `dashboard/src/hooks/useWebSocket.ts` - WebSocket hook ✅
  - `dashboard/src/components/layout/MainLayout.tsx` - Layout wrapper ✅
  - `dashboard/src/components/ui/*` - All shadcn/ui components ✅
  - `dashboard/src/lib/utils.ts` - Utility functions (cn, formatDate) ✅

- **New Files to Create:**
  - `dashboard/src/pages/KanbanBoardPage.tsx` - NEW
  - `dashboard/src/components/kanban/KanbanBoard.tsx` - NEW
  - `dashboard/src/components/kanban/KanbanColumn.tsx` - NEW
  - `dashboard/src/components/kanban/StoryCard.tsx` - NEW
  - `dashboard/src/components/kanban/StoryDetailModal.tsx` - NEW
  - `dashboard/src/components/kanban/StoryFilters.tsx` - NEW
  - `dashboard/src/hooks/useProjectStories.ts` - NEW
  - `dashboard/src/hooks/useStoryWebSocket.ts` - NEW
  - `dashboard/src/api/stories.ts` - NEW
  - `dashboard/src/types/story.ts` - NEW

- **Design Patterns Established:**
  - Container/Presenter Pattern (pages fetch data, components display)
  - TanStack Query cache invalidation on WebSocket events
  - Optimistic updates for better UX
  - Skeleton loading states (not spinners)
  - Error boundaries with retry functionality
  - Responsive design (mobile-first Tailwind classes)

- **Code Quality Practices:**
  - TypeScript strict mode enabled
  - Comprehensive test coverage (>70% target)
  - Co-located test files (*.test.tsx)
  - Clear component naming conventions
  - Proper error handling throughout

[Source: docs/stories/6-6-escalation-response-interface.md]

### Architecture Patterns and Constraints

**From Epic 6 - Remote Access & Monitoring:**
- REST API + WebSocket architecture for real-time updates ✅
- JWT-based authentication (token in localStorage) ✅
- TypeScript with strict type checking ✅
- React 18 + Vite build system ✅
- Tailwind CSS for styling ✅
- shadcn/ui for component library ✅
- TanStack Query for server state, Zustand for client state ✅

**Kanban Board Design:**
- Visual representation of story lifecycle stages
- Real-time updates via WebSocket ensure users see latest status
- Drag-and-drop provides intuitive status updates (optional manual mode)
- Epic color-coding helps organize and identify related stories
- Dependency visualization shows story relationships and blockers

**Real-Time Update Strategy:**
- WebSocket events trigger TanStack Query cache invalidation
- Query refetches automatically when invalidated (background refetch)
- UI updates reactively when query data changes
- Optimistic updates on drag-and-drop for immediate feedback

### Project Structure Notes

**Alignment with unified project structure:**
- Dashboard: `dashboard/` directory ✅
- Pages: `dashboard/src/pages/` ✅
- Components: `dashboard/src/components/` (organized by feature: kanban/, ui/) ✅
- API layer: `dashboard/src/api/` ✅
- Hooks: `dashboard/src/hooks/` ✅
- Tests: Co-located with source files (`*.test.tsx`) ✅

**New Directories:**
- `dashboard/src/components/kanban/` - Kanban board components

### Testing Standards

- **Framework:** Vitest + React Testing Library (already configured) ✅
- **Coverage:** Minimum 70% coverage per component ✅
- **Test Organization:** Co-locate tests with source files (*.test.tsx) ✅
- **Mocking:** Mock fetch API, WebSocket API, React Router ✅
- **Test Patterns:** Render component, assert content, test interactions ✅
- **Drag-and-Drop Testing:** Mock @dnd-kit events for drag-and-drop tests

### Performance Considerations

- **Query Caching**: TanStack Query caches stories (1min stale time, 30s refetch)
- **WebSocket Efficiency**: Single WebSocket connection shared across components
- **Optimistic Updates**: Immediate UI feedback on drag-and-drop before server confirmation
- **Lazy Loading**: Story detail modal only loads when opened
- **Filter Performance**: Client-side filtering for instant results (small dataset)

### Security Considerations

- **Authentication**: All API calls include JWT token (handled by BaseAPI) ✅
- **Authorization**: Backend validates token and user permissions ✅
- **Input Sanitization**: Filter inputs sanitized before API calls ✅
- **XSS Protection**: React automatically escapes rendered content ✅

### References

- [Source: docs/epics.md#Epic-6-Story-6.7-Story-Tracking-Kanban-Board]
- [Source: docs/stories/6-6-escalation-response-interface.md]
- [Source: docs/architecture.md#Remote-Access-Monitoring]
- [Prerequisites: Stories 6.1, 6.2, 6.3, 6.4, 6.5 complete]

## Dependencies

- **Requires:**
  - Story 6.1 (API Infrastructure & Type System) - ✅ Complete
  - Story 6.2 (Core API Endpoints & WebSocket) - ✅ Complete
  - Story 6.3 (Extended API Endpoints) - ✅ Complete
  - Story 6.4 (React Dashboard Foundation & API Integration) - ✅ Complete
  - Story 6.5 (Project Management Views) - ✅ Complete

- **Blocks:**
  - Story 6.8 (Dependency Graph Visualization) - uses same story data

## Estimated Time

- **Estimated:** 3-4 hours
- **Actual:** TBD

## Notes

- Focus on clear visual hierarchy for Kanban columns and cards
- Epic color-coding should be consistent across the dashboard
- Drag-and-drop is optional (manual mode) - can be skipped if time-constrained
- Consider keyboard shortcuts (Arrow keys to navigate cards)
- Real-time updates are critical for accurate status visualization
- Story dependencies should be clearly indicated (icon/badge)
- Test with various numbers of stories (empty columns, overflow)
- Ensure responsive design works on mobile (vertical stacking or horizontal scroll)

## Change Log

- **2025-11-14:** Story drafted by create-story workflow

## Dev Agent Record

### Context Reference

- [Story Context XML](6-7-story-tracking-kanban-board.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
