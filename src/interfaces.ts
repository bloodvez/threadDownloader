export type TPost = {
  banned: boolean;
  board: string;
  closed: boolean;
  comment: string;
  date: string;
  email: string;
  endless: boolean;
  files?: Array<TPostFiles>;
  lasthit: number;
  name: string;
  num: number;
  number: number;
  op: boolean;
  parent: boolean;
  sticky: boolean;
  subject: string;
  tags: string;
  timestamp: number;
  trip: string;
  views: number;
};

export type TPostFiles = {
  displayname: string;
  duration?: string;
  fullname: string;
  height: number;
  md5: string;
  name: string;
  path: string;
  size: number;
  thumbnail: string;
  type: number;
};

export type TDownloadableFile = {
  name: string;
  url: string;
  fileExtension: TFileExtensions;
  size: number;
};

export type TFileExtensions =
  | "mp4"
  | "webm"
  | "jpg"
  | "png"
  | "gif"
  | "sticker"
  | "youtube";
