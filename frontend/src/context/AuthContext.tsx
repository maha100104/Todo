import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Helper to mimic fetch behavior using Axios
async function axiosFetch(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
  const urlString = typeof url === 'string' ? url : (url as any).url || url.toString();

  const headers: Record<string, string> = {};
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers);
    }
  }

  let method = (options.method || 'GET').toUpperCase();
  let data = options.body;
  if (data && typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // Use raw if not valid JSON
    }
  }

  const response = await axios({
    url: urlString,
    method,
    headers,
    data,
    validateStatus: () => true, // Resolve promise for all status codes like fetch does
  });

  const responseLike: Partial<Response> = {
    status: response.status,
    statusText: response.statusText,
    ok: response.status >= 200 && response.status < 300,
    headers: new Headers(response.headers as any),
    json: async () => response.data,
    text: async () => typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
  };

  return responseLike as Response;
}

// Redirect native window.fetch to Axios
window.fetch = axiosFetch as any;

// Decodes a standard JWT payload
function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

interface UserState {
  name: string;
  email: string;
  id?: string | number;
  role?: string;
}

interface AuthContextType {
  user: UserState | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateName: (newName: string) => void;
  fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  // This handles client-side state clearing instantly
  const handleLogoutClean = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    localStorage.removeItem('auth_email');
    setUser(null);
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await fetch('/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Error logging out of backend:', error);
    } finally {
      handleLogoutClean();
    }
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    let token = localStorage.getItem('auth_token');
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };
    
    let response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      const refreshToken = localStorage.getItem('auth_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch('/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });
          
          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('auth_token', data.accessToken);
            localStorage.setItem('auth_refresh_token', data.refreshToken);
            
            const retryHeaders = {
              ...options.headers,
              'Authorization': `Bearer ${data.accessToken}`,
            };
            response = await fetch(url, { ...options, headers: retryHeaders });
          } else {
            handleLogoutClean();
          }
        } catch (error) {
          console.error('Error refreshing token:', error);
          handleLogoutClean();
        }
      } else {
        handleLogoutClean();
      }
    }
    
    return response;
  };

  // Check for existing session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('auth_token');
      const storedEmail = localStorage.getItem('auth_email');
      if (storedToken && storedEmail) {
        const decoded = decodeJwt(storedToken);
        const name = localStorage.getItem(`user_name_${storedEmail.toLowerCase()}`) || 
                     storedEmail.split('@')[0].replace(/^\w/, (c) => c.toUpperCase());
        
        setUser({
          name,
          email: storedEmail,
          id: decoded?.id,
          role: decoded?.role,
        });
        
        // Fetch fresh profile data
        try {
          const response = await fetchWithAuth('/auth/profile');
          if (response.ok) {
            const data = await response.json();
            if (data.user) {
              setUser({
                name: data.user.name,
                email: data.user.email,
                id: data.user.id,
                role: data.user.role,
              });
              localStorage.setItem(`user_name_${data.user.email.toLowerCase()}`, data.user.name);
            }
          }
        } catch (err) {
          console.error('Initial profile fetch failed:', err);
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (accessToken: string, refreshToken: string, email: string) => {
    localStorage.setItem('auth_token', accessToken);
    localStorage.setItem('auth_refresh_token', refreshToken);
    localStorage.setItem('auth_email', email);
    
    const decoded = decodeJwt(accessToken);
    const name = localStorage.getItem(`user_name_${email.toLowerCase()}`) || 
                 email.split('@')[0].replace(/^\w/, (c) => c.toUpperCase());
    
    setUser({
      name,
      email,
      id: decoded?.id,
      role: decoded?.role,
    });
    
    try {
      const response = await fetch('/auth/profile', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser({
            name: data.user.name,
            email: data.user.email,
            id: data.user.id,
            role: data.user.role,
          });
          localStorage.setItem(`user_name_${data.user.email.toLowerCase()}`, data.user.name);
        }
      }
    } catch (error) {
      console.error('Error fetching profile on login:', error);
    }
  };

  const updateName = (newName: string) => {
    if (user) {
      setUser({ ...user, name: newName });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateName, fetchWithAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
