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

import CharacterClass from "../CharacterClass.ts";
import CharacterDefinition, { type CategoryMapping } from "../CharacterDefinition.ts";
import InvokeDefinitionMap from "../InvokeDefinitionMap.ts";

const CATEGORY_DEF_PATTERN = /^(\w+)\s+(\d)\s+(\d)\s+(\d)/;
const CATEGORY_MAPPING_PATTERN = /^(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;
const RANGE_CATEGORY_MAPPING_PATTERN = /^(0x[0-9A-F]{4})\.\.(0x[0-9A-F]{4})(?:\s+([^#\s]+))(?:\s+([^#\s]+))*/;

export default class CharacterDefinitionBuilder {
  charDef: CharacterDefinition;
  characterCategoryDefinition: CharacterClass[];
  categoryMapping: CategoryMapping;

  /**
   * CharacterDefinitionBuilder
   * @constructor
   */
  constructor() {
    this.charDef = new CharacterDefinition(null, null, new InvokeDefinitionMap());
    this.characterCategoryDefinition = [];
    this.categoryMapping = [];
  }

  putLine(line: string) {
    const parsedCategoryDef = CATEGORY_DEF_PATTERN.exec(line);
    if (parsedCategoryDef !== null) {
      const classId = this.characterCategoryDefinition.length;
      const charClass = CharacterDefinition.parseCharCategory(classId, parsedCategoryDef);
      if (charClass !== null) {
        this.characterCategoryDefinition.push(charClass);
      }
      return;
    }

    const parsedCategoryMapping = CATEGORY_MAPPING_PATTERN.exec(line);
    if (parsedCategoryMapping !== null) {
      const mapping = CharacterDefinition.parseCategoryMapping(parsedCategoryMapping);
      this.categoryMapping.push(mapping);
    }

    const parsedRangeCategoryMapping = RANGE_CATEGORY_MAPPING_PATTERN.exec(line);
    if (parsedRangeCategoryMapping !== null) {
      const rangeMapping = CharacterDefinition.parseRangeCategoryMapping(parsedRangeCategoryMapping);
      this.categoryMapping.push(rangeMapping);
    }
  }

  build() {
    // TODO If DEFAULT category does not exist, throw error
    this.charDef.invokeDefinitionMap.init(this.characterCategoryDefinition);
    this.charDef.initCategoryMappings(this.categoryMapping);
    return this.charDef;
  }
}
