# Deployment Guide for Render

This guide outlines the steps to deploy the Travel Planner application to [Render](https://render.com/).

## Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Render](https://render.com/) account.
3.  The project code pushed to a GitHub repository.

## Step 1: Push to GitHub

If you haven't already, push your code to a new GitHub repository or update your existing one.
Make sure the root of the repository contains `package.json` and the `server` folder.

## Step 2: Create a Web Service on Render

1.  Log in to your Render dashboard.
2.  Click the **"New +"** button and select **"Web Service"**.
3.  Connect your GitHub account if prompted.
4.  Select the repository containing your Travel Planner code.

## Step 3: Configure the Service

Configure the following settings:

*   **Name:** Choose a unique name for your app (e.g., `travel-planner-app`).
*   **Region:** Select the region closest to you or your users (e.g., `Oregon (US West)`).
*   **Branch:** `main` (or `master`, depending on your repo).
*   **Root Directory:** Leave blank (defaults to repo root).
*   **Runtime:** **Node**
*   **Build Command:** `npm install`
*   **Start Command:** `npm start`
*   **Instance Type:** **Free** (for hobby/testing purposes).

## Step 4: Deploy

1.  Click **"Create Web Service"**.
2.  Render will start building your application. You can view the logs in the "Events" or "Logs" tab.
3.  Once the build finishes and the service starts, you will see a green **"Live"** badge.
4.  Your app URL will be displayed at the top (e.g., `https://travel-planner-app.onrender.com`).

> [!WARNING]
> **Data Persistence Warning**
> Since this application uses a local file-based database (`server/data/db.json`), **all user data (trips, checklists, etc.) will be lost** whenever the app restarts or redeploys on Render. This is a limitation of the free/ephemeral file system on cloud platforms. For permanent data storage, you would need to integrate a database service like MongoDB Atlas or Render's PostgreSQL.

## Troubleshooting

-   **Build Failed:** Check the logs for errors. Ensure `package.json` exists in the root.
-   **App Crashes:** Check the "Logs" tab. Ensure the node version is compatible (we set it to `>=18.0.0`).
-   **Data Not Saving:** Remember the warning above; data is ephemeral on the free tier.
