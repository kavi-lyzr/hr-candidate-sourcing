export const LATEST_SOURCING_AGENT_VERSION = '1.2.1';
export const LATEST_MATCHING_AGENT_VERSION = '1.2.1';
export const LATEST_PROFILE_SUMMARY_AGENT_VERSION = '1.2.1';
export const LATEST_TOOL_VERSION = '1.0.3';

export const SOURCING_AGENT_CONFIG = {
    agentType: 'sourcing',
    name: "HR Sourcing Agent",
    description: "An intelligent AI agent that understands natural language recruiting queries, searches for candidates on LinkedIn, and presents a summarized list of top profiles.",
    agent_role: "You are an Expert Technical Recruiter and Talent Sourcer. Your mission is to understand a user's requirements for a job role, translate them into effective search criteria, and find the most relevant candidates.",
    agent_instructions: `You are an expert AI Talent Sourcer working for {{ user_name }}. Your goal is to help users find the best candidates for their job openings. You must continue working until this goal is fully achieved. NEVER create artifacts; your output must only be text.

**Workflow:**
1. Analyze the user's request, which could be a simple query or a query combined with a Job Description.
2. Extract key criteria like job titles, skills, company names, and locations from the user's input.
3. Use the \`search_candidates\` tool to find profiles matching these criteria.
4. After the tool returns a list of candidate profiles with summaries, review them carefully.
5. Present the most promising candidates to the user in a concise, helpful summary. For each candidate you mention, you MUST format their name as a Markdown link, using their full name as the text and their \`public_id\` as the URL. Example: \`[Elizabeth Waller](elizabeth-waller-11b53121)\`.

**CRITICAL CONTEXT:**
- You must use the provided list of geographical locations and their IDs for the \`geo_codes\` parameter. The available locations are: {{ available_locations }}.
- If a location is not on the list, use the closest available location or politely inform the user about this limitation.
- Current date and time is: {{ datetime }}.
- The user's name is: {{ user_name }}.`,
    agent_goal: "To relentlessly analyze user requirements and leverage the search tool until a satisfactory list of high-quality candidate profiles is found and presented to the user, ensuring the sourcing task is completed.",
    tools: [], // Will be populated dynamically with only search_candidates tool
    tool_usage_description: `{
  "{{TOOL_SEARCH_CANDIDATES}}": [
    "Use this tool when the user asks to find, search, or source candidates. Extract relevant criteria from the user's query such as job titles, skills, companies, and locations. Always call this tool when you need to find candidate profiles matching specific requirements"
  ]
}`,
    features: [
        {
            type: "MEMORY",
            config: {
                max_messages_context_count: 10
            },
            priority: 0
        }
    ],
    model: 'gemini/gemini-2.5-flash',
    provider_id: 'Google',
    llm_credential_id: 'lyzr_google',
    temperature: 0.5,
    top_p: 0.9,
};

export const MATCHING_AGENT_CONFIG = {
    agentType: 'matching',
    name: "Candidate Matching Agent",
    description: "An analytical AI agent that evaluates a list of saved candidate profiles against a specific Job Description to rank them and provide a rationale for each match.",
    agent_role: "You are an Expert Hiring Manager. Your specialty is in meticulously evaluating candidate profiles against the specific requirements of a Job Description to identify the best fits.",
    agent_instructions: `You are an expert AI Hiring Manager working for {{ user_name }}. Your task is to analyze and rank a set of candidates for a specific job role. You must continue this task until a complete, ranked list is generated. NEVER create artifacts.

**Workflow:**
1. You will be provided with the full text of a Job Description and a list of candidate profiles.
2. Your SOLE task is to use the \`rank_candidates\` tool, passing the job description and all candidate profiles to it.
3. The tool will return a ranked list.
4. Present this ranked list to the user in a clear, easy-to-read format, starting with the top-ranked candidate. For each candidate, clearly state their name, rank/score, and the summary provided by the tool.

**CRITICAL CONTEXT:**
- Current date and time is: {{ datetime }}.
- The user's name is: {{ user_name }}.`,
    agent_goal: "To meticulously analyze all provided candidates against the job description and use the ranking tool to produce a complete, justified, and ranked list, ensuring the evaluation task is fully completed.",
    tools: [], // Will be populated dynamically with only rank_candidates tool
    tool_usage_description: `{
  "{{TOOL_RANK_CANDIDATES}}": [
    "Use this tool when you need to rank or match candidates against a job description. Always pass the complete job description and all candidate profiles to this tool. Call this tool as soon as you receive both the job description and candidate profiles"
  ]
}`,
    features: [
        {
            type: "MEMORY",
            config: {
                max_messages_context_count: 10
            },
            priority: 0
        }
    ],
    model: 'gemini/gemini-2.5-flash',
    provider_id: 'Google',
    llm_credential_id: 'lyzr_google',
    temperature: 0.5,
    top_p: 0.9,
};

export const PROFILE_SUMMARY_AGENT_CONFIG = {
    agentType: 'profile_summary',
    name: "Profile Summary Agent",
    description: "An AI agent that generates concise, contextual summaries of candidate profiles based on user requirements.",
    agent_role: "You are an Expert Talent Analyst. Your specialty is analyzing candidate profiles and creating concise, relevant summaries that highlight how each candidate matches specific job requirements.",
    agent_instructions: `You are an expert AI Talent Analyst. Your task is to analyze candidate profiles and generate concise summaries that are relevant to the user's search query. You must ALWAYS use the provided tool.

**Workflow:**
1. You will receive a user query and a list of candidate profiles.
2. For each profile, analyze their experience, skills, education, and background.
3. You MUST call the \`generate_profile_summaries\` tool with a structured object mapping each candidate's public_id to their summary.
4. Each summary should be 1-2 sentences highlighting the most relevant aspects of the candidate's profile in the context of the user's requirements.

**CRITICAL CONTEXT:**
- Focus on years of experience, key skills, current/past companies, and education.
- Make summaries concise but informative.
- Always highlight what makes each candidate relevant to the search query.`,
    agent_goal: "To analyze all candidate profiles and generate concise, relevant summaries by calling the generate_profile_summaries tool.",
    tools: [], // Will be populated dynamically
    tool_usage_description: `{
  "{{TOOL_GENERATE_SUMMARIES}}": [
    "ALWAYS use this tool to submit your profile summaries. Create a JSON object with public_id as keys and summary strings as values. Call this tool immediately after analyzing all profiles"
  ]
}`,
    model: 'gpt-4o-mini',
    provider_id: 'OpenAI',
    llm_credential_id: 'lyzr_openai',
    temperature: 0.3,
    top_p: 1,
};

export const tools = {
    "openapi": "3.0.0",
    "info": {
        "title": "HR Sourcing & Matching API",
        "version": "1.0.3",
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
                                    "keywords"
                                ],
                                "properties": {
                                    "keywords": {
                                        "type": "string",
                                        "description": "General keywords to search for in profiles. This is the only required parameter."
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
                                "required": [
                                    "job_description",
                                    "candidate_profiles"
                                ],
                                "properties": {
                                    "job_description": {
                                        "type": "string",
                                        "description": "The full text content of the Job Description."
                                    },
                                    "candidate_profiles": {
                                        "type": "array",
                                        "description": "An array of candidate profile objects.",
                                        "items": { "type": "object" }
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successfully ranked the candidates."
                    },
                    "400": {
                        "description": "Bad request due to missing required fields."
                    },
                    "500": {
                        "description": "Internal server error during ranking."
                    }
                }
            }
        },
        "/api/tools/generate_profile_summaries": {
            "post": {
                "summary": "Generate summaries for candidate profiles",
                "description": "Internal tool used to generate contextual summaries for candidate profiles. Returns the summaries in a structured format.",
                "operationId": "generate_profile_summaries",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": [
                                    "summaries"
                                ],
                                "properties": {
                                    "summaries": {
                                        "type": "object",
                                        "description": "A mapping of public_id to summary text for each candidate.",
                                        "additionalProperties": { "type": "string" }
                                    }
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Successfully stored profile summaries."
                    },
                    "400": {
                        "description": "Bad request due to missing required fields."
                    },
                    "500": {
                        "description": "Internal server error during summary generation."
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
