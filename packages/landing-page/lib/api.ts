const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Signs up a new user using the standalone backend API.
 */
export async function signupUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Signup failed");
  }

  const data: AuthResponse = await response.json();
  return data;
}

/**
 * Logs in an existing user and stores the HttpOnly session cookie on the browser.
 * Note: credentials: "include" is REQUIRED for cross-origin cookie storage.
 */
export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
    credentials: "include", // Essential for HttpOnly cookies in CORS
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Login failed");
  }

  const data: AuthResponse = await response.json();
  return data;
}

/**
 * Refreshes the short-lived access token using the stored refresh token.
 * Note: credentials: "include" is REQUIRED to send the refresh token cookie.
 */
export async function refreshAccessToken(): Promise<{ accessToken: string }> {
  const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    credentials: "include", // Sends the httpOnly refresh_token cookie
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Token refresh failed");
  }

  const data = await response.json();
  return data;
}

/**
 * Logs out the user by revoking the token in the backend and removing cookies.
 */
export async function logoutUser(): Promise<{ message: string }> {
  const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    credentials: "include", // Clears cookies
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Logout failed");
  }

  const data = await response.json();
  return data;
}
