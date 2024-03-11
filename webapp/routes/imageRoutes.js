const express = require("express");
const imageControllers = require("../controllers/imageControllers");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: __dirname + "/uploads/" , limits: { fieldSize: 70 * 1024 * 1024 } });
require('dotenv').config();

//  @route POST 
router.post('/v1/product/:id/image',upload.single("file"), imageControllers.uploadImage);
router.get('/v1/product/:id/image', imageControllers.getImageDetails);
router.get('/v1/product/:id/image/:imageId', imageControllers.getProductImage);
router.delete('/v1/product/:id/image/:imageId', imageControllers.deleteImage);

// handle internal server errors
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({
        message: "Something went wrong in the user routes"
    });
});

module.exports = router;