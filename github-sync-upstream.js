// [task_local]
// 定时同步GitHub上游repo
// 0 0 * * * github-sync-upstream.js, tag=定时同步GitHub上游repo, enabled=true
const fetch = require("node-fetch");
const { Octokit } = require("@octokit/core");

const githubRepoOwner = process.env.GITHUB_REPO_OWNER;
if (!githubRepoOwner) {
    console.error("GitHub repo owner not specified");
    return;
}

// Example:
// [{"repo": "is-a-dev-register","branch": "main"},{"repo": "logback","branch": "master"}]
const repos = process.env.GITHUB_REPOS;
if (!repos) {
    console.error("No repo specified");
    return;
}

const githubAccessToken = process.env.GITHUB_TOKEN;
const octokit = new Octokit({
    auth: githubAccessToken,
    request: {
        fetch: fetch
    }
});

JSON.parse(repos).forEach(async (repository) => {
    console.log(`Syncing ${githubRepoOwner}/${repository["repo"]}`);

    const response = await octokit.request(
        "POST /repos/{owner}/{repo}/merge-upstream",
        {
            owner: githubRepoOwner,
            repo: repository["repo"],
            branch: repository["branch"]
        });

    console.log(`${repository["repo"]} synced, status ${response.status}, response message: ${response.data["message"]}`);
});
