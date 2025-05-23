import Select from 'react-select';
import { Component } from 'preact';
import { connect } from 'unistore/preact';
import { Localizer, Text } from 'preact-i18n';
import get from 'get-value';

import withIntlAsProp from '../../../../utils/withIntlAsProp';
import TextWithVariablesInjected from '../../../../components/scene/TextWithVariablesInjected';

class AskAI extends Component {
  getOptions = async () => {
    try {
      const users = await this.props.httpClient.get('/api/v1/user');
      const userOptions = [];
      users.forEach(user => {
        userOptions.push({
          label: user.firstname,
          value: user.selector
        });
      });

      const cameras = await this.props.httpClient.get('/api/v1/camera');
      const cameraOptions = cameras.map(camera => ({
        label: camera.name,
        value: camera.selector
      }));

      await this.setState({ userOptions, cameraOptions });
      this.refreshSelectedOptions(this.props);
      return userOptions;
    } catch (e) {
      console.error(e);
    }
  };
  updateText = text => {
    this.props.updateActionProperty(this.props.path, 'text', text);
  };
  handleUserChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.path, 'user', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'user', null);
    }
  };
  handleCameraChange = selectedOption => {
    if (selectedOption && selectedOption.value) {
      this.props.updateActionProperty(this.props.path, 'camera', selectedOption.value);
    } else {
      this.props.updateActionProperty(this.props.path, 'camera', undefined);
    }
  };

  refreshSelectedOptions = nextProps => {
    let selectedUserOption = '';
    if (nextProps.action.user && this.state.userOptions) {
      const userOption = this.state.userOptions.find(option => option.value === nextProps.action.user);

      if (userOption) {
        selectedUserOption = userOption;
      }
    }
    let selectedCameraOption = '';
    if (nextProps.action.camera && this.state.cameraOptions) {
      const cameraOption = this.state.cameraOptions.find(option => option.value === nextProps.action.camera);

      if (cameraOption) {
        selectedCameraOption = cameraOption;
      }
    }
    this.setState({ selectedUserOption, selectedCameraOption });
  };
  setVariables = () => {
    const ASK_AI_ANSWER_VARIABLE = get(this.props.intl.dictionary, 'editScene.variables.askAi.answer');
    this.props.setVariables(this.props.path, [
      {
        name: 'answer',
        type: 'askAi',
        ready: true,
        label: ASK_AI_ANSWER_VARIABLE,
        data: {}
      }
    ]);
  };
  constructor(props) {
    super(props);
    this.props = props;
    this.state = {
      selectedOption: ''
    };
  }
  componentDidMount() {
    this.getOptions();
    this.setVariables();
  }
  componentWillReceiveProps(nextProps) {
    this.refreshSelectedOptions(nextProps);
  }
  render(props, { selectedUserOption, userOptions, selectedCameraOption, cameraOptions }) {
    return (
      <div>
        <p>
          <Text id="editScene.actionsCard.askAi.description" />
        </p>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.askAi.textLabel" />{' '}
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <div class="mb-1 small">
            <Text id="editScene.actionsCard.askAi.explanationText" />
          </div>
          <div className="tags-input">
            <Localizer>
              <TextWithVariablesInjected
                text={props.action.text}
                path={props.path}
                triggersVariables={props.triggersVariables}
                actionsGroupsBefore={props.actionsGroupsBefore}
                variables={props.variables}
                updateText={this.updateText}
                placeholder={<Text id="editScene.actionsCard.askAi.textLabel" />}
              />
            </Localizer>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">
            <Text id="editScene.actionsCard.askAi.userLabel" />
            <span class="form-required">
              <Text id="global.requiredField" />
            </span>
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={userOptions}
            value={selectedUserOption}
            onChange={this.handleUserChange}
          />
        </div>
        <div class="form-group">
          <label className="form-label">
            <Text id="editScene.actionsCard.askAi.cameraLabel" />
          </label>
          <Select
            styles={{
              // Fixes the overlapping problem of the component
              menu: provided => ({ ...provided, zIndex: 2 })
            }}
            options={cameraOptions}
            value={selectedCameraOption}
            onChange={this.handleCameraChange}
            isClearable
          />
        </div>
      </div>
    );
  }
}

export default connect('httpClient', {})(withIntlAsProp(AskAI));
