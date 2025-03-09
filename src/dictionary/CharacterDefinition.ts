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

import InvokeDefinitionMap from "./InvokeDefinitionMap.ts";
import CharacterClass from "./CharacterClass.ts";
import SurrogateAwareString from "../util/SurrogateAwareString.ts";

const DEFAULT_CATEGORY = "DEFAULT";

export type CategoryMapping = { start: number; end?: number; default: string; compatible: string[] }[];

export default class CharacterDefinition {
  characterCategoryMap: Uint8Array;
  compatibleCategoryMap: Uint32Array;
  invokeDefinitionMap: InvokeDefinitionMap;

  /**
   * CharacterDefinition represents char.def file and
   * defines behavior of unknown word processing
   * @constructor
   */
  constructor(catMapBuffer: Uint8Array | null, compatCatMapBuffer: Uint32Array | null, invokeDefinitionMap: InvokeDefinitionMap) {
    this.characterCategoryMap = catMapBuffer ?? new Uint8Array(65536);  // for all UCS2 code points
    this.compatibleCategoryMap = compatCatMapBuffer ?? new Uint32Array(65536);  // for all UCS2 code points
    this.invokeDefinitionMap = invokeDefinitionMap;
  }

  /**
   * Load CharacterDefinition
   * @param {Uint8Array} catMapBuffer
   * @param {Uint32Array} compatCatMapBuffer
   * @param {Uint8Array} invokeDefBuffer
   * @returns {CharacterDefinition}
   */
  static load(catMapBuffer: Uint8Array, compatCatMapBuffer: Uint32Array, invokeDefBuffer: Uint8Array) {
    return new CharacterDefinition(catMapBuffer, compatCatMapBuffer, InvokeDefinitionMap.load(invokeDefBuffer));
  }

  static parseCharCategory(classId: number, parsedCategoryDef: string[]) {
    const category = parsedCategoryDef[1];
    const invoke = parseInt(parsedCategoryDef[2]);
    const grouping = parseInt(parsedCategoryDef[3]);
    const maxLength = parseInt(parsedCategoryDef[4]);
    if (!isFinite(invoke) || (invoke !== 0 && invoke !== 1)) {
      throw "char.def parse error. INVOKE is 0 or 1 in:" + invoke;
    }
    if (!isFinite(grouping) || (grouping !== 0 && grouping !== 1)) {
      throw "char.def parse error. GROUP is 0 or 1 in:" + grouping;
    }
    if (!isFinite(maxLength) || maxLength < 0) {
      throw "char.def parse error. LENGTH is 1 to n:" + maxLength;
    }

    return new CharacterClass(classId, category, invoke === 1, grouping === 1, maxLength);
  }

  static parseCategoryMapping(parsedCategoryMapping: string[]) {
    const start = parseInt(parsedCategoryMapping[1]);
    const defaultCategory = parsedCategoryMapping[2];
    const compatibleCategory = parsedCategoryMapping.slice(3);
    if (!isFinite(start) || start < 0 || start > 0xFFFF) {
      throw "char.def parse error. CODE is invalid:" + start;
    }

    return { start, default: defaultCategory, compatible: compatibleCategory };
  }

  static parseRangeCategoryMapping(parsedCategoryMapping: string[]) {
    const start = parseInt(parsedCategoryMapping[1]);
    const end = parseInt(parsedCategoryMapping[2]);
    const defaultCategory = parsedCategoryMapping[3];
    const compatibleCategory = parsedCategoryMapping.slice(4);
    if (!isFinite(start) || start < 0 || start > 0xFFFF) {
      throw "char.def parse error. CODE is invalid:" + start;
    }
    if (!isFinite(end) || end < 0 || end > 0xFFFF) {
      throw "char.def parse error. CODE is invalid:" + end;
    }
    return { start, end, default: defaultCategory, compatible: compatibleCategory };
  }

  /**
   * Initializing method
   * @param {Array} categoryMapping Array of category mapping
   */
  initCategoryMappings(categoryMapping: CategoryMapping) {
    // Initialize map by DEFAULT class
    categoryMapping.forEach((mapping) => {
      const end = mapping.end || mapping.start;
      for (let i = mapping.start; i <= end; i++) {
        // Default Category class ID
        this.characterCategoryMap[i] = this.invokeDefinitionMap.lookup(mapping.default);

        mapping.compatible.forEach((compatibleCategory) => {
          if (compatibleCategory === null || compatibleCategory === undefined) {
            return;
          }

          // Default Category
          const classId = this.invokeDefinitionMap.lookup(compatibleCategory);
          if (classId === null || classId === undefined) {
            return;
          }

          // Set a bit of class ID 例えば、class_idが3のとき、3ビット目に1を立てる
          this.compatibleCategoryMap[i] |= (1 << classId);
        });
      }
    });

    const defaultId = this.invokeDefinitionMap.lookup(DEFAULT_CATEGORY);
    if (defaultId === null || defaultId === undefined) {
      return;
    }
    for (let i = 0; i < this.characterCategoryMap.length; i++) {
      // 他に何のクラスも定義されていなかったときだけ DEFAULT class ID に対応するビットだけ1を立てる
      if (this.characterCategoryMap[i] === 0) {
        this.characterCategoryMap[i] = 1 << defaultId;
      }
    }
  }

  /**
   * Lookup compatible categories for a character (not included 1st category)
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {Array.<CharacterClass>} character classes
   */
  lookupCompatibleCategory(ch: string) {
    /*
      if (SurrogateAwareString.isSurrogatePair(ch)) {
        // Surrogate pair character codes can not be defined by char.def
        return [];
      }
     */
    const code = ch.charCodeAt(0);
    const integer = this.compatibleCategoryMap[code]; // Bitset
    if (integer === undefined || integer === 0) {
      return [];
    }

    const classes: CharacterClass[] = [];
    for (let bit = 0; bit < 32; bit++) {  // Treat "bit" as a class ID
      // if (((integer << (31 - bit)) >>> 31) === 1) {
      if (integer & (1 << bit)) {
        const characterClass = this.invokeDefinitionMap.getCharacterClass(bit);
        if (characterClass !== null) {
          classes.push(characterClass);
        }
      }
    }
    return classes;
  }

  /**
   * Lookup category for a character
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {CharacterClass} character class
   */
  lookup(ch: string) {
    const code = ch.charCodeAt(0);
    const classId = SurrogateAwareString.isSurrogatePair(ch)
      // Surrogate pair character codes can not be defined by char.def, so set DEFAULT category
      ? this.invokeDefinitionMap.lookup(DEFAULT_CATEGORY)
      : (((code < this.characterCategoryMap.length) ? this.characterCategoryMap[code] : undefined) ?? this.invokeDefinitionMap.lookup(DEFAULT_CATEGORY));

    return this.invokeDefinitionMap.getCharacterClass(classId);
  }
}
