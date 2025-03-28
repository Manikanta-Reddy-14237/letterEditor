import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
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
import axios from "axios";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  maxWidth: 400,
  margin: "auto",
  marginTop: theme.spacing(4),
}));

export const SignUp = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const token = await user.getIdToken();

      // Create user in backend
      await axios.post("https://lettereditor-backend.onrender.com/api/createUser", {
        firebaseUserId: user.uid,
        email: user.email,
        name: name,
        picture: null,
      });

      const response = await fetch("https://lettereditor-backend.onrender.com/api/getAppToken", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to get app token");
      }
      const data = await response.json();
      localStorage.setItem("appToken", data.appToken);
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

      await axios.post("https://lettereditor-backend.onrender.com/api/createUser", {
        firebaseUserId: user.uid,
        email: user.email,
        name: user.displayName,
        picture: user.photoURL,
      });

      const response = await fetch("https://lettereditor-backend.onrender.com/api/getAppToken", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Failed to get app token");
      }
      const data = await response.json();
      localStorage.setItem("appToken", data.appToken);
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
            Sign Up
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
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
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
              Sign Up
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              sx={{ mb: 2 }}
            >
              Sign Up with Google
            </Button>
            {error && <Typography color="error">{error}</Typography>}
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Already have an account? <Link to="/signin">Sign In</Link>
            </Typography>
          </Box>
        </StyledPaper>
      </Container>
    </Slide>
  );
};

export default SignUp;
