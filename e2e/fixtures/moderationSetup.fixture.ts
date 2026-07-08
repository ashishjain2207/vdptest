import { test as postTest } from './postSetup.fixture';

export type ReportedPostSetup = {
  preview: string;
  postId?: string;
};

export type ModerationSetupFixtures = {
  reportedPostSetup: ReportedPostSetup;
};

export const test = postTest.extend<ModerationSetupFixtures>({
  reportedPostSetup: async ({}, use, testInfo) => {
    const preview = process.env.E2E_REPORTED_POST_PREVIEW ?? '';
    const postId = process.env.E2E_REPORTED_POST_ID;
    testInfo.skip(!preview && !postId, 'Set E2E_REPORTED_POST_PREVIEW or E2E_REPORTED_POST_ID.');
    await use({ preview, postId });
  },
});
