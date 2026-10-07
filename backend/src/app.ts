import "dotenv/config";

import express from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import cartRoutes from "./routes/cartRoutes";
import orderRoutes from "./routes/orderRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { typeDefs } from "./graphql/typeDefs";
import { resolvers } from "./graphql/resolvers";

const app = express();
const httpServer = createServer(app);
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
});
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests, please try again later.",
  },
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(apiLimiter);

app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "E-commerce Backend API is running",
  });
});

const startServer = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is not defined");
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB Connected Successfully");

    const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

   const apolloServer = new ApolloServer({
  schema,
});

    await apolloServer.start();
   useServer(
  {
    schema,
  },
  wsServer
);

    app.use(
      "/graphql",
      expressMiddleware(apolloServer)
    );

    httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`GraphQL available at http://localhost:${PORT}/graphql`);
});
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";

    console.error("MongoDB Connection Error:", message);
    process.exit(1);
  }
};

void startServer();