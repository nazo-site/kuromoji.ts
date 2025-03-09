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

import { describe, test, expect, beforeAll } from "vitest";

import { buildFSTokenizer } from "../src/index";
import Tokenizer from "../src/tokenizer/Tokenizer";

const DIC_DIR = "dict/";

describe("Tokenizer static method test", () => {
  test("splitByPunctuation", () => {
    expect(Tokenizer.splitByPunctuation("すもももももももものうち"))
      .toEqual(["すもももももももものうち"]);
  });
  test("splitByPunctuation", () => {
    expect(Tokenizer.splitByPunctuation("、"))
      .toEqual(["、"]);
  });
  test("splitByPunctuation", () => {
    expect(Tokenizer.splitByPunctuation("。"))
      .toEqual(["。"]);
  });
  test("splitByPunctuation", () => {
    expect(Tokenizer.splitByPunctuation("すもも、も、もも。もも、も、もも。"))
      .toEqual(["すもも、", "も、", "もも。", "もも、", "も、", "もも。"]);
  });
  test("splitByPunctuation", () => {
    expect(Tokenizer.splitByPunctuation("、𠮷野屋。漢字。"))
      .toEqual(["、", "𠮷野屋。", "漢字。"]);
  });
});

describe("Tokenizer for IPADic", () => {
  let tokenizer: Tokenizer; // target object

  beforeAll(async () => {
    tokenizer = await buildFSTokenizer({ dictionaryPath: DIC_DIR });
    expect(tokenizer).toBeInstanceOf(Object);
  }, 5 * 60 * 1000);

  test("Sentence すもももももももものうち is tokenized properly", () => {
    const path = tokenizer.tokenize("すもももももももものうち");
    const expectedTokens = [{
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }];

    expect(path).toHaveLength(7);

    expectedTokens.forEach((expectedToken, index) => {
      const targetToken = path[index];
      for (const key in expectedToken) {
        expect(targetToken).toHaveProperty(key, expectedToken[key as keyof typeof expectedToken]);
      }
    });
  });
  test("Sentence include unknown words となりのトトロ are tokenized properly", () => {
    const path = tokenizer.tokenize("となりのトトロ");
    expect(path).toHaveLength(3);
  });
  test("研究 is not split", () => {
    const path = tokenizer.tokenize("研究");
    expect(path).toHaveLength(1);
  });
  test("Blank input", () => {
    const path = tokenizer.tokenize("");
    expect(path).toHaveLength(0);
  });
  test("Sentence include UTF-16 surrogate pair", () => {
    const path = tokenizer.tokenize("𠮷野屋");
    expect(path).toHaveLength(3);
    expect(path[0].wordPosition).toBe(1);
    expect(path[1].wordPosition).toBe(2);
    expect(path[2].wordPosition).toBe(3);
  });
  test("Sentence include punctuation あ、あ。あ、あ。 returns correct positions", () => {
    const path = tokenizer.tokenize("あ、あ。あ、あ。");
    expect(path).toHaveLength(8);
    expect(path[0].wordPosition).toBe(1);
    expect(path[1].wordPosition).toBe(2);
    expect(path[2].wordPosition).toBe(3);
    expect(path[3].wordPosition).toBe(4);
    expect(path[4].wordPosition).toBe(5);
    expect(path[5].wordPosition).toBe(6);
    expect(path[6].wordPosition).toBe(7);
    expect(path[7].wordPosition).toBe(8);
  });
});
