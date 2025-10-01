# Lyzr HR Helpdesk - Multi-Organizational SaaS Platform

## Overview

Lyzr HR Helpdesk is a comprehensive AI-powered HR support platform that enables organizations to automate employee support, manage tickets efficiently, and provide instant HR assistance. The platform supports multi-organizational workflows with role-based access control and intelligent routing.

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, React 19
- **UI Components**: shadcn/ui, Tailwind CSS v4
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Lyzr Studio Integration with encrypted API key storage
- **Security**: AES-256-CBC encryption, API middleware
- **State Management**: React Context API
- **Styling**: Tailwind CSS with custom design system and gradient effects
- **API**: Versioned REST API (v1) with comprehensive error handling

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/v1/                   # Versioned API Routes
│   │   ├── auth/lyzr/           # Lyzr authentication endpoint
│   │   ├── organizations/       # Organization management
│   │   └── user/organizations/  # User organizations endpoint
│   ├── dashboard/               # Dashboard pages with layout
│   │   ├── ai-assistant/        # AI chat interface
│   │   ├── knowledge-base/      # Document management
│   │   ├── organization/        # Org management (admin)
│   │   ├── settings/           # User settings
│   │   ├── tickets/            # Ticket management
│   │   └── layout.tsx          # Dashboard layout with sidebar
│   ├── organizations/           # Organization selection page
│   └── page.tsx                 # Enhanced landing page
├── components/                  # Reusable UI components
│   ├── ui/                     # shadcn/ui base components
│   ├── app-sidebar.tsx         # Supabase-style sidebar
│   ├── site-header.tsx         # Enhanced header with org picker
│   ├── chat-input.tsx          # AI chat input component
│   ├── chat-empty-state.tsx    # Chat welcome screen
│   ├── starter-questions.tsx   # HR-focused starter questions
│   └── gradient-manager.tsx    # Background gradient controller
├── lib/                        # Utilities and configurations
│   ├── models/                 # Enhanced Mongoose models
│   ├── middleware/             # API security middleware
│   ├── AuthProvider.tsx        # Enhanced authentication context
│   ├── auth-helpers.ts         # User management utilities
│   ├── organization-helpers.ts # Organization utilities
│   ├── encryption.ts           # API key encryption
│   ├── config.ts              # App configuration
│   ├── database.ts            # MongoDB connection
│   └── utils.ts               # General utilities
├── hooks/                      # Custom React hooks
└── public/                     # Static assets
    ├── lyzr.svg               # Lyzr logo
    └── noise.svg              # Background texture
```

## Database Schema

### User Model
```typescript
interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  lyzrUserId?: string;           // ID from Lyzr Studio
  lyzrApiKey?: string;           // Encrypted API key from Lyzr
  lyzrOrganizationId?: string;   // Current org ID from Lyzr
  lyzrPolicyId?: string;         // Policy ID from Lyzr  
  lyzrUsageId?: string;          // Usage ID from Lyzr
  lyzrRole?: string;             // Role in Lyzr (e.g., "owner")
  lyzrCredits?: string;          // Available credits
  currentOrganization?: string;  // Current active organization
  schemaVersion: number;         // For future migrations
  createdAt: Date;
  updatedAt: Date;
}
```

### Organization Model
```typescript
interface IOrganization {
  _id: string;
  name: string;
  lyzrApiKey?: string;          // Encrypted API key for Lyzr integration
  avatar?: string;
  createdBy: string;            // User ID of creator
  systemInstruction?: string;   // AI assistant instructions
  createdAt: Date;
  updatedAt: Date;
}
```

### OrganizationUser Model (Role Mapping)
```typescript
interface IOrganizationUser {
  _id: string;
  organizationId: string;
  email: string;
  userId?: string;              // null until user accepts invitation
  role: 'employee' | 'resolver' | 'manager' | 'admin';
  createdBy: string;
  inviteToken?: string;         // For invitation flow
  invitedAt?: Date;
  joinedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ticket Model
```typescript
interface ITicket {
  _id: string;
  trackingNumber: number;       // Auto-incremented
  title: string;
  description: string;
  category?: string;
  department?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_information' | 'resolved' | 'closed';
  assignedTo: string[];         // Array of user IDs
  createdBy: string;
  organizationId: string;
  tags?: string[];
  dueDate?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### TicketMessage Model
```typescript
interface ITicketMessage {
  _id: string;
  ticketId: string;
  role: 'user' | 'agent' | 'system' | 'resolver';
  content: string;
  userId: string;
  attachments?: string[];       // File URLs/paths
  isInternal?: boolean;         // Internal notes not visible to ticket creator
  createdAt: Date;
  updatedAt: Date;
}
```

### Department Model
```typescript
interface IDepartment {
  _id: string;
  name: string;
  organizationId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### KnowledgeBase Model
```typescript
interface IKnowledgeBase {
  _id: string;
  title: string;
  fileId?: string;              // Lyzr Studio file identifier
  fileName?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'url';
  fileUrl?: string;
  fileSize?: number;            // In bytes
  organizationId: string;
  uploadedBy: string;
  isActive: boolean;
  tags?: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## User Flows

### 1. Authentication Flow
1. User visits landing page
2. Clicks "Login with Lyzr Studio"
3. Lyzr authentication completes
4. System creates/updates user in MongoDB via `/api/auth/lyzr`
5. User is redirected to organizations page

### 2. Organization Selection Flow
1. User views all organizations they belong to
2. Organizations show user's role (employee, resolver, manager, admin)
3. User selects organization to enter dashboard
4. System updates user's `currentOrganization` field

### 3. Dashboard Access Control
Based on user role in the organization:
- **Employee**: Access to AI Assistant, Tickets (own tickets)
- **Resolver**: Access to AI Assistant, Tickets (assigned tickets)
- **Manager**: Access to AI Assistant, Tickets, Knowledge Base
- **Admin**: Full access to all sections including Organization management

### 4. Ticket Management Flow
1. Create ticket with title, description, category, priority
2. System auto-assigns tracking number
3. Smart routing assigns to appropriate department/resolver
4. Ticket moves through status workflow: open → in_progress → resolved → closed
5. Messages/replies are tracked in TicketMessage model

### 5. Organization Management Flow (Admin only)
1. Add users by email with specific roles
2. Create and manage departments
3. Configure system instructions for AI assistant
4. Manage knowledge base documents

### 6. Knowledge Base Management Flow (Manager/Admin)
1. Upload PDF/DOCX/TXT files
2. Files are processed by Lyzr Studio
3. System stores file metadata and Lyzr file ID
4. AI assistant uses knowledge base for context

## API Endpoints

### Authentication (v1)
- `POST /api/v1/auth/lyzr` - Create/update user from Lyzr authentication with full data sync

### User Management (v1)
- `GET /api/v1/user/organizations?userId={id}` - Get user's organizations with role info

### Organizations (v1)
- `POST /api/v1/organizations` - Create new organization with automatic API key integration
- `GET /api/v1/organizations/{id}` - Get organization details (Planned)
- `PUT /api/v1/organizations/{id}` - Update organization (Planned)
- `POST /api/v1/organizations/{id}/members` - Add member to organization (Planned)
- `PUT /api/v1/organizations/{id}/members/{userId}` - Update member role (Planned)

### Tickets (Planned)
- `GET /api/tickets` - List tickets (filtered by organization and role)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/{id}` - Get ticket details
- `PUT /api/tickets/{id}` - Update ticket
- `POST /api/tickets/{id}/messages` - Add message to ticket

### Knowledge Base (Planned)
- `GET /api/knowledge-base` - List knowledge base items
- `POST /api/knowledge-base` - Upload new document
- `DELETE /api/knowledge-base/{id}` - Remove document

## Environment Variables

```env
MONGODB_URI=
ENCRYPTION_KEY=
INTERNAL_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Design System

### Enhanced UI Components

#### **Sidebar (Supabase-style)**
- Lyzr logo with "HR Helpdesk" branding
- Organization picker with role badges
- Role-based navigation filtering
- User menu with avatar and profile access
- Smooth hover states and transitions
- Backdrop blur effects for modern look

#### **Header**
- Responsive organization picker for mobile
- User avatar with dropdown menu
- Theme switcher integration
- Consistent branding across devices

#### **AI Assistant Interface**
- Perplexity OSS inspired chat design
- Gradient background with noise texture
- Animated gradient that fades during conversation
- Starter questions for HR topics
- Auto-resizing chat input
- Message bubbles with timestamps
- Loading indicators with bounce animation

### Typography Scale
- **Page Title**: `text-3xl md:text-4xl font-bold`
- **Section Heading**: `text-xl md:text-2xl font-semibold`
- **Card Title**: `text-lg font-medium`
- **Body Text**: `text-base font-normal`
- **Muted Text**: `text-sm text-muted-foreground`

### Spacing Scale
- **Page Padding**: `p-4 md:p-6 lg:p-8`
- **Card Padding**: `p-6`
- **Element Spacing**: `gap-4` or `gap-6`
- **Section Spacing**: `py-8` or `py-12`

### Visual Effects
- **Gradient Background**: Subtle animated gradient using CSS variables
- **Backdrop Blur**: Modern glass-morphism effects
- **Noise Texture**: SVG-based subtle texture overlay
- **Smooth Transitions**: 200-300ms duration for hover states
- **Border Transparency**: `border-border/50` for softer edges

### Component Usage
- **Cards**: Glassmorphism with backdrop blur and subtle borders
- **Buttons**: Enhanced with proper focus states and animations
- **Navigation**: Sticky sidebar with role-based item filtering
- **Chat Interface**: Modern chat bubbles with proper message threading
- **Forms**: Clean inputs with subtle background colors

## Security Considerations

1. **Authentication**: Integrated with Lyzr Studio for secure authentication with full data sync
2. **Authorization**: Role-based access control at organization level with UI filtering
3. **Data Isolation**: All data scoped to organization context with proper user validation
4. **API Security**: 
   - Internal API key protection for sensitive endpoints
   - User validation middleware
   - Request authentication for all operations
5. **Encryption**: 
   - AES-256-CBC encryption for API keys
   - Environment-based encryption keys
   - Secure key derivation functions
6. **Database**: 
   - Proper indexing and query optimization
   - Schema versioning for future migrations
   - MongoDB ObjectId vs Lyzr ID handling
7. **API Versioning**: v1 API structure for future compatibility

## Recent Enhancements (v1.1)

### ✅ **Dashboard Polish**
- **Supabase-style Sidebar**: Modern design with Lyzr branding
- **Role-based Navigation**: Dynamic menu based on user permissions  
- **Organization Switching**: Seamless org switching with URL state
- **Enhanced Header**: Responsive design with mobile support

### ✅ **AI Assistant Polish**
- **Perplexity-inspired Interface**: Clean chat design with gradients
- **Background Effects**: Animated gradient with noise texture
- **Interactive Elements**: Starter questions for HR topics
- **Message Threading**: Proper chat bubbles with timestamps
- **Loading States**: Smooth animations and feedback

### ✅ **Security & Performance**
- **API Key Encryption**: Secure storage of Lyzr API keys
- **Enhanced Authentication**: Full Lyzr data synchronization
- **API Versioning**: v1 structure for future compatibility
- **Optimized Queries**: Improved organization lookup and caching

## Future Enhancements

1. **AI Integration**: Connect chat interface with Lyzr API for real responses
2. **Real-time Updates**: WebSocket integration for live ticket updates
3. **Advanced Analytics**: Reporting dashboard with metrics
4. **Email Integration**: Automatic email notifications
5. **Mobile App**: React Native companion app
6. **Third-party Integrations**: Slack, Microsoft Teams, etc.
7. **Advanced AI Features**: Sentiment analysis, auto-categorization
8. **Multi-language Support**: Internationalization
9. **Knowledge Base**: Document upload and AI-powered search
10. **Ticket System**: Complete ticket workflow implementation

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (copy `.env.example` to `.env.local`)
4. Configure MongoDB connection
5. Set up Lyzr Studio integration
6. Run development server: `npm run dev`

## Development Guidelines

1. **Code Quality**: Use TypeScript strictly, no `any` types
2. **Component Structure**: Follow shadcn/ui patterns
3. **State Management**: Use React Context for global state
4. **Error Handling**: Comprehensive error boundaries and try-catch blocks
5. **Performance**: Optimize with React.memo, useMemo, useCallback where needed
6. **Testing**: Write unit tests for utilities and integration tests for API routes
7. **Documentation**: Keep this document updated with schema and API changes

## Deployment

The application is designed to be deployed on:
- **Frontend**: Vercel, Netlify, or similar platform
- **Database**: MongoDB Atlas for production
- **Environment**: Node.js 18+ runtime

Ensure all environment variables are properly configured in the deployment platform.
