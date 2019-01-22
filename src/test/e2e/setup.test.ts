import * as path from "path";
import * as fs from "fs-extra";

export const TEST_TEMP_PATH = path.join(__dirname, "../../../", ".tmp");

export const e2eSetup = () => {
  beforeEach(() => {
    fs.emptyDirSync(TEST_TEMP_PATH);
  });

  after(() => {
    fs.removeSync(TEST_TEMP_PATH);
  });
};
