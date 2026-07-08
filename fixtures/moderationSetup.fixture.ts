import { postSetupTest } from './postSetup.fixture';
import { loadTestData } from '../utils/testDataLoader';

type ReportedPostData = {
  postId: string;
  content: string;
  reportReason: string;
};

export type ReportedPostSetup = {
  id: string;
  content: string;
  reportReason: string;
};

export type ModerationSetupFixtures = {
  reportedPostSetup: ReportedPostSetup;
};

export const moderationSetupTest = postSetupTest.extend<ModerationSetupFixtures>({
  reportedPostSetup: async ({}, use) => {
    const data = loadTestData<ReportedPostData>('reportedPost.json');
    await use({
      id: process.env.E2E_REPORTED_POST_ID ?? data.postId,
      content: process.env.E2E_REPORTED_POST_CONTENT ?? data.content,
      reportReason: process.env.E2E_REPORTED_POST_REASON ?? data.reportReason,
    });
  },
});
