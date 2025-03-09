/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
 * Copyright 2025 @nazo-site
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

"use strict";

export type Token = {
  wordId: number;
  wordType: string;
  wordPosition: number;
  surfaceForm: string;
  pos: string;
  posDetail1: string;
  posDetail2: string;
  posDetail3: string;
  conjugatedType: string;
  conjugatedForm: string;
  basicForm: string;
  reading?: string;
  pronunciation?: string;
};

export default class IpadicFormatter {
  formatEntry(wordId: number, wordPosition: number, wordType: string, features: string[]) {
    return {
      wordId,
      wordType,
      wordPosition,

      surfaceForm: features[0],
      pos: features[1],
      posDetail1: features[2],
      posDetail2: features[3],
      posDetail3: features[4],
      conjugatedType: features[5],
      conjugatedForm: features[6],
      basicForm: features[7],
      reading: features[8],
      pronunciation: features[9],
    };
  };

  formatUnknownEntry(wordId: number, wordPosition: number, wordType: string, features: string[], surfaceForm: string) {
    return {
      wordId,
      wordType,
      wordPosition,

      surfaceForm,
      pos: features[1],
      posDetail1: features[2],
      posDetail2: features[3],
      posDetail3: features[4],
      conjugatedType: features[5],
      conjugatedForm: features[6],
      basicForm: features[7],
      // reading: features[8],
      // pronunciation: features[9],
    };
  };
}
