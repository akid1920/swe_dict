export default async function handler(req, res) {
    try {
        const appModule = await import('../server.js');
        const app = appModule.default;
        app(req, res);
    } catch (e) {
        console.error("Critical Server Load Error:", e);
        res.status(500).json({
            error: "CRASH ON STARTUP",
            message: e.message,
            stack: e.stack
        });
    }
}
