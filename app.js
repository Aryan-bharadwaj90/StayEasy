
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
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});


app.use(express.json());
app.use(cors());


app.use("/api/auth", require("./Routes/authRoutes"));
app.use("/api/listings", require("./Routes/listingRoutes"));
app.use("/api/bookings", require("./Routes/bookingRoutes"));
app.use("/api/reviews", require("./Routes/reviewRoutes"));
app.use("/api/messages", require("./Routes/messages"));
app.use("/api/wishlist", require("./Routes/wishlistRoutes"));
app.use("/api/properties",require("./Routes/properties"));


mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log(" MongoDB Connected"))
  .catch((err) => console.log(" MongoDB Error:", err));


io.on("connection", (socket) => {
  console.log(" Socket connected:", socket.id);

  
  socket.on("join", (conversationId) => {
    socket.join(conversationId);
    console.log(` Joined room: ${conversationId}`);
  });

  
  socket.on("leave", (conversationId) => {
    socket.leave(conversationId);
    console.log(` Left room: ${conversationId}`);
  });

  
  socket.on("sendMessage", async (data) => {
    try {
      const { text, sender, receiver, conversationId } = data;

      if (!text || !sender || !receiver || !conversationId) {
        console.error(" Missing required fields in message:", data);
        return;
      }

      
      const msg = await Message.create({
        text,
        sender,
        receiver,
        conversationId,
      });

      
      io.to(conversationId).emit("receiveMessage", {
        ...msg.toObject(),
        createdAt: new Date(msg.createdAt),
      });

    } catch (err) {
      console.log("Hel");
      console.error(" Error saving or sending message:", err);
    }
  });
  
  
  socket.on("disconnect", () => {
    console.log(" Socket disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
