/*
 * Copyright 2014 Takuya Asano
 * Copyright 2010-2014 Atilika Inc. and contributors
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

import { describe, beforeAll, test, expect } from "vitest";

import FSDictionaryLoader from "../../src/dictionary/loader/FSDictionaryLoader";
import ViterbiBuilder from "../../src/viterbi/ViterbiBuilder";

const DIC_DIR = "dict/";

describe("ViterbiBuilder", () => {
  let viterbiBuilder: ViterbiBuilder; // target object

  beforeAll(async() => {
    const loader = new FSDictionaryLoader(DIC_DIR);
    const dictionary = await loader.load();
    viterbiBuilder = new ViterbiBuilder(dictionary);
  }, 5 * 60 * 1000);

  test("Unknown word", () => {
    // lattice to have "ト", "トト", "トトロ"
    const lattice = viterbiBuilder.build("トトロ");
    for (let i = 1; i < lattice.eosPos; i++) {
      const nodes = lattice.nodesEndAt[i];
      if (nodes === null || nodes === undefined) {
        continue;
      }
      expect(nodes.map((node) => node.surfaceForm)).toContain("トトロ".slice(0, i));
    }
  });
});
