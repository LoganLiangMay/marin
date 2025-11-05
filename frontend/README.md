# Audio Pipeline Dashboard - Frontend

Internal dashboard for the Audio Call Data Ingestion Pipeline built with Next.js 14 and TypeScript.

## Story 6.1: Next.js Project Setup with Authentication

This is the frontend web application for managing and analyzing audio call data.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: AWS Amplify + Cognito
- **State Management**: Zustand + React Query
- **Charts**: Recharts
- **Icons**: Heroicons + Lucide React
- **HTTP Client**: Axios
- **Notifications**: React Hot Toast

## Features

- 🔐 **Authentication**: AWS Cognito integration with JWT tokens
- 📊 **Analytics Dashboard**: Visualize call data, sentiment, and trends
- 📞 **Call Management**: Upload, view, and manage call recordings
- 🔍 **Semantic Search**: Vector-based search across transcripts
- 💡 **Insights**: Daily aggregated insights and trends
- 🛡️ **Quality Monitoring**: Track analysis quality and alerts
- 👥 **Role-Based Access**: Admin, Analyst, and User roles
- 📱 **Responsive Design**: Mobile-friendly interface

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- Backend API running (see `../backend/README.md`)
- AWS Cognito User Pool configured

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_COGNITO_REGION=us-east-1
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   NEXT_PUBLIC_COGNITO_CLIENT_ID=your-app-client-id
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── calls/        # Call management
│   │   │   ├── analytics/    # Analytics dashboard
│   │   │   ├── insights/     # Insights view
│   │   │   ├── quality/      # Quality monitoring
│   │   │   └── search/       # Semantic search
│   │   ├── login/            # Login page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page (redirects)
│   │
│   ├── components/           # Reusable components
│   │   ├── dashboard-nav.tsx # Navigation sidebar
│   │   └── providers.tsx     # Context providers
│   │
│   ├── lib/                  # Utilities and configuration
│   │   ├── auth.ts          # Authentication utilities
│   │   └── api-client.ts    # API client with axios
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── use-auth.tsx     # Authentication hook
│   │
│   └── types/               # TypeScript type definitions
│       └── index.ts         # Application types
│
├── public/                  # Static assets
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── next.config.js          # Next.js configuration
```

## Authentication

The application uses AWS Cognito for authentication with role-based access control.

### User Roles

- **Admin**: Full access to all features including user management
- **Analyst**: Access to analytics, insights, and quality monitoring
- **User**: Basic access to view calls and dashboards

### Login Flow

1. User enters email and password
2. AWS Cognito validates credentials
3. On success, JWT tokens are issued
4. Tokens are stored and included in API requests
5. User is redirected to dashboard

### Protected Routes

All routes under `/dashboard` are protected and require authentication. The `ProtectedRoute` component handles redirects for unauthenticated users.

## API Integration

The frontend communicates with the backend API using axios. The API client is configured with:

- Automatic JWT token injection in headers
- Request/response interceptors
- Error handling with user-friendly messages
- Automatic retry logic

### Example API Usage

```typescript
import { callsApi } from '@/lib/api-client'

// List calls with pagination
const calls = await callsApi.list({
  page: 1,
  page_size: 20,
  status: 'analyzed'
})

// Upload audio file
const result = await callsApi.upload(file, {
  company_name: 'Acme Corp',
  call_type: 'sales'
})
```

## State Management

- **React Query**: Server state management (API data, caching)
- **Zustand**: Client state management (UI state, preferences)
- **Context API**: Authentication state

## Styling

The project uses Tailwind CSS with a custom configuration:

- Custom color palette for brand colors
- Reusable component classes (`.btn`, `.card`, `.input`, etc.)
- Status-specific colors (success, warning, error, info)
- Responsive breakpoints
- Dark mode support (planned)

## Development

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for code formatting (recommended)

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push code to GitHub repository
2. Import project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
# Build Docker image
docker build -t audio-pipeline-frontend .

# Run container
docker run -p 3000:3000 audio-pipeline-frontend
```

### Manual Deployment

```bash
# Build for production
npm run build

# Start server
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_COGNITO_REGION` | AWS Cognito region | Yes |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito User Pool ID | Yes |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | Cognito App Client ID | Yes |
| `NEXT_PUBLIC_ENABLE_SEMANTIC_SEARCH` | Enable semantic search feature | No |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics features | No |

## Troubleshooting

### Authentication Issues

**Problem**: "User pool client does not exist"
**Solution**: Verify `NEXT_PUBLIC_COGNITO_CLIENT_ID` is correct

**Problem**: "Invalid token"
**Solution**: Tokens may have expired. Try logging out and back in.

### API Connection Issues

**Problem**: "Network Error" or "CORS error"
**Solution**:
- Verify backend is running at `NEXT_PUBLIC_API_URL`
- Check CORS configuration in backend allows frontend origin

### Build Issues

**Problem**: TypeScript errors during build
**Solution**: Run `npm run type-check` to identify issues

## Future Enhancements

- [ ] Real-time updates with WebSockets (Story 6.6)
- [ ] Advanced data visualizations
- [ ] Export functionality for reports
- [ ] Dark mode support
- [ ] PWA support for offline access
- [ ] Internationalization (i18n)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and type checks
4. Submit a pull request

## Support

For issues or questions:
- Check the backend API documentation
- Review the Cognito configuration
- Contact the development team

## License

Proprietary - Internal use only
