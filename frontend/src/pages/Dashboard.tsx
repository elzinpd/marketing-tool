import {
  AdminPanelSettings as AdminIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Helper function to get the API base URL
const getApiBaseUrl = () => {
  // Force the correct URL for Vercel deployment
  return `https://marketing-tool-omega.vercel.app/api/v1`;
  // Fallback to environment variable or localhost for development
  // return `${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/v1`;
};

// Interface definitions
interface Campaign {
  id: number | string;
  name: string;
  platform: string;
  status: string;
}

interface Client {
  id: number;
  name: string;
  campaign_keywords?: string;
  is_active?: boolean;
  campaigns?: Campaign[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "info" | "error" | "warning" | "success";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  // Check if user is admin
  const isAdmin = user?.role === "admin";

  // Function to navigate to admin dashboard
  const goToAdminDashboard = () => {
    navigate("/admin");
  };

  // Function to handle feature clicks with notifications
  const handleFeatureClick = (feature: string) => {
    setNotification({
      open: true,
      message: `${feature} functionality will be implemented in the next release`,
      severity: "info",
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  // Function to fetch clients data
  const fetchClients = async () => {
    setLoading(true);
    setError("");

    console.log("Dashboard: Fetching clients data...");
    try {
      const response = await axios.get(`${getApiBaseUrl()}/clients`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Dashboard: Clients data received:", response.data);

      // Ensure we have the campaigns property for each client
      const clientsWithCampaigns = response.data.map((client: Client) => ({
        ...client,
        campaigns: client.campaigns || [],
      }));

      setClients(clientsWithCampaigns);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError("Failed to load clients data");

      // Fallback data for demo purposes
      console.log("Dashboard: Using fallback client data");
      setClients([
        {
          id: 1,
          name: "Acme Corp",
          campaigns: [
            {
              id: 1,
              name: "Summer Promotion",
              platform: "LinkedIn",
              status: "Active",
            },
          ],
        },
        {
          id: 2,
          name: "TechStart",
          campaigns: [
            {
              id: 2,
              name: "Product Launch",
              platform: "Facebook",
              status: "Scheduled",
            },
          ],
        },
      ]);
    } finally {
      console.log("Dashboard: Setting loading to false");
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    console.log("Dashboard: Component mounted");
    fetchClients();

    // Safety timeout to ensure loading state doesn't get stuck
    const timeout = setTimeout(() => {
      if (loading) {
        console.log(
          "Dashboard: Safety timeout triggered - forcing loading state to false"
        );
        setLoading(false);

        if (clients.length === 0) {
          // Fallback data if loading takes too long
          console.log("Dashboard: Using fallback data after timeout");
          setClients([
            {
              id: 1,
              name: "Acme Corp",
              campaigns: [
                {
                  id: 1,
                  name: "Summer Promotion",
                  platform: "LinkedIn",
                  status: "Active",
                },
              ],
            },
            {
              id: 2,
              name: "TechStart",
              campaigns: [
                {
                  id: 2,
                  name: "Product Launch",
                  platform: "Facebook",
                  status: "Scheduled",
                },
              ],
            },
          ]);
        }
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {/* Welcome and role info */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.email}
          </Typography>
          <Chip
            icon={isAdmin ? <AdminIcon /> : <PersonIcon />}
            label={isAdmin ? "Admin" : "Client Manager"}
            color={isAdmin ? "secondary" : "primary"}
            variant="outlined"
            sx={{ mb: 2 }}
          />
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AdminIcon />}
            onClick={goToAdminDashboard}
          >
            Admin Dashboard
          </Button>
        )}
      </Box>

      {/* Main dashboard content */}
      <Grid container spacing={3}>
        {/* Left sidebar with menu options */}
        <Grid item xs={12} md={3}>
          <Paper elevation={2} sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Marketing Dashboard
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <List component="nav">
              <ListItemButton onClick={() => navigate("/client-dashboards")}>
                <ListItemIcon>
                  <AssessmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Client Dashboards" />
              </ListItemButton>

              {isAdmin ? (
                <ListItemButton onClick={() => navigate("/clients")}>
                  <ListItemIcon>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Client Management" />
                </ListItemButton>
              ) : (
                <ListItemButton
                  onClick={() => handleFeatureClick("Client Management")}
                >
                  <ListItemIcon>
                    <BusinessIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary="Clients" />
                </ListItemButton>
              )}

              <ListItemButton onClick={() => handleFeatureClick("Reports")}>
                <ListItemIcon>
                  <AssessmentIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Reports" />
              </ListItemButton>

              {isAdmin && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ pl: 2, mb: 1, color: "text.secondary" }}
                  >
                    Admin Tools
                  </Typography>

                  <ListItemButton onClick={() => navigate("/users")}>
                    <ListItemIcon>
                      <PeopleIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="User Management" />
                  </ListItemButton>

                  <ListItemButton onClick={() => navigate("/system-settings")}>
                    <ListItemIcon>
                      <SettingsIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText primary="System Settings" />
                  </ListItemButton>
                </>
              )}
            </List>
          </Paper>
        </Grid>

        {/* Main content area */}
        <Grid item xs={12} md={9}>
          {/* Remove duplicate Admin tools section and replace with a welcome panel */}
          {isAdmin && (
            <Box sx={{ mb: 4 }}>
              <Paper
                elevation={1}
                sx={{
                  p: 3,
                  mb: 3,
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Welcome to the Admin Dashboard
                </Typography>
                <Typography variant="body2">
                  As an administrator, you have access to user and client
                  management features. Use the sidebar links or visit the Admin
                  Dashboard for more options.
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Client campaigns section */}
          <Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">Client Dashboards</Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/client-dashboards")}
              >
                View Dashboards
              </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 4 }}>
              <Box sx={{ textAlign: "center", py: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Client Performance Dashboards
                </Typography>
                <Typography variant="body1" paragraph>
                  Access detailed performance metrics for all your assigned
                  clients. View campaign statistics, engagement data, and ROI
                  metrics.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => navigate("/client-dashboards")}
                  sx={{ mt: 2 }}
                >
                  Access Dashboards
                </Button>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Dashboard;
