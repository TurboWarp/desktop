import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {ipcRenderer} from 'electron';

import AddonCredits from '../addon-credits.jsx';
import addons from '../../addons/addons';
import getTranslations from '../../addons/translations';
import AddonSettingsAPI from '../../addons/settings-api';
import styles from './settings.css';

// TODO: use the same language as scratch interface?
const translations = getTranslations(navigator.language.split('-')[0]);

const nbsp = '\u00a0';

const SettingComponent = ({
  addonId,
  setting,
  onChange,
  value
}) => {
  const settingId = setting.id;
  const settingName = translations[`${addonId}/@settings-name-${settingId}`] || setting.name;
  return (
    <div
      className={styles.setting}
    >
      {setting.type === 'boolean' && (
        <label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(settingId, e.target.checked)}
          />
          {nbsp}
          {settingName}
        </label>
      )}
      {setting.type === 'integer' && (
        <label>
          <input
            type="number"
            min={setting.min}
            max={setting.max}
            step="1"
            value={value}
            onChange={(e) => onChange(settingId, +e.target.value)}
          />
          {nbsp}
          {settingName}
        </label>
      )}
      {setting.type === 'color' && (
        <label>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(settingId, e.target.value)}
          />
          {nbsp}
          {settingName}
        </label>
      )}
      {setting.type === 'select' && (
        <label>
          <select onChange={(e) => onChange(settingId, e.target.value)}>
            {setting.potentialValues.map((value) => {
              const valueId = value.id;
              const valueName = translations[`${addonId}/@settings-select-${settingId}-${valueId}`] || value.name;
              return (
                <option
                  key={valueId}
                  value={valueId}
                >
                  {valueName}
                </option>
              );
            })}
          </select>
          {nbsp}
          {settingName}
        </label>
      )}
    </div>
  );
};
SettingComponent.propTypes = {
  addonId: PropTypes.string,
  setting: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string
  }),
  onChange: PropTypes.func,
  value: PropTypes.any
};

const AddonComponent = ({
  id,
  settings,
  onChange,
  manifest
}) => (
  <div className={styles.addon}>
    <label className={styles.addonTitle}>
      <input
        type="checkbox"
        onChange={(e) => onChange('enabled', e.target.checked)}
        checked={settings.enabled}
      />
      {nbsp}
      {translations[`${id}/@name`] || manifest.name}
    </label>
    <div className={styles.description}>
      {translations[`${id}/@description`] || manifest.description}
    </div>
    {settings.enabled && (
      <div>
        {manifest.credits && (
          <div className={styles.credits}>
            {"Credits: "}
            <AddonCredits manifest={manifest} />
          </div>
        )}
        {manifest.settings && (
          <div className={styles.settingContainer}>
            {manifest.settings.map((setting) => (
              <SettingComponent
                key={setting.id}
                addonId={id}
                setting={setting}
                onChange={onChange}
                value={settings[setting.id]}
              />
            ))}
          </div>
        )}
      </div>
    )}
  </div>
);

AddonComponent.propTypes = {
  id: PropTypes.string,
  settings: PropTypes.object,
  onChange: PropTypes.func,
  manifest: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    settings: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string
    }))
  })
};

const DirtyComponent = (props) => (
  <div className={styles.dirty}>
    {"Some settings need a reload to apply. "}
    <button onClick={props.onReloadNow}>Reload Now</button>
  </div>
);

DirtyComponent.propTypes = {
  onReloadNow: PropTypes.func
};

class AddonSettingsComponent extends React.Component {
  constructor (props) {
    super(props);
    this.state = this.getInitialState();
    this.handleReset = this.handleReset.bind(this);
    this.handleReloadNow = this.handleReloadNow.bind(this);
  }

  getInitialState () {
    const initialState = {
      dirty: false
    };
    for (const {id, manifest} of this.props.addons) {
      const addonState = {
        enabled: AddonSettingsAPI.getEnabled(id, manifest)
      };
      if (manifest.settings) {
        for (const setting of manifest.settings) {
          addonState[setting.id] = AddonSettingsAPI.getSettingValue(id, manifest, setting.id);
        }
      }
      initialState[id] = addonState;
    }
    return initialState;
  }

  handleSettingChange (addonId) {
    return (name, value) => {
      if (name === 'enabled') {
        AddonSettingsAPI.setEnabled(addonId, value);
      } else {
        AddonSettingsAPI.setSettingValue(addonId, name, value);
        ipcRenderer.send('addon-settings-changed');
      }
      this.setState({
        dirty: true
      });
      this.setState((state, props) => ({
        [addonId]: {
          ...state[addonId],
          [name]: value
        }
      }));
    };
  }

  handleReset () {
    if (confirm('Are you sure you want to reset all addon settings?')) {
      AddonSettingsAPI.reset();
      this.setState(this.getInitialState());
    }
  }

  handleReloadNow () {
    ipcRenderer.send('reload-all');
    this.setState({
      dirty: false
    });
  }

  render () {
    return (
      <main>
        {this.state.dirty && (
          <DirtyComponent
            onReloadNow={this.handleReloadNow}
          />
        )}
        <h1>Addon Settings</h1>
        <p><b>Note:</b> You may have to reload/restart TurboWarp for certain settings to apply.</p>
        <div className={styles.addonContainer}>
          {this.props.addons.map(({id, manifest}) => {
            const state = this.state[id];
            return (
              <AddonComponent
                key={id}
                id={id}
                settings={state}
                onChange={this.handleSettingChange(id)}
                manifest={manifest}
              />
            );
          })}
          <button onClick={this.handleReset}>Reset</button>
        </div>
      </main>
    );
  }
}

AddonSettingsComponent.propTypes = {
  addons: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    manifest: PropTypes.any
  }))
};

const loadedAddons = addons.map((id) => ({
  id,
  manifest: require(`../../addons/addons/${id}/addon.json`)
}));

ReactDOM.render((
  <AddonSettingsComponent
    addons={loadedAddons}
  />
), require('../app-target'));
