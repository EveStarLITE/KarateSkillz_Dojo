# Test Plan and Checklists

## Functional Checklist
- [ ] All public routes load and render expected content.
- [ ] Product/service detail links open from shop cards.
- [ ] Add to cart works from all detail pages.
- [ ] Cart quantity update and removal work.
- [ ] Help Desk: logged-in user can submit a ticket and see it in the list.
- [ ] Help Desk: resolution time shows after admin marks ticket resolved/closed (or shows Open while pending).

## Authentication Checklist
- [ ] Register creates account.
- [ ] Login returns token and authenticated state.
- [ ] Protected customer routes redirect if not authenticated.
- [ ] Admin routes reject non-admin users.

## Checkout and Payment Simulation Checklist
- [ ] Checkout validates billing fields.
- [ ] Simulated PayPal path places order.
- [ ] Mock card path accepts test card and rejects invalid values.
- [ ] Confirmation displays order number and payment reference.

## Admin Access Checklist
- [ ] Admin dashboard data loads.
- [ ] Admin orders can update status.
- [ ] Admin users list loads.
- [ ] Admin products/services pages load.
- [ ] Admin Tickets page lists all tickets and status updates persist; customers see updated status and resolution time.

## Email Workflow Checklist
- [ ] Verification email triggered on register.
- [ ] Forgot password email triggered.
- [ ] Order confirmation email triggered.
- [ ] Contact notification email triggered.

## UI and Responsive Checklist
- [ ] Navbar/footer render on all pages.
- [ ] Forms are usable on mobile viewport.
- [ ] Checkout/cart remain readable on small screens.

## Security Validation Checklist
- [ ] Invalid payloads return 400 on protected write APIs.
- [ ] Passwords are stored hashed, not plaintext.
- [ ] Sensitive routes require valid token.
- [ ] Auth/contact endpoints are rate-limited.
