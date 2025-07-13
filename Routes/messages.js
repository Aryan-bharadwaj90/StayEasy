const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Message = require("../Models/Message");
const { protect } = require("../middlewares/authenticate");

// Send a message
router.post("/", async (req, res) => {
  try {
    const { text, sender, receiver, conversationId } = req.body;
    if (!conversationId || !text || !sender || !receiver) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const msg = await Message.create({ text, sender, receiver, conversationId });
    res.status(201).json(msg);
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages in a conversation
router.get("/:conversationId", async (req, res) => {
  try {
    const msgs = await Message.find({ conversationId: req.params.conversationId })
      .sort("createdAt")
      .populate("sender receiver", "name email");
    res.json(msgs);
  } catch (err) {
    console.error("❌ Error getting conversation:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ✅ Inbox for host — unique conversations
router.get("/host/:hostId", async (req, res) => {
  try {
    const messages = await Message.find({ receiver: req.params.hostId })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });

    const uniqueGuests = {};
    const uniqueConversations = [];

    messages.forEach((msg) => {
      const guestId = msg.sender._id.toString();
      if (!uniqueGuests[guestId]) {
        uniqueGuests[guestId] = true;
        uniqueConversations.push({
          guest: msg.sender,
          conversationId: msg.conversationId,
          lastMessage: msg.text,
        });
      }
    });

    res.json(uniqueConversations);
  } catch (err) {
    console.error("❌ Failed to get host inbox", err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports=router;


