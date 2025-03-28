import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Typography, Box, Container, CircularProgress } from "@mui/material";
import { styled } from "@mui/system";

const GlassyDiv = styled(Box)(({ theme }) => ({
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  backdropFilter: "blur(10px)",
  borderRadius: "12px",
  padding: theme.spacing(3),
  margin: "auto",
  maxWidth: "80%",
  textAlign: "left",
  marginTop: theme.spacing(4),
  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
}));

const ViewFile = () => {
  const { fileId } = useParams();
  const [contents, setContents] = useState("");
  const [userId, setUserId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");

  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    if (userIdFromUrl) {
      setUserId(userIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (fileId && userId) {
      const token = localStorage.getItem("appToken");
      if (!token) {
        navigate("/signin");
        return;
      }
      axios
        .get(
          `https://lettereditor-backend.onrender.com/api/fileContents/${fileId}?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )
        .then((res) => {
          setContents(res.data);
          setLoading(false);
          const titleMatch = res.data.match(/<title>(.*?)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            setTitle(titleMatch[1]);
          }
        })
        .catch((err) => {
          console.error(err);
          if (err.response && err.response.status === 401) {
            navigate("/signin");
          } else {
            setError("Failed to load file contents.");
          }
          setLoading(false);
        });
    }
  }, [fileId, userId, navigate]);

  return (
    <Container
      maxWidth="lg"
      style={{
        backgroundColor: "whitesmoke",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
      }}
    >
      {title && (
        <Typography variant="h4" gutterBottom style={{ textAlign: "center" }}>
          {title}
        </Typography>
      )}

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography variant="body1" color="error">
          {error}
        </Typography>
      ) : (
        <GlassyDiv>
          <div dangerouslySetInnerHTML={{ __html: contents }} />
        </GlassyDiv>
      )}
    </Container>
  );
};

export default ViewFile;
