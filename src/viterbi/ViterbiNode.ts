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

export default class ViterbiNode {
  name: string;
  cost: number;
  startPos: number;
  length: number;
  leftId: number;
  rightId: number;
  prev: ViterbiNode | null;
  surfaceForm: string;
  shortestCost: number;
  type: string;

  /**
   * ViterbiNode is a node of ViterbiLattice
   * @param {string} nodeName Word ID
   * @param {number} nodeCost Word cost to generate
   * @param {number} startPos Start position from 1
   * @param {number} length Word length
   * @param {string} type Node type (KNOWN, UNKNOWN, BOS, EOS, ...)
   * @param {number} leftId Left context ID
   * @param {number} rightId Right context ID
   * @param {string} surfaceForm Surface form of this word
   * @constructor
   */
  constructor(nodeName: string, nodeCost: number, startPos: number, length: number, type: string, leftId: number, rightId: number, surfaceForm: string) {
    this.name = nodeName;
    this.cost = nodeCost;
    this.startPos = startPos;
    this.length = length;
    this.leftId = leftId;
    this.rightId = rightId;
    this.prev = null;
    this.surfaceForm = surfaceForm;
    if (type === "BOS") {
      this.shortestCost = 0;
    } else {
      this.shortestCost = Number.MAX_VALUE;
    }
    this.type = type;
  }
}
