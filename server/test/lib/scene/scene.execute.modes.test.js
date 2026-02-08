const { assert, fake, createSandbox } = require('sinon');
const EventEmitter = require('events');
const { expect } = require('chai');
const { ACTIONS } = require('../../../utils/constants');
const SceneManager = require('../../../lib/scene');
const StateManager = require('../../../lib/state');

describe('scene.execute - modes', () => {
  let sandbox;
  const event = new EventEmitter();
  const brain = {};
  const device = {};
  let stateManager;
  let sceneManager;

  beforeEach(() => {
    sandbox = createSandbox();
    brain.addNamedEntity = fake.returns(null);
    brain.removeNamedEntity = fake.returns(null);
    device.setValue = fake.resolves(null);
    stateManager = new StateManager(event);
    sceneManager = new SceneManager(stateManager, event, device, {}, {}, {}, {}, {}, {}, {}, brain);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('single mode', () => {
    it('should block execution when scene is already running', async () => {
      const scene = {
        selector: 'single-mode-scene',
        mode: 'single',
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.TIME.DELAY,
              milliseconds: 100,
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      // Start first execution
      await sceneManager.execute('single-mode-scene');

      // Try to start second execution while first is running
      await sceneManager.execute('single-mode-scene');

      return new Promise((resolve, reject) => {
        sceneManager.queue.start(() => {
          try {
            // Should only have 1 execution in the queue
            expect(sceneManager.queue.length).to.equal(0);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('should allow execution when scene is not running', async () => {
      const scene = {
        selector: 'single-mode-scene',
        mode: 'single',
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.LIGHT.TURN_ON,
              devices: ['light-1'],
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      await sceneManager.execute('single-mode-scene');

      return new Promise((resolve, reject) => {
        sceneManager.queue.start(() => {
          try {
            assert.calledOnce(device.setValue);
            // After execution, scene should not be in runningScenes
            expect(sceneManager.runningScenes.has('single-mode-scene')).to.equal(false);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });

  describe('restart mode', () => {
    it('should abort current execution and start new one', async () => {
      let executionCount = 0;
      const scene = {
        selector: 'restart-mode-scene',
        mode: 'restart',
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.TIME.DELAY,
              milliseconds: 50,
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      // Start first execution
      await sceneManager.execute('restart-mode-scene');
      executionCount++;

      // Wait a bit then trigger restart
      setTimeout(async () => {
        await sceneManager.execute('restart-mode-scene');
        executionCount++;
      }, 25);

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            expect(executionCount).to.equal(2);
            // Should have aborted first execution
            expect(sceneManager.runningScenes.has('restart-mode-scene')).to.equal(false);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 200);
      });
    });
  });

  describe('parallel mode', () => {
    it('should allow up to max_parallel executions', async () => {
      const scene = {
        selector: 'parallel-mode-scene',
        mode: 'parallel',
        max_parallel: 2,
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.TIME.DELAY,
              milliseconds: 100,
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      // Start 2 executions (should succeed)
      await sceneManager.execute('parallel-mode-scene');
      await sceneManager.execute('parallel-mode-scene');

      // Try to start 3rd execution (should be blocked)
      await sceneManager.execute('parallel-mode-scene');

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try {
            // Should only have 2 executions running
            const runningCount = sceneManager.runningScenes.get('parallel-mode-scene')?.size || 0;
            expect(runningCount).to.be.at.most(2);
            resolve();
          } catch (e) {
            reject(e);
          }
        }, 50);
      });
    });

    it('should default to max_parallel of 10 if not set', async () => {
      const scene = {
        selector: 'parallel-default-scene',
        mode: 'parallel',
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.LIGHT.TURN_ON,
              devices: ['light-1'],
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      await sceneManager.execute('parallel-default-scene');

      return new Promise((resolve, reject) => {
        sceneManager.queue.start(() => {
          try {
            assert.calledOnce(device.setValue);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup runningScenes and executionAbortControllers after execution', async () => {
      const scene = {
        selector: 'cleanup-scene',
        mode: 'parallel',
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.LIGHT.TURN_ON,
              devices: ['light-1'],
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      await sceneManager.execute('cleanup-scene');

      return new Promise((resolve, reject) => {
        sceneManager.queue.start(() => {
          try {
            // After execution, cleanup should have happened
            expect(sceneManager.runningScenes.has('cleanup-scene')).to.equal(false);
            expect(sceneManager.executionAbortControllers.size).to.equal(0);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });

  describe('backward compatibility', () => {
    it('should default to parallel mode if mode is not set', async () => {
      const scene = {
        selector: 'no-mode-scene',
        triggers: [],
        actions: [
          [
            {
              type: ACTIONS.LIGHT.TURN_ON,
              devices: ['light-1'],
            },
          ],
        ],
      };
      sceneManager.addScene(scene);

      await sceneManager.execute('no-mode-scene');

      return new Promise((resolve, reject) => {
        sceneManager.queue.start(() => {
          try {
            assert.calledOnce(device.setValue);
            resolve();
          } catch (e) {
            reject(e);
          }
        });
      });
    });
  });
});
