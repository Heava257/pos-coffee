const { db } = require('./src/util/helper');

const updateCategories = async () => {
    const data = [
        {
            name: 'Seafood / គ្រឿងសមុទ្រ',
            sizes: JSON.stringify([{ label: 'Small', value: 'small', price: 0 }, { label: 'Large', value: 'large', price: 5 }, { label: '1kg', value: '1kg', price: 15 }]),
            moods: null,
            add_ons: null
        },
        {
            name: 'Soup / សម្ល',
            sizes: JSON.stringify([{ label: 'Small Bowl', value: 'small', price: 0 }, { label: 'Large Bowl', value: 'large', price: 3 }]),
            moods: null,
            add_ons: null
        },
        {
            name: 'Stir-Fry / ម្ហូបឆា',
            sizes: JSON.stringify([{ label: 'Normal', value: 'normal', price: 0 }, { label: 'Large', value: 'large', price: 2 }]),
            moods: null,
            add_ons: null
        },
        {
            name: 'Roasted & Deep-fried / ម្ហូបបំពង & អាំង',
            sizes: JSON.stringify([{ label: 'Half', value: 'half', price: 0 }, { label: 'Full', value: 'full', price: 8 }]),
            moods: null,
            add_ons: null
        },
        {
            name: 'Salads & Spicy Mixed / ញាំ & បុក',
            sizes: JSON.stringify([{ label: 'Plate', value: 'plate', price: 0 }]),
            moods: JSON.stringify([{ label: 'Non-Spicy', value: 'no_spicy' }, { label: 'Mild', value: 'mild' }, { label: 'Spicy', value: 'spicy' }, { label: 'Extra Spicy', value: 'extra_spicy' }]),
            add_ons: null
        },
        {
            name: 'Dessert / បង្អែម',
            sizes: JSON.stringify([{ label: 'Small', value: 'small', price: 0 }, { label: 'Large', value: 'large', price: 1 }]),
            moods: null,
            add_ons: null
        },
        {
            name: 'Drinks / ភេសជ្ជៈ',
            sizes: JSON.stringify([{ label: 'Normal', value: 'normal', price: 0 }, { label: 'Large', value: 'large', price: 0.5 }]),
            moods: JSON.stringify([{ label: 'Normal Ice', value: 'normal_ice' }, { label: 'Less Ice', value: 'less_ice' }, { label: 'No Ice', value: 'no_ice' }]),
            add_ons: null
        }
    ];

    try {
        console.log("Starting update...");
        for (const item of data) {
            await db.query(
                "UPDATE categories SET default_sizes = ?, default_moods = ?, default_addons = ? WHERE name = ?",
                [item.sizes, item.moods, item.add_ons, item.name]
            );
            console.log(`Updated: ${item.name}`);
        }
        console.log("Success! All categories updated.");
    } catch (error) {
        console.error("Error updating categories:", error);
    } finally {
        process.exit();
    }
};

updateCategories();
