import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import cors from 'cors';

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // キャッシュ5分
const cacheKey = 'multiPrices';

app.use(cors());

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

// 🔄 起動時にキャッシュを温める
const warmCache = async () => {
  try {
    const response = await axios.get(url);
    cache.set(cacheKey, response.data);
    console.log('🔥 Warmed up cache on startup');
  } catch (err) {
    console.warn('⚠️ Failed to warm up cache:', err.message);
  }
};

warmCache(); // 初期化

app.get('/price', async (req, res) => {
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const response = await axios.get(url);
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (err) {
    console.error('❌ API error:', err.message);

    if (cached) {
      console.log('📦 Serving fallback cached data');
      return res.json(cached);
    }

    res.status(503).json({
      error: 'CoinGecko API rate limited or unreachable. Please try again later.',
      retryAfter: 60
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
