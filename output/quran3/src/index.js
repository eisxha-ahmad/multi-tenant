const express = require('express');
const path = require('path');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8'));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Cache for API data
let surahsCache = null;
let versesCache = {};

// API Base URL (Free Quran API)
const QURAN_API = 'https://api.alquran.cloud/v1';

// Helper function to fetch from API
async function fetchFromAPI(endpoint) {
  try {
    const response = await fetch(`${QURAN_API}${endpoint}`);
    const data = await response.json();
    if (data.code === 200) {
      return data.data;
    }
    return null;
  } catch (error) {
    console.error('API Error:', error.message);
    return null;
  }
}

// Get all surahs (cached)
app.get('/api/surahs', async (req, res) => {
  try {
    if (!surahsCache) {
      const surahs = await fetchFromAPI('/surah');
      if (surahs) {
        surahsCache = surahs.map(s => ({
          id: s.number,
          name_arabic: s.name,
          name_simple: s.englishName,
          verses_count: s.numberOfAyahs,
          revelation_type: s.revelationType,
          name_english: s.englishName
        }));
      }
    }
    
    if (surahsCache) {
      res.json({ success: true, surahs: surahsCache });
    } else {
      res.json({ success: false, error: 'Failed to load surahs' });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Get specific surah with verses
app.get('/api/surah/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check cache
    if (versesCache[id]) {
      return res.json({ success: true, surah: versesCache[id] });
    }
    
    // Fetch from API
    const surahData = await fetchFromAPI(`/surah/${id}/editions/ar.alafasy,en.sahih`);
    
    if (surahData) {
      const verses = surahData[0].ayahs.map((ayah, idx) => ({
        number: ayah.numberInSurah,
        arabic: ayah.text,
        translation: surahData[1]?.ayahs[idx]?.text || ''
      }));
      
      const result = {
        id: parseInt(id),
        arabic_name: surahData[0].name,
        english_name: surahData[0].englishName,
        total_verses: verses.length,
        revelation_type: surahData[0].revelationType,
        verses: verses
      };
      
      // Cache it
      versesCache[id] = result;
      res.json({ success: true, surah: result });
    } else {
      res.json({ success: false, error: 'Surah not found' });
    }
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// Search in Quran
app.get('/api/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    // Simple search - just return first few surahs that match
    if (!surahsCache) {
      await fetchFromAPI('/surah');
    }
    
    const results = surahsCache
      .filter(s => s.name_simple.toLowerCase().includes(query.toLowerCase()) || 
                    s.name_arabic.includes(query))
      .slice(0, 10)
      .map(s => ({
        surah_id: s.id,
        surah_name: s.name_arabic,
        verse_number: 1,
        text: `Surah ${s.name_arabic}`
      }));
    
    res.json({ success: true, results });
  } catch (err) {
    res.json({ success: true, results: [] });
  }
});

// App info
// App info
app.get('/api/info', (req, res) => {
  res.json({
    appName: config.appName,
    appId: config.appId,
    tenantId: config.tenantId,
    description: config.description,
    features: config.features || ['reading'],      // ← ADD THIS
    theme: config.theme || 'dark',                 // ← ADD THIS
    primaryColor: config.primaryColor || '#2ecc71', // ← ADD THIS
    status: 'running'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(config.port, () => {
  console.log(`[${config.appName}] Running on port ${config.port} with REAL Quran API`);
});