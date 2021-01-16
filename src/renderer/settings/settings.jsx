import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import AddonCredits from '../addon-credits.jsx';
import addons from '../../addons/addons.json';
import getTranslations from '../../addons/translations';
import AddonSettingsAPI from '../../addons/settings-api';
import styles from './settings.css';

// TODO: use the same language as scratch interface?
const translations = getTranslations(navigator.language.split('-')[0]);

const Addon = ({
  id,
  settings,
  onChange,
  manifest
}) => (
  <div className={styles.addon}>
    <label>
      <input
        type="checkbox"
        onChange={(e) => onChange('enabled', e.target.checked)}
        checked={settings.enabled}
      />
      {translations[`${id}/@name`] || manifest.name}
    </label>
    {" by "}
    <AddonCredits manifest={manifest} />
    {settings.enabled && manifest.settings && (
      <div className={styles.settingContainer}>
        {manifest.settings.map((setting) => {
          const settingId = setting.id;
          const settingName = translations[`${id}/@settings-name-${settingId}`] || setting.name;
          const settingValue = settings[settingId];
          return (
            <div
              key={settingId}
              className={styles.setting}
            >
              {setting.type === 'boolean' && (
                <label>
                  <input
                    type="checkbox"
                    checked={settingValue}
                    onChange={(e) => onChange(settingId, e.target.checked)}
                  />
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
                    value={settingValue}
                    onChange={(e) => onChange(settingId, +e.target.value)}
                  />
                  {settingName}
                </label>
              )}
              {setting.type === 'color' && (
                <label>
                  <input
                    type="color"
                    value={settingValue}
                    onChange={(e) => onChange(settingId, e.target.value)}
                  />
                  {settingName}
                </label>
              )}
              {setting.type === 'select' && (
                <label>
                  <select>
                    {setting.potentialValues.map((value) => {
                      const valueId = value.id;
                      const valueName = translations[`${id}/@settings-select-${settingId}-${valueId}`] || value.name;
                      return (
                        <option key={valueId}>
                          {valueName}
                        </option>
                      );
                    })}
                  </select>
                  {settingName}
                </label>
              )}
            </div>
          )
        })}
      </div>
    )}
  </div>
);

Addon.propTypes = {
  id: PropTypes.string,
  settings: PropTypes.object,
  onChange: PropTypes.func,
  manifest: PropTypes.shape({
    name: PropTypes.string,
    settings: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string
    }))
  })
};

class Settings extends React.Component {
  constructor (props) {
    super(props);
    const initialAddonState = {};
    for (const {id, manifest} of this.props.addons) {
      const addonState = {
        enabled: AddonSettingsAPI.getEnabled(id, manifest)
      };
      if (manifest.settings) {
        for (const setting of manifest.settings) {
          addonState[setting.id] = AddonSettingsAPI.getSettingValue(id, manifest, setting.id);
        }
      }
      initialAddonState[id] = addonState;
    }
    this.state = initialAddonState;
  }

  handleSettingChange (addonId) {
    return (name, value) => {
      this.setState((state, props) => ({
        [addonId]: {
          ...state[addonId],
          [name]: value
        }
      }), () => {
        if (name === 'enabled') {
          AddonSettingsAPI.setEnabled(addonId, value);
        } else {
          AddonSettingsAPI.setSettingValue(addonId, name, value);
        }
      });
    };
  }

  render () {
    return this.props.addons.map(({id, manifest}) => {
      const state = this.state[id];
      return (
        <Addon
          key={id}
          id={id}
          settings={state}
          onChange={this.handleSettingChange(id)}
          manifest={manifest}
        />
      );
    });
  }
}

Settings.propTypes = {
  addons: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    manifest: PropTypes.any
  }))
};

ReactDOM.render((
  <main>
    <h1>Addon Settings</h1>
    <p><b>Note:</b> You must restart TurboWarp Desktop for changes to apply.</p>
    <div className={styles.addonContainer}>
      <Settings
        addons={addons.map((id) => ({
          id,
          manifest: require(`../../addons/addons/${id}/addon.json`)
        }))}
      />
    </div>
  </main>
), require('../app-target'));
