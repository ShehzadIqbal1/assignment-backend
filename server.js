require("dotenv").config();

const dns = require("dns");

// Use Google Public DNS
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);

    process.exit(1);
  }
};

startServer();
