const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

let db = null;

async function loadDatabase() {
  if (db) return db;
  
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '../data/quran.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('Quran database not found at:', dbPath);
    return null;
  }
  
  const dbData = fs.readFileSync(dbPath);
  db = new SQL.Database(dbData);
  return db;
}

async function getAllSurahs() {
  const database = await loadDatabase();
  if (!database) return [];
  
  const result = database.exec(`
    SELECT 
      surah_number as id,
      name_arabic as arabic_name,
      name_simple as english_name,
      verses_count as total_verses,
      revelation_type
    FROM surahs 
    ORDER BY surah_number
  `);
  
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    id: row[0],
    arabic_name: row[1],
    english_name: row[2],
    total_verses: row[3],
    revelation_type: row[4]
  }));
}

async function getSurah(surahId) {
  const database = await loadDatabase();
  if (!database) return null;
  
  // Get surah info
  const surahResult = database.exec(`
    SELECT 
      surah_number as id,
      name_arabic as arabic_name,
      name_simple as english_name,
      verses_count as total_verses,
      revelation_type
    FROM surahs 
    WHERE surah_number = ${surahId}
  `);
  
  if (surahResult.length === 0) return null;
  
  const surah = surahResult[0].values[0];
  
  // Get all verses
  const versesResult = database.exec(`
    SELECT 
      verse_number,
      arabic_text
    FROM verses 
    WHERE surah_id = ${surahId}
    ORDER BY verse_number
  `);
  
  const verses = versesResult.length > 0 ? versesResult[0].values.map(row => ({
    number: row[0],
    arabic: row[1]
  })) : [];
  
  return {
    id: surah[0],
    arabic_name: surah[1],
    english_name: surah[2],
    total_verses: surah[3],
    revelation_type: surah[4],
    verses: verses
  };
}

async function searchVerses(query) {
  const database = await loadDatabase();
  if (!database) return [];
  
  const result = database.exec(`
    SELECT 
      v.surah_id,
      s.name_arabic,
      v.verse_number,
      v.arabic_text
    FROM verses v
    JOIN surahs s ON v.surah_id = s.surah_number
    WHERE v.arabic_text LIKE '%${query}%'
    LIMIT 20
  `);
  
  if (result.length === 0) return [];
  
  return result[0].values.map(row => ({
    surah_id: row[0],
    surah_name: row[1],
    verse_number: row[2],
    text: row[3]
  }));
}

module.exports = { getAllSurahs, getSurah, searchVerses };