import { Component } from 'preact';
import { connect } from 'unistore/preact';
import actions from './actions';
import YeelightPage from '../YeelightPage';
import DevicePage from './DevicePage';
import FoundDevices from './FoundDevices';

@connect(
  'session,user,yeelightDevices,houses,getYeelightDevicesStatus,yeelightNewDevices,getYeelightCreateDeviceStatus,getYeelightNewDevicesStatus',
  actions
)
class YeelightDevicePage extends Component {
  componentWillMount() {
    this.props.getYeelightDevices();
    this.props.getYeelightNewDevices();
    this.props.getHouses();
    this.props.getIntegrationByName('yeelight');
  }
  render(props, {}) {
    return (
      <YeelightPage>
        {props.yeelightDevices && props.yeelightDevices.length ? <DevicePage {...props} /> : <div />}
        <FoundDevices {...props} />
      </YeelightPage>
    );
  }
}

export default YeelightDevicePage;
