# Deployment Guide: Rental House Management System (RHMS)

This guide provides instructions for deploying the RHMS application to production environments.

## Prerequisite: Environment Variables

Ensure you have all variables from `backend/.env.example` ready. You will need:
- **Database**: PostgreSQL (e.g., Supabase or Render DB).
- **Payment Keys**: Daraja (Safaricom) and Paystack secret keys.
- **Email/SMS**: SMTP credentials and Ujumbe SMS keys.

---

## 🚀 Backend Deployment (Render / Heroku)

1. **Connect Repository**: Link your GitHub repo to Render.
2. **Setup Web Service**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. **Environment Variables**: Add all variables from `.env.example`.
4. **Database Migrations**: Run the migration script once the DB is connected:
   ```bash
   npm run migrate
   ```

---

## 🎨 Frontend Deployment (Vercel / Netlify)

1. **Connect Repository**: Link your GitHub repo to Vercel.
2. **Setup Project**:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. **Environment Variables**:
   - `VITE_API_URL`: Your backend URL (e.g., `https://rhms-api.render.com/api`)
4. **Configuration**: If using Vercel, ensure you have a `vercel.json` for SPA routing:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```

---

## 💳 Payment Gateway Webhooks

To receive automated payment confirmations, you MUST set the following URLs in your gateway dashboards:

- **Daraja Callback**: `https://your-api.com/api/payments/daraja/callback`
- **Paystack Webhook**: `https://your-api.com/api/payments/paystack/webhook`

Ensure your backend's `CLIENT_URL` matches the deployed frontend URL to avoid CORS errors.
