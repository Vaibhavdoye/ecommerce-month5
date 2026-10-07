const express = require("express");
const router = express.Router();

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const authMiddleware = require("../middleware/authMiddleware");

// Create order from cart
router.post("/checkout", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

   // Remove cart items whose products no longer exist
const validItems = cart.items.filter((item) => item.product);

if (validItems.length === 0) {
  cart.items = [];
  await cart.save();

  return res.status(400).json({
    message: "Cart contains no valid products",
  });
}

// Remove invalid/deleted products from the cart
if (validItems.length !== cart.items.length) {
  cart.items = validItems.map((item) => ({
    product: item.product._id,
    quantity: item.quantity,
  }));

  await cart.save();
}

const orderItems = validItems.map((item) => ({
  product: item.product._id,
  name: item.product.name,
  price: item.product.price,
  quantity: item.quantity,
}));



    const totalAmount = orderItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user.userId,
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
});

// Get logged-in user's order history
router.get("/", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.userId,
    })
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Order history error:", error);

    res.status(500).json({
      message: "Failed to fetch orders",
    });
  }
});
// Simulate payment for an order
router.put("/pay/:orderId", authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        message: "Payment already completed",
      });
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
});
module.exports = router;