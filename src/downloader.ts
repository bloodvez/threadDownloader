import https from "https";
import fs from "fs";
import {
  TDownloadableFile,
  TFileExtensions,
  TPost,
  TPostFiles,
} from "./interfaces";
import {
  promptBoard,
  promptContinue,
  promptFileExtensions,
  promptThreadNumber,
} from "./prompts";
import { progressBar } from "./progress-bar";

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
  progressBar.start(arr.length, 0, { filename: "N/A" });

  for (let i = 0; i < arr.length; i++) {
    await downloadFile(arr[i].url, arr[i].name);
    progressBar.update(i + 1, { filename: arr[i].name });
  }
  progressBar.stop();
  console.log("Done");
}

export async function main() {
  // Get the board name via prompt. Default is /b/ 
  const boardName = await promptBoard();
  // Get thread number via prompt.
  const threadNumber = await promptThreadNumber();
  // We downoad files into directory named same as thead number.
  DOWNLOAD_FOLDER = threadNumber.toString();
  // Fetching posts.
  const resp = await getPosts(boardName, threadNumber);
  // Filter out posts with files.
  const wFiles = getPostsWithFiles(resp);
  // Since posts can have more than one file,
  // we combine all them files into single array.
  const files = getListOfFiles(wFiles);
  console.log(`${files.length} files in thread ${threadNumber}`);
  // Creating array of URLs to download.
  const filesURLS = getListOfURLS(files);
  // Calculating how many individual files we have.
  // jpg: 10, png: 7 ... etc
  const amountOfFiles = getAmountOfFiles(filesURLS);
  amountOfFiles.forEach((elem) => console.log(`${elem.name}: ${elem.value}`));
  // Getting file extensions that we want to download.
  const extensions = await promptFileExtensions(amountOfFiles);
  // Filtering URLs to include ones with needed extension.
  const filtered = filterExtensions(filesURLS, extensions);
  // Filter files that already exist in the download folder
  // so we can skip them.
  const optimised = optimiseDownload(filtered);
  // Calculate the size of selected files
  const totalFileSize = getTotalFileSize(optimised);
  if (totalFileSize !== 0) {
    console.log(`Total size: ${(totalFileSize / 1024).toFixed(2)} MB`);
  }

  if (await promptContinue()) startDownload(optimised);
}
