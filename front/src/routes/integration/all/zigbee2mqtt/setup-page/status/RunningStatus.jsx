import { Fragment } from 'preact';
import { Text } from 'preact-i18n';

import { RequestStatus } from '../../../../../../utils/consts';

import ContainerStatus from '../components/ContainerStatus';
import ContainerLinkStatus from '../components/ContainerLinkStatus';

const RunningStatus = ({ zigbee2mqttStatus = {}, setupZigee2mqttStatus }) => {
  const loading = setupZigee2mqttStatus === RequestStatus.Getting;

  return (
    <Fragment>
      <div class="form-label">
        <Text id="integration.zigbee2mqtt.setup.serviceStatus" />
      </div>
      <div class="w-100 mx-auto mt-3">
        <div class="d-flex flex-column flex-sm-row justify-content-center">
          <ContainerStatus
            exists
            running
            imageSrc="/assets/icons/favicon-96x96.png"
            title={<Text id="integration.zigbee2mqtt.setup.gladys" />}
          />
          <ContainerLinkStatus loading={loading} linked={zigbee2mqttStatus.gladysConnected} />
          <ContainerStatus
            loading={loading}
            exists={zigbee2mqttStatus.mqttExist}
            running={zigbee2mqttStatus.mqttRunning}
            imageSrc="/assets/integrations/logos/logo_mqtt.png"
            title={<Text id="integration.zigbee2mqtt.setup.mqtt" />}
          />
          <ContainerLinkStatus loading={loading} linked={zigbee2mqttStatus.zigbee2mqttConnected} />
          <ContainerStatus
            loading={loading}
            exists={zigbee2mqttStatus.zigbee2mqttExist}
            running={zigbee2mqttStatus.zigbee2mqttRunning}
            imageSrc="/assets/integrations/logos/logo_zigbee2mqtt.png"
            title={<Text id="integration.zigbee2mqtt.setup.zigbee2Mqtt" />}
          />
        </div>
      </div>
      {zigbee2mqttStatus.needEzspFirmwareUpdate && (
      <div class="alert alert-warning mt-4">
        <h4 class="alert-title">Votre dongle Zigbee nécessite une mise à jour</h4>
        <div class="text-secondary">
          Le driver ezsp n'est plus maintenu. Nous pouvons mettre à jour le driver utilisé par Gladys mais
          votre dongle doit être mis à jour en version 7.4.x ou supérieur.
          Pour effectuer cette mise à jour, veuillez suivre la documentation <a href="">ici</a>.
        </div>
      </div>
    )}
    </Fragment>
    
  );
};

export default RunningStatus;
