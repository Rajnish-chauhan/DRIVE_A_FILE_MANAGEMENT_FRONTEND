import React, { useState } from 'react';
import axios from 'axios';
import './SimpleLoginPage.css';

axios.defaults.withCredentials = true;

export default function SimpleLoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // NAYA: State to control showing the OTP screen and storing the OTP
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otp, setOtp] = useState('');

  const handleOAuthLogin = (provider) => {
    window.location.href = `https://drive-file-manager.onrender.com/oauth2/authorization/${provider}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 

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
        alert("Success: " + (response.data.message || "Account Created. Check your email for the OTP!"));
        
        // NAYA: Instead of going to login, show the OTP screen!
        setShowOtpScreen(true);
      }
    } catch (error) {
      console.error("Backend Error:", error);
      alert("Error: " + (error.response?.data?.message || "Invalid Credentials"));
    }
  };

  // NAYA: Function to handle OTP Submission
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("https://drive-file-manager.onrender.com/api/auth/verify-otp", { 
        email: email, 
        otp: otp 
      });
      
      alert("Success: " + response.data.message);
      
      // Reset everything and send them to the normal Login screen
      setShowOtpScreen(false);
      setIsLogin(true);
      setPassword('');
      setOtp('');
      
    } catch (error) {
      console.error("OTP Error:", error);
      alert("Error: " + (error.response?.data?.message || "Invalid OTP"));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img 
          src="https://cdn-icons-png.flaticon.com/512/414/414825.png" 
          alt="Drive Logo" 
          className="login-logo" 
        />

        {/* NAYA: Conditional rendering. If showOtpScreen is true, ONLY show the OTP form */}
        {showOtpScreen ? (
          <>
            <h2 className="login-title">Verify Your Email</h2>
            <p className="toggle-text" style={{marginBottom: '20px'}}>
              We sent a 6-digit code to <b>{email}</b>
            </p>
            
            <form onSubmit={handleVerifyOtp} className="login-form">
              <input 
                type="text" 
                placeholder="Enter 6-digit OTP" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required 
                maxLength="6"
                className="login-input" 
                style={{textAlign: 'center', letterSpacing: '5px', fontSize: '18px'}}
              />
              <button type="submit" className="btn-submit">
                Verify & Continue
              </button>
            </form>
            
            <p className="toggle-text" style={{marginTop: '15px'}}>
              <span onClick={() => setShowOtpScreen(false)} className="toggle-link">
                ← Back to Sign Up
              </span>
            </p>
          </>
        ) : (
          // THIS IS YOUR EXISTING LOGIN/REGISTER UI
          <>
            <h2 className="login-title">
              {isLogin ? "Log in to Drive" : "Create Account"}
            </h2>

            <form onSubmit={handleSubmit} className="login-form">
              {!isLogin && (
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  autoComplete="off"
                  className="login-input" 
                />
              )}
              
              <input 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                autoComplete="off" 
                className="login-input" 
              />
              
              <div className="password-wrapper">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  autoComplete="new-password" 
                  className="login-input password-input" 
                />
                
                <div 
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-icon"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-submit">
                {isLogin ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <p className="toggle-text">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setIsLogin(!isLogin)} className="toggle-link">
                {isLogin ? "Sign up" : "Log in"}
              </span>
            </p>

            <div className="divider-container">
              <div className="divider-line"></div>
              <span className="divider-text">OR</span>
              <div className="divider-line"></div>
            </div>

            <div className="oauth-container">
              <button type="button" onClick={() => handleOAuthLogin('google')} className="btn-oauth btn-google">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="oauth-icon" /> 
                Continue with Google
              </button>
              
              <button type="button" onClick={() => handleOAuthLogin('github')} className="btn-oauth btn-github">
                <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="oauth-icon github-icon" /> 
                Continue with GitHub
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}