const express = require("express");
const healthControllers = require("../controllers/healthControllers");
const router = express.Router();

//  @route GET 
router.get("/healthz", healthControllers.getHealthz);

// handle internal server errors
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({
        message: "Something went wrong in the user routes"
    });
});

module.exports = router;