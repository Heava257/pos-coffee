import React from "react";
import dayjs from "dayjs";

const PrintLabel = ({ cart_list, objSummary, branchInfo }) => {
  return (
    <div className="print-label-container">
      {cart_list?.map((item, index) => {
        const qty = item.cart_qty || 1;
        return Array.from({ length: qty }).map((_, i) => (
          <div
            key={`${index}-${i}`}
            style={{
              width: "40mm",
              height: "30mm",
              padding: "1.5mm 1.5mm 1.5mm 3.5mm",
              boxSizing: "border-box",
              backgroundColor: "#fff",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              pageBreakAfter: "always",
              color: "#000",
              fontFamily: "'Inter', 'Battambang', sans-serif"
            }}
          >
            {/* Left Accent Bar for Premium Look */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "1.5mm", background: "#000" }}></div>

            {/* Header: Order No & Type */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5mm" }}>
              <span style={{ fontSize: "11px", fontWeight: 900 }}>#{objSummary?.order_no || objSummary?.orderNo || objSummary?.id || "TEMP"}</span>
              <span style={{ fontSize: "8px", fontWeight: 900, textTransform: "uppercase" }}>
                {objSummary?.order_type === "dine_in" ? "ញ៉ាំក្នុងហាង" : "ខ្ចប់ទៅក្រៅ"}
              </span>
            </div>

            {/* Product Name - High Visibility */}
            <div style={{
              fontSize: "13px",
              fontWeight: 900,
              lineHeight: "1.1",
              margin: "0.5mm 0",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden"
            }}>
              {item.product_name || item.name}
            </div>

            {/* Options / Customization Box */}
            <div style={{ flex: 1, marginTop: "1px" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: "#333", border: "0.5pt solid #000", padding: "1px 4px", borderRadius: "1px", display: "inline-block" }}>
                {item.size && <span>{item.size}</span>}
                {item.sugar && <span>{item.size ? " • " : ""}{item.sugar} Sug</span>}
                {item.mood && <span>{(item.size || item.sugar) ? " • " : ""}{item.mood}</span>}
              </div>

              {item.addons_selected && item.addons_selected.filter(a => a.name).length > 0 && (
                <div style={{ fontSize: "8px", marginTop: "1px", fontWeight: 500 }}>
                  + {item.addons_selected.filter(a => a.name).map(a => a.name).join(", ")}
                </div>
              )}
            </div>

            {/* Footer: Date/Time & Branch */}
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "7px", opacity: 0.7, marginTop: "0.5mm" }}>
              <span>{branchInfo?.name || "Coffee"}</span>
              <span>{dayjs().format("DD/MM HH:mm")}</span>
            </div>
          </div>
        ));
      })}
    </div>
  );
};

export default PrintLabel;
