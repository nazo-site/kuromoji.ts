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

import ConnectionCosts from "../dictionary/ConnectionCosts.ts";
import ViterbiLattice from "./ViterbiLattice.ts";
import ViterbiNode from "./ViterbiNode.ts";

export default class ViterbiSearcher {
  connectionCosts: ConnectionCosts;

  /**
   * ViterbiSearcher is for searching best Viterbi path
   * @param {ConnectionCosts} connectionCosts Connection costs matrix
   * @constructor
   */
  constructor(connectionCosts: ConnectionCosts) {
    this.connectionCosts = connectionCosts;
  }

  /**
   * Search best path by forward-backward algorithm
   * @param {ViterbiLattice} lattice Viterbi lattice to search
   * @returns {Array} Shortest path
   */
  search(lattice: ViterbiLattice) {
    return this.backward(this.forward(lattice));
  }

  forward(lattice: ViterbiLattice) {
    for (let i = 1; i <= lattice.eosPos; i++) {
      lattice.nodesEndAt[i]?.forEach((node) => {
        const prevNodes = lattice.nodesEndAt[node.startPos - 1];
        if (prevNodes === null || prevNodes === undefined) {
          // TODO process unknown words (repair word lattice)
          return;
        }

        let cost = Number.MAX_VALUE;
        let shortestPrevNode: ViterbiNode | null = null;
        prevNodes.forEach((prevNode) => {
          let edgeCost: number;
          if (node.leftId === null || prevNode.rightId === null) {
            // TODO assert
            throw "Left or right is null";
            // edgeCost = 0;
          } else {
            edgeCost = this.connectionCosts.get(prevNode.rightId, node.leftId);
          }

          const _cost = prevNode.shortestCost + edgeCost + node.cost;
          if (_cost < cost) {
            shortestPrevNode = prevNode;
            cost = _cost;
          }
        });

        node.prev = shortestPrevNode;
        node.shortestCost = cost;
      });
    }
    return lattice;
  }

  backward(lattice: ViterbiLattice) {
    const shortestPath: ViterbiNode[] = [];
    const eos = lattice.nodesEndAt[lattice.nodesEndAt.length - 1][0];

    let nodeBack = eos.prev;
    if (nodeBack === null) {
      return [];
    }
    while (nodeBack.type !== "BOS") {
      shortestPath.push(nodeBack);
      if (nodeBack.prev === null) {
        // TODO Failed to back. Process unknown words?
        return [];
      }
      nodeBack = nodeBack.prev;
    }

    return shortestPath.reverse();
  }
}
