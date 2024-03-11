const express = require('express');
const sequelize = require('./config/db');
const User = require('./models/users');
const Product = require('./models/products');
const Image = require('./models/images');
const http = require('http');
const logger = require("./config/winston");
require('dotenv').config();
var SDC = require('statsd-client')
const sdc = new SDC({ host: "localhost", port: 8125 });

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

app.use("/", require("./routes/healtzRoutes"));
app.use("/", require("./routes/userRoutes"));
app.use("/", require("./routes/productRoutes"));
app.use("/", require("./routes/imageRoutes"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    message: "Something went wrong"
  });
});

const server = http.createServer(app);

sequelize.connect().then(() => {
  logger.info("Connected to database");
  logger.info("Starting server at port: " + port);
  server.listen(port);
});

const handleShutdown = (signal) => {
  console.log(`Got ${signal}, starting shutdown`);
  sequelize.disconnect().then(() => {
    server.close((err) => {
      if (err) {
        console.error(err);
        return process.exit(1);
      }
      console.log("Exiting the server");
      process.exit(0);
    });
  });
};

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
process.on("SIGHUP", handleShutdown);