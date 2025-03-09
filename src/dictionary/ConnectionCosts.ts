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

export default class ConnectionCosts {
  forwardDimension: number;
  backwardDimension: number;
  buffer: Int16Array;

  /**
   * Connection costs matrix from cc.dat file.
   * 2 dimension matrix [forward_id][backward_id] -> cost
   * @constructor
   * @param {number} forwardDimension
   * @param {number} backwardDimension
   */
  constructor(forwardDimension: number, backwardDimension: number) {
    this.forwardDimension = forwardDimension;
    this.backwardDimension = backwardDimension;

    // leading 2 integers for forwardDimension, backwardDimension, respectively
    this.buffer = new Int16Array(forwardDimension * backwardDimension + 2);
    this.buffer[0] = forwardDimension;
    this.buffer[1] = backwardDimension;
  }

  put(forwardId: number, backwardId: number, cost: number) {
    const index = forwardId * this.backwardDimension + backwardId + 2;
    if (index > this.buffer.length - 1) {
      throw "ConnectionCosts buffer overflow";
    }
    this.buffer[index] = cost;
  }

  get(forwardId: number, backwardId: number) {
    const index = forwardId * this.backwardDimension + backwardId + 2;
    if (index > this.buffer.length - 1) {
      throw "ConnectionCosts buffer overflow";
    }
    return this.buffer[index];
  }

  loadConnectionCosts(connectionCostsBuffer: Int16Array) {
    this.forwardDimension = connectionCostsBuffer[0];
    this.backwardDimension = connectionCostsBuffer[1];
    this.buffer = connectionCostsBuffer;
  }
}
