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

import DynamicDictionaries from "../dictionary/DynamicDictionaries.ts";
import TokenInfoDictionary from "../dictionary/TokenInfoDictionary.ts";
import UnknownDictionary from "../dictionary/UnknownDictionary.ts";
import ViterbiNode from "./ViterbiNode.ts";
import ViterbiLattice from "./ViterbiLattice.ts";
import { DoubleArray } from "../util/DoubleArray.ts";
import SurrogateAwareString from "../util/SurrogateAwareString.ts";

export default class ViterbiBuilder {
  trie: DoubleArray;
  tokenInfoDictionary: TokenInfoDictionary;
  unknownDictionary: UnknownDictionary;

  /**
   * ViterbiBuilder builds word lattice (ViterbiLattice)
   * @param {DynamicDictionaries} dic dictionary
   * @constructor
   */
  constructor(dic: DynamicDictionaries) {
    this.trie = dic.trie;
    this.tokenInfoDictionary = dic.tokenInfoDictionary;
    this.unknownDictionary = dic.unknownDictionary;
  }

  /**
   * Build word lattice
   * @param {string} sentenceStr Input text
   * @returns {ViterbiLattice} Word lattice
   */
  build(sentenceStr: string) {
    const lattice = new ViterbiLattice();
    const sentence = new SurrogateAwareString(sentenceStr);

    for (let pos = 0; pos < sentence.length; pos++) {
      const tail = sentence.slice(pos);
      const vocabulary = this.trie.commonPrefixSearch(tail);
      vocabulary.forEach(({ v: trieId, k: key }) => { // Words in dictionary do not have surrogate pair (only UCS2 set)
        if (trieId === undefined) {
          return;
        }

        const tokenInfoIds = this.tokenInfoDictionary.targetMap[trieId];
        tokenInfoIds.forEach((tokenInfoId) => {
          const leftId = this.tokenInfoDictionary.dictionary.getShort(tokenInfoId);
          const rightId = this.tokenInfoDictionary.dictionary.getShort(tokenInfoId + 2);
          const wordCost = this.tokenInfoDictionary.dictionary.getShort(tokenInfoId + 4);

          // nodeName, cost, startPos, length, type, leftId, rightId, surfaceForm
          lattice.append(new ViterbiNode(tokenInfoId.toString(), wordCost, pos + 1, key.length, "KNOWN", leftId, rightId, key));
        });
      });

      // Unknown word processing
      const surrogateAwareTail = new SurrogateAwareString(tail);
      const headChar = new SurrogateAwareString(surrogateAwareTail.charAt(0));
      const headCharClass = this.unknownDictionary.lookup(headChar.toString());
      if (!headCharClass) {
        continue;
      }
      if (vocabulary === null || vocabulary.length === 0 || headCharClass.isAlwaysInvoke) {
        // Process unknown word
        let key = headChar;
        if (headCharClass.isGrouping && 1 < surrogateAwareTail.length) {
          for (let k = 1; k < surrogateAwareTail.length; k++) {
            const nextChar = surrogateAwareTail.charAt(k);
            const nextCharClass = this.unknownDictionary.lookup(nextChar);
            if (headCharClass.className !== nextCharClass?.className) {
              break;
            }
            key = new SurrogateAwareString(key + nextChar);
          }
        }

        const unkIds = this.unknownDictionary.targetMap[headCharClass.classId];
        unkIds.forEach((unkId) => {
          const leftId = this.unknownDictionary.dictionary.getShort(unkId);
          const rightId = this.unknownDictionary.dictionary.getShort(unkId + 2);
          const wordCost = this.unknownDictionary.dictionary.getShort(unkId + 4);

          // nodeName, cost, startPos, length, type, leftId, rightId, surfaceForm
          lattice.append(new ViterbiNode(unkId.toString(), wordCost, pos + 1, key.length, "UNKNOWN", leftId, rightId, key.toString()));
        });
      }
    }
    lattice.appendEos();

    return lattice;
  }
}
