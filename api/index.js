export default function handler(req, res) {
    res.status(200).json({
        message: "Sanity Check Passed",
        env: process.env.NODE_ENV,
        vercel: process.env.VERCEL
    });
}
