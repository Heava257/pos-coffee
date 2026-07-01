import { createRoot } from "react-dom/client";
import App from "@/App.jsx";
import "@/index.css";
import { message } from "antd";
import Swal from "sweetalert2";
import { useLanguage } from "@/app/store/language.store";

// ─── Monkey-Patch Ant Design message to use SweetAlert2 Global Modals ──────────

const originalSuccess = message.success;
const originalError = message.error;
const originalWarning = message.warning;

const isHTML = (str) => /<[a-z][\s\S]*>/i.test(str);

message.success = (content, duration, onClose) => {
  if (typeof content !== "string" || content.length < 5 || content.toLowerCase().includes("copy")) {
    return originalSuccess(content, duration, onClose);
  }

  // Prevent duplicate overlapping modals
  if (Swal.isVisible()) return;

  const activeLang = useLanguage.getState?.().lang || "en";
  const title = activeLang === "kh" ? "ជោគជ័យ!" : "Success!";
  const okText = activeLang === "kh" ? "យល់ព្រម" : "Ok";

  Swal.fire({
    icon: "success",
    title,
    text: content,
    confirmButtonText: okText,
    confirmButtonColor: "#1e4a2d",
    customClass: {
      popup: "rounded-2xl",
    },
  });
};

message.error = (content, duration, onClose) => {
  if (typeof content !== "string" || content.length < 5) {
    return originalError(content, duration, onClose);
  }

  // Prevent duplicate overlapping modals
  if (Swal.isVisible()) return;

  const activeLang = useLanguage.getState?.().lang || "en";
  const title = activeLang === "kh" ? "មានបញ្ហា!" : "Error!";
  const okText = activeLang === "kh" ? "យល់ព្រម" : "Ok";

  Swal.fire({
    icon: "error",
    title,
    [isHTML(content) ? "html" : "text"]: content,
    confirmButtonText: okText,
    confirmButtonColor: "#1e4a2d",
    customClass: {
      popup: "rounded-2xl",
    },
  });
};

message.warning = (content, duration, onClose) => {
  if (typeof content !== "string" || content.length < 5) {
    return originalWarning(content, duration, onClose);
  }

  // Prevent duplicate overlapping modals
  if (Swal.isVisible()) return;

  const activeLang = useLanguage.getState?.().lang || "en";
  const title = activeLang === "kh" ? "ការព្រមាន!" : "Warning!";
  const okText = activeLang === "kh" ? "យល់ព្រម" : "Ok";

  Swal.fire({
    icon: "warning",
    title,
    text: content,
    confirmButtonText: okText,
    confirmButtonColor: "#1e4a2d",
    customClass: {
      popup: "rounded-2xl",
    },
  });
};

// ─── Render application ──────────────────────────────────────────────────────

createRoot(document.getElementById("root")).render(<App />);