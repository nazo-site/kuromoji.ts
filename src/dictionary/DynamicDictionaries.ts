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

import TokenInfoDictionary from "./TokenInfoDictionary.ts";
import ConnectionCosts from "./ConnectionCosts.ts";
import UnknownDictionary from "./UnknownDictionary.ts";
import { DoubleArray, builder as doubleArrayBuilder, load as loadDoubleArray } from "../util/DoubleArray.ts";

export default class DynamicDictionaries {
  trie: DoubleArray;
  tokenInfoDictionary: TokenInfoDictionary;
  connectionCosts: ConnectionCosts;
  unknownDictionary: UnknownDictionary;

  /**
   * Dictionaries container for Tokenizer
   * @param {DoubleArray} trie
   * @param {TokenInfoDictionary} tokenInfoDictionary
   * @param {ConnectionCosts} connectionCosts
   * @param {UnknownDictionary} unknownDictionary
   * @constructor
   */
  constructor(trie: DoubleArray | null, tokenInfoDictionary: TokenInfoDictionary | null, connectionCosts: ConnectionCosts | null, unknownDictionary: UnknownDictionary | null) {
    this.trie = trie ?? doubleArrayBuilder(0).build([{ k: "", v: 1 }]);

    this.tokenInfoDictionary = tokenInfoDictionary ?? new TokenInfoDictionary();

    this.connectionCosts = connectionCosts ?? new ConnectionCosts(0, 0);

    this.unknownDictionary = unknownDictionary ?? new UnknownDictionary();
  }

  // from base.dat & check.dat
  loadTrie(baseBuffer: Int32Array, checkBuffer: Int32Array) {
    this.trie = loadDoubleArray(baseBuffer, checkBuffer);
    return this;
  }

  loadTokenInfoDictionaries(tokenInfoBuffer: Uint8Array, posBuffer: Uint8Array, targetMapBuffer: Uint8Array) {
    this.tokenInfoDictionary.loadDictionary(tokenInfoBuffer);
    this.tokenInfoDictionary.loadPosVector(posBuffer);
    this.tokenInfoDictionary.loadTargetMap(targetMapBuffer);
    return this;
  }

  loadConnectionCosts(ccBuffer: Int16Array) {
    this.connectionCosts.loadConnectionCosts(ccBuffer);
    return this;
  }

  loadUnknownDictionaries(unkBuffer: Uint8Array, unkPosBuffer: Uint8Array, unkMapBuffer: Uint8Array, catMapBuffer: Uint8Array, compatCatMapBuffer: Uint32Array, invokeDefBuffer: Uint8Array) {
    this.unknownDictionary.loadUnknownDictionaries(unkBuffer, unkPosBuffer, unkMapBuffer, catMapBuffer, compatCatMapBuffer, invokeDefBuffer);
    return this;
  }
}
