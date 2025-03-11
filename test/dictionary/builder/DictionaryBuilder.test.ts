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

import { readFileSync } from "fs";

import { dictionaryBuilder } from "../../../src/index";
import Tokenizer from "../../../src/tokenizer/Tokenizer";
import DynamicDictionaries from "../../../src/dictionary/DynamicDictionaries";

const DIC_DIR = "test/resource/minimum-dic/";
const CONNECTION_COSTS_FILE = DIC_DIR + "matrix.def";
const CHAR_DEF_FILE = DIC_DIR + "char.def";
const UNK_DEF_FILE = DIC_DIR + "unk.def";
const TID_DIC_FILE = DIC_DIR + "minimum.csv";

describe("DictionaryBuilder", () => {
  let dictionary: DynamicDictionaries; // target object of DynamicDictionaries to build

  beforeAll(() => {
    const builder = dictionaryBuilder();

    // Build token info dictionary
    const tokenInfo = readFileSync(TID_DIC_FILE, "utf-8");
    tokenInfo.split("\n").forEach((line) => {
      builder.addTokenInfoDictionary(line);
    });

    // Build connection costs matrix
    const ccText = readFileSync(CONNECTION_COSTS_FILE, "ascii");
    ccText.split("\n").forEach((line) => {
      builder.putCostMatrixLine(line);
    });

    // Build unknown dictionary
    const cdText = readFileSync(CHAR_DEF_FILE, "utf-8");
    cdText.split("\n").forEach((line) => {
      builder.putCharDefLine(line);
    });

    const unkText = readFileSync(UNK_DEF_FILE, "utf-8");
    unkText.split("\n").forEach((line) => {
      builder.putUnkDefLine(line);
    });

    dictionary = builder.build();
  }, 30 * 1000);

  test("Dictionary not to be null", () => {
    expect(dictionary).not.toBeNull();
  });
  test("TokenInfoDictionary not to be null", () => {
    expect(dictionary.tokenInfoDictionary).not.toBeNull();
  });
  test("TokenInfoDictionary", () => {
    // expect(dictionary.tokenInfoDictionary.getFeatures("1467000")).to.have.length.above(1);
    expect(dictionary.tokenInfoDictionary.dictionary.buffer.length).toBeGreaterThan(1);
  });
  test("DoubleArray not to be null", () => {
    expect(dictionary.trie).not.toBeNull();
  });
  test("ConnectionCosts not to be null", () => {
    expect(dictionary.connectionCosts).not.toBeNull();
  });
  test("Tokenize simple test", () => {
    const tokenizer = new Tokenizer(dictionary);
    const path = tokenizer.tokenize("すもももももももものうち");

    const expectedTokens = [
      {
        wordType: "KNOWN",
        wordPosition: 1,
        surfaceForm: "すもも",
        pos: "名詞",
        posDetail1: "一般",
        posDetail2: "*",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "すもも",
        reading: "スモモ",
        pronunciation: "スモモ",
      },
      {
        wordType: "KNOWN",
        wordPosition: 4,
        surfaceForm: "も",
        pos: "助詞",
        posDetail1: "係助詞",
        posDetail2: "*",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "も",
        reading: "モ",
        pronunciation: "モ",
      },
      {
        wordType: "KNOWN",
        wordPosition: 5,
        surfaceForm: "もも",
        pos: "名詞",
        posDetail1: "一般",
        posDetail2: "*",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "もも",
        reading: "モモ",
        pronunciation: "モモ",
      },
      {
        wordType: "KNOWN",
        wordPosition: 7,
        surfaceForm: "も",
        pos: "助詞",
        posDetail1: "係助詞",
        posDetail2: "*",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "も",
        reading: "モ",
        pronunciation: "モ",
      },
      {
        wordType: "KNOWN",
        wordPosition: 8,
        surfaceForm: "もも",
        pos: "名詞",
        posDetail1: "一般",
        posDetail2: "*",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "もも",
        reading: "モモ",
        pronunciation: "モモ",
      },
      {
        wordType: "KNOWN",
        wordPosition: 10,
        surfaceForm: "の",
        pos: "助詞",
        posDetail1: "連体化",
        posDetail2: "*",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "の",
        reading: "ノ",
        pronunciation: "ノ",
      },
      {
        wordType: "KNOWN",
        wordPosition: 11,
        surfaceForm: "うち",
        pos: "名詞",
        posDetail1: "非自立",
        posDetail2: "副詞可能",
        posDetail3: "*",
        conjugatedType: "*",
        conjugatedForm: "*",
        basicForm: "うち",
        reading: "ウチ",
        pronunciation: "ウチ",
      },
    ];

    expect(path).toHaveLength(7);

    expectedTokens.forEach((expectedToken, index) => {
      const targetToken = path[index];
      for (const key in expectedToken) {
        expect(targetToken).toHaveProperty(key, expectedToken[key as keyof typeof expectedToken]);
      }
    });
  });
});
