import React, { useState } from "react";
import platformLogo from "@/assets/platform_logo.png";
import { useLocation, Link } from "react-router-dom";
import { useLanguage, translations } from "@/app/store/language.store";
import { 
  ArrowLeftOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  CompassOutlined, 
  SendOutlined
} from "@ant-design/icons";
import { Form, Input, Button, message } from "antd";

const COLORS = {
  primary: "#1e4a2d", // Dark Coffee Green
  accent: "#c0a060",  // Soft Gold
  bg: "#0d0e12",      // Deep Premium Dark Background
  cardBg: "#16181f",  // Premium Card Dark Gray
  white: "#ffffff",
  textMuted: "rgba(255, 255, 255, 0.5)",
  border: "rgba(255, 255, 255, 0.06)"
};

function LegalPage() {
  const location = useLocation();
  const path = location.pathname;
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.en;
  const [loading, setLoading] = useState(false);

  const getPageContent = () => {
    const updatedDate = lang === 'kh' ? "១៦ មិថុនា ២០២៦" : "June 16, 2026";
    switch (path) {
      case "/terms":
        return {
          title: t.terms_title,
          updated: updatedDate,
          sections: [
            { title: t.terms_s1_title, content: t.terms_s1_desc },
            { title: t.terms_s2_title, content: t.terms_s2_desc },
            { title: t.terms_s3_title, content: t.terms_s3_desc },
            { title: t.terms_s4_title, content: t.terms_s4_desc }
          ]
        };

      case "/privacy":
        return {
          title: t.privacy_title,
          updated: updatedDate,
          sections: [
            { title: t.privacy_s1_title, content: t.privacy_s1_desc },
            { title: t.privacy_s2_title, content: t.privacy_s2_desc },
            { title: t.privacy_s3_title, content: t.privacy_s3_desc },
            { title: t.privacy_s4_title, content: t.privacy_s4_desc }
          ]
        };

      case "/refund-policy":
        return {
          title: t.refund_title,
          updated: updatedDate,
          sections: [
            { title: t.refund_s1_title, content: t.refund_s1_desc },
            { title: t.refund_s2_title, content: t.refund_s2_desc },
            { title: t.refund_s3_title, content: t.refund_s3_desc }
          ]
        };

      case "/cookies":
        return {
          title: t.cookie_title,
          updated: updatedDate,
          sections: [
            { title: t.cookie_s1_title, content: t.cookie_s1_desc },
            { title: t.cookie_s2_title, content: t.cookie_s2_desc },
            { title: t.cookie_s3_title, content: t.cookie_s3_desc }
          ]
        };

      case "/acceptable-use":
        return {
          title: t.acceptable_title,
          updated: updatedDate,
          sections: [
            { title: t.acceptable_s1_title, content: t.acceptable_s1_desc },
            { title: t.acceptable_s2_title, content: t.acceptable_s2_desc },
            { title: t.acceptable_s3_title, content: t.acceptable_s3_desc }
          ]
        };

      case "/about":
        return {
          title: t.about_title,
          updated: updatedDate,
          sections: [
            { title: t.about_s1_title, content: t.about_s1_desc },
            { title: t.about_s2_title, content: t.about_s2_desc }
          ]
        };

      default:
        return null;
    }
  };

  const content = getPageContent();

  const onContactSubmit = async (values) => {
    setLoading(true);
    setTimeout(() => {
      message.success(lang === 'kh' ? "សូមអរគុណ! សាររបស់អ្នកត្រូវបានផ្ញើទៅកាន់ក្រុមការងារគាំទ្ររបស់យើងហើយ។" : "Thank you! Your message has been sent to our support team.");
      setLoading(false);
    }, 1000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800&display=swap');
        
        /* Premium layout styles */
        .legal-page-wrapper {
          background: ${COLORS.bg} !important;
          min-height: 100vh;
          color: #ffffff;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          flex-direction: column;
          margin: 0;
          padding: 0;
        }
        .legal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 8%;
          border-bottom: 1px solid ${COLORS.border};
          background: rgba(22, 24, 31, 0.85);
          backdrop-filter: blur(12px);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .legal-logo {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .legal-logo img {
          height: 40px;
          width: 40px;
          object-fit: contain;
          border-radius: 50%;
        }
        .legal-logo-text {
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          line-height: 1;
        }
        .legal-logo-sub {
          font-size: 10px;
          color: rgba(255,255,255,0.45);
          font-weight: 500;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .back-home-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #ffffff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 30px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
        }
        .back-home-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #c0a060;
          color: #c0a060;
        }
        .lang-switcher {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 3px;
          gap: 4px;
        }
        .lang-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 6px 14px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .lang-btn.active {
          background: #c0a060;
          color: #000000;
        }

        /* Full Screen Page Layout */
        .legal-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 100%;
          width: 100%;
          margin: 0 auto;
          padding: 40px 8%;
          flex: 1;
        }
        .legal-content-area {
          width: 100%;
        }
        .legal-card {
          background: ${COLORS.cardBg};
          border: 1px solid ${COLORS.border};
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          width: 100%;
        }
        .legal-title {
          font-size: 32px;
          font-weight: 800;
          margin-bottom: 12px;
          color: #ffffff;
        }
        .legal-meta {
          font-size: 13px;
          color: #c0a060;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 36px;
          border-bottom: 1px solid ${COLORS.border};
          padding-bottom: 16px;
        }
        .legal-section {
          margin-bottom: 32px;
        }
        .legal-section-title {
          font-size: 17px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
          border-left: 3px solid #c0a060;
          padding-left: 12px;
        }
        .legal-section-text {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.65);
          line-height: 1.7;
        }

        /* Contact grid layout */
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 40px;
        }
        .contact-info-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid ${COLORS.border};
          border-radius: 20px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .contact-info-item {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .contact-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: rgba(192, 160, 96, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c0a060;
          font-size: 18px;
          flex-shrink: 0;
        }
        
        /* Custom form styles */
        .ant-form-item-label > label {
          color: rgba(255, 255, 255, 0.8) !important;
          font-size: 13px !important;
          font-weight: 500;
        }
        .custom-input {
          background: rgba(255, 255, 255, 0.02) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
          border-radius: 8px !important;
          transition: all 0.3s;
        }
        .custom-input:focus, .custom-input:hover {
          border-color: #c0a060 !important;
          background: rgba(255, 255, 255, 0.04) !important;
          box-shadow: 0 0 0 2px rgba(192, 160, 96, 0.1) !important;
        }
        .custom-input::placeholder {
          color: rgba(255, 255, 255, 0.25) !important;
        }

        /* Responsiveness */
        @media (max-width: 768px) {
          .legal-header {
            padding: 16px 24px;
          }
          .legal-card {
            padding: 32px 24px;
          }
          .legal-title {
            font-size: 26px;
          }
          .contact-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>

      <div className="legal-page-wrapper">
        {/* Sticky Premium Header */}
        <header className="legal-header">
          <Link to="/" className="legal-logo">
            <img src={platformLogo} alt="Platform Logo" />
            <div>
              <div className="legal-logo-text">អាយធីស្រុកស្រែ</div>
              <div className="legal-logo-sub">IT SrukSrae</div>
            </div>
          </Link>
          <div className="header-actions">
            <div className="lang-switcher">
              <button 
                className={`lang-btn ${lang === 'kh' ? 'active' : ''}`}
                onClick={() => setLang('kh')}
              >
                KH
              </button>
              <button 
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>
            <Link to="/" className="back-home-btn">
              <ArrowLeftOutlined /> {t.back_to_home}
            </Link>
          </div>
        </header>

        {/* Center content */}
        <main className="legal-main">
          <section className="legal-content-area">
            {path === "/contact" ? (
              <div className="legal-card">
                <h1 className="legal-title">{t.contact_title}</h1>
                <p style={{ color: COLORS.textMuted, fontSize: "14px", marginBottom: "36px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "16px" }}>
                  {t.contact_get_in_touch_desc}
                </p>

                <div className="contact-grid">
                  {/* Contact Info Detail */}
                  <div className="contact-info-card">
                    <div>
                      <div className="contact-info-item">
                        <div className="contact-icon-wrapper">
                          <MailOutlined />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Email</div>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>support@yourcompany.com</div>
                        </div>
                      </div>

                      <div className="contact-info-item">
                        <div className="contact-icon-wrapper">
                          <PhoneOutlined />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Phone</div>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>+855 81 257 000</div>
                        </div>
                      </div>

                      <div className="contact-info-item">
                        <div className="contact-icon-wrapper">
                          <CompassOutlined />
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 700 }}>Location</div>
                          <div style={{ fontSize: "14px", fontWeight: 600 }}>Phnom Penh, Cambodia</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: "20px", marginTop: "32px", fontSize: "12px", color: COLORS.textMuted }}>
                      {t.contact_response_time}
                    </div>
                  </div>

                  {/* Message Form submission */}
                  <div>
                    <Form layout="vertical" onFinish={onContactSubmit} requiredMark={false}>
                      <Form.Item name="name" label={t.contact_full_name} rules={[{ required: true, message: lang === 'kh' ? "សូមវាយបញ្ចូលឈ្មោះរបស់អ្នក" : "Please input your name" }]}>
                        <Input className="custom-input" style={{ height: "42px" }} placeholder="John Doe" />
                      </Form.Item>
                      <Form.Item name="email" label={t.email_address || t.email_address_label} rules={[{ required: true, type: "email", message: lang === 'kh' ? "សូមវាយបញ្ចូលអ៊ីមែលត្រឹមត្រូវ" : "Please input a valid email" }]}>
                        <Input className="custom-input" style={{ height: "42px" }} placeholder="john@example.com" />
                      </Form.Item>
                      <Form.Item name="message" label={t.contact_message} rules={[{ required: true, message: lang === 'kh' ? "សូមវាយបញ្ចូលសាររបស់អ្នក" : "Please input your message" }]}>
                        <Input.TextArea className="custom-input" rows={4} placeholder={t.contact_message_placeholder} />
                      </Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading} style={{ width: "100%", background: COLORS.accent, border: "none", color: "#000", fontWeight: 700, borderRadius: "8px", height: "44px", marginTop: "8px" }}>
                        <SendOutlined /> {t.contact_send_message}
                      </Button>
                    </Form>
                  </div>
                </div>
              </div>
            ) : content ? (
              <div className="legal-card">
                <h1 className="legal-title">{content.title}</h1>
                <div className="legal-meta">
                  {t.last_updated}: {content.updated}
                </div>

                <div className="legal-body">
                  {content.sections.map((sect, idx) => (
                    <div className="legal-section" key={idx}>
                      <h2 className="legal-section-title">{sect.title}</h2>
                      <p className="legal-section-text">{sect.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="legal-card" style={{ textAlign: "center" }}>
                <h2>Page Not Found</h2>
                <p style={{ marginTop: "12px", color: COLORS.textMuted }}>The requested URL could not be resolved.</p>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}

export default LegalPage;
