# Imriva VdpConnect

A social media platform built with React and Vite.

## Development

### Prerequisites

- Node.js 20+ and npm
- [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd imriva-vdpconnect

# Install dependencies
npm install

# Configure GitHub Packages auth (for @imriva scope). Copy .npmrc.example to .npmrc
# (npm only reads .npmrc — not .nprc). Set //npm.pkg.github.com/:_authToken to your GitHub PAT,
# or use env NODE_AUTH_TOKEN. Never commit .npmrc or put a real token in any file; .npmrc is gitignored.

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

**Data loading (local stack):** For feeds, profiles, and connections to load you need all three running and aligned:

1. **Identity** (e.g. Imriva.Identity.Host) at `https://localhost:5001` – login and JWT issuer.
2. **VdpConnect API** (Imriva.VdpConnect.Api) at `http://localhost:5225` – with `ASPNETCORE_ENVIRONMENT=Local`. Copy `src/Imriva.VdpConnect.Api/appsettings.Local.example.json` to `appsettings.Local.json` (gitignored), set your DB connection string and secrets; defaults target local Identity at `https://localhost:5001`.
3. **Frontend** at `http://localhost:5173` – no `VITE_API_BASE_URL` in `.env` so `/api` is proxied to the API; OIDC issuer should point at Identity (default in dev is `https://localhost:5001`).

Ensure the VdpConnect DB is migrated and seeded (e.g. run the API once; it applies migrations and seed in Local/Development). If data still doesn’t load, check the browser Network tab for failed `/api/*` or auth requests and the API/Identity logs.
### Build for Production

```sh
npm run build
```

The built files will be in the `dist/` directory.

### Mobile app / PWA

The app is built as a **Progressive Web App (PWA)** so it can be installed on mobile devices and used like a native app:

- **Install on device**: After `npm run build` and deploy, users can "Add to Home Screen" (iOS) or "Install app" (Android Chrome) for a full-screen, standalone experience.
- **Manifest**: Name, theme color, icons, and `display: standalone` are configured in `vite.config.js` via `vite-plugin-pwa`.
- **Offline**: A service worker caches assets and updates automatically (`registerType: 'autoUpdate'`).
- **Mobile UX**: Viewport and safe-area insets (notches, home indicator) are handled; nav touch targets meet 44px minimum; responsive layout uses a mobile drawer sidebar.

For **native app store packaging** (optional), you can wrap the built app with [Capacitor](https://capacitorjs.com/) or similar and build iOS/Android binaries.

## Technologies

- **Vite** - Build tool and dev server
- **React** - UI framework
- **shadcn-ui** - UI component library
- **Tailwind CSS** - Styling
- **OpenIddict** - OAuth2/OIDC authentication

## Deployment

This project uses automated deployment via GitHub Actions to Hetzner server.

### Quick Setup

1. **Configure GitHub Secrets** - See [docs/GITHUB_SECRETS_SETUP.md](docs/GITHUB_SECRETS_SETUP.md)
2. **Push to main/develop branch** - Deployment triggers automatically
3. **Manual deployment** - Go to Actions → Deploy to Hetzner → Run workflow

### Deployment Documentation

- **[GitHub Secrets Setup](docs/GITHUB_SECRETS_SETUP.md)** - Configure secrets for automated deployment
- **[Docker Compose Setup](docs/DOCKER_COMPOSE_SETUP.md)** - Install Docker Compose on server

### Environment Variables

The frontend uses Vite environment variables (prefixed with `VITE_`):
- `VITE_OIDC_ISSUER` - OAuth issuer URL (`npm run dev`: default `https://localhost:5001` when unset; production Docker build defaults to hosted dev unless overridden)
- `VITE_OIDC_CLIENT_ID` - OAuth client ID (default: `imriva-frontend`)
- `VITE_OIDC_REDIRECT_URI` - OAuth redirect URI
- `VITE_OIDC_SCOPE` - OAuth scopes (default: `openid profile api`)
- `VITE_API_BASE_URL` - Backend API URL (default: `https://dev.api.vdpconnect.idxd.de`)

These are set via GitHub Secrets and passed as Docker build args.

### Health Check

The application exposes a health check endpoint at `/health` for monitoring.

**Dev Environment**: https://dev.app.vdpconnect.idxd.de/health

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── services/       # API and auth services
│   ├── contexts/       # React contexts
│   └── hooks/          # Custom hooks
├── public/             # Static assets
├── docs/               # Documentation
├── Dockerfile          # Docker build configuration
├── docker-compose.yml  # Docker Compose configuration
└── nginx.conf          # Nginx configuration
```

## Additional Guides

- **[Local vs Dev environment](docs/LOCAL_VS_DEV_ENVIRONMENT.md)** - Why some features work locally but not in the dev deployment, and what to check
- **[Mobile App Guide](MOBILE_APP_GUIDE.md)** - Mobile app integration
- **[Quick Mobile Setup](QUICK_MOBILE_SETUP.md)** - Quick mobile setup guide
- **[Tailwind Responsive Guide](TAILWIND_RESPONSIVE_GUIDE.md)** - Responsive design patterns
