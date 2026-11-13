# 📐 DOMINGA PROJECT
Plataforma de preparación PAES, 100 % estática (sin servidor ni cuentas). Los datos del estudiante se guardan en el navegador.

## Subir a GitHub y publicar
1. Crea un repositorio vacío en GitHub (por ejemplo `dominga-project`).
2. Sube **todo el contenido de esta carpeta** (incluida la carpeta oculta `.github`).
   Con Git: `git init && git add . && git commit -m "DOMINGA PROJECT" && git branch -M main && git remote add origin <URL> && git push -u origin main`
3. En GitHub: **Settings → Pages → Source: GitHub Actions**.
4. Cada push a `main` ejecuta los tests, compila y publica. La URL queda en la pestaña *Actions* y en *Settings → Pages*.

## Si el sitio sale en blanco
- **No abras `dist/index.html` ni `index.html` con doble clic**: los navegadores bloquean los módulos desde `file://`. Para uso local abre `docs/index.html` (versión de un solo archivo, funciona con doble clic y en celular).
- En GitHub, **Settings → Pages → Source debe ser «GitHub Actions»**. Si eliges «Deploy from a branch» con la carpeta raíz, GitHub sirve el código fuente y la página queda en blanco.
- Alternativa sin Actions: Source = «Deploy from a branch», rama `main`, carpeta **/docs** (ya incluye una versión compilada). Recompílala con `npm run build:single` y copia `dist-single/index.html` a `docs/index.html`.
- Revisa la pestaña **Actions**: si el flujo falló (rojo), abre el registro para ver el error.

## Desarrollo
`npm i` · `npm run dev` · `npm test` · `npm run build` · `npm run build:single` (un solo HTML para demos).

## Contenido académico
- Un archivo por asignatura en `src/data/*.json` (ya existen vacíos, salvo `ciencias-biologia.json`).
- Formato: `docs/PLANTILLA.json`. `source`: `official`, `adapted`, `original` o `external` (material de terceros; la explicación es opcional).
- También se pueden importar archivos JSON desde la pestaña «Banco».
- Banco incluido: 40 preguntas originales de Dominga (M1, M2, Lectora, Historia y Ciencias) con explicación, más las 12 externas descritas abajo. Son un punto de partida, no un banco completo.
- `ciencias-biologia.json` además contiene 12 preguntas de muestra del 1° Ensayo General de Filadd (no oficial DEMRE). **Confirma que puedes publicarlas o bórralas antes de hacer público el repositorio.**

## Importar archivos PAES
Pestaña «Banco» → «Importar» (acepta varios `.json` o `.csv` a la vez). Descarga la «Plantilla CSV» para ver las columnas (`id, asignatura, tema, dificultad, pregunta, texto, a–e, correcta, explicacion, fuente`). Asignaturas: `lectora`, `m1`, `m2`, `ciencias`, `historia`. Si falta `fuente`, se marca como `external`. Se rechazan preguntas inválidas o duplicadas y se informa por qué. Los PDF deben convertirse antes a CSV/JSON.

## Módulos
Dashboard, pruebas de 15/30/60 preguntas, banco, planificador (calendario, plan semanal, cuenta regresiva), Arcade (5 juegos), logros, estadísticas y respaldo JSON.
Las fechas oficiales de DEMRE las ingresa el usuario; no están precargadas. Los porcentajes de práctica no son puntajes PAES.

## Limitaciones
Sin sincronización entre dispositivos; importar un respaldo reemplaza los datos actuales; la navegación y los efectos visuales no se han probado en navegador real.

## Colores de la interfaz
⚙️ Perfil → «Colores de la interfaz»: 5 temas, selector de color de acento y de fondo (los demás tonos se calculan solos), aviso si el contraste es bajo, y un interruptor para apagar los efectos de parpadeo. Se guarda en el dispositivo (clave `dominga.theme`) y no entra en el respaldo JSON.

## Favicon e íconos
Los íconos viven en `public/` (`favicon.ico`, `favicon-16/32.png`, `apple-touch-icon.png`, `icon-192/512.png`) y se enlazan en `index.html` y `manifest.webmanifest`. En la versión de un solo archivo (`npm run build:single`) se incrustan dentro del HTML.
