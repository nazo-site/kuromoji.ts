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

import TokenizerBuilder from "./TokenizerBuilder.ts";
import FSDictionaryLoader from "../../dictionary/loader/FSDictionaryLoader.ts";

export class FSTokenizerBuilder extends TokenizerBuilder {
  /**
   * @param {Object} option JSON object which have key-value pairs settings
   * @param {string} dictionaryPath Dictionary path
   * @constructor
   */
  constructor({ dictionaryPath }: { dictionaryPath: string }) {
    super({ dictionaryLoader: new FSDictionaryLoader(dictionaryPath) });
  }
}
