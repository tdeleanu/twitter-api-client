"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var url_1 = require("url");
var UrlUtils = /** @class */ (function () {
    function UrlUtils() {
    }
    UrlUtils.setQueryString = function (url, qs, update, safe) {
        if (update === void 0) { update = false; }
        if (safe === void 0) { safe = ''; }
        var parsedUrl = new url_1.URL(url);
        var existingParams = new url_1.URLSearchParams(parsedUrl.search);
        if (update) {
            for (var _i = 0, _a = Object.entries(qs); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                existingParams.set(key, value);
            }
        }
        else {
            parsedUrl.search = new url_1.URLSearchParams(qs).toString();
        }
        return parsedUrl.toString();
    };
    UrlUtils.findKey = function (obj, key) {
        var helper = function (obj, key, accumulator) {
            if (!obj) {
                return accumulator;
            }
            if (Array.isArray(obj)) {
                for (var _i = 0, obj_1 = obj; _i < obj_1.length; _i++) {
                    var e = obj_1[_i];
                    accumulator.push.apply(accumulator, helper(e, key, []));
                }
                return accumulator;
            }
            if (obj instanceof Object && obj.hasOwnProperty(key)) {
                accumulator.push(obj[key]);
            }
            if (obj instanceof Object) {
                for (var k in obj) {
                    accumulator.push.apply(accumulator, helper(obj[k], key, []));
                }
            }
            return accumulator;
        };
        return helper(obj, key, []);
    };
    UrlUtils.traverseDict = function (d) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
            var k = args_1[_a];
            d = (d === null || d === void 0 ? void 0 : d[k]) || {};
        }
        return d;
    };
    UrlUtils.getHeaders = function (session) {
        return {
            authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
            cookie: Object.entries(session.cookies)
                .map(function (_a) {
                var k = _a[0], v = _a[1];
                return "".concat(k, "=").concat(v);
            })
                .join('; '),
            referer: 'https://twitter.com/',
            'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
            'x-csrf-token': session.cookies.get('ct0'),
            'x-guest-token': session.cookies.get('guest_token'),
            'x-twitter-auth-type': session.cookies.get('auth_token') ? 'OAuth2Session' : '',
            'x-twitter-active-user': 'yes',
            'x-twitter-client-language': 'en',
        };
    };
    UrlUtils.buildQuery = function (params) {
        return Object.entries(params)
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return "".concat(k, "=").concat(JSON.stringify(v));
        })
            .join('&');
    };
    return UrlUtils;
}());
exports.default = UrlUtils;
