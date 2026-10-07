import { gql } from "graphql-tag";
export const typeDefs = gql`
  type Product {
    id: ID!
    name: String!
    price: Float!
    category: String!
    description: String
    image: String
  }

  type Query {
    products: [Product!]!
    product(id: ID!): Product
  }
    type Mutation {
  createProduct(
    name: String!
    price: Float!
    category: String!
    description: String
    image: String
  ): Product!
  updateProduct(
  id: ID!
  name: String!
  price: Float!
  category: String!
  description: String
  image: String
): Product
deleteProduct(id: ID!): Product
}
  type Subscription {
    productCreated: Product!
  }
`;
