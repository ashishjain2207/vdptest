import { Toaster, SonnerToaster, TooltipProvider } from '@imriva/framework';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MaintenanceApiBlockedError } from '@/services/api/client';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { store } from '@/store/store';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AuthRouterBridge } from '@/contexts/AuthRouterBridge';
import { AppInsightsRouteTracker } from '@/components/telemetry/AppInsightsRouteTracker';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import { MessagesHubProvider } from '@/contexts/MessagesHubProvider';
import { NotificationsHubProvider } from '@/contexts/NotificationsHubProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { MaintenanceModeProvider } from '@/contexts/MaintenanceModeContext';
import { MaintenanceRouteGuard } from '@/components/MaintenanceRouteGuard';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AdminRoute } from '@/components/AdminRoute';
import { AdminOnlyRoute } from '@/components/AdminOnlyRoute';
import { SupportOrAdminRoute } from '@/components/SupportOrAdminRoute';
import { ContentReportsFeatureRoute } from '@/components/support/ContentReportsFeatureRoute';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Explore from './pages/Explore';
import People from './pages/People';
import Profile from './pages/Profile';
import Organizations from './pages/Organizations';
import Partners from './pages/Partners';
import OrgDetail from './pages/OrgDetail';
import AdminPartners from './pages/AdminPartners';
import AdminPartnerCreate from './pages/AdminPartnerCreate';
import AdminPartnerDetail from './pages/AdminPartnerDetail';
import { AdminStaffHomeRedirect } from '@/components/admin/AdminStaffHomeRedirect';
import AdminEvents from './pages/AdminEvents';
import AdminEventEditor from './pages/AdminEventEditor';
import AdminAdvertisements from './pages/AdminAdvertisements';
import AdminAdvertisementEditor from './pages/AdminAdvertisementEditor';
import AdminUsers from './pages/AdminUsers';
import AdminSettings from './pages/AdminSettings';
import AdminFeedbackSupport from './pages/AdminFeedbackSupport';
import AdminContentModeration from './pages/AdminContentModeration';
import AdminAuditLogs from './pages/AdminAuditLogs';
import { AdminLayout } from '@/components/admin/AdminLayout';
import PartnerManageMembers from './pages/PartnerManageMembers';
import PartnerInvitePage from './pages/PartnerInvitePage';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Bookmarks from './pages/Bookmarks';
import Settings from './pages/Settings';
import ProfileSettings from './pages/settings/ProfileSettings';
import AccountSettings from './pages/settings/AccountSettings';
import PostDetail from './pages/PostDetail';
import MediaViewer from './pages/MediaViewer';
import UserMediaViewer from './pages/UserMediaViewer';
import Studio from './pages/Studio';
import NotFound from './pages/NotFound';
import AccessDenied from './pages/AccessDenied';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookiePolicy from './pages/CookiePolicy';
import Accessibility from './pages/Accessibility';
import Support from './pages/Support';
import SupportInbox from './pages/SupportInbox';
import SupportContentModeration from './pages/SupportContentModeration';
import Callback from './pages/Callback';
import Onboarding from './pages/Onboarding';
import { VerifyEmail } from './pages/VerifyEmail';
import {
  RedirectOrgToPartner,
  RedirectUserHandleToProfile,
  RedirectLegacyPostMedia,
} from './components/routing/LegacyRedirects';
import MaintenancePage from './pages/MaintenancePage';
import { HomeCountryRequiredGate } from '@/components/profile/HomeCountryRequiredGate';
import { AdminScopeCountryProvider } from '@/contexts/AdminScopeCountryContext.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof MaintenanceApiBlockedError) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <LoadingProvider>
            <AuthProvider>
              <TooltipProvider>
                <Toaster />
                <SonnerToaster />
                <GlobalLoader />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AppInsightsRouteTracker />
                  <AuthRouterBridge />
                  <AdminScopeCountryProvider>
                    <FeatureFlagsProvider>
                      <MaintenanceModeProvider>
                        <MessagesHubProvider>
                          <NotificationsHubProvider>
                            <HomeCountryRequiredGate>
                              <Routes>
                                <Route path="/maintenance" element={<MaintenancePage />} />
                                <Route element={<MaintenanceRouteGuard />}>
                                  <Route path="/login" element={<Login />} />
                                  <Route path="/signup" element={<Signup />} />
                                  <Route path="/forgot-password" element={<ForgotPassword />} />
                                  <Route path="/reset-password" element={<ResetPassword />} />
                                  <Route path="/callback" element={<Callback />} />
                                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                                  <Route path="/verify-email" element={<VerifyEmail />} />
                                  <Route path="/terms" element={<TermsOfService />} />
                                  <Route path="/privacy" element={<PrivacyPolicy />} />
                                  <Route path="/cookie" element={<CookiePolicy />} />
                                  <Route path="/accessibility" element={<Accessibility />} />
                                  <Route path="/support" element={<Support />} />
                                  <Route
                                    path="/support/inbox"
                                    element={
                                      <ProtectedRoute>
                                        <SupportOrAdminRoute>
                                          <SupportInbox />
                                        </SupportOrAdminRoute>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route
                                    path="/support/content-moderation"
                                    element={
                                      <ProtectedRoute>
                                        <SupportOrAdminRoute>
                                          <ContentReportsFeatureRoute>
                                            <SupportContentModeration />
                                          </ContentReportsFeatureRoute>
                                        </SupportOrAdminRoute>
                                      </ProtectedRoute>
                                    }
                                  />
                                  <Route path="/" element={<ProtectedRoute><Navigate to="/posts" replace /></ProtectedRoute>} />
                                  <Route path="/posts/:postId/media/:mediaIndex" element={<ProtectedRoute><MediaViewer /></ProtectedRoute>} />
                                  <Route path="/posts/:postId/media" element={<ProtectedRoute><MediaViewer /></ProtectedRoute>} />
                                  <Route path="/posts/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
                                  <Route path="/posts" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                                  <Route path="/explore/tag/:tagName" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                                  <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
                                  <Route path="/people/search/:query" element={<ProtectedRoute><People /></ProtectedRoute>} />
                                  <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
                                  <Route path="/profile/:userId" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                                  <Route path="/organizations" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
                                  <Route path="/partners/:partnerId/subnetworks/:subId" element={<ProtectedRoute><OrgDetail /></ProtectedRoute>} />
                                  <Route path="/partners/:partnerId/manage" element={<ProtectedRoute><PartnerManageMembers /></ProtectedRoute>} />
                                  <Route path="/partners/:partnerId/invite" element={<ProtectedRoute><PartnerInvitePage /></ProtectedRoute>} />
                                  <Route path="/partners/:partnerId" element={<ProtectedRoute><OrgDetail /></ProtectedRoute>} />
                                  <Route path="/partners" element={<ProtectedRoute><Partners /></ProtectedRoute>} />
                                  <Route path="/access-denied" element={<ProtectedRoute><AccessDenied /></ProtectedRoute>} />
                                  <Route
                                    path="/admin"
                                    element={
                                      <ProtectedRoute>
                                        <AdminRoute>
                                          <AdminLayout />
                                        </AdminRoute>
                                      </ProtectedRoute>
                                    }
                                  >
                                    <Route index element={<AdminStaffHomeRedirect />} />
                                    <Route
                                      path="partners/create"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminPartnerCreate />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="partners/:partnerId"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminPartnerDetail />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="partners"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminPartners />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="events/create"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminEventEditor />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="events/:eventId"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminEventEditor />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="events"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminEvents />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="ads/create"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminAdvertisementEditor />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="ads/:adId"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminAdvertisementEditor />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="ads"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminAdvertisements />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="users"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminUsers />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route path="feedback" element={<AdminFeedbackSupport />} />
                                    <Route
                                      path="content-moderation"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminContentModeration />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="settings"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminSettings />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                    <Route
                                      path="audit-logs"
                                      element={
                                        <AdminOnlyRoute>
                                          <AdminAuditLogs />
                                        </AdminOnlyRoute>
                                      }
                                    />
                                  </Route>
                                  <Route path="/events" element={<ProtectedRoute><Events /></ProtectedRoute>} />
                                  <Route path="/event/:id" element={<ProtectedRoute><EventDetail /></ProtectedRoute>} />
                                  <Route path="/messages/:conversationId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                                  <Route path="/notification" element={<Navigate to="/notifications" replace />} />
                                  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                                  <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
                                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                                  <Route path="/settings/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                                  <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
                                  <Route path="/org/:id" element={<ProtectedRoute><RedirectOrgToPartner /></ProtectedRoute>} />
                                  <Route path="/user/:handle" element={<ProtectedRoute><RedirectUserHandleToProfile /></ProtectedRoute>} />
                                  <Route path="/media/post/:postId/:mediaIndex" element={<ProtectedRoute><RedirectLegacyPostMedia /></ProtectedRoute>} />
                                  <Route path="/media/post/:postId" element={<ProtectedRoute><RedirectLegacyPostMedia /></ProtectedRoute>} />
                                  <Route path="/user/:userId/media/:mediaIndex" element={<ProtectedRoute><UserMediaViewer /></ProtectedRoute>} />
                                  <Route path="/user/:userId/media" element={<ProtectedRoute><UserMediaViewer /></ProtectedRoute>} />
                                  <Route path="/studio" element={<ProtectedRoute><Studio /></ProtectedRoute>} />
                                  <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                                </Route>
                              </Routes>
                            </HomeCountryRequiredGate>
                          </NotificationsHubProvider>
                        </MessagesHubProvider>
                      </MaintenanceModeProvider>
                    </FeatureFlagsProvider>
                  </AdminScopeCountryProvider>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </LoadingProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
