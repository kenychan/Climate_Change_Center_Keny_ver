const express = require('express');
const axios = require('axios');

const app = express();
const port = 3000;

// Define a route for proxying YouTube thumbnail requests
app.get('/proxy_youtube', async (req, res) => {
  try {
    const { videoId } = req.query;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;

    // Fetch the thumbnail image from YouTube
    const response = await axios.get(thumbnailUrl, {
      responseType: 'stream',
    });

    // Set response headers to allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe the response from YouTube to the client
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error while proxying the request');
  }
});

app.get('/proxy_picture', async (req, res) => {
  try {
    const { Pic_url } = req.query;
    const thumbnailUrl = Pic_url;


    // Fetch the thumbnail image from YouTube
    const response = await axios.get(thumbnailUrl, {
      responseType: 'stream',
    });

    // Set response headers to allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe the response from YouTube to the client
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error while proxying the request');
  }
});


app.get('/proxy_sound', async (req, res) => {
  try {
    const { sound_url } = req.query;
    const thumbnailUrl = sound_url;


    // Fetch the thumbnail image from YouTube
    const response = await axios.get(thumbnailUrl, {
      responseType: 'stream',
    });

    // Set response headers to allow CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Pipe the response from YouTube to the client
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error while proxying the request');
  }
});

// Start the Express server
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
