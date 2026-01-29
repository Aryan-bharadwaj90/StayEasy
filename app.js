const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./Models/Message");

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));


app.use("/api/auth", require("./Routes/authenticateRoutes"));
app.use("/api/listings", require("./Routes/listingRoutes"));
app.use("/api/bookings", require("./Routes/bookingRoutes"));
app.use("/api/reviews", require("./Routes/reviewRoutes"));
app.use("/api/messages", require("./Routes/messages"));
app.use("/api/wishlist", require("./Routes/wishlistRoutes"));
app.use("/api/properties", require("./Routes/properties"));


mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));


const io = new Server(server, {
  cors: corsOptions,
});

io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.id);

  socket.on("join", (conversationId) => {
    socket.join(conversationId);
    console.log(`Joined room: ${conversationId}`);
  });

  socket.on("leave", (conversationId) => {
    socket.leave(conversationId);
    console.log(` Left room: ${conversationId}`);
  });

  
  socket.on("sendMessage", (msg) => {
    const { text, sender, receiver, conversationId } = msg;

    if (!text || !sender || !receiver || !conversationId) {
      console.error("❗ Missing message fields:", msg);
      return;
    }

   
    io.to(conversationId).emit("receiveMessage", {
      ...msg,
      createdAt: new Date(), 
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
