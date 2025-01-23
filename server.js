require('dotenv').config();
const express = require('express');
const { fetchStats } = require('./fetchStats');
const cache = require('./cache');

const app = express();
const PORT = process.env.PORT || 3000;

// Dynamic color selection based on streak length
function getColor(currentStreak) {
  if (currentStreak >= 100) return "purple";
  if (currentStreak >= 15) return "green";
  if (currentStreak >= 5) return "yellow";
  return "red";
}

// API endpoint to fetch streak stats
app.get('/api/streak/:username', async (req, res) => {
  const { username } = req.params;

  // Check if the data is already cached
  if (cache.has(username)) {
    const stats = cache.get(username);
    const color = getColor(stats.currentStreak);
    return res.json({
      schemaVersion: 1,
      label: "GitHub Streak",
      message: `${stats.currentStreak} days (longest: ${stats.longestStreak} days)`,
      color,
    });
  }

  try {
    // Fetch stats from GitHub API
    const stats = await fetchStats(username);

    // Cache the stats for future requests
    cache.set(username, stats);

    // Determine the color based on the current streak
    const color = getColor(stats.currentStreak);

    // Return the response in Shields.io format
    res.json({
      schemaVersion: 1,
      label: "GitHub Streak",
      message: `${stats.currentStreak} days (longest: ${stats.longestStreak} days)`,
      color,
    });
  } catch (error) {
    console.error('Error in /api/streak/:username:', error.message);

    // Return an error response
    res.status(500).json({
      schemaVersion: 1,
      label: "GitHub Streak",
      message: "error",
      color: "red",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});