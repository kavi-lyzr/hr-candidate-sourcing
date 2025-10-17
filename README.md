# Lyzr HR Candidate Sourcing Agent

An AI-powered web application that revolutionizes talent sourcing for HR professionals and recruiters. Built with Next.js and powered by Lyzr AI agents, this platform provides intelligent candidate search, evaluation, and management capabilities.

## What It Does

This application helps streamline the recruitment process through:

### Core Features

**AI-Powered Candidate Search**
- Natural language queries to find candidates on LinkedIn
- Intelligent filtering by job titles, companies, locations, and skills
- Real-time streaming results with AI-powered summaries

**Candidate Matching & Evaluation**
- Upload job descriptions and get AI-powered candidate rankings
- Automated scoring based on profile relevance and experience match
- Detailed rationale for each candidate recommendation

**Profile Management**
- Save and organize candidate profiles for future reference
- Group profiles by search sessions for better organization
- Quick access to candidate details and LinkedIn profiles

**Job Description Library**
- Create, edit, and manage job descriptions
- Attach JDs to candidate searches for better matching
- Centralized storage for consistent hiring criteria

### Technical Highlights

- **AI Agents**: Specialized Lyzr agents for sourcing and matching tasks
- **Real-time Updates**: Server-sent events for streaming AI responses
- **Modern UI**: Responsive design with shadcn/ui components
- **Type Safety**: Full TypeScript implementation
- **Database**: MongoDB with Mongoose ODM for data persistence

## Self-Hosting Instructions

### Prerequisites

- Node.js 18+
- MongoDB database
- Lyzr AI account and API credentials
- LinkedIn data API access (RapidAPI)

### Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/lyzr-hr-sourcing

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LinkedIn API (via RapidAPI)
RAPID_API_BASE=fresh-linkedin-profile-data.p.rapidapi.com
RAPID_API_KEY=your_rapid_api_key

# Authentication
API_AUTH_TOKEN=your_secure_auth_token
NEXT_PUBLIC_API_AUTH_TOKEN=same_as_above
ENCRYPTION_KEY=your_32_character_encryption_key
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lyzr-hr-candidate-sourcing
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   - Ensure MongoDB is running locally or update `MONGODB_URI` for your database
   - The application will automatically create required collections on first run

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   Open [http://localhost:3000](http://localhost:3000) in your browser

### Production Deployment

For production deployment:

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

3. **Set up a reverse proxy** (nginx, Apache, or similar) to handle SSL termination and routing

4. **Configure environment variables** for your production environment

### API Dependencies

The application requires:
- **LinkedIn API**: For candidate profile data (via RapidAPI)
- **MongoDB**: For data persistence

Ensure all API keys and credentials are properly configured before running the application.

## Getting Started

Once running, the application provides a clean interface for:

1. **Searching candidates** using natural language queries
2. **Managing job descriptions** in the JD Library
3. **Saving and organizing** candidate profiles
4. **Matching candidates** against job requirements

The AI agents will guide you through the process, making candidate sourcing more efficient and effective.
