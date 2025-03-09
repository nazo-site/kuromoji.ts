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

import ViterbiNode from "./ViterbiNode.ts";

export default class ViterbiLattice {
  nodesEndAt: ViterbiNode[][];
  eosPos: number;

  /**
   * ViterbiLattice is a lattice in Viterbi algorithm
   * @constructor
   */
  constructor() {
    this.nodesEndAt = [];
    this.nodesEndAt[0] = [new ViterbiNode("-1", 0, 0, 0, "BOS", 0, 0, "")];
    this.eosPos = 1;
  }

  /**
   * Append node to ViterbiLattice
   * @param {ViterbiNode} node
   */
  append(node: ViterbiNode) {
    const lastPos = node.startPos + node.length - 1;
    if (this.eosPos < lastPos) {
      this.eosPos = lastPos;
    }

    const prevNodes = this.nodesEndAt[lastPos] ?? [];
    prevNodes.push(node);

    this.nodesEndAt[lastPos] = prevNodes;
  }

  /**
   * Set ends with EOS (End of Statement)
   */
  appendEos() {
    const lastIndex = this.nodesEndAt.length;
    this.eosPos++;
    this.nodesEndAt[lastIndex] = [new ViterbiNode("-1", 0, this.eosPos, 0, "EOS", 0, 0, "")];
  };
}
