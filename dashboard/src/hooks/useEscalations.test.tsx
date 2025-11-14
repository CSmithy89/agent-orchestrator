import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEscalations, useEscalation, useSubmitEscalationResponse } from './useEscalations';
import { escalationsApi } from '../api/escalations';
import type { EscalationStatus, EscalationDetail } from '../api/types';

// Mock the API
vi.mock('../api/escalations', () => ({
  escalationsApi: {
    getEscalations: vi.fn(),
    getProjectEscalations: vi.fn(),
    getEscalation: vi.fn(),
    respondToEscalation: vi.fn(),
  },
}));

const mockEscalations: EscalationStatus[] = [
  {
    id: '1',
    projectId: 'proj-1',
    type: 'decision',
    severity: 'high',
    title: 'Test Escalation 1',
    description: 'Test description',
    question: 'Test question?',
    aiReasoning: 'Test reasoning',
    confidenceScore: 0.65,
    status: 'pending',
    createdAt: '2025-11-14T10:00:00Z',
  },
  {
    id: '2',
    projectId: 'proj-1',
    type: 'clarification',
    severity: 'medium',
    title: 'Test Escalation 2',
    description: 'Test description 2',
    question: 'Test question 2?',
    confidenceScore: 0.45,
    status: 'resolved',
    createdAt: '2025-11-14T09:00:00Z',
    respondedAt: '2025-11-14T09:30:00Z',
  },
];

const mockEscalationDetail: EscalationDetail = {
  ...mockEscalations[0],
  agentId: 'agent-1',
  workflowStep: 'step-1',
  attemptedDecision: 'Test decision',
};

describe('useEscalations', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch all escalations', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockEscalations,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useEscalations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockEscalations);
    expect(escalationsApi.getEscalations).toHaveBeenCalledOnce();
  });

  it('should filter escalations by status', async () => {
    vi.mocked(escalationsApi.getEscalations).mockResolvedValue({
      success: true,
      data: mockEscalations,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useEscalations('pending'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].status).toBe('pending');
  });

  it('should handle errors', async () => {
    vi.mocked(escalationsApi.getEscalations).mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useEscalations(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useEscalation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should fetch escalation by id', async () => {
    vi.mocked(escalationsApi.getEscalation).mockResolvedValue({
      success: true,
      data: mockEscalationDetail,
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useEscalation('1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockEscalationDetail);
    expect(escalationsApi.getEscalation).toHaveBeenCalledWith('1');
  });

  it('should not fetch when id is empty', () => {
    const { result } = renderHook(() => useEscalation(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(escalationsApi.getEscalation).not.toHaveBeenCalled();
  });
});

describe('useSubmitEscalationResponse', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('should submit escalation response', async () => {
    vi.mocked(escalationsApi.respondToEscalation).mockResolvedValue({
      success: true,
      data: { ...mockEscalationDetail, status: 'responded' },
      timestamp: new Date().toISOString(),
    });

    const { result } = renderHook(() => useSubmitEscalationResponse(), { wrapper });

    result.current.mutate({
      id: '1',
      response: 'Test response',
      decision: 'approve',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(escalationsApi.respondToEscalation).toHaveBeenCalledWith('1', {
      response: 'Test response',
      decision: 'approve',
    });
  });

  it('should invalidate queries on success', async () => {
    vi.mocked(escalationsApi.respondToEscalation).mockResolvedValue({
      success: true,
      data: { ...mockEscalationDetail, status: 'responded' },
      timestamp: new Date().toISOString(),
    });

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSubmitEscalationResponse(), { wrapper });

    result.current.mutate({
      id: '1',
      response: 'Test response',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['escalations'] });
  });
});
