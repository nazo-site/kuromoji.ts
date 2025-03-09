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

import { readFile } from "fs/promises";
import { gunzipSync } from "zlib";

import DictionaryLoader from "./DictionaryLoader.ts";
import { joinPath } from "../../util/path.ts";

export default class FSDictionaryLoader extends DictionaryLoader {
  /**
   * Utility function to load gzipped dictionary
   * @param {string} fileName Dictionary file name
   * @returns {Promise<ArrayBuffer>} Loaded buffer
   */
  async loadArrayBuffer(fileName: string) {
    const buffer = await readFile(joinPath(this.dictionaryPath, fileName));
    const decompressed = gunzipSync(buffer);
    const typedArray = new Uint8Array(decompressed);
    return typedArray.buffer;
  }
}
