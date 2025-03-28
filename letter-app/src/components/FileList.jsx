import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Button,
  Typography,
  Container,
  Box,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { styled, useTheme } from "@mui/system";

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [userId, setUserId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    if (userIdFromUrl) {
      setUserId(userIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (userId) {
      const token = localStorage.getItem("appToken");
      if (!token) {
        navigate("/signin");
        return;
      }
      axios
        .get(`http://localhost:5000/api/userFiles/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          if (Array.isArray(res.data)) {
            setFiles(res.data);
          } else {
            console.error("API did not return an array:", res.data);
            setFiles([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching files:", err);
          setFiles([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [userId, navigate]);

  const handleEdit = async (fileId) => {
    const token = localStorage.getItem("appToken");
    if (!token) {
      navigate("/signin");
      return;
    }
    try {
      const response = await axios.get(
        `http://localhost:5000/api/fileContents/${fileId}?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const content = response.data;
      navigate(
        `/letter?userId=${userId}&content=${encodeURIComponent(
          content
        )}&fileId=${fileId}`
      );
    } catch (error) {
      console.error("Error fetching file content:", error);
      alert("Failed to fetch file content");
    }
  };

  const StyledListItem = styled(ListItem)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: "8px",
    marginBottom: theme.spacing(1),
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
    transition: "transform 0.2s ease-in-out",
    "&:hover": {
      transform: "scale(1.02)",
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
    },
  }));

  return (
    <Container maxWidth="md">
      <Box mt={4} textAlign="center">
        <Typography variant="h4" gutterBottom>
          Your Google Drive Files
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <List>
            {Array.isArray(files) &&
              files.map((file) => (
                <StyledListItem key={file.fileId} disableGutters>
                  <ListItemText>
                    <Link
                      to={`http://localhost:5173/viewFile/${file.fileId}?userId=${userId}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      {file.fileName}
                    </Link>
                  </ListItemText>
                  <Button
                    variant="outlined"
                    onClick={() => handleEdit(file.fileId)}
                  >
                    Edit
                  </Button>
                </StyledListItem>
              ))}
          </List>
        )}
      </Box>
    </Container>
  );
};

export default FileList;
