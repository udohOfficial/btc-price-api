import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import cors from 'cors';

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // キャッシュ5分

app.use(cors());

app.get('/price', async (req, res) => {
  const cacheKey = 'multiPrices';
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const ids = [
      'bitcoin',      // BTC
      'ethereum',     // ETH
      'ripple',       // XRP
      'solana',       // SOL
      'polkadot',     // DOT
      'dogecoin',     // DOGE
      'litecoin',     // LTC
      'cardano',      // ADA
      'avalanche-2',  // AVAX
      'binancecoin'   // BNB
    ].join(',');

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,jpy`;
    const response = await axios.get(url);

    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'API fetch failed' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));

