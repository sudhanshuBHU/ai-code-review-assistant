// app/api/webhooks/github/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { analyzeCode } from '@/lib/ai/gemini';
import {verifyWebhookSignature} from '@/lib/githubUtils';
import { GitHubService } from '@/lib/githubService';

// Type definitions for GitHub webhook payload and analysis results
interface GitHubWebhookPayload {
  action: string;
  repository: {
    name: string;
    owner: {
      login: string;
    };
  };
  pull_request: {
    number: number;
  };
  installation?: {
    id: number;
  };
}

interface CodeAnalysisIssue {
  line: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
}

interface CodeAnalysisResult {
  issues: CodeAnalysisIssue[];
  error?: string;
  details?: unknown;
}

export async function POST(req: NextRequest) {
  // Get the raw body for signature verification
  const rawBody = await req.text();
  
  // 1. CRITICAL: Verify the webhook signature
  if (!verifyWebhookSignature(req, rawBody)) {
    return NextResponse.json({ error: 'Unauthorized: Invalid signature' }, { status: 401 });
  }

  // 2. Parse the verified payload
  const payload = JSON.parse(rawBody) as GitHubWebhookPayload;

  // We only care about PRs being opened or updated
  if (payload.action === 'opened' || payload.action === 'synchronize') {
    const repo = payload.repository.name;
    const owner = payload.repository.owner.login;
    const pull_number = payload.pull_request.number;
    const installationId = payload.installation?.id;

    if (!installationId) {
      return NextResponse.json({ error: 'Missing installation ID' }, { status: 400 });
    }

    try {
      // 3. Get files from the pull request using the installationId
      const githubService = await GitHubService.create(installationId);
      const files = await githubService.getPullRequestFiles(owner, repo, pull_number);

      for (const file of files) {
        // We don't want to analyze huge diffs
        if (file.patch.length > 4000) {
            console.log(`Skipping large file: ${file.filename}`);
            continue;
        }

        // 4. For each file, analyze the code
        const analysis = await analyzeCode(file.patch) as CodeAnalysisResult; // Analyze the changes (patch)

        if (analysis.issues && analysis.issues.length > 0) {
          // 5. Format the analysis into a comment
          let commentBody = `### AI Code Review for \`${file.filename}\`\n\n`;
          analysis.issues.forEach((issue: CodeAnalysisIssue) => {
            commentBody += `**- Severity: ${issue.severity}**\n`;
            commentBody += `  - **Line:** ${issue.line}\n`;
            commentBody += `  - **Issue:** ${issue.description}\n\n`;
          });

          // 6. Post the formatted comment to the PR
          await githubService.postCommentToPullRequest(owner, repo, pull_number, commentBody);
        }
      }
    } catch (error) {
        console.error("Error processing webhook:", error);
        // Return a 500 but don't expose internal error details
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  return NextResponse.json({ status: 'ok' });
}






// import { NextRequest, NextResponse } from 'next/server';
// import { analyzeCode } from '@/lib/ai/gemini';
// import { getPullRequestFiles, postCommentToPullRequest } from '@/lib/github';

// export async function POST(req: NextRequest) {
//   const payload = await req.json();

//   // IMPORTANT: In a real app, you MUST verify the webhook signature
//   // to ensure the request is from GitHub.

//   if (payload.action === 'opened' || payload.action === 'synchronize') {
//     const repo = payload.repository.name;
//     const owner = payload.repository.owner.login;
//     const pull_number = payload.pull_request.number;

//     // 1. Get files from the pull request
//     const files = await getPullRequestFiles(owner, repo, pull_number);

//     for (const file of files) {
//       // 2. For each file, analyze the code
//       const analysis = await analyzeCode(file.patch); // Analyze the changes (patch)

//       if (analysis.issues && analysis.issues.length > 0) {
//         // 3. Format the analysis into a comment
//         let commentBody = `### AI Code Review for \`${file.filename}\`\n\n`;
//         analysis.issues.forEach((issue: any) => {
//           commentBody += `**Severity: ${issue.severity}**\n`;
//           commentBody += `- **Line:** ${issue.line}\n`;
//           commentBody += `- **Issue:** ${issue.description}\n\n`;
//         });

//         // 4. Post the comment to the PR
//         await postCommentToPullRequest(owner, repo, pull_number, commentBody);
//       }
//     }
//   }
//   return NextResponse.json({ status: 'ok' });
// }