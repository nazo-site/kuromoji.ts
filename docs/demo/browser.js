class I {
  name;
  cost;
  startPos;
  length;
  leftId;
  rightId;
  prev;
  surfaceForm;
  shortestCost;
  type;
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
  constructor(t, e, n, r, s, o, i, c) {
    this.name = t, this.cost = e, this.startPos = n, this.length = r, this.leftId = o, this.rightId = i, this.prev = null, this.surfaceForm = c, s === "BOS" ? this.shortestCost = 0 : this.shortestCost = Number.MAX_VALUE, this.type = s;
  }
}
class O {
  nodesEndAt;
  eosPos;
  /**
   * ViterbiLattice is a lattice in Viterbi algorithm
   * @constructor
   */
  constructor() {
    this.nodesEndAt = [], this.nodesEndAt[0] = [new I("-1", 0, 0, 0, "BOS", 0, 0, "")], this.eosPos = 1;
  }
  /**
   * Append node to ViterbiLattice
   * @param {ViterbiNode} node
   */
  append(t) {
    const e = t.startPos + t.length - 1;
    this.eosPos < e && (this.eosPos = e);
    const n = this.nodesEndAt[e] ?? [];
    n.push(t), this.nodesEndAt[e] = n;
  }
  /**
   * Set ends with EOS (End of Statement)
   */
  appendEos() {
    const t = this.nodesEndAt.length;
    this.eosPos++, this.nodesEndAt[t] = [new I("-1", 0, this.eosPos, 0, "EOS", 0, 0, "")];
  }
}
class b {
  str;
  indexMapping;
  length;
  /**
   * String wrapper for UTF-16 surrogate pair (4 bytes)
   * @param {string} str String to wrap
   * @constructor
   */
  constructor(t) {
    this.str = t, this.indexMapping = [];
    for (let e = 0; e < t.length; e++) {
      const n = t.charAt(e);
      this.indexMapping.push(e), b.isSurrogatePair(n) && e++;
    }
    this.length = this.indexMapping.length;
  }
  slice(t) {
    if (this.indexMapping.length <= t)
      return "";
    const e = this.indexMapping[t];
    return this.str.slice(e);
  }
  charAt(t) {
    if (this.str.length <= t)
      return "";
    const e = this.indexMapping[t], n = this.indexMapping[t + 1];
    return n === null ? this.str.slice(e) : this.str.slice(e, n);
  }
  charCodeAt(t) {
    if (this.indexMapping.length <= t)
      return NaN;
    const e = this.indexMapping[t], n = this.str.charCodeAt(e);
    if (n >= 55296 && n <= 56319 && e < this.str.length) {
      const r = this.str.charCodeAt(e + 1);
      if (r >= 56320 && r <= 57343)
        return (n - 55296) * 1024 + r - 56320 + 65536;
    }
    return n;
  }
  toString() {
    return this.str;
  }
  static isSurrogatePair(t) {
    const e = t.charCodeAt(0);
    return e >= 55296 && e <= 56319;
  }
}
class j {
  trie;
  tokenInfoDictionary;
  unknownDictionary;
  /**
   * ViterbiBuilder builds word lattice (ViterbiLattice)
   * @param {DynamicDictionaries} dic dictionary
   * @constructor
   */
  constructor(t) {
    this.trie = t.trie, this.tokenInfoDictionary = t.tokenInfoDictionary, this.unknownDictionary = t.unknownDictionary;
  }
  /**
   * Build word lattice
   * @param {string} sentenceStr Input text
   * @returns {ViterbiLattice} Word lattice
   */
  build(t) {
    const e = new O(), n = new b(t);
    for (let r = 0; r < n.length; r++) {
      const s = n.slice(r), o = this.trie.commonPrefixSearch(s);
      o.forEach(({ v: u, k: l }) => {
        if (u === void 0)
          return;
        this.tokenInfoDictionary.targetMap[u].forEach((f) => {
          const w = this.tokenInfoDictionary.dictionary.getShort(f), m = this.tokenInfoDictionary.dictionary.getShort(f + 2), L = this.tokenInfoDictionary.dictionary.getShort(f + 4);
          e.append(new I(f.toString(), L, r + 1, l.length, "KNOWN", w, m, l));
        });
      });
      const i = new b(s), c = new b(i.charAt(0)), h = this.unknownDictionary.lookup(c.toString());
      if (h && (o === null || o.length === 0 || h.isAlwaysInvoke)) {
        let u = c;
        if (h.isGrouping && 1 < i.length)
          for (let p = 1; p < i.length; p++) {
            const f = i.charAt(p), w = this.unknownDictionary.lookup(f);
            if (h.className !== w?.className)
              break;
            u = new b(u + f);
          }
        this.unknownDictionary.targetMap[h.classId].forEach((p) => {
          const f = this.unknownDictionary.dictionary.getShort(p), w = this.unknownDictionary.dictionary.getShort(p + 2), m = this.unknownDictionary.dictionary.getShort(p + 4);
          e.append(new I(p.toString(), m, r + 1, u.length, "UNKNOWN", f, w, u.toString()));
        });
      }
    }
    return e.appendEos(), e;
  }
}
class V {
  connectionCosts;
  /**
   * ViterbiSearcher is for searching best Viterbi path
   * @param {ConnectionCosts} connectionCosts Connection costs matrix
   * @constructor
   */
  constructor(t) {
    this.connectionCosts = t;
  }
  /**
   * Search best path by forward-backward algorithm
   * @param {ViterbiLattice} lattice Viterbi lattice to search
   * @returns {Array} Shortest path
   */
  search(t) {
    return this.backward(this.forward(t));
  }
  forward(t) {
    for (let e = 1; e <= t.eosPos; e++)
      t.nodesEndAt[e]?.forEach((n) => {
        const r = t.nodesEndAt[n.startPos - 1];
        if (r == null)
          return;
        let s = Number.MAX_VALUE, o = null;
        r.forEach((i) => {
          let c;
          if (n.leftId === null || i.rightId === null)
            throw "Left or right is null";
          c = this.connectionCosts.get(i.rightId, n.leftId);
          const h = i.shortestCost + c + n.cost;
          h < s && (o = i, s = h);
        }), n.prev = o, n.shortestCost = s;
      });
    return t;
  }
  backward(t) {
    const e = [];
    let r = t.nodesEndAt[t.nodesEndAt.length - 1][0].prev;
    if (r === null)
      return [];
    for (; r.type !== "BOS"; ) {
      if (e.push(r), r.prev === null)
        return [];
      r = r.prev;
    }
    return e.reverse();
  }
}
class K {
  formatEntry(t, e, n, r) {
    return {
      wordId: t,
      wordType: n,
      wordPosition: e,
      surfaceForm: r[0],
      pos: r[1],
      posDetail1: r[2],
      posDetail2: r[3],
      posDetail3: r[4],
      conjugatedType: r[5],
      conjugatedForm: r[6],
      basicForm: r[7],
      reading: r[8],
      pronunciation: r[9]
    };
  }
  formatUnknownEntry(t, e, n, r, s) {
    return {
      wordId: t,
      wordType: n,
      wordPosition: e,
      surfaceForm: s,
      pos: r[1],
      posDetail1: r[2],
      posDetail2: r[3],
      posDetail3: r[4],
      conjugatedType: r[5],
      conjugatedForm: r[6],
      basicForm: r[7]
      // reading: features[8],
      // pronunciation: features[9],
    };
  }
}
const R = /、|。/;
class E {
  tokenInfoDictionary;
  unknownDictionary;
  viterbiBuilder;
  viterbiSearcher;
  formatter;
  /**
   * Tokenizer
   * @param {DynamicDictionaries} dic Dictionaries used by this tokenizer
   * @constructor
   */
  constructor(t) {
    this.tokenInfoDictionary = t.tokenInfoDictionary, this.unknownDictionary = t.unknownDictionary, this.viterbiBuilder = new j(t), this.viterbiSearcher = new V(t.connectionCosts), this.formatter = new K();
  }
  /**
   * Split into sentence by punctuation
   * @param {string} input Input text
   * @returns {Array.<string>} Sentences end with punctuation
   */
  static splitByPunctuation(t) {
    const e = [];
    let n = t;
    for (; n !== ""; ) {
      const r = n.search(R);
      if (r < 0) {
        e.push(n);
        break;
      }
      e.push(n.substring(0, r + 1)), n = n.substring(r + 1);
    }
    return e;
  }
  /**
   * Tokenize text
   * @param {string} text Input text to analyze
   * @returns {Array} Tokens
   */
  tokenize(t) {
    const e = E.splitByPunctuation(t), n = [];
    return e.forEach((r) => {
      this.tokenizeForSentence(r, n);
    }), n;
  }
  tokenizeForSentence(t, e) {
    const n = this.getLattice(t), r = this.viterbiSearcher.search(n), s = e.length > 0 ? e[e.length - 1].wordPosition : 0;
    return r.forEach((o) => {
      let i;
      if (o.type === "KNOWN") {
        const h = this.tokenInfoDictionary.getFeatures(o.name).split(",");
        i = this.formatter.formatEntry(parseInt(o.name), s + o.startPos, o.type, h);
      } else if (o.type === "UNKNOWN") {
        const h = this.unknownDictionary.getFeatures(o.name).split(",");
        i = this.formatter.formatUnknownEntry(parseInt(o.name), s + o.startPos, o.type, h, o.surfaceForm);
      } else
        i = this.formatter.formatEntry(parseInt(o.name), s + o.startPos, o.type, []);
      e.push(i);
    }), e;
  }
  /**
   * Build word lattice
   * @param {string} text Input text to analyze
   * @returns {ViterbiLattice} Word lattice
   */
  getLattice(t) {
    return this.viterbiBuilder.build(t);
  }
}
class G {
  dictionaryLoader;
  /**
   * @param {Object} option JSON object which have key-value pairs settings
   * @param {DictionaryLoader} option.dictionaryLoader Dictionary loader
   * @constructor
   */
  constructor({ dictionaryLoader: t }) {
    this.dictionaryLoader = t;
  }
  /**
   * Build Tokenizer instance by asynchronous manner
   * @returns {Promise<Tokenizer>} Prepared Tokenizer
   */
  async build() {
    const t = await this.dictionaryLoader.load();
    return new E(t);
  }
}
const x = function(a) {
  const t = new Uint8Array(a.length * 4);
  let e = 0, n = 0;
  for (; e < a.length; ) {
    let r;
    const s = a.charCodeAt(e++);
    if (s >= 55296 && s <= 56319) {
      const o = s, i = a.charCodeAt(e++);
      if (i >= 56320 && i <= 57343)
        r = (o - 55296) * 1024 + 65536 + (i - 56320);
      else
        return null;
    } else
      r = s;
    r < 128 ? t[n++] = r : r < 2048 ? (t[n++] = r >>> 6 | 192, t[n++] = r & 63 | 128) : r < 65536 ? (t[n++] = r >>> 12 | 224, t[n++] = r >> 6 & 63 | 128, t[n++] = r & 63 | 128) : r < 1 << 21 && (t[n++] = r >>> 18 | 240, t[n++] = r >> 12 & 63 | 128, t[n++] = r >> 6 & 63 | 128, t[n++] = r & 63 | 128);
  }
  return t.subarray(0, n);
}, W = function(a) {
  let t = "", e, n, r, s, o = 0;
  for (; o < a.length; ) {
    const i = a[o++];
    if (i < 128 ? e = i : i >> 5 === 6 ? (n = a[o++], e = (i & 31) << 6 | n & 63) : i >> 4 === 14 ? (n = a[o++], r = a[o++], e = (i & 15) << 12 | (n & 63) << 6 | r & 63) : (n = a[o++], r = a[o++], s = a[o++], e = (i & 7) << 18 | (n & 63) << 12 | (r & 63) << 6 | s & 63), e < 65536)
      t += String.fromCharCode(e);
    else {
      e -= 65536;
      const c = 55296 | e >> 10, h = 56320 | e & 1023;
      t += String.fromCharCode(c, h);
    }
  }
  return t;
};
class g {
  buffer;
  position;
  /**
   * Utilities to manipulate byte sequence
   * @param {(number|Uint8Array)} arg Initial size of this buffer (number), or buffer to set (Uint8Array)
   * @constructor
   */
  constructor(t) {
    if (t === void 0)
      this.buffer = new Uint8Array(1024 * 1024);
    else if (typeof t == "number")
      this.buffer = new Uint8Array(t);
    else if (t instanceof Uint8Array)
      this.buffer = t;
    else
      throw typeof t + " is invalid parameter type for ByteBuffer constructor";
    this.position = 0;
  }
  size() {
    return this.buffer.length;
  }
  reallocate() {
    const t = new Uint8Array(this.buffer.length * 2);
    t.set(this.buffer), this.buffer = t;
  }
  shrink() {
    return this.buffer = this.buffer.subarray(0, this.position), this.buffer;
  }
  put(t) {
    this.buffer.length < this.position + 1 && this.reallocate(), this.buffer[this.position++] = t;
  }
  get(t) {
    return t === void 0 && (t = this.position, this.position += 1), t < this.buffer.length - 1 ? this.buffer[t] : 0;
  }
  // Write short to buffer by little endian
  putShort(t) {
    if (65535 < t)
      throw t + " is over short value";
    const e = 255 & t, n = (65280 & t) >> 8;
    this.put(e), this.put(n);
  }
  // Read short from buffer by little endian
  getShort(t) {
    if (t > this.buffer.length - 2)
      return 0;
    const e = this.buffer[t];
    let r = (this.buffer[t + 1] << 8) + e;
    return r & 32768 && (r = -(r - 1 ^ 65535)), r;
  }
  // Write integer to buffer by little endian
  putInt(t) {
    if (4294967295 < t)
      throw t + " is over integer value";
    const e = 255 & t, n = (65280 & t) >> 8, r = (16711680 & t) >> 16, s = (4278190080 & t) >> 24;
    this.put(e), this.put(n), this.put(r), this.put(s);
  }
  // Read integer from buffer by little endian
  getInt(t) {
    if (t === void 0 && (t = this.position, this.position += 4), this.buffer.length < t + 4)
      return 0;
    const e = this.buffer[t], n = this.buffer[t + 1], r = this.buffer[t + 2];
    return (this.buffer[t + 3] << 24) + (r << 16) + (n << 8) + e;
  }
  readInt() {
    const t = this.position;
    return this.position += 4, this.getInt(t);
  }
  putString(t) {
    x(t)?.forEach((n) => {
      this.put(n);
    }), this.put(0);
  }
  getString(t) {
    const e = [];
    for (t === void 0 && (t = this.position); !(this.buffer.length < t + 1); ) {
      const n = this.get(t++);
      if (n === 0)
        break;
      e.push(n);
    }
    return this.position = t, W(e);
  }
}
class F {
  dictionary;
  targetMap;
  posBuffer;
  /**
   * TokenInfoDictionary
   * @constructor
   */
  constructor() {
    this.dictionary = new g(10 * 1024 * 1024), this.targetMap = {}, this.posBuffer = new g(10 * 1024 * 1024);
  }
  // left_id right_id word_cost ...
  // ^ this position is token_info_id
  buildDictionary(t) {
    const e = {};
    for (let n = 0; n < t.length; n++) {
      const r = t[n];
      if (r.length < 4)
        continue;
      const s = r[0], o = Number(r[1]), i = Number(r[2]), c = Number(r[3]), h = r.slice(4).join(",");
      if (!isFinite(o) || !isFinite(i) || !isFinite(c))
        throw r;
      const u = this.put(o, i, c, s, h);
      e[u] = s;
    }
    return this.dictionary.shrink(), this.posBuffer.shrink(), e;
  }
  put(t, e, n, r, s) {
    const o = this.dictionary.position, i = this.posBuffer.position;
    return this.dictionary.putShort(t), this.dictionary.putShort(e), this.dictionary.putShort(n), this.dictionary.putInt(i), this.posBuffer.putString(r + "," + s), o;
  }
  addMapping(t, e) {
    this.targetMap[t] ??= [], this.targetMap[t].push(e);
  }
  targetMapToBuffer() {
    const t = new g(), e = Object.keys(this.targetMap).length;
    return t.putInt(e), Object.entries(this.targetMap).forEach(([n, r]) => {
      const s = r.length;
      t.putInt(parseInt(n)), t.putInt(s), r.forEach((o) => {
        t.putInt(o);
      });
    }), t.shrink();
  }
  // from tid.dat
  loadDictionary(t) {
    return this.dictionary = new g(t), this;
  }
  // from tid_pos.dat
  loadPosVector(t) {
    return this.posBuffer = new g(t), this;
  }
  // from tid_map.dat
  loadTargetMap(t) {
    const e = new g(t);
    for (e.position = 0, this.targetMap = {}, e.readInt(); !(e.buffer.length < e.position + 1); ) {
      const n = e.readInt(), r = e.readInt();
      for (let s = 0; s < r; s++)
        this.addMapping(n, e.readInt());
    }
    return this;
  }
  /**
   * Look up features in the dictionary
   * @param {string} tokenInfoIdStr Word ID to look up
   * @returns {string} Features string concatenated by ","
   */
  getFeatures(t) {
    const e = parseInt(t);
    if (isNaN(e))
      throw t + " is invalid token info ID.";
    const n = this.dictionary.getInt(e + 6);
    return this.posBuffer.getString(n);
  }
}
class H {
  forwardDimension;
  backwardDimension;
  buffer;
  /**
   * Connection costs matrix from cc.dat file.
   * 2 dimension matrix [forward_id][backward_id] -> cost
   * @constructor
   * @param {number} forwardDimension
   * @param {number} backwardDimension
   */
  constructor(t, e) {
    this.forwardDimension = t, this.backwardDimension = e, this.buffer = new Int16Array(t * e + 2), this.buffer[0] = t, this.buffer[1] = e;
  }
  put(t, e, n) {
    const r = t * this.backwardDimension + e + 2;
    if (r > this.buffer.length - 1)
      throw "ConnectionCosts buffer overflow";
    this.buffer[r] = n;
  }
  get(t, e) {
    const n = t * this.backwardDimension + e + 2;
    if (n > this.buffer.length - 1)
      throw "ConnectionCosts buffer overflow";
    return this.buffer[n];
  }
  loadConnectionCosts(t) {
    this.forwardDimension = t[0], this.backwardDimension = t[1], this.buffer = t;
  }
}
class z {
  classId;
  className;
  isAlwaysInvoke;
  isGrouping;
  maxLength;
  /**
   * CharacterClass
   * @param {number} classId
   * @param {string} className
   * @param {boolean} isAlwaysInvoke
   * @param {boolean} isGrouping
   * @param {number} maxLength
   * @constructor
   */
  constructor(t, e, n, r, s) {
    this.classId = t, this.className = e, this.isAlwaysInvoke = n, this.isGrouping = r, this.maxLength = s;
  }
}
class M {
  map;
  lookupTable;
  /**
   * InvokeDefinitionMap represents invoke definition a part of char.def
   * @constructor
   */
  constructor() {
    this.map = [], this.lookupTable = {};
  }
  /**
   * Load InvokeDefinitionMap from buffer
   * @param {Uint8Array} invokeDefBuffer
   * @returns {InvokeDefinitionMap}
   */
  static load(t) {
    const e = new M(), n = [], r = new g(t);
    for (; r.position + 1 < r.size(); ) {
      const s = n.length, o = !!r.get(), i = !!r.get(), c = r.getInt(), h = r.getString();
      n.push(new z(s, h, o, i, c));
    }
    return e.init(n), e;
  }
  /**
   * Initializing method
   * @param {Array.<CharacterClass>} characterCategoryDefinition Array of CharacterClass
   */
  init(t) {
    t?.forEach((e, n) => {
      this.map[n] = e, this.lookupTable[e.className] = n;
    });
  }
  /**
   * Get class information by class ID
   * @param {number} classId
   * @returns {CharacterClass}
   */
  getCharacterClass(t) {
    return this.map[t];
  }
  /**
   * For building character definition dictionary
   * @param {string} className character
   * @returns {number} classId
   */
  lookup(t) {
    return this.lookupTable[t];
  }
  /**
   * Transform from map to binary buffer
   * @returns {Uint8Array}
   */
  toBuffer() {
    const t = new g();
    return this.map.forEach((e) => {
      t.put(e.isAlwaysInvoke ? 1 : 0), t.put(e.isGrouping ? 1 : 0), t.putInt(e.maxLength), t.putString(e.className);
    }), t.shrink(), t.buffer;
  }
}
const A = "DEFAULT";
class S {
  characterCategoryMap;
  compatibleCategoryMap;
  invokeDefinitionMap;
  /**
   * CharacterDefinition represents char.def file and
   * defines behavior of unknown word processing
   * @constructor
   */
  constructor(t, e, n) {
    this.characterCategoryMap = t ?? new Uint8Array(65536), this.compatibleCategoryMap = e ?? new Uint32Array(65536), this.invokeDefinitionMap = n;
  }
  /**
   * Load CharacterDefinition
   * @param {Uint8Array} catMapBuffer
   * @param {Uint32Array} compatCatMapBuffer
   * @param {Uint8Array} invokeDefBuffer
   * @returns {CharacterDefinition}
   */
  static load(t, e, n) {
    return new S(t, e, M.load(n));
  }
  static parseCharCategory(t, e) {
    const n = e[1], r = parseInt(e[2]), s = parseInt(e[3]), o = parseInt(e[4]);
    if (!isFinite(r) || r !== 0 && r !== 1)
      throw "char.def parse error. INVOKE is 0 or 1 in:" + r;
    if (!isFinite(s) || s !== 0 && s !== 1)
      throw "char.def parse error. GROUP is 0 or 1 in:" + s;
    if (!isFinite(o) || o < 0)
      throw "char.def parse error. LENGTH is 1 to n:" + o;
    return new z(t, n, r === 1, s === 1, o);
  }
  static parseCategoryMapping(t) {
    const e = parseInt(t[1]), n = t[2], r = t.slice(3);
    if (!isFinite(e) || e < 0 || e > 65535)
      throw "char.def parse error. CODE is invalid:" + e;
    return { start: e, default: n, compatible: r };
  }
  static parseRangeCategoryMapping(t) {
    const e = parseInt(t[1]), n = parseInt(t[2]), r = t[3], s = t.slice(4);
    if (!isFinite(e) || e < 0 || e > 65535)
      throw "char.def parse error. CODE is invalid:" + e;
    if (!isFinite(n) || n < 0 || n > 65535)
      throw "char.def parse error. CODE is invalid:" + n;
    return { start: e, end: n, default: r, compatible: s };
  }
  /**
   * Initializing method
   * @param {Array} categoryMapping Array of category mapping
   */
  initCategoryMappings(t) {
    t.forEach((n) => {
      const r = n.end || n.start;
      for (let s = n.start; s <= r; s++)
        this.characterCategoryMap[s] = this.invokeDefinitionMap.lookup(n.default), n.compatible.forEach((o) => {
          if (o == null)
            return;
          const i = this.invokeDefinitionMap.lookup(o);
          i != null && (this.compatibleCategoryMap[s] |= 1 << i);
        });
    });
    const e = this.invokeDefinitionMap.lookup(A);
    if (e != null)
      for (let n = 0; n < this.characterCategoryMap.length; n++)
        this.characterCategoryMap[n] === 0 && (this.characterCategoryMap[n] = 1 << e);
  }
  /**
   * Lookup compatible categories for a character (not included 1st category)
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {Array.<CharacterClass>} character classes
   */
  lookupCompatibleCategory(t) {
    const e = t.charCodeAt(0), n = this.compatibleCategoryMap[e];
    if (n === void 0 || n === 0)
      return [];
    const r = [];
    for (let s = 0; s < 32; s++)
      if (n & 1 << s) {
        const o = this.invokeDefinitionMap.getCharacterClass(s);
        o !== null && r.push(o);
      }
    return r;
  }
  /**
   * Lookup category for a character
   * @param {string} ch UCS2 character (just 1st character is effective)
   * @returns {CharacterClass} character class
   */
  lookup(t) {
    const e = t.charCodeAt(0), n = b.isSurrogatePair(t) ? this.invokeDefinitionMap.lookup(A) : (e < this.characterCategoryMap.length ? this.characterCategoryMap[e] : void 0) ?? this.invokeDefinitionMap.lookup(A);
    return this.invokeDefinitionMap.getCharacterClass(n);
  }
}
class Y extends F {
  characterDefinition;
  /**
   * UnknownDictionary
   * @constructor
   */
  constructor() {
    super(), this.dictionary = new g(10 * 1024 * 1024), this.targetMap = {}, this.posBuffer = new g(10 * 1024 * 1024), this.characterDefinition = null;
  }
  setCharacterDefinition(t) {
    return this.characterDefinition = t, this;
  }
  lookup(t) {
    return this.characterDefinition?.lookup(t);
  }
  lookupCompatibleCategory(t) {
    return this.characterDefinition?.lookupCompatibleCategory(t);
  }
  loadUnknownDictionaries(t, e, n, r, s, o) {
    this.loadDictionary(t), this.loadPosVector(e), this.loadTargetMap(n), this.characterDefinition = S.load(r, s, o);
  }
}
const D = "\0", B = 0, d = 0, y = -1, U = !0, N = !0, P = 4, T = 4, X = 2, _ = (a = 1024) => {
  const t = (i, c, h) => {
    for (let u = c; u < h; u++)
      i[u] = -u + 1;
    if (0 < o.array[o.array.length - 1]) {
      let u = o.array.length - 2;
      for (; 0 < o.array[u]; )
        u--;
      i[c] = -u;
    }
  }, e = (i, c, h) => {
    for (let u = c; u < h; u++)
      i[u] = -u - 1;
  }, n = (i) => {
    const c = i * X, h = k(s.signed, s.bytes, c);
    t(h, s.array.length, c), h.set(s.array), s.array = h;
    const u = k(o.signed, o.bytes, c);
    e(u, o.array.length, c), u.set(o.array), o.array = u;
  };
  let r = d + 1;
  const s = {
    signed: U,
    bytes: P,
    array: k(U, P, a)
  }, o = {
    signed: N,
    bytes: T,
    array: k(N, T, a)
  };
  return s.array[d] = 1, o.array[d] = d, t(s.array, d + 1, s.array.length), e(o.array, d + 1, o.array.length), {
    getBaseBuffer() {
      return s.array;
    },
    getCheckBuffer() {
      return o.array;
    },
    loadBaseBuffer(i) {
      return s.array = i, this;
    },
    loadCheckBuffer(i) {
      return o.array = i, this;
    },
    size() {
      return Math.max(s.array.length, o.array.length);
    },
    getBase(i) {
      return s.array.length - 1 < i ? -i + 1 : s.array[i];
    },
    getCheck(i) {
      return o.array.length - 1 < i ? -i - 1 : o.array[i];
    },
    setBase(i, c) {
      s.array.length - 1 < i && n(i), s.array[i] = c;
    },
    setCheck(i, c) {
      o.array.length - 1 < i && n(i), o.array[i] = c;
    },
    setFirstUnusedNode(i) {
      r = i;
    },
    getFirstUnusedNode() {
      return r;
    },
    shrink() {
      let i = this.size() - 1;
      for (; 0 <= i && !(0 <= o.array[i]); )
        i--;
      if (i < 0)
        throw o.array.buffer;
      s.array = s.array.subarray(0, i + 2), o.array = o.array.subarray(0, i + 2);
    },
    calc() {
      const i = o.array.length, c = o.array.filter((h) => h < 0).length;
      return {
        all: i,
        unused: c,
        efficiency: (i - c) / i
      };
    },
    dump() {
      const i = s.array.map((h, u) => this.getBase(u)).join(" "), c = o.array.map((h, u) => this.getCheck(u)).join(" ");
      return console.log("base: " + i), console.log("chck: " + c), "base: " + i + " chck: " + c;
    }
  };
};
class $ {
  bc;
  keys;
  /**
   * Factory method of double array
   */
  constructor(t) {
    this.bc = _(t), this.keys = [];
  }
  /**
   * Append a key to initialize set
   * (This method should be called by dictionary ordered key)
   *
   * @param {String} key
   * @param {Number} value Integer value from 0 to max signed integer number - 1
   */
  append(t, e) {
    return this.keys.push({ k: t, v: e }), this;
  }
  /**
   * Build double array for given keys
   *
   * @param {Array} keys Array of keys. A key is a Object which has properties 'k', 'v'.
   * 'k' is a key string, 'v' is a record assigned to that key.
   * @return {DoubleArray} Compiled double array
   */
  build(t, e = !1) {
    if (t ??= this.keys, t === null)
      return new v(this.bc);
    const n = t.map((r) => ({ k: C(r.k + D), v: r.v }));
    return e ? this.keys = n : this.keys = n.sort((r, s) => {
      const o = r.k, i = s.k, c = Math.min(o.length, i.length);
      for (let h = 0; h < c; h++)
        if (o[h] !== i[h])
          return o[h] - i[h];
      return o.length - i.length;
    }), this._build(d, 0, 0, this.keys.length), new v(this.bc);
  }
  /**
   * Append nodes to BASE and CHECK array recursively
   */
  _build(t, e, n, r) {
    const s = this.getChildrenInfo(e, n, r), o = this.findAllocatableBase(s);
    this.setBC(t, s, o);
    for (let i = 0; i < s.length; i = i + 3) {
      const c = s[i];
      if (c === B)
        continue;
      const h = s[i + 1], u = s[i + 2], l = o + c;
      this._build(l, e + 1, h, u);
    }
  }
  getChildrenInfo(t, e, n) {
    const r = this.keys[e];
    if (r.k === void 0)
      return new Int32Array();
    let s = r.k[t].toString(), o = 0, i = new Int32Array(n * 3);
    i[o++] = parseInt(s), i[o++] = e;
    let c = e, h = e;
    for (; c < e + n; c++) {
      const u = this.keys[c];
      if (u.k === void 0)
        return new Int32Array();
      const l = u.k[t].toString();
      s !== l && (i[o++] = c - h, i[o++] = parseInt(l), i[o++] = c, s = l, h = c);
    }
    return i[o++] = c - h, i = i.subarray(0, o), i;
  }
  setBC(t, e, n) {
    const r = this.bc;
    r.setBase(t, n);
    for (let s = 0; s < e.length; s = s + 3) {
      const o = e[s], i = n + o, c = -r.getBase(i), h = -r.getCheck(i);
      i !== r.getFirstUnusedNode() ? r.setCheck(c, -h) : r.setFirstUnusedNode(h), r.setBase(h, -c);
      const u = t;
      if (r.setCheck(i, u), o === B) {
        const l = e[s + 1], f = -(this.keys[l].v ?? 0) - 1;
        r.setBase(i, f);
      }
    }
  }
  /**
   * Find BASE value that all children are allocatable in double array's region
   */
  findAllocatableBase(t) {
    const e = this.bc;
    let n = e.getFirstUnusedNode(), r;
    for (; ; ) {
      if (r = n - t[0], r < 0) {
        n = -e.getCheck(n);
        continue;
      }
      let s = !0;
      for (let o = 0; o < t.length; o = o + 3) {
        const i = t[o], c = r + i;
        if (!this.isUnusedNode(c)) {
          n = -e.getCheck(n), s = !1;
          break;
        }
      }
      if (s)
        return r;
    }
  }
  /**
   * Check this double array index is unused or not
   */
  isUnusedNode(t) {
    const n = this.bc.getCheck(t);
    return t === d ? !1 : n < 0;
  }
}
class v {
  bc;
  /**
   * Factory method of double array
   */
  constructor(t) {
    this.bc = t, this.bc.shrink();
  }
  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Boolean} True if this trie contains a given key
   */
  contain(t) {
    const e = this.bc;
    t += D;
    const n = C(t);
    let r = d;
    for (let s = 0; s < n.length; s++) {
      const o = n[s], i = this.traverse(r, o);
      if (i === y)
        return !1;
      if (e.getBase(i) <= 0)
        return !0;
      r = i;
    }
    return !1;
  }
  /**
   * Look up a given key in this trie
   *
   * @param {String} key
   * @return {Number} Record value assgned to this key, -1 if this key does not contain
   */
  lookup(t) {
    t += D;
    const e = C(t);
    let n = d, r = y;
    for (let o = 0; o < e.length; o++) {
      const i = e[o];
      if (r = this.traverse(n, i), r === y)
        return y;
      n = r;
    }
    const s = this.bc.getBase(r);
    return s <= 0 ? -s - 1 : y;
  }
  /**
   * Common prefix search
   *
   * @param {String} key
   * @return {Array} Each result object has 'k' and 'v' (key and record,
   * respectively) properties assigned to matched string
   */
  commonPrefixSearch(t) {
    const e = C(t);
    let n = d;
    const r = [];
    for (let s = 0; s < e.length; s++) {
      const o = e[s], i = this.traverse(n, o);
      if (i !== y) {
        n = i;
        const c = this.traverse(i, B);
        if (c !== y) {
          const h = this.bc.getBase(c);
          r.push({
            v: h <= 0 ? -h - 1 : void 0,
            // If child is a leaf node, add record to result
            k: J(q(e, 0, s + 1))
            // If child is a leaf node, add word to result
          });
        }
        continue;
      } else
        break;
    }
    return r;
  }
  traverse(t, e) {
    const n = this.bc.getBase(t) + e;
    return this.bc.getCheck(n) === t ? n : y;
  }
  size() {
    return this.bc.size();
  }
  calc() {
    return this.bc.calc();
  }
  dump() {
    return this.bc.dump();
  }
}
const k = (a, t, e) => {
  switch (t) {
    case 1:
      return new Int8Array(e);
    case 2:
      return new Int16Array(e);
    case 4:
      return new Int32Array(e);
    default:
      throw new RangeError("Invalid newArray parameter element_bytes:" + t);
  }
}, q = (a, t, e) => {
  const n = new ArrayBuffer(e), r = new Uint8Array(n, 0, e), s = a.subarray(t, e);
  return r.set(s), r;
}, C = (a) => {
  const t = new Uint8Array(new ArrayBuffer(a.length * 4));
  let e = 0, n = 0;
  for (; e < a.length; ) {
    let r;
    const s = a.charCodeAt(e++);
    if (s >= 55296 && s <= 56319) {
      const o = s, i = a.charCodeAt(e++);
      if (i >= 56320 && i <= 57343)
        r = (o - 55296) * 1024 + 65536 + (i - 56320);
      else
        throw "malformed surrogate pair";
    } else
      r = s;
    r < 128 ? t[n++] = r : r < 2048 ? (t[n++] = r >>> 6 | 192, t[n++] = r & 63 | 128) : r < 65536 ? (t[n++] = r >>> 12 | 224, t[n++] = r >> 6 & 63 | 128, t[n++] = r & 63 | 128) : r < 1 << 21 && (t[n++] = r >>> 18 | 240, t[n++] = r >> 12 & 63 | 128, t[n++] = r >> 6 & 63 | 128, t[n++] = r & 63 | 128);
  }
  return t.subarray(0, n);
}, J = (a) => {
  let t = "", e = 0;
  for (; e < a.length; ) {
    const n = a[e++];
    let r;
    if (n < 128)
      r = n;
    else if (n >> 5 === 6) {
      const s = a[e++];
      r = (n & 31) << 6 | s & 63;
    } else if (n >> 4 === 14) {
      const s = a[e++], o = a[e++];
      r = (n & 15) << 12 | (s & 63) << 6 | o & 63;
    } else {
      const s = a[e++], o = a[e++], i = a[e++];
      r = (n & 7) << 18 | (s & 63) << 12 | (o & 63) << 6 | i & 63;
    }
    if (r < 65536)
      t += String.fromCharCode(r);
    else {
      r -= 65536;
      const s = 55296 | r >> 10, o = 56320 | r & 1023;
      t += String.fromCharCode(s, o);
    }
  }
  return t;
}, Q = (a) => new $(a), Z = (a, t) => {
  const e = _(0);
  return e.loadBaseBuffer(a), e.loadCheckBuffer(t), new v(e);
};
class tt {
  trie;
  tokenInfoDictionary;
  connectionCosts;
  unknownDictionary;
  /**
   * Dictionaries container for Tokenizer
   * @param {DoubleArray} trie
   * @param {TokenInfoDictionary} tokenInfoDictionary
   * @param {ConnectionCosts} connectionCosts
   * @param {UnknownDictionary} unknownDictionary
   * @constructor
   */
  constructor(t, e, n, r) {
    this.trie = t ?? Q(0).build([{ k: "", v: 1 }]), this.tokenInfoDictionary = e ?? new F(), this.connectionCosts = n ?? new H(0, 0), this.unknownDictionary = r ?? new Y();
  }
  // from base.dat & check.dat
  loadTrie(t, e) {
    return this.trie = Z(t, e), this;
  }
  loadTokenInfoDictionaries(t, e, n) {
    return this.tokenInfoDictionary.loadDictionary(t), this.tokenInfoDictionary.loadPosVector(e), this.tokenInfoDictionary.loadTargetMap(n), this;
  }
  loadConnectionCosts(t) {
    return this.connectionCosts.loadConnectionCosts(t), this;
  }
  loadUnknownDictionaries(t, e, n, r, s, o) {
    return this.unknownDictionary.loadUnknownDictionaries(t, e, n, r, s, o), this;
  }
}
class et {
  dic;
  dictionaryPath;
  /**
   * DictionaryLoader base constructor
   * @param {string} dictionaryPath Dictionary path
   * @constructor
   */
  constructor(t) {
    this.dic = new tt(null, null, null, null), this.dictionaryPath = t;
  }
  /**
   * Load dictionary files
   * @returns {Promise<DynamicDictionaries>} Loaded dictionary
   */
  async load() {
    return await Promise.all([
      // Trie
      (async () => {
        const t = await Promise.all(["base.dat.gz", "check.dat.gz"].map((r) => this.loadArrayBuffer(r))), e = new Int32Array(t[0]), n = new Int32Array(t[1]);
        this.dic.loadTrie(e, n);
      })(),
      // Token info dictionaries
      (async () => {
        const t = await Promise.all(["tid.dat.gz", "tid_pos.dat.gz", "tid_map.dat.gz"].map((s) => this.loadArrayBuffer(s))), e = new Uint8Array(t[0]), n = new Uint8Array(t[1]), r = new Uint8Array(t[2]);
        this.dic.loadTokenInfoDictionaries(e, n, r);
      })(),
      // Connection cost matrix
      (async () => {
        const t = await this.loadArrayBuffer("cc.dat.gz"), e = new Int16Array(t);
        this.dic.loadConnectionCosts(e);
      })(),
      // Unknown dictionaries
      (async () => {
        const t = await Promise.all(["unk.dat.gz", "unk_pos.dat.gz", "unk_map.dat.gz", "unk_char.dat.gz", "unk_compat.dat.gz", "unk_invoke.dat.gz"].map((c) => this.loadArrayBuffer(c))), e = new Uint8Array(t[0]), n = new Uint8Array(t[1]), r = new Uint8Array(t[2]), s = new Uint8Array(t[3]), o = new Uint32Array(t[4]), i = new Uint8Array(t[5]);
        this.dic.loadUnknownDictionaries(e, n, r, s, o, i);
      })()
    ]), this.dic;
  }
}
const rt = (a, t) => a + (a.endsWith("/") ? "" : "/") + t;
class nt extends et {
  /**
   * Utility function to load gzipped dictionary
   * @param {string} fileName Dictionary file name
   * @returns {Promise<Uint8Array>} buffer Loaded buffer
   */
  async loadArrayBuffer(t) {
    const e = (await fetch(rt(this.dictionaryPath, t))).body?.pipeThrough(new DecompressionStream("gzip"));
    return await new Response(e).arrayBuffer();
  }
}
class st extends G {
  /**
   * @param {Object} option JSON object which have key-value pairs settings
   * @param {string} dictionaryPath Dictionary path
   * @constructor
   */
  constructor({ dictionaryPath: t }) {
    super({ dictionaryLoader: new nt(t) });
  }
}
const it = (a) => new st(a).build();
export {
  it as buildFetchTokenizer
};
