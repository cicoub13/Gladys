import { Text } from 'preact-i18n';
import cx from 'classnames';

import { RequestStatus } from '../../utils/consts';
import style from './style.css';

// In-place update of an installed community integration, right from its
// catalog card: the same action as the "Update" button of its own page,
// without leaving the inventory. The row shows the jump it is about to make
// ("v1.2.0 → v1.3.0") and keeps its outcome on the card once it is done.
const IntegrationUpdateButton = ({ integration, status, onUpdate }) => {
  if (!integration.selector) {
    return null;
  }
  const updating = status === RequestStatus.Getting;
  const failed = status === RequestStatus.Error;

  // the installed list is reloaded after the update: the flag is gone, the
  // card now says so instead of losing its button without a word
  if (status === RequestStatus.Success && !integration.updateAvailable) {
    return (
      <div class={cx(style.integrationUpdate, 'text-success small')}>
        <i class="fe fe-check-circle mr-1" />
        {integration.version ? (
          <Text id="integration.root.updateCard.updated" fields={{ version: integration.version }} />
        ) : (
          <Text id="integration.root.updateCard.upToDate" />
        )}
      </div>
    );
  }

  if (!integration.updateAvailable && !updating && !failed) {
    return null;
  }

  const onClick = e => {
    // the list item is a row of links: the click must not open the integration
    e.preventDefault();
    e.stopPropagation();
    onUpdate(integration.selector);
  };

  return (
    <div class={style.integrationUpdate}>
      <div class={style.integrationUpdateRow}>
        {integration.version && integration.latestVersion && (
          <span class={cx('small text-muted', style.integrationUpdateVersions)}>
            v{integration.version} <i class="fe fe-arrow-right" />{' '}
            <strong class="text-body">v{integration.latestVersion}</strong>
          </span>
        )}
        <button
          type="button"
          class={cx('btn btn-sm', style.integrationUpdateButton, failed ? 'btn-outline-danger' : 'btn-primary', {
            'btn-loading': updating
          })}
          onClick={onClick}
          disabled={updating}
        >
          <i class={cx('fe mr-1', failed ? 'fe-rotate-cw' : 'fe-arrow-up-circle')} />
          <Text id={failed ? 'integration.root.updateCard.retry' : 'integration.root.updateCard.button'} />
        </button>
      </div>
      {failed && (
        <div class="text-danger small mt-1">
          <Text id="integration.root.updateCard.error" />
        </div>
      )}
    </div>
  );
};

export default IntegrationUpdateButton;
