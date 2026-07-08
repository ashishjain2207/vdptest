import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Loader component with theme-aware styling
 * @param {Object} props
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.variant - Color variant: 'primary' | 'secondary' | 'muted' | 'white'
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.text - Optional text to display below loader
 * @param {boolean} props.fullScreen - If true, renders as full-screen overlay
 */
export function Loader({
  size = 'md',
  variant = 'primary',
  className,
  text,
  fullScreen = false,
  ...props
}) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const variantClasses = {
    primary: 'text-primary dark:text-primary',
    secondary: 'text-secondary dark:text-secondary',
    muted: 'text-muted-foreground dark:text-muted-foreground',
    white: 'text-white',
  };

  const spinner = (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          {spinner}
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
          )}
        </div>
      </div>
    );
  }

  if (text) {
    return (
      <div className="flex flex-col items-center gap-2">
        {spinner}
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    );
  }

  return spinner;
}

/**
 * Spinner component using CSS border animation (lighter weight)
 * @param {Object} props
 * @param {string} props.size - Size variant: 'sm' | 'md' | 'lg' | 'xl'
 * @param {string} props.variant - Color variant: 'primary' | 'secondary' | 'muted'
 * @param {string} props.className - Additional CSS classes
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-12 h-12 border-[3px]',
  };

  const variantClasses = {
    primary: 'border-primary dark:border-primary border-t-transparent',
    secondary: 'border-secondary dark:border-secondary border-t-transparent',
    muted: 'border-muted-foreground dark:border-muted-foreground border-t-transparent',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}

/**
 * PageLoader - Full page loading overlay with theme-aware styling
 * @param {Object} props
 * @param {string|ReactNode} props.text - Loading text to display
 * @param {boolean} props.showBackdrop - Show backdrop blur
 */
export function PageLoader({ text, showBackdrop = true, ...props }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center',
        showBackdrop 
          ? 'bg-background/95 dark:bg-background/98 backdrop-blur-sm' 
          : 'bg-background',
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Clean circular spinner */}
        <div className="relative">
          <div 
            className="w-16 h-16 rounded-full border-4 border-primary/20 dark:border-primary/25 border-t-primary dark:border-t-primary animate-spin"
            style={{ 
              animationDuration: '0.8s',
              animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        {text && (
          <p className="text-sm font-medium text-foreground tracking-wide">
            {text}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * ButtonLoader - Inline loader for buttons
 * @param {Object} props
 * @param {string} props.size - Size: 'sm' | 'md'
 * @param {string} props.className - Additional classes
 */
export function ButtonLoader({ size = 'sm', className, ...props }) {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
        className,
      )}
      {...props}
    />
  );
}
