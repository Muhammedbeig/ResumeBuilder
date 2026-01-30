# Deploying to Hostinger (MySQL)

## 1. Local Development (Currently Active)
Your local project is configured to use **XAMPP MySQL**.
- **Database:** `resumedb`
- **User:** `root` (No password)
- **URL:** `mysql://root:@localhost:3306/resumedb`

## 2. Hostinger Deployment (Production)
When you deploy to Hostinger, you must set the **Environment Variable** in hPanel.

1. Go to **hPanel -> VPS / Node.js -> Environment Variables**.
2. Set `DATABASE_URL` to your Hostinger database credentials:
   
   ```
   mysql://u844762794_soccerAdmin:livesoccerr%40Admin1@localhost:3306/resumedb
   ```
   *(Note: `%40` is the URL-encoded version of `@` in your password)*

3. **Important:** If your Hostinger database name is DIFFERENT from `resumedb` (e.g. `u844762794_resumedb`), make sure to update the end of the URL above.

4. **Run Migration on Hostinger:**
   After deploying, open the Hostinger Web Terminal and run:
   `npx prisma db push`
   This will create the tables in your live database.

## 3. Troubleshooting
- If you see "Access Denied" on Hostinger, double-check your password and username.
- If you see "Unknown database", make sure the database name in the URL matches exactly what you created in hPanel.