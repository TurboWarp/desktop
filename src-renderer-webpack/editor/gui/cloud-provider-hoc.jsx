import React from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';

const CHANNEL_NAME = 'twd:cloud-provider:v1';

class CloudProvider {
  /**
   * @param {VM} vm
   */
  constructor (vm) {
    this.vm = vm;
    this._handleMessage = this._handleMessage.bind(this);
    this._channel = new BroadcastChannel(CHANNEL_NAME);
    this._channel.addEventListener('message', this._handleMessage);
  }

  _handleMessage (e) {
    const data = e.data;
    if (typeof data !== 'object' || !data) {
      return;
    }

    const {name, value} = data;
    if (typeof name !== 'string' || (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean')) {
      return;
    }

    this.vm.postIOData('cloud', {
      varUpdate: {
        name,
        value
      }
    });
  }

  /**
   * Called by VM
   */
  createVariable (name, value) {
    // ignore
  }

  /**
   * Called by VM
   */
  updateVariable (name, value) {
    if (this._channel) {
      this._channel.postMessage({
        name,
        value
      });
    }
  }

  /**
   * Called by VM
   */
  renameVariable (name, value) {
    // ignore
  }

  /**
   * Called by VM
   */
  deleteVariable (name, value) {
    // ignore
  }

  /**
   * Called by VM
   */
  requestCloseConnection () {
    if (this._channel) {
      this._channel.removeEventListener('message', this._handleMessage);
      this._channel = null;
    }
  }
}

const CloudProviderHOC = function (WrappedComponent) {
  class CloudProviderComponent extends React.Component {
    componentDidMount () {
      if (this.props.hasCloudData) {
        this.connect();
      }
    }

    componentDidUpdate (prevProps) {
      if (!prevProps.hasCloudData && this.props.hasCloudData) {
        this.connect();
      } else if (prevProps.hasCloudData && !this.props.hasCloudData) {
        this.disconnect();
      }
    }

    componentWillUnmount () {
      this.disconnect();
    }

    connect () {
      this.disconnect();
      this.cloudProvider = new CloudProvider(this.props.vm);
      this.props.vm.setCloudProvider(this.cloudProvider);
    }

    disconnect () {
      if (this.cloudProvider) {
        this.props.vm.setCloudProvider(null);
        this.cloudProvider.requestCloseConnection();
        this.cloudProvider = null;
      }
    }

    render() {
      const {
        hasCloudData,
        vm,
        ...props
      } = this.props;
      return (
        <WrappedComponent
          {...props}
        />
      );
    }
  }

  CloudProviderComponent.propTypes = {
    hasCloudData: PropTypes.bool.isRequired,
    vm: PropTypes.shape({
      setCloudProvider: PropTypes.func.isRequired,
    }).isRequired,
  };

  const mapStateToProps = state => ({
    hasCloudData: state.scratchGui.tw.hasCloudVariables,
    vm: state.scratchGui.vm,
  });

  const mapDispatchToProps = dispatch => ({

  });

  return connect(
    mapStateToProps,
    mapDispatchToProps
  )(CloudProviderComponent);
};

export default CloudProviderHOC;
