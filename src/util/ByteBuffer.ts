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

/**
 * Convert String (UTF-16) to UTF-8 ArrayBuffer
 *
 * @param {String} str UTF-16 string to convert
 * @return {Uint8Array} Byte sequence encoded by UTF-8
 */
const stringToUtf8Bytes = function (str: string) {
  // Max size of 1 character is 4 bytes
  const bytes = new Uint8Array(str.length * 4);

  let i = 0, j = 0;
  while (i < str.length) {
    let unicodeCode;

    const utf16Code = str.charCodeAt(i++);
    if (utf16Code >= 0xD800 && utf16Code <= 0xDBFF) {
      // surrogate pair
      const upper = utf16Code;           // high surrogate
      const lower = str.charCodeAt(i++); // low surrogate

      if (lower >= 0xDC00 && lower <= 0xDFFF) {
        unicodeCode = (upper - 0xD800) * (1 << 10) + (1 << 16) + (lower - 0xDC00);
      } else {
        // malformed surrogate pair
        return null;
      }
    } else {
      // not surrogate code
      unicodeCode = utf16Code;
    }

    if (unicodeCode < 0x80) {
      // 1-byte
      bytes[j++] = unicodeCode;

    } else if (unicodeCode < (1 << 11)) {
      // 2-byte
      bytes[j++] = (unicodeCode >>> 6) | 0xC0;
      bytes[j++] = (unicodeCode & 0x3F) | 0x80;

    } else if (unicodeCode < (1 << 16)) {
      // 3-byte
      bytes[j++] = (unicodeCode >>> 12) | 0xE0;
      bytes[j++] = ((unicodeCode >> 6) & 0x3f) | 0x80;
      bytes[j++] = (unicodeCode & 0x3F) | 0x80;

    } else if (unicodeCode < (1 << 21)) {
      // 4-byte
      bytes[j++] = (unicodeCode >>> 18) | 0xF0;
      bytes[j++] = ((unicodeCode >> 12) & 0x3F) | 0x80;
      bytes[j++] = ((unicodeCode >> 6) & 0x3F) | 0x80;
      bytes[j++] = (unicodeCode & 0x3F) | 0x80;

    } else {
      // malformed UCS4 code
    }
  }

  return bytes.subarray(0, j);
};

/**
 * Convert UTF-8 ArrayBuffer to String (UTF-16)
 *
 * @param {Array} bytes UTF-8 byte sequence to convert
 * @return {String} String encoded by UTF-16
 */
const utf8BytesToString = function (bytes: number[]) {
  let str = "";
  let code, b2, b3, b4;
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];
    if (b1 < 0x80) {
      // 1 byte
      code = b1;
    } else if ((b1 >> 5) === 0x06) {
      // 2 bytes
      b2 = bytes[i++];
      code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
    } else if ((b1 >> 4) === 0x0e) {
      // 3 bytes
      b2 = bytes[i++];
      b3 = bytes[i++];
      code = ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
    } else {
      // 4 bytes
      b2 = bytes[i++];
      b3 = bytes[i++];
      b4 = bytes[i++];
      code = ((b1 & 0x07) << 18) | ((b2 & 0x3f) << 12) | ((b3 & 0x3f) << 6) | (b4 & 0x3f);
    }

    if (code < 0x10000) {
      str += String.fromCharCode(code);
    } else {
      // surrogate pair
      code -= 0x10000;
      const upper = (0xD800 | (code >> 10));
      const lower = (0xDC00 | (code & 0x3FF));
      str += String.fromCharCode(upper, lower);
    }
  }

  return str;
};

export default class ByteBuffer {
  buffer: Uint8Array;
  position: number;

  /**
   * Utilities to manipulate byte sequence
   * @param {(number|Uint8Array)} arg Initial size of this buffer (number), or buffer to set (Uint8Array)
   * @constructor
   */
  constructor(arg?: number | Uint8Array) {
    if (arg === undefined) {
      this.buffer = new Uint8Array(1024 * 1024);
    } else if (typeof arg === "number") {
      this.buffer = new Uint8Array(arg);
    } else if (arg instanceof Uint8Array) {
      this.buffer = arg;
    } else {
      // typeof arg -> String
      throw typeof arg + " is invalid parameter type for ByteBuffer constructor";
    }
    // arg is null or number
    this.position = 0;
  }

  size() {
    return this.buffer.length;
  }

  reallocate() {
    const newArray = new Uint8Array(this.buffer.length * 2);
    newArray.set(this.buffer);
    this.buffer = newArray;
  }

  shrink() {
    this.buffer = this.buffer.subarray(0, this.position);
    return this.buffer;
  }

  put(b: number) {
    if (this.buffer.length < this.position + 1) {
      this.reallocate();
    }
    this.buffer[this.position++] = b;
  }

  get(index?: number) {
    if (index === undefined) {
      index = this.position;
      this.position += 1;
    }
    return (index < this.buffer.length - 1) ? this.buffer[index] : 0;
  }

  // Write short to buffer by little endian
  putShort(num: number) {
    if (0xFFFF < num) {
      throw num + " is over short value";
    }
    const lower = (0x00FF & num);
    const upper = (0xFF00 & num) >> 8;
    this.put(lower);
    this.put(upper);
  }

  // Read short from buffer by little endian
  getShort(index: number) {
    // if (index === null) {
    //   index = this.position;
    //   this.position += 2;
    // }
    if (index > this.buffer.length - 2) {
      return 0;
    }
    const lower = this.buffer[index];
    const upper = this.buffer[index + 1];
    let value = (upper << 8) + lower;
    if (value & 0x8000) {
      value = -((value - 1) ^ 0xFFFF);
    }
    return value;
  }

  // Write integer to buffer by little endian
  putInt(num: number) {
    if (0xFFFFFFFF < num) {
      throw num + " is over integer value";
    }
    const b0 = (0x000000FF & num);
    const b1 = (0x0000FF00 & num) >> 8;
    const b2 = (0x00FF0000 & num) >> 16;
    const b3 = (0xFF000000 & num) >> 24;
    this.put(b0);
    this.put(b1);
    this.put(b2);
    this.put(b3);
  }

  // Read integer from buffer by little endian
  getInt(index?: number) {
    if (index === undefined) {
      index = this.position;
      this.position += 4;
    }
    if (this.buffer.length < index + 4) {
      return 0;
    }
    const b0 = this.buffer[index];
    const b1 = this.buffer[index + 1];
    const b2 = this.buffer[index + 2];
    const b3 = this.buffer[index + 3];

    return (b3 << 24) + (b2 << 16) + (b1 << 8) + b0;
  }

  readInt() {
    const pos = this.position;
    this.position += 4;
    return this.getInt(pos);
  }

  putString(str: string) {
    const bytes = stringToUtf8Bytes(str);
    bytes?.forEach((byte) => {
      this.put(byte);
    });
    // put null character as terminal character
    this.put(0);
  }

  getString(index?: number) {
    const buf: number[] = [];
    if (index === undefined) {
      index = this.position;
    }
    while (true) {
      if (this.buffer.length < index + 1) {
        break;
      }
      const ch = this.get(index++);
      if (ch === 0) {
        break;
      }

      buf.push(ch);
    }
    this.position = index;
    return utf8BytesToString(buf);
  }
}
