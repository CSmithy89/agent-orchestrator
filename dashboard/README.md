# Agent Orchestrator Dashboard

Modern React dashboard for monitoring and managing the Agent Orchestrator system.

## Features

- **Real-time Updates:** WebSocket integration for live status updates
- **Modern UI:** Built with React 18, TypeScript, and Tailwind CSS
- **Component Library:** shadcn/ui components with Radix UI primitives
- **State Management:** TanStack Query for server state, Zustand for client state
- **Responsive Design:** Mobile-first approach with full tablet and desktop support
- **Dark Mode:** System preference detection with manual toggle
- **Type Safety:** Full TypeScript coverage with strict mode
- **Testing:** Vitest + React Testing Library for comprehensive test coverage

## Tech Stack

- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.3
- **Language:** TypeScript 5.5.4
- **Styling:** Tailwind CSS 3.4.10
- **UI Components:** shadcn/ui (Radix UI primitives)
- **Server State:** TanStack Query 5.56.2
- **Client State:** Zustand 4.5.5
- **Routing:** React Router 6.26.1
- **Testing:** Vitest 1.0.4, React Testing Library

## Prerequisites

- Node.js 18+ (recommended: use `.nvmrc` file)
- npm 9+
- Backend API running on `http://localhost:3000` (see backend README)

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### 3. Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

### 5. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
dashboard/
├── public/              # Static assets
├── src/
│   ├── api/            # API client layer
│   │   ├── client.ts   # BaseAPI class with fetch wrapper
│   │   ├── types.ts    # TypeScript type definitions
│   │   ├── projects.ts # Project API endpoints
│   │   ├── orchestrators.ts # Orchestrator control endpoints
│   │   └── escalations.ts # Escalation endpoints
│   ├── components/     # React components
│   │   ├── ui/         # shadcn/ui components (Button, Card, Dialog, Dropdown, Input, Label, Select, Tabs, Toast)
│   │   ├── layout/     # Layout components (Header, Sidebar, MainLayout)
│   │   ├── ErrorBoundary.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   └── ConnectionStatus.tsx
│   ├── hooks/          # Custom React hooks
│   │   ├── useWebSocket.ts # WebSocket connection hook
│   │   ├── useAuth.ts      # Authentication hook
│   │   ├── useTheme.ts     # Theme management hook
│   │   └── useToast.ts     # Toast notification hook
│   ├── store/          # Zustand stores
│   │   ├── authStore.ts    # Authentication state
│   │   └── uiStore.ts      # UI state (theme, sidebar)
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   └── NotFound.tsx
│   ├── lib/            # Utility functions
│   │   └── utils.ts
│   ├── test-utils/     # Test utilities
│   │   ├── setup.ts
│   │   └── test-utils.tsx
│   ├── App.tsx         # Main app component with routes
│   ├── main.tsx        # Entry point
│   └── index.css       # Tailwind directives + custom CSS
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── vitest.config.ts    # Vitest configuration
├── tailwind.config.js  # Tailwind CSS configuration
├── components.json     # shadcn/ui configuration
├── nginx.conf          # Nginx production configuration
└── package.json        # Dependencies
```

## API Integration

The dashboard connects to the backend API running on `http://localhost:3000`:

- **Authentication:** JWT tokens stored in `localStorage`
- **API Endpoints:** Projects, orchestrators, escalations, stories
- **WebSocket:** Real-time updates at `/ws/status-updates`

All API requests automatically include the JWT token in the `Authorization` header.

## Toast Notifications

The dashboard includes a Toast notification system for displaying transient messages (success, error, warning, info).

### Basic Usage

```typescript
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: "Success!",
      description: "Your changes have been saved.",
      variant: "success",
    });
  };

  const handleError = () => {
    toast({
      title: "Error",
      description: "Failed to save changes. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <button onClick={handleSuccess}>Save</button>
  );
}
```

### Toast Variants

- **default** - Standard notification
- **success** - Green toast for successful operations
- **destructive** - Red toast for errors
- **warning** - Yellow toast for warnings
- **info** - Blue toast for informational messages

### Advanced Usage

```typescript
// Toast with action button
toast({
  title: "File uploaded",
  description: "Your file has been uploaded successfully.",
  variant: "success",
  action: <ToastAction altText="View">View File</ToastAction>,
});

// Dismiss a specific toast
const { id, dismiss } = toast({ title: "Processing..." });
// Later...
dismiss();
```

### Integration

The `<Toaster />` component is already integrated in `App.tsx` and will display all toasts globally. Toast notifications automatically dismiss after 5 seconds but can be manually closed.

## Theme Customization

### Using tweakcn CLI

The dashboard uses `tweakcn` for easy component customization:

```bash
# Install globally
npm install -g tweakcn

# Customize a component
npx tweakcn customize button
```

### Manual Customization

Edit `tailwind.config.js` to modify theme colors, spacing, and typography:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: 'hsl(221.2 83.2% 53.3%)',
        foreground: 'hsl(210 40% 98%)',
      },
      // ... other colors
    },
  },
}
```

### Dark Mode

Dark mode is automatically applied based on:
1. User preference (theme toggle in header)
2. System preference (if theme is set to "system")
3. Persisted in `localStorage`

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Organization

Tests are co-located with source files:
- `src/api/client.test.ts` - API client tests
- `src/hooks/useWebSocket.test.ts` - WebSocket hook tests
- `src/components/layout/Header.test.tsx` - Header component tests

### Writing Tests

Use the custom `render` function from `test-utils`:

```typescript
import { render, screen } from '@/test-utils/test-utils';
import { Dashboard } from './Dashboard';

test('renders dashboard', () => {
  render(<Dashboard />);
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

## Code Quality

### Linting

```bash
npm run lint
```

### Formatting

```bash
npm run format
```

## Deployment

### Production Build

1. Build the application:
   ```bash
   npm run build
   ```

2. The `dist/` directory contains the optimized static files.

### Nginx Configuration

Use the provided `nginx.conf` file:

```bash
# Copy built files to Nginx
cp -r dist/* /usr/share/nginx/html/

# Use the provided nginx.conf
cp nginx.conf /etc/nginx/conf.d/dashboard.conf

# Reload Nginx
nginx -s reload
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t agent-orchestrator-dashboard .
docker run -p 80:80 agent-orchestrator-dashboard
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:3000` | Backend API base URL |
| `VITE_WS_URL` | `ws://localhost:3000` | WebSocket server URL |

## Architecture

### State Management

- **Server State (TanStack Query):**
  - API data fetching and caching
  - Automatic background refetching
  - Optimistic updates
  - 5-minute stale time, 10-minute cache time

- **Client State (Zustand):**
  - Authentication state (token, user)
  - UI state (theme, sidebar)
  - Persisted to `localStorage`

### API Client

The `BaseAPI` class provides:
- Automatic JWT token injection
- Error handling with `APIError` class
- Type-safe requests with TypeScript generics
- 401 handling (auto logout and redirect)

### WebSocket Integration

The `useWebSocket` hook provides:
- Automatic connection and reconnection
- Exponential backoff (1s, 2s, 4s, 8s, 16s max)
- Event subscription by event type
- Connection status indicator

## Responsive Design

The dashboard supports three breakpoints:

- **Mobile** (<768px): Collapsible sidebar, stacked layout
- **Tablet** (768-1024px): Persistent sidebar, responsive grid
- **Desktop** (>1024px): Full layout with all features

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Run linting and tests before committing
4. Update documentation as needed

## License

UNLICENSED

## Support

For issues or questions, contact the development team.
