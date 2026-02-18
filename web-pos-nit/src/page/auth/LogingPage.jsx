import React, { useState, useEffect } from "react";
import { Form, Button, message, Input } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setPermission, setProfile } from "../../store/profile.store";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import WelcomeAnimation from "../../component/layout/WelcomeAnimation";
import { UserOutlined, LockOutlined, ArrowRightOutlined, CustomerServiceOutlined } from '@ant-design/icons';
import { FaTelegramPlane } from "react-icons/fa";

function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      handleSSO(token);
    }
  }, []);

  const handleSSO = async (token) => {
    setLoading(true);
    try {
      setAcccessToken(token);
      // Verify with system and get profile
      const res = await request("auth/profile", "post");
      if (res && res.profile) {
        setProfile(JSON.stringify(res.profile));
        setPermission(JSON.stringify(res.permission || []));
        message.success("SSO Authentication Successful!");
        navigate("/");
      } else {
        message.error("SSO Failed. Invalid Platform Token.");
      }
    } catch (err) {
      console.error("SSO Error:", err);
      message.error("Connection to identity provider failed.");
    } finally {
      setLoading(false);
    }
  };

  const abouthere = () => {
    navigate("/about");
  };

  const handleTelegramSupport = () => {
    window.open('https://t.me/+fAlSFua8dSdhZWI1', '_blank');
  };

  const goToPlatform = () => {
    window.location.href = "http://localhost:3000"; // Platform URL
  };

  // Show welcome animation if login is successful
  if (showWelcome) {
    return <WelcomeAnimation />;
  }

  return (
    <>
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Text:wght@400;600;700&family=Source+Sans+Pro:wght@300;400;500;600&display=swap');
        
        .login-container {
          font-family: 'Source Sans Pro', sans-serif;
          background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          position: relative;
        }
        
        .login-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          width: 450px;
          padding: 50px 40px;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px rgba(0,0,0,0.5);
          color: white;
        }

        .sso-badge {
          background: linear-gradient(90deg, #f1c40f, #f39c12);
          color: black;
          padding: 5px 15px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 20px;
        }

        .welcome-title {
          font-family: 'Crimson Text', serif;
          font-size: 36px;
          margin-bottom: 10px;
          background: linear-gradient(to bottom, #fff, #bdc3c7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .status-msg {
          color: #95a5a6;
          margin-bottom: 40px;
          line-height: 1.6;
        }

        .platform-btn {
          background: #fff !important;
          color: #000 !important;
          border: none !important;
          height: 55px !important;
          border-radius: 15px !important;
          font-weight: 700 !important;
          font-size: 16px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 10px !important;
          width: 100% !important;
          transition: all 0.3s ease !important;
        }

        .platform-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(255,255,255,0.2);
        }

        .loading-pulse {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid #f39c12;
          border-top-color: transparent;
          animation: spin 1s linear infinite;
          margin: 0 auto 30px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .footer-support {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: center;
          gap: 20px;
        }

        .support-link {
          color: #7f8c8d;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.3s;
        }

        .support-link:hover {
          color: #fff;
        }
      `}</style>

      <div className="login-container">
        <div className="login-card">
          <div className="sso-badge">SaaS Ecosystem Security</div>

          {loading ? (
            <div className="auth-flow">
              <div className="loading-pulse"></div>
              <h1 className="welcome-title">Verifying Passport</h1>
              <p className="status-msg">Synchronizing with Platform Identity Services...</p>
            </div>
          ) : (
            <div className="launch-flow">
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🔒</div>
              <h1 className="welcome-title">Access Restricted</h1>
              <p className="status-msg">
                This system is a managed branch of the SaaS Network.
                Individual login is disabled for your security.
              </p>

              <Button
                className="platform-btn"
                icon={<ArrowRightOutlined />}
                onClick={goToPlatform}
              >
                Go to Hub Platform
              </Button>
            </div>
          )}

          <div className="footer-support">
            <span className="support-link" onClick={handleTelegramSupport}>Nerve Support</span>
            <span className="support-link" onClick={abouthere}>System Registry</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;