import { LegalDocumentLayout } from '@/components/layout/LegalDocumentLayout';
import { LangText } from '@/components/ui/LangText';

const CookiePolicy = () => (
  <LegalDocumentLayout>
    <h1 className="text-2xl font-bold text-foreground mb-4">
      <LangText path="layout.cookie_policy"  />
    </h1>
    <p className="text-muted-foreground text-sm mb-4">
      <LangText path="legal.last_updated_2026"  />
    </p>
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground space-y-4">
      <p>
        This Cookie Policy explains how vdpConnect uses cookies and similar technologies when you use our service.
      </p>
      <h2 className="text-lg font-semibold mt-6">1. What Are Cookies</h2>
      <p>
        Cookies are small text files stored on your device when you visit a website. They help the site remember your preferences and improve your experience.
      </p>
      <h2 className="text-lg font-semibold mt-6">2. How We Use Cookies</h2>
      <p>
        We use cookies for authentication, session management, preferences, and analytics. Essential cookies are required for the service to function.
      </p>
      <h2 className="text-lg font-semibold mt-6">3. Managing Cookies</h2>
      <p>
        You can control cookies through your browser settings. Note that disabling certain cookies may affect the functionality of the service.
      </p>
    </div>
  </LegalDocumentLayout>
);

export default CookiePolicy;
