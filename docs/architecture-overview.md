# Architecture Overview

```mermaid
flowchart LR
  user[Browser User] --> fe[React Frontend]
  fe --> api[Express API /api/v1]
  api --> auth[Auth Module]
  api --> catalog[Catalog Module]
  api --> orders[Orders Module]
  api --> admin[Admin Module]
  api --> email[Mail Service]
  email --> smtp[MailEnable SMTP]
```

- Frontend communicates with backend REST endpoints through Vite proxy in development.
- Backend currently uses in-memory stores as integration scaffolding pending separate DB implementation.
