import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import {ipcRenderer} from 'electron';

import addons from '../../addons/addons';
import getTranslations from '../../addons/translations';
import AddonSettingsAPI from '../../addons/settings-api';
import styles from './settings.css';

const urlParameters = new URLSearchParams(location.search);
const translations = getTranslations(urlParameters.get('locale') || 'en');

const nbsp = '\u00a0';

const AddonCredits = ({credits}) => (
  credits.map((author, index) => {
    const isFirst = index === 0;
    const isLast = index === credits.length - 1;
    return (
      <span key={index}>
        {!isFirst && isLast ? ' and ' : null}
        <a
          href={author.link}
          target="_blank"
          rel="noreferrer"
        >
          {author.name}
        </a>
        {isLast ? null : ', '}
      </span>
    );
  })
);
AddonCredits.propTypes = {
  credits: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    link: PropTypes.string
  }))
};

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

const NoticeComponent = ({
  addonId,
  notice
}) => {
  const noticeId = notice.id;
  const text = translations[`${addonId}/@info-${noticeId}`] || notice.text;
  return (
    <div
      className={styles.notice}
      type={notice.type}
    >
      {"Note: "}
      {text}
    </div>
  );
};
NoticeComponent.propTypes = {
  addonId: PropTypes.string,
  notice: PropTypes.shape({
    type: PropTypes.string,
    text: PropTypes.string,
    id: PropTypes.string
  })
};

const AddonComponent = ({
  id,
  settings,
  onChange,
  onReset,
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
    <div className={styles.reset}>
      {settings.modified && <button onClick={onReset}>Reset</button>}
    </div>
    <div className={styles.description}>
      {translations[`${id}/@description`] || manifest.description}
    </div>
    {settings.enabled && (
      <div>
        {manifest.info && (
          <div className={styles.noticeContainer}>
            {manifest.info.map((info) => (
              <NoticeComponent
                key={info.id}
                addonId={id}
                notice={info}
              />
            ))}
          </div>
        )}
        {manifest.credits && (
          <div className={styles.credits}>
            {"Credits: "}
            <AddonCredits credits={manifest.credits} />
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
  onReset: PropTypes.func,
  manifest: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    info: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string
    })),
    settings: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string
    }))
  })
};

const DirtyComponent = (props) => (
  <div className={styles.dirtyOuter}>
    <div className={styles.dirtyInner}>
      {"Some settings may need a reload to apply. "}
      <button onClick={props.onReloadNow}>Reload Now</button>
    </div>
  </div>
);
DirtyComponent.propTypes = {
  onReloadNow: PropTypes.func
};

class AddonSettingsComponent extends React.Component {
  constructor (props) {
    super(props);
    this.state = this.getInitialState();
    this.handleResetAll = this.handleResetAll.bind(this);
    this.handleReloadNow = this.handleReloadNow.bind(this);
  }

  getInitialState () {
    const initialState = {
      dirty: false
    };
    for (const {id, manifest} of this.props.addons) {
      const addonState = {
        enabled: AddonSettingsAPI.getEnabled(id, manifest),
        modified: AddonSettingsAPI.hasSettingsForAddon(id)
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
      this.setState((state) => ({
        dirty: true,
        [addonId]: {
          ...state[addonId],
          modified: true,
          [name]: value
        }
      }));
    };
  }

  handleSettingReset (addonId) {
    return () => {
      AddonSettingsAPI.resetAddon(addonId);
      this.setState({
        dirty: true,
        [addonId]: this.getInitialState()[addonId]
      });
    };
  }

  handleResetAll () {
    if (confirm('Are you sure you want to reset all addon settings to their default values?')) {
      AddonSettingsAPI.resetAll();
      this.setState({
        ...this.getInitialState(),
        dirty: true
      });
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
                onReset={this.handleSettingReset(id)}
                manifest={manifest}
              />
            );
          })}
          <button onClick={this.handleResetAll}>Reset All</button>
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
