import React, { useState } from 'react';
import { loginApi, registerApi, verifyOtpApi } from './api/authApi';
import URL_TEST from './jsconfig';
import './SimpleLoginPage.css';

export default function SimpleLoginPage() {
  const [viewMode, setViewMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOAuthLogin = (provider) => {
    window.location.href = `${URL_TEST}/oauth2/authorization/${provider}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fakeDomains = ["mailinator.com", "10minutemail.com", "guerrillamail.com", "tempmail.com", "yopmail.com", "dropmail.me"];
    const emailDomain = email.split('@')[1];

    if (viewMode === 'signup' && fakeDomains.includes(emailDomain)) {
      alert("Please use a real email address (Gmail, Outlook, Yahoo, etc).");
      return;
    }

    setIsLoading(true);
    try {
      if (viewMode === 'login') {
        await loginApi({ email, password });
        window.location.href = "/";
      }
      else if (viewMode === 'signup') {
        const response = await registerApi({ name, email, password });
        alert(response.data.message || "Please check your mailbox for an OTP.");
        setViewMode('otp_verify');
      }
      else if (viewMode === 'otp_verify') {
        const response = await verifyOtpApi({ email, otp: otpToken });
        alert(response.data.message || "Verification successful!");
        setViewMode('login');
        setPassword('');
        setOtpToken('');
      }
    } catch (error) {
      alert("Error: " + (error.response?.data?.message || "Action failed."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="https://cdn-icons-png.flaticon.com/512/9692/9692936.png" alt="Drive Logo" className="login-logo" />
        <h2 className="login-title">
          {viewMode === 'login' && "Log in to Drive"}
          {viewMode === 'signup' && "Create Account"}
          {viewMode === 'otp_verify' && "Enter Verification OTP"}
        </h2>
        <form onSubmit={handleSubmit} className="login-form">
          {viewMode === 'signup' && (
            <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="login-input" />
          )}
          {viewMode !== 'otp_verify' ? (
            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="login-input" />
          ) : (
            <p style={{ fontSize: "13px", color: "#5f6368", marginBottom: "8px" }}>OTP dispatched to: <strong>{email}</strong></p>
          )}
          {viewMode !== 'otp_verify' && (
            <div className="password-wrapper">
              <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="login-input password-input" />
              <div onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">{showPassword ? "🙈" : "👁️"}</div>
            </div>
          )}
          {viewMode === 'otp_verify' && (
            <input type="text" placeholder="000000" maxLength={6} value={otpToken} onChange={(e) => setOtpToken(e.target.value)} required style={{ textAlign: 'center', letterSpacing: '6px' }} className="login-input" />
          )}
          <button type="submit" className="btn-submit" disabled={isLoading}>
            {isLoading ? "Please wait..." : (viewMode === 'login' ? "Sign In" : viewMode === 'signup' ? "Send OTP Code" : "Verify & Activate")}
          </button>
        </form>

        <p className="toggle-text">
          {viewMode === 'login' && <>Don't have an account? <span onClick={() => setViewMode('signup')} className="toggle-link">Sign up</span></>}
          {viewMode === 'signup' && <>Already have an account? <span onClick={() => setViewMode('login')} className="toggle-link">Log in</span></>}
          {viewMode === 'otp_verify' && <>Incorrect profile setup? <span onClick={() => setViewMode('signup')} className="toggle-link">Back to Sign up</span></>}
        </p>

        {viewMode !== 'otp_verify' && (
          <>
            <div className="divider-container"><div className="divider-line"></div><span className="divider-text">OR</span><div className="divider-line"></div></div>
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