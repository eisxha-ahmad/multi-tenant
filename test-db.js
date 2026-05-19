const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function test() {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'output/quran1/data/quran.db');
  const dbData = fs.readFileSync(dbPath);
  const db = new SQL.Database(dbData);
  
  // Check what tables exist
  const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table'");
  console.log('Tables:', tables);
  
  // Try to get surahs
  try {
    const surahs = db.exec("SELECT * FROM surahs LIMIT 5");
    console.log('Surahs sample:', surahs);
  } catch(e) {
    console.log('Error with surahs table:', e.message);
  }
  
  // Try alternative table names
  try {
    const chapters = db.exec("SELECT * FROM chapters LIMIT 5");
    console.log('Chapters sample:', chapters);
  } catch(e) {
    console.log('Error with chapters table:', e.message);
  }
}

test();