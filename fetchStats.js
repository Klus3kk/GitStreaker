const axios = require('axios');

const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = ''; // Replace with your token

async function fetchAllRepos(username) {
    const repos = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const response = await axios.get(`${GITHUB_API}/users/${username}/repos`, {
            params: { page, per_page: perPage },
            headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        });

        if (response.data.length === 0) break; 
        repos.push(...response.data);
        page++;
    }

    return repos.map(repo => repo.name);
}

async function fetchCommits(username, repo) {
    const commits = [];
    let page = 1;
    const perPage = 100;

    while (true) {
        const response = await axios.get(`${GITHUB_API}/repos/${username}/${repo}/commits`, {
            params: { page, per_page: perPage },
            headers: { Authorization: `Bearer ${GITHUB_TOKEN}` },
        });

        if (response.data.length === 0) break;
        commits.push(...response.data);
        page++;
    }

    return commits.map(commit => new Date(commit.commit.author.date).toDateString());
}

function calculateStreaks(dates) {
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(a) - new Date(b));

    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;

    for (let i = 0; i < uniqueDates.length; i++) {
        if (i > 0) {
            const diff = new Date(uniqueDates[i]) - new Date(uniqueDates[i - 1]);
            if (diff === 86400000) { 
                streak++;
            } else if (diff > 86400000) {
                streak = 1; 
            }
        } else {
            streak = 1; 
        }

        currentStreak = streak;
        longestStreak = Math.max(longestStreak, streak);
    }

    return { currentStreak, longestStreak };
}

async function fetchStats(username) {
    try {
        const repos = await fetchAllRepos(username);
        let allCommitDates = [];

        for (const repo of repos) {
            const commits = await fetchCommits(username, repo);
            allCommitDates.push(...commits);
        }

        const { currentStreak, longestStreak } = calculateStreaks(allCommitDates);

        return {
            username,
            currentStreak,
            longestStreak,
            totalCommits: allCommitDates.length,
        };
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
