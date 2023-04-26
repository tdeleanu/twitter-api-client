import { Session } from 'requests';
import { SUCCESS, WARN, ERROR, BOLD, RESET } from './constants';
import findKey from './utils';

class TwitterAuth {
  static updateToken(
    session: Session,
    key: string,
    url: string,
    payload: Record<string, any>
  ): Session {
    try {
      const headers = {
        authorization: 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'x-guest-token': session.cookies.get('guest_token'),
        'x-csrf-token': session.cookies.get('ct0'),
        'x-twitter-auth-type': session.cookies.get('auth_token') ? 'OAuth2Session' : '',
        'x-twitter-active-user': 'yes',
        'x-twitter-client-language': 'en',
      };
      const response = session.post(url, { headers, json: payload });
      const info = response.json();

      for (const s of info.get('subtasks', [])) {
        if (s.get('enter_text', {}).get('keyboard_type') === 'email') {
          console.log(`[${WARN}warning${RESET}] ${findKey(s, 'text').join(' ')}`);
          session.cookies.set('confirm_email', 'true');
        }
      }

      session.cookies.set(key, info[key]);
    } catch (e) {
      session.cookies.set('flow_errors', 'true');
      console.error(`[${ERROR}error${RESET}] failed to update token\n${e}`);
    }
    return session;
  }

  static initGuestToken(session: Session): Session {
    return TwitterAuth.updateToken(session, 'guest_token', 'https://api.twitter.com/1.1/guest/activate.json', {});
  }

  static flowStart(session: Session): Session {
    return TwitterAuth.updateToken(
      session,
      'flow_token',
      'https://api.twitter.com/1.1/onboarding/task.json?flow_name=login',
      {
        input_flow_data: {
          flow_context: { debug_overrides: {}, start_location: { location: 'splash_screen' } },
        },
        subtask_versions: {},
      }
    );
  }

  static flowInstrumentation(session: Session): Session {
    return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
      flow_token: session.cookies.get('flow_token'),
      subtask_inputs: [
        {
          subtask_id: 'LoginJsInstrumentationSubtask',
          js_instrumentation: { response: '{}', link: 'next_link' },
        },
      ],
    });
  }

    static flowUsername(session: Session): Session {
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
        ],
    });
    }

    static flowPassword(session: Session): Session {
    return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
        flow_token: session.cookies.get('flow_token'),
        subtask_inputs: [
        {
            subtask_id: 'LoginEnterPassword',
            enter_password: { password: session.cookies.get('password'), link: 'next_link' },
        },
        ],
    });
    }

    static flowDuplicationCheck(session: Session): Session {
    return TwitterAuth.updateToken(session, 'flow_token', 'https://api.twitter.com/1.1/onboarding/task.json', {
        flow_token: session.cookies.get('flow_token'),
        subtask_inputs: [
        {
            subtask_id: 'AccountDuplicationCheck',
            check_logged_in_account: { link: 'AccountDuplicationCheck_false' },
        },
        ],
    });
    }

    static confirmEmail(session: Session): Session {
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
    }

    static executeLoginFlow(session: Session): Session {
    session = TwitterAuth.initGuestToken(session);
    const functions = [
        TwitterAuth.flowStart,
        TwitterAuth.flowInstrumentation,
        TwitterAuth.flowUsername,
        TwitterAuth.flowPassword,
        TwitterAuth.flowDuplicationCheck,
    ];

    for (const fn of functions) {
        session = fn(session);
    }

    if (session.cookies.get('confirm_email') === 'true') {
        session = TwitterAuth.confirmEmail(session);
    }

    return session;
    }

    static login(email: string, username: string, password: string): Session {
    let session = new Session();
    session.cookies.update({
        email,
        username,
        password,
        guest_token: null,
        flow_token: null,
    });
    session = TwitterAuth.executeLoginFlow(session);

    if (session.cookies.get('flow_errors') === 'true') {
        console.error(`[${ERROR}error${RESET}] ${BOLD}${username}${RESET} login failed`);
    } else {
        console.log(`[${SUCCESS}success${RESET}] ${BOLD}${username}${RESET} login success`);
    }

    return session;
    }
}

export default TwitterAuth;