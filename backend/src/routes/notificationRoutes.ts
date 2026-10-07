
import express, { type Request, type Response } from "express";
import webpush from "web-push";
import PushSubscription from "../models/PushSubscription";
import authMiddleware from "../middleware/authMiddleware";
const router = express.Router();

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  throw new Error("VAPID environment variables are missing");
}

webpush.setVapidDetails(subject, publicKey, privateKey);

// Save browser subscription
router.post(
  "/subscribe",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const subscription = req.body;

      if (
        !subscription?.endpoint ||
        !subscription?.keys?.p256dh ||
        !subscription?.keys?.auth
      ) {
        res.status(400).json({ message: "Invalid push subscription" });
        return;
      }

      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      res.status(201).json({ message: "Push subscription saved" });
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "Failed to save subscription" });
    }
  }
);

// Send test notification to saved subscriptions
router.post(
  "/send-test",
  authMiddleware,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const subscriptions = await PushSubscription.find();

      if (subscriptions.length === 0) {
        res.status(404).json({ message: "No subscriptions found" });
        return;
      }

      const results = await Promise.allSettled(
  subscriptions.map(async (item) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: item.endpoint,
          keys: {
            p256dh: item.keys.p256dh,
            auth: item.keys.auth,
          },
        },
        JSON.stringify({
          title: "E-commerce",
          body: "Push notifications are working!",
        })
      );
      return { endpoint: item.endpoint, success: true };
    } catch (error: any) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await PushSubscription.deleteOne({ endpoint: item.endpoint });
      }
      throw error;
    }
  })
);

const sent = results.filter((result) => result.status === "fulfilled").length;
const failed = results.length - sent;

res.json({
  message: "Test notification request completed",
  sent,
  failed,
  total: subscriptions.length,
});
    } catch (error) {
      console.error("Notification error:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  }
);

export default router;