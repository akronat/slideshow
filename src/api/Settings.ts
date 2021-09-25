import isElectron from '../util/isElectron';
import DisplayStyle from './DisplayStyle';
import TransitionStyle from './TransitionStyle';

const settingsKey = 'settings';

enum SettingType {
  bool,
  enum,
  number,
  string,
}

enum SettingSection {
  general = 'General',
  controlBar = 'Control Bar',
}
type Sectkey = keyof (typeof SettingSection);
const reverseSections: Map<SettingSection, Sectkey> = new Map(Object.entries(SettingSection).map(([k,v]) => [v, k as Sectkey]));

interface Setting {
  section: SettingSection;
  menu?: {
    displayName: string;
    type: SettingType;
    options?: string[];
  }
  default: any;
}

// We need this to check the definition types are valid while still retaining
// "autocompleteability" of the keys.
function checkValid<T extends { [key: string]: Setting }>(arg: T): T {
  return arg;
}

export const Settings = checkValid({
  displayStyle: {
    section: SettingSection.controlBar,
    default: DisplayStyle.Standard,
  },
  isShuffled: {
    section: SettingSection.controlBar,
    default: false,
  },
  speed: {
    section: SettingSection.controlBar,
    default: 3,
  },
  volume: {
    section: SettingSection.controlBar,
    default: 0, // Mute by default, but allow user to adjust volume later in control.
  },
  transitionStyle: {
    section: SettingSection.controlBar,
    default: TransitionStyle.Instant,
  },
});
type PrefKey = keyof (typeof Settings);
const reversePrefs: Map<Setting, PrefKey> = new Map(Object.entries(Settings).map(([k,v]) => [v, k as PrefKey]));

function getKeys(pref: Setting | PrefKey): { prefKey: PrefKey, fullKey: string } {
  const prefKey = typeof pref === 'string' ? pref : reversePrefs.get(pref);
  if (!prefKey) throw Error(`Couldn't find key for setting ${JSON.stringify(pref)}`);
  const sectKey = reverseSections.get(Settings[prefKey].section);
  if (!sectKey) throw Error(`Couldn't find section for setting ${prefKey}}`);
  return { prefKey, fullKey: `${sectKey}.${prefKey}` };
}

export function getSetting(pref: Setting | PrefKey): any {
  const { prefKey, fullKey } = getKeys(pref);
  let settings;
  if (isElectron() && global.electronIpc) {
    settings = global.electronIpc.getSettings();
  } else {
    settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
  }
  return settings[fullKey] || Settings[prefKey].default;
}

export function setSetting(pref: Setting | PrefKey, value: any) {
  const { fullKey } = getKeys(pref);
  if (isElectron() && global.electronIpc) {
    const settings = global.electronIpc.getSettings();
    global.electronIpc.setSettings({ ...settings, [fullKey]: value });
  } else {
    const settings = JSON.parse(localStorage.getItem(settingsKey) || '{}');
    localStorage.setItem(settingsKey, JSON.stringify({ ...settings, [fullKey]: value }));
  }
}
