import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LangText } from '@/components/ui/LangText';
import { LanguageSelector } from '@/components/layout/LanguageSelector';
import { HomeCountryOnboardingForm } from '@/components/profile/HomeCountryOnboardingForm';
import { useAppSelector } from '@/store/hooks';
import { getAccessToken, getPlatformAuthFromToken } from '@/services';
import { profileHasHomeCountry, resolveOnboardingReturnPath } from '@/lib/homeCountryOnboarding';

export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAppSelector((s) => s.user.user);
  const loading = useAppSelector((s) => s.user.loading);
  const returnPath = resolveOnboardingReturnPath(searchParams.get('returnUrl'));

  const token = typeof window !== 'undefined' ? getAccessToken() : null;
  const isPlatformStaff = Boolean(token && getPlatformAuthFromToken(token)?.isPlatformStaff);
  const hasHomeCountry = profileHasHomeCountry(user);

  useEffect(() => {
    if (loading) {
      return;
    }
    if (isPlatformStaff || hasHomeCountry) {
      navigate(returnPath, { replace: true });
    }
  }, [loading, isPlatformStaff, hasHomeCountry, navigate, returnPath]);

  const handleCompleted = () => {
    navigate(returnPath, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative">
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      <div className="w-full max-w-md space-y-6 rounded-lg border border-border bg-card p-8 shadow-sm" data-testid="onboarding-page">
        <div className="space-y-2 text-center">
          <img src="/vdpConnect.png" alt="vdpConnect logo" className="h-10 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground">
            <LangText path="profile.complete_your_profile" />
          </h1>
          <p className="text-sm text-muted-foreground">
            <LangText path="profile.select_your_home_country_to_access_your_feed_and_market_scop" />
          </p>
        </div>
        <HomeCountryOnboardingForm onCompleted={handleCompleted} idPrefix="onboarding-home-country" />
      </div>
    </div>
  );
}
