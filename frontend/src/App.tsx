import { useEffect, useState } from 'react'
import { lazy, Suspense } from "react";
import { gql } from "@apollo/client";

import type { FormEvent } from 'react'

import client from "./graphql/client";
import type { Product, CartItem, User, Order } from './types'
import "./App.css";
const Register = lazy(() => import("./Register"));
const Login = lazy(() => import("./Login"));
const OrderHistory = lazy(() => import("./OrderHistory"));
const Checkout = lazy(() => import("./Checkout"));
import Payment from "./Payment";
import { useSubscription } from "@apollo/client/react";

const API_URL = "http://localhost:5000/api/products";
const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      price
      category
      description
      image
    }
  }
    
`;
const CREATE_PRODUCT = gql`
  mutation CreateProduct(
    $name: String!
    $price: Float!
    $category: String!
    $description: String
    $image: String
  ) {
    createProduct(
      name: $name
      price: $price
      category: $category
      description: $description
      image: $image
    ) {
      id
      name
      price
      category
      description
      image
    }
  }
`;
const UPDATE_PRODUCT = gql`
  mutation UpdateProduct(
    $id: ID!
    $name: String!
    $price: Float!
    $category: String!
    $description: String
    $image: String
  ) {
    updateProduct(
      id: $id
      name: $name
      price: $price
      category: $category
      description: $description
      image: $image
    ) {
      id
      name
      price
      category
      description
      image
    }
  }
`;
const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      id
      name
    }
  }
`;
const PRODUCT_CREATED_SUBSCRIPTION = gql`
  subscription ProductCreated {
    productCreated {
      id
      name
      price
      category
      description
      image
    }
  }
`;
function App() {
  
const enableNotifications = async () => {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      alert("Push notifications are not supported in this browser.");
      return;
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      alert("Notification permission was not granted.");
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      throw new Error("VAPID public key is missing");
    }

    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

      const rawData = window.atob(base64);
      return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
    };

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    const response = await fetch("http://localhost:5000/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    });

    if (!response.ok) {
      throw new Error("Failed to save subscription");
    }

    alert("Push notifications enabled successfully!");
  } catch (error) {
    console.error("Notification setup error:", error);
    alert("Could not enable notifications. Please try again.");
  }
};
const { data: subscriptionData, error: subscriptionError } =
  useSubscription(PRODUCT_CREATED_SUBSCRIPTION);

  useEffect(() => {
  if (subscriptionData?.productCreated) {
    setProducts((prevProducts) => [
      ...prevProducts,
      subscriptionData.productCreated,
    ]);
  }
}, [subscriptionData]);

useEffect(() => {
  if (subscriptionError) {
    console.error("GraphQL subscription error:", subscriptionError);
  }
}, [subscriptionError]);
const [products, setProducts] = useState<Product[]>([])

  const [loading, setLoading] = useState(true);
 
const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false);
const [paymentOrder, setPaymentOrder] = useState<Order | null>(null)
 const formatCartItems = (
  items: { product: Product | null; quantity: number }[]
): CartItem[] => {
  return items
    .filter((item) => item.product !== null)
    .map((item) => ({
      ...item.product!,
      quantity: item.quantity,
    }))

     
};
  useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  const fetchCart = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/cart",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch cart");
      }

    setCart(formatCartItems(data.items));
    } catch (error) {
      console.error("Cart fetch error:", error);
    }
  };

  fetchCart();
}, []);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
const [maxPrice, setMaxPrice] = useState("");
const [editingId, setEditingId] = useState<string | null>(null)
const [message, setMessage] = useState("");
const [isLoggedIn, setIsLoggedIn] = useState(
  !!localStorage.getItem("token")
);
const [user, setUser] = useState<User | null>(null)
useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    return;
  }

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/users/profile",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem("token");
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error("Profile fetch error:", error);
    }
  };

  fetchUserProfile();
}, []);
  useEffect(() => {
    fetchProducts();
  }, []);


    
  
 
const fetchProducts = async () => {
  try {
    const result = await client.query({
      query: GET_PRODUCTS,
      fetchPolicy: "network-only",
    });

    const data: Product[] = result.data.products.map(
      (product: {
        id: string;
        name: string;
        price: number;
        category: string;
        description?: string;
        image?: string;
      }) => ({
        _id: product.id,
        name: product.name,
        price: product.price,
        category: product.category,
        description: product.description,
        image: product.image,
      })
    );

    setProducts(data);

    // Save products for offline use
    localStorage.setItem("cachedProducts", JSON.stringify(data));

    console.log("GRAPHQL PRODUCTS SAVED:", data);
  } catch (error) {
    console.error("GraphQL products fetch error:", error);

    // Load previously saved products when offline
    const cachedProducts = localStorage.getItem("cachedProducts");

    if (cachedProducts) {
      setProducts(JSON.parse(cachedProducts) as Product[]);
      setMessage("Showing saved products (Offline Mode)");
    } else {
      setMessage("No saved products available offline");
    }
  } finally {
    setLoading(false);
  }
};
const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  try {
      const productData = {
        name,
        price: Number(price),
        category,
        description,
         image,
      };

      let response;

     if (editingId) {
  const result = await client.mutate({
    mutation: UPDATE_PRODUCT,
    variables: {
      id: editingId,
      name,
      price: Number(price),
      category,
      description,
      image,
    },
  });

  const updatedProduct: Product = {
    _id: result.data.updateProduct.id,
    name: result.data.updateProduct.name,
    price: result.data.updateProduct.price,
    category: result.data.updateProduct.category,
    description: result.data.updateProduct.description,
    image: result.data.updateProduct.image,
  };

  setProducts((prevProducts) =>
    prevProducts.map((product) =>
      product._id === editingId ? updatedProduct : product
    )
  );

  setMessage("Product updated successfully!");
  clearForm();

  return;
} else {
  const result = await client.mutate({
    mutation: CREATE_PRODUCT,
    variables: productData,
  });

  const savedProduct: Product = {
    _id: result.data.createProduct.id,
    name: result.data.createProduct.name,
    price: result.data.createProduct.price,
    category: result.data.createProduct.category,
    description: result.data.createProduct.description,
    image: result.data.createProduct.image,
  };

  setProducts([...products, savedProduct]);
  setMessage("Product added successfully!");
  clearForm();

  return;
}

      if (!response.ok) {
  const errorData = await response.json();

  if (errorData.errors && errorData.errors.length > 0) {
    throw new Error(
errorData.errors.map((error: { msg: string }) => error.msg).join(", ")
    );
  }

  throw new Error(errorData.message || "Request failed");
}
      const savedProduct = await response.json();

      if (editingId) {
        setProducts(
          products.map((product) =>
            product._id === editingId ? savedProduct : product
          )
        );

        setMessage("Product updated successfully!");
      } else {
        setProducts([...products, savedProduct]);

        setMessage("Product added successfully!");
      }

      clearForm();
   } catch (error) {
  console.error(error);
setMessage(error instanceof Error ? error.message : "Failed to save product");
}
  };

const handleEdit = (product: Product) => {
  setEditingId(product._id);
    setName(product.name);
setPrice(String(product.price));
    setCategory(product.category);
    setDescription(product.description || "");
    setImage(product.image || "");
    setMessage("");
  };

const handleDelete = async (id: string) =>{
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmDelete) {
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to delete product");
    }

    setProducts((prevProducts) =>
      prevProducts.filter((product) => product._id !== id)
    );

    setMessage("Product deleted successfully!");

    if (editingId === id) {
      clearForm();
    }
  } catch (error) {
    console.error("Delete product error:", error);
setMessage(error instanceof Error ? error.message : "Failed to delete product");
    
  }
};

  const handleLogout = () => {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  setUser(null);
  window.location.href = "/login";
};

const handleAddToCart = async (product: Product) =>{
const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/cart/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        productId: product._id,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to add product to cart");
    }

setCart(formatCartItems(data.cart.items));
    setMessage(`${product.name} added to cart!`);
  } catch (error) {
    console.error("Add to cart error:", error);
    setMessage("Failed to add product to cart");
  }
};

const increaseQuantity = async (id: string) =>{
const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  // UI ko immediately update karo
  setCart((prevCart) =>
    prevCart.map((item) =>
      item._id === id
        ? { ...item, quantity: item.quantity + 1 }
        : item
    )
  );

  try {
    const response = await fetch(
      `http://localhost:5000/api/cart/increase/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

   

    // Backend ka final cart sync karo

     
  } catch (error) {
    console.error("Increase quantity error:", error);

   
    setMessage("Failed to increase quantity");
  }

};

const decreaseQuantity = async (id: string) =>{
const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  // UI ko immediately update karo
 setCart((prevCart) =>
  prevCart
    .map((item) =>
      item._id === id
        ? {
            ...item,
            quantity: item.quantity - 1,
          }
        : item
    )
    .filter((item) => item.quantity > 0)
);

  try {
    const response = await fetch(
      `http://localhost:5000/api/cart/decrease/${id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to decrease quantity");
    }

   

    setMessage("Quantity decreased");
  } catch (error) {
    console.error("Decrease quantity error:", error);

    
    setMessage("Failed to decrease quantity");
  }
};

const removeFromCart = async (id: string) =>{
const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  try {
    const response = await fetch(
      `http://localhost:5000/api/cart/remove/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to remove product");
    }

   setCart(formatCartItems(data.cart.items));

    setMessage("Product removed from cart");
  } catch (error) {
    console.error("Remove cart error:", error);
    setMessage("Failed to remove product");
  }
};

const cartTotal = cart.reduce(
  (total, item) => total + item.price * item.quantity,
  0
);
const clearForm = () => {
  setEditingId(null);
  setName("");
  setPrice("");
  setCategory("");
  setDescription("");
  setImage("");
};

  const categories = [
  "All",
  ...new Set(products.map((product) => product.category)),
];

const filteredProducts = products.filter((product) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    product.name.toLowerCase().includes(search) ||
    product.category.toLowerCase().includes(search);

  const matchesCategory =
    selectedCategory === "All" ||
    product.category === selectedCategory;

  const matchesMinPrice =
    minPrice === "" || product.price >= Number(minPrice);

  const matchesMaxPrice =
    maxPrice === "" || product.price <= Number(maxPrice);

  return (
    matchesSearch &&
    matchesCategory &&
    matchesMinPrice &&
    matchesMaxPrice
  );
});
const currentPath = window.location.pathname;
if (currentPath === "/orders") {
return (
  <Suspense fallback={<h2>Loading...</h2>}>
    <OrderHistory />
  </Suspense>
);
}
if (currentPath === "/checkout") {
  return (
    <Suspense fallback={<h2>Loading checkout...</h2>}>
      <Checkout
        cart={cart}
        onOrderCreated={() => {
          setCart([]);
        }}
        onPaymentRequired={(order: Order) => {
          setPaymentOrder(order);
          window.location.href = "/payment";
        }}
      />
    </Suspense>
  );
}
  if (currentPath === "/payment") {
  const savedOrder = sessionStorage.getItem("paymentOrder");

  const order = savedOrder
    ? JSON.parse(savedOrder)
    : paymentOrder;

  return (
    <Payment
      order={order}
      onPaymentSuccess={() => {
        sessionStorage.removeItem("paymentOrder");
        window.location.href = "/orders";
      }}
    />
  );
}
if (currentPath === "/login") {
  return <Login />;
}

if (currentPath === "/register") {
  return <Register />;
}

if (loading) {
  return <h2>Loading products...</h2>;
}
  return (
    <div className="app">
      <nav className="top-nav">
  <div className="nav-logo">
    E-Shop
  </div>

  <div className="nav-actions">
    {isLoggedIn ? (
      <>
      <button
  onClick={enableNotifications}
  className="login-nav-btn"
>
  🔔 Enable Notifications
</button>
       <span className="user-name">
  👤 Welcome, {user?.name || "User"}
</span>
<button    className="my-orders-btn"
onClick={() => (window.location.href = "/orders")}>
  My Orders
</button>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </>
    ) : (
      <>
        <button
          onClick={() => {
            window.location.href = "/login";
          }}
          className="login-nav-btn"
        >
          Login
        </button>

        <button
          onClick={() => {
            window.location.href = "/register";
          }}
          className="register-nav-btn"
        >
          Register
        </button>
      </>
    )}
  </div>
</nav>
      <h1>E-commerce Store</h1>
     <button
  className="cart-count"
  onClick={() => setShowCart(true)}
>
  🛒 Cart (
  {cart.reduce((total, item) => total + item.quantity, 0)})
</button>

   

{showCart ? (
  <div className="cart-page">
    <h2>🛒 Shopping Cart</h2>

    {cart.length === 0 ? (
      <p>Your cart is empty.</p>
    ) : (
      <>
     

        {cart.map((item) => (
          <div className="cart-page-item" key={item._id}>
            <div>
              <h3>{item.name}</h3>
              <p>Price: ₹{item.price}</p>
              <p>Quantity: {item.quantity}</p>
            </div>

            <div>
              <button   className="quantity-btn decrease-btn"
               onClick={() => decreaseQuantity(item._id)}>
                −
              </button>

              <span>{item.quantity}</span>

              <button   className="quantity-btn increase-btn"
onClick={() => increaseQuantity(item._id)}>
                +
              </button>

              <button
                className="remove-cart-btn"

                onClick={() => removeFromCart(item._id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
{/* CART TOTAL */}
<div
  style={{
    textAlign: "center",
    marginTop: "20px",
    marginBottom: "10px",
  }}
>
  <h2>Total: ₹{cartTotal}</h2>
</div>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
  <button
   className="checkout-btn"

    onClick={() => (window.location.href = "/checkout")}
  >
    Proceed to Checkout
  </button>

  <button
    className="continue-shopping-btn"

    onClick={() => setShowCart(false)}
  >
    Continue Shopping
  </button>
</div>
      </>
    )}
  </div>
) : (
  <>
      <h2>{editingId ? "Update Product" : "Add Product"}</h2>

<form className="product-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          required
        />

        <br />
        <br />

        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          required
        />

        <br />
        <br />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <br />
<br />
        <input
  type="text"
  placeholder="Image URL"
  value={image}
  onChange={(event) => setImage(event.target.value)}
/>

        <br />
        <br />

        <button 
          className="add-product-btn"

        type="submit"
         style={{ marginRight: "10px" }}>
          {editingId ? "Update Product" : "Add Product"}
        </button>
       
        {editingId && (
          <button type="button"  className="cancel-btn" onClick={clearForm}>
            Cancel
          </button>
        )}
      </form>

      {message && <p>{message}</p>}

      <hr />

      <h2>Products</h2>


<div className="filters">
  <input
    type="text"
    placeholder="Search products..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />

  <select
    value={selectedCategory}
    onChange={(event) => setSelectedCategory(event.target.value)}
  >
    {categories.map((category) => (
      <option key={category} value={category}>
        {category}
      </option>
    ))}
  </select>

  <input
    type="number"
    placeholder="Min Price"
    value={minPrice}
    min="0"
    onChange={(event) => setMinPrice(event.target.value)}
  />

  <input
    type="number"
    placeholder="Max Price"
    value={maxPrice}
    min="0"
    onChange={(event) => setMaxPrice(event.target.value)}
  />

  <button
    className="clear-filter-btn"
    type="button"
     onClick={() => {
      setSearchTerm("");
      setSelectedCategory("All");
      setMinPrice("");
      setMaxPrice("");
    }}
  >
    Clear Filters
  </button>
</div>

     {filteredProducts.length === 0 ? (
  <p>No products available.</p>
) : (
  <div className="products-grid">
    {filteredProducts.map((product) => (
      
        <div className="product-card" key={product._id}>
          {product.image && (
  <img
    src={product.image}
    alt={product.name}
    className="product-image"
    loading="lazy"
  />
)}
  <h3>{product.name}</h3>

  <p className="product-price">
    ₹{product.price}
  </p>

  <p className="product-category">
    {product.category}
  </p>

  <p className="product-description">
    {product.description}
  </p>

  <div className="product-actions">
    <button
      onClick={() => handleEdit(product)}
      className="edit-btn"
    >
      Edit
    </button>

    <button
      onClick={() => handleDelete(product._id)}
      className="delete-btn"
    >
      Delete
    </button>
    <button
  className="cart-btn"
  onClick={() => handleAddToCart(product)}
>
  Add to Cart
</button>

  </div>
  
</div>
          ))}
          
  </div>
  )}
   </>
)}

    </div>
    
  );
}


export default App;