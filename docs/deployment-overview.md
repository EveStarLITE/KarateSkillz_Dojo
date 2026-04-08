# Deployment Overview

- Frontend: build with `npm run build` in `frontend`, deploy static assets.
- Backend: run `npm start` in `backend`.
- Required backend env vars: `PORT`, `CLIENT_ORIGIN`, `JWT_SECRET`, SMTP variables, mail targets.
- In development, frontend uses Vite proxy to backend.
