const express = require("express");
const router = express.Router();
const {
    getEvents,
    createEvent,
    deleteEvent,
    updateEvent,
} = require("../controllers/eventController");
const verifyToken = require("../middleware/authMiddleware");

router.get("/", getEvents);
router.post("/", verifyToken, createEvent);
router.delete("/:id", verifyToken, deleteEvent);
router.put("/:id", verifyToken, updateEvent);

module.exports = router;
