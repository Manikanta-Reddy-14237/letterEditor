const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URL}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas (models)");
  } catch (err) {
    console.error("Error connecting to MongoDB Atlas (models):", err);
  }
}

connectDB();
const db = client.db(process.env.MONGODB_DB_NAME);
const usersCollection = db.collection("users");

async function findUserById(userId) {
  try {
    return await usersCollection.findOne({ userId: userId });
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

async function saveFileToUser(userId, fileId, fileName) {
  try {
    await usersCollection.updateOne(
      { userId: userId },
      {
        $push: {
          googleDriveFiles: { fileId: fileId, fileName: fileName },
        },
      }
    );
  } catch (error) {
    console.error("Error saving file to user:", error);
    throw error;
  }
}

async function createUser(userData) {
  try {
    await usersCollection.insertOne(userData);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function getUserFiles(userId) {
  try {
    const user = await usersCollection.findOne({ userId: userId });
    if (!user) return null;
    return user.googleDriveFiles.map((file) => ({
      fileId: file.fileId,
      fileName: file.fileName,
    }));
  } catch (error) {
    console.error("Error getting user files:", error);
    throw error;
  }
}

async function checkUserAuth(userId) {
  try {
    const user = await usersCollection.findOne({ userId: userId });
    return !!user;
  } catch (error) {
    console.error("Error checking user auth:", error);
    throw error;
  }
}

async function findUserFile(userId, fileId) {
  try {
    const user = await usersCollection.findOne({ userId: userId });
    if (!user || !user.googleDriveFiles) {
      return null;
    }
    return user.googleDriveFiles.find((file) => file.fileId === fileId);
  } catch (error) {
    console.error("Error finding user file:", error);
    throw error;
  }
}

module.exports = {
  usersCollection,
  findUserById,
  saveFileToUser,
  createUser,
  getUserFiles,
  checkUserAuth,
  findUserFile,
};
