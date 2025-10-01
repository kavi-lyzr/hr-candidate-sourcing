# Lyzr HR Helpdesk

A comprehensive AI-powered HR support platform that enables organizations to automate employee support, manage tickets efficiently, and provide instant HR assistance with multi-organizational workflows.

## 🚀 Features

- **AI-Powered Assistant**: Instant HR support with intelligent responses
- **Smart Ticket Routing**: Automated assignment based on content and urgency  
- **Multi-Organization Support**: Manage multiple companies with role-based access
- **Knowledge Base Integration**: Centralized document repository with AI search
- **Role-Based Access Control**: Employee, Resolver, Manager, and Admin roles
- **Real-time Collaboration**: Live ticket updates and messaging

## 🛠 Tech Stack

- **Frontend**: Next.js 15, TypeScript, React 19
- **UI**: shadcn/ui components with Tailwind CSS v4
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Lyzr Studio Integration
- **Styling**: Modern design system with responsive layouts

## 📁 Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API Routes
│   ├── dashboard/            # Dashboard pages
│   ├── organizations/        # Organization selection
│   └── page.tsx             # Landing page
├── components/              # Reusable UI components
├── lib/                     # Utilities and configurations
│   ├── models/             # Mongoose models
│   ├── AuthProvider.tsx    # Authentication context
│   └── database.ts         # MongoDB connection
└── hooks/                   # Custom React hooks
```

## 🗄 Database Schema

### Core Models
- **User**: User accounts with Lyzr integration
- **Organization**: Company/organization data  
- **OrganizationUser**: Role-based user-organization mapping
- **Ticket**: Support tickets with auto-tracking
- **TicketMessage**: Conversation threads
- **Department**: Organizational departments
- **KnowledgeBase**: Document management

## 🔄 User Flows

### Authentication Flow
1. User visits landing page
2. Clicks "Login with Lyzr Studio" 
3. Lyzr authentication modal appears
4. System creates/updates user in database
5. Redirects to organizations page

### Organization Management
1. View organizations with user roles
2. Create new organizations
3. Manage members and departments
4. Configure AI assistant settings

### Ticket Management
1. Create tickets with smart categorization
2. Auto-routing to appropriate departments
3. Status tracking through workflow
4. Real-time messaging and updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Lyzr Studio account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lyzr-ai/hr-helpdesk.git
   cd hr-helpdesk
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   MONGODB_URI=mongodb://localhost:27017/lyzr-hr-helpdesk
   NEXT_PUBLIC_LYZR_PUBLIC_KEY=your_lyzr_public_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Visit the application**
   Open [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### MongoDB Setup
- Local: Use MongoDB Community Edition
- Cloud: MongoDB Atlas recommended for production

### Lyzr Studio Integration
- Get your public key from Lyzr Studio dashboard
- Configure authentication settings
- Set up AI assistant parameters

## 🏗 Architecture

### Authentication
- Lyzr Studio handles OAuth and user management
- Local database stores extended user profiles
- Role-based permissions per organization

### Multi-tenancy
- Organization-scoped data isolation
- Flexible role assignments
- Cross-organization user membership

### AI Integration
- Lyzr AI powers the HR assistant
- Knowledge base provides context
- Smart routing uses ML categorization

## 🎨 Design System

### Typography
- **Page Title**: `text-3xl md:text-4xl font-bold`
- **Section Heading**: `text-xl md:text-2xl font-semibold`  
- **Body Text**: `text-base font-normal`

### Layout
- Mobile-first responsive design
- Consistent spacing with Tailwind scale
- shadcn/ui component patterns

### Components
- Cards for information grouping
- Forms with validation
- Loading states and error handling

## 🚀 Deployment

### Recommended Platforms
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Environment**: Node.js 18+ runtime

### Environment Variables
Ensure all production environment variables are configured:
- Database connection strings
- Lyzr Studio API keys
- Security tokens

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@lyzr.ai
- 🐛 Issues: [GitHub Issues](https://github.com/lyzr-ai/hr-helpdesk/issues)
- 📖 Documentation: [Full Documentation](PROJECT_DOCUMENTATION.md)

## 🏢 About Lyzr

Lyzr is building the future of AI-powered business solutions. Learn more at [lyzr.ai](https://lyzr.ai).

---

**Built with ❤️ by the Lyzr team**