import { LegalDocumentLayout } from '@/components/layout/LegalDocumentLayout';
import { LangText } from '@/components/ui/LangText';

const TermsOfService = () => (
  <LegalDocumentLayout>
    <h1 className="text-2xl font-bold text-foreground mb-4">
      <LangText path="layout.terms_of_service"  />
    </h1>
    <p className="text-muted-foreground text-sm mb-4">
      <LangText path="legal.last_updated_2026"  />
    </p>
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground space-y-4">
      <p>
        Welcome to vdpConnect. By using our service, you agree to these terms. Please read them carefully.
      </p>
      <h2 className="text-lg font-semibold mt-6">1. Acceptance of Terms</h2>
      <p>
        By accessing or using vdpConnect, you agree to be bound by these Terms of Service and all applicable laws and regulations.
      </p>
      <h2 className="text-lg font-semibold mt-6">2. Use of Service</h2>
      <p>
        You agree to use the service only for lawful purposes and in accordance with these terms. You must not use the service in any way that could harm, disable, or impair the platform.
      </p>
      <h2 className="text-lg font-semibold mt-6">3. User Content</h2>
      <p>
        You retain ownership of content you post. By posting, you grant us a license to display and distribute your content within the service.
      </p>
    </div>
  </LegalDocumentLayout>
);

export default TermsOfService;
