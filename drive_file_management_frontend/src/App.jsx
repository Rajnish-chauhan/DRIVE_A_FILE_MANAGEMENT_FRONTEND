import React, { useState, useEffect } from "react";
import axios from "axios";
import DriveApp from "./DriveApp";
import SimpleLoginPage from "./SimpleLoginPage";
axios.defaults.withCredentials = true;

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
    <div>
      {user ? <DriveApp user={user} /> : <SimpleLoginPage />}
    </div>
  );
}

export default App;