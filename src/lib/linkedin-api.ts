/**
 * LinkedIn API Integration via RapidAPI
 * 
 * This module handles the 3-step process:
 * 1. Initiate search (get request_id)
 * 2. Check search status (poll until done)
 * 3. Get search results
 */

const RAPID_API_BASE = process.env.RAPID_API_BASE || '';
const RAPID_API_KEY = process.env.RAPID_API_KEY || '';

if (!RAPID_API_BASE || !RAPID_API_KEY) {
    console.warn('LinkedIn API credentials not configured. Set RAPID_API_BASE and RAPID_API_KEY environment variables.');
}

export interface LinkedInSearchParams {
    keywords?: string;
    title_keywords?: string[];
    current_company_names?: string[];
    past_company_names?: string[];
    geo_codes?: number[];
    geo_codes_exclude?: number[];
    title_keywords_exclude?: string[];
    past_company_ids?: number[];
    functions?: string[];
    limit?: number;
}

export interface LinkedInProfile {
    about: string;
    city: string;
    company: string;
    company_domain: string;
    company_employee_range: string;
    company_id: string;
    company_industry: string;
    company_linkedin_url: string;
    company_logo_url: string;
    company_website: string;
    company_year_founded: string;
    country: string;
    current_company_join_month: number;
    current_company_join_year: number;
    educations: Array<{
        activities: string;
        date_range: string;
        degree: string;
        end_month: string;
        end_year: number;
        field_of_study: string;
        school: string;
        school_id: string;
        school_linkedin_url: string;
        school_logo_url: string;
        start_month: string;
        start_year: number;
    }>;
    experiences: Array<{
        company: string;
        company_id: string;
        company_linkedin_url: string;
        company_logo_url: string;
        date_range: string;
        description: string;
        duration: string;
        end_month: number;
        end_year: number;
        is_current: boolean;
        job_type: string;
        location: string;
        skills: string;
        start_month: number;
        start_year: number;
        title: string;
    }>;
    first_name: string;
    full_name: string;
    headline: string;
    hq_city: string;
    hq_country: string;
    hq_region: string;
    job_title: string;
    last_name: string;
    linkedin_url: string;
    location: string;
    profile_id: string;
    profile_image_url: string;
    public_id: string;
    school: string;
    state: string;
}

export interface LinkedInSearchResponse {
    data: LinkedInProfile[];
    employees_scraped_so_far: number;
    message: string;
    search_params: LinkedInSearchParams;
    total_count: number;
}

export interface SearchStatusResponse {
    employees_scraped_so_far: number;
    message: string;
    search_params: LinkedInSearchParams;
    status: 'pending' | 'processing' | 'done' | 'error';
    total_count: number;
}

/**
 * Step 1: Initiate a LinkedIn candidate search
 */
export async function initiateLinkedInSearch(params: LinkedInSearchParams): Promise<string> {
    if (!RAPID_API_BASE || !RAPID_API_KEY) {
        throw new Error('LinkedIn API credentials not configured');
    }

    const response = await fetch(`https://${RAPID_API_BASE}/search-employees`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': RAPID_API_BASE,
            'x-rapidapi-key': RAPID_API_KEY,
        },
        body: JSON.stringify(params),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to initiate LinkedIn search: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.request_id;
}

/**
 * Step 2: Check the status of a LinkedIn search
 */
export async function checkLinkedInSearchStatus(requestId: string): Promise<SearchStatusResponse> {
    if (!RAPID_API_BASE || !RAPID_API_KEY) {
        throw new Error('LinkedIn API credentials not configured');
    }

    const response = await fetch(`https://${RAPID_API_BASE}/check-search-status?request_id=${requestId}`, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': RAPID_API_BASE,
            'x-rapidapi-key': RAPID_API_KEY,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to check LinkedIn search status: ${response.status} ${error}`);
    }

    return await response.json();
}

/**
 * Step 3: Get the results of a completed LinkedIn search
 */
export async function getLinkedInSearchResults(requestId: string): Promise<LinkedInSearchResponse> {
    if (!RAPID_API_BASE || !RAPID_API_KEY) {
        throw new Error('LinkedIn API credentials not configured');
    }

    const response = await fetch(`https://${RAPID_API_BASE}/get-search-results?request_id=${requestId}`, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': RAPID_API_BASE,
            'x-rapidapi-key': RAPID_API_KEY,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get LinkedIn search results: ${response.status} ${error}`);
    }

    return await response.json();
}

/**
 * Complete LinkedIn search flow with polling
 * @param params Search parameters
 * @param maxAttempts Maximum number of polling attempts (default: 30)
 * @param pollInterval Interval between polls in milliseconds (default: 2000ms)
 */
export async function performLinkedInSearch(
    params: LinkedInSearchParams,
    maxAttempts: number = 30,
    pollInterval: number = 2000
): Promise<LinkedInSearchResponse> {
    // Step 1: Initiate search
    const requestId = await initiateLinkedInSearch(params);
    console.log(`LinkedIn search initiated with request_id: ${requestId}`);

    // Step 2: Poll for completion
    let attempts = 0;
    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));

        const status = await checkLinkedInSearchStatus(requestId);
        console.log(`LinkedIn search status (attempt ${attempts + 1}/${maxAttempts}):`, status.status);

        if (status.status === 'done') {
            // Step 3: Get results
            const results = await getLinkedInSearchResults(requestId);
            console.log(`LinkedIn search completed. Found ${results.total_count} candidates.`);
            return results;
        } else if (status.status === 'error') {
            throw new Error(`LinkedIn search failed: ${status.message}`);
        }

        attempts++;
    }

    throw new Error(`LinkedIn search timed out after ${maxAttempts} attempts`);
}

/**
 * Calculate years of experience from LinkedIn profile
 */
export function calculateYearsOfExperience(profile: LinkedInProfile): number {
    if (!profile.experiences || profile.experiences.length === 0) {
        return 0;
    }

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    let totalMonths = 0;

    for (const exp of profile.experiences) {
        const startYear = exp.start_year;
        const startMonth = exp.start_month || 1;
        const endYear = exp.is_current ? currentYear : (exp.end_year || currentYear);
        const endMonth = exp.is_current ? currentMonth : (exp.end_month || 12);

        const months = (endYear - startYear) * 12 + (endMonth - startMonth);
        totalMonths += months;
    }

    return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal place
}

/**
 * Format profile for LLM consumption (concise version)
 */
export function formatProfileForLLM(profile: LinkedInProfile): any {
    const yearsOfExperience = calculateYearsOfExperience(profile);

    return {
        public_id: profile.public_id,
        full_name: profile.full_name,
        headline: profile.headline,
        current_title: profile.job_title,
        current_company: profile.company,
        location: profile.location,
        years_of_experience: yearsOfExperience,
        education: profile.educations?.slice(0, 2).map(edu => ({
            degree: edu.degree,
            field: edu.field_of_study,
            school: edu.school,
        })) || [],
        recent_experience: profile.experiences?.slice(0, 3).map(exp => ({
            title: exp.title,
            company: exp.company,
            duration: exp.duration,
            is_current: exp.is_current,
        })) || [],
        linkedin_url: profile.linkedin_url,
        about: profile.about?.substring(0, 300) || '', // Truncate to avoid token limits
    };
}

