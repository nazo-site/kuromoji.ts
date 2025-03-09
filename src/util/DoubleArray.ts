/*
 * Copyright (c) 2014 Takuya Asano All Rights Reserved.
 * Released under the MIT license
 * https://opensource.org/licenses/mit-license.php
 */

/*
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

type ArrayType = Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;

const TERM_CHAR = "\u0000", // terminal character
  TERM_CODE = 0,            // terminal character code
  ROOT_ID = 0,              // index of root node
  NOT_FOUND = -1,           // traverse() returns if no nodes found
  BASE_SIGNED = true,
  CHECK_SIGNED = true,
  BASE_BYTES = 4,
  CHECK_BYTES = 4,
  MEMORY_EXPAND_RATIO = 2;

type BC = ReturnType<typeof newBC>;
const newBC = (initialSize: number = 1024) => {
  const initBase = (base: ArrayType, start: number, end: number) => { // 'end' index does not include
    for (let i = start; i < end; i++) {
      base[i] = - i + 1; // inversed previous empty node index
    }
    if (0 < check.array[check.array.length - 1]) {
      let lastUsedId = check.array.length - 2;
      while (0 < check.array[lastUsedId]) {
        lastUsedId--;
      }
      base[start] = - lastUsedId;
    }
  };

  const initCheck = (check: ArrayType, start: number, end: number) => {
    for (let i = start; i < end; i++) {
      check[i] = - i - 1; // inversed next empty node index
    }
  };

  const realloc = (minSize: number) => {
    // expand arrays size by given ratio
    const newSize = minSize * MEMORY_EXPAND_RATIO;
    // console.log('re-allocate memory to ' + newSize);

    const baseNewArray = newArrayBuffer(base.signed, base.bytes, newSize);
    initBase(baseNewArray, base.array.length, newSize); // init BASE in new range
    baseNewArray.set(base.array);
    // base.array = null; // explicit GC
    base.array = baseNewArray;

    const checkNewArray = newArrayBuffer(check.signed, check.bytes, newSize);
    initCheck(checkNewArray, check.array.length, newSize); // init CHECK in new range
    checkNewArray.set(check.array);
    // check.array = null; // explicit GC
    check.array = checkNewArray;
  };

  let firstUnusedNode = ROOT_ID + 1;

  const base = {
    signed: BASE_SIGNED,
    bytes: BASE_BYTES,
    array: newArrayBuffer(BASE_SIGNED, BASE_BYTES, initialSize),
  };

  const check = {
    signed: CHECK_SIGNED,
    bytes: CHECK_BYTES,
    array: newArrayBuffer(CHECK_SIGNED, CHECK_BYTES, initialSize),
  };

  // init root node
  base.array[ROOT_ID] = 1;
  check.array[ROOT_ID] = ROOT_ID;

  // init BASE
  initBase(base.array, ROOT_ID + 1, base.array.length);

  // init CHECK
  initCheck(check.array, ROOT_ID + 1, check.array.length);

  return {
    getBaseBuffer() {
      return base.array;
    },
    getCheckBuffer() {
      return check.array;
    },
    loadBaseBuffer(baseBuffer: ArrayType) {
      base.array = baseBuffer;
      return this;
    },
    loadCheckBuffer(checkBuffer: ArrayType) {
      check.array = checkBuffer;
      return this;
    },
    size() {
      return Math.max(base.array.length, check.array.length);
    },
    getBase(index: number) {
      if (base.array.length - 1 < index) {
        return - index + 1;
        // realloc(index);
      }
      // if (!Number.isFinite(base.array[index])) {
      //     console.log('getBase:' + index);
      //     throw 'getBase' + index;
      // }
      return base.array[index];
    },
    getCheck(index: number) {
      if (check.array.length - 1 < index) {
        return - index - 1;
        // realloc(index);
      }
      // if (!Number.isFinite(check.array[index])) {
      //     console.log('getCheck:' + index);
      //     throw 'getCheck' + index;
      // }
      return check.array[index];
    },
    setBase(index: number, baseValue: number) {
      if (base.array.length - 1 < index) {
        realloc(index);
      }
      base.array[index] = baseValue;
    },
    setCheck(index: number, checkValue: number) {
      if (check.array.length - 1 < index) {
        realloc(index);
      }
      check.array[index] = checkValue;
    },
    setFirstUnusedNode(index: number) {
      // if (!Number.isFinite(index)) {
      //     throw 'assertion error: setFirstUnusedNode ' + index + ' is not finite number';
      // }
      firstUnusedNode = index;
    },
    getFirstUnusedNode() {
      // if (!Number.isFinite(firstUnusedNode)) {
      //     throw 'assertion error: getFirstUnusedNode ' + firstUnusedNode + ' is not finite number';
      // }
      return firstUnusedNode;
    },
    shrink() {
      let lastIndex = this.size() - 1;
      while (0 <= lastIndex) {
        if (0 <= check.array[lastIndex]) {
          break;
        }
        lastIndex--;
      }
      if (lastIndex < 0) {
        throw check.array.buffer;
      }
      base.array = base.array.subarray(0, lastIndex + 2);   // keep last unused node
      check.array = check.array.subarray(0, lastIndex + 2); // keep last unused node
    },
    calc() {
      const size = check.array.length;
      const unusedCount = check.array.filter((value) => value < 0).length;
      return {
        all: size,
        unused: unusedCount,
        efficiency: (size - unusedCount) / size,
      };
    },
    dump() {
      // for debug
      const dumpBase = base.array.map((_value, index) => this.getBase(index)).join(" ");
      const dumpCheck = check.array.map((_value, index) => this.getCheck(index)).join(" ");

      console.log("base: " + dumpBase);
      console.log("chck: " + dumpCheck);

      return "base: " + dumpBase + " chck: " + dumpCheck;
    },
  };
};

class DoubleArrayBuilder {
  bc: BC;
  keys: { k: string | Uint8Array<ArrayBuffer> | undefined; v: number }[];

  /**
   * Factory method of double array
   */
  constructor(initialSize?: number) {
    this.bc = newBC(initialSize); // BASE and CHECK
    this.keys = [];
  }


  /**
   * Append a key to initialize set
   * (This method should be called by dictionary ordered key)
   *
   * @param {String} key
   * @param {Number} value Integer value from 0 to max signed integer number - 1
   */
  append(key: string, record: number) {
    this.keys.push({ k: key, v: record });
    return this;
  };

  /**
   * Build double array for given keys
   *
   * @param {Array} keys Array of keys. A key is a Object which has properties 'k', 'v'.
   * 'k' is a key string, 'v' is a record assigned to that key.
   * @return {DoubleArray} Compiled double array
   */
  build(keys: { k: string | Uint8Array<ArrayBuffer> | undefined; v: number }[] | null, sorted: boolean = false) {
    keys ??= this.keys;

    if (keys === null) {
      return new DoubleArray(this.bc);
    }

    // Convert key string to ArrayBuffer
    const buffKeys = keys.map((k) => ({ k: stringToUtf8Bytes(k.k + TERM_CHAR), v: k.v }));

    // Sort keys by byte order
    if (sorted) {
      this.keys = buffKeys;
    } else {
      this.keys = buffKeys.sort((k1, k2) => {
        const b1 = k1.k;
        const b2 = k2.k;
        const minLength = Math.min(b1.length, b2.length);
        for (let pos = 0; pos < minLength; pos++) {
          if (b1[pos] === b2[pos]) {
            continue;
          }
          return b1[pos] - b2[pos];
        }
        return b1.length - b2.length;
      });
    }

    // buffKeys = null; // explicit GC

    this._build(ROOT_ID, 0, 0, this.keys.length);
    return new DoubleArray(this.bc);
  };

  /**
   * Append nodes to BASE and CHECK array recursively
   */
  _build(parentIndex: number, position: number, start: number, length: number) {
    const childrenInfo = this.getChildrenInfo(position, start, length);
    const _base = this.findAllocatableBase(childrenInfo);

    this.setBC(parentIndex, childrenInfo, _base);

    for (let i = 0; i < childrenInfo.length; i = i + 3) {
      const childCode = childrenInfo[i];
      if (childCode === TERM_CODE) {
        continue;
      }
      const childStart = childrenInfo[i + 1];
      const childLen = childrenInfo[i + 2];
      const childIndex = _base + childCode;
      this._build(childIndex, position + 1, childStart, childLen);
    }
  };

  getChildrenInfo(position: number, start: number, length: number) {
    const startKey = this.keys[start];
    if (startKey.k === undefined) {
      return new Int32Array();
    }

    let currentChar = startKey.k[position].toString();

    let i = 0;
    let childrenInfo = new Int32Array(length * 3);

    childrenInfo[i++] = parseInt(currentChar); // char (current)
    childrenInfo[i++] = start;       // start index (current)

    let nextPos = start;
    let startPos = start;
    for (; nextPos < start + length; nextPos++) {
      const nextKey = this.keys[nextPos];
      if (nextKey.k === undefined) {
        return new Int32Array();
      }

      const nextChar = nextKey.k[position].toString();
      if (currentChar !== nextChar) {
        childrenInfo[i++] = nextPos - startPos; // length (current)
        childrenInfo[i++] = parseInt(nextChar); // char (next)
        childrenInfo[i++] = nextPos;            // start index (next)
        currentChar = nextChar;
        startPos = nextPos;
      }
    }
    childrenInfo[i++] = nextPos - startPos;
    childrenInfo = childrenInfo.subarray(0, i);

    return childrenInfo;
  };

  setBC(parentId: number, childrenInfo: Int32Array<ArrayBuffer>, _base: number) {
    const bc = this.bc;

    bc.setBase(parentId, _base); // Update BASE of parent node

    for (let i = 0; i < childrenInfo.length; i = i + 3) {
      const code = childrenInfo[i];
      const childId = _base + code;

      // Update linked list of unused nodes

      // Assertion
      // if (child_id < 0) {
      //     throw 'assertion error: child_id is negative'
      // }

      const prevUnusedId = - bc.getBase(childId);
      const nextUnusedId = - bc.getCheck(childId);
      // if (prev_unused_id < 0) {
      //     throw 'assertion error: setBC'
      // }
      // if (next_unused_id < 0) {
      //     throw 'assertion error: setBC'
      // }
      if (childId !== bc.getFirstUnusedNode()) {
        bc.setCheck(prevUnusedId, - nextUnusedId);
      } else {
        // Update firstUnusedNode
        bc.setFirstUnusedNode(nextUnusedId);
      }
      bc.setBase(nextUnusedId, - prevUnusedId);

      const check = parentId;         // CHECK is parent node index
      bc.setCheck(childId, check);  // Update CHECK of child node

      // Update record
      if (code === TERM_CODE) {
        const start_pos = childrenInfo[i + 1];
        // const len = childrenInfo[i + 2];
        // if (len !== 1) {
        //     throw 'assertion error: there are multiple terminal nodes. len:' + len;
        // }
        const value = this.keys[start_pos].v ?? 0;

        const base = - value - 1;       // BASE is inverted record value
        bc.setBase(childId, base);  // Update BASE of child(leaf) node
      }
    }
  };


  /**
   * Find BASE value that all children are allocatable in double array's region
   */
  findAllocatableBase(childrenInfo: Int32Array<ArrayBuffer>) {
    const bc = this.bc;

    // Assertion: keys are sorted by byte order
    // const c = -1;
    // for (const i = 0; i < children_info.length; i = i + 3) {
    //     if (children_info[i] < c) {
    //         throw 'assertion error: not sort key'
    //     }
    //     c = children_info[i];
    // }

    let curr = bc.getFirstUnusedNode();  // current index
    // if (curr < 0) {
    //     throw 'assertion error: getFirstUnusedNode returns negative value'
    // }

    // iterate linked list of unused nodes
    let _base;
    while (true) {
      _base = curr - childrenInfo[0];

      if (_base < 0) {
        curr = - bc.getCheck(curr);  // next

        // if (curr < 0) {
        //     throw 'assertion error: getCheck returns negative value'
        // }

        continue;
      }

      let emptyAreaFound = true;
      for (let i = 0; i < childrenInfo.length; i = i + 3) {
        const code = childrenInfo[i];
        const candidate_id = _base + code;

        if (!this.isUnusedNode(candidate_id)) {
          // candidate_id is used node
          // next
          curr = - bc.getCheck(curr);
          // if (curr < 0) {
          //     throw 'assertion error: getCheck returns negative value'
          // }

          emptyAreaFound = false;
          break;
        }
      }
      if (emptyAreaFound) {
        // Area is free
        return _base;
      }
    }
  };

  /**
   * Check this double array index is unused or not
   */
  isUnusedNode(index: number) {
    const bc = this.bc;
    const check = bc.getCheck(index);

    // if (index < 0) {
    //     throw 'assertion error: isUnusedNode index:' + index;
    // }

    if (index === ROOT_ID) {
      // root node
      return false;
    }
    if (check < 0) {
      // unused
      return true;
    }

    // used node (incl. leaf)
    return false;
  };
}

export class DoubleArray {
  bc: BC;

  /**
   * Factory method of double array
   */
  constructor(bc: BC) {
    this.bc = bc;     // BASE and CHECK
    this.bc.shrink();
  }

  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Boolean} True if this trie contains a given key
   */
  contain(key: string) {
    const bc = this.bc;

    key += TERM_CHAR;
    const buffer = stringToUtf8Bytes(key);

    let parent = ROOT_ID;
    for (let i = 0; i < buffer.length; i++) {
      const code = buffer[i];

      const child = this.traverse(parent, code);
      if (child === NOT_FOUND) {
        return false;
      }

      if (bc.getBase(child) <= 0) {
        // leaf node
        return true;
      } else {
        // not leaf
        parent = child;
        continue;
      }
    }
    return false;
  };

  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Number} Record value assgned to this key, -1 if this key does not contain
   */
  lookup(key: string) {
    key += TERM_CHAR;
    const buffer = stringToUtf8Bytes(key);

    let parent = ROOT_ID;
    let child = NOT_FOUND;

    for (let i = 0; i < buffer.length; i++) {
      const code = buffer[i];
      child = this.traverse(parent, code);
      if (child === NOT_FOUND) {
        return NOT_FOUND;
      }
      parent = child;
    }

    const base = this.bc.getBase(child);
    if (base <= 0) {
      // leaf node
      return - base - 1;
    } else {
      // not leaf
      return NOT_FOUND;
    }
  };

  /**
   * Common prefix search
   *
   * @param {String} key
   * @return {Array} Each result object has 'k' and 'v' (key and record,
   * respectively) properties assigned to matched string
   */
  commonPrefixSearch(key: string) {
    const buffer = stringToUtf8Bytes(key);

    let parent = ROOT_ID;

    const result = [];
    for (let i = 0; i < buffer.length; i++) {
      const code = buffer[i];

      const child = this.traverse(parent, code);
      if (child !== NOT_FOUND) {
        parent = child;

        // look forward by terminal character code to check this node is a leaf or not
        const grand_child = this.traverse(child, TERM_CODE);

        if (grand_child !== NOT_FOUND) {
          const base = this.bc.getBase(grand_child);

          result.push({
            v: base <= 0 ? - base - 1 : undefined,             // If child is a leaf node, add record to result
            k: utf8BytesToString(arrayCopy(buffer, 0, i + 1)), // If child is a leaf node, add word to result
          });
        }
        continue;
      } else {
        break;
      }
    }

    return result;
  };

  traverse(parent: number, code: number) {
    const child = this.bc.getBase(parent) + code;
    if (this.bc.getCheck(child) === parent) {
      return child;
    } else {
      return NOT_FOUND;
    }
  };

  size() {
    return this.bc.size();
  };

  calc() {
    return this.bc.calc();
  };

  dump() {
    return this.bc.dump();
  };
}

// Array utility functions

const newArrayBuffer = (signed: boolean, bytes: number, size: number): ArrayType => {
  if (signed) {
    switch (bytes) {
      case 1:
        return new Int8Array(size);
      case 2:
        return new Int16Array(size);
      case 4:
        return new Int32Array(size);
      default:
        throw new RangeError("Invalid newArray parameter element_bytes:" + bytes);
    }
  } else {
    switch (bytes) {
      case 1:
        return new Uint8Array(size);
      case 2:
        return new Uint16Array(size);
      case 4:
        return new Uint32Array(size);
      default:
        throw new RangeError("Invalid newArray parameter element_bytes:" + bytes);
    }
  }
};

const arrayCopy = (src: Uint8Array<ArrayBuffer>, srcOffset: number, length: number) => {
  const buffer = new ArrayBuffer(length);
  const dstU8 = new Uint8Array(buffer, 0, length);
  const srcU8 = src.subarray(srcOffset, length);
  dstU8.set(srcU8);
  return dstU8;
};

/**
 * Convert String (UTF-16) to UTF-8 ArrayBuffer
 *
 * @param {String} str UTF-16 string to convert
 * @return {Uint8Array} Byte sequence encoded by UTF-8
 */
const stringToUtf8Bytes = (str: string) => {
  // Max size of 1 character is 4 bytes
  const bytes = new Uint8Array(new ArrayBuffer(str.length * 4));

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
        // return null;
        throw "malformed surrogate pair";
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
 * @param {Uint8Array} bytes UTF-8 byte sequence to convert
 * @return {String} String encoded by UTF-16
 */
const utf8BytesToString = (bytes: Uint8Array) => {
  let str = "";
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++];

    let code;
    if (b1 < 0x80) {
      // 1 byte
      code = b1;
    } else if ((b1 >> 5) === 0x06) {
      // 2 bytes
      const b2 = bytes[i++];
      code = ((b1 & 0x1f) << 6) | (b2 & 0x3f);
    } else if ((b1 >> 4) === 0x0e) {
      // 3 bytes
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      code = ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f);
    } else {
      // 4 bytes
      const b2 = bytes[i++];
      const b3 = bytes[i++];
      const b4 = bytes[i++];
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

export const builder = (initialSize?: number) => new DoubleArrayBuilder(initialSize);

export const load = (baseBuffer: ArrayType, checkBuffer: ArrayType) => {
  const bc = newBC(0);
  bc.loadBaseBuffer(baseBuffer);
  bc.loadCheckBuffer(checkBuffer);
  return new DoubleArray(bc);
};
