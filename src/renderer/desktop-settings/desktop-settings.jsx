import {ipcRenderer} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';

import styles from './desktop-settings.css';

class DesktopSettings extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      canUpdateCheckerBeEnabled: ipcRenderer.sendSync('update-checker/can-be-enabled'),
      isUpdateCheckerEnabled: ipcRenderer.sendSync('update-checker/get-is-enabled'),
    };
    this.handleChangeUpdateCheckerEnabled = this.handleChangeUpdateCheckerEnabled.bind(this);
    this.handleOpenPrivacyPolicy = this.handleOpenPrivacyPolicy.bind(this);
  }
  handleChangeUpdateCheckerEnabled (e) {
    const enabled = e.target.checked;
    ipcRenderer.invoke('update-checker/set-is-enabled', enabled);
    this.setState({
      isUpdateCheckerEnabled: enabled
    });
  }
  handleOpenPrivacyPolicy (e) {
    e.preventDefault();
    ipcRenderer.send('open-privacy-policy');
  }
  render () {
    return (
      <main>
        <h1>Desktop Settings</h1>
        <div>
          <label>
            <input
              type="checkbox"
              onChange={this.handleChangeUpdateCheckerEnabled}
              disabled={!this.state.canUpdateCheckerBeEnabled}
              checked={this.state.isUpdateCheckerEnabled}
            />
            {' Enable update checker'}
          </label>
          {' '}
          <a
            onClick={this.handleOpenPrivacyPolicy}
            href="#"
          >{'(privacy)'}</a>
        </div>
        {this.state.canUpdateCheckerBeEnabled ? (
          this.state.isUpdateCheckerEnabled ? (
            null
          ) : (
            <p>{'Disabling the update checker is not recommended.'}</p>
          )
        ) : (
          <p>{'The update checker is not enabled in this build. Updates are probably handled by the store you installed the app from.'}</p>
        )}
      </main>
    );
  }
}

ReactDOM.render(<DesktopSettings />, require('../app-target'));
