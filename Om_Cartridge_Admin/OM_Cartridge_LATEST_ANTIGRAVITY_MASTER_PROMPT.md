# OM CARTRIDGE — FUNCTIONALITY + UI UPDATE PROMPT

## IMPORTANT

You are modifying the **existing Om Cartridge application**.

- DO NOT rebuild the application from scratch.
- DO NOT remove existing working functionality.
- DO NOT change the existing database structure unless absolutely required.
- DO NOT introduce unnecessary libraries.
- First inspect the complete codebase, understand the current architecture, APIs, database models, invoice generation flow, PDF generation, email flow, and responsive CSS.
- Implement the changes below cleanly and production-ready.

---

# 1. CHANGE CUSTOMER INPUT IN INVOICE CREATION

## CURRENT BEHAVIOR

While creating an invoice, the first customer identification input currently asks for:

- Mobile Number

## NEW BEHAVIOR

Change the primary customer identification input to:

- Customer Name

### Requirements

1. Replace the initial Mobile Number input with `Customer Name`.
2. When the user enters a customer name:
   - Search/check whether the customer already exists.
   - Show matching existing customers.
   - Allow the user to select an existing customer.
3. If an existing customer is selected:
   - Automatically populate all available customer details.
   - Do not force the user to re-enter existing information.
4. If the customer does not exist:
   - Allow creating a new customer while creating the invoice.
5. Customer details can include:
   - Name
   - Mobile Number
   - Address
   - Email
   - Any other customer fields already supported.
6. Mobile number must still have:
   - Exactly 10 digits validation.
   - Numeric input only.
   - Appropriate validation message.
7. Do not remove mobile number from customer records.
8. Prevent duplicate customers as much as reasonably possible.
9. Make customer search user-friendly:
   - Search while typing.
   - Debounce API requests if applicable.
   - Show loading state.
   - Show "No customer found".
   - Show "Create new customer" when no match exists.

---

# 2. REPLACE "WITH TAX / WITHOUT TAX" WITH BUSINESS TYPE

## CURRENT BEHAVIOR

Invoice creation currently has:

- With Tax
- Without Tax

## NEW BEHAVIOR

Replace these options with:

- **Om Cartridge**
- **Om Enterprise**

### Business Logic

#### OM CARTRIDGE

If the user selects:

`Om Cartridge`

Then:

- Invoice = WITHOUT TAX
- GST/tax calculation must NOT be applied.
- Existing "Without Tax" behavior should be used internally.

#### OM ENTERPRISE

If the user selects:

`Om Enterprise`

Then:

- Invoice = WITH TAX
- GST/tax calculation must be applied.
- Existing "With Tax" behavior should be used internally.

### IMPORTANT

Do not simply rename the buttons visually.

The selected business type must control the complete invoice/business logic.

---

# 2.1 BUSINESS NAME IN INVOICE

The selected business must appear correctly everywhere.

If selected:

`Om Cartridge`

Display:

`Om Cartridge`

If selected:

`Om Enterprise`

Display:

`Om Enterprise`

This must be reflected consistently in:

- Invoice preview
- Invoice PDF
- Downloaded invoice
- Printed invoice
- Email invoice
- Invoice details
- Invoice history
- Invoice list/details where applicable
- Any invoice-related UI
- Any generated documents
- Relevant backend invoice data

---

# 2.2 LOGO + BUSINESS NAME

There is already an Om Cartridge logo/theme in the application.

Keep the existing logo.

The business name should appear beside/below the logo according to the existing invoice design.

Use dynamically:

- `Om Cartridge`
- OR `Om Enterprise`

depending on the selected business.

Do NOT hardcode Om Cartridge everywhere.

---

# 2.3 DATABASE / BACKEND

Store the business type/business identity with every invoice.

Recommended internal representation:

```text
businessType:
  OM_CARTRIDGE
  OM_ENTERPRISE
```

or an equivalent clean enum already compatible with the project architecture.

Do not store only a UI label if a proper enum/value can be used.

The backend must derive tax behavior from the business type.

Conceptually:

```text
OM_CARTRIDGE
    -> taxEnabled = false
    -> businessName = "Om Cartridge"

OM_ENTERPRISE
    -> taxEnabled = true
    -> businessName = "Om Enterprise"
```

Do not trust the frontend alone for tax calculation.

The backend must validate/recalculate invoice totals according to the selected business type.

---

# 3. PRODUCT SEARCH WHILE CREATING INVOICE

## CURRENT PROBLEM

The product selection UI currently requires manually browsing/selecting products.

## NEW FUNCTIONALITY

Implement proper product search functionality inside invoice creation.

### Requirements

When adding an invoice item:

- Provide a product search input.
- User can search by:
  - Product name
  - SKU/product code if available
  - Other existing product identifiers if available

### Search Behavior

Example:

User types:

`HP`

Show matching products such as:

```text
HP 678 Cartridge
HP 680 Cartridge
HP LaserJet Cartridge
```

Search must:

- Work instantly/while typing.
- Be case-insensitive.
- Support partial matches.
- Show loading state where applicable.
- Show "No products found".
- Allow selecting a product easily.

After selecting a product, automatically populate existing relevant information such as:

- Product name
- SKU
- Price
- Available stock
- Tax/GST information
- Any other existing product fields

---

# 3.1 STOCK VALIDATION

Do not break existing stock management.

When selecting products:

- Show available stock.
- Prevent selling more quantity than available stock.
- Show a clear validation message.

After invoice creation:

- Stock must continue to decrease exactly as it currently does.
- Do not introduce duplicate stock deduction.

---

# 4. ONE SINGLE INVOICE FORMAT EVERYWHERE

## CURRENT PROBLEM

The invoice looks different in:

1. Viewing
2. Downloading
3. Printing
4. Mailing/email

This must be fixed.

## REQUIRED BEHAVIOR

The **invoice VIEW is the single source of truth**.

Create ONE reusable invoice component/template.

For example:

```text
InvoiceTemplate
```

or an equivalent architecture appropriate for the existing project.

The SAME invoice layout/design/data structure must be used for:

### A. Invoice Viewing

The existing invoice viewing format becomes the canonical design.

### B. PDF Download

PDF must visually match the invoice viewing format.

### C. Printing

Print output must visually match the invoice viewing format.

### D. Email

The invoice attached/sent through email must visually match the invoice viewing format.

---

# 4.1 SINGLE SOURCE OF TRUTH

DO NOT maintain separate invoice designs for:

- HTML view
- PDF
- Print
- Email

Instead:

```text
Invoice Data
      ↓
Invoice Template
      ↓
 ┌────┼─────┬─────────┐
 ↓    ↓     ↓         ↓
View  PDF  Print     Email
```

All invoice outputs must use the same invoice data and same visual structure.

---

# 4.2 PIXEL / STRUCTURE CONSISTENCY

Ensure consistency for:

- Logo
- Business name
- Invoice number
- Invoice date
- Customer information
- Product table
- Quantity
- Rate
- Tax
- Subtotal
- Total
- Payment information
- Footer
- Terms
- Signature area
- Spacing
- Typography
- Borders
- Alignment
- Page margins

The PDF and print version should not randomly change spacing or alignment.

---

# 4.3 PRINTING

Create a proper print stylesheet.

Requirements:

- A4-compatible layout.
- Correct margins.
- No unnecessary UI buttons in print.
- No dashboard/sidebar/header navigation in print.
- Invoice should print cleanly.
- Avoid table rows being cut incorrectly between pages.
- Header/footer should remain professional.

---

# 4.4 PDF

Downloaded/generated PDFs must use the same invoice design.

Check:

- A4 sizing
- Logo resolution
- Fonts
- Table alignment
- Tax values
- Business name
- Customer information
- Page breaks
- Total section
- Footer

Do not create a second unrelated invoice design for PDF generation.

---

# 4.5 EMAIL

When sending an invoice by email:

- Use the same invoice data.
- Use the same invoice template/design.
- If sending a PDF attachment, that PDF must match the viewing invoice.
- Email invoice content should correctly identify:
  - Om Cartridge
  - OR
  - Om Enterprise

depending on the invoice.

---

# 5. FULLY RESPONSIVE / DYNAMIC UI

## CURRENT PROBLEM

The UI needs to work properly across:

- Mobile phones
- Tablets
- Laptops
- Desktop screens

Do NOT simply make everything smaller.

Implement proper responsive design.

---

# 5.1 RESPONSIVE BREAKPOINTS

Use sensible responsive breakpoints.

At minimum test:

### Mobile

```text
320px
375px
390px
414px
```

### Tablet

```text
768px
820px
1024px
```

### Laptop/Desktop

```text
1280px
1366px
1440px
1920px
```

Do not hardcode only these resolutions.

The UI should adapt fluidly between them.

---

# 5.2 MOBILE UI

On mobile:

- Sidebar should become a mobile menu/drawer.
- Tables should become horizontally scrollable or transform into responsive cards where appropriate.
- Forms should use one-column layouts.
- Buttons should remain easy to tap.
- Inputs should fit the viewport.
- Modals should fit the screen.
- Invoice creation should be comfortable on mobile.
- Product search should be easy to use.
- Customer search should be easy to use.
- No horizontal page overflow.

---

# 5.3 TABLET UI

On tablets:

- Use an optimized 2-column/appropriate grid where useful.
- Sidebar/navigation should adapt.
- Invoice creation should make good use of available width.
- Tables should remain readable.
- Avoid excessive empty space.

---

# 5.4 LAPTOP / DESKTOP

On larger screens:

- Maintain the existing professional dashboard appearance.
- Use appropriate max-width containers.
- Do not stretch content unnecessarily across the entire screen.
- Maintain consistent spacing.
- Invoice preview should remain centered and professional.

---

# 5.5 RESPONSIVE DASHBOARD

Check every existing page:

- Login
- Dashboard
- Stock
- Product management
- Customer management
- Invoice creation
- Invoice list/history
- Invoice view
- Invoice details
- Any settings page
- Any modal/dialog
- Any navigation component

Everything must be responsive.

---

# 6. UI/UX QUALITY

Do not make the UI look like a quick developer implementation.

Maintain a professional business billing application style.

Use:

- Consistent spacing
- Consistent typography
- Proper form labels
- Clear error states
- Loading states
- Empty states
- Hover states
- Focus states
- Disabled states
- Proper button hierarchy
- Responsive modal sizes

Avoid:

- Overflowing text
- Broken tables
- Tiny buttons on mobile
- Excessive animations
- Random colors
- Inconsistent border radius
- Inconsistent spacing
- Duplicate components

Keep the existing Om Cartridge branding/theme.

---

# 7. VALIDATION

Ensure all existing validations continue working.

## Mobile Number

```text
Exactly 10 digits
Numeric only
```

## Customer Name

```text
Required
Trim whitespace
Do not allow invalid empty values
```

## Product

```text
Required
Must be an existing valid product
```

## Quantity

```text
Positive number
Cannot exceed available stock
```

## Business Type

```text
Required
Must be either:

OM_CARTRIDGE
OM_ENTERPRISE
```

---

# 8. BACKEND SECURITY / DATA INTEGRITY

Do not rely on frontend calculations.

Backend must validate:

- Customer
- Product
- Quantity
- Product price
- Stock availability
- Business type
- Tax applicability
- Invoice totals

The backend should calculate the final invoice amount independently.

Do not allow the frontend to submit arbitrary totals and blindly save them.

---

# 9. EXISTING FUNCTIONALITY MUST NOT BREAK

Before making changes, inspect the existing application and identify:

- Frontend architecture
- Backend architecture
- Database
- API routes
- Models
- Invoice creation
- Invoice calculation
- Stock deduction
- Customer creation
- PDF generation
- Email sending
- Printing
- Authentication
- Deployment configuration

Preserve all currently working functionality.

Do not remove existing APIs unless they are genuinely obsolete and safely replaced.

If an existing API can be extended instead of replaced, prefer extending it.

---

# 10. CODE QUALITY

Follow the existing project's coding conventions.

Use:

- Reusable components
- Reusable invoice template
- Reusable customer search
- Reusable product search
- Centralized business-type configuration
- Clean API handling
- Proper error handling
- Proper loading states

Avoid:

- Duplicate logic
- Copy-pasted invoice HTML
- Hardcoded business names
- Hardcoded tax values in multiple files
- Hardcoded responsive dimensions
- Unnecessary dependencies
- Temporary console logs
- Dead code

---

# 11. IMPORTANT BUSINESS TYPE CONFIGURATION

Create a centralized configuration where possible.

Conceptually:

```js
const BUSINESS_TYPES = {
  OM_CARTRIDGE: {
    name: "Om Cartridge",
    taxEnabled: false
  },

  OM_ENTERPRISE: {
    name: "Om Enterprise",
    taxEnabled: true
  }
};
```

Adapt this to the project's existing architecture.

The important requirement is:

```text
Business Type
      ↓
Business Name
      ↓
Tax Mode
      ↓
Invoice Calculation
      ↓
Invoice Display
      ↓
PDF
      ↓
Print
      ↓
Email
```

Everything must remain synchronized.

---

# 12. TESTING REQUIREMENTS

After implementation, test the complete flow.

## CUSTOMER TEST

### Existing Customer

```text
Create Invoice
→ Enter customer name
→ Existing customer appears
→ Select customer
→ Details populated
```

### New Customer

```text
Create Invoice
→ Enter customer name
→ No customer found
→ Create customer
→ Enter details
→ Continue invoice
```

---

# 13. BUSINESS TYPE TEST

## Om Cartridge

```text
Select Om Cartridge
→ No tax
→ Correct totals
→ Invoice says "Om Cartridge"
→ PDF says "Om Cartridge"
→ Print says "Om Cartridge"
→ Email says "Om Cartridge"
```

## Om Enterprise

```text
Select Om Enterprise
→ Tax applied
→ Correct totals
→ Invoice says "Om Enterprise"
→ PDF says "Om Enterprise"
→ Print says "Om Enterprise"
→ Email says "Om Enterprise"
```

---

# 14. PRODUCT SEARCH TEST

Test:

```text
Search exact product
Search partial product
Search uppercase
Search lowercase
Search SKU
No results
Select product
Change quantity
Check stock
Create invoice
Verify stock deduction
```

---

# 15. INVOICE CONSISTENCY TEST

Take one generated invoice and compare:

```text
VIEW
PDF
PRINT
EMAIL
```

They must have the same:

- Layout
- Logo
- Business name
- Customer details
- Products
- Amounts
- Tax
- Total
- Footer
- Overall visual structure

The viewing invoice is the reference.

---

# 16. RESPONSIVE TEST

Test the application at:

```text
320px
375px
390px
414px
768px
820px
1024px
1280px
1366px
1440px
1920px
```

Check every major page.

There must be:

- No horizontal overflow
- No clipped buttons
- No broken forms
- No overlapping elements
- No broken modal
- No unusable tables
- No broken invoice preview
- No navigation issues

---

# 17. FINAL VERIFICATION

After implementation:

1. Run frontend.
2. Run backend.
3. Verify database connection.
4. Test login.
5. Test customer search.
6. Test customer creation.
7. Test product search.
8. Test invoice creation.
9. Test Om Cartridge invoice.
10. Test Om Enterprise invoice.
11. Verify tax calculation.
12. Verify stock deduction.
13. Verify invoice viewing.
14. Verify PDF download.
15. Verify printing.
16. Verify email invoice.
17. Verify invoice history.
18. Test mobile UI.
19. Test tablet UI.
20. Test laptop/desktop UI.
21. Check browser console for errors.
22. Check backend logs for errors.
23. Remove unnecessary debug logs.
24. Verify no existing functionality has been broken.

---

# 18. FINAL REPORT

After implementation, provide a concise implementation report containing:

### Changed

- Customer name-based invoice lookup
- Om Cartridge / Om Enterprise business selection
- Tax behavior
- Product search
- Unified invoice rendering
- PDF/print/email consistency
- Responsive UI

### Files Changed

List the important files modified.

### APIs Changed

List modified/added APIs.

### Database Changes

Mention any schema/model changes.

### Testing

List the flows tested and whether they passed.

### Remaining Issues

Only mention genuine unresolved issues.

Do not claim success if something is still broken.

---

# FINAL INSTRUCTION

**Inspect first → implement carefully → test every affected flow → fix errors → retest → then report completion.**

Do not stop at "implementation completed" without actually validating the application.

# 19. PRODUCTION SECURITY HARDENING — LATEST AUDIT

## Objective

Apply the latest security audit findings to the existing OM Cartridge application. Do not rebuild the application. Inspect the current implementation first and preserve all working functionality.

The latest review found substantial security improvements already present, including strict CORS, Helmet, rate limiting, RBAC, protected invoice PDF routes, stronger JWT verification, removal of the default admin-password fallback, atomic invoice numbering, guarded stock decrement, and safer production errors.

The remaining requirements below must now be implemented and verified.

## 19.1 CRITICAL — Invoice ownership / authorization

Authentication alone is not enough. Every invoice operation must verify that the authenticated user/business is authorized to access that invoice.

Do not rely only on:

```js
Invoice.findById(req.params.id)
```

Use an ownership-aware query where appropriate:

```js
const invoice = await Invoice.findOne({
  _id: req.params.id,
  createdBy: req.user._id
}).lean();
```

If the application is intentionally single-business, implement an explicit business/tenant authorization model instead of silently assuming all authenticated users can access every resource.

Apply authorization to:

- Invoice view
- Invoice PDF
- Invoice email
- Invoice details
- Invoice cancellation
- Invoice history
- Any future invoice operation

Do not reveal whether an unauthorized invoice exists.

## 19.2 HIGH — Remove public/static invoice filesystem serving

The current architecture should generate invoice PDFs in memory for Vercel/serverless deployment.

Remove or disable production static serving such as:

```js
app.use('/invoices', express.static(...));
```

Do not expose `server/invoices/` as a public static directory.

Preferred:

```text
Invoice data
    ↓
MongoDB

PDF
    ↓
Generate in memory
    ↓
Return directly / email
```

If persistent PDF storage is required later, use durable object storage. Never treat a Vercel function filesystem as permanent storage.

## 19.3 HIGH — Make invoice creation transaction-safe

The existing atomic stock decrement is good, but invoice creation still involves multiple database operations.

Where MongoDB transactions are supported, use one transaction for:

```text
Generate invoice number atomically
        ↓
Validate products
        ↓
Atomically decrement stock
        ↓
Create invoice
        ↓
Create stock movements
        ↓
Commit
```

If anything fails, roll back all operations.

Do not rely only on manual rollback.

If transactions are unavailable in the deployment, implement the strongest atomic/idempotent alternative and document the limitation.

## 19.4 HIGH — Make invoice cancellation transaction-safe

Cancellation must atomically:

```text
Validate invoice
↓
Check current status
↓
Restore stock
↓
Create stock movements
↓
Mark invoice CANCELLED
↓
Commit
```

Prevent partial cancellation where stock and invoice state disagree.

## 19.5 HIGH — Protect invoice email endpoint

The invoice email endpoint must have:

- Authentication
- Invoice ownership/authorization
- Appropriate role authorization
- Dedicated email rate limiting
- Recipient validation
- Safe error handling

Prefer:

```js
router.post(
  '/:id/email',
  protect,
  requireAdmin,
  emailLimiter,
  emailInvoice
);
```

Adapt this if trusted staff are intentionally allowed to send invoices.

Never expose SMTP credentials.

## 19.6 HIGH — Keep SMTP secrets server-side

Prefer Vercel/server environment variables:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-business-email
SMTP_PASSWORD=GOOGLE_APP_PASSWORD
SMTP_FROM=your-business-email
```

Never:

- Return SMTP passwords to React
- Put SMTP secrets in `VITE_*`
- Log SMTP passwords
- Include SMTP passwords in errors
- Store them in browser localStorage
- Commit them to Git

If the settings UI allows SMTP configuration, show only whether it is configured/masked. Do not retrieve the real secret after saving.

If database storage is absolutely required, encrypt the secret at rest using an external server-side encryption key.

## 19.7 MEDIUM — Harden JWT sessions

Keep explicit JWT algorithm verification such as:

```js
algorithms: ['HS256']
```

Use a strong random `JWT_SECRET`.

Current two-hour access-token lifetime is acceptable as an improvement over the previous seven-day lifetime, but preferably migrate toward:

```text
Access token: 15–30 minutes
Refresh token: 7–30 days
Rotation/revocation
```

Do not accept unsigned or unexpected-algorithm JWTs.

## 19.8 MEDIUM — Improve logout

Ensure logout removes all client authentication state.

Preferred long-term architecture:

```text
Short-lived access token
+
Secure refresh token
+
Refresh-token rotation
+
Refresh-token revocation on logout
```

Do not claim server-side revocation unless actually implemented.

## 19.9 MEDIUM — Configure CSP

Helmet is already used. Configure a real Content-Security-Policy compatible with the React/Vite/Vercel application.

Test the complete UI after enabling it.

Avoid broad wildcard sources and avoid `unsafe-eval` unless genuinely required.

## 19.10 MEDIUM — Validate all API input

Validate and sanitize:

- ObjectIds
- Customer name
- Mobile number
- Email
- Product IDs
- SKU
- Quantity
- Price
- Tax rate
- Business type
- Invoice items
- Settings
- CSV fields

Never blindly pass `req.body` into MongoDB updates.

Use explicit allowlisted fields.

## 19.11 MEDIUM — Prevent NoSQL injection

Do not allow arbitrary MongoDB operators from user input.

Reject or safely handle unexpected operators such as:

```text
$gt
$gte
$ne
$regex
$where
$or
$and
```

Construct database filters from validated values.

## 19.12 MEDIUM — Secure CSV imports

For product/customer CSV imports require:

- Authentication
- Admin authorization
- Request size limit
- Row limit
- Field length limits
- Required-column validation
- Type validation
- Duplicate handling
- Rate limiting
- Safe error handling

## 19.13 MEDIUM — Add audit logging

Log security-sensitive actions:

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
INVOICE_EMAILED
SETTINGS_UPDATED
SMTP_SETTINGS_UPDATED
```

Include appropriate:

```text
userId
action
resourceType
resourceId
timestamp
IP
user-agent
```

Never log passwords, JWTs, SMTP passwords, refresh tokens, or API secrets.

## 19.14 MEDIUM — Idempotent invoice creation

Prevent duplicate invoices from:

- Double clicks
- Network retries
- Browser retries
- Client retry logic

Where practical, support an `Idempotency-Key` for invoice creation so the same request cannot create a second invoice or deduct stock twice.

## 19.15 MEDIUM — MongoDB production security

Verify production MongoDB uses:

- Strong credentials
- TLS
- Least-privilege database user
- Network restrictions
- Separate production database
- Backups
- Monitoring

Never expose MongoDB directly to the frontend.

## 19.16 MEDIUM — GitHub secret hygiene

Search source and Git history for:

```text
mongodb://
mongodb+srv://
SMTP_PASSWORD
PASSWORD=
JWT_SECRET
API_KEY
TOKEN=
PRIVATE_KEY
```

Ensure `.env` and production secrets are never committed.

Recommended:

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

If a secret was ever committed, rotate it.

Inspect old ZIP backups for secrets before retaining them.

Consider making the repository private for real business use.

## 19.17 MEDIUM — Dependency security

Run for both frontend and backend:

```bash
npm audit
npm outdated
```

Fix critical/high vulnerabilities where practical.

Do not blindly perform major-version upgrades.

Remove unused dependencies.

## 19.18 MEDIUM — Production error handling

Production responses must not expose:

- Stack traces
- File paths
- Database connection strings
- MongoDB internals
- SMTP credentials
- JWT secrets
- Internal server structure

Use safe messages:

```json
{
  "success": false,
  "message": "Internal server error"
}
```

Keep detailed diagnostics in secure server logs only.

## 19.19 SECURITY REGRESSION TESTS

Test:

### Authentication

- Valid login
- Invalid password
- Missing credentials
- Login rate limiting
- Invalid JWT
- Expired JWT
- Tampered JWT

### Authorization

- Non-admin cannot perform admin actions
- Unauthorized invoice access fails
- Unauthorized PDF access fails
- Unauthorized email sending fails
- Settings cannot be modified by normal users

### CORS

Allow:

```text
https://om-cartridge.vercel.app
```

Reject arbitrary origins.

Never use wildcard credentialed CORS.

### Input validation

Test:

```text
Invalid ObjectId
Negative quantity
Zero quantity
Negative price
NaN
Infinity
Very long strings
Malformed email
Invalid mobile
Unexpected MongoDB operators
Invalid business type
```

### Invoice

Test:

```text
Duplicate submission
Simultaneous invoice creation
Insufficient stock
Zero stock
Cancellation
Transaction rollback
PDF authorization
Email authorization
```

### SMTP

Verify:

```text
SMTP password never appears in API response
SMTP password never appears in frontend bundle
SMTP password never appears in logs
```

## 19.20 FINAL SECURITY CHECKLIST

Before declaring completion:

- [ ] Strict production CORS
- [ ] Invoice ownership authorization
- [ ] Protected PDF endpoint
- [ ] No public invoice static directory
- [ ] Admin authorization on sensitive operations
- [ ] Login rate limiting
- [ ] No default admin password
- [ ] No secrets in source/Git
- [ ] SMTP secrets remain server-side
- [ ] Controlled JSON body limits
- [ ] Secure CSV imports
- [ ] NoSQL injection protection
- [ ] Backend input validation
- [ ] Server-side invoice total calculation
- [ ] Atomic stock deduction
- [ ] Transaction-safe invoice creation where supported
- [ ] Transaction-safe invoice cancellation where supported
- [ ] Atomic unique invoice numbering
- [ ] Email rate limiting/authorization
- [ ] Hardened JWT
- [ ] Logout/session handling
- [ ] CSP/security headers
- [ ] Production-safe errors
- [ ] Audit logging
- [ ] Idempotent invoice creation
- [ ] Dependency audit
- [ ] Security regression tests

## 19.21 FINAL ANTIGRAVITY EXECUTION INSTRUCTION

Act as a senior MERN engineer and senior application-security engineer.

First inspect the entire current repository and do not assume old code is still present.

Identify the actual implementation of:

```text
Frontend
Backend
Express
MongoDB
Authentication
Authorization
JWT
CORS
Rate limiting
Helmet
Invoice creation
Invoice calculation
Invoice numbering
Stock management
PDF generation
Email/SMTP
Customer management
Product management
Settings
Vercel configuration
Environment variables
```

Then implement every applicable security requirement above.

Do NOT rebuild the application.

Do NOT unnecessarily replace working architecture.

Do NOT remove working billing functionality.

Do NOT blindly copy code from this document; adapt it to the current codebase.

After implementation:

1. Run frontend build.
2. Run backend checks/tests.
3. Run security tests.
4. Run lint if available.
5. Run dependency audit.
6. Inspect the final diff for secrets, debug logs, dead code, regressions, and broken APIs.
7. Retest invoice creation, tax/business types, stock, PDF, print, email, customers, products, and responsive UI.

Final report:

```text
SECURITY + FUNCTIONALITY HARDENING COMPLETE

Security score before:
Security score after:

Critical issues fixed:
High issues fixed:
Medium issues fixed:

Files changed:
APIs changed:
Database/model changes:

Tests passed:
Tests failed:

Build:
PASS / FAIL

Remaining risks:
```

Do not claim completion if a critical issue remains or tests fail.

## 19.22 PRIORITY ORDER

If implementation must be staged:

```text
P0
1. Invoice authorization/ownership
2. CORS integrity
3. Authentication/authorization
4. Secret protection
5. Invoice/customer privacy

P1
6. Transaction-safe invoice/stock operations
7. Email endpoint protection
8. Input validation
9. NoSQL injection protection
10. CSV import protection

P2
11. JWT/session hardening
12. Logout/revocation
13. CSP
14. Audit logging
15. Idempotency
16. Dependency/security maintenance
```

Always preserve existing business functionality while implementing security controls.
