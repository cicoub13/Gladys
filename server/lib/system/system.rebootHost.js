const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Reboot the host machine by spawning an Alpine container with nsenter.
 * @example
 * await rebootHost();
 */
async function rebootHost() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const alpineImage = 'alpine:latest';
  logger.info('Pulling alpine image for host reboot...');
  await this.pull(alpineImage);

  const container = await this.dockerode.createContainer({
    Image: alpineImage,
    name: `gladys-reboot-${Date.now()}`,
    Cmd: ['nsenter', '-t', '1', '-m', '-u', '-n', '-i', '--', '/sbin/reboot'],
    HostConfig: {
      AutoRemove: true,
      Privileged: true,
      PidMode: 'host',
    },
  });

  // Gracefully close DB before reboot
  try {
    await this.sequelize.close();
  } catch (e) {
    logger.warn(e);
  }

  await container.start();
}

module.exports = {
  rebootHost,
};
