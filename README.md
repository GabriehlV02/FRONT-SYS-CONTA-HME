# Sistema Contable HME · Frontend

Interfaz web del Sistema Contable HME para la gestión de inventario, almacenes, movimientos y ventas. Este repositorio contiene el cliente React; la autenticación y las operaciones persistentes se realizan en la API Laravel.

[![React](https://img.shields.io/badge/React-UI-149ECA?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-tipado-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-desarrollo-646CFF?logo=vite&logoColor=white)](https://vite.dev/)

## Módulos

- Resumen y paneles de operación.
- Inventario de productos, insumos y servicios.
- Almacenes, stock y movimientos de existencias.
- Adquisiciones, ventas y caja.
- Usuarios, permisos y configuración del sistema.

## Arquitectura

- **Frontend:** React, TypeScript y Vite.
- **API contable:** [BACK-SYS-CONTA-HME](https://github.com/GabriehlV02/BACK-SYS-CONTA-HME).
- **Integración clínica:** [BACK-SYS-CLINICO-HME](https://github.com/GabriehlV02/BACK-SYS-CLINICO-HME).
- Durante el desarrollo, Vite reenvía `/api` a la API contable configurada.

## Requisitos

- Node.js 20 o posterior y npm.
- API contable disponible para iniciar sesión y consultar o guardar información.

## Inicio local

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

Vite inicia en `http://localhost:5050`. La plantilla configura el proxy hacia `http://127.0.0.1:5055` mediante `VITE_API_TARGET`.

```env
VITE_API_TARGET=http://127.0.0.1:5055
```

Usa las variables de `.env.example` y no guardes credenciales ni tokens en Git.

## Comandos

```powershell
npm run dev       # servidor de desarrollo
npm run build     # comprobación TypeScript y compilación de producción
npm run typecheck # comprobación de tipos
npm run lint      # comprobación TypeScript configurada en el proyecto
```

## Estructura

```text
src/
├── flows/   # inventario, ventas, almacenes y configuración
├── ui/      # componentes y estructura de navegación
├── styles/  # estilos del sistema
└── assets/  # recursos visuales
```

## Desarrollo

Mantén los cambios de interfaz en este repositorio y coordina los contratos de API con el backend contable. En capturas o ejemplos compartidos, utiliza datos ficticios y evita mostrar información financiera o personal real.
