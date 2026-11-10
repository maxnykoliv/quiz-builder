import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsync } from '@/hooks/useAsync';

describe('useAsync', () => {
  it('starts loading and then exposes the loaded data', async () => {
    const loader = vi.fn().mockResolvedValue('data');
    const { result } = renderHook(() => useAsync(loader, []));

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.data).toBe('data'));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('exposes errors', async () => {
    const error = new Error('Boom');
    const { result } = renderHook(() => useAsync(() => Promise.reject(error), []));

    await waitFor(() => expect(result.current.error).toBe(error));
    expect(result.current.isLoading).toBe(false);
  });

  it('does not run while disabled', () => {
    const loader = vi.fn().mockResolvedValue('data');
    renderHook(() => useAsync(loader, [], false));
    expect(loader).not.toHaveBeenCalled();
  });

  it('reloads on demand and refetches when deps change', async () => {
    const loader = vi.fn().mockResolvedValue('data');
    const { result, rerender } = renderHook(({ id }) => useAsync(loader, [id]), {
      initialProps: { id: 1 },
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.reload());
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));

    rerender({ id: 2 });
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(3));
  });

  it('aborts the previous request when deps change', async () => {
    const signals: AbortSignal[] = [];
    const loader = vi.fn((signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<string>(() => {});
    });
    const { rerender } = renderHook(({ id }) => useAsync(loader, [id]), {
      initialProps: { id: 1 },
    });

    rerender({ id: 2 });

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('allows updating data locally', async () => {
    const { result } = renderHook(() => useAsync(() => Promise.resolve([1, 2, 3]), []));
    await waitFor(() => expect(result.current.data).toEqual([1, 2, 3]));

    act(() => result.current.setData((items) => items?.filter((item) => item !== 2)));

    expect(result.current.data).toEqual([1, 3]);
  });
});
