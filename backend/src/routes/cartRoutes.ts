import express, { type Request, type Response, type RequestHandler } from "express";

import Cart from "../models/Cart";
import Product from "../models/Product";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

const requireAuth = authMiddleware as unknown as RequestHandler;

interface AuthenticatedRequest extends Request {
  user?: string | import("jsonwebtoken").JwtPayload;
}

const getUserId = (req: Request): string | undefined => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user as import("jsonwebtoken").JwtPayload | undefined;

  return typeof user?.userId === "string" ? user.userId : undefined;
};

// Get logged-in user's cart
router.get(
  "/",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      let cart = await Cart.findOne({ user: userId }).populate("items.product");

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [],
        });
      }

      res.json(cart);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch cart" });
    }
  }
);

// Add product to cart
router.post(
  "/add",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);
      const { productId } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      if (typeof productId !== "string" || !productId) {
        res.status(400).json({ message: "Product ID is required" });
        return;
      }

      const product = await Product.findById(productId);

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      let cart = await Cart.findOne({ user: userId });

      if (!cart) {
        cart = await Cart.create({
          user: userId,
          items: [{ product: product._id, quantity: 1 }],
        });
      } else {
        const existingItem = cart.items.find(
          (item) => item.product.toString() === productId
        );

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.items.push({
            product: product._id,
            quantity: 1,
          });
        }

        await cart.save();
      }

      const updatedCart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      res.json({
        message: "Product added to cart",
        cart: updatedCart,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to add product to cart" });
    }
  }
);

// Increase product quantity
router.put(
  "/increase/:productId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        res.status(404).json({ message: "Cart not found" });
        return;
      }

      const item = cart.items.find(
        (item) => item.product.toString() === req.params.productId
      );

      if (!item) {
        res.status(404).json({ message: "Product not found in cart" });
        return;
      }

      item.quantity += 1;
      await cart.save();

      const updatedCart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      res.json({
        message: "Quantity increased",
        cart: updatedCart,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to increase quantity" });
    }
  }
);

// Decrease product quantity
router.put(
  "/decrease/:productId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        res.status(404).json({ message: "Cart not found" });
        return;
      }

      const item = cart.items.find(
        (item) => item.product.toString() === req.params.productId
      );

      if (!item) {
        res.status(404).json({ message: "Product not found in cart" });
        return;
      }

      item.quantity -= 1;

      if (item.quantity <= 0) {
        cart.items = cart.items.filter(
          (cartItem) =>
            cartItem.product.toString() !== req.params.productId
        );
      }

      await cart.save();

      const updatedCart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      res.json({
        message: "Quantity decreased",
        cart: updatedCart,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to decrease quantity" });
    }
  }
);

// Remove product completely from cart
router.delete(
  "/remove/:productId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      const cart = await Cart.findOne({ user: userId });

      if (!cart) {
        res.status(404).json({ message: "Cart not found" });
        return;
      }

      cart.items = cart.items.filter(
        (item) => item.product.toString() !== req.params.productId
      );

      await cart.save();

      const updatedCart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      res.json({
        message: "Product removed from cart",
        cart: updatedCart,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to remove product from cart" });
    }
  }
);

export default router;