const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const { MongoClient } = require("mongodb");
const dotenv = require("dotenv");

dotenv.config();

const uri = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_CLUSTER_URL}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas (for middleware)");
  } catch (err) {
    console.error("Error connecting to MongoDB Atlas (for middleware):", err);
  }
}

connectDB();
const db = client.db(process.env.MONGODB_DB_NAME);
const usersCollection = db.collection("users");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    console.log("No token provided.");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    console.log("Received token:", token);
    const decodedToken = await admin.auth().verifyIdToken(token);
    const firebaseUserId = decodedToken.uid;
    console.log("Firebase UID from token:", firebaseUserId);

    const user = await usersCollection.findOne({ userId: firebaseUserId });

    console.log("User from MongoDB:", user);

    if (!user) {
      console.log("User not found in MongoDB.");
      return res.status(401).json({ message: "User not found" });
    }

    console.log("JWT Secret:", process.env.JWT_SECRET);
    const applicationToken = jwt.sign(
      { userId: user.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    req.applicationToken = applicationToken;
    req.userId = user.userId;
    next();
  } catch (error) {
    console.error(
      "Firebase token verification error:",
      error.message,
      error.stack
    );
    res
      .status(401)
      .json({ message: "Token is not valid", error: error.message });
  }
};

module.exports = authMiddleware;
