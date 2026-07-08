import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const Toaster = ({ ...props }) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:hover:bg-primary/90',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:hover:bg-muted/80',
          success: 'group-[.toaster]:bg-success/10 group-[.toaster]:text-success group-[.toaster]:border-success/20',
          error: 'group-[.toaster]:bg-destructive/10 group-[.toaster]:text-destructive group-[.toaster]:border-destructive/20',
          warning: 'group-[.toaster]:bg-warning/10 group-[.toaster]:text-warning group-[.toaster]:border-warning/20',
          info: 'group-[.toaster]:bg-primary/10 group-[.toaster]:text-primary group-[.toaster]:border-primary/20',
        },
        style: {
          background: 'hsl(var(--background))',
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
