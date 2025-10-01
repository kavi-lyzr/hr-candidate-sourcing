# Lyzr AI Frontend Design & Vibe Coding Guide

This document outlines the design system, principles, and component usage guidelines for building premium, intuitive, and polished user interfaces for Lyzr AI. This guide should serve as the primary instruction set for developing frontend features. The core philosophy is **intentional design**: every choice, from component selection to spacing, must be deliberate and user-centric.

Our tech stack is **Next.js**, **TypeScript**, **Tailwind CSS v4**, and **shadcn/ui**. All file paths should reference the project structure, using the `@` alias defined in `components.json`.

## Core Design Principles

Before writing any code, adhere to these foundational principles:

1.  **User-Centric & Intuitive**: The primary goal is to minimize cognitive load. Interfaces should be self-explanatory. User flows must be optimized for the fewest clicks and least amount of thought. Always ask: "What is the user trying to achieve, and how can we make it effortless?"
2.  **Clarity & Consistency**: A consistent visual language builds trust and makes the application predictable. Spacing, typography, and component behavior must be uniform across the entire platform. Refer to the specific guidelines below for typography and spacing scales.
3.  **Mobile-First Responsiveness**: All designs must begin with the mobile viewport and scale up gracefully. Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`) to adapt layouts. Functionality should never be compromised on smaller screens; instead, adapt components to fit the context (e.g., using a `Select` instead of `Tabs`).
4.  **Premium Aesthetics**: We are not just building a functional tool; we are crafting a premium experience. This is achieved through meticulous attention to detail: ample whitespace, a balanced typographic hierarchy, subtle animations, and a polished finish on every component.

-----

## Layout & Structure

Structure is the backbone of the UI. Use `flexbox` for most layouts and `grid` for more complex, two-dimensional arrangements.

  * **Overall Page Layout**: A standard page should consist of a primary sidebar (`@/components/app-sidebar.tsx`) and a main content area. The main content area should have consistent horizontal padding to ensure content doesn't touch the screen edges.
    ```css
    /* Example structure */
    <div class="flex h-screen">
      <AppSidebar />
      <main class="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
        {/* Page content goes here */}
      </main>
    </div>
    ```
  * **Flexbox**: Use `flex` for most component compositions.
      * Use `flex flex-col` for vertically stacked items like form fields, card content, or sections.
      * Use `flex flex-row` for horizontally aligned items like buttons in a form footer, items in a header, or icon-label pairs.
      * Use `gap-*` utilities extensively for consistent spacing between elements within a flex container. Avoid using margins for this purpose.
  * **Grid**: Use `grid` when you need to align items in a two-dimensional structure, such as a dashboard with multiple cards of varying sizes or a complex settings page.
  * **Sidebar Navigation**: The order of items in `@/components/app-sidebar.tsx` must be logical and prioritized based on user workflow. The most frequent and critical tasks (e.g., "Dashboard," "Chatbots") should be at the top. Secondary or settings-related items ("API Keys," "Settings," "Logout") should be grouped and placed at the bottom.

-----

## Spacing & Typography

Consistency here is non-negotiable. These are not suggestions but rules. The base font is **Switzer**, as defined in `@/app/globals.css`.

### Spacing

We use Tailwind's default spacing scale (multiples of 0.25rem).

| Use Case | Tailwind Class | Notes |
| :--- | :--- | :--- |
| **Page Padding** | `p-4 md:p-6 lg:p-8` | Creates breathing room around the main content. |
| **Card Padding** | `p-6` | Consistent internal padding for all `Card` components. |
| **Inter-Element (Vertical)** | `gap-4` or `gap-6` | Use in `flex-col` containers for spacing between form fields, text blocks, etc. |
| **Inter-Element (Horizontal)**| `gap-2` or `gap-4` | Use in `flex-row` containers for icons and text, or adjacent buttons. |
| **Section Spacing** | `py-8` or `py-12` | Larger vertical spacing to separate distinct sections on a page. |

### Typography

Establish a clear visual hierarchy using this scale.

| Use Case | Tailwind Class | Font Weight | Notes |
| :--- | :--- | :--- | :--- |
| **Page Title** | `text-3xl` or `text-4xl` | `font-bold` | Use once per page for the main `H1`. |
| **Section Heading** | `text-xl` or `text-2xl` | `font-semibold` | For major sections within a page (`H2`). |
| **Card Title** | `text-lg` | `font-medium` | For titles inside `@/components/ui/card.tsx`. |
| **Body Text** | `text-base` | `font-normal` | The default for all paragraphs and general text. |
| **Subtle/Muted Text** | `text-sm text-muted-foreground`| `font-normal` | For helper text, captions, or secondary information. |
| **Button/Label Text** | `text-sm` | `font-medium` | For all buttons and form labels. |

-----

## Component Patterns & Best Practices

This section details how to combine components to solve common UI problems.

### Forms & Inputs

  * **Structure**: Always wrap forms or groups of related inputs in a `@/components/ui/card.tsx` for clear visual grouping.
  * **Layout**: Use `flex flex-col gap-4` for the main form structure. Each form element should consist of a `@/components/ui/label.tsx`, the `@/components/ui/input.tsx` (or `select`, `textarea`, etc.), and optionally, a muted helper text below the input.
  * **Actions**: Form action buttons (`@/components/ui/button.tsx`) should be placed at the bottom, typically right-aligned. The primary action (e.g., "Save") should be solid, while secondary actions (e.g., "Cancel") should have the `variant="outline"` or `variant="ghost"`.

### Responsive Navigation

  * **Problem**: A navigation bar with many items (e.g., 5+ tabs) looks cluttered on mobile.
  * **Solution**:
    1.  On **desktop and tablet** (`md:` breakpoint and up), use the `@/components/ui/tabs.tsx` component for clear, one-click access.
    2.  On **mobile** (screens smaller than `md:`), hide the `Tabs` component and show a `@/components/ui/select.tsx` component instead. Populate the `Select` with the same navigation items. This provides a familiar, space-efficient, and native-feeling mobile experience.

### Data Display

  * **Tables**: For dense, structured data (e.g., logs, user lists, billing history), use the `@/components/ui/table.tsx`. Ensure it's wrapped in a responsive container to allow horizontal scrolling on small screens if needed.
  * **Cards**: For less dense, more visual information (e.g., a list of projects, chatbot previews), use a `grid` of `@/components/ui/card.tsx` components. This allows for more flexible and visually engaging layouts.

### Icons

  * Use icons from `lucide-react` as specified in `components.json`.
  * Icons inside buttons or next to labels should be small (`size={16}` or `className="h-4 w-4"`).
  * Maintain a `gap-2` between an icon and its corresponding text.

-----

## Available Component Library

The following components are available for use. Prioritize using these existing components over creating new ones to maintain consistency.

### UI Components (from shadcn)

  * `@/components/ui/accordion.tsx`
  * `@/components/ui/alert-dialog.tsx`
  * `@/components/ui/alert.tsx`
  * `@/components/ui/aspect-ratio.tsx`
  * `@/components/ui/avatar.tsx`
  * `@/components/ui/badge.tsx`
  * `@/components/ui/breadcrumb.tsx`
  * `@/components/ui/button.tsx`
  * `@/components/ui/calendar.tsx`
  * `@/components/ui/card.tsx`
  * `@/components/ui/carousel.tsx`
  * `@/components/ui/chart.tsx`
  * `@/components/ui/checkbox.tsx`
  * `@/components/ui/collapsible.tsx`
  * `@/components/ui/command.tsx`
  * `@/components/ui/context-menu.tsx`
  * `@/components/ui/dialog.tsx`
  * `@/components/ui/drawer.tsx`
  * `@/components/ui/dropdown-menu.tsx`
  * `@/components/ui/form.tsx`
  * `@/components/ui/hover-card.tsx`
  * `@/components/ui/input-otp.tsx`
  * `@/components/ui/input.tsx`
  * `@/components/ui/label.tsx`
  * `@/components/ui/menubar.tsx`
  * `@/components/ui/navigation-menu.tsx`
  * `@/components/ui/pagination.tsx`
  * `@/components/ui/popover.tsx`
  * `@/components/ui/progress.tsx`
  * `@/components/ui/radio-group.tsx`
  * `@/components/ui/resizable.tsx`
  * `@/components/ui/scroll-area.tsx`
  * `@/components/ui/select.tsx`
  * `@/components/ui/separator.tsx`
  * `@/components/ui/sheet.tsx`
  * `@/components/ui/skeleton.tsx`
  * `@/components/ui/slider.tsx`
  * `@/components/ui/sonner.tsx`
  * `@/components/ui/switch.tsx`
  * `@/components/ui/table.tsx`
  * `@/components/ui/tabs.tsx`
  * `@/components/ui/textarea.tsx`
  * `@/components/ui/toggle-group.tsx`
  * `@/components/ui/toggle.tsx`
  * `@/components/ui/tooltip.tsx`

### Custom Application Components

  * `@/components/app-sidebar.tsx`
  * `@/components/chart-area-interactive.tsx`
  * `@/components/data-table.tsx`
  * `@/components/nav-documents.tsx`
  * `@/components/nav-main.tsx`
  * `@/components/nav-secondary.tsx`
  * `@/components/nav-user.tsx`
  * `@/components/section-cards.tsx`
  * `@/components/site-header.tsx`

# Lyzr HR Sourcing Agent: Comprehensive Technical Documentation

## 1. Project Overview & Vision

### 1.1. Mission

To build a production-grade, AI-native web application that revolutionizes talent sourcing. The application will leverage the power of Lyzr AI Agents to provide an intuitive, conversational, and efficient candidate sourcing, management, and evaluation experience for HR professionals and recruiters.

### 1.2. Core Philosophy & Design Principles

This project must strictly adhere to the **Lyzr AI Frontend Design & Vibe Coding Guide (`design-guidelines.mdc`)**.

- **User-Centric & Intuitive:** The primary goal is to minimize cognitive load. The UI must be self-explanatory and seamless.
- **Clarity & Consistency:** Use the established `shadcn/ui` component library with Lyzr's custom theme. Spacing, typography, and component behavior must be uniform.
- **Premium Aesthetics:** Craft a premium experience through meticulous attention to detail, ample whitespace, and polished component finishes.
- **UX Mandates:**
    - **Loading States:** All asynchronous operations (API calls, agent interactions) MUST display clear loading states to the user (e.g., skeleton loaders, spinners). Loading animations must be consistent across the app.
    - **Animations:** Use subtle, tasteful animations for transitions and state changes to provide a fluid user experience.
        

## 2. System Architecture

### 2.1. Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Component Library:** `shadcn/ui`
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** Lyzr Auth SDK
- **AI Backend:** Lyzr AI SDK

### 2.2. Real-time Architecture: Tool-to-Frontend Binding

To avoid inefficient database polling, the application will use **Server-Sent Events (SSE)** to provide real-time updates from backend tool calls to the frontend.

**Workflow:**

1. **Initiation:** The frontend calls a dedicated API route (e.g., `/api/chat/start-search`) with the user's query.
2. **Acknowledgement:** The backend immediately creates a unique `sessionId`, returns it to the frontend, and triggers the Lyzr Agent in a non-blocking background process.
3. **Subscription:** The frontend uses the received `sessionId` to open an SSE connection to a streaming endpoint (e.g., `/api/chat/stream/[sessionId]`).
4. **Tool Execution:** The Lyzr Agent calls the backend tool (e.g., `/api/tools/search_candidates`).
5. **Publication:** Upon completion, the tool's backend logic publishes its result to a channel associated with the `sessionId` (using an in-memory pub/sub or Redis).
6. **Streaming:** The SSE endpoint, subscribed to the channel, streams the data directly to the listening frontend, which then updates the UI.
    

### 2.3. AI Agent Architecture

#### 2.3.1. Sourcing Agent

- **Purpose:** Understands a user's hiring needs and finds relevant candidates from LinkedIn.
    
- **Lyzr Agent Definition:**
    
    ```
    {
        "name": "HR Sourcing Agent",
        "description": "An intelligent AI agent that understands natural language recruiting queries, searches for candidates on LinkedIn, and presents a summarized list of top profiles.",
        "agent_role": "You are an Expert Technical Recruiter and Talent Sourcer. Your mission is to understand a user's requirements for a job role, translate them into effective search criteria, and find the most relevant candidates.",
        "agent_instructions": "You are an expert AI Talent Sourcer. Your goal is to help users find the best candidates for their job openings. You must continue working until this goal is fully achieved. NEVER create artifacts; your output must only be text.\n\n**Workflow:**\n1.  Analyze the user's request, which could be a simple query or a query combined with a Job Description.\n2.  Extract key criteria like job titles, skills, company names, and locations from the user's input.\n3.  Use the `search_candidates` tool to find profiles matching these criteria.\n4.  After the tool returns a list of summarized candidate profiles, review them.\n5.  Present the most promising candidates to the user in a concise, helpful summary. For each candidate you mention, you MUST format their name as a Markdown link, using their full name as the text and their `public_id` as the URL. Example: `[Elizabeth Waller](elizabeth-waller-11b53121)`.\n\n**CRITICAL CONTEXT:**\n- You must use the provided list of geographical locations and their IDs for the `geo_codes` parameter. The available locations are: {{ available_locations }}.\n- If a location is not on the list, politely inform the user about this limitation.\n- Current date and time is: {{ datetime }}.",
        "agent_goal": "To relentlessly analyze user requirements and leverage the search tool until a satisfactory list of high-quality candidate profiles is found and presented to the user, ensuring the sourcing task is completed.",
        "tools": ["openapi-hr_sourcing_api-search_candidates"]
    }
    ```
    

#### 2.3.2. Matching Agent

- **Purpose:** Evaluates a set of candidates against a specific job description.
    
- **Lyzr Agent Definition:**
    
    ```
    {
        "name": "Candidate Matching Agent",
        "description": "An analytical AI agent that evaluates a list of saved candidate profiles against a specific Job Description to rank them and provide a rationale for each match.",
        "agent_role": "You are an Expert Hiring Manager. Your specialty is in meticulously evaluating candidate profiles against the specific requirements of a Job Description to identify the best fits.",
        "agent_instructions": "You are an expert AI Hiring Manager. Your task is to analyze and rank a set of candidates for a specific job role. You must continue this task until a complete, ranked list is generated. NEVER create artifacts.\n\n**Workflow:**\n1.  You will be provided with the full text of a Job Description and a list of candidate profiles.\n2.  Your SOLE task is to use the `rank_candidates` tool, passing the job description and all candidate profiles to it.\n3.  The tool will return a ranked list.\n4.  Present this ranked list to the user in a clear, easy-to-read format, starting with the top-ranked candidate. For each candidate, clearly state their name, rank/score, and the summary provided by the tool.",
        "agent_goal": "To meticulously analyze all provided candidates against the job description and use the ranking tool to produce a complete, justified, and ranked list, ensuring the evaluation task is fully completed.",
        "tools": ["openapi-hr_sourcing_api-rank_candidates"]
    }
    ```
    

#### 2.3.3. OpenAPI 3.0 Tool Schema

```
{
    "openapi": "3.0.0",
    "info": {
        "title": "HR Sourcing & Matching API",
        "version": "1.0.0",
        "description": "A unified API for the HR Sourcing Agent. It provides tools to search for candidates on LinkedIn and to rank a set of candidates against a job description."
    },
    "servers": [{"url": "https://<your_app_url>.com/"}],
    "paths": {
        "/api/tools/search_candidates": {
            "post": {
                "summary": "Search for candidate profiles on LinkedIn",
                "description": "Translates natural language queries into structured filters to search for candidates. The backend will process the raw results and return a summarized, LLM-friendly list of profiles.",
                "operationId": "search_candidates",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "keywords": {"type": "string", "description": "General keywords to search for in profiles."},
                                    "title_keywords": {"type": "array", "items": { "type": "string" }, "description": "Keywords that must appear in the job title."},
                                    "current_company_names": {"type": "array", "items": { "type": "string" }, "description": "An array of company names where the candidate is currently employed."},
                                    "past_company_names": {"type": "array", "items": { "type": "string" }, "description": "An array of company names where the candidate has worked in the past."},
                                    "geo_codes": {"type": "array", "items": { "type": "string" }, "description": "Array of LinkedIn geo IDs to include in the search."},
                                    "limit": {"type": "integer", "description": "The maximum number of candidates to fetch.", "default": 25}
                                }
                            }
                        }
                    }
                },
                "responses": {"200": {"description": "Successfully retrieved candidate profiles."}}
            }
        },
        "/api/tools/rank_candidates": {
            "post": {
                "summary": "Rank candidates against a Job Description",
                "description": "Takes a job description and a list of candidate profiles, then returns a ranked list with scores and justifications.",
                "operationId": "rank_candidates",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["job_description", "candidate_profiles"],
                                "properties": {
                                    "job_description": {"type": "string", "description": "The full text content of the Job Description."},
                                    "candidate_profiles": {
                                        "type": "array", "description": "An array of candidate profile objects.",
                                        "items": {"type": "object"}
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {"200": {"description": "Successfully ranked the candidates."}}
            }
        }
    }
}
```

## 3. Database Schema (Mongoose)

All collections must use `camelCase` and include `timestamps: true`.

- **`users`**:
    
    - `lyzrUserId`: String, required, unique, index
    - `email`: String, required, unique
    - `displayName`: String, required
    - `sourcingAgentId`: String, required
    - `matchingAgentId`: String, required
    - `schemaVersion`: Number, default: 1
        
- **`candidateProfiles`** (Caches raw LinkedIn data):
    
    - `publicId`: String, required, unique, index
    - `rawData`: mongoose.Schema.Types.Mixed, required
    - `lastFetchedAt`: Date, default: Date.now
    - `schemaVersion`: Number, default: 1
- **`jobDescriptions`**:
    
    - `user`: ObjectId, ref: 'User', required, index
    - `title`: String, required
    - `content`: String, required
    - `schemaVersion`: Number, default: 1
- **`searchSessions`**:
    
    - `user`: ObjectId, ref: 'User', required, index
    - `initialQuery`: String, required
    - `attachedJd`: ObjectId, ref: 'JobDescription'
    - `conversationHistory`: Array of `{ role: String, content: String, timestamp: Date }`
    - `schemaVersion`: Number, default: 1
- **`savedProfiles`**:
    
    - `user`: ObjectId, ref: 'User', required, index
    - `candidate`: ObjectId, ref: 'CandidateProfile', required
    - `searchSession`: ObjectId, ref: 'SearchSession', required, index
    - `schemaVersion`: Number, default: 1
    - _Compound unique index on `['user', 'candidate', 'searchSession']`_
- **`analyticsEvents`**:
    
    - `user`: ObjectId, ref: 'User', required, index
    - `eventType`: String, required, enum: `['USER_LOGIN', 'CANDIDATE_SEARCH_INITIATED', 'PROFILE_SAVED', 'MATCHING_COMPLETED', etc.]`
    - `metadata`: mongoose.Schema.Types.Mixed
    - _`createdAt` timestamp only_

## 4. Phased Implementation Plan

### Phase 1: Project Setup & Core UI Shell

1. Initialize Next.js project with TypeScript and Tailwind CSS.
2. Set up `shadcn/ui` and configure the Lyzr theme.
3. Create the main application layout: `(components/layout)` including a static (non-functional) `AppSidebar` and `SiteHeader`.
4. Set up MongoDB connection using Mongoose.
5. Define all Mongoose models as specified in Section 3.
    

### Phase 2: Authentication & User Onboarding

1. Integrate the Lyzr Auth SDK for user login.
2. Create a backend API route that triggers on the first successful login.
3. This route will:
    - Retrieve user details from the SDK.
    - Create the Sourcing and Matching agents via the Lyzr AI SDK.
    - Save a new document in the `users` collection with the `lyzrUserId`, `email`, and the new agent IDs.
4. Implement basic analytics by logging a `USER_LOGIN` event.
    

### Phase 3: JD Library (CRUD)

1. Build the UI for the `/jd-library` page.
2. Implement "Create New JD" functionality (form and modal).
3. Implement "View," "Edit," and "Delete" functionality for existing JDs.
4. Create the necessary API routes (`/api/jds`) to handle all CRUD operations.
    

### Phase 4: Sourcing Flow - Backend & Real-time Layer

1. Implement the Server-Sent Events (SSE) infrastructure:
    - Create the `/api/chat/start-search` endpoint.
    - Create the `/api/chat/stream/[sessionId]` endpoint.
    - Set up a simple in-memory pub/sub event emitter.
2. Build the `/api/tools/search_candidates` tool endpoint. This function will:
    - Receive search parameters from the Lyzr Agent.
    - Call the external RapidAPI for LinkedIn.
    - For each profile returned, check if it exists in the `candidateProfiles` collection (by `publicId`). If not, create it.
    - Pre-process the raw data into a concise, LLM-friendly format.
    - Publish the processed results to the `sessionId` channel.

### Phase 5: Sourcing Flow - Frontend

1. Build the UI for the `/search-candidates` page.
2. Implement the client-side logic to call `/api/chat/start-search`, get the `sessionId`, and subscribe to the SSE stream.
3. As data arrives from the SSE stream, render the candidate profiles in the UI. Use skeleton components while waiting for the first results.
4. Implement the "Save Profile" button logic, which will call an API route to create a new document in the `savedProfiles` collection.

### Phase 6: Saved Profiles & Matching Flow

1. Build the UI for the `/saved-profiles` page, fetching and displaying profiles grouped by `searchSession`.
2. Build the UI for the `/candidate-matching` page with dropdowns for selecting a JD and multi-select for saved profiles.
3. Implement the `/api/tools/rank_candidates` tool endpoint.
4. Connect the "Match Candidates" button to the SSE flow (similar to Phase 4) to trigger the Matching Agent and stream back the ranked results.
    

### Phase 7: Final Polish & Analytics

1. Integrate analytics event logging for all key user actions (`PROFILE_SAVED`, `MATCHING_INITIATED`, etc.).
2. Thoroughly review the application for responsiveness and adherence to the design guide.
3. Refine all loading states, transitions, and animations.
4. Implement the notification system (toasts) for actions like "Profile Saved".