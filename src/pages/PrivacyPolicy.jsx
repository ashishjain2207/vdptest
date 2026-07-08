import { LegalDocumentLayout } from '@/components/layout/LegalDocumentLayout';
import { LangText } from '@/components/ui/LangText';

const PrivacyPolicy = () => (
  <LegalDocumentLayout>
    <h1 className="text-2xl font-bold text-foreground mb-4">
      <LangText path="layout.privacy_policy"  />
    </h1>
    <p className="text-muted-foreground text-sm mb-4">
      <LangText path="legal.last_updated_2026"  />
    </p>
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground space-y-4">
      <p>
        vdpResearch and vdpConnect are committed to protecting your privacy. This policy explains how we collect, use, and safeguard your information.
      </p>
      <h2 className="text-lg font-semibold mt-6">1. Information We Collect</h2>
      <p>
        We collect information you provide when registering, posting content, or contacting us. This may include your name, email, profile data, and usage information.
      </p>
      <h2 className="text-lg font-semibold mt-6">2. How We Use Your Information</h2>
      <p>
        We use your information to operate the service, personalize your experience, communicate with you, and improve our platform.
      </p>
      <h2 className="text-lg font-semibold mt-6">3. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your personal data against unauthorized access or disclosure.
      </p>
    </div>
  </LegalDocumentLayout>
);

export default PrivacyPolicy;
