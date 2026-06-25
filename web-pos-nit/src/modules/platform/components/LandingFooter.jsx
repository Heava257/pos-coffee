import React from "react";
import { Link } from "react-router-dom";

const LandingFooter = ({ platformLogo }) => {
  return (
    <footer className="saas-footer">
      <div className="footer-grid">
        <div>
          <div className="footer-brand-title" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={platformLogo} alt="Platform Logo" style={{ height: "42px", width: "42px", objectFit: "contain", borderRadius: "50%" }} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: "1.2" }}>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>អាយធីស្រុកស្រែ</span>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>IT SrukSrae</span>
            </div>
          </div>
          <p className="footer-brand-desc">
            Multi-tenant cloud platform offering state-of-the-art POS management systems for vertical business scales.
          </p>
        </div>

        {/* Product Column */}
        <div>
          <div className="footer-col-title">Product</div>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="#features">Features</a></li>
            <li className="footer-link-item"><a href="#verticals">Modules</a></li>
            <li className="footer-link-item"><a href="#">Integrations</a></li>
            <li className="footer-link-item"><a href="#">Release Notes</a></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div>
          <div className="footer-col-title">Resources</div>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="#">Documentation</a></li>
            <li className="footer-link-item"><a href="#">API Docs</a></li>
            <li className="footer-link-item"><a href="#">Help Center</a></li>
            <li className="footer-link-item"><a href="#">Tutorials</a></li>
            <li className="footer-link-item"><a href="#">FAQ</a></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <div className="footer-col-title">Company</div>
          <ul className="footer-links-list">
            <li className="footer-link-item"><Link to="/about">About Us</Link></li>
            <li className="footer-link-item"><Link to="/contact">Contact Us</Link></li>
            <li className="footer-link-item"><a href="#">Careers</a></li>
            <li className="footer-link-item"><a href="#">Partners</a></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <div className="footer-col-title">Legal</div>
          <ul className="footer-links-list">
            <li className="footer-link-item"><Link to="/terms">Terms of Service</Link></li>
            <li className="footer-link-item"><Link to="/privacy">Privacy Policy</Link></li>
            <li className="footer-link-item"><Link to="/cookies">Cookie Policy</Link></li>
            <li className="footer-link-item"><Link to="/refund-policy">Refund Policy</Link></li>
            <li className="footer-link-item"><Link to="/acceptable-use">Acceptable Use</Link></li>
          </ul>
        </div>

        {/* Support Column */}
        <div>
          <div className="footer-col-title">Support</div>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="https://t.me/pongchiva" target="_blank" rel="noreferrer">Telegram</a></li>
            <li className="footer-link-item"><a href="mailto:support@yourcompany.com">Email Support</a></li>
            <li className="footer-link-item"><a href="#">Live Chat</a></li>
            <li className="footer-link-item"><a href="#">Status Page</a></li>
          </ul>
        </div>

        {/* Social Column */}
        <div>
          <div className="footer-col-title">Social</div>
          <ul className="footer-links-list">
            <li className="footer-link-item"><a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a></li>
            <li className="footer-link-item"><a href="https://linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a></li>
            <li className="footer-link-item"><a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a></li>
            <li className="footer-link-item"><a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>
          &copy; {new Date().getFullYear()} Green Grounds. All rights reserved. Version 1.0.0
        </div>
        <div>
          Status: <span style={{ color: "#81c784", fontWeight: 700 }}>● Operational</span>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
