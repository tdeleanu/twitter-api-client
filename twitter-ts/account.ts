import axios, { AxiosInstance } from 'axios';
import { v1 as uuidv1 } from 'uuid';
import { deepCopy } from './utils'; // You need to create a deepCopy function in your utils.ts
import { operations } from './config/operations'; // You need to create and export 'operations' in your config/operations.ts
import UrlUtils from './utils'; // You need to create a getHeaders function in your utils.ts
import { login } from './login'; // You need to create and export 'login' function in your login.ts

class Account {
  private static readonly V1_URL = 'https://api.twitter.com/1.1';
  private static readonly V2_URL = 'https://api.twitter.com/2';
  private static readonly GRAPHQL_URL = 'https://api.twitter.com/graphql';
  private session: AxiosInstance;

  constructor(email: string, username: string, password: string) {
    this.session = login(email, username, password);
  }

  async gql(operation: [string, any], variables: Record<string, any>) {
    const [name] = operation;
    const payload = deepCopy(operations[name]);
    const qid = payload['queryId'];
    payload['variables'] = { ...payload['variables'], ...variables };
    const url = `${Account.GRAPHQL_URL}/${qid}/${name}`;
    const response = await this.session.post(url, payload, { headers: getHeaders(this.session) });
    this.checkResponse(response);
    return response;
  }

  async api(path: string, settings: Record<string, any>) {
    const headers = UrlUtils.getHeaders(this.session);
    headers['content-type'] = 'application/x-www-form-urlencoded';
    const url = `${Account.V1_URL}/${path}`;
    const response = await this.session.post(url, new URLSearchParams(settings).toString(), { headers });
    this.checkResponse(response);
    return response;
  }

  async dm(receivers: number[], text: string, filename: string = ""): Promise<Response> {
    const [name, _] = Operation.Account.useSendMessageMutation;
    const params = JSON.parse(JSON.stringify(operations[name]));
    const qid = params["queryId"];
    params["variables"]["target"] = { participant_ids: receivers };
    params["variables"]["requestId"] = uuidv1({ node: getnode() });
    const url = `${this.GRAPHQL_URL}/${qid}/${name}`;

    if (filename) {
      const media_id = await this.upload_media(filename, true);
      params["variables"]["message"]["media"] = { id: media_id, text: text };
    } else {
      params["variables"]["message"]["text"] = { text: text };
    }

    const r = await this.session.post(url, { headers: get_headers(this.session), json: params });
    return r;
  }
  
  checkResponse(r: Response): void {
    if (r.status === 429) {
      throw new Error(`rate limit exceeded: ${r.url}`);
    }
    const data = r.json();
    if (UrlUtils.findKey(data, "errors")) {
      console.debug(`[error] ${JSON.stringify(data)}`);
    }
  }
  
  
}
