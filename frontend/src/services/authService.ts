import axios from "axios";

// Define token types
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    role: string;
    name: string;
  };
}

/**
 * Check if a token is expired or invalid based on error response
 */
export const isTokenExpired = (error: any): boolean => {
  // Check for specific error messages that indicate an expired or invalid token
  const errorDetail = error?.response?.data?.detail;
  return (
    error?.response?.status === 401 ||
    errorDetail === "User not found" ||
    errorDetail === "Not authenticated" ||
    errorDetail === "Could not validate credentials" ||
    errorDetail === "Token expired"
  );
};

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

// Create a separate axios instance for auth requests to avoid circular dependencies
const authApi = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Store for refresh attempts to prevent infinite loops
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/**
 * Maximum number of refresh attempts
 */
const MAX_REFRESH_ATTEMPTS = 3;

/**
 * Counter for refresh attempts
 */
let refreshAttempts = 0;

/**
 * Refresh the authentication token
 */
export const refreshToken = async (): Promise<string | null> => {
  // If already refreshing, return the existing promise
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  // Check if we've exceeded the maximum number of refresh attempts
  if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
    console.error(
      `authService: Maximum refresh attempts (${MAX_REFRESH_ATTEMPTS}) exceeded`
    );
    // Reset the counter after a delay
    setTimeout(() => {
      refreshAttempts = 0;
    }, 60000); // Reset after 1 minute
    return null;
  }

  console.log("authService: Starting token refresh");
  isRefreshing = true;
  refreshAttempts++;

  // Create a new promise for the refresh operation
  refreshPromise = new Promise<string | null>(async (resolve) => {
    try {
      // Get stored credentials
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        console.error("authService: No user data found for token refresh");
        resolve(null);
        return;
      }

      const user = JSON.parse(userStr);
      const email = user.email;

      // For security, we should use a proper refresh token flow
      // But for this implementation, we'll use the stored credentials
      // This is a simplified approach for demonstration purposes

      // Try to get a new token using the stored email
      // In a real app, you would use a refresh token instead
      const storedPassword = sessionStorage.getItem("temp_auth_password");

      if (!storedPassword) {
        console.error("authService: No stored password for token refresh");

        // If we have a fallback admin password, use it
        const fallbackPassword = "Marketing@Admin2025"; // Hardcoded for demo purposes only
        if (email === "admin@example.com") {
          console.log(
            "authService: Using fallback admin password for token refresh"
          );

          // Create form data for token request
          const formData = new URLSearchParams();
          formData.append("username", email);
          formData.append("password", fallbackPassword);

          try {
            const response = await authApi.post<TokenResponse>(
              "/auth/token",
              formData.toString(),
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            );

            if (response.data && response.data.access_token) {
              const newToken = response.data.access_token;

              // Update token in localStorage
              localStorage.setItem("token", newToken);

              // Update user data if needed
              if (response.data.user) {
                const updatedUser = {
                  ...user,
                  ...response.data.user,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));
              }

              // Store the password for future refreshes
              sessionStorage.setItem("temp_auth_password", fallbackPassword);

              console.log(
                "authService: Token refresh successful with fallback password"
              );
              resolve(newToken);
              return;
            }
          } catch (fallbackError) {
            console.error(
              "authService: Fallback refresh failed:",
              fallbackError
            );
          }
        }

        resolve(null);
        return;
      }

      console.log("authService: Attempting to refresh token for user:", email);

      // Create form data for token request
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", storedPassword);

      const response = await authApi.post<TokenResponse>(
        "/auth/token",
        formData.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data && response.data.access_token) {
        const newToken = response.data.access_token;

        // Update token in localStorage
        localStorage.setItem("token", newToken);

        // Update user data if needed
        if (response.data.user) {
          const updatedUser = {
            ...user,
            ...response.data.user,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }

        // Reset refresh attempts on success
        refreshAttempts = 0;

        console.log("authService: Token refresh successful");
        resolve(newToken);
      } else {
        console.error(
          "authService: Token refresh failed - no token in response"
        );
        resolve(null);
      }
    } catch (error) {
      console.error("authService: Token refresh error:", error);
      resolve(null);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

  return refreshPromise;
};

/**
 * Store credentials temporarily for token refresh
 * This is a simplified approach for demonstration purposes
 * In a real app, you would use a proper refresh token
 */
export const storeCredentials = (email: string, password: string): void => {
  // Store password temporarily in session storage for token refresh
  // This is not secure and should not be used in production
  // In a real app, you would use a refresh token instead
  sessionStorage.setItem("temp_auth_password", password);
};

/**
 * Clear stored credentials
 */
export const clearCredentials = (): void => {
  sessionStorage.removeItem("temp_auth_password");
};

// This function is already defined at the top of the file
