import prompts from "prompts";
import { TFileExtensions } from "./interfaces";

export const promptBoard = async (): Promise<string> => {
  const response = await prompts({
    type: "text",
    name: "board",
    message: "Board. Default is /b/",
    initial: "b",
  });
  return response.board;
};

export const promptThreadNumber = async (): Promise<number> => {
  const response = await prompts({
    type: "number",
    name: "threadNumber",
    message: "Thread number",
  });
  return response.threadNumber;
};

export const promptContinue = async (): Promise<boolean> => {
  const response = await prompts({
    type: "confirm",
    name: "value",
    message: "Continue?",
    initial: true,
  });
  return response.value;
};

export const promptFileExtensions = async (
  arr: Array<{
    name: string;
    value: number;
  }>
): Promise<Array<TFileExtensions>> => {
  const fileTypes: Array<prompts.Choice> = [];
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
