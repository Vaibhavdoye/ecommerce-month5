import Product from "../models/Product";
import { PubSub } from "graphql-subscriptions";
const pubsub = new PubSub();
export const resolvers = {
  Query: {
    products: async () => {
      return Product.find();
    },

    product: async (_parent: unknown, args: { id: string }) => {
      return Product.findById(args.id);
    },
  },

  Mutation: {
    createProduct: async (
      _parent: unknown,
      args: {
        name: string;
        price: number;
        category: string;
        description?: string;
        image?: string;
      }
    ) => {
      const product = await Product.create({
        name: args.name,
        price: args.price,
        category: args.category,
        description: args.description,
        image: args.image,
      });
pubsub.publish("PRODUCT_CREATED", { productCreated: product });
      return product;
    },

    updateProduct: async (
      _parent: unknown,
      args: {
        id: string;
        name: string;
        price: number;
        category: string;
        description?: string;
        image?: string;
      }
    ) => {
      return Product.findByIdAndUpdate(
        args.id,
        {
          name: args.name,
          price: args.price,
          category: args.category,
          description: args.description,
          image: args.image,
        },
        
        { new: true, runValidators: true }
      );
    },
    deleteProduct: async (
  _parent: unknown,
  args: { id: string }
) => {
  return Product.findByIdAndDelete(args.id);
},
  },
  Subscription: {
  productCreated: {
    subscribe: () => pubsub.asyncIterableIterator(["PRODUCT_CREATED"]),
  },
},
};