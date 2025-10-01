"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';

export interface TokenData {
    _id: string;
    api_key: string;
    user_id: string;
    organization_id: string;
    usage_id: string;
    policy_id: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    userId: string | null;
    token: string | null;
    email: string | null;
    checkAuth: () => Promise<void>;
    login: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// export async function toggleAppVisibility(visibility: boolean) {
//     const { default: lyzr } = await import('lyzr-agent');
//     if (visibility) {
//         lyzr.showAppContent();
//     } else {
//         lyzr.hideAppContent();
//     }
// }

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);

    const clearAuthData = () => {
        Cookies.remove('user_id');
        Cookies.remove('token');
        setIsAuthenticated(false);
        setUserId(null);
        setToken(null);
        setEmail(null);
    };

    const login = async () => {
        if (typeof window === 'undefined') return;

        try {
            const { default: lyzr } = await import('lyzr-agent');
            
            // First check if user is already authenticated without triggering login
            try {
                const tokenData = await lyzr.getKeys() as unknown as TokenData[];
                if (tokenData && tokenData[0]) {
                    // User is already authenticated, redirect to organizations
                    window.location.href = '/organizations';
                    return;
                }
            } catch (error) {
                console.log('User not authenticated, will trigger login');
            }

            // User is not authenticated, trigger the login modal
            // We need to force the authentication flow
            await lyzr.logout(); // Ensure clean state
            
            // Trigger authentication by attempting to get keys
            // This should show the login modal
            await lyzr.getKeys();
        } catch (error) {
            console.error('Login failed:', error);
        }
    };

    const logout = async () => {
        if (typeof window === 'undefined') return;

        try {
            const { default: lyzr } = await import('lyzr-agent');
            await lyzr.logout();
            clearAuthData();
        } catch (error) {
            console.error('Logout failed:', error);
            clearAuthData();
        }
    };

    const setAuthData = (userData: TokenData) => {
        Cookies.set('user_id', userData.user_id, { expires: 7 }); // 7 days
        Cookies.set('token', userData.api_key, { expires: 7 });
        setIsAuthenticated(true);
        setUserId(userData.user_id);
        setToken(userData.api_key);
    };

    const checkAuth = async () => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }

        try {
            const { default: lyzr } = await import('lyzr-agent');
            const tokenData = await lyzr.getKeys() as unknown as TokenData[];
            // console.log('tokenData', tokenData);

            if (tokenData && tokenData[0]) {
                try {
                    const userKeys = await lyzr.getKeysUser();
                    const email = userKeys?.data?.user?.email;
                    const userName = userKeys?.data?.user?.name;

                    // console.log('userKeys', userKeys);

                    // Extract name from email if userName is not available
                    const nameFromEmail = email ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : 'User';

                    // Create or update user in our database
                    const response = await fetch('/api/v1/auth/lyzr', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            lyzrUserData: {
                                id: tokenData[0].user_id,
                                email: email,
                                name: userName || nameFromEmail,
                                api_key: tokenData[0].api_key,
                                organization_id: tokenData[0].organization_id,
                                usage_id: tokenData[0].usage_id,
                                policy_id: tokenData[0].policy_id,
                                role: userKeys?.data?.policy?.role,
                                available_credits: userKeys?.data?.available_credits,
                            }
                        }),
                    });

                    if (response.ok) {
                        const result = await response.json();
                        console.log('User synchronized with database:', result.user);
                    }

                    Cookies.set('user_id', tokenData[0].user_id);
                    Cookies.set('token', tokenData[0].api_key);
                    setIsAuthenticated(true);
                    setUserId(tokenData[0].user_id);
                    setToken(tokenData[0].api_key);
                    setEmail(email);
                } catch (error) {
                    console.error('Error fetching user keys:', error);
                    setAuthData(tokenData[0]);
                }
            } else {
                clearAuthData();
            }
        } catch (err) {
            console.error('Auth check failed:', err);
            clearAuthData();
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined') return;

            try {
                const { default: lyzr } = await import('lyzr-agent');
                await lyzr.init('pk_c14a2728e715d9ea67bf');

                // Subscribe to auth state changes
                const unsubscribe = lyzr.onAuthStateChange((isAuthenticated: boolean) => {
                    if (isAuthenticated) {
                        checkAuth().then(() => {
                            // Only redirect if we're on the landing page and user manually triggered login
                            if (window.location.pathname === '/' && !isLoading) {
                                window.location.href = '/organizations';
                            }
                        });
                    } else {
                        clearAuthData();
                        setIsLoading(false);
                    }
                });

                // Check if user is already authenticated without triggering auth flow
                try {
                    const tokenData = await lyzr.getKeys() as unknown as TokenData[];
                    if (tokenData && tokenData[0]) {
                        await checkAuth();
                    } else {
                        setIsLoading(false);
                    }
                } catch (error) {
                    // User not authenticated, don't trigger auth flow automatically
                    setIsLoading(false);
                }

                return () => unsubscribe();
            } catch (err) {
                console.error('Lyzr init failed:', err);
                clearAuthData();
                setIsLoading(false);
            }
        };

        init();
    }, []);

    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            userId,
            token,
            email,
            checkAuth,
            login,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}