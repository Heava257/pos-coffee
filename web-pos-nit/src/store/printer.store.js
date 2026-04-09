export const getPrinterSettings = () => {
    try {
        const settings = localStorage.getItem("printer_settings");
        if (settings) {
            return JSON.parse(settings);
        }
    } catch (err) {
        console.error("Error reading printer settings:", err);
    }
    // Default settings
    return {
        label_first: true,     // Default: Label before Invoice
        auto_print: true,      // Default: Auto print after checkout
        invoice_enabled: true, // Default: Print Invoice
        label_enabled: true    // Default: Print Label
    };
};

export const setPrinterSettings = (settings) => {
    localStorage.setItem("printer_settings", JSON.stringify(settings));
};
