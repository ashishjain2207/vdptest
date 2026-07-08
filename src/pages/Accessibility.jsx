import { LegalDocumentLayout } from '@/components/layout/LegalDocumentLayout';
import { LangText } from '@/components/ui/LangText';

const Accessibility = () => (
  <LegalDocumentLayout>
    <h1 className="text-2xl font-bold text-foreground mb-4">
      <LangText path="layout.accessibility"  />
    </h1>
    <p className="text-muted-foreground text-sm mb-4">
      <LangText path="legal.last_updated_2026"  />
    </p>
    <div className="prose prose-sm dark:prose-invert max-w-none text-foreground space-y-4">
      <p>
        vdpConnect is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone.
      </p>
      <h2 className="text-lg font-semibold mt-6">1. Our Commitment</h2>
      <p>
        We aim to conform to WCAG 2.1 Level AA guidelines where practicable. This includes providing sufficient color contrast, keyboard navigation, and screen reader support.
      </p>
      <h2 className="text-lg font-semibold mt-6">2. Features</h2>
      <p>
        Our platform supports keyboard navigation, focus indicators, and semantic HTML. We provide alternative text for images where appropriate.
      </p>
      <h2 className="text-lg font-semibold mt-6">3. Feedback</h2>
      <p>
        If you encounter accessibility barriers, please contact us. We welcome your feedback and will work to address issues promptly.
      </p>
    </div>
  </LegalDocumentLayout>
);

export default Accessibility;
