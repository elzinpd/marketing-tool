import axios, { AxiosError, AxiosRequestConfig } from "axios";
import {
  Campaign,
  CampaignMetrics,
  Client,
  Report,
  ReportTemplate,
} from "../types";
import { TokenResponse, isTokenExpired, refreshToken } from "./authService";

// Track failed requests for retry
const failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}> = [];

// Flag to track if token refresh is in progress
let isRefreshing = false;

// Get the API URL from environment variables
// Force the correct URL for Vercel deployment
const API_URL = "https://marketing-tool-omega.vercel.app";
// Fallback to environment variable or localhost for development
// const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8001";

const api = axios.create({
  baseURL: `${API_URL}/api/v1`, // Use the environment variable for Vercel deployment
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to attach token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // Clean the token to ensure no "Bearer" prefix is duplicated
      const cleanToken = token.replace(/^Bearer\s+/i, "");
      config.headers.Authorization = `Bearer ${cleanToken}`;

      // Log request for debugging (don't show full token)
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

      // For debugging auth issues, log a masked version of the token
      if (process.env.NODE_ENV === "development") {
        const tokenPreview =
          cleanToken.substring(0, 10) +
          "..." +
          cleanToken.substring(cleanToken.length - 5);
        console.debug(`Auth header: Bearer ${tokenPreview}`);
      }
    } else {
      console.warn(
        `API Request without auth token: ${config.method?.toUpperCase()} ${
          config.url
        }`
      );
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Process the queue of failed requests
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (token) {
      // Update the token in the request
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
      resolve(api(config));
    } else {
      // If we're on a page that requires authentication, redirect to login
      if (
        window.location.pathname !== "/login" &&
        !window.location.pathname.includes("reliable-login.html")
      ) {
        // Store the current location to redirect back after login
        sessionStorage.setItem("redirectPath", window.location.pathname);

        // Use a timeout to prevent redirect loops
        setTimeout(() => {
          window.location.href = "/login";
        }, 100);
      }

      reject(error);
    }
  });

  // Clear the queue
  failedQueue.length = 0;
};

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Extract request config from error
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle network errors (like when the backend is not running)
    if (error.message === "Network Error") {
      console.warn(
        "API: Network error detected, using fallback data if available"
      );
      // We'll let the component handle this with fallback data
      return Promise.reject(error);
    }

    // Check if this is a token-related error and we should try to refresh
    if (isTokenExpired(error) && !originalRequest._retry) {
      console.log("API: Token expired or invalid, attempting to refresh");

      // Mark this request as retried to prevent infinite loops
      originalRequest._retry = true;

      // If we're already refreshing, add this request to the queue
      if (isRefreshing) {
        console.log("API: Token refresh already in progress, queueing request");
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      // Start refreshing
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const newToken = await refreshToken();

        // Process the queue with the new token
        processQueue(null, newToken);

        if (newToken) {
          console.log("API: Token refresh successful, retrying request");
          // Update the authorization header with the new token
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return api(originalRequest);
        } else {
          console.log("API: Token refresh failed, redirecting to login");
          // Store the current location to redirect back after login
          const currentPath = window.location.pathname;
          if (currentPath !== "/login") {
            sessionStorage.setItem("redirectPath", currentPath);
          }

          // Redirect to login page
          if (window.location.pathname !== "/login") {
            window.location.href = "/login";
          }

          // Reject all queued requests
          processQueue(error);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error("API: Error during token refresh:", refreshError);

        // Reject all queued requests
        processQueue(refreshError);

        // Redirect to login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

// Helper function to download a file with authentication
export const downloadFile = async (
  url: string,
  filename: string
): Promise<void> => {
  try {
    // Try to refresh the token before downloading
    try {
      const { refreshToken } = await import("./authService");
      await refreshToken();
      console.log("Token refreshed before file download");
    } catch (refreshError) {
      console.warn(
        "Failed to refresh token before download, will try with existing token:",
        refreshError
      );
    }

    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    // Clean the token to ensure no "Bearer" prefix is duplicated
    const cleanToken = token.replace(/^Bearer\s+/i, "");

    console.log(`Initiating file download from: ${url}`);

    // Use fetch API for better blob handling
    let response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cleanToken}`,
          Accept:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
        credentials: "same-origin", // Use same-origin instead of include for CORS
      });
    } catch (fetchError: any) {
      // Handle network errors
      if (
        fetchError.message === "Network Error" ||
        fetchError.name === "TypeError"
      ) {
        console.warn(
          "Network error during file download, backend may be unavailable"
        );
        throw new Error(
          "Network error: Unable to connect to the server. Please check your connection or try again later."
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      let errorText = "";
      try {
        const errorData = await response.json();
        errorText = JSON.stringify(errorData);
      } catch (e) {
        errorText = await response.text();
      }
      console.error(
        `Download failed with status ${response.status}: ${errorText}`
      );

      // If unauthorized, try to refresh token and retry once
      if (response.status === 401) {
        console.log("Unauthorized error, trying to refresh token and retry...");
        try {
          const { refreshToken } = await import("./authService");
          const newToken = await refreshToken();

          if (newToken) {
            console.log("Token refreshed, retrying download...");
            // Retry the download with the new token
            const retryResponse = await fetch(url, {
              method: "GET",
              headers: {
                Authorization: `Bearer ${newToken}`,
                Accept:
                  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              },
              credentials: "same-origin",
            });

            if (retryResponse.ok) {
              // Process the successful retry response
              const blob = await retryResponse.blob();
              const downloadUrl = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = downloadUrl;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(downloadUrl);
              document.body.removeChild(a);
              return; // Exit function after successful retry
            } else {
              console.error("Retry download failed even after token refresh");
            }
          }
        } catch (retryError) {
          console.error("Error during token refresh and retry:", retryError);
        }
      }

      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    // Get the blob from the response
    const blob = await response.blob();

    // Get filename from Content-Disposition header if available
    const contentDisposition = response.headers.get("Content-Disposition");
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Create a download link and trigger download
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    }, 100);

    return;
  } catch (error) {
    console.error("File download error:", error);
    throw error;
  }
};

export const getCampaigns = async (): Promise<Campaign[]> => {
  const response = await api.get("/campaigns/");
  return response.data;
};

export const getCampaign = async (id: number): Promise<Campaign> => {
  const response = await api.get(`/campaigns/${id}`);
  return response.data;
};

export const getCampaignMetrics = async (
  id: number,
  startDate: string,
  endDate: string
): Promise<CampaignMetrics> => {
  const response = await api.get(`/campaigns/${id}/metrics`, {
    params: { start_date: startDate, end_date: endDate },
  });
  return response.data;
};

export const createCampaign = async (
  campaign: Omit<Campaign, "id" | "created_at" | "updated_at">
): Promise<Campaign> => {
  const response = await api.post("/campaigns/", campaign);
  return response.data;
};

export const getClients = async (): Promise<Client[]> => {
  const response = await api.get("/clients/");
  return response.data;
};

export const getReportTemplates = async (): Promise<ReportTemplate[]> => {
  const response = await api.get("/report-templates/");
  return response.data;
};

export const generateReport = async (data: {
  client_id: number;
  start_date: string;
  end_date: string;
  template_id: number;
}): Promise<Report> => {
  const response = await api.post("/reports/generate", data);
  return response.data;
};

// This function has been moved to the bottom of the file

export const getReports = async (): Promise<Report[]> => {
  const response = await api.get("/reports/");
  return response.data;
};

// Login function
export const login = async (
  email: string,
  password: string
): Promise<TokenResponse> => {
  try {
    console.log("login: Attempting to login with email:", email);

    // Store password directly in session storage for token refresh
    // This is a simplified approach for demonstration purposes
    // In a real app, you would use a refresh token instead
    sessionStorage.setItem("temp_auth_password", password);
    console.log("login: Stored password for token refresh");

    // Use URLSearchParams for the token endpoint
    const formData = new URLSearchParams();
    formData.append("username", email); // OAuth2 spec uses 'username' even for email
    formData.append("password", password);

    const response = await api.post<TokenResponse>(
      "/auth/token",
      formData.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response.data && response.data.access_token) {
      console.log("login: Received token and user data");

      // Ensure we have complete user data
      const userData = response.data.user || {};

      // Add default values for any missing fields
      const completeUserData = {
        id: userData.id || 0,
        email: userData.email || email,
        name: userData.name || email.split("@")[0],
        role: userData.role || "user",
        // Add any other required fields with defaults
      };

      // Store token in localStorage
      localStorage.setItem("token", response.data.access_token);

      // Store complete user info in localStorage for persistence
      localStorage.setItem("user", JSON.stringify(completeUserData));
      console.log("login: Stored user data in localStorage:", completeUserData);

      // Validate the token immediately to ensure it works
      try {
        console.log("login: Validating token with /auth/me");
        await api.get("/auth/me");
        console.log("login: Token validation successful");
      } catch (validationError) {
        console.warn(
          "login: Token validation warning (continuing anyway):",
          validationError
        );
        // Continue even if validation fails - the token might still work for other endpoints
      }

      // Check for redirect after login
      const redirectPath = sessionStorage.getItem("redirectPath");
      if (redirectPath) {
        console.log("login: Found redirect path:", redirectPath);
        sessionStorage.removeItem("redirectPath");
        // Will be handled by useAuth and AuthContext
      }
    } else {
      console.error("login: Received response but missing token or user data");
    }

    return response.data;
  } catch (error) {
    console.error("login: Error during login process:", error);
    throw error;
  }
};

// Validate token function for auth checks
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      console.log("validateToken: No token found in localStorage");
      return false;
    }

    // Try to validate the token with the server
    try {
      console.log("validateToken: Calling /auth/me endpoint");
      const response = await api.get("/auth/me");
      console.log("validateToken: Server response:", response.data);

      // If we get a valid response but no user data, handle it
      if (
        !response.data ||
        (typeof response.data === "object" &&
          Object.keys(response.data).length === 0)
      ) {
        console.warn("validateToken: Server returned empty user data");
        return false;
      }

      // Update user data in localStorage if we got new data
      if (response.data && typeof response.data === "object") {
        const storedUserStr = localStorage.getItem("user");
        if (storedUserStr) {
          try {
            const storedUser = JSON.parse(storedUserStr);
            // Merge the stored user with the new data
            const updatedUser = { ...storedUser, ...response.data };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            console.log("validateToken: Updated user data in localStorage");
          } catch (e) {
            console.error("validateToken: Error updating user data:", e);
          }
        }
      }

      return true;
    } catch (apiError: any) {
      // Check for specific error messages
      if (apiError?.response?.data?.detail === "User not found") {
        console.error("validateToken: User not found error from server");
        // Clear invalid data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return false;
      }

      // If the server validation fails but we have a token, assume it's valid
      // This helps when there are temporary API issues
      console.warn(
        "validateToken: API error, assuming token is valid for now:",
        apiError
      );
      return true;
    }
  } catch (error) {
    console.error("validateToken: Unexpected error:", error);
    return false;
  }
};

// Logout function
export const logout = async (): Promise<void> => {
  // Import the clearCredentials function dynamically to avoid circular dependencies
  const { clearCredentials } = await import("./authService");

  // Clear credentials for token refresh
  clearCredentials();

  // Clear localStorage
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // Redirect to login page
  window.location.href = "/login";
};

// Function to download a client report as PowerPoint
export const downloadClientReport = async (
  clientId: number,
  startDate: string,
  endDate: string
): Promise<void> => {
  try {
    // Test token validity first with a lightweight request
    try {
      await api.get("/auth/me");
      console.log("Authentication check passed before download");
    } catch (error: any) {
      console.error("Authentication check failed before download", error);

      // If it's a network error, we can still try to generate a fallback report
      if (error.message === "Network Error") {
        console.warn(
          "Network error detected during authentication check, will use fallback data"
        );
        // Let the component handle this with fallback data
        throw error;
      }

      // Try to refresh the token before giving up
      try {
        const { refreshToken } = await import("./authService");
        const newToken = await refreshToken();
        if (!newToken) {
          throw new Error("Your session has expired. Please log in again.");
        }
        console.log("Token refreshed successfully before download");
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error("Your session has expired. Please log in again.");
      }
    }

    // Construct the URL for the report download
    // Make sure we're using the full URL with the correct API path
    const baseUrl = API_URL;
    const url = `${baseUrl}/api/v1/reports/export-pptx?client_id=${clientId}&start_date=${startDate}&end_date=${endDate}`;

    // Log the URL for debugging
    console.log(`PowerPoint export URL: ${url}`);

    console.log(
      `Downloading report for client ${clientId} from ${startDate} to ${endDate}`
    );
    console.log(`Download URL: ${url}`);

    // Use the downloadFile helper function with a descriptive filename
    const filename = `Client_${clientId}_Report_${startDate}_to_${endDate}.pptx`;
    await downloadFile(url, filename);

    console.log(`Report download completed successfully: ${filename}`);
  } catch (error) {
    console.error("Error downloading client report:", error);
    throw error;
  }
};

export default api;
