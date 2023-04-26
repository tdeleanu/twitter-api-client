import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { URL } from 'url';
import * as path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import login from './login';
import findKey from './utils';

const pipelineAsync = promisify(pipeline);


export class Scraper {
  private readonly GRAPHQL_URL = 'https://api.twitter.com/graphql';
  private session: AxiosInstance;

  constructor(email: string, username: string, password: string) {
    this.session = login(email, username, password);
  }
  async run(ids: number[], operation: [string, any], limit?: number): Promise<any> {
    const res = this.query(ids, operation);
    
    if (limit === undefined) {
      return res;
    }
  
    const paginatedResults = await this.pagination(res, operation, limit);
    return [...paginatedResults, ...res];
  }
  

  async tweets(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.UserTweets, limit);
  }

  async tweetsAndReplies(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.UserTweetsAndReplies, limit);
  }

  async likes(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.Likes, limit);
  }

  async media(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.UserMedia, limit);
  }

  async followers(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.Followers, limit);
  }

  async following(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.Following, limit);
  }

  async favoriters(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.Favoriters, limit);
  }

  async retweeters(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.Retweeters, limit);
  }

  async tweetsDetails(ids: number[], limit = Infinity) {
    return this.run(ids, Operation.Data.TweetDetail, limit);
  }

  async tweetByRestId(ids: number[]) {
    return this.run(ids, Operation.Data.TweetResultByRestId);
  }

  async userByScreenName(ids: string[]) {
    return this.run(ids, Operation.Data.UserByScreenName);
  }

  async userByRestId(ids: number[]) {
    return this.run(ids, Operation.Data.UserByRestId);
  }

  async usersByRestIds(ids: number[]) {
    const [name, key] = Operation.Data.UsersByRestIds;
    const params = deepCopy(operations[name]);
    const queryId = params['queryId'];
    params['variables']['userIds'] = ids;
    const query = buildQuery(params);
    const url = `${this.GRAPHQL_URL}/${queryId}/${name}?${query}`;
    const headers = getHeaders(this.session);
    headers['content-type'] = 'application/json';
    const response = await this.session.get(url, { headers });
    const users = response.data;
    return users;
  }

  // Continue with the implementation of the remaining methods.
  async backoff(fn: () => Promise<any>, retries = 12): Promise<[any, any]> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fn();
        const data = response.data;
        if (response.status === 429) {
          console.error('Error: Rate limit exceeded');
          return [response, {}];
        }
        if (findKey(data, 'errors')) {
          console.error('Error: Twitter errors', data);
        }
        return [response, data];
      } catch (error) {
        if (i === retries) {
          console.error('Error: Max retries exceeded', error);
          return [null, null];
        }
        const waitTime = 2 ** i + Math.random();
        console.warn(`Retrying in ${waitTime.toFixed(2)} seconds`, error);
        await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
      }
    }
    return [null, null];
  }

  saveData(data: any[], name: string = ''): void {
    try {
      for (const item of data) {
        const savePath = path.join('data', 'raw', `${item[ID]}`);
        fs.mkdirSync(savePath, { recursive: true });
        fs.writeFileSync(
          path.join(savePath, `${Date.now()}_${name}.json`),
          JSON.stringify(item, null, 2)
        );
      }
    } catch (error) {
      console.error('Error: Failed to save data', error);
    }
  }

  async download(
    postUrl: string,
    cdnUrl: string,
    savePath: string = 'media',
    chunkSize: number = 4096
  ): Promise<void> {
    const dirPath = path.join(savePath);
    fs.mkdirSync(dirPath, { recursive: true });

    const name = new URL(postUrl).pathname.replace('/', '_').slice(1);
    const ext = new URL(cdnUrl).pathname.split('/').pop();
    const filePath = path.join(dirPath, `${name}_${ext}`);

    try {
      const response = await axios.get(cdnUrl, { responseType: 'stream' });
      const totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      console.log(`Downloading: ${name}`);

      const writeStream = fs.createWriteStream(filePath);
      let receivedBytes = 0;
      response.data.on('data', (chunk: Buffer) => {
        receivedBytes += chunk.length;
        writeStream.write(chunk);
        console.log(`${((receivedBytes / totalBytes) * 100).toFixed(2)}%`);
      });

      response.data.on('end', () => {
        writeStream.end();
        console.log('Download complete');
      });
    } catch (error) {
      console.error('Error: Failed to download media', postUrl, error);
    }
  }

  async downloadMedia(ids: number[], photos: boolean = true, videos: boolean = true): Promise<void> {
    const results = await this.tweetByRestId(ids);
    for (const result of results) {
      const media = result['media'];
      if (!media) {
        continue;
      }

      for (const item of media) {
        const postUrl = item['url'];
        const cdnUrl = item['cdn_url'];
        const mediaType = item['type'];

        if (photos && mediaType === 'photo') {
          await this.download(postUrl, cdnUrl, 'media/photos');
        }

        if (videos && mediaType === 'video') {
          await this.download(postUrl, cdnUrl, 'media/videos');
        }
      }
    }
  }
  async trends(woeid: number, count: number = 10): Promise<string[]> {  
    try {
      const trendsResponse = await axios.get('trends/place', { id: woeid });
      const trends = trendsResponse[0]?.trends;
  
      if (!trends) {
        return [];
      }
  
      const topTrends: string[] = trends.slice(0, count).map((trend: any) => trend.name);
      return topTrends;
    } catch (error) {
      console.error('Error fetching trends:', error);
      return [];
    }
  }
  

}
