import React, { useState } from 'react';
import axios from 'axios';

// IMPORTANT: Ise component ke bahar rakhna zaroori hai
axios.defaults.withCredentials = true;

export default function SimpleLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleOAuthLogin = (provider) => {
    window.location.href = `https://drive-file-manager.onrender.com/oauth2/authorization/${provider}`;
  };

  const handleSubmit = async (e) => {
  e.preventDefault(); 

  try {
    if (isLogin) {
      // LOGIN LOGIC
      const response = await axios.post("https://drive-file-manager.onrender.com/api/auth/login", { email, password });
      
      if (response.status === 200) {
        // 1. Success Message
        alert("Success: Welcome " + response.data.name + "!");
        
        // 2. MAIN FIX: page redirect drive
       
        window.location.href = "/"; 
        
      }

    } else {
      // SIGNUP LOGIC
      const response = await axios.post("https://drive-file-manager.onrender.com/api/auth/register", { name, email, password });
      alert("Success: " + (response.data.message || "Account Created"));
      
      // Signup hone ke baad user ko Login form dikhao
      setIsLogin(true);
      setPassword('');
    }
  } catch (error) {
    console.error("Backend Error:", error);
    alert("Error: " + (error.response?.data?.message || "Invalid Credentials"));
  }
};

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '380px', textAlign: 'center' }}>
        <img src="https://cdn-icons-png.flaticon.com/512/414/414825.png" alt="Drive Logo" style={{ width: '60px', marginBottom: '15px' }} />
        <h2 style={{ marginBottom: '25px', color: '#202124' }}>
          {isLogin ? "Log in to Drive" : "Create Account"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', outline: 'none' }} />
          )}
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', outline: 'none' }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', outline: 'none' }} />
          <button type="submit" style={{ background: '#1a73e8', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            {isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#5f6368' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#1a73e8', cursor: 'pointer', fontWeight: 'bold' }}>{isLogin ? "Sign up" : "Log in"}</span>
        </p>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
          <span style={{ padding: '0 10px', color: '#5f6368', fontSize: '12px', fontWeight: 'bold' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }}></div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button type="button" onClick={() => handleOAuthLogin('google')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: 'white', color: '#3c4043', padding: '10px', border: '1px solid #dadce0', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px' }} /> Continue with Google
          </button>
          <button type="button" onClick={() => handleOAuthLogin('github')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#24292e', color: 'white', padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" style={{ width: '20px', filter: 'invert(1)' }} /> Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  );
}