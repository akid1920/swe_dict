# Deployment Guide: SWES Dictionary App

This application is a **Node.js** app that serves a **React** frontend and uses **SQLite** for the database.

## Prerequisites
- **GitHub Account**: To host your code.
- **Render.com Account** (or Railway/DigitalOcean): To host the app.

## Important Note on Database
This app uses **SQLite** (`swes.db`). SQLite acts like a file.
- **Ephemeral Hosting (e.g., Vercel, Netlify, Heroku Free Tier)**: These services **wipe the disk** every time you deploy or restart. Your data will be lost.
- **Persistent Hosting (Recommended)**: You need a service that supports **Persistent Disks** (Volumes), such as **Render (with Disk)**, **Railway (with Volume)**, or a **VPS** (DigitalOcean Droplet).

## Option A: Deploy to Render.com (Recommended)

1.  **Push Code to GitHub**:
    - Commit all your changes (including `swes.db` if you want to keep your current data, or let it auto-create a fresh one).
    - Push to a new GitHub repository.

2.  **Create Web Service on Render**:
    - New -> Web Service.
    - Connect your GitHub repo.

3.  **Configure**:
    - **Name**: `swes-dictionary`
    - **Environment**: `Node`
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `node server.js`

4.  **Add Persistent Disk (Crucial)**:
    - Go to **Disks** section in setup.
    - Name: `sqlite-data`
    - Mount Path: `/opt/render/project/src` (or simply `./` depending on how Render mounts it, usually project root).
    - *Note: Render's free tier does not support disks. You may need the paid "Starter" plan for persistence, or use a cloud database service like PostgreSQL instead of SQLite for free tier hosting.*

## Option B: Run Locally (Forever)

If this is for a local kiosk or office computer:
1.  Install **Node.js**.
2.  Copy the project folder.
3.  Run `npm install && npm run build`.
4.  Start with `node server.js`.
5.  Access at `http://localhost:3000`.

## Option C: VPS (Digital Ocean / AWS)

1.  SSH into server.
2.  Clone repo.
3.  `npm install && npm run build`.
4.  Use `pm2` to keep it running: `pm2 start server.js`.
