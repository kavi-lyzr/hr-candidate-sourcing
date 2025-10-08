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
 * Derive a unique identifier from profile
 * Priority: public_id > linkedin_url extraction > profile_id > fallback hash
 */
export function deriveProfileId(profile: LinkedInProfile): string {
    // 1. Try public_id
    if (profile.public_id) return profile.public_id;
    
    // 2. Try extracting from linkedin_url (prioritize this over profile_id)
    if (profile.linkedin_url) {
        const match = profile.linkedin_url.match(/linkedin\.com\/in\/([^/?]+)/);
        if (match && match[1]) return match[1];
    }
    
    // 3. Try profile_id (numeric ID - only use as last resort)
    if (profile.profile_id) return profile.profile_id;
    
    // 4. Fallback: generate a stable hash from name and company
    // This ensures we always have an ID, even if LinkedIn data is incomplete
    const nameSlug = (profile.full_name || 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    
    const companySlug = (profile.company || '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    
    // Create a unique identifier combining name and company
    return companySlug ? `${nameSlug}-at-${companySlug}` : nameSlug;
}

/**
 * Generate a profile URL with intelligent fallback
 * Priority: linkedin_url > google search (no more constructed LinkedIn URLs)
 */
export function generateProfileUrl(profile: LinkedInProfile, uniqueId: string): string {
    // 1. Try direct LinkedIn URL
    if (profile.linkedin_url) {
        return profile.linkedin_url;
    }
    
    // 2. Fallback to Google search URL (no more constructed LinkedIn URLs)
    const searchTerms = [];
    
    if (profile.full_name) searchTerms.push(profile.full_name);
    if (profile.job_title) searchTerms.push(profile.job_title);
    if (profile.company) searchTerms.push(profile.company);
    if (profile.location) searchTerms.push(profile.location);
    searchTerms.push('LinkedIn'); // Always include LinkedIn in search
    
    const query = encodeURIComponent(searchTerms.join(' '));
    return `https://www.google.com/search?q=${query}`;
}

/**
 * Remove empty, null, or undefined fields from an object
 */
function removeEmptyFields(obj: any): any {
    if (Array.isArray(obj)) {
        const filtered = obj.map(removeEmptyFields).filter(item => {
            if (typeof item === 'object' && item !== null) {
                return Object.keys(item).length > 0;
            }
            return item !== null && item !== undefined && item !== '';
        });
        return filtered.length > 0 ? filtered : undefined;
    }
    
    if (typeof obj === 'object' && obj !== null) {
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined || value === '') continue;
            
            const cleanedValue = removeEmptyFields(value);
            if (cleanedValue !== undefined) {
                cleaned[key] = cleanedValue;
            }
        }
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }
    
    return obj;
}

/**
 * Format profile for LLM consumption (optimized, concise version)
 * Only includes non-empty fields to reduce token usage
 */
export function formatProfileForLLM(profile: LinkedInProfile): any {
    const uniqueId = deriveProfileId(profile);
    const yearsOfExperience = calculateYearsOfExperience(profile);

    // Build base object with only essential fields
    const formatted: any = {
        public_id: uniqueId, // Always include ID for reference (agent expects this field name)
        name: profile.full_name,
    };

    // Add optional fields only if they have values
    if (profile.headline) formatted.headline = profile.headline;
    if (profile.job_title) formatted.title = profile.job_title;
    if (profile.company) formatted.company = profile.company;
    if (profile.location) formatted.location = profile.location;
    if (yearsOfExperience > 0) formatted.experience_years = yearsOfExperience;
    
    // Education - only include if available, limit to top 2, clean empty fields
    if (profile.educations && profile.educations.length > 0) {
        const education = profile.educations.slice(0, 2).map(edu => {
            const eduObj: any = {};
            if (edu.degree) eduObj.degree = edu.degree;
            if (edu.field_of_study) eduObj.field = edu.field_of_study;
            if (edu.school) eduObj.school = edu.school;
            return eduObj;
        }).filter(edu => Object.keys(edu).length > 0);
        
        if (education.length > 0) formatted.education = education;
    }
    
    // Recent experience - only include if available, limit to top 3, clean empty fields
    if (profile.experiences && profile.experiences.length > 0) {
        const experience = profile.experiences.slice(0, 3).map(exp => {
            const expObj: any = {};
            if (exp.title) expObj.title = exp.title;
            if (exp.company) expObj.company = exp.company;
            if (exp.duration) expObj.duration = exp.duration;
            if (exp.is_current !== undefined) expObj.current = exp.is_current;
            return expObj;
        }).filter(exp => Object.keys(exp).length > 0);
        
        if (experience.length > 0) formatted.recent_roles = experience;
    }
    
    // Profile URL - ALWAYS include with intelligent fallback
    // This ensures agent can always create clickable links
    formatted.profile_url = generateProfileUrl(profile, uniqueId);
    
    // About/Summary - DO NOT TRUNCATE (per user requirement), but only include if exists
    if (profile.about) formatted.about = profile.about;

    return formatted;
}

