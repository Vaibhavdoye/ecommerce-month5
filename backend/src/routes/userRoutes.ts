import express, { type Request, type Response, type RequestHandler } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

import User from "../models/User";
import authMiddleware from "../middleware/authMiddleware";

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: string | jwt.JwtPayload;
}

const requireAuth = authMiddleware as unknown as RequestHandler;

// REGISTER
router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),

    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        res.status(400).json({
          message: "Name, email and password are required",
        });
        return;
      }

      const existingUser = await User.findOne({ email });

      if (existingUser) {
        res.status(400).json({ message: "User already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// LOGIN
router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
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
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          message: "Email and password are required",
        });
        return;
      }

      const user = await User.findOne({ email });

      if (!user) {
        res.status(401).json({
          message: "Invalid email or password",
        });
        return;
      }

      const isPasswordCorrect = await bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordCorrect) {
        res.status(401).json({
          message: "Invalid email or password",
        });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
        },
        jwtSecret,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET PROFILE
router.get(
  "/profile",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = (authReq.user as jwt.JwtPayload)?.userId;

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      const user = await User.findById(userId).select("-password");

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        message: "Profile fetched successfully",
        user,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// UPDATE PROFILE
router.put(
  "/profile",
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      const userId = (authReq.user as jwt.JwtPayload)?.userId;
      const { name, email } = req.body;

      if (!userId) {
        res.status(401).json({ message: "Invalid authentication token" });
        return;
      }

      if (!name || !email) {
        res.status(400).json({
          message: "Name and email are required",
        });
        return;
      }

      const existingUser = await User.findOne({
        email,
        _id: { $ne: userId },
      });

      if (existingUser) {
        res.status(400).json({ message: "Email already in use" });
        return;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { name, email },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({
        message: "Failed to update profile",
      });
    }
  }
);

export default router;