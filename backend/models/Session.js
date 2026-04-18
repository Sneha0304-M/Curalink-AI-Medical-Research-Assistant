const mongoose = require("mongoose");

// Each message in a conversation
const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  // Structured data attached to assistant messages
  publications: [{ type: mongoose.Schema.Types.Mixed }],
  trials: [{ type: mongoose.Schema.Types.Mixed }],
  timestamp: { type: Date, default: Date.now },
});

// A conversation session (one per user session)
const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    // User medical context (set on first message or via form)
    context: {
      patientName: String,
      disease: String,
      location: String,
    },
    messages: [MessageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Session", SessionSchema);
