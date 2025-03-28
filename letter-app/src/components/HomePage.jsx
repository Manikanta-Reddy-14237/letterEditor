import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Container, Typography, Box } from "@mui/material";

export const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Welcome to Letter App!
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/signin")}
          sx={{ mt: 3 }}
        >
          Sign In
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate("/signup")}
          sx={{ mt: 2 }}
        >
          Sign Up
        </Button>
      </Box>
    </Container>
  );
};
