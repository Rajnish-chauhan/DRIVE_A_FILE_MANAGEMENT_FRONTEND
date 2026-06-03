import React, { useState, useEffect } from "react";
import axios from "axios";
import DriveApp from "./DriveApp";
import SimpleLoginPage from "./SimpleLoginPage";
import Footer from "./Components/Footer";

// VERY IMPORTANT: API calls mein cookies send ke liye
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("https://drive-file-manager.onrender.com/api/auth/me")
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