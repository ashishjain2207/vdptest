import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LangText } from '@/components/ui/LangText';
import { HomeCountryOnboardingForm } from '@/components/profile/HomeCountryOnboardingForm';

/**
 * Mandatory home-country selection; cannot be dismissed until a valid market is saved.
 *
 * @param {{ open: boolean, onCompleted: () => void }} props
 */
export function HomeCountryRequiredDialog({ open, onCompleted }) {
  return (
    <Dialog open={open} onOpenChange={() => { /* mandatory — no dismiss */ }}>
      <DialogContent
        className="max-w-md [&>button.absolute]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            <LangText path="profile.complete_your_profile" />
          </DialogTitle>
          <DialogDescription>
            <LangText path="profile.select_your_home_country_to_access_your_feed_and_market_scop" />
          </DialogDescription>
        </DialogHeader>

        <HomeCountryOnboardingForm onCompleted={onCompleted} idPrefix="home-country-dialog" />
      </DialogContent>
    </Dialog>
  );
}
