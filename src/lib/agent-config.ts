export const LATEST_SOURCING_AGENT_VERSION = '1.8.3';
export const LATEST_MATCHING_AGENT_VERSION = '1.8.3';
export const LATEST_TOOL_VERSION = '1.8.0';

export const SOURCING_AGENT_CONFIG = {
    agentType: 'sourcing',
    name: "HR Sourcing Agent",
    description: "An intelligent AI agent that understands natural language recruiting queries, searches for candidates on LinkedIn, and presents a summarized list of top profiles.",
    agent_role: "You are an Expert Technical Recruiter and Talent Sourcer. Your mission is to understand a user's requirements for a job role, translate them into effective search criteria, and find the most relevant candidates.",
    agent_instructions: `You are an expert AI Talent Sourcer working for {{ user_name }}. Your goal is to help users find the best candidates for their job openings. You must continue working until this goal is fully achieved. NEVER create artifacts; your output must only be text.

**Workflow:**
1. Analyze the user's request, which could be a simple query or a query combined with a Job Description.
2. Extract key criteria like job titles, skills, company names, and locations from the user's input.
3. If sufficient information is not available, ask the user for more details before performing the search.
4. Use the \`search_candidates\` tool to find profiles matching these criteria, once you have sufficient information. If the tool returns 0 profiles, try calling the tool again with more simple parameters.
5. After the tool returns a list of candidate profiles, review them carefully.
6. Present the most promising candidates to the user in a concise, helpful summary. For each candidate you mention, you MUST format their name as a Markdown link, using their full name as the text and their \`profile_url\` as the URL. Example: \`[Elizabeth Waller](https://www.linkedin.com/in/elizabeth-waller-11b53121)\`.

IMPORTANT: NEVER HALLUCINATE THE PROFILES. DO NOT MAKE UP ANY INFORMATION. USE ONLY THE INFORMATION RETURNED BY THE TOOL.
If you're unable to call the tool, inform the user that you're currently facing a technical issue.
The tool if works correctly, will return information about the candidates immediately. DON'T mislead the user by saying that the tool is still working or if they'll get the results soon. If something goes wrong, don't mislead the user saying you will do it, instead admit that you have a technical issue and that they can try searching again.
DO NOT SHOW / RECOMMEND PROFILES NOT RETURNED BY THE TOOL. Don't confuse between the tool information available in your prompt and the tools you have access to (sometimes in rare cases the tools aren't binded, this issue is being fixed)
You do not have to let the user know about tools and this internal working. Avoid mentioning technical details in your response.

**CRITICAL: How to Format Candidate Links:**
- Each profile has a \`profile_url\` field that is ALWAYS present
- The URL is either a LinkedIn profile, or a Google search if LinkedIn isn't available
- Format: \`[Full Name](profile_url)\`
- Example: If a candidate has \`name: "John Doe"\` and \`profile_url: "https://www.linkedin.com/in/john-doe-123"\`, format as: \`[John Doe](https://www.linkedin.com/in/john-doe-123)\`
- Don't output any other markdown apart from the candidate links.

**HOW TO USE THE search_candidates TOOL:**
The tool accepts these parameters:
- \`session_id\` (REQUIRED, string): **CRITICAL** - Always use {{ session_id }} from your context
- \`keywords\` (REQUIRED, string): Main search terms (e.g., "React developer", "Data Scientist Python", "Full Stack Engineer")
- \`title_keywords\` (optional, array of strings): Keywords for job titles (e.g., ["Software Engineer", "Developer"])
- \`current_company_names\` (optional, array of strings): Current employers (e.g., ["Google", "Microsoft"])
- \`past_company_names\` (optional, array of strings): Previous employers (e.g., ["Amazon", "Meta"])
- \`geo_codes\` (optional, array of strings): Location IDs from the available locations list below
- \`limit\` (optional, number): Max candidates to return (default: 25)

**Example Tool Calls:**
1. For "React developers in Bangalore with 2+ years": 
   \`\`\`
   {
     "session_id": "{{ session_id }}",
     "keywords": "React developer 2 years experience",
     "title_keywords": ["React Developer", "Frontend Engineer", "Software Engineer"],
     "geo_codes": ["112376381"]
   }
   \`\`\`

2. For "Data Scientists at Google in USA":
   \`\`\`
   {
     "session_id": "{{ session_id }}",
     "keywords": "Data Scientist machine learning",
     "current_company_names": ["Google"],
     "geo_codes": ["103644278"]
   }
   \`\`\`

**IMPORTANT:** You MUST always include \`session_id\` with the value {{ session_id }} in every tool call.

**CRITICAL CONTEXT:**
- Available locations with their IDs: {{ available_locations }}
- If a location is not on the list, use the closest available location or politely inform the user. Support for more locations is coming soon.
- Current date and time is: {{ datetime }}.
- The user's name is: {{ user_name }}.
`,
    agent_goal: "To relentlessly analyze user requirements and leverage the search tool until a satisfactory list of high-quality candidate profiles is found and presented to the user, ensuring the sourcing task is completed.",
    tool: "",
//     tool_usage_description: `{
//   "{{TOOL_SEARCH_CANDIDATES}}": [
//     "Use this tool when the user asks to find, search, or source candidates. Extract relevant criteria from the user's query such as job titles, skills, companies, and locations. Always call this tool when you need to find candidate profiles matching specific requirements"
//   ]
// }`,
    features: [
        {
            type: "MEMORY",
            config: {
                max_messages_context_count: 50
            },
            priority: 0
        }
    ],
    model: 'gpt-4.1',
    provider_id: 'OpenAI',
    llm_credential_id: 'lyzr_openai',
    temperature: 0.5,
    top_p: 0.9,
    response_format: { "type": "text" },
    managed_agents: []
};

export const MATCHING_AGENT_CONFIG = {
    agentType: 'matching',
    name: "Candidate Matching Agent",
    description: "An analytical AI agent that evaluates candidate profiles against a Job Description and returns structured ranking data.",
    agent_role: "You are an Expert Hiring Manager. Your specialty is in meticulously evaluating candidate profiles against the specific requirements of a Job Description to identify the best fits.",
    agent_instructions: `You are an expert AI Hiring Manager working for {{ user_name }}. Your task is to analyze and rank a set of candidates for a specific job role based on the provided job description and candidate profiles.

**Context:**
- Job Description: {{ job_description }}
- Candidate Profiles: {{ candidate_profiles }}
- Current date and time: {{ datetime }}
- User name: {{ user_name }}

**Your Task:**
1. Analyze each candidate profile against the job description requirements
2. Rank all candidates from best fit to least fit
3. For each candidate, provide a summary explaining why they would be a good fit or any relevant experience
4. Return the results in the specified JSON format

**Ranking Criteria:**
- Experience relevance and years
- Skills alignment with job requirements
- Education background
- Company experience (current/past)
- Overall profile strength
- Cultural fit indicators

You must ALWAYS return output in structured output, in the response_format that is defined. Do not create any artifacts. Do not reply in text or ask for any clarifcations.
`,
    agent_goal: "To meticulously analyze all provided candidates against the job description and produce a complete, justified, and ranked list with detailed explanations.",
    tool: "",
    features: [
        {
            type: "MEMORY",
            config: {
                max_messages_context_count: 50
            },
            priority: 0
        }
    ],
    model: 'gpt-4.1',
    provider_id: 'OpenAI',
    llm_credential_id: 'lyzr_openai',
    temperature: 0.3,
    top_p: 0.9,
    response_format: {
        type: "json_schema",
        json_schema: {
            name: "candidate_ranking",
            strict: true,
            schema: {
                type: "object",
                properties: {
                    ranked_candidates: {
                        type: "array",
                        description: "Array of candidates ranked from best fit to least fit",
                        items: {
                            type: "object",
                            properties: {
                                rank: {
                                    type: "integer",
                                    description: "Ranking position (1 = best fit, 2 = second best, etc.)",
                                    minimum: 1
                                },
                                candidate_id: {
                                    type: "string",
                                    description: "MongoDB ObjectId of the candidate profile (24 hex characters)",
                                    pattern: "^[a-fA-F0-9]{24}$"
                                },
                                match_score: {
                                    type: "number",
                                    description: "Match score from 0-100 (100 = perfect match)",
                                    minimum: 0,
                                    maximum: 100
                                },
                                summary: {
                                    type: "string",
                                    description: "Detailed explanation of why this candidate is a good fit, highlighting relevant experience and qualifications"
                                },
                                key_strengths: {
                                    type: "array",
                                    description: "Array of key strengths that make this candidate suitable for the role",
                                    items: {
                                        type: "string",
                                        description: "A single key strength"
                                    },
                                    minItems: 0
                                },
                                potential_concerns: {
                                    type: "array",
                                    description: "Array of potential concerns or gaps in the candidate's profile",
                                    items: {
                                        type: "string",
                                        description: "A single potential concern"
                                    },
                                    minItems: 0
                                }
                            },
                            required: [
                                "rank",
                                "candidate_id",
                                "match_score",
                                "summary",
                                "key_strengths",
                                "potential_concerns"
                            ],
                            additionalProperties: false
                        }
                    }
                },
                required: ["ranked_candidates"],
                additionalProperties: false
            }
        }
    },
    managed_agents: []
};

export const tools = {
    "openapi": "3.0.0",
    "info": {
        "title": "HR Sourcing & Matching API",
        "version": "1.1.0",
        "description": "A unified API for the HR Sourcing Agent. It provides tools to search for candidates on LinkedIn, rank candidates, and generate profile summaries."
    },
    "servers": [
        {
            "url": "https://<your_app_url>.com/",
            "description": "Production Server"
        }
    ],
    "paths": {
        "/api/tools/search_candidates": {
            "post": {
                "summary": "Search for candidate profiles on LinkedIn",
                "description": "Searches for candidates matching the specified criteria. Returns a list of profiles with AI-generated summaries relevant to the search context. Only keywords is required - all other parameters are optional and will use suitable defaults.",
                "operationId": "search_candidates",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "keywords",
                                    "session_id"
                                ],
                                "properties": {
                                    "session_id": {
                                        "type": "string",
                                        "description": "The session ID for this search. CRITICAL: You must pass the session_id from your system context."
                                    },
                                    "keywords": {
                                        "type": "string",
                                        "description": "General keywords to search for in profiles."
                                    },
                                    "title_keywords": {
                                        "type": "array",
                                        "items": { "type": "string" },
                                        "description": "Keywords that must appear in the job title. Optional - defaults to empty array if not provided."
                                    },
                                    "current_company_names": {
                                        "type": "array",
                                        "items": { "type": "string" },
                                        "description": "An array of company names where the candidate is currently employed. Optional - defaults to empty array if not provided."
                                    },
                                    "past_company_names": {
                                        "type": "array",
                                        "items": { "type": "string" },
                                        "description": "An array of company names where the candidate has worked in the past. Optional - defaults to empty array if not provided."
                                    },
                                    "geo_codes": {
                                        "type": "array",
                                        "items": { "type": "string" },
                                        "description": "Array of LinkedIn geo IDs to include in the search. Use the available_locations provided in your system context. Optional - defaults to empty array if not provided."
                                    },
                                    "limit": {
                                        "type": "integer",
                                        "description": "The maximum number of candidates to fetch. Optional - defaults to 25 if not provided."
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successfully retrieved and summarized candidate profiles."
                    },
                    "400": {
                        "description": "Bad request due to missing required fields."
                    },
                    "500": {
                        "description": "Internal server error during search."
                    }
                }
            }
        }
    }
};

export const TOOL_CONFIG = {
    toolName: 'hr_sourcing_api',
    openapi_schema: tools,
};

// --- LEGACY CODE ---

// export const PROFILE_SUMMARY_AGENT_CONFIG = {
//     agentType: 'profile_summary',
//     name: "Profile Summary Agent",
//     description: "An AI agent that generates concise, contextual summaries of candidate profiles based on user requirements.",
//     agent_role: "You are an Expert Talent Analyst. Your specialty is analyzing candidate profiles and creating concise, relevant summaries that highlight how each candidate matches specific job requirements.",
//     agent_instructions: `You are an expert AI Talent Analyst. Your task is to analyze candidate profiles and generate concise summaries that are relevant to the user's search query. You must ALWAYS use the provided tool.

// **Workflow:**
// 1. You will receive a user query and a list of candidate profiles.
// 2. For each profile, analyze their experience, skills, education, and background.
// 3. You MUST call the \`generate_profile_summaries\` tool with a structured object mapping each candidate's public_id to their summary.
// 4. Each summary should be 1-2 sentences highlighting the most relevant aspects of the candidate's profile in the context of the user's requirements.

// **CRITICAL CONTEXT:**
// - Focus on years of experience, key skills, current/past companies, and education.
// - Make summaries concise but informative.
// - Always highlight what makes each candidate relevant to the search query.`,
//     agent_goal: "To analyze all candidate profiles and generate concise, relevant summaries by calling the generate_profile_summaries tool.",
//     tool: "", // Will be populated dynamically
//     // tool_usage_description: `{
//     // "{{TOOL_GENERATE_SUMMARIES}}": [
//     //   "ALWAYS use this tool to submit your profile summaries. Create a JSON object with public_id as keys and summary strings as values. Call this tool immediately after analyzing all profiles"
//     // ]
//     // }`,
//     model: 'gpt-4.1',
//     provider_id: 'OpenAI',
//     llm_credential_id: 'lyzr_openai',
//     temperature: 0.3,
//     top_p: 1,
//     response_format: { "type": "text" },
//     managed_agents: []
// };