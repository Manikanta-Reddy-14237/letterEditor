import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { SignUp } from "./components/SignUp.jsx";
import { SignIn } from "./components/SignIn.jsx";
import { LetterEditor } from "./components/LetterEditor.jsx";
import { HomePage } from "./components/HomePage.jsx";
import FileList from "./components/FileList.jsx";
import ViewFile from "./components/ViewFile.jsx";
import axios from "axios";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      console.log("AuthStateChanged: User:", currentUser);
    });
    return unsubscribe;
  }, []);

  const validateToken = async (token) => {
    if (!token) {
      console.log("validateToken: No token provided.");
      return false;
    }
    try {
      const response = await axios.get(
        "https://lettereditor-backend.onrender.com/api/validateToken",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("validateToken: Response:", response.data);
      return response.data.valid;
    } catch (error) {
      console.error("validateToken: Error:", error);
      return false;
    }
  };

  const ProtectedRouteWithJwt = ({ children }) => {
    const token = localStorage.getItem("appToken");
    const [isValid, setIsValid] = useState(null);
    const [tokenValidationLoading, setTokenValidationLoading] = useState(true);

    useEffect(() => {
      const validate = async () => {
        const result = await validateToken(token);
        console.log("ProtectedRoute: Token Validation Result:", result);
        setIsValid(result);
        setTokenValidationLoading(false);
      };
      validate();
    }, [token]);

    console.log("ProtectedRoute: User:", user);
    console.log("ProtectedRoute: Is Token Valid:", isValid);
    console.log("ProtectedRoute: Token Validation Loading:", tokenValidationLoading);

    if (tokenValidationLoading) {
      return <div>Validating Token...</div>;
    }

    if (!user || !isValid) {
      console.log("ProtectedRoute: Redirecting to /signin");
      return <Navigate to="/signin" replace />;
    }

    console.log("ProtectedRoute: User is authenticated and token is valid.");
    return children;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const userIdFromUrl = searchParams.get("userId");
  console.log("App: UserId from URL:", userIdFromUrl);

  const theme = createTheme({
    palette: {
      primary: {
        main: "#1976d2",
      },
      secondary: {
        main: "#9c27b0",
      },
      background: {
        default: "#f4f5f7",
        paper: "#ffffff",
      },
      text: {
        primary: "#333",
        secondary: "#777",
      },
    },
    typography: {
      fontFamily: "Roboto, sans-serif",
      h4: {
        fontWeight: 600,
        marginBottom: "1rem",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            textTransform: "none",
            padding: "10px 20px",
          },
          outlined: {
            borderColor: "#1976d2",
            color: "#1976d2",
            "&:hover": {
              backgroundColor: "rgba(25, 118, 210, 0.08)",
            },
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: "none",
            color: "#1976d2",
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<Navigate to="/signin" />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/letter"
          element={
            <ProtectedRouteWithJwt>
              <LetterEditor userId={userIdFromUrl} />
            </ProtectedRouteWithJwt>
          }
        />
        <Route path="/home" element={<HomePage />} />
        <Route
          path="/fileList"
          element={
            <ProtectedRouteWithJwt>
              <FileList userId={userIdFromUrl} />
            </ProtectedRouteWithJwt>
          }
        />
        <Route
          path="/viewFile/:fileId"
          element={
            <ProtectedRouteWithJwt>
              <ViewFile userId={userIdFromUrl} />
            </ProtectedRouteWithJwt>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
