import React, { useState, useEffect } from "react";
import axios from "axios";
import DriveApp from "./DriveApp";
import SimpleLoginPage from "./SimpleLoginPage";
import Footer from "./Component/Footer"; // <-- Naya Footer import kiya hai

// VERY IMPORTANT: API calls mein cookies send ke liye
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8080/api/auth/me")
      .then(response => {
        setUser(response.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '20px' }}>Loading Drive...</div>;
  }

  return (
    // 1. Main container: Screen ki poori height (100vh) lega aur flex-column banega
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* 2. Content Area: flex: 1 ki wajah se ye bachi hui saari jagah le lega */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {user ? <DriveApp user={user} /> : <SimpleLoginPage />}
      </div>

      {/* 3. Footer: Content ke theek niche aayega, agar content kam hai tab bhi bottom me rahega */}
      <Footer />
      
    </div>
  );
}

export default App;