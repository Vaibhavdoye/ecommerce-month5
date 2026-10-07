import { useState } from "react";

function Checkout({ cart, onOrderCreated, onPaymentRequired }) {
const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    console.log("PLACE ORDER CLICKED");
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first");
      return;
    }

    if (cart.length === 0) {
      setMessage("Your cart is empty");
      return;
    }

   try {
  setLoading(true);
  setMessage("");

  console.log("Sending checkout request...");
  console.log("Token exists:", !!token);
  console.log("Cart:", cart);

  const response = await fetch(
        "http://localhost:5000/api/orders/checkout",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      console.log("Checkout response status:", response.status);
console.log("Checkout response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Checkout failed"
        );
      }

   if (onOrderCreated) {
  onOrderCreated(data.order);
}

sessionStorage.setItem(
  "paymentOrder",
  JSON.stringify(data.order)
);

if (onPaymentRequired) {
  onPaymentRequired(data.order);
}
    } catch (error) {
      console.error("Checkout error:", error);
      setMessage(error.message || "Checkout failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-page">
      <h1>Checkout</h1>

      <div className="checkout-summary">
        <h2>Order Summary</h2>

        {cart.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            {cart.map((item) => (
              <div
                className="checkout-item"
                key={item._id}
              >
                <p>
                  <strong>{item.name}</strong>
                </p>

                <p>
                  ₹{item.price} × {item.quantity}
                </p>

                <p>
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}

            <hr />

            <h2>Total: ₹{cartTotal}</h2>

           <button
           className="place-order-btn"
            onClick={handleCheckout}
           disabled={loading}
>
        {loading ? "Processing..." : "Place Order"}
          </button>
          </>
        )}

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default Checkout;