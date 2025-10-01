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
    displayName: string | null;
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [displayName, setDisplayName] = useState<string | null>(null);

    const clearAuthData = () => {
        Cookies.remove('user_id');
        Cookies.remove('token');
        setIsAuthenticated(false);
        setUserId(null);
        setToken(null);
        setEmail(null);
        setDisplayName(null);
        setIsLoading(false);
    };
    
    const setAuthData = (tokenData: TokenData, userEmail: string | null, userName: string | null) => {
        setIsAuthenticated(true);
        setUserId(tokenData.user_id);
        setToken(tokenData.api_key);
        setEmail(userEmail);
        setDisplayName(userName);
        Cookies.set('user_id', tokenData.user_id, { expires: 7 });
        Cookies.set('token', tokenData.api_key, { expires: 7 });
    };

    const checkAuth = async () => {
        if (typeof window === 'undefined') {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        try {
            const { default: lyzr } = await import('lyzr-agent');
            const tokenData = await lyzr.getKeys() as unknown as TokenData[];

            if (tokenData && tokenData[0]) {
                let userEmail: string | null = null;
                let userName: string | null = null;

                try {
                    const userKeys = await lyzr.getKeysUser();
                    userEmail = userKeys?.data?.user?.email;
                    userName = userKeys?.data?.user?.name;
                } catch (error) {
                    console.error("Error fetching user keys, proceeding with token data only.", error);
                }

                const nameFromEmail = userEmail ? userEmail.split('@')[0].charAt(0).toUpperCase() + userEmail.split('@')[0].slice(1) : 'User';
                const finalUserName = userName || nameFromEmail;

                // Sync with backend
                await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: {
                            id: tokenData[0].user_id,
                            email: userEmail,
                            name: finalUserName,
                        },
                        lyzrApiKey: tokenData[0].api_key,
                    }),
                });

                setAuthData(tokenData[0], userEmail, finalUserName);

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

    const login = async () => {
        if (typeof window === 'undefined') return;
        try {
            const { default: lyzr } = await import('lyzr-agent');
            await lyzr.logout(); // Ensure clean state before attempting login
            await lyzr.init('pk_c14a2728e715d9ea67bf');
            await clearAuthData();
            await checkAuth();
            await lyzr.getKeys(); // This will trigger the login modal
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
            window.location.href = window.location.origin;
            // Immediately trigger the login flow again
            // await login();
        } catch (error) {
            console.error('Logout failed:', error);
            clearAuthData();
        }
    };

    useEffect(() => {
        const init = async () => {
            if (typeof window === 'undefined') return;
            try {
                const { default: lyzr } = await import('lyzr-agent');
                await lyzr.init('pk_c14a2728e715d9ea67bf');

                const unsubscribe = lyzr.onAuthStateChange((isAuth) => {
                    if (isAuth) {
                        checkAuth();
                    } else {
                        clearAuthData();
                    }
                });

                // Perform initial check silently
                try {
                    const tokenData = await lyzr.getKeys() as unknown as TokenData[];
                    if (tokenData && tokenData[0]) {
                        await checkAuth();
                    } else {
                        setIsLoading(false);
                    }
                } catch (error) {
                    setIsLoading(false); // Not logged in
                }
                
                return () => unsubscribe();
            } catch (err) {
                console.error('Lyzr init failed:', err);
                clearAuthData();
            }
        };
        init();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, token, email, displayName, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}