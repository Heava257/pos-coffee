export const getPrinterSettings = () => {
    try {
        // Auto-migrate existing browsers to default OFF for stickers and kitchen
        const migrated = localStorage.getItem("printer_settings_migrated_v2");
        if (migrated !== "true") {
            const settings = localStorage.getItem("printer_settings");
            let parsed = {};
            if (settings) {
                try { parsed = JSON.parse(settings); } catch(e){}
            }
            const migratedSettings = {
                label_first: false,
                auto_print: parsed.auto_print !== undefined ? parsed.auto_print : true,
                invoice_enabled: parsed.invoice_enabled !== undefined ? parsed.invoice_enabled : true,
                label_enabled: false,
                kitchen_enabled: false
            };
            localStorage.setItem("printer_settings", JSON.stringify(migratedSettings));
            localStorage.setItem("printer_settings_migrated_v2", "true");
            return migratedSettings;
        }

        const settings = localStorage.getItem("printer_settings");
        if (settings) {
            return JSON.parse(settings);
        }
    } catch (err) {
        console.error("Error reading printer settings:", err);
    }
    // Default settings
    return {
        label_first: false,     // Default: Invoice before Label
        auto_print: true,       // Default: Auto print after checkout
        invoice_enabled: true,  // Default: Print Invoice
        label_enabled: false,   // Default: Print Label (Sticker) OFF
        kitchen_enabled: false  // Default: Print Kitchen Ticket OFF
    };
};

export const setPrinterSettings = (settings) => {
    localStorage.setItem("printer_settings", JSON.stringify(settings));
};
