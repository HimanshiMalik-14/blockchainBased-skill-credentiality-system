import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Link as MuiLink,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import {
  AccountCircle,
  AdminPanelSettings,
  Menu as MenuIcon,
  School,
  VerifiedUser
} from "@mui/icons-material";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

const navLinkStyle = ({ isActive }: { isActive: boolean }) => ({
  textDecoration: "none",
  color: "inherit",
  opacity: isActive ? 1 : 0.9,
  fontWeight: isActive ? 700 : 500,
  display: "flex",
  alignItems: "center",
  gap: 6
});

export function Layout() {
  const { state, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ py: 0.5 }}>
          <Typography
            component={Link}
            to="/"
            variant="h6"
            color="inherit"
            sx={{ textDecoration: "none", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Skill Credentialing
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={1} alignItems="center" sx={{ display: { xs: "none", md: "flex" } }}>
            <MuiLink component={NavLink} to="/verify" sx={navLinkStyle}>
              <VerifiedUser fontSize="small" /> Verification
            </MuiLink>
            {state.status === "authenticated" && (state.user.role === "INSTITUTION" || state.user.role === "ADMIN") && (
              <MuiLink component={NavLink} to="/institution" sx={navLinkStyle}>
                <School fontSize="small" /> Institution
              </MuiLink>
            )}
            {state.status === "authenticated" && state.user.role === "ADMIN" && (
              <MuiLink component={NavLink} to="/admin" sx={navLinkStyle}>
                <AdminPanelSettings fontSize="small" /> Admin
              </MuiLink>
            )}
            {state.status === "authenticated" ? (
              <>
                <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                  <AccountCircle />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  transformOrigin={{ vertical: "top", horizontal: "right" }}
                >
                  <MenuItem component={Link} to="/profile" onClick={() => setAnchorEl(null)}>
                    Profile
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      logout();
                      setAnchorEl(null);
                    }}
                  >
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={Link} to="/register" color="inherit" sx={{ opacity: 0.95 }}>
                  Register
                </Button>
                <Button component={Link} to="/login" variant="contained" color="secondary" sx={{ ml: 0.5 }}>
                  Login
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
