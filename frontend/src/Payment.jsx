import { useState } from "react";

function Payment({ order, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handlePayment = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("Please login first");
      return;
    }

    if (!order) {
      setMessage("Order not found");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/orders/pay/${order._id}`,
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

      setMessage("Payment successful!");

      if (onPaymentSuccess) {
        onPaymentSuccess(data.order);
      }
    } catch (error) {
      console.error("Payment error:", error);
      setMessage(error.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <h1>Payment</h1>

      {!order ? (
        <p>Order not found.</p>
      ) : (
        <div className="payment-box">
          <h2>Order Summary</h2>

          <p>
            <strong>Order ID:</strong> {order._id}
          </p>

          <p>
            <strong>Total Amount:</strong> ₹{order.totalAmount}
          </p>

          <p>
            <strong>Payment Status:</strong>{" "}
            {order.paymentStatus}
          </p>

          <button
           className="pay-now-btn"

            onClick={handlePayment}
            disabled={loading}
          >
            {loading ? "Processing Payment..." : "Pay Now"}
          </button>

          {message && <p>{message}</p>}
        </div>
      )}
    </div>
  );
}

export default Payment;