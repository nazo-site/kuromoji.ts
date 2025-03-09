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

import DynamicDictionaries from "./dict/../../DynamicDictionaries.ts";

export default abstract class DictionaryLoader {
  dic: DynamicDictionaries;
  dictionaryPath: string;

  /**
   * DictionaryLoader base constructor
   * @param {string} dictionaryPath Dictionary path
   * @constructor
   */
  constructor(dictionaryPath: string) {
    this.dic = new DynamicDictionaries(null, null, null, null);
    this.dictionaryPath = dictionaryPath;
  }

  abstract loadArrayBuffer(_fileName: string): Promise<ArrayBuffer>;

  /**
   * Load dictionary files
   * @returns {Promise<DynamicDictionaries>} Loaded dictionary
   */
  async load() {
    await Promise.all([
      // Trie
      (async () => {
        const buffers = await Promise.all(["base.dat.gz", "check.dat.gz"].map((fileName) => this.loadArrayBuffer(fileName)));
        const baseBuffer = new Int32Array(buffers[0]);
        const checkBuffer = new Int32Array(buffers[1]);

        this.dic.loadTrie(baseBuffer, checkBuffer);
      })(),
      // Token info dictionaries
      (async () => {
        const buffers = await Promise.all(["tid.dat.gz", "tid_pos.dat.gz", "tid_map.dat.gz"].map((fileName) => this.loadArrayBuffer(fileName)));
        const tokenInfoBuffer = new Uint8Array(buffers[0]);
        const posBuffer = new Uint8Array(buffers[1]);
        const targetMapBuffer = new Uint8Array(buffers[2]);

        this.dic.loadTokenInfoDictionaries(tokenInfoBuffer, posBuffer, targetMapBuffer);
      })(),
      // Connection cost matrix
      (async () => {
        const buffer = await this.loadArrayBuffer("cc.dat.gz");
        const ccBuffer = new Int16Array(buffer);

        this.dic.loadConnectionCosts(ccBuffer);
      })(),
      // Unknown dictionaries
      (async () => {
        const buffers = await Promise.all(["unk.dat.gz", "unk_pos.dat.gz", "unk_map.dat.gz", "unk_char.dat.gz", "unk_compat.dat.gz", "unk_invoke.dat.gz"].map((fileName) => this.loadArrayBuffer(fileName)));
        const unkBuffer = new Uint8Array(buffers[0]);
        const unkPosBuffer = new Uint8Array(buffers[1]);
        const unkMapBuffer = new Uint8Array(buffers[2]);
        const catMapBuffer = new Uint8Array(buffers[3]);
        const compatCatMapBuffer = new Uint32Array(buffers[4]);
        const invokeDefBuffer = new Uint8Array(buffers[5]);

        this.dic.loadUnknownDictionaries(unkBuffer, unkPosBuffer, unkMapBuffer, catMapBuffer, compatCatMapBuffer, invokeDefBuffer);
        // dic.loadUnknownDictionaries(charBuffer, unkBuffer);
      })(),
    ]);

    return this.dic;
  };
}
