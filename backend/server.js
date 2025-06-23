require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { createServer } = require('http');

const app = express();

const server = createServer(app);

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// Serve frontend files
// const distPath = path.join(__dirname, '../frontend/dist/');
const distPath = path.join(__dirname, '../dist/');
app.use(express.static(distPath));

// Catch-all route to serve the frontend
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: distPath });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});