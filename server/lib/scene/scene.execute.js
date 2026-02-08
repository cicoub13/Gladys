const executeActionsFactory = require('./scene.executeActions');
const actionsFunc = require('./scene.actions');
const logger = require('../../utils/logger');
const { AbortScene } = require('../../utils/coreErrors');

const { executeActions } = executeActionsFactory(actionsFunc);

/**
 * @description Execute a scene by its selector.
 * @param {string} sceneSelector - The selector of the scene to execute.
 * @param {object} [scope] - The scope of the event triggering the scene.
 * @returns {Promise} Resolve when scene was executed.
 * @example
 * sceneManager.execute('test');
 */
function execute(sceneSelector, scope = {}) {
  try {
    if (!this.scenes[sceneSelector]) {
      throw new Error(`Scene with selector ${sceneSelector} not found.`);
    }

    const scene = this.scenes[sceneSelector];
    const mode = scene.mode || 'parallel'; // Fallback for safety
    const maxParallel = scene.max_parallel || 10;

    // Handle single mode: don't execute if already running
    if (mode === 'single') {
      if (this.runningScenes.has(sceneSelector)) {
        logger.warn(`Scene "${sceneSelector}" is already running (single mode)`);
        return null;
      }
    }

    // Handle restart mode: abort current execution and restart
    if (mode === 'restart') {
      if (this.runningScenes.has(sceneSelector)) {
        const executionIds = this.runningScenes.get(sceneSelector);
        executionIds.forEach((execId) => {
          const abortFn = this.executionAbortControllers.get(execId);
          if (abortFn) {
            abortFn();
          }
        });
        this.runningScenes.delete(sceneSelector);
      }
    }

    // Handle parallel mode: limit concurrent executions
    if (mode === 'parallel') {
      const runningCount = this.runningScenes.get(sceneSelector)?.size || 0;
      if (runningCount >= maxParallel) {
        logger.warn(`Scene "${sceneSelector}" max parallel executions reached (${runningCount})`);
        return null;
      }
    }

    scope.alreadyExecutedScenes = scope.alreadyExecutedScenes || new Set();
    scope.alreadyExecutedScenes.add(sceneSelector);

    // Generate unique execution ID
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const executionId = `${sceneSelector}-${timestamp}-${random}`;

    // Track execution
    if (!this.runningScenes.has(sceneSelector)) {
      this.runningScenes.set(sceneSelector, new Set());
    }
    this.runningScenes.get(sceneSelector).add(executionId);

    // Create abort controller
    let aborted = false;
    const abortFn = () => {
      aborted = true;
      logger.info(`Aborting scene execution: ${executionId}`);
    };
    this.executionAbortControllers.set(executionId, abortFn);

    this.queue.push(async () => {
      try {
        if (aborted) {
          throw new AbortScene('SCENE_RESTARTED');
        }
        await executeActions(this, scene.actions, scope, null, {
          abortSignal: () => aborted,
        });
      } catch (e) {
        if (e instanceof AbortScene) {
          logger.debug(e);
        } else {
          logger.error(e);
        }
      } finally {
        // Cleanup
        this.runningScenes.get(sceneSelector)?.delete(executionId);
        if (this.runningScenes.get(sceneSelector)?.size === 0) {
          this.runningScenes.delete(sceneSelector);
        }
        this.executionAbortControllers.delete(executionId);
      }
    });
  } catch (e) {
    logger.error(e);
  }
  return null;
}

module.exports = {
  execute,
};
