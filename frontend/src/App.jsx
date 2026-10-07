import { useEffect, useState } from "react";
import "./App.css";
import Register from "./Register";
import Login from "./Login";
import OrderHistory from "./OrderHistory";
import Checkout from "./Checkout";
import Payment from "./Payment";
const API_URL = "http://localhost:5000/api/products";

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
 
  const [cart, setCart] = useState([]);

  const [showCart, setShowCart] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const formatCartItems = (items) => {
  return items
    .filter((item) => item.product)
    .map((item) => {
      const product = item.product;

      return {
        ...product,
        _id: product._id,
        quantity: item.quantity,
      };
    });
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
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
const [isLoggedIn, setIsLoggedIn] = useState(
  !!localStorage.getItem("token")
);
const [user, setUser] = useState(null);
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
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error(error);
      setMessage("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
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
        response = await fetch(`${API_URL}/${editingId}`, {
          method: "PUT",
        headers: {
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
},
          body: JSON.stringify(productData),
        });
     } else {
  response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(productData),
  });
}

      if (!response.ok) {
  const errorData = await response.json();

  if (errorData.errors && errorData.errors.length > 0) {
    throw new Error(
      errorData.errors.map((error) => error.msg).join(", ")
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
  setMessage(error.message || "Failed to save product");
}
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setPrice(product.price);
    setCategory(product.category);
    setDescription(product.description || "");
    setImage(product.image || "");
    setMessage("");
  };

const handleDelete = async (id) => {
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
    setMessage(error.message || "Failed to delete product");
  }
};
  const handleLogout = () => {
  localStorage.removeItem("token");
  setIsLoggedIn(false);
  setUser(null);
  window.location.href = "/login";
};

 const handleAddToCart = async (product) => {
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

 const increaseQuantity = async (id) => {
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

const decreaseQuantity = async (id) => {
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

const removeFromCart = async (id) => {
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
  return <OrderHistory />;
}
if (currentPath === "/checkout") {
  return (
    <Checkout
      cart={cart}
      onOrderCreated={() => {
        setCart([]);
      }}
      onPaymentRequired={(order) => {
        setPaymentOrder(order);
        window.location.href = "/payment";
      }}
    />
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
          <button type="button"  class="cancel-btn" onClick={clearForm}>
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