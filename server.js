require('dotenv').config(); // Load environment variables
const express = require('express');
const axios = require('axios'); // For making API requests
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to fetch calorie information
app.get('/api/calories', async (req, res) => {
  const { barcode } = req.query;

  if (!barcode) {
    return res.status(400).json({ error: 'Barcode is required' });
  }

  try {
    const fdaUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.FDA_API_KEY}&query=${barcode}`;
    const openFoodFactsUrl = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;

    // Fetch serving size from Open Food Facts
    const offResponse = await axios.get(openFoodFactsUrl);
    const offData = offResponse.data;

    if (offData.status === 1) { // Check if product is found in Open Food Facts
      const productName = offData.product.product_name || 'Unknown Product';
      const servingSize = offData.product?.serving_quantity; // Get serving size in grams
      const servingUnit = offData.product?.serving_quantity_unit || 'g';
      const caloriesPer100g = offData.product?.nutriments?.['energy-kcal_100g'];

      if (caloriesPer100g && servingSize) {
        // Calculate calories per serving
        const caloriesPerServing = (caloriesPer100g / 100) * parseFloat(servingSize);
        return res.json({
          productName,
          caloriesPerServing: caloriesPerServing.toFixed(1),
          servingSize: `${servingSize}${servingUnit}`,
        });
      } else {
        return res.json({ productName, error: 'Calorie information is not available' });
      }
    } else {
      // If product not found in Open Food Facts, try FDA API
      const fdaResponse = await axios.get(fdaUrl);
      const fdaData = fdaResponse.data;

      if (fdaData.foods && fdaData.foods.length > 0) {
        const foodItem = fdaData.foods[0];
        const productName = foodItem.description || 'Unknown Product';
        const caloriesPer100g = foodItem.foodNutrients.find(
          (nutrient) => nutrient.nutrientName === 'Energy'
        )?.value;

        if (caloriesPer100g && servingSize) {
          // Calculate calories per serving
          const caloriesPerServing = (caloriesPer100g / 100) * parseFloat(servingSize);
          return res.json({
            productName,
            caloriesPerServing: caloriesPerServing.toFixed(1),
            servingSize: `${servingSize}${servingUnit}`,
          });
        } else {
          return res.json({ productName, error: 'Calorie information is not available' });
        }
      } else {
        return res.json({ error: `Product with barcode ${barcode} not found` });
      }
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return res.status(500).json({ error: 'Failed to fetch product information' });
  }
});

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});