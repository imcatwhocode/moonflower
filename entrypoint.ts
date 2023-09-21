import cron from 'node-cron';
import backup from './src/backup';
import config from './src/config';

if (config.scheduler.schedule) {
  cron.schedule(config.scheduler.schedule, backup);
} else {
  backup();
}
