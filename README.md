# Spinozómetro · Sistema PAG

Aplicación web hecha con Next.js. Este documento explica solo lo necesario para instalarla y correrla.

## Requisitos

- **Node.js 20.9 o superior** (verificalo con `node -v`; si no lo tenés, instalá la versión LTS desde https://nodejs.org).
- **npm** (viene incluido con Node.js).

## Instalación y ejecución

Desde la carpeta del proyecto:

```bash
npm install     # instala todas las dependencias
npm run dev     # levanta la app en http://localhost:3000
```

Otros comandos:

```bash
npm run build   # genera la versión de producción
npm start       # sirve la versión de producción (después de build)
npm test        # corre los tests automáticos
```

## Dependencias

Ya están declaradas en `package.json`, así que `npm install` las instala todas. Para referencia:

| Paquete | Para qué se usa |
|---|---|
| `next`, `react`, `react-dom` | Framework y librería de interfaz |
| `tailwindcss` (v4) | Estilos |
| `typescript` | Lenguaje |
| `lucide-react` | Íconos |
| `jspdf` | Generación de PDF en el navegador |
| `tsx` (desarrollo) | Ejecutar los tests |

Si hubiera que instalarlas a mano, los dos comandos son:

```bash
npm i lucide-react jspdf
npm i -D tsx
```

Y `package.json` debe tener este script: `"test": "tsx --test tests/*.test.ts"`.

## Si algo falla

- **Error de versión de Node:** actualizá Node.js a la versión 20.9 o superior.
- **npm pregunta por `unrs-resolver`:** es un script de instalación de una dependencia de las herramientas de revisión de código; se puede aprobar con `npm approve-scripts unrs-resolver`.
- **El puerto 3000 está ocupado:** Next.js ofrece usar otro puerto automáticamente.
