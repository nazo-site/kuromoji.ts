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

export default class SurrogateAwareString {
  str: string;
  indexMapping: number[];
  length: number;

  /**
   * String wrapper for UTF-16 surrogate pair (4 bytes)
   * @param {string} str String to wrap
   * @constructor
   */
  constructor(str: string) {
    this.str = str;
    this.indexMapping = [];

    for (let pos = 0; pos < str.length; pos++) {
      const ch = str.charAt(pos);
      this.indexMapping.push(pos);
      if (SurrogateAwareString.isSurrogatePair(ch)) {
        pos++;
      }
    }
    // Surrogate aware length
    this.length = this.indexMapping.length;
  }

  slice(index: number) {
    if (this.indexMapping.length <= index) {
      return "";
    }
    const surrogateAwareIndex = this.indexMapping[index];
    return this.str.slice(surrogateAwareIndex);
  }

  charAt(index: number) {
    if (this.str.length <= index) {
      return "";
    }
    const surrogateAwareStartIndex = this.indexMapping[index];
    const surrogateAwareEndIndex = this.indexMapping[index + 1];

    return surrogateAwareEndIndex === null ? this.str.slice(surrogateAwareStartIndex) : this.str.slice(surrogateAwareStartIndex, surrogateAwareEndIndex);
  }

  charCodeAt(index: number) {
    if (this.indexMapping.length <= index) {
      return NaN;
    }
    const surrogateAwareIndex = this.indexMapping[index];
    const upper = this.str.charCodeAt(surrogateAwareIndex);
    if (upper >= 0xD800 && upper <= 0xDBFF && surrogateAwareIndex < this.str.length) {
      const lower = this.str.charCodeAt(surrogateAwareIndex + 1);
      if (lower >= 0xDC00 && lower <= 0xDFFF) {
        return (upper - 0xD800) * 0x400 + lower - 0xDC00 + 0x10000;
      }
    }
    return upper;
  }

  toString() {
    return this.str;
  };

  static isSurrogatePair(ch: string) {
    const utf16Code = ch.charCodeAt(0);
    return (utf16Code >= 0xD800 && utf16Code <= 0xDBFF);
  };
}
