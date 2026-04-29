const express = require('express');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Hugging Face with your API key
const HF_API_KEY = process.env.HUGGING_FACE_API_KEY || 'hf_LtLYutQgJrfvjkhcMlCJAKGcJKSTJLZMIUBUEhJ';
const hf = new HfInference(HF_API_KEY);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Kealee AI API is running!' });
});

// Text-to-image generation
app.post('/api/generate', async (req, res) => {
  const { prompt, model, negativePrompt = 'blurry, ugly, low quality' } = req.body;
  
  console.log(`🎨 Generating image for: ${prompt}`);
  
  try {
    const response = await hf.textToImage({
      model: model || 'stabilityai/stable-diffusion-3.5-large',
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        guidance_scale: 7.5,
        num_inference_steps: 30
      }
    });
    
    // Convert the response to base64
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    
    res.json({
      success: true,
      image: `data:image/jpeg;base64,${base64}`
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Image-to-image transformation
app.post('/api/transform', async (req, res) => {
  const { imageBase64, prompt, strength = 0.7 } = req.body;
  
  console.log(`🔄 Transforming image with prompt: ${prompt}`);
  
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageBase64.split(',')[1], 'base64');
    
    const response = await hf.imageToImage({
      model: 'stabilityai/stable-diffusion-xl-refiner-1.0',
      inputs: imageBuffer,
      parameters: {
        prompt: prompt,
        negative_prompt: 'blurry, ugly, distorted',
        guidance_scale: 7.5,
        strength: strength
      }
    });
    
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    
    res.json({
      success: true,
      image: `data:image/jpeg;base64,${base64}`
    });
  } catch (error) {
    console.error('Transform Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Kealee AI API running on http://localhost:${PORT}`);
  console.log(`📡 IP for phone connection: http://192.168.40.16:${PORT}`);
});
