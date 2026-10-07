import express, { type Request, type Response, type RequestHandler } from "express";
import mongoose from "mongoose";
import { body, validationResult } from "express-validator";

import Product from "../models/Product";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

const requireAuth = authMiddleware as unknown as RequestHandler;

// Get all products with search and filtering
router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
const { search, category, minPrice, maxPrice, page = "1", limit = "20" } = req.query;

const pageNumber = Math.max(Number(page), 1);
const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
const skip = (pageNumber - 1) * limitNumber;
    const filter: Record<string, unknown> = {};

    if (typeof search === "string" && search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (typeof category === "string" && category) {
      filter.category = {
        $regex: `^${category}$`,
        $options: "i",
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: Record<string, number> = {};

      if (minPrice !== undefined) {
        priceFilter.$gte = Number(minPrice);
      }

      if (maxPrice !== undefined) {
        priceFilter.$lte = Number(maxPrice);
      }

      filter.price = priceFilter;
    }
    const totalProducts = await Product.countDocuments(filter);
const products = await Product.find(filter)
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limitNumber);
  res.json({
  products,
  pagination: {
    page: pageNumber,
    limit: limitNumber,
    totalProducts,
    totalPages: Math.ceil(totalProducts / limitNumber),
  },
});
  } catch (error) {
    console.error("Product search/filter error:", error);

    res.status(500).json({
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get single product by ID
router.get("/:id", async (req: Request, res: Response): Promise<void> => {
  console.log("Single product route hit:", req.params.id);

  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
  res.status(400).json({
    message: "Invalid product ID",
  });
  return;
}
    const product = await Product.findById(req.params.id);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch product",
error:
  process.env.NODE_ENV === "production"
    ? "Internal server error"
    : error instanceof Error
      ? error.message
      : "Unknown error",
    });
  }
});

// Update product by ID
router.put(
  "/:id",
  requireAuth,
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

    body("image").optional().trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    try {
      const { name, price, category, description, image } = req.body;

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        { name, price, category, description, image },
        { new: true, runValidators: true }
      );

      if (!updatedProduct) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({
        message: "Failed to update product",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete product by ID
router.delete(
  "/:id",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const deletedProduct = await Product.findByIdAndDelete(req.params.id);

      if (!deletedProduct) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      res.json({
        message: "Product deleted successfully",
        product: deletedProduct,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to delete product",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Add a new product
router.post(
  "/",
  requireAuth,
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

    body("image").optional().trim(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({
        message: "Validation failed",
        errors: errors.array(),
      });
      return;
    }

    try {
      const { name, price, category, description, image } = req.body;

      const product = new Product({
        name,
        price,
        category,
        description,
        image,
      });

      const savedProduct = await product.save();
      res.status(201).json(savedProduct);
    } catch (error) {
      res.status(500).json({
        message: "Failed to add product",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default router;