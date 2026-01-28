const mongoose = require("mongoose");
const msgSchema = new mongoose.Schema(
    {
        username: String,
        role: String,
        eventId: String,
        text: String,
    },
    { timestamps: true },
);
module.exports = mongoose.model("Message", msgSchema);
