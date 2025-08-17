// lib/github.ts

import { App } from "@octokit/app";
import * as crypto from 'crypto';

// Type definitions for GitHub API responses
interface PullRequestFile {
  filename: string;
  patch: string | null;
}

type InstallationOctokit = Awaited<ReturnType<App['getInstallationOctokit']>>;

// Type for Octokit API with full REST methods
interface FullOctokit {
  pulls: {
    listFiles: (params: { owner: string; repo: string; pull_number: number }) => Promise<{
      data: PullRequestFile[];
    }>;
  };
  issues: {
    createComment: (params: { owner: string; repo: string; issue_number: number; body: string }) => Promise<void>;
  };
}

// --- Authentication ---

/**
 * Creates an authenticated Octokit client for a specific installation.
 * This is the primary way we'll interact with the GitHub API.
 * @param installationId The ID of the GitHub App installation.
 * @returns An authenticated Octokit instance.
 */
async function getAuthenticatedOctokit(installationId: number): Promise<InstallationOctokit> {
  const appId = process.env.GITHUB_APP_ID!;
  const privateKey = process.env.GITHUB_PRIVATE_KEY!;

  if (!appId || !privateKey) {
    throw new Error("GitHub App credentials are not configured in environment variables.");
  }
  
  const app = new App({
    appId: appId,
    privateKey: privateKey,
  });

  // This creates a short-lived token scoped to the specific installation.
  const octokit = await app.getInstallationOctokit(installationId);
  return octokit;
}

// --- API Actions ---

/**
 * Fetches the content of files changed in a pull request.
 * @param owner The repository owner's username.
 * @param repo The repository name.
 * @param pull_number The number of the pull request.
 * @param installationId The ID of the GitHub App installation.
 * @returns A promise that resolves to an array of file objects.
 */
export async function getPullRequestFiles(
  owner: string,
  repo: string,
  pull_number: number,
  installationId: number
) {
  const octokit = await getAuthenticatedOctokit(installationId);

  const { data: files } = await (octokit as unknown as FullOctokit).pulls.listFiles({
    owner,
    repo,
    pull_number,
  });

  // We only care about the filename and the patch (the diff content).
  // The patch contains only the added/removed lines, which is perfect for AI analysis.
  return files.map((file: PullRequestFile) => ({
    filename: file.filename,
    patch: file.patch || ''
  })).filter((file: { patch: string }) => file.patch); // Ensure we only analyze files with changes.
}

/**
 * Posts a comment on a pull request.
 * @param owner The repository owner's username.
 * @param repo The repository name.
 * @param issue_number The issue number (which is the same as the pull request number).
 * @param body The content of the comment.
 * @param installationId The ID of the GitHub App installation.
 */
export async function postCommentToPullRequest(
  owner: string,
  repo: string,
  issue_number: number,
  body: string,
  installationId: number
) {
  const octokit = await getAuthenticatedOctokit(installationId);
  
  // A more advanced version might search for existing comments from the bot
  // and update it to prevent spamming the PR. For now, we'll create a new one.
  await (octokit as unknown as FullOctokit).issues.createComment({
    owner,
    repo,
    issue_number,
    body,
  });
}

// --- Webhook Verification ---

/**
 * Verifies the signature of an incoming webhook payload.
 * This is a CRITICAL security measure.
 * @param request The incoming NextRequest.
 * @param payload The raw request body as a string.
 * @returns A boolean indicating if the signature is valid.
 */
export async function verifyWebhookSignature(request: Request, payload: string): Promise<boolean> {
  const signatureHeader = request.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  if (!signatureHeader) {
    console.error("Missing x-hub-signature-256 header");
    return false;
  }
  if (!secret) {
    console.error("Missing GITHUB_WEBHOOK_SECRET environment variable");
    return false; // Fail safe
  }
  
  const signature = signatureHeader.split("=")[1];
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}