import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', msg: "Server.js Minimal Mode" });
});

// Capture startup errors?
console.log("Server initialized (minimal)");

export default app;
