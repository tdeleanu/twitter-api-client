import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

class TwitterSearch {
  private headers: any;
  private outputDirs: string;
  private IN_PATH: string;
  private OUT_PATH: string;

  constructor() {
    this.outputDirs = 'data';
    this.IN_PATH = path.join(path.resolve(), 'data', 'raw');
    this.OUT_PATH = path.join(path.resolve(), 'data', 'processed', `search_results_${Date.now()}.json`);
    this.makeOutputDirs(this.outputDirs);
  }

  private async getHeaders(): Promise<any> {
    const headers = {
      'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs=1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    const response = await axios.post('https://api.twitter.com/1.1/guest/activate.json', {}, { headers });
    headers['x-guest-token'] = response.data.guest_token;
    return headers;
  }

  private makeOutputDirs(pathStr: string): void {
    const p = path.join(path.resolve(), pathStr);
    const rawPath = path.join(p, 'raw');
    const processedPath = path.join(p, 'processed');
    const finalPath = path.join(p, 'final');

    if (!fs.existsSync(rawPath)) {
      fs.mkdirSync(rawPath, { recursive: true });
    }
    if (!fs.existsSync(processedPath)) {
      fs.mkdirSync(processedPath, { recursive: true });
    }
    if (!fs.existsSync(finalPath)) {
      fs.mkdirSync(finalPath, { recursive: true });
    }
  }

  public async search(queries: string[], config: any): Promise<void> {
    this.headers = await this.getHeaders();
    const results = await this.process(queries, config);
    fs.writeFileSync(this.OUT_PATH, JSON.stringify(results, null, 2));
  }

  private async process(queries: string[], config: any): Promise<any[]> {
    const allResults = await Promise.all(queries.map(query => this.paginate(query, config)));
    return allResults.flat();
  }

  private async paginate(query: string, config: any): Promise<any[]> {
    const api = 'https://api.twitter.com/2/search/adaptive.json?';
    config['q'] = query;

    const allData: any[] = [];
    let nextCursor: string | null = null;
    do {
      config['cursor'] = nextCursor;
      const { data, cursor } = await this.get(api, config);
      allData.push(...data);
      nextCursor = cursor;
    } while (nextCursor);

    return allData;
  }

  private async get(api: string, params: any): Promise<{ data: any[], cursor: string | null }> {
    const url = new URL(api);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));

    const response = await axios.get(url.toString(), { headers: this.headers });
    const data = response.data;

    if (!data?.timeline?.instructions) {
      throw new Error('No data received');
    }

    const tweets = data.globalObjects.tweets;
    const tweetArray = Object.values(tweets);
    const cursor = this.getCursor(data);

    return { data: tweetArray, cursor };
  }

  private getCursor(data: any): string | null {
    for (const instr of data.timeline.instructions) {
      if (instr.replaceEntry) {
        const cursor = instr.replaceEntry.entry.content.operation.cursor;
        if (cursor.cursorType === 'Bottom') {
          return cursor.value;
        }
      } else if (instr.addEntries) {
        for (const entry of instr.addEntries.entries) {
          if (entry.entryId === 'cursor-bottom-0') {
            return entry.content.operation.cursor.value;
          }
        }
      }
    }
    return null;
  }
}
export default TwitterSearch;