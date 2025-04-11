import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true, // Fail if port is already in use instead of incrementing
    proxy: {
      "/api/v1": {
        target: "http://localhost:8001",
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          // Log proxy events for debugging
          proxy.on("error", (err, _req, _res) => {
            console.log("Proxy error:", err);
          });

          // Ensure authorization header is preserved
          proxy.on("proxyReq", (proxyReq, req, _res) => {
            if (req.headers.authorization) {
              // Make sure authorization header is properly formatted
              const authHeader = req.headers.authorization;
              if (!authHeader.startsWith("Bearer ")) {
                const cleanToken = authHeader.replace(/^Bearer\s+/i, "");
                proxyReq.setHeader("Authorization", `Bearer ${cleanToken}`);
              }
            }
          });
        },
      },
    },
  },
  build: {
    // Skip type checking during build for faster deployment
    typescript: {
      ignoreBuildErrors: true,
    },
  },
});
