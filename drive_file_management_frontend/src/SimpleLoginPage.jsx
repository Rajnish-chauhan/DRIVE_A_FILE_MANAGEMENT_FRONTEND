import React, { useState } from 'react';
import axios from 'axios';

// IMPORTANT: Ise component ke bahar rakhna zaroori hai
axios.defaults.withCredentials = true;

export default function SimpleLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // --- NEW: State for Password Visibility ---
  const [showPassword, setShowPassword] = useState(false);

  const handleOAuthLogin = (provider) => {
    window.location.href = `https://drive-file-manager.onrender.com/oauth2/authorization/${provider}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

    // FRONTEND CHECK: Block disposable fake emails
    const fakeDomains = [
      "mailinator.com", "10minutemail.com", "guerrillamail.com", 
      "tempmail.com", "yopmail.com", "dropmail.me"
    ];
    
    const emailDomain = email.split('@')[1]; 
    
    if (fakeDomains.includes(emailDomain)) {
      alert("Please use a real email address (Gmail, Outlook, Yahoo, etc).");
      return; 
    }

    try {
      if (isLogin) {
        // LOGIN LOGIC
        const response = await axios.post("https://drive-file-manager.onrender.com/api/auth/login", { email, password });
        
        if (response.status === 200) {
          alert("Success: Welcome " + response.data.name + "!");
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
            <input 
              type="text" 
              placeholder="Full Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              autoComplete="off"
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', outline: 'none', boxSizing: 'border-box' }} 
            />
          )}
          
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            autoComplete="off" 
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dadce0', outline: 'none', boxSizing: 'border-box' }} 
          />
          
          {/* --- NEW: Password Input with Eye Icon --- */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input 
              type={showPassword ? "text" : "password"} // Toggles text/password
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              autoComplete="new-password" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                paddingRight: '40px', // Extra space so text doesn't hide behind the icon
                borderRadius: '8px', 
                border: '1px solid #dadce0', 
                outline: 'none', 
                boxSizing: 'border-box' 
              }} 
            />
            
            <div 
              onClick={() => setShowPassword(!showPassword)}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: '#5f6368'
              }}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                // Eye Slash Icon (Hide)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                // Eye Open Icon (Show)
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </div>
          </div>
          {/* --------------------------------------- */}

          <button type="submit" style={{ background: '#1a73e8', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '5px' }}>
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