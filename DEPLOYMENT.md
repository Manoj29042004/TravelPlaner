# Deployment Guide for Render

This guide outlines the steps to deploy the Travel Planner application to [Render](https://render.com/) using an **Aiven MySQL** database.

## Prerequisites

1.  A [GitHub](https://github.com/) account.
2.  A [Render](https://render.com/) account.
3.  Your Aiven MySQL connection details (Host, Port, User, Password, DB Name).

## Step 1: Push to GitHub (Completed)

Your code is already pushed to GitHub.

## Step 2: Create a Web Service on Render

1.  Log in to your [Render Dashboard](https://dashboard.render.com/).
2.  Click the **"New +"** button and select **"Web Service"**.
3.  Select the repository containing your Travel Planner code (`TravelPlaner`).

## Step 3: Configure the Service

Configure the following settings:

*   **Name:** `travel-planner-app` (or any unique name).
*   **Region:** Select the region closest to you (e.g., `Singapore` or `Oregon`).
*   **Branch:** `master`
*   **Root Directory:** *(Leave blank)*
*   **Runtime:** **Node**
*   **Build Command:** `npm install`
*   **Start Command:** `node server/server.js`
*   **Instance Type:** **Free**

## Step 4: Environment Variables (CRITICAL)

Scroll down to the **Environment Variables** section and add the following keys with your Aiven credentials:

| Key | Value |
| --- | --- |
| `DB_HOST` | `mysql-2a44efcc-gudisevadanoj-4b81.g.aivencloud.com` |
| `DB_PORT` | `18511` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | *(Enter your Aiven Password)* |
| `DB_NAME` | `defaultdb` |

## Step 5: Deploy & Initialize Database

1.  Click **"Create Web Service"**.
2.  Render will start building your application.

### initializing the Database (IMPORTANT)
Since your local machine couldn't connect to the database, you **MUST** run the initialization script from Render's shell to create the tables (`users`, `trips`, etc.).

1.  Wait for the deploy to finish (if it fails/crashes, that's okay, proceed to next step).
2.  Click on the **Shell** tab in the Render dashboard (left sidebar).
3.  Wait for the terminal prompt to appear.
4.  Type and run:
    ```bash
    node server/scripts/initDb.js
    ```
5.  You should see the message: `Database initialization complete`.
6.  If your app had crashed, go to the top right and click **Manual Deploy** -> **Restart Service**.

## Step 6: Verify

Open your app's URL (e.g., `https://travel-planner-app.onrender.com`).
Test by **Registering a new user**. If it works, you are fully live!
