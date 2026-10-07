import { useEffect, useState } from "react";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Please login first");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://ecommerce-month5.onrender.com/api/orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to fetch orders"
          );
        }

        setOrders(data);
      } catch (error) {
        console.error("Order history error:", error);
        setMessage("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);
const handlePayment = async (orderId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first");
    return;
  }

  try {
    const response = await fetch(
      `https://ecommerce-month5.onrender.com/api/orders/pay/${orderId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Payment failed");
    }

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order._id === orderId ? data.order : order
      )
    );

    setMessage("Payment successful!");
  } catch (error) {
    console.error("Payment error:", error);
    setMessage("Payment failed");
  }
};
  if (loading) {
    return <h2>Loading orders...</h2>;
  }

  if (message) {
    return <h2>{message}</h2>;
  }

  return (
    <div className="order-history">
      <h1>My Orders</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        orders.map((order) => (
          <div className="order-card" key={order._id}>
            <h3>Order ID: {order._id}</h3>

            <p>
              Date:{" "}
              {new Date(order.createdAt).toLocaleDateString()}
            </p>

            <p>
              Status: <strong>{order.status}</strong>
            </p>

            <p>
              Payment:{" "}
              <strong>{order.paymentStatus}</strong>
            </p>

            <h4>Products</h4>

            {order.items.map((item) => (
              <div className="order-item" key={item._id}>
                <p>
                  <strong>{item.name}</strong>
                </p>

                <p>
                  Price: ₹{item.price}
                </p>

                <p>
                  Quantity: {item.quantity}
                </p>

                <p>
                  Subtotal: ₹
                  {item.price * item.quantity}
                </p>
              </div>
            ))}

            <h3>
              Total: ₹{order.totalAmount}
            </h3>
            {order.paymentStatus === "Pending" && (
  <button onClick={() => handlePayment(order._id)}>
    Pay Now
  </button>
)}
          </div>
        ))
      )}
    </div>
  );
}

export default OrderHistory;