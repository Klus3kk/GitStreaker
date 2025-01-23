const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Use environment variable

// Fetch all repositories for a user
async function fetchAllRepos(username) {
  try {
    const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
      params: { per_page: 100 }, // Fetch up to 100 repositories
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });
    return response.data.map(repo => repo.name);
  } catch (error) {
    console.error('Error fetching repositories:', error.message);
    throw new Error('Failed to fetch repositories');
  }
}

// Fetch commits for a specific repository
async function fetchCommits(username, repo) {
  try {
    const response = await axios.get(`${GITHUB_API}/repos/${username}/${repo}/commits`, {
      params: { per_page: 100 }, // Fetch up to 100 commits
      headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
    });
    return response.data.map(commit => new Date(commit.commit.author.date).toDateString());
  } catch (error) {
    console.error('Error fetching commits:', error.message);
    throw new Error('Failed to fetch commits');
  }
}

// Calculate streaks from commit dates
function calculateStreaks(dates) {
  const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(a) - new Date(b));

  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i > 0) {
      const diff = new Date(uniqueDates[i]) - new Date(uniqueDates[i - 1]);
      if (diff === 86400000) { // 1 day in milliseconds
        streak++;
      } else if (diff > 86400000) {
        streak = 1; // Reset streak
      }
    } else {
      streak = 1; // Start streak
    }

    currentStreak = streak;
    longestStreak = Math.max(longestStreak, streak);
  }

  return { currentStreak, longestStreak };
}

// Fetch stats with timeout handling
async function fetchStats(username) {
  const timeout = 8000; // 8 seconds
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  );

  try {
    const statsPromise = (async () => {
      const repos = await fetchAllRepos(username);
      let allCommitDates = [];

      // Fetch commits for all repositories concurrently
      const commitPromises = repos.map(repo => fetchCommits(username, repo));
      const commitResults = await Promise.all(commitPromises);
      allCommitDates = commitResults.flat();

      const { currentStreak, longestStreak } = calculateStreaks(allCommitDates);

      return {
        username,
        currentStreak,
        longestStreak,
        totalCommits: allCommitDates.length,
      };
    })();

    return await Promise.race([statsPromise, timeoutPromise]);
  } catch (error) {
    console.error('Error fetching stats:', error.message);
    throw new Error('Failed to fetch stats');
  }
}

module.exports = {
  fetchStats,
  fetchAllRepos,
  fetchCommits,
  calculateStreaks,
};