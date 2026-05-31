import React, { useState, useEffect } from "react";
import axios from "axios";
import DriveApp from "./DriveApp";
import SimpleLoginPage from "./SimpleLoginPage";
import Footer from "./Components/Sidebar";

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

    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>


      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {user ? <DriveApp user={user} /> : <SimpleLoginPage />}
      </div>


      <Footer />

    </div>
  );
}

export default App;