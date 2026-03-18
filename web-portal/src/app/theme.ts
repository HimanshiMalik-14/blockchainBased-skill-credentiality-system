import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0f766e",
      light: "#14b8a6",
      dark: "#0d9488",
      contrastText: "#fff"
    },
    secondary: {
      main: "#1e40af",
      light: "#3b82f6",
      dark: "#1e3a8a",
      contrastText: "#fff"
    },
    success: { main: "#059669" },
    warning: { main: "#d97706" },
    error: { main: "#dc2626" },
    background: {
      default: "#f0fdfa",
      paper: "#ffffff"
    }
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800, letterSpacing: "-0.02em" },
    h2: { fontWeight: 700, letterSpacing: "-0.01em" },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" }
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 10, padding: "10px 24px", fontWeight: 600 },
        contained: { boxShadow: "0 2px 8px rgba(15, 118, 110, 0.25)" },
        outlined: { borderWidth: 2, "&:hover": { borderWidth: 2 } }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
          border: "1px solid rgba(15, 118, 110, 0.12)"
        }
      }
    },
    MuiTextField: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: { "& .MuiOutlinedInput-root": { borderRadius: 10 } }
      }
    },
    MuiChip: {
      styleOverrides: { root: { fontWeight: 600, borderRadius: 8 } }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 100%)"
        }
      }
    }
  }
});
