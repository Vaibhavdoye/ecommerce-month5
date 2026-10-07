const express = require("express");
const Product = require("../models/Product");
const {
  body,
  validationResult,
} = require("express-validator");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Get all products
// Get all products with search and filtering

router.get("/", async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
    } = req.query;

    const filter = {};

    // Search by product name
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    // Filter by category
    if (category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    // Filter by minimum price
    if (minPrice !== undefined) {
      filter.price = {
        ...filter.price,
        $gte: Number(minPrice),
      };
    }

    // Filter by maximum price
    if (maxPrice !== undefined) {
      filter.price = {
        ...filter.price,
        $lte: Number(maxPrice),
      };
    }

    const products = await Product.find(filter);

    res.json(products);
  } catch (error) {
    console.error("Product search/filter error:", error);

    res.status(500).json({
      message: "Failed to fetch products",
      error: error.message,
    });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  console.log("Single product route hit:", req.params.id);
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
      error: error.message
    });
  }
});

// Update product by ID
router.put(
  "/:id",
    authMiddleware,

  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Product name is required")
      .isLength({ max: 100 })
      .withMessage("Product name must not exceed 100 characters"),

    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a valid positive number"),

    body("category")
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isLength({ max: 50 })
      .withMessage("Category must not exceed 50 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),

    body("image")
      .optional()
      .trim(),
  ],
  async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  try {
    const { name, price, category, description, image } = req.body;
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        category,
        description,
          image
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update product",
      error: error.message
    });
  }
});
// Delete product by ID
router.delete(
  "/:id",
  authMiddleware,
  async (req, res) => {
try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted successfully",
      product: deletedProduct
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete product",
      error: error.message
    });
  }
});

// Add a new product
router.post(
  "/",
  authMiddleware,
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Product name is required")
      .isLength({ max: 100 })
      .withMessage("Product name must not exceed 100 characters"),

    body("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a valid positive number"),

    body("category")
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isLength({ max: 50 })
      .withMessage("Category must not exceed 50 characters"),

    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description must not exceed 500 characters"),

    body("image")
      .optional()
      .trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);

if (!errors.isEmpty()) {
  return res.status(400).json({
    message: "Validation failed",
    errors: errors.array(),
  });
}
try {
const { name, price, category, description, image } = req.body;
    const product = new Product({
  name,
  price,
  category,
  description,
  image
});
    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({
      message: "Failed to add product",
      error: error.message
    });
  }
});

module.exports = router;