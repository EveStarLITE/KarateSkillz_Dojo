# Security Overview

- Passwords hashed with `bcryptjs`.
- JWT bearer authentication with role checks for admin routes.
- `helmet` headers enabled (CSP baseline disabled in dev mode).
- Input validation with `zod` on auth, contact, profile, and order APIs.
- Rate limiting enabled on auth/contact endpoints.
- Email templates escape user-supplied fields.
- No real payment processing or real PAN storage; mock/test data only.
