"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var requests_1 = require("requests");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
var TwitterAuth = /** @class */ (function () {
    function TwitterAuth() {
    }
    TwitterAuth.updateToken = function (session, key, url, payload) {
        try {
            var headers = {
                authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
                'content-type': 'application/json',
                'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
                'x-guest-token': session.cookies.get('guest_token'),
                'x-csrf-token': session.cookies.get('ct0'),
                'x-twitter-auth-type': session.cookies.get('auth_token') ? 'OAuth2Session' : '',
                'x-twitter-active-user': 'yes',
                'x-twitter-client-language': 'en',
            };
            var response = session.post(url, { headers: headers, json: payload });
            var info = response.json();
            for (var _i = 0, _a = info.get('subtasks', []); _i < _a.length; _i++) {
                var s = _a[_i];
                if (s.get('enter_text', {}).get('keyboard_type') === 'email') {
                    console.log("[".concat(constants_1.WARN, "warning").concat(constants_1.RESET, "] ").concat((0, utils_1.default)(s, 'text').join(' ')));
                    session.cookies.set('confirm_email', 'true');
                }
            }
            session.cookies.set(key, info[key]);
        }
        catch (e) {
            session.cookies.set('flow_errors', 'true');
            console.error("[".concat(constants_1.ERROR, "error").concat(constants_1.RESET, "] failed to update token\n").concat(e));
        }
        return session;
    };
    TwitterAuth.initGuestToken = function (session) {
        return TwitterAuth.updateToken(session, 'guest_token', 'https://api.twitter.com/1.1/guest/activate.json', {});
    };
    TwitterAuth.flowStart = function (session) {
        return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json?flow_name=login', {
            input_flow_data: {
                flow_context: { debug_overrides: {}, start_location: { location: 'splash_screen' } },
            },
            subtask_versions: {},
        });
    };
    TwitterAuth.flowInstrumentation = function (session) {
        return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
            flow_token: session.cookies.get('flow_token'),
            subtask_inputs: [
                {
                    subtask_id: 'LoginJsInstrumentationSubtask',
                    js_instrumentation: { response: '{}', link: 'next_link' },
                },
            ],
        });
    };
    TwitterAuth.flowUsername = function (session) {
        return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
            flow_token: session.cookies.get('flow_token'),
            subtask_inputs: [
                {
                    subtask_id: 'LoginEnterUserIdentifierSSO',
                    settings_list: {
                        setting_responses: [
                            {
                                key: 'user_identifier',
                                response_data: { text_data: { result: session.cookies.get('username') } },
                            },
                        ],
                        link: 'next_link',
                    },
                }
            ],
        });
    };
    TwitterAuth.flowPassword = function (session) {
        return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
            flow_token: session.cookies.get('flow_token'),
            subtask_inputs: [
                {
                    subtask_id: 'LoginEnterPassword',
                    enter_password: { password: session.cookies.get('password'), link: 'next_link' },
                },
            ],
        });
    };
    TwitterAuth.flowDuplicationCheck = function (session) {
        return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
            flow_token: session.cookies.get('flow_token'),
            subtask_inputs: [
                {
                    subtask_id: 'AccountDuplicationCheck',
                    check_logged_in_account: { link: 'AccountDuplicationCheck_false' },
                },
            ],
        });
    };
    TwitterAuth.confirmEmail = function (session) {
        return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
            flow_token: session.cookies.get('flow_token'),
            subtask_inputs: [
                {
                    subtask_id: 'LoginAcid',
                    enter_text: {
                        text: session.cookies.get('email'),
                        link: 'next_link',
                    },
                },
            ],
        });
    };
    TwitterAuth.executeLoginFlow = function (session) {
        session = TwitterAuth.initGuestToken(session);
        var functions = [
            TwitterAuth.flowStart,
            TwitterAuth.flowInstrumentation,
            TwitterAuth.flowUsername,
            TwitterAuth.flowPassword,
            TwitterAuth.flowDuplicationCheck,
        ];
        for (var _i = 0, functions_1 = functions; _i < functions_1.length; _i++) {
            var fn = functions_1[_i];
            session = fn(session);
        }
        if (session.cookies.get('confirm_email') === 'true') {
            session = TwitterAuth.confirmEmail(session);
        }
        return session;
    };
    TwitterAuth.login = function (email, username, password) {
        var session = new requests_1.Session();
        session.cookies.update({
            email: email,
            username: username,
            password: password,
            guest_token: null,
            flow_token: null,
        });
        session = TwitterAuth.executeLoginFlow(session);
        if (session.cookies.get('flow_errors') === 'true') {
            console.error("[".concat(constants_1.ERROR, "error").concat(constants_1.RESET, "] ").concat(constants_1.BOLD).concat(username).concat(constants_1.RESET, " login failed"));
        }
        else {
            console.log("[".concat(constants_1.SUCCESS, "success").concat(constants_1.RESET, "] ").concat(constants_1.BOLD).concat(username).concat(constants_1.RESET, " login success"));
        }
        return session;
    };
    return TwitterAuth;
}());
exports.default = TwitterAuth;
