const winston = require("winston");
const AwsCloudWatch = require("winston-aws-cloudwatch");

var options = {
  console: {
    level: "debug",
    handleExceptions: true,
    json: false,
    colorize: true,
    timestamp: true,
  },
};

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(options.console),
    new AwsCloudWatch({
      logGroupName: "csye6225",
      logStreamName: "webapp",
      createLogGroup: true,
      createLogStream: true,
      logRetention: 7,
      json: false,
      submissionInterval: 200,
      submissionRetryCount: 1,
      batchSize: 5,
      awsConfig: {
        region: "us-east-1",
      },
      formatLog: (item) => `${item.level}: ${item.message}`,
    }),
  ],
  exitOnError: false,
});

logger.exceptions.handle(new winston.transports.Console(options.console));
logger.level = "silly";

logger.stream({
  write: function (message, encoding) {
    logger.info(message);
  },
});

module.exports = logger;

