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
import CharacterClass from "./CharacterClass.ts";

export default class InvokeDefinitionMap {
  map: CharacterClass[];
  lookupTable: Record<string, number>;

  /**
   * InvokeDefinitionMap represents invoke definition a part of char.def
   * @constructor
   */
  constructor() {
    this.map = [];
    this.lookupTable = {};  // Just for building dictionary
  }

  /**
   * Load InvokeDefinitionMap from buffer
   * @param {Uint8Array} invokeDefBuffer
   * @returns {InvokeDefinitionMap}
   */
  static load(invokeDefBuffer: Uint8Array) {
    const invokeDef = new InvokeDefinitionMap();
    const characterCategoryDefinition: CharacterClass[] = [];

    const buffer = new ByteBuffer(invokeDefBuffer);
    while (buffer.position + 1 < buffer.size()) {
      const classId = characterCategoryDefinition.length;
      const isAlwaysInvoke = Boolean(buffer.get());
      const isGrouping = Boolean(buffer.get());
      const maxLength = buffer.getInt();
      const className = buffer.getString();
      characterCategoryDefinition.push(new CharacterClass(classId, className, isAlwaysInvoke, isGrouping, maxLength));
    }

    invokeDef.init(characterCategoryDefinition);

    return invokeDef;
  }

  /**
   * Initializing method
   * @param {Array.<CharacterClass>} characterCategoryDefinition Array of CharacterClass
   */
  init(characterCategoryDefinition: CharacterClass[] | null) {
    characterCategoryDefinition?.forEach((characterClass, index) => {
      this.map[index] = characterClass;
      this.lookupTable[characterClass.className] = index;
    });
  }

  /**
   * Get class information by class ID
   * @param {number} classId
   * @returns {CharacterClass}
   */
  getCharacterClass(classId: number) {
    return this.map[classId];
  }

  /**
   * For building character definition dictionary
   * @param {string} className character
   * @returns {number} classId
   */
  lookup(className: string) {
    return this.lookupTable[className];
  }

  /**
   * Transform from map to binary buffer
   * @returns {Uint8Array}
   */
  toBuffer() {
    const buffer = new ByteBuffer();
    this.map.forEach((charClass) => {
      buffer.put(charClass.isAlwaysInvoke ? 1 : 0);
      buffer.put(charClass.isGrouping ? 1 : 0);
      buffer.putInt(charClass.maxLength);
      buffer.putString(charClass.className);
    });
    buffer.shrink();
    return buffer.buffer;
  }
}
