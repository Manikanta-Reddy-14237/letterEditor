import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Button,
  Box,
  TextField,
  IconButton,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  Typography,
  styled,
} from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FolderOpen,
  Save,
} from "@mui/icons-material";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Underline from "@tiptap/extension-underline";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./LetterEditor.css";

const StyledCircularProgress = styled(CircularProgress)(({ theme }) => ({
  color: theme.palette.primary.main,
  animationDuration: "1.5s",
  "& .MuiCircularProgress-circle": {
    strokeLinecap: "round",
  },
}));

export const LetterEditor = () => {
  const [fileName, setFileName] = useState("My Letter");
  const [userId, setUserId] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const fonts = ["Arial", "Times New Roman", "Courier New", "Verdana"];
  const editor = useEditor({
    extensions: [StarterKit, Color, TextStyle, FontFamily, Underline],
    content: "<p>Write your letter here...</p>",
  });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [fileIdToEdit, setFileIdToEdit] = useState(null);

  useEffect(() => {
    const userIdFromUrl = searchParams.get("userId");
    const contentFromUrl = searchParams.get("content");
    const fileIdFromUrl = searchParams.get("fileId");

    if (userIdFromUrl) {
      setUserId(userIdFromUrl);
      checkAuthorization(userIdFromUrl);
    }
    if (contentFromUrl && editor) {
      editor.commands.setContent(decodeURIComponent(contentFromUrl));
    }
    if (fileIdFromUrl) {
      setFileIdToEdit(fileIdFromUrl);
    }
  }, [searchParams, editor]);

  const checkAuthorization = async (userId) => {
    try {
      const token = localStorage.getItem("appToken");
      if (!token) {
        navigate("/signin");
        return;
      }
      const response = await axios.get(
        `https://lettereditor-backend.onrender.com/api/checkAuth/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setIsAuthorized(response.data);
    } catch (error) {
      console.error("Error checking authorization:", error);
      navigate("/signin");
    }
  };

  const initiateOAuth = async () => {
    setLoading(true);
    try {
      const response = await axios.get("https://lettereditor-backend.onrender.com/api/authUrl");
      window.location.href = response.data.authorizationUrl;
    } catch (error) {
      console.error("OAuth error:", error);
      alert("Error initiating OAuth flow");
    }
    setLoading(false);
  };

  const saveToGoogleDrive = async () => {
    if (!editor) return;
    setLoading(true);

    let finalFileName = fileName;
    if (!finalFileName.toLowerCase().endsWith(".docx")) {
      finalFileName += ".docx";
    }

    try {
      const token = localStorage.getItem("appToken");
      if (!token) {
        navigate("/signin");
        return;
      }
      const dataToSend = {
        userId: userId,
        html: editor.getHTML(),
        fileName: finalFileName,
      };

      let response;
      if (fileIdToEdit) {
        response = await axios.put(
          `https://lettereditor-backend.onrender.com/api/updateFile/${fileIdToEdit}`,
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        response = await axios.post(
          "https://lettereditor-backend.onrender.com/api/saveToDrive",
          dataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      alert("File saved to Google Drive");
      navigate(`/fileList?userId=${userId}`);
    } catch (error) {
      console.error(error);
      alert("Error saving file");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, textAlign: "center" }}>
        {!isAuthorized && !loading && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Authorize Google Drive to continue.
            </Typography>
            <Button variant="contained" onClick={initiateOAuth}>
              Authorize Google Drive
            </Button>
          </Box>
        )}
        {loading && <StyledCircularProgress size={60} thickness={5} />}
        {isAuthorized && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch",
            }}
          >
            <Typography variant="h5" gutterBottom>
              Letter Editor
            </Typography>
            <TextField
              label="File Name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              fullWidth
              margin="normal"
            />
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <IconButton
                onClick={() => {
                  editor && editor.chain().focus().toggleBold().run();
                }}
                sx={{
                  backgroundColor: editor?.isActive("bold")
                    ? "lightblue"
                    : "transparent",
                }}
              >
                <FormatBold />
              </IconButton>
              <IconButton
                onClick={() => {
                  editor && editor.chain().focus().toggleItalic().run();
                }}
                sx={{
                  backgroundColor: editor?.isActive("italic")
                    ? "lightblue"
                    : "transparent",
                }}
              >
                <FormatItalic />
              </IconButton>
              <IconButton
                onClick={() => {
                  editor && editor.chain().focus().toggleUnderline().run();
                }}
                sx={{
                  backgroundColor: editor?.isActive("underline")
                    ? "lightblue"
                    : "transparent",
                }}
              >
                <FormatUnderlined />
              </IconButton>
              <FormControl sx={{ minWidth: 120, ml: 2 }}>
                <InputLabel id="font-select-label">Font</InputLabel>
                <Select
                  labelId="font-select-label"
                  id="font-select"
                  value={selectedFont}
                  label="Font"
                  onChange={(e) => {
                    setSelectedFont(e.target.value);
                    editor &&
                      editor
                        .chain()
                        .focus()
                        .setFontFamily(e.target.value)
                        .run();
                  }}
                >
                  {fonts.map((font) => (
                    <MenuItem key={font} value={font}>
                      {font}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <EditorContent editor={editor} className="editor-container" />
            <Box
              sx={{ mt: 2, display: "flex", justifyContent: "space-around" }}
            >
              <Button
                variant="contained"
                onClick={saveToGoogleDrive}
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save to Drive"}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/fileList?userId=${userId}`)}
                startIcon={<FolderOpen />}
              >
                My Letters
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};
