import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Helper function to get the API base URL
const getApiBaseUrl = () => {
  return `${import.meta.env.VITE_API_URL || "http://localhost:8001"}/api/v1`;
};

interface PasswordResetProps {
  onLoad?: () => void;
}

const PasswordReset: React.FC<PasswordResetProps> = ({ onLoad }) => {
  console.log("PasswordReset component loaded");

  // Call onLoad prop when component mounts
  React.useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: Request reset, 2: Enter token and new password
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const navigate = useNavigate();

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${getApiBaseUrl()}/auth/request-password-reset`,
        {
          email,
        }
      );

      setNotification({
        open: true,
        message: response.data.message,
        severity: "success",
      });

      // For development, we can use the debug token
      if (response.data.debug_token) {
        setResetToken(response.data.debug_token);
      }

      setStep(2);
    } catch (error) {
      setNotification({
        open: true,
        message: "Error requesting password reset",
        severity: "error",
      });
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setNotification({
        open: true,
        message: "Passwords do not match",
        severity: "error",
      });
      return;
    }

    try {
      const response = await axios.post(
        `${getApiBaseUrl()}/auth/verify-password-reset`,
        {
          email,
          reset_token: resetToken,
          new_password: newPassword,
        }
      );

      setNotification({
        open: true,
        message: response.data.message,
        severity: "success",
      });

      // Redirect to login after successful reset
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error: any) {
      setNotification({
        open: true,
        message: error.response?.data?.detail || "Error resetting password",
        severity: "error",
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false,
    });
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        {step === 1 ? (
          <Box component="form" onSubmit={handleRequestReset} sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Enter your email address to receive a password reset link.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Request Password Reset
            </Button>
            <Button fullWidth variant="text" onClick={() => navigate("/login")}>
              Back to Login
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleVerifyReset} sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              Enter the reset token you received and your new password.
            </Typography>
            <TextField
              margin="normal"
              required
              fullWidth
              id="resetToken"
              label="Reset Token"
              name="resetToken"
              autoFocus
              value={resetToken}
              onChange={(e) => setResetToken(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Reset Password
            </Button>
            <Button fullWidth variant="text" onClick={() => setStep(1)}>
              Back to Request Form
            </Button>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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

export default PasswordReset;
