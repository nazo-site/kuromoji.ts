// Copyright (c) 2014 Takuya Asano All Rights Reserved.

import { describe, test, expect, beforeEach } from "vitest";

import { DoubleArray, builder as doubleArrayBuilder, load as loadDoubleArray } from "../../src/util/DoubleArray.ts";

describe("doublearray", () => {
  describe("contain", () => {
    const dict = {
      "apple": 1,
      "ball": 2,
      "bear": 3,
      "bird": 4,
      "bison": 5,
      "black": 6,
      "blue": 7,
      "blur": 8,
      "cold": 10,
      "column": 11,
      "cow": 12,
    };
    const words = Object.entries(dict).map(([k, v]) => ({ k, v }));
    test("Contain bird", () => {
      expect(doubleArrayBuilder().build(words).contain("bird"))
        .toBe(true);
    });
    test("Contain bison", () => {
      expect(doubleArrayBuilder().build(words).contain("bison"))
        .toBe(true);
    });
    test("Lookup bird", () => {
      expect(doubleArrayBuilder().build(words).lookup("bird"))
        .toBe(dict["bird"]);
    });
    test("Lookup bison", () => {
      expect(doubleArrayBuilder().build(words).lookup("bison"))
        .toBe(dict["bison"]);
    });
    test("Build", () => {
      // trie.bc.
      expect(doubleArrayBuilder(4).build(words).lookup("bison"))
        .toBe(dict["bison"]);
    });
  });

  describe("load", () => {
    let trie: DoubleArray, loadTrie: DoubleArray; // target
    const words = [{ k: "apple", v: 1 }]; // test data
    beforeEach(() => {
      // Build original
      trie = doubleArrayBuilder().build(words);

      // Load from original typed array
      const baseBuffer = trie.bc.getBaseBuffer();
      const checkBuffer = trie.bc.getCheckBuffer();
      loadTrie = loadDoubleArray(baseBuffer, checkBuffer);
    });

    test("Original and loaded tries lookup successfully", () => {
      expect(trie.lookup("apple"))
        .toBe(words[0].v);

      expect(loadTrie.lookup("apple"))
        .toBe(words[0].v);
    });

    test("Original and loaded typed arrays are same", () => {
      expect(trie.bc.getBaseBuffer())
        .toEqual(loadTrie.bc.getBaseBuffer());

      expect(trie.bc.getCheckBuffer())
        .toEqual(loadTrie.bc.getCheckBuffer());
    });
  });
});
