require("dotenv").config();
const express = require("express");
// db connection credentials
const connectToDB = require("./database/db");
// get auth routes
const authRoutes = require("./routes/auth-routes");
const homeRoutes = require("./routes/home-routes");
const adminRoutes = require("./routes/admin-routes");
const uploadImageRoutes = require("./routes/image-routes");

const bodyParser = require("body-parser");

// create instance of Express
const app = express();

const port = process.env.PORT || 3050;

// connect to db
connectToDB();

// middleware
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// routes
app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/image", uploadImageRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});
