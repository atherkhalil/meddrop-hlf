// Importing Modules
const express = require("express");
const app = express();
const dotenv = require("dotenv");

// Using Express Methods
dotenv.config();
app.use(express.json({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Importing routes
const order = require("./routes/order");
const product = require("./routes/product");
const routes = require("./routes/route");
const payment = require("./routes/payment");

// @Desc Default Route
app.get("/", async (req, res) => {
  res.send("PLEASE LEAVE! You are NOT AUTHORIZED to access this link.");
});

app.use("/order", order);
app.use("/product", product);
app.use("/route", routes);
app.use("/payment", payment);

// Starting Server...
app.listen(process.env.PORT, () => {
  console.debug("Blockchain server listening on port " + process.env.PORT);
});
