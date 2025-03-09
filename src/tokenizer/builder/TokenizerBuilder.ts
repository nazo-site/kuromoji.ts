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

import Tokenizer from "./../Tokenizer.ts";
import DictionaryLoader from "../../dictionary/loader/DictionaryLoader.ts";

export default class TokenizerBuilder {
  dictionaryLoader: DictionaryLoader;

  /**
   * @param {Object} option JSON object which have key-value pairs settings
   * @param {DictionaryLoader} option.dictionaryLoader Dictionary loader
   * @constructor
   */
  constructor({ dictionaryLoader }: { dictionaryLoader: DictionaryLoader }) {
    this.dictionaryLoader = dictionaryLoader;
  }

  /**
   * Build Tokenizer instance by asynchronous manner
   * @returns {Promise<Tokenizer>} Prepared Tokenizer
   */
  async build() {
    const dictionary = await this.dictionaryLoader.load();
    return new Tokenizer(dictionary);
  };
}
