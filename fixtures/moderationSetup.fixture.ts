import { postSetupTest } from './postSetup.fixture';
import { loadTestData } from '../utils/testDataLoader';

export type ReportedPostSetup = {
  content: string;
  reportReason: string;
};

export type ModerationSetupFixtures = {
  reportedPostSetup: ReportedPostSetup;
};

type ReportedPostData = {
  content: string;
  reportReason: string;
};

export const moderationSetupTest = postSetupTest.extend<ModerationSetupFixtures>({
  reportedPostSetup: async ({}, use) => {
    const data = loadTestData<ReportedPostData>('reportedPost.json');
    await use({
      content: process.env.VDP_E2E_REPORTED_POST_TEXT ?? data.content,
      reportReason: process.env.VDP_E2E_REPORTED_POST_REASON ?? data.reportReason,
    });
  },
});
