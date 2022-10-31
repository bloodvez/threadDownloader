import { Presets, SingleBar } from "cli-progress";
export const progressBar = new SingleBar(
  { format: " {bar} | {percentage}% | {filename} | {value}/{total}" },
  Presets.legacy
);
