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

import ConnectionCosts from "../ConnectionCosts.ts";

export default class ConnectionCostsBuilder {
  lines: number;
  connectionCost: ConnectionCosts | null;

  /**
   * Builder class for constructing ConnectionCosts object
   * @constructor
   */
  constructor() {
    this.lines = 0;
    this.connectionCost = null;
  }

  putLine(line: string) {
    if (this.lines === 0) {
      const dimensions = line.split(" ");
      const forwardDimension = Number(dimensions[0]);
      const backwardDimension = Number(dimensions[1]);

      if (forwardDimension < 0 || backwardDimension < 0) {
        throw "Parse error of matrix.def";
      }

      this.connectionCost = new ConnectionCosts(forwardDimension, backwardDimension);
      this.lines++;
      return this;
    }

    const costs = line.split(" ");
    if (costs.length !== 3) {
      return this;
    }

    const forwardId = parseInt(costs[0]);
    const backwardId = parseInt(costs[1]);
    const cost = parseInt(costs[2]);

    if (forwardId < 0 || !isFinite(forwardId) || !this.connectionCost?.forwardDimension || this.connectionCost?.forwardDimension <= forwardId ||
      backwardId < 0 || !isFinite(backwardId) || !this.connectionCost?.backwardDimension || this.connectionCost?.backwardDimension <= backwardId) {
      throw "Parse error of matrix.def";
    }

    this.connectionCost.put(forwardId, backwardId, cost);
    this.lines++;
    return this;
  }

  build() {
    return this.connectionCost;
  }
}
