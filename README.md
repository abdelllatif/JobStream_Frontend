# JobstreamFrontend

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.3.9.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Docker Deployment (Frontend)

This frontend is containerized with a multi-stage Docker build and served by Nginx in production mode.

### Files

- `Dockerfile`: Builds Angular app and serves static files via Nginx.
- `docker-compose.yml`: Runs the frontend and attaches it to a shared external Docker network.
- `nginx.conf`: SPA fallback plus reverse proxy for backend API and websocket endpoints.
- `.env.example`: Environment variables for port, container name, and shared network name.

### Setup

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Ensure the external frontend/backend shared network exists.

### Run Commands

```bash
docker network create jobstream_frontend_net
docker compose up -d --build
```

If you use a different network name, set `FRONTEND_NETWORK_NAME` in `.env` first.

### Networking Decisions

- The compose service joins an **external** network so this frontend can communicate with backend containers started from a different compose project.
- Nginx proxies `/api/` and `/ws` to `http://jobstream-api:8081`, relying on Docker DNS resolution on the shared network.
- Browser clients call same-origin frontend paths (`/api`, `/ws`), which avoids hardcoding backend hostnames in client-side code.

### Manual Verification Checklist

1. `docker compose ps` shows `frontend` running.
2. `docker inspect jobstream_frontend` shows it attached to `jobstream_frontend_net` (or your configured network).
3. Opening `http://localhost:<FRONTEND_PORT>` loads the Angular app.
4. Refreshing a deep route (for example `/job-feed` or `/profile`) does not return 404.
5. Requests to `/api/...` from the browser return backend responses (check network tab).
6. WebSocket/STOMP connection through `/ws` succeeds and stays connected.
