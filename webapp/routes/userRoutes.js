const express = require("express");
const userControllers = require("../controllers/userControllers");
const router = express.Router();

//  @route GET, POST, PUT
router.get("/v1/user/:id", userControllers.getUserDetails);
router.post("/v1/user", userControllers.createNewUser);
router.put("/v1/user/:id", userControllers.updateUser);

// handle internal server errors
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({
        message: "Something went wrong in the user routes"
    });
});

module.exports = router;