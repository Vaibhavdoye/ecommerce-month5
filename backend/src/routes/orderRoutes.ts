import express, { type Request, type Response, type RequestHandler } from "express";
import type { JwtPayload } from "jsonwebtoken";

import Order from "../models/Order";
import Cart from "../models/Cart";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

const requireAuth = authMiddleware as unknown as RequestHandler;

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

const getUserId = (req: Request): string | undefined => {
  const authReq = req as AuthenticatedRequest;
  const user = authReq.user as JwtPayload | undefined;

  return typeof user?.userId === "string" ? user.userId : undefined;
};

// Create order from cart
router.post(
  "/checkout",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      const cart = await Cart.findOne({ user: userId }).populate(
        "items.product"
      );

      if (!cart || cart.items.length === 0) {
        res.status(400).json({ message: "Cart is empty" });
        return;
      }

      // Remove cart items whose products no longer exist
      const validItems = cart.items.filter((item) => item.product);

      if (validItems.length === 0) {
        cart.items = [];
        await cart.save();

        res.status(400).json({
          message: "Cart contains no valid products",
        });
        return;
      }

      // Remove invalid/deleted products from the cart
      if (validItems.length !== cart.items.length) {
        cart.items = validItems.map((item) => ({
          product: item.product as never,
          quantity: item.quantity,
        }));

        await cart.save();
      }

      const orderItems = validItems.map((item) => {
        const product = item.product as unknown as {
          _id: import("mongoose").Types.ObjectId;
          name: string;
          price: number;
        };

        return {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: item.quantity,
        };
      });

      const totalAmount = orderItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
      );

      const order = await Order.create({
        user: userId,
        items: orderItems,
        totalAmount,
      });

      // Clear cart after order is created
      cart.items = [];
      await cart.save();

      res.status(201).json({
        message: "Order created successfully",
        order,
      });
    } catch (error) {
      console.error("Checkout error:", error);

      res.status(500).json({
        message: "Failed to create order",
      });
    }
  }
);

// Get logged-in user's order history
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

      const orders = await Order.find({ user: userId })
        .populate("items.product")
        .sort({ createdAt: -1 });

      res.json(orders);
    } catch (error) {
      console.error("Order history error:", error);

      res.status(500).json({
        message: "Failed to fetch orders",
      });
    }
  }
);

// Simulate payment for an order
router.put(
  "/pay/:orderId",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = getUserId(req);

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      const order = await Order.findOne({
        _id: req.params.orderId,
        user: userId,
      });

      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.paymentStatus === "Paid") {
        res.status(400).json({
          message: "Payment already completed",
        });
        return;
      }

      // Simulate successful payment
      order.paymentStatus = "Paid";
      order.status = "Confirmed";

      await order.save();

      res.json({
        message: "Payment successful",
        order,
      });
    } catch (error) {
      console.error("Payment simulation error:", error);

      res.status(500).json({
        message: "Payment simulation failed",
      });
    }
  }
);

export default router;