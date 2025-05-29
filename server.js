import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import cors from 'cors';

const app = express();
const cache = new NodeCache({ stdTTL: 300 }); // キャッシュ有効期限：5分
const cacheKey = 'multiPrices';

app.use(cors());

// ✅ CoinGeckoに渡す仮想通貨IDリスト
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
  'binancecoin',  // BNB
  'usd'           // ✅ 為替用（USD → JPY）
].join(',');

// CoinGecko API エンドポイント
const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd,jpy`;

// 🔄 起動時にキャッシュを温める（CoinGecko制限対策）
const warmCache = async () => {
  try {
    const response = await axios.get(url);
    cache.set(cacheKey, response.data);
    console.log('🔥 Warmed up cache on startup');
  } catch (err) {
    console.warn('⚠️ Failed to warm up cache:', err.message);
  }
};

warmCache(); // サーバー起動時に一度データを取得

// 📡 APIエンドポイント：/price
app.get('/price', async (req, res) => {
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached); // キャッシュがあればそれを返す

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

// 🌐 ポート指定（Renderでは自動環境変数対応）
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));
