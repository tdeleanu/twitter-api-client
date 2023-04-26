import { URL, URLSearchParams } from 'url';

class UrlUtils {
  static setQueryString(
    url: string,
    qs: Record<string, any>,
    update = false,
    safe = ''
  ): string {
    const parsedUrl = new URL(url);
    const existingParams = new URLSearchParams(parsedUrl.search);

    if (update) {
      for (const [key, value] of Object.entries(qs)) {
        existingParams.set(key, value);
      }
    } else {
      parsedUrl.search = new URLSearchParams(qs).toString();
    }

    return parsedUrl.toString();
  }

  static findKey(obj: any, key: string): any[] {
    const helper = (obj: any, key: string, accumulator: any[]): any[] => {
      if (!obj) {
        return accumulator;
      }

      if (Array.isArray(obj)) {
        for (const e of obj) {
          accumulator.push(...helper(e, key, []));
        }
        return accumulator;
      }

      if (obj instanceof Object && obj.hasOwnProperty(key)) {
        accumulator.push(obj[key]);
      }

      if (obj instanceof Object) {
        for (const k in obj) {
          accumulator.push(...helper(obj[k], key, []));
        }
      }

      return accumulator;
    };

    return helper(obj, key, []);
  }

  static traverseDict(d: Record<string, any>, ...args: string[]): any {
    for (const k of args) {
      d = d?.[k] || {};
    }
    return d;
  }

  static getHeaders(session: any): Record<string, string> {
    return {
      authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      cookie: Object.entries(session.cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; '),
      referer: 'https://twitter.com/',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      'x-csrf-token': session.cookies.get('ct0'),
      'x-guest-token': session.cookies.get('guest_token'),
      'x-twitter-auth-type': session.cookies.get('auth_token') ? 'OAuth2Session' : '',
      'x-twitter-active-user': 'yes',
      'x-twitter-client-language': 'en',
    };
  }

  static buildQuery(params: Record<string, any>): string {
    return Object.entries(params)
      .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
      .join('&');
  }
}

export default UrlUtils;