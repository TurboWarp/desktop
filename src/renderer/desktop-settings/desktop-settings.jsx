import {ipcRenderer} from 'electron';
import React from 'react';
import ReactDOM from 'react-dom';
import {getTranslation} from '../translations';
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
        <h1>{getTranslation('desktop-settings')}</h1>
        <div>
          <label>
            <input
              type="checkbox"
              onChange={this.handleChangeUpdateCheckerEnabled}
              disabled={!this.state.canUpdateCheckerBeEnabled}
              checked={this.state.isUpdateCheckerEnabled}
            />
            {' '}
            {getTranslation('settings.enable-update-checker')}
          </label>
          {' '}
          <a
            onClick={this.handleOpenPrivacyPolicy}
            href="#"
          >
            {getTranslation('settings.privacy-link')}
          </a>
        </div>
        {this.state.canUpdateCheckerBeEnabled ? (
          this.state.isUpdateCheckerEnabled ? (
            null
          ) : (
            <p>{getTranslation('settings.disabled-update-checker')}</p>
          )
        ) : (
          <p>{getTranslation('settings.build-time-disabled-update-checker')}</p>
        )}
      </main>
    );
  }
}

ReactDOM.render(<DesktopSettings />, require('../app-target'));
