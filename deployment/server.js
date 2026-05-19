const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const logger = require('../logger/logger');

async function deploy(generatedApps, configs) {
  const app = express();
  const PORT = 8080;
  
  // Define successfulApps here - this was missing!
  const successfulApps = generatedApps.filter(a => a.success);

  // Dashboard route with direct links
  app.get('/', (req, res) => {
    const rows = successfulApps.map(a => {
      const cfg = configs.find(c => c.appId === a.appId);
      if (!cfg) return '';
      return `<tr>
        <td><strong>${cfg.appName}</strong></td>
        <td>${cfg.appId}</td>
        <td>${cfg.tenantId}</td>
        <td>${cfg.environment || 'production'}</td>
        <td>
          <a href="http://localhost:${cfg.port}" target="_blank" style="background:#2ecc71; color:#fff; padding:8px 16px; border-radius:8px; text-decoration:none; font-weight:bold;">
            🚀 Open App → Port ${cfg.port}
          </a>
        </td>
      </tr>`;
    }).join('');

    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>ADAGDS - Quran Learning Apps</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #0a0f2a 0%, #0a1a2a 100%);
      color: #eee; 
      min-height: 100vh;
    }
    .header { 
      background: linear-gradient(135deg, #1e3c2c 0%, #0d2818 100%);
      padding: 30px 40px; 
      text-align: center;
      border-bottom: 3px solid #2ecc71;
    }
    .header h1 { 
      margin: 0; 
      font-size: 32px;
      font-weight: 700;
    }
    .header h1 span { color: #2ecc71; }
    .header p { 
      margin: 10px 0 0; 
      opacity: 0.8; 
      font-size: 14px;
    }
    .quran-badge {
      background: rgba(46,204,113,0.2);
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      margin-top: 10px;
    }
    .container { 
      max-width: 1200px; 
      margin: 40px auto; 
      padding: 0 20px; 
    }
    .stats { 
      display: grid; 
      grid-template-columns: repeat(4,1fr); 
      gap: 20px; 
      margin-bottom: 40px; 
    }
    .stat { 
      background: rgba(26,26,46,0.8);
      backdrop-filter: blur(10px);
      border-radius: 15px; 
      padding: 25px; 
      text-align: center;
      border: 1px solid rgba(46,204,113,0.3);
      transition: transform 0.3s;
    }
    .stat:hover { transform: translateY(-5px); }
    .stat h2 { 
      font-size: 42px; 
      color: #2ecc71; 
      margin: 0; 
      font-weight: 700;
    }
    .stat p { 
      opacity: 0.7; 
      margin: 10px 0 0; 
      font-size: 13px; 
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      background: rgba(26,26,46,0.6);
      backdrop-filter: blur(10px);
      border-radius: 15px; 
      overflow: hidden;
      border: 1px solid rgba(46,204,113,0.2);
    }
    th, td { 
      padding: 15px 18px; 
      text-align: left; 
      border-bottom: 1px solid rgba(46,204,113,0.2);
      font-size: 14px; 
    }
    th { 
      background: #1e3c2c;
      font-size: 12px; 
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    tr:hover { background: rgba(46,204,113,0.1); }
    .open-btn {
      background: #2ecc71;
      color: #fff;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: bold;
      transition: background 0.3s;
      display: inline-block;
    }
    .open-btn:hover { background: #27ae60; }
    .footer {
      text-align: center;
      padding: 30px;
      color: #666;
      font-size: 12px;
    }
    .error-note {
      background: rgba(231,76,60,0.2);
      border: 1px solid #e74c3c;
      border-radius: 10px;
      padding: 15px;
      margin-top: 20px;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📖 <span>Quran</span> Learning Apps</h1>
    <p>Adaptive Distributed Application Generation & Deployment System</p>
    <div class="quran-badge">✨ Islamic Learning Applications ✨</div>
  </div>
  <div class="container">
    <div class="stats">
      <div class="stat"><h2>${successfulApps.length}</h2><p>Apps Generated</p></div>
      <div class="stat"><h2>5</h2><p>Quran Surahs</p></div>
      <div class="stat"><h2>${PORT}</h2><p>Dashboard Port</p></div>
      <div class="stat"><h2>🚀</h2><p>Ready to Learn</p></div>
    </div>
    <h2 style="margin-bottom: 20px;">📚 Available Applications</h2>
    <table>
      <thead>
        <tr><th>App Name</th><th>App ID</th><th>Tenant</th><th>Environment</th><th>Action</th></tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="5" style="text-align:center">No apps available</td></tr>'}</tbody>
    </table>
    <div class="footer">
      <p>Each app is completely independent with its own database and APIs.</p>
      <p>Click on any app to open it in a new tab! 🌙</p>
    </div>
  </div>
</body>
</html>`);
  });

  app.listen(PORT, () => {
    logger.info(`Master Dashboard running at http://localhost:${PORT}`);
    console.log(`\n╔════════════════════════════════════════════╗`);
    console.log(`║   📖 QURAN LEARNING APPS DASHBOARD 📖    ║`);
    console.log(`╠════════════════════════════════════════════╣`);
    console.log(`║  Dashboard: http://localhost:${PORT}         ║`);
    console.log(`║                                            ║`);
    console.log(`║  Direct App Access:                       ║`);
    
    if (successfulApps.length === 0) {
      console.log(`║  ⚠️  No apps successfully generated!       ║`);
    } else {
      successfulApps.forEach(a => {
        const cfg = configs.find(c => c.appId === a.appId);
        if (cfg) {
          console.log(`║  • ${cfg.appName.padEnd(20)} → http://localhost:${cfg.port} ║`);
        }
      });
    }
    console.log(`╚════════════════════════════════════════════╝\n`);
    
    if (successfulApps.length === 0) {
      console.log(`\n⚠️  WARNING: No apps were successfully generated!`);
      console.log(`   Check the errors above and make sure:`);
      console.log(`   1. Template files exist in template/app-template/`);
      console.log(`   2. Config files are valid JSON`);
      console.log(`   3. Output directory is writable\n`);
    }
  });
}

module.exports = { deploy };