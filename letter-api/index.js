const { google } = require("googleapis");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");
const stream = require("stream");
const { exec } = require("child_process");

dotenv.config();

app.use(cors());
app.use(bodyParser.json());

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const serviceAccount = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Important: Handle newlines
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const {
  findUserById,
  saveFileToUser,
  updateUserTokens,
  createUser,
  getUserFiles,
  checkUserAuth,
  findUserFile,
  usersCollection,
} = require("./models/user");

app.get("/api/authUrl", (req, res) => {
  const scopes = [
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  const authorizationUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });

  res.json({ authorizationUrl });
});

app.get("/api/oauth/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      console.error("Access token missing from initial tokens.");
      return res.status(500).send("Access token not received from Google.");
    }

    oauth2Client.setCredentials(tokens);

    const googleOauth = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await googleOauth.userinfo.get();
    const googleEmail = userInfo.data.email;

    const firebaseUser = await admin.auth().getUserByEmail(googleEmail);
    const firebaseUserId = firebaseUser.uid;

    let user = await findUserById(firebaseUserId);

    if (user) {
      await usersCollection.updateOne(
        { userId: firebaseUserId },
        {
          $set: {
            accessToken: tokens.access_token,
          },
        }
      );
    } else {
      await createUser({
        userId: firebaseUserId,
        email: googleEmail,
        accessToken: tokens.access_token,
        googleDriveFiles: [],
      });
      user = { userId: firebaseUserId };
      console.log("New user created.");
    }

    res.redirect(`https://lettereditor-frontend.onrender.com/letter?userId=${user.userId}`);
  } catch (error) {
    console.error("OAuth Callback Error:", error);
    console.error("Error Details:", JSON.stringify(error, null, 2));
    res.status(500).send("Error during OAuth callback.");
  }
});

const auth = require("./middleware/auth");

app.post("/api/saveToDrive", auth, async (req, res) => {
  const { html, fileName } = req.body;
  const userId = req.userId;

  try {
      console.log("Saving file:", fileName, "for user:", userId);

      const user = await findUserById(userId);
      if (!user) {
          console.log("User not found.");
          return res.status(401).send("User not found.");
      }

      console.log("User found:", user);

      let accessToken = user.accessToken;

      const googleAuth = new google.auth.OAuth2();
      googleAuth.setCredentials({
          access_token: accessToken,
      });

      const drive = google.drive({ version: "v3", auth: googleAuth });

      const htmlFilePath = path.join(__dirname, `${fileName}.html`);
      const docxFilePath = path.join(__dirname, `${fileName}.docx`);

      fs.writeFileSync(htmlFilePath, html);

      exec(
          `pandoc "${htmlFilePath}" -o "${docxFilePath}"`, // Corrected Pandoc command
          async (error, stdout, stderr) => {
              if (error) {
                  console.error("Pandoc error:", error);
                  fs.unlinkSync(htmlFilePath);
                  return res.status(500).send("Pandoc conversion failed.");
              }

              try {
                  const docxBuffer = fs.readFileSync(docxFilePath);
                  fs.unlinkSync(htmlFilePath);
                  fs.unlinkSync(docxFilePath);

                  const bufferStream = new stream.Readable();
                  bufferStream.push(docxBuffer);
                  bufferStream.push(null);

                  const fileMetadata = {
                      name: `${fileName}.docx`,
                      mimeType: "application/vnd.google-apps.document",
                  };

                  const media = {
                      mimeType:
                          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                      body: bufferStream,
                  };

                  const googleDriveFile = await drive.files.create({
                      resource: fileMetadata,
                      media: media,
                  });

                  const existingFileIndex = user.googleDriveFiles.findIndex(
                      (file) => file.fileName === fileName
                  );

                  if (existingFileIndex !== -1) {
                      console.log("File with same name exists, updating...");
                      try {
                          const result = await usersCollection.updateOne(
                              { userId: userId, "googleDriveFiles.fileName": fileName },
                              {
                                  $set: {
                                      "googleDriveFiles.$.fileId": googleDriveFile.data.id,
                                      "googleDriveFiles.$.fileName": fileName,
                                  },
                              }
                          );
                          console.log("Update result:", result);
                      } catch (updateError) {
                          console.error("Database update error:", updateError);
                      }
                  } else {
                      console.log("File with same name does not exist, adding...");
                      await saveFileToUser(userId, googleDriveFile.data.id, fileName);
                  }

                  res.send({
                      fileId: googleDriveFile.data.id,
                      message: "File saved to Google Drive.",
                  });
              } catch (error) {
                  console.error("Error reading or sending docx:", error);
                  res.status(500).send("Error reading or sending docx");
              }
          }
      );
  } catch (error) {
      console.error(error);
      res.status(500).send("Error saving file.");
  }
});

app.get("/api/userFiles/:userId", auth, async (req, res) => {
  const userId = req.userId;

  console.log("Fetching files for userId:", userId);

  try {
    const fileList = await getUserFiles(userId);

    if (!fileList) {
      console.log("User not found.");
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Files found:", fileList);
    res.json(fileList);
  } catch (error) {
    console.error("Error fetching user files:", error);
    res.status(500).json({ message: "Error fetching user files" });
  }
});

app.get("/api/checkAuth/:userId", auth, async (req, res) => {
  const userId = req.userId;

  try {
    const authorized = await checkUserAuth(userId);
    res.json({ authorized: authorized });
  } catch (error) {
    console.error("Error checking authorization:", error);
    res.status(500).json({ error: "Error checking authorization" });
  }
});

app.get("/api/fileContents/:fileId", auth, async (req, res) => {
  const { fileId } = req.params;
  const userId = req.userId;

  console.log("Fetching content for fileId:", fileId, "userId:", userId);

  try {
    const file = await findUserFile(userId, fileId);
    if (!file) {
      console.log("File not found.");
      return res.status(404).send("File not found.");
    }

    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).send("User not found");
    }

    const googleAuth = new google.auth.OAuth2();
    googleAuth.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const drive = google.drive({ version: "v3", auth: googleAuth });

    try {
      await drive.files.list({ pageSize: 1 });
    } catch (error) {
      if (
        error.response &&
        error.response.status === 401 &&
        user.refreshToken
      ) {
        const newAccessToken = await refreshAccessToken(user.refreshToken);
        googleAuth.setCredentials({
          access_token: newAccessToken,
          refresh_token: user.refreshToken,
        });
        await updateUserTokens(userId, newAccessToken, user.refreshToken);
      } else {
        console.error("Error with Google Drive API:", error);
        return res.status(500).send("Error with Google Drive API");
      }
    }

    const downloadedFile = await drive.files.export({
      fileId: fileId,
      mimeType: "text/html",
    });

    console.log("File content retrieved.");
    res.send(String(downloadedFile.data));
  } catch (error) {
    console.error(error);
    res.status(500).send("Error downloading file.");
  }
});

async function refreshAccessToken(refreshToken) {
  console.log("Refreshing token with CLIENT_ID:", process.env.CLIENT_ID);
  console.log(
    "Refreshing token with CLIENT_SECRET:",
    process.env.CLIENT_SECRET
  );

  const googleAuth = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET
  );
  googleAuth.setCredentials({ refresh_token: refreshToken });

  console.log("OAuth2Client instance:", googleAuth);

  try {
    const { tokens } = await googleAuth.refreshAccessToken();
    return tokens.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

app.put("/api/updateFile/:fileId", auth, async (req, res) => {
  const { fileId } = req.params;
  const { html, fileName } = req.body;
  const userId = req.userId;

  try {
    const user = await findUserById(userId);
    if (!user) {
      return res.status(401).send("User not found.");
    }

    const googleAuth = new google.auth.OAuth2();
    googleAuth.setCredentials({
      access_token: user.accessToken,
      refresh_token: user.refreshToken,
    });

    const drive = google.drive({ version: "v3", auth: googleAuth });

    const htmlFilePath = path.join(__dirname, `${fileName}.html`);
    const docxFilePath = path.join(__dirname, `${fileName}.docx`);

    fs.writeFileSync(htmlFilePath, html);

    exec(
      `pandoc "${htmlFilePath}" -o "${docxFilePath}"`,
      async (error, stdout, stderr) => {
        if (error) {
          console.error("Pandoc error:", error);
          fs.unlinkSync(htmlFilePath);
          return res.status(500).send("Pandoc conversion failed.");
        }

        try {
          const docxBuffer = fs.readFileSync(docxFilePath);
          fs.unlinkSync(htmlFilePath);
          fs.unlinkSync(docxFilePath);

          const bufferStream = new stream.Readable();
          bufferStream.push(docxBuffer);
          bufferStream.push(null);

          const media = {
            mimeType:
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            body: bufferStream,
          };

          await drive.files.update({
            fileId: fileId,
            media: media,
          });

          await drive.files.update({
            fileId: fileId,
            resource: {
              name: fileName,
            },
          });

          res.send("File updated successfully");
        } catch (error) {
          console.error("Error reading or sending docx:", error);
          res.status(500).send("Error reading or sending docx");
        }
      }
    );
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).send("Error updating file");
  }
});

app.get("/api/getAppToken", async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    console.log("No token provided.");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    res.json({ appToken: token });
  } catch (error) {
    console.error("Error:", error.message, error.stack);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

app.post("/api/createUser", async (req, res) => {
  try {
    const { firebaseUserId, email, name, picture } = req.body;
    const result = await createUser({
      userId: firebaseUserId,
      email: email,
      name: name,
      picture: picture,
      googleDriveFiles: [],
    });

    res.json({ message: "User created", userId: firebaseUserId });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.get("/api/validateToken", async (req, res) => {
  const token = req.headers.authorization?.split("Bearer ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    res.json({ valid: true, uid: decodedToken.uid });
  } catch (error) {
    console.error("Token validation error:", error);
    res
      .status(401)
      .json({ valid: false, error: "Unauthorized: Invalid token" });
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server started");
});
