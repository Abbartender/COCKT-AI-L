# COCKT—AI—L

Generador de cócteles con IA basado en Joy of Mixology (Gary Regan), The Flavor Bible y principios de Food Pairing.

## Deploy en Vercel

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "COCKT-AI-L inicial"
git remote add origin https://github.com/TU_USUARIO/cockt-ai-l.git
git push -u origin main
```

### 2. Conectar en Vercel
1. Ir a [vercel.com](https://vercel.com)
2. New Project → importar el repo
3. En **Environment Variables** agregar:
   - `ANTHROPIC_API_KEY` = tu API key de Anthropic

### 3. Deploy
Vercel lo despliega automáticamente. Cada push a `main` actualiza la app.

## Estructura
```
cockt-ai-l/
├── api/
│   └── generate.js     ← proxy a Anthropic API
├── public/
│   └── index.html      ← frontend completo
├── package.json
├── vercel.json
└── README.md
```
