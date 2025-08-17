// lib/githubService.js

import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";

// --- Singleton Authentication Setup ---

const appId = process.env.GITHUB_APP_ID;
const privateKey = process.env.GITHUB_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Fail-fast: The application cannot function without these credentials.
if (!appId || !privateKey) {
  throw new Error("FATAL_ERROR: GITHUB_APP_ID and GITHUB_PRIVATE_KEY must be configured in environment variables.");
}

// Create the authentication strategy once at the module level.
// This is more efficient than creating it on every request.
const appAuth = createAppAuth({
  appId,
  privateKey,
});

/**
 * A service class for interacting with the GitHub API on behalf of a specific app installation.
 * This class encapsulates the Octokit instance and provides clean, high-level methods for API actions.
 */
export class GitHubService {
  /** @type {Octokit} */
  #octokit; // Using a private field for true encapsulation.

  /**
   * The constructor is private. Use the static `create` method to instantiate the service.
   * @param {Octokit} octokitInstance An authenticated Octokit instance.
   */
  constructor(octokitInstance) {
    this.#octokit = octokitInstance;
  }

  /**
   * Asynchronous factory method to create an authenticated service instance.
   * This is the public entry point for creating a GitHubService.
   * @param {number} installationId The ID of the GitHub App installation.
   * @returns {Promise<GitHubService>} A promise that resolves to a new GitHubService instance.
   */
  static async create(installationId) {
    if (!installationId) {
      throw new Error("installationId is required to create a GitHubService instance.");
    }
    
    // Create a short-lived, installation-scoped authentication token.
    const installationAuthentication = await appAuth({
      type: "installation",
      installationId,
    });

    const octokit = new Octokit({ auth: installationAuthentication.token });
    return new GitHubService(octokit);
  }

  // --- API Actions ---

  /**
   * Fetches the content of files changed in a pull request.
   * @param {string} owner The repository owner's username.
   * @param {string} repo The repository name.
   * @param {number} pull_number The number of the pull request.
   * @returns {Promise<Array<{filename: string, patch: string}>>} A promise resolving to an array of file objects.
   */
  async getPullRequestFiles(owner, repo, pull_number) {
    const { data: files } = await this.#octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number,
    });

    // We only care about the filename and the patch (the diff content).
    return files
      .map((file) => ({
        filename: file.filename,
        patch: file.patch || '',
      }))
      .filter((file) => file.patch); // Ensure we only analyze files with changes.
  }

  /**
   * Posts a comment on a pull request.
   * @param {string} owner The repository owner's username.
   * @param {string} repo The repository name.
   * @param {number} issue_number The issue number (same as the pull request number).
   * @param {string} body The content of the comment.
   */
  async postCommentToPullRequest(owner, repo, issue_number, body) {
    // A more advanced version might search for existing comments from the bot
    // and update it to prevent spamming the PR.
    await this.#octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number,
      body,
    });
  }
}