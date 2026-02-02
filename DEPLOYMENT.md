# Deployment Guide (Aiven MySQL)

This project uses **Aiven MySQL**. Follow these steps to deploy.

## 1. Aiven IP Whitelist
**Crucial Step**: In your Aiven Console, go to **Network** and add `0.0.0.0/0` to **Allowed IP Addresses**. This allows Render to connect.

## 2. Environment Variables
Set these variables in your deployment platform (Render/Vercel/etc):

```env
DB_HOST=mysql-2a44efcc-gudisevadanoj-4b81.g.aivencloud.com
DB_PORT=18511
DB_USER=avnadmin
DB_PASSWORD=(Your Aiven Password)
DB_NAME=defaultdb
```

## 3. Deploy
1.  Push code to GitHub.
2.  Connect to Render.
3.  The app will **automatically create tables** on the first start.

## 4. Troubleshooting
- **Connection Error?** Check the IP Whitelist in Aiven (Step 1).
- **Missing Tables?** Restart the service; the valid logs should show "Database initialization complete".
