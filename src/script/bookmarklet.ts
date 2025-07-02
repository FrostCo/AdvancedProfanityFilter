import type WebConfig from '@APF/WebConfig';
import Logger from '@APF/lib/Logger';

const logger = new Logger('OptionPage:Bookmarklet');

export default class Bookmarklet {
  code: string;

  static async create() {
    const code = await this.loadCode();
    if (code) return new this(code);
  }

  static async loadCode() {
    try {
      const origURL = './bookmarklet.js';
      const response = await fetch(origURL);
      return await response.text();
    } catch (err) {
      logger.warn('Failed to load bookmarklet script.', err);
    }
  }

  constructor(code: string) {
    this.code = code;
  }

  customizedCode(cfg: WebConfig): string {
    const prefix = '/* @preserve - Start User Config */';
    const suffix = '/* @preserve - End User Config */';
    const configRegExp = new RegExp(
      `${prefix.replace(/[\/\*]/g, '\\$&')}[\\S\\s]\*${suffix.replace(/[\/\*]/g, '\\$&')}`,
      'm'
    );

    try {
      const cfgCode = this.code.match(configRegExp).toString();
      const variableCode = cfgCode.match(/const ([a-zA-Z_$]+)=/m);
      if (variableCode && variableCode[1]) {
        const variableName = variableCode[1];
        return this.code.replace(configRegExp, `${prefix}\nconst ${variableName}=${JSON.stringify(cfg)};\n${suffix}\n`);
      } else {
        throw new Error('Unable to set user config - using defaults.');
      }
    } catch (err) {
      window.alert(err.message);
      return this.code;
    }
  }

  href(cfg: WebConfig = null): string {
    const prefix = 'javascript:';
    const code = cfg ? this.customizedCode(cfg) : this.code;
    return prefix + code;
  }
}
