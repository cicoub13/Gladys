import { Text } from 'preact-i18n';
import cx from 'classnames';

import ScrollToTopLink from '../../components/router/ScrollToTopLink';
import style from './style.css';

// "Update all" banner of the inventory: one click for every installed
// community integration with a newer version in the store. The updates run
// one after the other, so the banner turns into a progress bar naming the one
// in progress, and ends on a summary listing the failures, if any.
const BulkUpdateResult = ({ total, failures }) =>
  failures.length > 0 ? (
    <div class="alert alert-warning">
      <i class="fe fe-alert-triangle mr-2" />
      <Text id="integration.root.updateAll.partial" fields={{ failed: failures.length, total }} />
      <ul class="mb-0 mt-2">
        {failures.map(failure => (
          <li key={failure.selector}>
            <ScrollToTopLink href={`/dashboard/integration/device/external/${failure.selector}/logs`}>
              {failure.name}
            </ScrollToTopLink>
          </li>
        ))}
      </ul>
    </div>
  ) : (
    <div class="alert alert-success">
      <i class="fe fe-check-circle mr-2" />
      <Text id="integration.root.updateAll.success" fields={{ count: total }} plural={total} />
    </div>
  );

const UpdateAllIntegrationsBar = ({ integrationsToUpdate = 0, bulkUpdate, bulkUpdateResult, onUpdateAll }) => {
  if (bulkUpdate) {
    const { current, total, name } = bulkUpdate;
    // the bar fills as integrations complete: the one in progress is not done
    const percent = Math.round(((current - 1) / total) * 100);
    return (
      <div class={cx('card', style.updateAllBar)}>
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <i class={cx('fe fe-refresh-cw text-primary mr-2', style.updateAllSpinner)} />
            <strong>
              <Text id="integration.root.updateAll.progress" fields={{ name, current, total }} />
            </strong>
          </div>
          <div class="progress progress-sm">
            <div class="progress-bar bg-primary" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </div>
    );
  }

  // the summary of the last run stays above the banner: a failed update keeps
  // its "update available" flag, so the banner comes back for it
  return (
    <div>
      {bulkUpdateResult && <BulkUpdateResult {...bulkUpdateResult} />}
      {integrationsToUpdate > 0 && (
        <div class={cx('card', style.updateAllBar)}>
          <div class={cx('card-body', style.updateAllBody)}>
            <span class={style.updateAllIcon}>
              <i class="fe fe-arrow-up-circle" />
            </span>
            <div class={style.updateAllText}>
              <div class="font-weight-bold">
                <Text
                  id="integration.root.updateAll.title"
                  fields={{ count: integrationsToUpdate }}
                  plural={integrationsToUpdate}
                />
              </div>
              <div class="text-muted small">
                <Text id="integration.root.updateAll.description" />
              </div>
            </div>
            <button type="button" class={cx('btn btn-primary', style.updateAllButton)} onClick={onUpdateAll}>
              <i class="fe fe-download-cloud mr-2" />
              <Text id="integration.root.updateAll.button" />
              <span class={cx('badge ml-2', style.updateAllCount)}>{integrationsToUpdate}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateAllIntegrationsBar;
