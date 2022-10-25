import * as https from "https";
import * as fs from "fs";
import { Choice } from "prompts";
const prompts = require("prompts");
const cliProgress = require("cli-progress");

const promptBoard = async (): Promise<string> => {
  const response = await prompts({
    type: "text",
    name: "board",
    message: "Board. Default is /b/",
    initial:'b'
  });
  return response.board;
};

const promptThreadNumber = async (): Promise<number> => {
  const response = await prompts({
    type: "number",
    name: "threadNumber",
    message: "Thread number",
  });
  return response.threadNumber;
};

const promptContinue = async (): Promise<boolean> => {
  const response = await prompts({
    type: "confirm",
    name: "value",
    message: "Continue?",
    initial: true,
  });
  return response.value;
};

const promptFileExtensions = async (
  arr: Array<{
    name: string;
    value: number;
  }>
): Promise<Array<TFileExtensions>> => {
  const fileTypes: Array<Choice> = [];
  arr.forEach((elem) => {
    fileTypes.push({ title: elem.name, value: elem.name });
  });
  const response = await prompts({
    type: "multiselect",
    name: "file_extensions",
    message: "Pick files",
    choices: fileTypes,
  });
  return response.file_extensions;
};

type TPost = {
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

type TDownloadableFile = {
  name: string;
  url: string;
  fileExtension: TFileExtensions;
  size: number;
};

type TFileExtensions =
  | "mp4"
  | "webm"
  | "jpg"
  | "png"
  | "gif"
  | "sticker"
  | "youtube";

const ORIG_URL = "https://2ch.hk";
let DOWNLOAD_FOLDER = "";

function getPosts(board: string, threadNumber: number): Promise<Array<TPost>> {
  return new Promise((resolve) => {
    https
      .get(`${ORIG_URL}/${board}/res/${threadNumber}.json`, (resp) => {
        console.log("Getting posts from the thread");
        let data = "";
        resp.on("data", (chunk) => {
          data += chunk;
        });
        resp.on("end", () => {
          try {
            const posts: Array<TPost> = JSON.parse(data).threads[0].posts;
            resolve(posts);
          } catch (error) {
            console.log(`Thread doesn't exist`);
            return;
          }
        });
      })
      .on("error", (err) => {
        throw new Error(err.message);
      });
  });
}

function downloadFile(url: string, filepath: string) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res
          .pipe(fs.createWriteStream(`${DOWNLOAD_FOLDER}/${filepath}`))
          .on("error", reject)
          .once("close", () => {
            resolve(filepath);
          });
      } else {
        res.resume();
        reject(
          new Error(`Request Failed With a Status Code: ${res.statusCode}`)
        );
      }
    });
  });
}

function getPostsWithFiles(postsArr: Array<TPost>): Array<TPost> {
  return postsArr.filter((post) => post.files !== null);
}

function getFileUrl(path: string): string {
  return `${ORIG_URL}${path}`;
}

function getExtension(fileName: string): TFileExtensions {
  const extension = fileName.split(".")[1];
  return extension as TFileExtensions;
}

function getListOfFiles(postsArr: Array<TPost>) {
  return postsArr.reduce((acc, value) => {
    value.files?.forEach((elem) => {
      acc.push(elem);
    });
    return acc;
  }, [] as Array<TPostFiles>);
}

function getListOfURLS(postsArr: Array<TPostFiles>) {
  return postsArr.reduce((acc, elem) => {
    acc.push({
      name: elem.name,
      url: getFileUrl(elem.path),
      fileExtension: getExtension(elem.name),
      size: elem.size,
    });
    return acc;
  }, [] as Array<TDownloadableFile>);
}

function filterExtensions(
  arr: Array<TDownloadableFile>,
  ext: Array<TFileExtensions>
): Array<TDownloadableFile> {
  const filtered: Array<TDownloadableFile> = [];
  ext.forEach((extension) => {
    const found = arr.filter((file) => file.fileExtension === extension);
    for (let i = 0; i < found.length; i++) {
      filtered.push(found[i]);
    }
  });
  return filtered;
}

function optimiseDownload(
  arr: Array<TDownloadableFile>
): Array<TDownloadableFile> {
  if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    return arr;
  }
  const foundInFolder = fs.readdirSync(DOWNLOAD_FOLDER);
  const optimised: Array<TDownloadableFile> = [];
  arr.forEach((elem) => {
    if (!foundInFolder.includes(elem.name)) optimised.push(elem);
  });
  return optimised;
}

function getAmountOfFiles(arr: Array<TDownloadableFile>) {
  const files = new Map<string, number>();
  arr.forEach((elem) => {
    if (files.has(elem.fileExtension)) {
      files.set(elem.fileExtension, files.get(elem.fileExtension)! + 1);
      return;
    }
    files.set(elem.fileExtension, 1);
    return;
  });
  return Array.from(files, ([name, value]) => ({ name, value }));
}

function getTotalFileSize(arr: Array<TDownloadableFile>) {
  return arr.reduce((acc, elem) => {
    acc += elem.size;
    return acc;
  }, 0);
}

async function startDownload(arr: Array<TDownloadableFile>): Promise<void> {
  if (arr.length === 0) {
    console.log("No matching files found");
    return;
  }

  if (!fs.existsSync(DOWNLOAD_FOLDER)) {
    fs.mkdirSync(DOWNLOAD_FOLDER);
  }

  const bar1 = new cliProgress.SingleBar(
    { format: " {bar} | {percentage}% | {filename} | {value}/{total}" },
    cliProgress.Presets.legacy
  );
  bar1.start(arr.length, 0, { filename: "N/A" });

  for (let i = 0; i < arr.length; i++) {
    // console.log(`Downloading ${i + 1} of ${arr.length}`);
    await downloadFile(arr[i].url, arr[i].name);
    bar1.update(i + 1, { filename: arr[i].name });
    // console.log(`Downloaded ${arr[i].name}`);
  }
  bar1.stop();
  console.log("Done");
}

async function main() {
  const boardName = await promptBoard()
  const threadNumber = await promptThreadNumber();
  DOWNLOAD_FOLDER = threadNumber.toString();
  const resp = await getPosts(boardName, threadNumber);
  const wFiles = getPostsWithFiles(resp);
  const files = getListOfFiles(wFiles);
  console.log(`${files.length} files in thread ${threadNumber}`);
  const filesURLS = getListOfURLS(files);
  const amountOfFiles = getAmountOfFiles(filesURLS);
  amountOfFiles.forEach((elem) => console.log(`${elem.name}: ${elem.value}`));
  const extensions = await promptFileExtensions(amountOfFiles);
  const filtered = filterExtensions(filesURLS, extensions);
  const optimised = optimiseDownload(filtered);
  const totalFileSize = getTotalFileSize(optimised);
  if (totalFileSize !== 0) {
    console.log(`Total size: ${(totalFileSize / 1024).toFixed(2)} MB`);
  }

  if (await promptContinue()) startDownload(optimised);
}

main();
