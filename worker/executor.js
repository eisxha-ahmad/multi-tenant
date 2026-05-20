const { workerData, parentPort } = require('worker_threads');
const path = require('path');
const fs = require('fs-extra');

const { config, outputDir } = workerData;

async function generateApp() {
  const appDir = path.join(outputDir, config.appId);

  try {
    // Create folder structure
    await fs.ensureDir(path.join(appDir, 'src'));
    await fs.ensureDir(path.join(appDir, 'public'));
    await fs.ensureDir(path.join(appDir, 'data'));

    // Copy Quran database if it exists
    const quranDbSource = path.join(__dirname, '../data/quran.db');
    const quranDbDest = path.join(appDir, 'data/quran.db');
    if (await fs.pathExists(quranDbSource)) {
      await fs.copy(quranDbSource, quranDbDest);
      console.log(`✓ Quran database copied to ${appDir}`);
    } else {
      console.log(`⚠️ Quran database not found at ${quranDbSource}`);
    }

    // Copy Quran JSON data to each app
const quranDataSrc = path.join(__dirname, '../data/quran');
const quranDataDest = path.join(appDir, 'data/quran');
if (await fs.pathExists(quranDataSrc)) {
  await fs.copy(quranDataSrc, quranDataDest);
  console.log(`✓ Quran JSON data copied to ${appDir}`);
}
    // Write config.json
    await fs.writeJSON(path.join(appDir, 'config.json'), config, { spaces: 2 });

    // Write package.json
    await fs.writeJSON(path.join(appDir, 'package.json'), {
      name: config.appId,
      version: '1.0.0',
      description: config.description,
      main: 'src/index.js',
      scripts: { start: 'node src/index.js' },
      dependencies: {
        express: '^4.18.2',
        'sql.js': '^1.8.0'
      }
    }, { spaces: 2 });

    // Copy template files
    const templateSrc = path.join(__dirname, '../template/app-template/src/index.js');
    await fs.copy(templateSrc, path.join(appDir, 'src/index.js'));

    // Copy quran-helper.js if it exists
    const helperSrc = path.join(__dirname, '../template/app-template/src/quran-helper.js');
    const helperDest = path.join(appDir, 'src/quran-helper.js');
    if (await fs.pathExists(helperSrc)) {
      await fs.copy(helperSrc, helperDest);
    }

    // Generate themed HTML
    let html = await fs.readFile(
      path.join(__dirname, '../template/app-template/public/index.html'), 'utf8'
    );

    const isDark = config.theme === 'dark';
    html = html
      .replace(/APP_NAME/g, config.appName)
      .replace(/TENANT_ID/g, config.tenantId)
      .replace(/PRIMARY_COLOR/g, config.primaryColor)
      .replace(/BG_COLOR/g, isDark ? '#1a1a2e' : '#f0f2f5')
      .replace(/TEXT_COLOR/g, isDark ? '#eaeaea' : '#2c3e50')
      .replace(/CARD_COLOR/g, isDark ? '#16213e' : '#ffffff')
      .replace(/INFO_BG/g, isDark ? '#0f3460' : '#f8f9fa')
      .replace(/BORDER_COLOR/g, isDark ? '#2c3e50' : '#dee2e6');

    await fs.writeFile(path.join(appDir, 'public/index.html'), html);

    // Write .env file
    await fs.writeFile(path.join(appDir, '.env'),
      `APP_ID=${config.appId}\nPORT=${config.port}\nENV=${config.environment}\nTENANT=${config.tenantId}\n`
    );

    // Write README
    await fs.writeFile(path.join(appDir, 'README.md'),
      `# ${config.appName}\n\n${config.description}\n\n## Run\n\`\`\`\nnpm install\nnpm start\n\`\`\`\n\nRuns on: http://localhost:${config.port}\n`
    );

    parentPort.postMessage({ success: true, appId: config.appId, appDir });

  } catch (err) {
    parentPort.postMessage({ success: false, appId: config.appId, error: err.message });
  }
}

generateApp();