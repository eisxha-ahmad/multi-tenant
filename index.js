const path = require('path');
const fs = require('fs-extra');
const { execSync, spawn } = require('child_process');
const { analyzeResources } = require('./analyzer/resource-analyzer');
const { decideWorkload } = require('./master/decision-engine');
const { coordinate } = require('./master/coordinator');
const { deploy } = require('./deployment/server');
const logger = require('./logger/logger');

// Store running processes
const runningApps = [];

async function main() {
  logger.info('========================================');
  logger.info('  ADAGDS — System Starting Up');
  logger.info('========================================');

  // Step 1: Analyze Resources
  const resources = await analyzeResources();

  // Step 2: Decide how many apps
  const maxApps = decideWorkload(resources);

  // Step 3: Load configs
  const configDir = path.join(__dirname, 'configs');
  const configFiles = (await fs.readdir(configDir))
    .filter(f => f.endsWith('.json'))
    .slice(0, maxApps);

  const configs = await Promise.all(
    configFiles.map(f => fs.readJSON(path.join(configDir, f)))
  );

  logger.info(`Loaded ${configs.length} configurations`);

  // Step 4: Generate apps
  const outputDir = path.join(__dirname, 'output');
  await fs.ensureDir(outputDir);

  logger.info('Starting parallel application generation...');
  const results = await coordinate(configs, outputDir);

  // Step 5: Install dependencies and launch each app
  const successfulApps = results.filter(r => r.success);
  logger.info(`Setting up ${successfulApps.length} applications...`);

  for (const app of successfulApps) {
    const cfg = configs.find(c => c.appId === app.appId);
    const appDir = path.join(outputDir, cfg.appId);

    try {
      // Check if node_modules exists, if not install
      const nodeModulesPath = path.join(appDir, 'node_modules');
      if (!await fs.pathExists(nodeModulesPath)) {
        logger.info(`Installing dependencies for ${cfg.appName}...`);
        execSync('npm install', { 
          cwd: appDir, 
          stdio: 'pipe',
          timeout: 60000
        });
      }
      
      // Launch the app
      logger.info(`Starting ${cfg.appName} on port ${cfg.port}...`);
      
      const proc = spawn('node', ['src/index.js'], {
        cwd: appDir,
        detached: false,
        stdio: 'pipe'
      });
      
      proc.stdout.on('data', (data) => {
        console.log(`[${cfg.appName}] ${data.toString().trim()}`);
      });
      
      proc.stderr.on('data', (data) => {
        console.error(`[${cfg.appName}] ${data.toString().trim()}`);
      });
      
      runningApps.push({ 
        appId: cfg.appId, 
        name: cfg.appName,
        process: proc, 
        port: cfg.port 
      });
      
      // Wait for app to start
      await new Promise(resolve => setTimeout(resolve, 1500));
      
    } catch (err) {
      logger.error(`Failed to setup ${cfg.appId}: ${err.message}`);
    }
  }

  logger.info(`✓ Successfully started ${runningApps.length} applications`);
  
  // Print all running apps
  console.log('\n📊 RUNNING APPLICATIONS:');
  runningApps.forEach(app => {
    console.log(`   • ${app.name} → http://localhost:${app.port} (or via dashboard)`);
  });
  
  // Step 6: Deploy master dashboard
  await deploy(results, configs);
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all applications...');
  runningApps.forEach(app => {
    console.log(`   Stopping ${app.name}`);
    app.process.kill();
  });
  process.exit(0);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});