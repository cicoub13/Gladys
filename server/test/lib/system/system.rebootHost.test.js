const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.rebootHost', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should throw PlatformNotCompatible when not running in Docker', async () => {
    system.dockerode = null;

    try {
      await system.rebootHost();
      assert.fail('should have thrown');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
      expect(e).to.have.property('message', 'SYSTEM_NOT_RUNNING_DOCKER');
      assert.notCalled(sequelize.close);
    }
  });

  it('should pull alpine, create container with correct options, close DB, and start container', async () => {
    await system.rebootHost();

    assert.calledOnce(system.dockerode.createContainer);
    const createArgs = system.dockerode.createContainer.getCall(0).args[0];

    expect(createArgs.Image).to.equal('alpine:latest');
    expect(createArgs.Cmd).to.deep.equal(['nsenter', '-t', '1', '-m', '-u', '-n', '-i', '--', '/sbin/reboot']);
    expect(createArgs.HostConfig.PidMode).to.equal('host');
    expect(createArgs.HostConfig.Privileged).to.equal(true);
    expect(createArgs.HostConfig.AutoRemove).to.equal(true);

    assert.calledOnce(sequelize.close);
  });

  it('should still start container even if sequelize.close() rejects', async () => {
    sequelize.close = fake.rejects(new Error('DB already closed'));

    await system.rebootHost();

    assert.calledOnce(system.dockerode.createContainer);
    assert.calledOnce(sequelize.close);
  });
});
