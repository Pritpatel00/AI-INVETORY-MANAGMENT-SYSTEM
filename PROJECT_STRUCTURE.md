# Project Structure

The project is divided into a web frontend and backend services so each area
has one clear responsibility.

```text
AI-Voice-Inventory-Web/
|-- frontend/
|   |-- app/                 Web routes, layout and global styles
|   |-- src/                 Inventory UI, authentication and API client
|   |-- public/              PWA manifest, service worker and static assets
|   |-- tests/               Frontend rendering and browser workflow tests
|   |-- build/               Frontend build helpers
|   `-- package.json         Frontend commands and dependencies
|-- backend/
|   |-- api/
|   |   |-- src/             NestJS modules and business rules
|   |   |-- prisma/          Database schema, migrations and seed scripts
|   |   |-- __mocks__/       Backend test support
|   |   `-- package.json     API commands and dependencies
|   `-- speech/
|       |-- app/             Local speech-to-text service
|       `-- requirements.txt Python dependencies
|-- infrastructure/         PostgreSQL, Keycloak, AI and monitoring scripts
|-- packages/               Shared contracts and validation documentation
|-- docs/                   Functional and technical documentation
|-- video/                  Project demonstration assets
`-- package.json            Commands that delegate to frontend/backend
```

## Run from the project root

```powershell
npm run dev
npm run api:dev
```

The web application runs on `http://localhost:3000` and the API runs on
`http://localhost:4000`.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
npm test
npm run api:build
npm run api:test
```

Use `npm run install:all` after a fresh checkout to install both sets of Node
dependencies.
