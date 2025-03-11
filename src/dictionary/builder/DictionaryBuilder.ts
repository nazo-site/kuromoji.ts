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

import DynamicDictionaries from "../DynamicDictionaries.ts";
import TokenInfoDictionary from "../TokenInfoDictionary.ts";
import ConnectionCostsBuilder from "./ConnectionCostsBuilder.ts";
import CharacterDefinitionBuilder from "./CharacterDefinitionBuilder.ts";
import UnknownDictionary from "../UnknownDictionary.ts";
import { builder as doubleArrayBuilder } from "../../util/DoubleArray.ts";

export default class DictionaryBuilder {
  tidEntries: string[][];
  unkEntries: string[][];
  ccBuilder: ConnectionCostsBuilder;
  cdBuilder: CharacterDefinitionBuilder;

  /**
   * Build dictionaries (token info, connection costs)
   *
   * Generates from matrix.def
   * cc.dat: Connection costs
   *
   * Generates from *.csv
   * dat.dat: Double array
   * tid.dat: Token info dictionary
   * tid_map.dat: targetMap
   * tid_pos.dat: posList (part of speech)
   */
  constructor() {
    // Array of entries, each entry in Mecab form
    // (0: surface form, 1: left id, 2: right id, 3: word cost, 4: part of speech id, 5-: other features)
    this.tidEntries = [];
    this.unkEntries = [];
    this.ccBuilder = new ConnectionCostsBuilder();
    this.cdBuilder = new CharacterDefinitionBuilder();
  }

  addTokenInfoDictionary(line: string) {
    this.tidEntries.push(line.split(","));
    return this;
  }

  /**
   * Put one line of "matrix.def" file for building ConnectionCosts object
   * @param {string} line is a line of "matrix.def"
   */
  putCostMatrixLine(line: string) {
    this.ccBuilder.putLine(line);
    return this;
  }

  /**
   * Put one line of "char.def" file for building CharacterDefinition object
   * @param {string} line is a line of "char.def"
   */
  putCharDefLine(line: string) {
    this.cdBuilder.putLine(line);
    return this;
  }

  /**
   * Put one line of "unk.def" file for building UnknownDictionary object
   * @param {string} line is a line of "unk.def"
   */
  putUnkDefLine(line: string) {
    this.unkEntries.push(line.split(","));
    return this;
  }

  build() {
    const { trie, tokenInfoDictionary } = this.buildTokenInfoDictionary();
    const connectionCosts = this.ccBuilder.build();
    const unknownDictionary = this.buildUnknownDictionary();

    return new DynamicDictionaries(trie, tokenInfoDictionary, connectionCosts, unknownDictionary);
  };

  /**
   * Build TokenInfoDictionary
   *
   * @returns {{trie: *, tokenInfoDictionary: *}}
   */
  buildTokenInfoDictionary() {
    const tokenInfoDictionary = new TokenInfoDictionary();

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    const dictionaryEntries = tokenInfoDictionary.buildDictionary(this.tidEntries);

    const trie = this.buildDoubleArray();

    Object.entries(dictionaryEntries).forEach(([tokenInfoId, surfaceForm]) => {
      const trieId = trie.lookup(surfaceForm);
      if (trieId < 0) {
        throw "Not Found: " + surfaceForm;
      }

      tokenInfoDictionary.addMapping(trieId, parseInt(tokenInfoId));
    });

    return { trie, tokenInfoDictionary };
  }

  buildUnknownDictionary() {
    const unkDictionary = new UnknownDictionary();

    // using as hashmap, string -> string (word_id -> surface_form) to build dictionary
    const dictionaryEntries = unkDictionary.buildDictionary(this.unkEntries);

    const charDef = this.cdBuilder.build(); // Create CharacterDefinition

    unkDictionary.setCharacterDefinition(charDef);

    Object.entries(dictionaryEntries).forEach(([tokenInfoId, className]) => {
      const classId = charDef.invokeDefinitionMap?.lookup(className);

      if (classId === null || classId === undefined || classId < 0) {
        throw "Not Found: " + className;
      }

      unkDictionary.addMapping(classId, parseInt(tokenInfoId));
    });

    return unkDictionary;
  }

  /**
   * Build double array trie
   *
   * @returns {DoubleArray} Double-Array trie
   */
  buildDoubleArray() {
    const words = this.tidEntries.map((entry, trieId) => ({ k: entry[0], v: trieId }));

    const builder = doubleArrayBuilder(1024 * 1024);
    return builder.build(words);
  };
}
