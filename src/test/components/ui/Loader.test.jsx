import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader, PageLoader, Spinner, ButtonLoader } from '@/components/ui/loader';

describe('Loader Components', () => {
  describe('Loader', () => {
    it('renders loader with default size', () => {
      const { container } = render(<Loader />);
      const loader = container.querySelector('svg');
      expect(loader).toBeInTheDocument();
    });

    it('renders with different sizes', () => {
      const { container: containerSm } = render(<Loader size="sm" />);
      const { container: containerLg } = render(<Loader size="lg" />);
      
      expect(containerSm.querySelector('svg')).toHaveClass('w-4', 'h-4');
      expect(containerLg.querySelector('svg')).toHaveClass('w-8', 'h-8');
    });

    it('renders with text when provided', () => {
      render(<Loader text="Loading..." />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('renders full screen when fullScreen is true', () => {
      const { container } = render(<Loader fullScreen text="Loading..." />);
      const fullScreenDiv = container.querySelector('.fixed.inset-0');
      expect(fullScreenDiv).toBeInTheDocument();
    });
  });

  describe('PageLoader', () => {
    it('renders page loader with backdrop', () => {
      const { container } = render(<PageLoader text="Loading..." />);
      const loader = container.querySelector('.fixed.inset-0');
      expect(loader).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('does not render when showBackdrop is false', () => {
      const { container } = render(<PageLoader showBackdrop={false} />);
      const loader = container.querySelector('.fixed.inset-0');
      expect(loader).not.toHaveClass('backdrop-blur-sm');
    });
  });

  describe('Spinner', () => {
    it('renders spinner component', () => {
      const { container } = render(<Spinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('ButtonLoader', () => {
    it('renders button loader', () => {
      const { container } = render(<ButtonLoader />);
      const loader = container.querySelector('svg');
      expect(loader).toBeInTheDocument();
    });
  });
});
