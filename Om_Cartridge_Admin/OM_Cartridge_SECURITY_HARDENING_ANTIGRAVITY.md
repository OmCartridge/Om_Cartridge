# OM Cartridge — Production Security Hardening Specification

## Objective

Harden the OM Cartridge MERN billing, inventory, customer, invoice, and admin application for production use.

This document is an **implementation specification for Antigravity**. Do not merely describe the fixes. Inspect the existing codebase, implement the fixes, update affected frontend/backend code, and verify the complete application still works.

## Important Rules

1. Preserve all existing business functionality and UI unless a security change requires modification.
2. Do not expose secrets, passwords, JWT secrets, MongoDB URIs, SMTP passwords, API keys, or private configuration in source code.
3. Never use default production credentials.
4. Backend security is authoritative. Never rely on React/UI hiding buttons for authorization.
5. Validate and sanitize all user-controlled input on the backend.
6. Do not weaken security to make a feature work.
7. After changes, run build/tests/lint where available and fix regressions.
8. Do not commit `.env`, production secrets, generated secret files, or credentials.
9. Keep development localhost support separate from production CORS configuration.
10. Do not break invoice PDF generation, stock management, invoice creation, customer creation, tax/no-tax billing, or email functionality.

---

# 1. CRITICAL — Fix CORS

## Current problem

The Express CORS implementation effectively allows every origin because it eventually executes:

```js
return callback(null, true);
```

while also using:

```js
credentials: true
```

This must be removed.

## Required implementation

Create an explicit production allowlist.

Example:

```js
const allowedOrigins = [
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server / same-origin requests without Origin.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
```

Production must use:

```env
FRONTEND_URL=https://om-cartridge.vercel.app
```

Do NOT automatically allow:

```text
*.vercel.app
localhost
127.0.0.1
any arbitrary origin
```

Development origins may be allowed only through an explicit development configuration.

Never add a fallback that permits all origins.

---

# 2. CRITICAL — Protect Invoice PDF Endpoint

## Current problem

The invoice PDF route is publicly accessible:

```js
router.get('/:id/pdf', downloadInvoicePDF);
```

It must not be public because invoices can contain customer and business information.

## Required

Change to:

```js
router.get('/:id/pdf', protect, downloadInvoicePDF);
```

But authentication alone is not sufficient.

The controller must also authorize access to the specific invoice.

Required flow:

```text
Request
  ↓
Authentication
  ↓
Validate invoice ID
  ↓
Load invoice
  ↓
Authorization / ownership check
  ↓
Generate PDF
```

Return:

```text
401 Unauthorized
```

for missing/invalid authentication.

Return:

```text
403 Forbidden
```

when the authenticated user is not authorized.

Do not reveal whether another user's invoice exists when authorization fails.

---

# 3. CRITICAL — Implement Backend Authorization / RBAC

The User model already has roles such as:

```text
admin
user
```

Authentication currently proves that a JWT is valid, but every protected route must also enforce the required permissions.

## Create middleware

Example:

```js
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

module.exports = { requireAdmin };
```

## Admin-only operations

At minimum, protect:

- Create/update/delete products
- Stock modification
- Customer bulk import
- Product bulk import
- Business settings modification
- Bank/payment settings
- SMTP/email settings
- Invoice cancellation/deletion where applicable
- User management
- Any destructive administrative operation

Example:

```js
router.delete('/:id', protect, requireAdmin, deleteProduct);
```

Do not rely on frontend role checks.

---

# 4. CRITICAL — Add Resource Ownership / Tenant Authorization

Current API logic can authenticate a user but does not consistently ensure that the requested resource belongs to that user/business.

For every resource endpoint, decide explicitly whether the application is:

1. Single-business/single-tenant, or
2. Multi-user/multi-tenant.

For the current application, preserve the existing single-business behavior, but design the backend so unauthorized users cannot access unrelated resources.

## Invoice

Do not blindly use:

```js
Invoice.findById(req.params.id)
```

without authorization.

Use an authorization-aware query or ownership check.

For a multi-user model:

```js
Invoice.findOne({
  _id: req.params.id,
  createdBy: req.user._id
});
```

If invoices are shared within one business, use a `businessId`/tenant ownership model instead.

Apply the same principle to:

- Customers
- Products
- Invoices
- Settings
- Stock records
- Any future user-owned resources

Never trust:

```json
{
  "userId": "..."
}
```

from the client as proof of ownership.

The authenticated identity must come from the trusted authentication context.

---

# 5. CRITICAL — Login Rate Limiting

Add `express-rate-limit` or equivalent.

Login must have a strict limiter.

Example:

```js
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', loginLimiter, login);
```

Use appropriate production-safe values.

Also add reasonable rate limiting to sensitive endpoints:

- Login
- Password/account recovery if present
- SMTP/email sending
- Invoice creation
- CSV imports
- Expensive PDF generation
- Other expensive or destructive APIs

Do not rate-limit normal dashboard operations so aggressively that legitimate usage breaks.

---

# 6. CRITICAL — Remove Default Admin Password

Current seed logic has a dangerous fallback similar to:

```js
password: process.env.ADMIN_PASSWORD || 'Admin@123'
```

This must be removed.

Required:

```js
if (!process.env.ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD is required');
}
```

Never use:

```text
Admin@123
admin
password
123456
```

as production fallback credentials.

Update `.env.example` so it documents the variable without exposing a real password.

Example:

```env
ADMIN_PASSWORD=CHANGE_ME_TO_A_STRONG_SECRET
```

Prefer generating the actual password outside source control.

---

# 7. CRITICAL — Audit Secrets and Environment Variables

Search the entire repository for:

```text
password
PASSWORD
secret
SECRET
JWT
MONGO
mongodb://
mongodb+srv://
SMTP
GMAIL
EMAIL
API_KEY
TOKEN
PRIVATE_KEY
```

Check:

- `.env`
- `.env.local`
- `.env.production`
- source files
- seed scripts
- JSON files
- configuration files
- frontend source
- Git history if possible

Never expose server secrets through Vite/React public environment variables.

Anything prefixed with:

```text
VITE_
```

is potentially exposed to the browser.

Therefore NEVER put:

```text
VITE_MONGO_URI
VITE_JWT_SECRET
VITE_SMTP_PASSWORD
VITE_ADMIN_PASSWORD
```

in frontend environment variables.

If a secret has ever been committed to Git, rotate it even after deleting it from the latest commit.

---

# 8. HIGH — Improve JWT Security

Current access token lifetime is approximately:

```text
7 days
```

For an admin billing application, reduce access-token lifetime.

Preferred architecture:

```text
Access token: 15–30 minutes
Refresh token: 7–30 days
```

Use refresh-token rotation/revocation if practical.

Do not store long-lived sensitive tokens in insecure browser storage when a secure HttpOnly cookie architecture is feasible.

If the existing application uses localStorage and changing the architecture would be disruptive, implement the strongest practical migration without breaking login.

JWT configuration must include:

- Strong random JWT secret
- Explicit expiration
- Explicit algorithm
- Issuer/audience where appropriate
- No algorithm confusion
- Proper token validation

Never decode JWT and treat decoded payload as authenticated.

Always verify the signature.

---

# 9. HIGH — Implement Real Logout / Token Revocation

Current logout only returns a success message and does not invalidate an already-issued JWT.

Implement a proper session/token strategy.

Preferred:

```text
Short-lived access token
+
Refresh token
+
Refresh-token revocation on logout
+
Refresh-token rotation
```

At minimum, ensure the browser removes its access credentials on logout.

If server-side revocation is implemented, store only securely hashed refresh-token identifiers rather than raw long-lived tokens.

---

# 10. HIGH — Add Helmet / Security Headers

Install/use:

```text
helmet
```

Example:

```js
const helmet = require('helmet');

app.use(helmet());
```

Configure CSP carefully so the existing React/Vercel application still works.

Ensure production responses include appropriate:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Frame protections
- HSTS when HTTPS-only production is confirmed
- Permissions-Policy where appropriate

Do not blindly disable security headers to fix frontend issues.

---

# 11. HIGH — Reduce JSON Body Limits

Current JSON body limit is around:

```text
10mb
```

This is unnecessarily large for normal billing/customer/product requests.

Use a smaller global limit such as:

```js
app.use(express.json({ limit: '1mb' }));
```

If CSV/file import requires larger input, give that endpoint its own strict size limit and row count limit.

Do not globally allow huge request bodies.

---

# 12. HIGH — Secure CSV Imports

For:

```text
POST /products/import-csv
POST /customers/import-csv
```

implement:

- Authentication
- Admin authorization
- Maximum request size
- Maximum row count
- Maximum field length
- Required-column validation
- Type validation
- Phone number validation
- Email validation
- Numeric validation
- Duplicate handling
- Safe error handling
- Rate limiting
- Processing timeout/limits where appropriate

Never allow CSV import to become an unrestricted database write endpoint.

---

# 13. HIGH — Prevent NoSQL Injection

Never directly pass untrusted request objects into MongoDB queries or update operators.

Avoid patterns like:

```js
Model.find(req.query);
Model.updateOne({ _id: req.params.id }, req.body);
```

without validation/sanitization.

Use strict schemas and explicitly construct queries.

For IDs:

```js
mongoose.isValidObjectId(id)
```

or equivalent validation.

Reject malformed IDs with:

```text
400 Bad Request
```

Do not accept arbitrary MongoDB operators from users such as:

```text
$gt
$ne
$regex
$where
```

unless explicitly required and safely controlled.

---

# 14. HIGH — Validate All Backend Inputs

Use a validation library such as:

```text
zod
joi
express-validator
```

or an existing project validation approach.

Validate:

### Mobile number

Indian mobile number must be exactly 10 digits:

```regex
^[6-9][0-9]{9}$
```

Do not trust frontend validation alone.

### Product

Validate:

- Name
- SKU
- Price
- GST/tax rate
- Quantity
- Description length
- IDs

### Customer

Validate:

- Name
- 10-digit mobile
- Email
- GSTIN if supplied
- Address length
- Pincode if used

### Invoice

Validate:

- Customer
- Items
- Product IDs
- Quantities
- Prices
- Tax mode
- Discounts
- Payment information

Reject negative/NaN/infinite quantities and prices.

---

# 15. HIGH — Never Trust Frontend Invoice Totals

Keep the existing backend calculation model.

The backend must calculate:

```text
subtotal
discount
GST/tax
rounding
grand total
```

from validated product/item data.

Do not trust:

```json
{
  "total": 999999
}
```

sent by the browser.

The server's calculated total must be authoritative.

---

# 16. HIGH — Make Stock Deduction Atomic

Current invoice creation uses manual rollback instead of a proper database transaction.

This can cause race conditions.

Example:

```text
Stock = 5

Invoice A requests 5
Invoice B requests 5

Both read stock = 5
Both succeed
```

Implement MongoDB transactions where the deployment/database configuration supports them.

Use atomic conditional updates such as:

```js
Product.findOneAndUpdate(
  {
    _id: productId,
    stock: { $gte: quantity }
  },
  {
    $inc: { stock: -quantity }
  },
  { new: true }
);
```

If the update returns no document:

```text
409 Conflict / insufficient stock
```

Do not allow stock to become negative.

For invoice creation + stock deduction, use a transaction where possible.

---

# 17. HIGH — Make Invoice Number Generation Atomic

Current logic appears to:

```text
find latest invoice
+
increment number
```

This can collide under concurrent requests.

Implement an atomic counter/sequence collection.

Example conceptual structure:

```text
InvoiceCounter
{
  _id: "2026-27",
  sequence: 123
}
```

Use:

```js
findOneAndUpdate(
  { _id: financialYear },
  { $inc: { sequence: 1 } },
  { upsert: true, new: true }
);
```

Create a unique index for the final invoice number.

The database must enforce uniqueness.

---

# 18. HIGH — Secure SMTP Configuration

SMTP credentials must remain server-side only.

Recommended Gmail setup:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-business-email
SMTP_PASSWORD=GOOGLE_APP_PASSWORD
```

Do NOT use a normal Gmail password.

If `From Email` differs from the authenticated SMTP account, it must be a verified Gmail/Google Workspace "Send mail as" address or domain alias.

Never return SMTP password through API responses.

Continue masking it as:

```text
***
```

Never log it.

Never send it to React.

Never place it in VITE environment variables.

---

# 19. HIGH — Secure Email Sending

Protect email/invoice-send endpoints with:

- Authentication
- Authorization
- Rate limiting
- Recipient validation
- Subject/header sanitization
- Controlled attachment generation
- Size limits
- Error handling

Never allow arbitrary SMTP host/user/password values from an untrusted frontend.

If SMTP settings are editable from the admin panel, require admin authorization.

---

# 20. HIGH — Secure Error Handling

Production API responses must not expose:

- MongoDB connection strings
- Stack traces
- File system paths
- JWT secrets
- SMTP configuration
- Internal database errors
- Sensitive query details

Use a central error handler.

Development may log stack traces.

Production should return safe messages:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Log detailed errors server-side only.

---

# 21. MEDIUM — Secure MongoDB

Use:

- Strong MongoDB credentials
- Network restrictions where possible
- TLS
- Least-privilege database user
- Separate development/production databases
- Backups
- Monitoring
- No public database access

Never expose MongoDB directly to the browser.

All database access must happen through the backend.

---

# 22. MEDIUM — Secure Cookies if Cookies Are Used

If authentication is moved to cookies, use:

```text
HttpOnly
Secure
SameSite=Lax or Strict
```

Choose SameSite according to the actual deployment architecture.

Do not store sensitive session identifiers in readable JavaScript cookies.

---

# 23. MEDIUM — Dependency Security

Run:

```bash
npm audit
```

for both frontend and backend.

Also inspect:

```bash
npm outdated
```

Do not blindly upgrade major versions.

Prioritize:

- Critical
- High
- Known exploited vulnerabilities

Remove unused dependencies.

Do not install unnecessary security packages that are not configured.

---

# 24. MEDIUM — Protect Sensitive Settings

Business settings can contain:

- Bank account
- IFSC
- UPI
- GST information
- SMTP configuration
- Business address
- Contact information

Read access should require authentication.

Write access should require admin authorization.

Never expose secrets in a public API.

Consider encrypting highly sensitive credentials at rest if the system stores them in MongoDB.

---

# 25. MEDIUM — Add Audit Logging

For a billing/inventory system, record important actions:

```text
LOGIN_SUCCESS
LOGIN_FAILURE
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_DELETED
STOCK_ADJUSTED
CUSTOMER_CREATED
CUSTOMER_UPDATED
INVOICE_CREATED
INVOICE_CANCELLED
INVOICE_DELETED
SETTINGS_UPDATED
SMTP_SETTINGS_UPDATED
```

Audit record should contain:

```text
userId
action
resourceType
resourceId
timestamp
IP where appropriate
user-agent where appropriate
```

Do not log passwords, SMTP passwords, JWTs, or sensitive tokens.

---

# 26. MEDIUM — Prevent Duplicate / Replay Operations

Invoice creation and stock deduction should be safe against accidental double submission.

Consider an idempotency key for invoice creation:

```text
Idempotency-Key: <unique-client-generated-value>
```

Store and enforce it for a limited period if practical.

This prevents:

```text
Double click
+
Network retry
=
Two invoices
+
Double stock deduction
```

---

# 27. MEDIUM — Frontend Security

Do not render user-controlled strings as raw HTML.

Avoid:

```js
dangerouslySetInnerHTML
```

unless absolutely required and sanitized.

Never put secrets in React source.

Do not assume frontend routes protect backend APIs.

Frontend authorization is only UX.

Backend authorization is security.

---

# 28. MEDIUM — API Security Checklist

Every API endpoint must be classified:

```text
PUBLIC
AUTHENTICATED
ADMIN
```

Create a table/documentation internally.

Example:

```text
POST /api/auth/login              PUBLIC + rate limit
POST /api/auth/logout             AUTHENTICATED
GET  /api/dashboard               AUTHENTICATED
GET  /api/products                AUTHENTICATED
POST /api/products                ADMIN
PUT  /api/products/:id            ADMIN
DELETE /api/products/:id          ADMIN
GET  /api/invoices                AUTHENTICATED + ownership
POST /api/invoices                AUTHENTICATED
GET  /api/invoices/:id/pdf        AUTHENTICATED + ownership
POST /api/products/import-csv     ADMIN
POST /api/customers/import-csv   ADMIN
PUT  /api/settings                ADMIN
```

Adjust based on the existing application's intended behavior.

---

# 29. Production CORS / Environment Configuration

Create separate configuration for:

### Development

```env
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Production

```env
NODE_ENV=production
FRONTEND_URL=https://om-cartridge.vercel.app
```

Never use:

```js
origin: true
```

or:

```js
return callback(null, true)
```

as a production fallback.

---

# 30. Vercel Security

Review the Vercel deployment.

Verify:

- Environment variables are configured only in Vercel
- Secrets are not in GitHub
- Production variables are separate from preview/development where appropriate
- API routes are not unintentionally exposed
- No debug mode in production
- No source maps containing sensitive server code
- HTTPS is enforced
- Correct frontend URL is used
- Backend URL is not hardcoded incorrectly

Never expose backend-only environment variables through frontend build configuration.

---

# 31. GitHub Security

The repository is currently public.

For a real business application, consider making it private.

Regardless of repository visibility:

- Remove secrets from current source
- Rotate any secret ever committed
- Enable secret scanning where available
- Enable Dependabot/security alerts where appropriate
- Review Git history for credentials
- Never commit `.env`
- Keep `.env.example` fake/non-sensitive

Recommended `.gitignore`:

```gitignore
.env
.env.*
!.env.example
node_modules/
dist/
build/
coverage/
*.log
```

Make sure `.env.example` does not contain real values.

---

# 32. Security Testing Required After Implementation

Do not consider the task complete until these tests pass.

## Authentication

- Login with correct credentials succeeds.
- Incorrect password fails.
- Missing password fails.
- Missing email fails.
- Repeated login attempts are rate limited.
- Invalid JWT returns 401.
- Expired JWT returns 401.
- Tampered JWT returns 401.
- Logout actually removes/revokes usable authentication.

## Authorization

- Normal user cannot access admin operations.
- Normal user cannot modify settings.
- Normal user cannot delete products.
- Normal user cannot change stock.
- Unauthorized invoice access returns 403/404 safely.
- PDF cannot be downloaded without authentication.

## CORS

Test requests from:

```text
https://om-cartridge.vercel.app
```

and an unauthorized origin.

Authorized origin should work.

Unauthorized origin must fail.

Never allow arbitrary origins.

## Input validation

Test:

```text
empty fields
invalid ObjectId
negative quantity
negative price
NaN
Infinity
very long strings
malformed email
invalid mobile number
malformed GSTIN
unexpected MongoDB operators
```

## Invoice

Test:

```text
double-click invoice creation
two simultaneous invoices
insufficient stock
zero stock
negative stock
tax invoice
non-tax invoice
large quantities
invalid product IDs
```

## PDF

Test:

```text
No JWT → reject
Invalid JWT → reject
Valid JWT + unauthorized invoice → reject
Valid authorized JWT → PDF
```

## SMTP

Verify:

```text
SMTP password never appears in API response
SMTP password never appears in logs
SMTP password never appears in frontend bundle
Email sends successfully
Invalid SMTP configuration fails safely
```

---

# 33. Automated Security Tests

Add backend tests for:

```text
auth.test.js
authorization.test.js
cors.test.js
invoice-security.test.js
stock-concurrency.test.js
input-validation.test.js
```

At minimum, test:

```js
expect(response.status).toBe(401);
expect(response.status).toBe(403);
```

for unauthorized access.

Add regression tests so these vulnerabilities cannot return later.

---

# 34. Security Headers Verification

After deployment, verify production responses contain appropriate security headers.

Check at least:

```text
Content-Security-Policy
Strict-Transport-Security
X-Content-Type-Options
Referrer-Policy
X-Frame-Options / frame-ancestors
Permissions-Policy
```

Do not enable a CSP that breaks the application without understanding and fixing the required sources.

---

# 35. Final Acceptance Criteria

The security hardening is complete only when:

- [ ] CORS no longer allows arbitrary origins
- [ ] Invoice PDFs require authentication
- [ ] Invoice PDFs enforce authorization/ownership
- [ ] Admin-only operations enforce backend role checks
- [ ] Login is rate limited
- [ ] Default `Admin@123` fallback is removed
- [ ] No secrets exist in source code
- [ ] No secrets exist in frontend bundle
- [ ] JWT configuration is hardened
- [ ] Logout/session revocation is improved
- [ ] Helmet/security headers are configured
- [ ] JSON body size is reduced
- [ ] CSV imports are restricted
- [ ] All API inputs are validated
- [ ] NoSQL injection vectors are addressed
- [ ] Invoice totals are calculated server-side
- [ ] Stock updates are atomic/transaction-safe
- [ ] Invoice numbering is atomic and unique
- [ ] SMTP credentials are protected
- [ ] Sensitive settings require admin authorization
- [ ] Production errors don't leak internals
- [ ] Dependencies are audited
- [ ] Audit logging is implemented for critical actions
- [ ] Duplicate invoice submission is handled
- [ ] Security regression tests pass
- [ ] Production build passes
- [ ] Existing billing functionality still works

---

# 36. Final Security Target

Target:

```text
Authentication       ≥ 9/10
Authorization        ≥ 9/10
CORS                 ≥ 9/10
Invoice privacy      ≥ 9/10
Input validation     ≥ 9/10
API security         ≥ 9/10
Secret management    ≥ 9/10
Data integrity       ≥ 9/10
Production config    ≥ 9/10
Overall              ≥ 9/10
```

Do not claim a 9/10 security score merely because the checklist is implemented. Run the tests and inspect the actual resulting code.

---

# Antigravity Execution Instruction

Act as a senior application security engineer and senior MERN developer.

First inspect the entire existing OM Cartridge repository and understand its current architecture.

Then implement the security hardening above.

For every change:

1. Inspect existing implementation.
2. Make the smallest safe architectural change.
3. Preserve existing functionality.
4. Add validation.
5. Add authorization.
6. Add tests.
7. Run the relevant test/build commands.
8. Fix any regressions.
9. Review the final diff for accidentally exposed secrets.
10. Confirm production environment variables are required and safe.

Do NOT simply generate a report.

**Actually modify the codebase.**

At the end, provide:

```text
SECURITY HARDENING COMPLETE

Critical issues fixed: X
High issues fixed: X
Medium issues fixed: X
Tests added: X
Tests passed: X
Build status: PASS/FAIL
Remaining risks: <list>
```

Do not remove working business functionality unless it is fundamentally insecure. If a security requirement conflicts with existing behavior, implement a secure alternative that preserves the user experience.
