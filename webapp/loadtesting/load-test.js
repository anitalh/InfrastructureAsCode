const path = require("path");
const newman = require("newman");

// Set the number of test runs to be performed
const RUN_COUNT = 100;

// Define the function to run Newman
const collectionTestRun = () => {
  return new Promise((resolve, reject) => {
    newman.run({
      collection: path.join(__dirname, "postman/Webapp.postman_collection.json"),
      reporters: ["json"],
      reporter: {
        json: {
          stdout: true,
          noColor: true
        }
      },
      bail: true,
      delayRequest: 500,
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        console.info(JSON.stringify(result, null, 2));
        resolve(result);
      }
    });
  });
};

// Create an array of test commands to be executed in parallel
const commands = Array.from({
  length: RUN_COUNT
}, collectionTestRun);

// Run the test commands in parallel and output results to console
Promise.all(commands)
  .then(results => {
    // Log the result
    results.forEach(({
      collection: {
        name
      },
      run: {
        failures
      }
    }) => {
      console.info(failures.length ?
        JSON.stringify(failures.failures, null, 2) :
        `${name} tests were successful.`);
    });
  })
  .catch(err => {
    console.error(err);
  });