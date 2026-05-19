const si = require('systeminformation');
const logger = require('../logger/logger');

async function analyzeResources() {
  logger.info('Starting system resource analysis...');

  const cpu = await si.cpu();
  const mem = await si.mem();
  const graphics = await si.graphics();
  const osInfo = await si.osInfo();

  const cpuCores = cpu.cores || 2;
  const totalRAM = Math.round(mem.total / (1024 * 1024 * 1024));
  const freeRAM = Math.round(mem.free / (1024 * 1024 * 1024));
  const hasGPU = graphics.controllers && graphics.controllers.length > 0;

  const resources = {
    cpu: {
      cores: cpuCores,
      manufacturer: cpu.manufacturer,
      brand: cpu.brand
    },
    memory: {
      totalGB: totalRAM,
      freeGB: freeRAM,
      usedGB: totalRAM - freeRAM
    },
    gpu: {
      available: hasGPU,
      controllers: hasGPU ? graphics.controllers.map(g => g.model) : []
    },
    os: {
      platform: osInfo.platform,
      distro: osInfo.distro
    }
  };

  logger.info(`CPU: ${cpu.manufacturer} ${cpu.brand} — ${cpuCores} cores`);
  logger.info(`RAM: ${freeRAM}GB free of ${totalRAM}GB total`);
  logger.info(`GPU: ${hasGPU ? graphics.controllers[0].model : 'Not detected'}`);

  return resources;
}

module.exports = { analyzeResources };