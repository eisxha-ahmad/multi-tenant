const { Worker } = require('worker_threads');
const path = require('path');
const logger = require('../logger/logger');
const JobQueue = require('./job-queue');

async function runWorker(job, outputDir) {
  return new Promise((resolve) => {
    const worker = new Worker(path.join(__dirname, '../worker/executor.js'), {
      workerData: { config: job, outputDir }
    });

    worker.on('message', (msg) => resolve(msg));
    worker.on('error', (err) => resolve({ success: false, appId: job.appId, error: err.message }));
    worker.on('exit', (code) => {
      if (code !== 0) resolve({ success: false, appId: job.appId, error: `Exit code ${code}` });
    });
  });
}

async function coordinate(configs, outputDir) {
  const queue = new JobQueue();
  const MAX_PARALLEL = 3;

  configs.forEach(cfg => queue.addJob(cfg));
  logger.info(`Total jobs queued: ${configs.length}`);

  const allJobs = [...configs];
  const results = [];

  // Process in batches of MAX_PARALLEL
  for (let i = 0; i < allJobs.length; i += MAX_PARALLEL) {
    const batch = allJobs.slice(i, i + MAX_PARALLEL);
    logger.info(`Running batch: ${batch.map(j => j.appId).join(', ')}`);

    const batchResults = await Promise.all(
      batch.map(async (job) => {
        queue.markRunning(job.appId);
        const startTime = Date.now();
        const result = await runWorker(job, outputDir);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (result.success) {
          queue.markComplete(job.appId);
          logger.info(`✔ ${job.appId} generated in ${duration}s`);
        } else {
          queue.markFailed(job.appId);
          logger.error(`✘ ${job.appId} failed: ${result.error}`);
        }
        return { ...result, duration };
      })
    );

    results.push(...batchResults);
  }

  const summary = queue.getSummary();
  logger.info(`Build Summary — Total: ${summary.total} | Completed: ${summary.completed} | Failed: ${summary.failed}`);

  return results;
}

module.exports = { coordinate };