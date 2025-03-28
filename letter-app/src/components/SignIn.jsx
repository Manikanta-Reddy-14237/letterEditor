import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  TextField,
  Button,
  Container,
  Typography,
  Paper,
  Box,
  Slide,
} from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: 400,
  margin: "auto",
  marginTop: theme.spacing(4),
}));

export const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();
      localStorage.setItem("appToken", token);
      localStorage.setItem("userId", user.uid);
      navigate("/letter");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const token = await user.getIdToken();
      localStorage.setItem("appToken", token);
      localStorage.setItem("userId", user.uid);
      navigate("/letter");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
      <Container maxWidth="xs">
        <StyledPaper elevation={3}>
          <Typography component="h1" variant="h5">
            Sign In
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              sx={{ mb: 2 }}
            >
              Sign In with Google
            </Button>
            {error && <Typography color="error">{error}</Typography>}
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </Typography>
          </Box>
        </StyledPaper>
      </Container>
    </Slide>
  );
};

export default SignIn;
