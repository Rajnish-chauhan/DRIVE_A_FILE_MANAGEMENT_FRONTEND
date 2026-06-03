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

export default App;import React, { useEffect, useState } from "react";
import axios from "axios";
import SimpleLoginPage from "./SimpleLoginPage"; // Apne path ke hisab se adjust karein
import DriveApp from "./DriveApp"; // Apne path ke hisab se adjust karein

// 🌟 IMPORTANT: Ise top level par rakhna zaroori hai taaki poore app mein cookies bheji ja sakein
axios.defaults.withCredentials = true;

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔍 Jaise hi app load ho, backend se check karo ki user logged in hai ya nahi
    const checkUserSession = async () => {
      try {
        const response = await axios.get("https://drive-file-manager.onrender.com/api/auth/me");
        // Agar success hua (Session cookie valid hai), toh user data set karo
        setUser(response.data);
      } catch (error) {
        // Agar fail hua (Logged out hai), toh user null rahega
        console.log("User is not logged in");
        setUser(null);
      } finally {
        setLoading(false); // Checking complete
      }
    };

    checkUserSession();
  }, []);

  // Jab tak backend se jawaab aa raha hai, tab tak loading dikhao
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Loading Drive...</h2>
      </div>
    );
  }

  // 🚀 MAIN LOGIC: Agar user hai toh DriveApp dikhao, warna LoginPage dikhao
  return (
    <>
      {user ? <DriveApp user={user} /> : <SimpleLoginPage />}
    <div>
<Footer/>
    </div>
    </>
  );
}

export default App;