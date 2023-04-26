const BOLD = '\u001b[1m';
const SUCCESS = '\u001b[32m';
const ERROR = '\u001b[31m';
const WARN = '\u001b[33m';
const RESET = '\u001b[0m';

const UPLOAD_CHUNK_SIZE = 4 * 1024 * 1024;
const MEDIA_UPLOAD_SUCCEED = 'succeeded';
const MEDIA_UPLOAD_FAIL = 'failed';

class Value {
  value: any;

  constructor(value: any = null) {
    this.value = value;
  }
}

class Media {
  static Type = {
    image: new Value(5_242_880),
    gif: new Value(15_728_640),
    video: new Value(536_870_912),
  };
}

class Operation {
  static Data = {
    Favoriters: new Value('tweetId'),
    Retweeters: new Value('tweetId'),
    TweetDetail: new Value('focalTweetId'),
    TweetResultByRestId: new Value('tweetId'),
    UserTweets: new Value('userId'),
    UserTweetsAndReplies: new Value('userId'),
    Likes: new Value('userId'),
    UserMedia: new Value('userId'),
    Followers: new Value('userId'),
    Following: new Value('userId'),
    UserByScreenName: new Value('screen_name'),
    UserByRestId: new Value('userId'),
    UsersByRestIds: new Value('userIds'),
  };

  static Account = {
    CreateTweet: new Value(),
    CreateScheduledTweet: new Value(),
    DeleteScheduledTweet: new Value(),
    FetchScheduledTweets: new Value(),
    DeleteTweet: new Value(),
    FavoriteTweet: new Value(),
    UnfavoriteTweet: new Value(),
    CreateRetweet: new Value(),
    DeleteRetweet: new Value(),
    CreateBookmark: new Value(),
    DeleteBookmark: new Value(),
    BookmarksAllDelete: new Value(),
    TopicFollow: new Value(),
    TopicUnfollow: new Value(),
    ListsManagementPageTimeline: new Value(),
    CreateList: new Value(),
    DeleteList: new Value(),
    EditListBanner: new Value(),
    DeleteListBanner: new Value(),
    ListAddMember: new Value(),
    ListRemoveMember: new Value(),
    ListsPinMany: new Value(),
    ListPinOne: new Value(),
    ListUnpinOne: new Value(),
    UpdateList: new Value(),
    useSendMessageMutation: new Value(),
    TweetStats: new Value(),
  };
}