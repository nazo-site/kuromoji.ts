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
import CharacterDefinition from "./CharacterDefinition.ts";
import ByteBuffer from "../util/ByteBuffer.ts";

export default class UnknownDictionary extends TokenInfoDictionary {
  characterDefinition: CharacterDefinition | null;

  /**
   * UnknownDictionary
   * @constructor
   */
  constructor() {
    super();

    this.dictionary = new ByteBuffer(10 * 1024 * 1024);
    this.targetMap = {};  // class_id (of CharacterClass) -> token_info_id (of unknown class)
    this.posBuffer = new ByteBuffer(10 * 1024 * 1024);
    this.characterDefinition = null;
  }

  setCharacterDefinition(characterDefinition: CharacterDefinition) {
    this.characterDefinition = characterDefinition;
    return this;
  };

  lookup(ch: string) {
    return this.characterDefinition?.lookup(ch);
  };

  lookupCompatibleCategory(ch: string) {
    return this.characterDefinition?.lookupCompatibleCategory(ch);
  };

  loadUnknownDictionaries(unkBuffer: Uint8Array, unkPosBuffer: Uint8Array, unkMapBuffer: Uint8Array, catMapBuffer: Uint8Array, compatCatMapBuffer: Uint32Array, invokeDefBuffer: Uint8Array) {
    this.loadDictionary(unkBuffer);
    this.loadPosVector(unkPosBuffer);
    this.loadTargetMap(unkMapBuffer);
    this.characterDefinition = CharacterDefinition.load(catMapBuffer, compatCatMapBuffer, invokeDefBuffer);
  };
}
