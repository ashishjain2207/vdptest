import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ContentReportsFeatureRoute } from '@/components/support/ContentReportsFeatureRoute';

vi.mock('@/contexts/FeatureFlagsContext', () => ({
  useFeatureFlags: vi.fn(),
}));

import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';

describe('ContentReportsFeatureRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when content reports are enabled', () => {
    vi.mocked(useFeatureFlags).mockReturnValue({
      contentReportsEnabled: true,
      loading: false,
    });

    render(
      <MemoryRouter>
        <ContentReportsFeatureRoute>
          <div>Moderation Page</div>
        </ContentReportsFeatureRoute>
      </MemoryRouter>,
    );

    expect(screen.getByText('Moderation Page')).toBeInTheDocument();
  });

  it('redirects to support inbox when content reports are disabled', () => {
    vi.mocked(useFeatureFlags).mockReturnValue({
      contentReportsEnabled: false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/support/content-moderation']}>
        <ContentReportsFeatureRoute>
          <div>Moderation Page</div>
        </ContentReportsFeatureRoute>
      </MemoryRouter>,
    );

    expect(screen.queryByText('Moderation Page')).not.toBeInTheDocument();
  });
});
