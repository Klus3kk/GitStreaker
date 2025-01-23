const express = require('express');
const axios = require('axios');
const cache = require('./cache'); 
const { fetchStats } = require('./fetchStats'); 

const app = express();
const PORT = 3000;

// Dynamic color selection based on streak length
function getColor(currentStreak) {
    if (currentStreak >= 100) return "purple";
    if (currentStreak >= 15) return "green";
    if (currentStreak >= 5) return "yellow";
    return "red";
}

// API endpoint to fetch streak stats with Shields.io format
app.get('/api/streak/:username', async (req, res) => {
    const { username } = req.params;

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
        const stats = await fetchStats(username);
        cache.set(username, stats); 
        const color = getColor(stats.currentStreak);
        res.json({
            schemaVersion: 1,
            label: "GitHub Streak",
            message: `${stats.currentStreak} days (longest: ${stats.longestStreak} days)`,
            color,
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({
            schemaVersion: 1,
            label: "GitHub Streak",
            message: "error",
            color: "red",
        });
    }
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
