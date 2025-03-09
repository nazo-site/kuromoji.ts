/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, beforeAll, test, expect } from "vitest";

import CharacterClass from "../src/dictionary/CharacterClass";
import DynamicDictionaries from "../src/dictionary/DynamicDictionaries";
import FSDictionaryLoader from "../src/dictionary/loader/FSDictionaryLoader";

const DIC_DIR = "dict/";

describe("DictionaryLoader", () => {
  let dictionary: DynamicDictionaries; // target object

  beforeAll(async () => {
    const loader = new FSDictionaryLoader(DIC_DIR);
    dictionary = await loader.load();
  }, 5 * 60 * 1000);

  test("Unknown dictionaries are loaded properly", () => {
    expect(dictionary.unknownDictionary.lookup(" ")).toEqual<CharacterClass>({
      classId: 1,
      className: "SPACE",
      isAlwaysInvoke: false,
      isGrouping: true,
      maxLength: 0,
    });
  });
  test("TokenInfoDictionary is loaded properly", () => {
    expect(dictionary.tokenInfoDictionary.getFeatures("0").length).toBeGreaterThan(1);
  });
});

describe("DictionaryLoader about loading", () => {
  test("could load directory path without suffix /", async () => {
    const loader = new FSDictionaryLoader("dict"); // not have suffix /
    const dictionary = await loader.load();
    expect(dictionary).not.toBeUndefined();
  }, 5 * 60 * 1000);
  test("couldn't load dictionary, then call with error", async () => {
    const loader = new FSDictionaryLoader("non-exist/dictionaries");
    await expect(loader.load()).rejects.toThrow();
  });
});
