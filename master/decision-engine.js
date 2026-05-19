const logger = require('../logger/logger');

function decideWorkload(resources) {
  logger.info('Running Adaptive Workload Decision Engine...');

  const { cpu, memory } = resources;
  let maxApps = 20;

  // CPU based decision
  if (cpu.cores <= 2) maxApps = Math.min(maxApps, 4);
  else if (cpu.cores <= 4) maxApps = Math.min(maxApps, 8);
  else if (cpu.cores <= 8) maxApps = Math.min(maxApps, 14);
  else maxApps = 20;

  // RAM based decision
  if (memory.freeGB < 1) maxApps = Math.min(maxApps, 2);
  else if (memory.freeGB < 2) maxApps = Math.min(maxApps, 5);
  else if (memory.freeGB < 4) maxApps = Math.min(maxApps, 10);

  // Minimum guarantee
  maxApps = Math.max(maxApps, 2);

  logger.info(`Decision Engine Result: Will generate ${maxApps} applications`);
  logger.info(`Reason: ${cpu.cores} CPU cores, ${memory.freeGB}GB free RAM`);

  return maxApps;
}

module.exports = { decideWorkload };