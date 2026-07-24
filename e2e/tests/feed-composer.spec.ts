import { Page, Request, Response } from '@playwright/test';
import { test, expect } from '../fixtures/auth';
import { FeedComposerPage } from '../pages/feedComposerPage';
import { STABLE_MEDIA_IMAGE } from '../test-data/mediaImage';
import { parseMultipartRequest } from '../utils/multipart';

const POSTS_CREATE_PATH = '/api/Posts';
const POSTS_POLL_PATH_REGEX = /^\/api\/Posts\/[^/]+\/poll$/;
const POSTS_DETAIL_PATH_REGEX = /^\/api\/Posts\/[^/]+$/;

/**
 * Selector + behavior sources:
 * - E2E_SCOPE.md (read order + feed composer control list)
 * - src/components/post/CreatePost.jsx (composer aria-labels, payload construction, publish reset)
 * - src/lib/postComposer.js (publish enablement logic for link/location/poll/media-only)
 * - src/services/postService.js (POST /api/Posts and POST /api/Posts/{postId}/poll endpoints)
 * - src/components/post/PostCard.jsx and src/components/post/PostContent.jsx (rendered link/location/poll assertions)
 */

function createUniqueToken(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function isCreatePostResponse(response: Response): boolean {
  if (response.request().method() !== 'POST') {
    return false;
  }
  const { pathname } = new URL(response.url());
  return pathname === POSTS_CREATE_PATH;
}

function isPollCreateRequest(request: Request): boolean {
  if (request.method() !== 'POST') {
    return false;
  }
  const { pathname } = new URL(request.url());
  return POSTS_POLL_PATH_REGEX.test(pathname);
}

function isPostDetailGetRequest(request: Request): boolean {
  if (request.method() !== 'GET') {
    return false;
  }
  const { pathname } = new URL(request.url());
  return POSTS_DETAIL_PATH_REGEX.test(pathname);
}

async function waitForCreatePostResponse(page: Page) {
  const response = await page.waitForResponse(isCreatePostResponse);
  expect(response.ok()).toBeTruthy();
  return response;
}

async function postIdFromCreateResponse(response: Response): Promise<string> {
  const body = (await response.json()) as { id?: string; Id?: string };
  const postId = body.id ?? body.Id;
  expect(postId).toBeTruthy();
  return postId as string;
}

async function openCreatedPost(page: Page, postId: string) {
  await page.goto(`/posts/${postId}`);
  await expect(page).toHaveURL(new RegExp(`/posts/${postId}(?:[?#].*)?$`));
}

test.describe('Feed composer business-process scenarios', () => {
  test('User can publish a text post from the feed composer', async ({ authenticatedPage: page }) => {
    const composer = new FeedComposerPage(page);
    await composer.goto();

    const postText = createUniqueToken('E2E text post');
    await composer.fillContent(postText);

    const createPostResponsePromise = waitForCreatePostResponse(page);
    await composer.publish();

    const createPostResponse = await createPostResponsePromise;
    const multipart = parseMultipartRequest(createPostResponse.request());
    expect(multipart.fields.postType?.[0]).toBe('Post');
    expect(multipart.fields.content?.[0]).toContain(postText);

    await expect(page.getByText('Post published.')).toBeVisible();
    await expect(page.locator('article').filter({ hasText: postText }).first()).toBeVisible();
    await composer.expectComposerCleared();
  });

  test('User can publish a media-only post', async ({ authenticatedPage: page }) => {
    const composer = new FeedComposerPage(page);
    await composer.goto();

    await composer.attachMedia(STABLE_MEDIA_IMAGE);
    await composer.applyImageCropIfVisible();
    await composer.expectMediaPreviewVisible();
    await expect(composer.contentInput).toHaveValue('');

    const createPostResponsePromise = waitForCreatePostResponse(page);
    await composer.publish();
    const createPostResponse = await createPostResponsePromise;

    const multipart = parseMultipartRequest(createPostResponse.request());
    expect(multipart.fields.postType?.[0]).toBe('Post');
    expect(multipart.fields.content?.[0]?.trim()).toBe('');
    expect(multipart.fileParts.length).toBeGreaterThan(0);

    await expect(page.getByText('Post published.')).toBeVisible();
    const postId = await postIdFromCreateResponse(createPostResponse);
    await openCreatedPost(page, postId);
    await expect(page.getByAltText('Post attachment 1')).toBeVisible();
  });

  test('User can publish a link-only post', async ({ authenticatedPage: page }) => {
    const composer = new FeedComposerPage(page);
    await composer.goto();

    const uniqueLink = `https://example.com/${createUniqueToken('feed-link')}`;
    const linkDomain = new URL(uniqueLink).hostname;

    await expect(composer.contentInput).toHaveValue('');
    await composer.expectPublishEnabled(false);
    await composer.addLink(uniqueLink);
    await composer.expectLinkCardVisible(linkDomain);
    await composer.expectPublishEnabled(true);

    const createPostResponsePromise = waitForCreatePostResponse(page);
    await composer.publish();
    const createPostResponse = await createPostResponsePromise;

    const multipart = parseMultipartRequest(createPostResponse.request());
    expect(multipart.fields.content?.[0]).toContain(uniqueLink);
    expect(multipart.fields.postType?.[0]).toBe('Post');

    await expect(page.getByText('Post published.')).toBeVisible();
    const postId = await postIdFromCreateResponse(createPostResponse);
    await openCreatedPost(page, postId);
    await expect(page.locator(`a[href="${uniqueLink}"]`)).toBeVisible();
  });

  test('User can publish a location-only post', async ({ authenticatedPage: page }) => {
    const composer = new FeedComposerPage(page);
    await composer.goto();

    const locationLabel = createUniqueToken('E2E Location');
    await expect(composer.contentInput).toHaveValue('');
    await composer.expectPublishEnabled(false);

    await composer.addManualLocation(locationLabel);
    await composer.expectLocationCardVisible(locationLabel);
    await composer.expectPublishEnabled(true);

    const createPostResponsePromise = waitForCreatePostResponse(page);
    await composer.publish();
    const createPostResponse = await createPostResponsePromise;

    const multipart = parseMultipartRequest(createPostResponse.request());
    expect(multipart.fields.postType?.[0]).toBe('Post');
    expect(multipart.fields.content?.[0]).toContain(`📍 ${locationLabel}`);

    await expect(page.getByText('Post published.')).toBeVisible();
    const postId = await postIdFromCreateResponse(createPostResponse);
    await openCreatedPost(page, postId);
    await expect(
      page.locator(
        `a[href*="google.com/maps/search"][href*="${encodeURIComponent(locationLabel)}"]`,
      ),
    ).toBeVisible();
  });

  test('User can publish a poll-only post with a valid question and options', async ({
    authenticatedPage: page,
  }) => {
    const composer = new FeedComposerPage(page);
    await composer.goto();

    const question = createUniqueToken('E2E Poll Question');
    const optionA = 'Option Alpha';
    const optionB = 'Option Beta';

    await expect(composer.contentInput).toHaveValue('');
    await composer.expectPublishEnabled(false);
    await composer.addPoll(question, [optionA, optionB]);
    await composer.expectPublishEnabled(true);

    const createPostResponsePromise = waitForCreatePostResponse(page);
    const pollRequestPromise = page.waitForRequest(isPollCreateRequest);
    const detailRefetchRequestPromise = page.waitForRequest(isPostDetailGetRequest);

    await composer.publish();

    const createPostResponse = await createPostResponsePromise;
    const postId = await postIdFromCreateResponse(createPostResponse);

    const baseCreateMultipart = parseMultipartRequest(createPostResponse.request());
    expect(baseCreateMultipart.fields.postType?.[0]).toBe('Post');

    const pollRequest = await pollRequestPromise;
    const pollRequestPath = new URL(pollRequest.url()).pathname;
    expect(pollRequestPath).toBe(`/api/Posts/${postId}/poll`);

    const pollPayload = pollRequest.postDataJSON() as {
      question?: string;
      optionTexts?: string[];
    };
    expect(pollPayload.question).toBe(question);
    expect((pollPayload.optionTexts ?? []).filter((entry) => String(entry).trim().length > 0)).toEqual([
      optionA,
      optionB,
    ]);

    const detailRefetchRequest = await detailRefetchRequestPromise;
    expect(new URL(detailRefetchRequest.url()).pathname).toBe(`/api/Posts/${postId}`);

    await expect(page.getByText('Post published.')).toBeVisible();
    await openCreatedPost(page, postId);
    await expect(page.getByText(question, { exact: false })).toBeVisible();
    await expect(page.getByText(optionA, { exact: false })).toBeVisible();
    await expect(page.getByText(optionB, { exact: false })).toBeVisible();
  });
});
