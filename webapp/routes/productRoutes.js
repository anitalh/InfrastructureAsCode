const express = require("express");
const productControllers = require("../controllers/productControllers");
const router = express.Router();

//  @route GET, POST, PUT, DELETE
router.get("/v1/product/:id", productControllers.getProducts);
router.post("/v1/product", productControllers.createNewProduct);
router.put("/v1/product/:id", productControllers.updateProduct);
router.patch("/v1/product/:id", productControllers.updateProductByPatch);
router.delete("/v1/product/:id", productControllers.deleteProduct);

// handle internal server errors
router.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({
        message: "Something went wrong in the user routes"
    });
});

module.exports = router;