import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useApi } from "../hooks/useApi";

interface Client {
  id: number;
  name: string;
  campaign_keywords: string;
  is_active: boolean;
}

interface User {
  id: number;
  email: string;
  role: string;
  clients: number[];
  is_active: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface UserForm {
  email: string;
  password: string;
  role: "client_manager" | "admin";
  clients: number[];
}

const TabPanel = React.memo((props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
});

// Helper function to get the API base URL
const getApiBaseUrl = () => {
  // Force the correct URL for Vercel deployment
  return `https://marketing-tool-omega.vercel.app/api/v1`;
  // Fallback to environment variable or localhost for development
  // return `${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/v1`;
};

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated()) {
    console.log(
      "Admin Dashboard: User not authenticated, redirecting to login"
    );
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    console.log(
      `Admin Dashboard: User ${user?.email} has role ${user?.role}, not admin. Redirecting to dashboard`
    );
    return <Navigate to="/dashboard" replace />;
  }

  console.log(
    `Admin Dashboard: Admin user ${user?.email} authenticated successfully`
  );
  return <AdminDashboardContent />;
};

const AdminDashboardContent: React.FC = () => {
  const api = useApi();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mountedRef = useRef(true);
  const [tabValue, setTabValue] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [clientForm, setClientForm] = useState({
    name: "",
    campaign_keywords: "",
  });
  const [userForm, setUserForm] = useState<UserForm>({
    email: "",
    password: "",
    role: "client_manager",
    clients: [],
  });
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!mountedRef.current) return;
    setLoading(true);
    setError(null);

    console.log("AdminDashboard: Loading data...");
    try {
      // Get token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("AdminDashboard: Making API requests with token");

      // Use direct axios calls with the API base URL to ensure we're hitting the right endpoints
      const clientsResponse = await axios.get(
        `https://marketing-tool-omega.vercel.app/api/v1/clients`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(
        "AdminDashboard: Clients data received:",
        clientsResponse.data
      );

      // If clients request succeeded, try users request
      const usersResponse = await axios.get(
        `https://marketing-tool-omega.vercel.app/api/v1/users`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!mountedRef.current) return;

      console.log("AdminDashboard: Users data received:", usersResponse.data);

      if (!Array.isArray(clientsResponse.data)) {
        console.error("Invalid clients data format:", clientsResponse.data);
        throw new Error("Invalid clients data format received from server");
      }

      if (!Array.isArray(usersResponse.data)) {
        console.error("Invalid users data format:", usersResponse.data);
        throw new Error("Invalid users data format received from server");
      }

      setClients(clientsResponse.data);
      setUsers(usersResponse.data);
    } catch (err) {
      if (mountedRef.current) {
        console.error("Error loading dashboard data:", err);
        setError(
          "Failed to load dashboard data. " +
            (err instanceof Error ? err.message : "Unknown error")
        );

        // Set fallback data for testing
        console.log("AdminDashboard: Using fallback data");
        setClients([
          {
            id: 1,
            name: "Demo Client",
            campaign_keywords: "marketing, demo",
            is_active: true,
          },
        ]);
        setUsers([
          {
            id: 1,
            email: "admin@example.com",
            role: "admin",
            clients: [],
            is_active: true,
          },
        ]);
      }
    } finally {
      if (mountedRef.current) {
        console.log("AdminDashboard: Setting loading to false");
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadData();

    // Add safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log(
          "AdminDashboard: Safety timeout triggered - forcing loading state to false"
        );
        setLoading(false);
        if (clients.length === 0 && users.length === 0) {
          // Set fallback data
          console.log("AdminDashboard: Using fallback data after timeout");
          setClients([
            {
              id: 1,
              name: "Demo Client",
              campaign_keywords: "marketing, demo",
              is_active: true,
            },
          ]);
          setUsers([
            {
              id: 1,
              email: "admin@example.com",
              role: "admin",
              clients: [],
              is_active: true,
            },
          ]);
        }
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loadData, loading]);

  const handleClientFormChange = useCallback(
    (field: keyof typeof clientForm, value: string) => {
      setClientForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleUserFormChange = useCallback(
    (field: keyof UserForm, value: string | number[]) => {
      setUserForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleOpenClientDialog = useCallback((client?: Client) => {
    if (!mountedRef.current) return;
    setSelectedClient(client || null);
    setClientForm(
      client
        ? {
            name: client.name,
            campaign_keywords: client.campaign_keywords,
          }
        : {
            name: "",
            campaign_keywords: "",
          }
    );
    setOpenClientDialog(true);
  }, []);

  const handleCloseClientDialog = useCallback(() => {
    if (!mountedRef.current) return;
    setOpenClientDialog(false);
    setSelectedClient(null);
    setClientForm({
      name: "",
      campaign_keywords: "",
    });
  }, []);

  const showNotification = useCallback(
    (message: string, severity: "success" | "error" | "info" = "info") => {
      setNotification({
        open: true,
        message,
        severity,
      });
    },
    []
  );

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  const handleSaveClient = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      setError(null);
      if (!clientForm.name.trim()) {
        setError("Client name is required");
        showNotification("Client name is required", "error");
        return;
      }

      // Get token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log(
        `AdminDashboard: ${selectedClient ? "Updating" : "Creating"} client:`,
        clientForm
      );

      if (selectedClient) {
        await axios.put(
          `${getApiBaseUrl()}/clients/${selectedClient.id}`,
          clientForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showNotification(
          `Client "${clientForm.name}" updated successfully`,
          "success"
        );
      } else {
        await axios.post(`${getApiBaseUrl()}/clients`, clientForm, {
          headers: { Authorization: `Bearer ${token}` },
        });
        showNotification(
          `Client "${clientForm.name}" created successfully`,
          "success"
        );
      }
      await loadData();
      handleCloseClientDialog();
    } catch (error) {
      if (mountedRef.current) {
        console.error("Error saving client:", error);
        setError(
          "Failed to save client: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
        showNotification("Failed to save client", "error");
      }
    }
  }, [
    api,
    clientForm,
    selectedClient,
    loadData,
    handleCloseClientDialog,
    showNotification,
  ]);

  const handleDeleteClient = useCallback(
    async (clientId: number) => {
      if (!mountedRef.current) return;
      if (window.confirm("Are you sure you want to delete this client?")) {
        try {
          setError(null);

          // Get token
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          console.log(`AdminDashboard: Deleting client with ID ${clientId}`);

          await axios.delete(`${getApiBaseUrl()}/clients/${clientId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("Client deleted successfully", "success");
          await loadData();
        } catch (error) {
          if (mountedRef.current) {
            console.error("Error deleting client:", error);
            setError(
              "Failed to delete client: " +
                (error instanceof Error ? error.message : "Unknown error")
            );
            showNotification("Failed to delete client", "error");
          }
        }
      }
    },
    [loadData, showNotification]
  );

  const handleOpenUserDialog = useCallback((user?: User) => {
    if (!mountedRef.current) return;
    setSelectedUser(user || null);
    setUserForm(
      user
        ? {
            email: user.email,
            password: "",
            role: user.role as "client_manager" | "admin",
            clients: user.clients || [],
          }
        : {
            email: "",
            password: "",
            role: "client_manager",
            clients: [],
          }
    );
    setOpenUserDialog(true);
  }, []);

  const handleCloseUserDialog = useCallback(() => {
    if (!mountedRef.current) return;
    setOpenUserDialog(false);
    setSelectedUser(null);
    setUserForm({
      email: "",
      password: "",
      role: "client_manager",
      clients: [],
    });
  }, []);

  const handleSaveUser = useCallback(async () => {
    if (!mountedRef.current) return;
    try {
      setError(null);
      if (!userForm.email.trim()) {
        setError("Email is required");
        showNotification("Email is required", "error");
        return;
      }

      if (!selectedUser && !userForm.password) {
        setError("Password is required for new users");
        showNotification("Password is required for new users", "error");
        return;
      }

      // Get token
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log(
        `AdminDashboard: ${selectedUser ? "Updating" : "Creating"} user:`,
        userForm
      );

      if (selectedUser) {
        // First update the user's basic information
        const userUpdateData = {
          email: userForm.email,
          password: userForm.password || undefined,
          role: userForm.role,
        };

        await axios.put(
          `${getApiBaseUrl()}/users/${selectedUser.id}`,
          userUpdateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Then assign clients using the new endpoint
        const existingClientIds = selectedUser.clients || [];
        const clientsToAdd = userForm.clients.filter(
          (clientId) => !existingClientIds.includes(clientId)
        );

        // Assign each new client
        for (const clientId of clientsToAdd) {
          await axios.post(
            `${getApiBaseUrl()}/users/${selectedUser.id}/clients`,
            { client_id: clientId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        showNotification(
          `User ${userForm.email} updated successfully`,
          "success"
        );
      } else {
        // First create the user with basic information
        const userCreateData = {
          email: userForm.email,
          password: userForm.password,
          role: userForm.role,
        };

        const response = await axios.post(
          `${getApiBaseUrl()}/users`,
          userCreateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const newUserId = response.data.id;

        // Then assign clients using the new endpoint
        for (const clientId of userForm.clients) {
          await axios.post(
            `${getApiBaseUrl()}/users/${newUserId}/clients`,
            { client_id: clientId },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        showNotification(
          `User ${userForm.email} created successfully`,
          "success"
        );
      }
      await loadData();
      handleCloseUserDialog();
    } catch (error) {
      if (mountedRef.current) {
        console.error("Error saving user:", error);
        setError(
          "Failed to save user: " +
            (error instanceof Error ? error.message : "Unknown error")
        );
        showNotification("Failed to save user", "error");
      }
    }
  }, [
    selectedUser,
    userForm,
    loadData,
    handleCloseUserDialog,
    showNotification,
  ]);

  const handleDeleteUser = useCallback(
    async (userId: number) => {
      if (!mountedRef.current) return;
      if (window.confirm("Are you sure you want to delete this user?")) {
        try {
          setError(null);

          // Get token
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          console.log(`AdminDashboard: Deleting user with ID ${userId}`);

          await axios.delete(`${getApiBaseUrl()}/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          showNotification("User deleted successfully", "success");
          await loadData();
        } catch (error) {
          if (mountedRef.current) {
            console.error("Error deleting user:", error);
            setError(
              "Failed to delete user: " +
                (error instanceof Error ? error.message : "Unknown error")
            );
            showNotification("Failed to delete user", "error");
          }
        }
      }
    },
    [loadData, showNotification]
  );

  const handleAssignClient = useCallback(
    async (userId: number, clientId: number) => {
      if (!mountedRef.current) return;
      try {
        setError(null);
        await api.post(`/users/${userId}/clients`, { client_id: clientId });
        await loadData();
      } catch (error) {
        if (mountedRef.current) {
          console.error("Error assigning client:", error);
          setError("Failed to assign client");
        }
      }
    },
    [api, loadData]
  );

  const handleRemoveClient = useCallback(
    async (userId: number, clientId: number) => {
      if (!mountedRef.current) return;
      try {
        setError(null);
        await api["delete"](`/users/${userId}/clients/${clientId}`);
        await loadData();
      } catch (error) {
        if (mountedRef.current) {
          console.error("Error removing client:", error);
          setError("Failed to remove client");
        }
      }
    },
    [api, loadData]
  );

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBackToDashboard = useCallback(() => {
    navigate("/dashboard");
  }, [navigate]);

  const renderHeader = (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <IconButton
          color="primary"
          sx={{ mr: 2 }}
          onClick={() => navigate("/dashboard")}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4">Admin Dashboard</Typography>
      </Box>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("/dashboard");
          }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary">Admin</Typography>
      </Breadcrumbs>
    </Box>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {renderHeader}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {renderHeader}
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button
            variant="text"
            color="inherit"
            onClick={loadData}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4 }}>
      {renderHeader}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4">{users.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Clients
              </Typography>
              <Typography variant="h4">{clients.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Admin Users
              </Typography>
              <Typography variant="h4">
                {users.filter((user) => user.role === "admin").length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: "100%", mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="admin tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="User Management" />
          <Tab label="Client Management" />
          <Tab label="System Settings" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Users</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenUserDialog()}
            >
              Add User
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned Clients</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role}
                        color={user.role === "admin" ? "secondary" : "primary"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.is_active ? "Active" : "Inactive"}
                        color={user.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {user.clients.length > 0
                        ? clients
                            .filter((client) =>
                              user.clients.includes(client.id)
                            )
                            .map((client) => client.name)
                            .join(", ")
                        : "None"}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenUserDialog(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Clients</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenClientDialog()}
            >
              Add Client
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Campaign Keywords</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{client.campaign_keywords}</TableCell>
                    <TableCell>
                      <Chip
                        label={client.is_active ? "Active" : "Inactive"}
                        color={client.is_active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenClientDialog(client)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClient(client.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Alert severity="info" sx={{ mb: 3 }}>
            System settings functionality will be implemented in a future
            update.
          </Alert>
        </TabPanel>
      </Paper>

      <Dialog
        open={openClientDialog}
        onClose={handleCloseClientDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedClient
            ? `Edit Client: ${selectedClient.name}`
            : "Add New Client"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Client Name"
            fullWidth
            value={clientForm.name}
            onChange={(e) => handleClientFormChange("name", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Campaign Keywords (comma-separated)"
            fullWidth
            value={clientForm.campaign_keywords}
            onChange={(e) =>
              handleClientFormChange("campaign_keywords", e.target.value)
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseClientDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveClient}
            variant="contained"
            color="primary"
          >
            {selectedClient ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* User Dialog */}
      <Dialog
        open={openUserDialog}
        onClose={handleCloseUserDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? `Edit User: ${selectedUser.email}` : "Add New User"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={userForm.email}
            onChange={(e) => handleUserFormChange("email", e.target.value)}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={userForm.password}
            onChange={(e) => handleUserFormChange("password", e.target.value)}
            helperText={
              selectedUser
                ? "Leave blank to keep current password"
                : "Required for new users"
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={userForm.role}
              label="Role"
              onChange={(e) =>
                handleUserFormChange(
                  "role",
                  e.target.value as "client_manager" | "admin"
                )
              }
            >
              <MenuItem value="client_manager">Client Manager</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>Assigned Clients</InputLabel>
            <Select
              multiple
              value={userForm.clients}
              label="Assigned Clients"
              onChange={(e) =>
                handleUserFormChange("clients", e.target.value as number[])
              }
            >
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUserDialog} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            {selectedUser ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminDashboard;
