const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const User = require("./models/User");

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);

  await User.deleteMany();

  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  await User.create([
    {
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
    {
      username: "user1",
      password: userPassword,
      role: "user",
    },
  ]);

  console.log("✅ Seed user thành công");
  process.exit();
}

seed();
