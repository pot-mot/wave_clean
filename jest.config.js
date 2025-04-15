import {fileURLToPath, URL} from "node:url";

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  transform: {
    "^.+\.tsx?$": ["ts-jest",{}],
  },
  moduleNameMapper: {
    "^@/(.*)$": fileURLToPath(new URL(`./src/$1`, import.meta.url)),
  },
};
