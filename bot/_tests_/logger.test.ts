import {logger} from '../logger'
logger.level = process.env.LOG_LEVEL

test('testLogger', () => {
  logger.info("test")
})