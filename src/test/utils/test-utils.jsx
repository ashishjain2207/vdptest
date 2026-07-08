import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from '@/store/store';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthRouterBridge } from '@/contexts/AuthRouterBridge';
import { LoadingProvider } from '@/contexts/LoadingContext';

// Create a test query client
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// Custom render function that includes all providers
export function renderWithProviders(
  ui,
  {
    route = '/',
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {},
) {
  // Set up router
  window.history.pushState({}, 'Test page', route);

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <LanguageProvider>
              <LoadingProvider>
                <AuthProvider>
                  <BrowserRouter
                    future={{
                      v7_startTransition: true,
                      v7_relativeSplatPath: true,
                    }}
                  >
                    <AuthRouterBridge />
                    {children}
                  </BrowserRouter>
                </AuthProvider>
              </LoadingProvider>
            </LanguageProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </Provider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
