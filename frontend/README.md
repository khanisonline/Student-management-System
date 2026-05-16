# Student Management Frontend

React frontend for the `student-management-system` backend.

## Stack

- JavaScript only
- React + Vite
- React Router
- Plain CSS

## Run

```bash
npm install
npm run dev
```

## Backend URL

Create a `.env` file if needed:

```bash
VITE_API_BASE_URL=http://localhost:5000
```

## Notes

- Authentication uses the backend JWT token returned from `/api/auth/login`.
- Styling is written with regular CSS in `src/styles/`.
- There is no TypeScript setup in this frontend.
