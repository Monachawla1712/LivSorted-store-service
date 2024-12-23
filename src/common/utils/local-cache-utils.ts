import { DURATION_IN_SECOND } from '../constants/common-constants';

export class LocalCache {
  private static storage = {};

  static setValue(key: string, value: any, ttlInSecond: number) {
    if (!value) return;
    const now = new Date();
    const item = {
      value: value,
      expiry: now.getTime() + ttlInSecond * 1000,
    };
    this.storage[key] = JSON.stringify(item, (_key, val) =>
      val instanceof Set ? [...val] : val,
    );
  }

  static getValue(key: string) {
    const itemStr = this.storage[key];
    if (!itemStr) {
      return null;
    }

    const item = JSON.parse(itemStr);
    const now = new Date();
    if (now.getTime() > item.expiry) {
      delete this.storage[key];
      return null;
    }
    if (key !== this.cleanUpKey) {
      this.cleanup();
    }
    return item.value;
  }

  static clearCache() {
    this.storage = {};
  }

  static invalidateCache(key: string) {
    if (key) {
      delete this.storage[key];
    }
  }

  static cleanUpKey = 'CLEANUP_LOCAL_CACHE';
  private static cleanup() {
    const value = this.getValue(this.cleanUpKey);
    if (value) {
      return;
    }
    this.setValue(this.cleanUpKey, 'clean', DURATION_IN_SECOND.HR_2);
    for (const storeKey of Object.keys(this.storage)) {
      this.getValue(storeKey);
    }
  }
}
