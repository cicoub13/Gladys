import { Component } from 'preact';
import { Text } from 'preact-i18n';
import { connect } from 'unistore/preact';

class SettingsSystemReboot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirm: false,
      rebooting: false
    };
  }

  showConfirm = e => {
    e.preventDefault();
    this.setState({ confirm: true });
  };

  cancel = e => {
    e.preventDefault();
    this.setState({ confirm: false });
  };

  reboot = async e => {
    e.preventDefault();
    this.setState({ confirm: false, rebooting: true });
    try {
      await this.props.httpClient.post('/api/v1/system/reboot');
    } catch (e) {
      console.error(e);
    }
  };

  render({ systemInfos }, { confirm, rebooting }) {
    if (!systemInfos || !systemInfos.is_docker) {
      return null;
    }

    return (
      <div class="card">
        <h4 class="card-header">
          <Text id="systemSettings.rebootHostTitle" />
        </h4>
        <div class="card-body">
          <p>
            <Text id="systemSettings.rebootHostDescription" />
          </p>
          {rebooting && (
            <div class="alert alert-warning">
              <Text id="systemSettings.rebootHostTriggered" />
            </div>
          )}
          {!rebooting && !confirm && (
            <button onClick={this.showConfirm} class="btn btn-danger">
              <Text id="systemSettings.rebootHostButton" />
            </button>
          )}
          {!rebooting && confirm && (
            <div class="d-flex flex-row">
              <button onClick={this.reboot} class="btn btn-danger mr-2">
                <Text id="systemSettings.rebootHostConfirm" />
              </button>
              <button onClick={this.cancel} class="btn btn-secondary">
                <Text id="global.cancel" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect('httpClient', null)(SettingsSystemReboot);
