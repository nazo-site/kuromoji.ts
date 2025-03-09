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

import ByteBuffer from "../util/ByteBuffer.ts";

export default class TokenInfoDictionary {
  dictionary: ByteBuffer;
  targetMap: Record<number, number[]>;
  posBuffer: ByteBuffer;

  /**
   * TokenInfoDictionary
   * @constructor
   */
  constructor() {
    this.dictionary = new ByteBuffer(10 * 1024 * 1024);
    this.targetMap = {};  // trie_id (of surface form) -> token_info_id (of token)
    this.posBuffer = new ByteBuffer(10 * 1024 * 1024);
  }

  // left_id right_id word_cost ...
  // ^ this position is token_info_id
  buildDictionary(entries: string[][]) {
    const dictionaryEntries: Record<number, string> = {}; // using as hashmap, string -> string (word_id -> surface_form) to build dictionary

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      if (entry.length < 4) {
        continue;
      }

      const surfaceForm = entry[0];
      const leftId = Number(entry[1]);
      const rightId = Number(entry[2]);
      const wordCost = Number(entry[3]);
      const feature = entry.slice(4).join(","); // TODO Optimize

      // Assertion
      if (!isFinite(leftId) || !isFinite(rightId) || !isFinite(wordCost)) {
        throw entry;
      }

      const tokenInfoId = this.put(leftId, rightId, wordCost, surfaceForm, feature);
      dictionaryEntries[tokenInfoId] = surfaceForm;
    }

    // Remove last unused area
    this.dictionary.shrink();
    this.posBuffer.shrink();

    return dictionaryEntries;
  }

  put(leftId: number, rightId: number, wordCost: number, surfaceForm: string, feature: string) {
    const tokenInfoId = this.dictionary.position;
    const posId = this.posBuffer.position;

    this.dictionary.putShort(leftId);
    this.dictionary.putShort(rightId);
    this.dictionary.putShort(wordCost);
    this.dictionary.putInt(posId);
    this.posBuffer.putString(surfaceForm + "," + feature);

    return tokenInfoId;
  }

  addMapping(source: number, target: number) {
    this.targetMap[source] ??= [];
    this.targetMap[source].push(target);
  }

  targetMapToBuffer() {
    const buffer = new ByteBuffer();
    const mapKeysSize = Object.keys(this.targetMap).length;
    buffer.putInt(mapKeysSize);
    Object.entries(this.targetMap).forEach(([key, values]) => {
      const mapValuesSize = values.length;
      buffer.putInt(parseInt(key));
      buffer.putInt(mapValuesSize);
      values.forEach((value) => {
        buffer.putInt(value);
      });
    });
    return buffer.shrink(); // Shrink-ed Typed Array
  }

  // from tid.dat
  loadDictionary(arrayBuffer: Uint8Array) {
    this.dictionary = new ByteBuffer(arrayBuffer);
    return this;
  }

  // from tid_pos.dat
  loadPosVector(arrayBuffer: Uint8Array) {
    this.posBuffer = new ByteBuffer(arrayBuffer);
    return this;
  }

  // from tid_map.dat
  loadTargetMap(arrayBuffer: Uint8Array) {
    const buffer = new ByteBuffer(arrayBuffer);
    buffer.position = 0;
    this.targetMap = {};
    buffer.readInt(); // map_keys_size
    while (true) {
      if (buffer.buffer.length < buffer.position + 1) {
        break;
      }
      const key = buffer.readInt();
      const mapValuesSize = buffer.readInt();
      for (let i = 0; i < mapValuesSize; i++) {
        this.addMapping(key, buffer.readInt());
      }
    }
    return this;
  }

  /**
   * Look up features in the dictionary
   * @param {string} tokenInfoIdStr Word ID to look up
   * @returns {string} Features string concatenated by ","
   */
  getFeatures(tokenInfoIdStr: string) {
    const tokenInfoId = parseInt(tokenInfoIdStr);
    if (isNaN(tokenInfoId)) {
      throw tokenInfoIdStr + " is invalid token info ID.";
    }
    const posId = this.dictionary.getInt(tokenInfoId + 6);
    return this.posBuffer.getString(posId);
  }
}
