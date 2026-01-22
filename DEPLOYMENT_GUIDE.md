# Deployment Guide: SWES Dictionary App

This application is a **Node.js** app that serves a **React** frontend.
- **Development**: Uses local SQLite (`swes.db`).
- **Production**: Uses PostgreSQL (via Render).

## Prerequisites
- **GitHub Account**: To host your code.
- **Render.com Account**: To host the app.

## 1. Deploy to Render (Recommended)

1.  **Push Code to GitHub**.
2.  **Create Web Service on Render**:
    - Connect your GitHub repo.
    - **Build Command**: `npm install && npm run build`
    - **Start Command**: `node server.js`
3.  **Add Database**:
    - Create a **PostgreSQL** database on Render.
    - Copy the **Internal Database URL**.
    - In your Web Service settings -> **Environment**, add:
        - Key: `DATABASE_URL`
        - Value: `(Paste your Internal Database URL)`

## 2. Accessing the Database (pgAdmin)

To view or edit your live data using a tool like **pgAdmin** or **DBeaver**:

1.  **Get External Connection Info**:
    - Go to Render Dashboard -> Select your **PostgreSQL** service.
    - Click **Connect** (top right) -> **External Connection**.
    - Copy the **External Database URL** (starts with `postgresql://...`).
    - *Note: Don't use the Internal URL; it only works within Render's cloud.*

2.  **Configure pgAdmin**:
    - Right-click "Servers" -> Register -> Server.
    - **General Tab**: Name it `SWES Project`.
    - **Connection Tab**:
        - **Host name/address**: The part of the URL after `@` and before the next `/` (e.g., `dpg-xyz-a.oregon-postgres.render.com`).
        - **Port**: `5432`
        - **Maintenance database**: `project_swe` (the name at the end of the URL).
        - **Username**: `project_swe_user` (from the URL).
        - **Password**: The long string in the URL (between `:` and `@`).
    - Click **Save**.

## 3. Local Development
- Run `npm run dev` and `npm run server`.
- It will automatically use the local `swes.db` file.
