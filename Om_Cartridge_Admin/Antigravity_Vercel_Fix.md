# Antigravity Task — Fix OM Cartridge MERN App for Vercel

## Objective

Inspect the existing OM Cartridge billing/invoice MERN application and make the **minimum safe changes required to deploy it correctly on Vercel**.

Repository:
- GitHub: `OmCartridge/Om_Cartridge`
- Existing project structure: React/Vite frontend in `client/` and Express/MongoDB backend in `server/`

### Critical instruction

**Do NOT rebuild the application or remove existing functionality.**

Preserve all existing:
- Login/authentication
- Dashboard
- Stock management
- Customer management
- Invoice/billing
- Tax / without-tax billing
- Low-stock functionality
- PDF invoice generation
- Email/SMTP functionality
- Existing UI/theme/logo
- MongoDB models and business logic
- Existing API functionality

First inspect the complete codebase, then make only the changes necessary for Vercel compatibility.

---

# 1. Target Architecture

The preferred production architecture is:

```text
                 Vercel
                   |
        +----------+----------+
        |                     |
   React/Vite              API
   client/               api/index.js
        |                     |
        +----------+----------+
                   |
              MongoDB Atlas
```

The goal is one Vercel deployment:

```text
https://your-app.vercel.app
```

Frontend:

```text
/
```

API:

```text
/api/*
```

Examples:

```text
/api/auth/login
/api/products
/api/stock
/api/customers
/api/invoices
/api/dashboard
```

---

# 2. Existing Structure

The current application is approximately:

```text
Om_Cartridge_Admin/
├── client/
│   ├── src/
│   ├── public/
│   ├── dist/
│   ├── node_modules/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── invoices/
│   ├── server.js
│   └── package.json
│
├── package.json
└── .env.example
```

This structure is good for local MERN development but needs Vercel-specific configuration.

---

# 3. Required Production Structure

Aim for:

```text
Om_Cartridge_Admin/
│
├── api/
│   └── index.js
│
├── client/
│   ├── public/
│   ├── src/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── app.js
│   └── server.js
│
├── .gitignore
├── package.json
└── vercel.json
```

Do not unnecessarily move existing folders.

---

# 4. Express Refactor for Vercel

Current backend uses a traditional:

```js
app.listen(PORT, ...)
```

Keep that for local development, but separate the Express application from the listener.

Create:

```text
server/app.js
```

Move the Express setup into `app.js` and export:

```js
module.exports = app;
```

The local development file should remain:

```text
server/server.js
```

and should contain approximately:

```js
const app = require('./app');

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

Do not break any existing middleware, routes, controllers, authentication or error handling while doing this.

---

# 5. Vercel API Entry Point

Create:

```text
api/index.js
```

with:

```js
const app = require('../server/app');

module.exports = app;
```

The API must continue using all existing Express routes.

Do not duplicate route/business logic inside `api/index.js`.

---

# 6. Create Root vercel.json

Create:

```text
vercel.json
```

at the repository root.

Use the appropriate Vercel configuration for:

- Vite frontend located in `client/`
- Serverless Express API located at `/api`
- React SPA routing

Recommended starting configuration:

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Before finalizing, validate this against the actual project and Vercel behavior. Do not blindly overwrite an existing Vercel configuration.

The API rewrite must take precedence over the SPA rewrite.

---

# 7. React/Vite API Configuration

The current frontend uses a localhost API URL similar to:

```env
VITE_API_URL=http://localhost:5001/api
```

This works locally but cannot be used in production.

Change the frontend API configuration so that:

### Local development

```env
VITE_API_URL=http://localhost:5001/api
```

### Production

Use the same Vercel domain:

```text
/api
```

Prefer code such as:

```js
const BASE_URL =
  import.meta.env.VITE_API_URL || '/api';
```

Do not hardcode the production Vercel domain.

All existing Axios/fetch calls must continue working.

---

# 8. React SPA Routing

The application uses React routing / `BrowserRouter`.

Routes such as:

```text
/login
/dashboard
/stock
/customers
/invoices
/settings
```

must work when the user directly refreshes or opens the URL.

Configure Vercel so unknown frontend routes resolve to:

```text
/index.html
```

Do not remove or change existing React routes.

---

# 9. MongoDB

The current local MongoDB configuration uses something similar to:

```text
mongodb://127.0.0.1:27017/om_cartridge
```

This must NOT be used in production.

Production must use a remotely accessible MongoDB database, preferably MongoDB Atlas:

```text
mongodb+srv://...
```

Use an environment variable:

```text
MONGO_URI
```

Never hardcode MongoDB credentials.

Never commit production credentials to GitHub.

Make sure the MongoDB connection code works correctly in a serverless environment and does not create unnecessary connections on every request if connection caching is required.

---

# 10. Environment Variables

Review the complete codebase and identify every required environment variable.

Expected examples include:

```text
MONGO_URI
JWT_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
NODE_ENV
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
BUSINESS_NAME
BUSINESS_GSTIN
```

Only add variables that are actually required by the existing code.

Create/update:

```text
.env.example
```

with variable names but no real secrets.

Production secrets must be entered in:

```text
Vercel → Project → Settings → Environment Variables
```

Do not commit `.env`.

---

# 11. JWT / Authentication

Preserve the existing authentication implementation.

Do not replace authentication unless it is required for Vercel compatibility.

If JWT is already used:

- Keep it.
- Move the secret to `JWT_SECRET`.
- Never expose the secret to frontend code.
- Never use `VITE_` prefix for private secrets.

If cookies are used, ensure cookie/CORS configuration works correctly on the same Vercel domain.

---

# 12. CORS

Because frontend and API should use the same Vercel domain, simplify CORS where safe.

Do not blindly allow every origin in production.

Inspect the existing implementation and configure it to support:

- local development
- production Vercel domain

while preserving authentication behavior.

---

# 13. PDF Invoice Generation — IMPORTANT

The existing application generates invoice PDFs and appears to write them to:

```text
server/invoices/
```

Do NOT assume that files written to the Vercel filesystem are permanent.

Vercel serverless filesystem storage is not suitable as permanent invoice storage.

Therefore:

### Short-term compatibility

Make PDF generation work where technically possible.

### Production-safe architecture

Prefer:

```text
Create invoice
      ↓
Generate PDF
      ↓
Upload/store PDF in persistent cloud storage
      ↓
Save PDF URL in MongoDB
      ↓
Return URL to frontend
```

Possible storage can be selected based on the existing project/dependencies and practicality.

Do not introduce an unnecessary paid service without first checking the existing implementation.

If changing PDF storage is outside the immediate deployment scope, clearly document it as a production limitation rather than silently pretending local filesystem storage is persistent.

---

# 14. Puppeteer / PDF Compatibility

Inspect the existing Puppeteer implementation.

If Puppeteer is used for invoice PDFs, verify Vercel compatibility.

Do not assume a full local Chrome installation exists in Vercel.

If necessary, adapt to a Vercel-compatible Chromium/Puppeteer setup while preserving the invoice PDF appearance.

Do not break:

- invoice layout
- logo
- business details
- customer details
- tax calculations
- totals
- invoice numbering
- print/download functionality

---

# 15. Remove Unnecessary Files from Git

Do NOT commit:

```text
node_modules/
dist/
.env
*.log
```

Also avoid committing generated invoice PDFs:

```text
server/invoices/*.pdf
```

Update `.gitignore` to include at least:

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example

*.log

server/invoices/*.pdf

.vscode/
.idea/
.DS_Store
```

Keep `.env.example`.

---

# 16. Existing dist Folder

The current project contains:

```text
client/dist/
```

Do not use the committed `dist` as the source of truth.

Vercel should generate:

```text
client/dist
```

during:

```bash
npm run build
```

Remove `dist` from Git tracking if it is already committed.

---

# 17. node_modules

The current project may contain:

```text
client/node_modules/
server/node_modules/
```

Do not commit them.

Remove them from Git tracking if necessary.

Vercel installs dependencies automatically.

---

# 18. Root package.json

Inspect the current root `package.json`.

Do not destroy existing scripts.

Add/update scripts only where needed.

A useful structure may include:

```json
{
  "scripts": {
    "dev": "...",
    "build": "cd client && npm install && npm run build",
    "server": "node server/server.js"
  }
}
```

But use the existing project's scripts where possible.

Do not introduce duplicate or conflicting dependency versions.

---

# 19. Client package.json

Inspect:

```text
client/package.json
```

Confirm:

```text
vite
react
react-dom
```

and all existing dependencies are correctly declared.

The production build must succeed with:

```bash
cd client
npm install
npm run build
```

Do not rely on locally installed packages that are missing from `package.json`.

---

# 20. Server package.json

Inspect:

```text
server/package.json
```

Confirm every backend runtime dependency is declared.

Especially verify dependencies used by:

- Express
- MongoDB/Mongoose
- authentication
- JWT
- CORS
- PDF generation
- email/SMTP
- file handling

Do not remove existing dependencies unless they are genuinely unused and safe to remove.

---

# 21. API Health Endpoint

Ensure an endpoint exists:

```text
GET /api/health
```

Example response:

```json
{
  "success": true,
  "message": "OM Cartridge API is running"
}
```

Use this to verify Vercel API deployment.

---

# 22. API Route Preservation

Verify all existing routes still work.

Do not rename routes unless necessary.

Test at minimum:

```text
POST /api/auth/login

GET/POST/PUT/DELETE product/stock routes
GET/POST/PUT/DELETE customer routes
invoice creation routes
dashboard routes
settings routes
```

Use the actual routes found in the codebase rather than assuming these exact names.

---

# 23. Existing Business Requirements Must Remain

Do not break the existing application requirements.

The application should continue supporting:

### Login

Credential-based admin login.

### Dashboard

Dashboard statistics and stock section.

### Low stock

Products below the configured low-stock threshold should be displayed as low stock.

Current business requirement:

```text
stock < 20 = low stock
```

Preserve the existing implementation if already present.

### Customer creation during invoice

When creating an invoice:

1. User enters mobile number.
2. Validate Indian mobile number as exactly 10 digits.
3. Check whether customer already exists.
4. If customer exists, load/use the customer.
5. If customer does not exist, conveniently allow customer creation.
6. Continue invoice creation without unnecessary navigation.

### Invoice tax

Invoice creation must support:

```text
With Tax
Without Tax
```

Calculate totals correctly according to the selected option.

Do not break existing tax calculations.

### Stock

After successful invoice creation, stock should be reduced correctly.

Do not reduce stock if invoice creation fails.

---

# 24. Validation

Preserve/improve validation across the application.

At minimum:

```text
Mobile number = exactly 10 digits
Required customer fields
Required invoice fields
Quantity > 0
Price >= 0
Stock cannot become invalid/negative
Tax values valid
```

Backend validation is required; frontend validation alone is not sufficient.

---

# 25. Deployment Configuration

After making changes, verify Vercel dashboard configuration.

Recommended:

```text
Root Directory: ./
```

because `vercel.json` and `api/` are at the repository root.

Do not set Root Directory to `client` if using the root-level `api/` and `vercel.json` architecture.

Build configuration should follow `vercel.json`.

---

# 26. Vercel Deployment Checklist

Before declaring the task complete:

## Local

Run:

```bash
npm install
```

Then:

```bash
cd client
npm install
npm run build
```

Start backend locally:

```bash
node server/server.js
```

Verify:

```text
http://localhost:5001/api/health
```

Start frontend and verify:

```text
/login
/dashboard
/stock
/customers
/invoices
```

## Production

Deploy to Vercel.

Verify:

```text
/
```

loads the React application.

Verify:

```text
/api/health
```

returns the API response.

Verify direct browser refresh works on:

```text
/dashboard
/stock
/customers
/invoices
```

Verify login.

Verify API calls.

Verify MongoDB connection.

Verify customer creation.

Verify invoice creation.

Verify tax/no-tax calculations.

Verify stock reduction.

Verify low-stock dashboard.

Verify PDF generation/download.

Verify email functionality if configured.

---

# 27. Fix the Current 404

The current error is:

```text
404: NOT_FOUND
Code: NOT_FOUND
ID: bom1::hxcr6-1788277058938-a4ba76f8c08c
```

Treat this as a deployment/routing issue.

After changes, specifically test:

```text
/
```

If `/` returns 404:
- fix Vercel build/output configuration.

If `/` works but `/dashboard` returns 404:
- fix SPA rewrite.

If frontend works but `/api/health` returns 404:
- fix the serverless API entry/configuration.

If API works but frontend API calls fail:
- fix `VITE_API_URL` / `/api` configuration.

If API reaches the backend but MongoDB fails:
- configure `MONGO_URI` in Vercel.

Do not stop after making the homepage load. Test the complete application flow.

---

# 28. Do Not Hardcode Production URLs

Do NOT use:

```js
http://localhost:5001/api
```

as the production API URL.

Do NOT hardcode:

```text
https://some-random-project.vercel.app
```

Prefer:

```js
const BASE_URL =
  import.meta.env.VITE_API_URL || '/api';
```

This makes the application portable.

---

# 29. Do Not Expose Secrets

Never put these in frontend source code:

```text
MONGO_URI
JWT_SECRET
SMTP_PASSWORD
ADMIN_PASSWORD
private API keys
```

Only frontend-safe variables may use:

```text
VITE_
```

prefix.

---

# 30. Important: Inspect Before Editing

Before changing files:

1. Inspect root `package.json`.
2. Inspect `client/package.json`.
3. Inspect `server/package.json`.
4. Inspect `server/server.js`.
5. Inspect database connection code.
6. Inspect API route registration.
7. Inspect frontend API service/axios configuration.
8. Inspect React routing.
9. Inspect PDF generation.
10. Inspect `.gitignore`.
11. Inspect existing environment variable usage.
12. Check whether any existing Vercel configuration exists.

Then make the smallest safe changes.

---

# 31. Final Deliverables

After completing the work, provide:

1. List of files created.
2. List of files modified.
3. List of files removed from Git tracking, if applicable.
4. Exact Vercel dashboard settings.
5. Required environment variables.
6. Local testing commands.
7. Production testing checklist.
8. Any remaining limitations, especially PDF persistent storage.
9. Confirmation that existing business functionality was preserved.

---

# 32. Success Criteria

The task is complete only when:

- [ ] React/Vite builds successfully.
- [ ] Vercel serves the frontend.
- [ ] `/login` works.
- [ ] React SPA routes don't produce Vercel 404s.
- [ ] `/api/health` works.
- [ ] Frontend communicates with `/api`.
- [ ] MongoDB uses a production-accessible URI.
- [ ] Authentication works.
- [ ] Dashboard works.
- [ ] Stock works.
- [ ] Customer management works.
- [ ] Invoice creation works.
- [ ] Mobile validation remains 10 digits.
- [ ] Tax/no-tax invoice calculation works.
- [ ] Stock reduces after successful invoice creation.
- [ ] Low-stock logic remains functional.
- [ ] PDF generation is tested.
- [ ] Email/SMTP is tested if configured.
- [ ] No secrets are committed.
- [ ] `node_modules` is not committed.
- [ ] `dist` is not committed.
- [ ] Generated invoice PDFs are not committed.
- [ ] No existing major feature is removed.

## Final instruction to Antigravity

**Do not just make Vercel show the homepage. Make the existing OM Cartridge application fully functional after deployment.**

If a Vercel-specific limitation prevents a feature from working exactly as it does locally, identify the limitation, implement the safest production-compatible solution, and explain the remaining requirement instead of silently disabling the feature.
