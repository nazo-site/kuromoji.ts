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

export default class CharacterClass {
  classId: number;
  className: string;
  isAlwaysInvoke: boolean;
  isGrouping: boolean;
  maxLength: number;

  /**
   * CharacterClass
   * @param {number} classId
   * @param {string} className
   * @param {boolean} isAlwaysInvoke
   * @param {boolean} isGrouping
   * @param {number} maxLength
   * @constructor
   */
  constructor(classId: number, className: string, isAlwaysInvoke: boolean, isGrouping: boolean, maxLength: number) {
    this.classId = classId;
    this.className = className;
    this.isAlwaysInvoke = isAlwaysInvoke;
    this.isGrouping = isGrouping;
    this.maxLength = maxLength;
  }
}
