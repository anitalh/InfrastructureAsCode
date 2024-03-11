const logger = require("../config/winston");
var SDC = require('statsd-client')
const sdc = new SDC({ host: "localhost", port: 8125 });

//  healthz get call
exports.getHealthz = async (req, res, next) => {
  try {
    // Increment the counter for the 'healthz.calls' metric
    sdc.increment('healthz.calls');
    logger.info("health check passed")
    res.status(200).json();
  } catch (error) {
    logger.error(`An error occurred while processing healthz request: ${error}`);
    // Call the next middleware to handle errors
    next(error);
  }
};