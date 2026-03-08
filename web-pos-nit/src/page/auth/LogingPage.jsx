import React, { useState } from "react";
import { Form, Button, Input, message, ConfigProvider } from "antd";
import { request } from "../../util/helper";
import { setAcccessToken, setProfile, setPermission } from "../../store/profile.store";
import { useNavigate, Link } from "react-router-dom";
import {
  LockOutlined,
  MailOutlined,
  ArrowRightOutlined,
  LoginOutlined
} from '@ant-design/icons';

const COLORS = {
  primary: "#1e4a2d", // Dark Coffee Green
  accent: "#f7c06a",  // Soft Gold
  bg: "#f4f1eb",      // Warm Cream
  white: "#ffffff",
  text: "#1a2e1a"
};

function LoginPage() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await request("auth/login", "post", values);
      if (res && res.access_token) {
        setAcccessToken(res.access_token);
        setProfile(res.profile || {});
        setPermission(res.permission || []);
        message.success("Logged in successfully!");
        navigate("/dashboard");
      } else {
        message.error(res.message || "Login failed. Check your credentials.");
      }
    } catch (err) {
      message.error("Unable to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: COLORS.primary,
          borderRadius: 12,
        },
      }}
    >
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0a1f12 100%)`,
        padding: "20px"
      }}>
        {/* Decorative background circle */}
        <div style={{
          position: "fixed",
          bottom: "-10%",
          left: "-5%",
          width: "350px",
          height: "350px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(247,192,106,0.08) 0%, transparent 70%)",
        }} />

        <div style={{
          position: "relative",
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: "32px",
          padding: "50px 40px",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
        }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ fontSize: "50px", marginBottom: "12px" }}>☕</div>
            <h1 style={{
              color: "#fff",
              fontSize: "30px",
              fontWeight: 700,
              margin: 0,
              fontFamily: "'Crimson Text', serif"
            }}>Green Grounds</h1>
            <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "8px" }}>
              SaaS POS Management Portal
            </p>
          </div>

          <Form
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please enter your email' }]}
            >
              <Input
                prefix={<MailOutlined style={{ color: COLORS.accent }} />}
                placeholder="Email Address"
                style={{ height: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: COLORS.accent }} />}
                placeholder="Password"
                style={{ height: "50px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}
              />
            </Form.Item>

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <Link to="/forgot-password" style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>Forgot password?</Link>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: "100%",
                height: "55px",
                fontSize: "16px",
                fontWeight: 600,
                background: COLORS.accent,
                borderColor: COLORS.accent,
                color: COLORS.primary,
                borderRadius: "15px"
              }}
              icon={<LoginOutlined />}
            >
              Login to Branch
            </Button>
          </Form>

          <div style={{ textAlign: "center", marginTop: "30px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)" }}>
              Want to start a business? <br />
              <Link to="/register" style={{ color: COLORS.accent, fontWeight: 600, fontSize: "15px" }}>
                Create SaaS Account <ArrowRightOutlined style={{ fontSize: "12px" }} />
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .ant-form-item-explain-error {
          color: #ff7875 !important;
          font-size: 12px;
          margin-top: 4px;
        }
        .ant-input-affix-wrapper input::placeholder {
          color: rgba(255,255,255,0.3) !important;
        }
        .ant-input-password-icon {
          color: rgba(255,255,255,0.5) !important;
        }
      `}</style>
    </ConfigProvider>
  );
}

export default LoginPage;