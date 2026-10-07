const express = require("express");
const router = express.Router();

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

// Get logged-in user's cart
router.get("/", authMiddleware, async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({
        user: req.user.userId,
        items: [],
      });
    }

    res.json(cart);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch cart",
    });
  }
});

// Add product to cart
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    let cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.userId,
        items: [
          {
            product: productId,
            quantity: 1,
          },
        ],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cart.items.push({
          product: productId,
          quantity: 1,
        });
      }

      await cart.save();
    }

    const updatedCart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    res.json({
      message: "Product added to cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to add product to cart",
    });
  }
});
// Increase product quantity in cart
router.put("/increase/:productId", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    item.quantity += 1;

    await cart.save();

    const updatedCart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    res.json({
      message: "Quantity increased",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to increase quantity",
    });
  }
});
// Decrease product quantity in cart
router.put("/decrease/:productId", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === req.params.productId
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
      });
    }

    item.quantity -= 1;

    if (item.quantity <= 0) {
      cart.items = cart.items.filter(
        (cartItem) =>
          cartItem.product.toString() !== req.params.productId
      );
    }

    await cart.save();

    const updatedCart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    res.json({
      message: "Quantity decreased",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to decrease quantity",
    });
  }
});
// Remove product completely from cart
router.delete("/remove/:productId", authMiddleware, async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user.userId,
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();

    const updatedCart = await Cart.findOne({
      user: req.user.userId,
    }).populate("items.product");

    res.json({
      message: "Product removed from cart",
      cart: updatedCart,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to remove product from cart",
    });
  }
});

module.exports = router;