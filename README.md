# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Run locally

Prerequisites
- Node.js 18+ (LTS)
- A package manager: npm (bundled), pnpm, or yarn

Quick start
```bash
npm install
npm run dev
```

Open the app
- Vite will print a Local URL (typically http://localhost:5173). Open it in your browser.

## Useful scripts

```bash
# Lint the project
npm run lint

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

Tips
- Custom dev port: npm run dev -- --port 3000
- Using pnpm or yarn: replace npm with your manager

## Troubleshooting

- Node version issues: ensure Node 18+ (nvm use 18 or nvm install 18)
- Port already in use: pick another port (npm run dev -- --port 3000)
- Clean reinstall:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```
