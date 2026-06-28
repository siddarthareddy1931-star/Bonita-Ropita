# 🌸 Jyothi Reddy Boutique

**Jyothi Reddy Boutique** is a sleek, modern Saree Rental, Occasion Styling & Services Management System. Built using **React (Vite)** on the frontend and an **Express (Node.js)** backend, it allows saree boutique owners to manage customer rentals, analyze dashboard statistics with interactive charts, customize system-wide rules, and inspect audit logs.

*   **Production App URL**: [jyothi-reddy-boutique.vercel.app](https://jyothi-reddy-boutique.vercel.app)
*   **Production Database**: Hosted on serverless Neon PostgreSQL.

---

## ✨ Features

-   **Interactive Admin Dashboard**: Instantly track total rentals, active rentals, pending returns, and total boutique revenue. Built using **Chart.js** for visual progress analysis.
-   **Rental Management**: Log, update, search, filter, and delete customer saree rentals with details on occasion, categories, size, and deposits.
-   **System Rules Settings**: Dynamically update standard rental fees, security deposit percentages, cleaning charges, default rental durations, and WhatsApp numbers.
-   **Boutique Audit Logs**: Automated tracking of administrative actions (creating, editing, and deleting rentals) to maintain operational integrity.
-   **Stateless Serverless Execution**: Structured to run on Vercel Serverless Functions.
-   **Automatic Local Fallback**: When database credentials are not supplied, the backend seamlessly writes to a local `data.json` file on disk for a zero-configuration developer experience.

---

## 🛠️ Technology Stack

-   **Frontend**: React 19, Vite, Chart.js, Vanilla CSS
-   **Backend**: Node.js, Express.js
-   **Database**: PostgreSQL (using Neon in production), Local JSON File (fallback)
-   **Deployment**: Vercel (Frontend & Serverless Backend Functions)

---

## 📂 Project Architecture

```text
├── api/
│   └── index.js              # Vercel serverless entrypoint for Express API
├── backend/
│   ├── controllers/          # Request handlers for rentals, rules, audit logs
│   ├── middleware/           # API middlewares
│   ├── models/
│   │   └── db.js             # PostgreSQL Pool controller with local JSON fallback
│   ├── routes/               # Express endpoints
│   ├── services/             # Core business utilities (e.g., audit logging)
│   ├── data.json             # Local backup database (gitignored)
│   └── server.js             # Local Express startup script
├── public/                   # Static browser assets
├── src/                      # Frontend React sources (components, styles, entrypoints)
├── vercel.json               # Vercel routing, rewrite rules, and Vite configuration
└── package.json              # Shared project packages
```

---

## 🚀 Local Development Setup

### 1. Clone the repository
```bash
git clone https://github.com/siddarthareddy1931-star/Jyothi-Reddy-Boutique.git
cd Jyothi-Reddy-Boutique
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run the application
Start both the React development server and local Express backend:
```bash
npm run dev
```
-   **Frontend**: `http://localhost:5173`
-   **Backend API**: `http://localhost:5000`

*No database setup is required for local testing! The backend will automatically write to `backend/data.json` if PostgreSQL credentials are not provided.*

---

## 🛢️ PostgreSQL Database Setup (Optional for Local)

To use a PostgreSQL database locally instead of the JSON fallback, create a `.env` file inside the `backend/` directory:

```env
DATABASE_URL=postgresql://your_user:your_password@localhost:5432/your_db
```
The database adapter will automatically run schema migrations and seed default configuration keys when the server initializes.

---

## 🌐 Production Deployment

The project is configured for **Vercel** with a monorepo setup:

-   **vercel.json**: Handles routing so `/api/*` is handled by the serverless function under `/api/index.js`, while client-side routes are rewrote to `/index.html` for React SPA routing.
-   **Database Environment Variable**: Define `DATABASE_URL` in the Vercel Dashboard project settings pointing to your production PostgreSQL connection string (e.g. Neon or Supabase).
