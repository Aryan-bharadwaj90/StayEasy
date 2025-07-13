const admin = require("firebase-admin");
const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  storageBucket: "stayeasy-e02ef.firebasestorage.app",
});
const bucket = admin.storage().bucket();

const storage = multer.memoryStorage(); 
const upload = multer({ storage });

const uploadToFirebase = async (file) => {
  const filename = `${Date.now()}-${file.originalname}`;
  const fileUpload = bucket.file(filename);
  const uuid = uuidv4();

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
      metadata: {
        firebaseStorageDownloadTokens: uuid,
      },
    },
  });

  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filename)}?alt=media&token=${uuid}`;
  return publicUrl;
};

module.exports = { upload, uploadToFirebase,bucket };
