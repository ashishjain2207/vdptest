import { loadTestData } from '../utils/testDataLoader';
import { uniquePostText } from '../utils/randomData';

type ReportedPostData = {
  contentPrefix: string;
  reason: string;
};

export type ReportedPostSetup = {
  postId?: string;
  content: string;
  reason: string;
};

export type ModerationSetupFixtures = {
  reportedPostSetup: ReportedPostSetup;
};

export const moderationSetupFixtures = {
  reportedPostSetup: async ({}, use: (setup: ReportedPostSetup) => Promise<void>) => {
    const data = loadTestData<ReportedPostData>('test-data/reportedPost.json');
    await use({
      postId: process.env.E2E_REPORTED_POST_ID,
      content: process.env.E2E_REPORTED_POST_TEXT ?? uniquePostText(data.contentPrefix),
      reason: process.env.E2E_REPORTED_POST_REASON ?? data.reason,
    });
  },
};
