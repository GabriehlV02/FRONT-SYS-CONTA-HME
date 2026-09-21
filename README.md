# FRONT-SYS-CONTA-HME

Frontend del sistema contable HME.

## Requisitos

- Node.js 20+
- npm 10+

## Instalacion

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

La app abre por defecto en `http://localhost:5050`.

## Backend

En desarrollo, Vite redirige `/api` hacia `VITE_API_TARGET`.

Backend esperado:

```env
VITE_API_TARGET=http://127.0.0.1:5055
```

Las rutas de inventario y autenticación se ejecutan en el backend. El frontend
no requiere un servidor API propio.

## Scripts

```powershell
npm run dev
npm run build
npm run typecheck
npm run lint
```
