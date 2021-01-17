import React from 'react';
import PropTypes from 'prop-types';

import addons from '../addons';
import getAddonTranslations from '../get-addon-translations';
import AddonSettingsAPI from '../settings-api';
import styles from './settings.css';

const urlParameters = new URLSearchParams(location.search);
const locale = urlParameters.get('locale') || 'en';
const addonTranslations = getAddonTranslations(locale);

const settingsTranslations = require('../settings-l10n/en.json');
if (locale !== 'en') {
  try {
    Object.assign(settingsTranslations, require(`../settings-l10n/${locale}.json`));
  } catch (e) {
    // ignore
  }
}

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
  const settingName = addonTranslations[`${addonId}/@settings-name-${settingId}`] || setting.name;
  return (
    <div
      className={styles.setting}
    >
      {setting.type === 'boolean' && (
        <label>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(settingId, e.target.checked, setting)}
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
            onChange={(e) => onChange(settingId, +e.target.value, setting)}
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
            onChange={(e) => onChange(settingId, e.target.value, setting)}
          />
          {nbsp}
          {settingName}
        </label>
      )}
      {setting.type === 'select' && (
        <label>
          <select onChange={(e) => onChange(settingId, e.target.value, setting)}>
            {setting.potentialValues.map((value) => {
              const valueId = value.id;
              const valueName = addonTranslations[`${addonId}/@settings-select-${settingId}-${valueId}`] || value.name;
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
  const text = addonTranslations[`${addonId}/@info-${noticeId}`] || notice.text;
  return (
    <div
      className={styles.notice}
      type={notice.type}
    >
      {settingsTranslations["tw.addons.settings.notice.info"]}
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

const PresetComponent = ({
  addonId,
  onSelectPreset,
  manifest
}) => (
  <select
    className={styles.presets}
    onChange={(e) => onSelectPreset(manifest, e.target.value)}
    value="_presets"
  >
    <option
      disabled
      value="_presets"
    >
      {settingsTranslations['tw.addons.settings.presets']}
    </option>
    {manifest.presets.map((preset) => {
      const presetId = preset.id;
      const name = addonTranslations[`${addonId}/@preset-name-${presetId}`] || preset.name;
      const description = addonTranslations[`${addonId}/@preset-name-${presetId}`] || preset.name;
      return (
        <option
          key={presetId}
          value={presetId}
        >
          {name}
        </option>
      );
    })}
  </select>
);
PresetComponent.propTypes = {
  addonId: PropTypes.string,
  onSelectPreset: PropTypes.func,
  manifest: PropTypes.shape({
    presets: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      id: PropTypes.string,
      description: PropTypes.string,
      values: PropTypes.object
    }))
  })
};

const AddonComponent = ({
  id,
  settings,
  onChange,
  onSelectPreset,
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
      {addonTranslations[`${id}/@name`] || manifest.name}
    </label>
    <div className={styles.side}>
      {settings.enabled && manifest.presets && (
        <PresetComponent
          addonId={id}
          onSelectPreset={onSelectPreset}
          manifest={manifest}
        />
      )}
      {settings.modified && (
        <button
          className={styles.resetButton}
          onClick={onReset}
        >
          {settingsTranslations['tw.addons.settings.reset']}
        </button>
      )}
    </div>
    <div className={styles.description}>
      {addonTranslations[`${id}/@description`] || manifest.description}
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
            {settingsTranslations["tw.addons.settings.credits"]}
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
  onSelectPreset: PropTypes.func,
  onReset: PropTypes.func,
  manifest: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    info: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string
    })),
    settings: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string
    })),
    presets: PropTypes.array
  })
};

const DirtyComponent = (props) => (
  <div className={styles.dirtyOuter}>
    <div className={styles.dirtyInner}>
      {settingsTranslations["tw.addons.settings.dirty"]}
      {props.onReloadNow && (
        <button
          className={styles.dirtyButton}
          onClick={props.onReloadNow}
        >
          {settingsTranslations["tw.addons.settings.dirtyButton"]}
        </button>
      )}
    </div>
  </div>
);
DirtyComponent.propTypes = {
  onReloadNow: PropTypes.func
};

const loadedAddons = addons.map((id) => ({
  id,
  manifest: require(`../../addons/addons/${id}/addon.json`)
}));

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
    return (name, value, manifest) => {
      if (name === 'enabled') {
        AddonSettingsAPI.setEnabled(addonId, value);
        // Changing enabled always requires a reload.
        this.setState({
          dirty: true
        });
      } else {
        AddonSettingsAPI.setSettingValue(addonId, name, value);
        // If the manifest explicitly sets reloadRequired to false, a reload is not required.
        if (manifest.reloadRequired !== false) {
          this.setState({
            dirty: true
          });
        }
        if (this.props.onSettingsChanged) {
          this.props.onSettingsChanged();
        }
      }
      this.setState((state) => ({
        [addonId]: {
          ...state[addonId],
          modified: true,
          [name]: value
        }
      }));
    };
  }

  handleSelectPreset (addonId) {
    return (manifest, presetId) => {
      for (const preset of manifest.presets) {
        if (preset.id === presetId) {
          const settingsThatRequireReload = [];
          const values = {};
          let reloadRequired = false;
          for (const setting of manifest.settings) {
            const key = setting.id;
            const value = setting.default;
            if (setting.reloadRequired !== false) {
              settingsThatRequireReload.push(key);
            }
            values[key] = value;
          }
          for (const key of Object.keys(preset.values)) {
            if (settingsThatRequireReload.includes(key)) {
              reloadRequired = true;
            }
            const value = preset.values[key];
            values[key] = value;
          }

          for (const key of Object.keys(values)) {
            const value = values[key];
            AddonSettingsAPI.setSettingValue(addonId, key, value);
          }
          if (reloadRequired) {
            this.setState({
              dirty: true
            });
          }
          this.setState((state) => ({
            [addonId]: {
              ...state[addonId],
              ...values,
              modified: true
            }
          }));
          if (this.props.onSettingsChanged) {
            this.props.onSettingsChanged();
          }
          break;
        }
      }
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
    if (confirm(settingsTranslations['tw.addons.settings.confirmResetAll'])) {
      AddonSettingsAPI.resetAll();
      this.setState({
        ...this.getInitialState(),
        dirty: true
      });
    }
  }

  handleReloadNow () {
    if (this.props.onReloadNow) {
      this.props.onReloadNow();
    }
    this.setState({
      dirty: false
    });
  }

  render () {
    return (
      <div>
        {this.state.dirty && (
          <DirtyComponent
            onReloadNow={this.props.onReloadNow && this.handleReloadNow}
          />
        )}
        <div className={styles.addonContainer}>
          {this.props.addons.map(({id, manifest}) => {
            const state = this.state[id];
            return (
              <AddonComponent
                key={id}
                id={id}
                settings={state}
                onChange={this.handleSettingChange(id)}
                onSelectPreset={this.handleSelectPreset(id)}
                onReset={this.handleSettingReset(id)}
                manifest={manifest}
              />
            );
          })}
          <button
            className={styles.resetAllButton}
            onClick={this.handleResetAll}
          >
            {settingsTranslations["tw.addons.settings.resetAll"]}
          </button>
        </div>
      </div>
    );
  }
}
AddonSettingsComponent.propTypes = {
  addons: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    manifest: PropTypes.any
  })),
  onReloadNow: PropTypes.func,
  onSettingsChanged: PropTypes.func
};
AddonSettingsComponent.defaultProps = {
  addons: loadedAddons
};

export default AddonSettingsComponent;
