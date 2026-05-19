const logger = require('../logger/logger');

class JobQueue {
  constructor() {
    this.queue = [];
    this.completed = [];
    this.failed = [];
    this.retryLimit = 3;
  }

  addJob(job) {
    this.queue.push({ ...job, retries: 0, status: 'pending' });
    logger.info(`Job added to queue: ${job.appName}`);
  }

  getNext() {
    return this.queue.find(j => j.status === 'pending') || null;
  }

  markRunning(appName) {
    const job = this.queue.find(j => j.appName === appName);
    if (job) job.status = 'running';
  }

  markComplete(appName) {
    const job = this.queue.find(j => j.appName === appName);
    if (job) {
      job.status = 'completed';
      this.completed.push(job);
      logger.info(`Job completed: ${appName}`);
    }
  }

  markFailed(appName) {
    const job = this.queue.find(j => j.appName === appName);
    if (job) {
      if (job.retries < this.retryLimit) {
        job.retries++;
        job.status = 'pending';
        logger.warn(`Job failed, retrying (${job.retries}/${this.retryLimit}): ${appName}`);
      } else {
        job.status = 'failed';
        this.failed.push(job);
        logger.error(`Job permanently failed: ${appName}`);
      }
    }
  }

  getSummary() {
    return {
      total: this.queue.length,
      completed: this.completed.length,
      failed: this.failed.length,
      pending: this.queue.filter(j => j.status === 'pending').length
    };
  }
}

module.exports = JobQueue;