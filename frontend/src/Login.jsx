import { useState } from "react";

const API_URL = "http://localhost:5000/api/users";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
const [profile, setProfile] = useState(null);
  const handleLogin = async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);
const token = data.token;

const profileResponse = await fetch(
  "http://localhost:5000/api/users/profile",
  {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const profileData = await profileResponse.json();

console.log("Profile:", profileData);
if (profileResponse.ok) {
  setProfile(profileData.user);
}
      setMessage("Login successful!");
setTimeout(() => {
  window.location.href = "/";
}, 500);
      setEmail("");
      setPassword("");

    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        <h2>Login</h2>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

        </form>

        {message && (
          <p className="login-message">
            {message}
          </p>
        )}
        <div className="auth-switch">
  <span>Don't have an account?</span>

  <button
    type="button"
    onClick={() => window.location.href = "/register"}
  >
    Register
  </button>
</div>
{profile && (
  <div className="profile-box">
    <h3>Welcome, {profile.name}!</h3>
    <p>Email: {profile.email}</p>
  </div>
)}
      </div>
    </div>
  );
}

export default Login;