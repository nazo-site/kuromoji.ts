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

import CharacterClass from "../../src/dictionary/CharacterClass";
import CharacterDefinition from "../../src/dictionary/CharacterDefinition";
import InvokeDefinitionMap from "../../src/dictionary/InvokeDefinitionMap";
import CharacterDefinitionBuilder from "../../src/dictionary/builder/CharacterDefinitionBuilder";

import fs from "fs";

const DIC_DIR = "test/resource/minimum-dic/";

describe("CharacterDefinition from char.def", () => {
  let charDef: CharacterDefinition; // target object

  beforeAll(() => {
    const cdBuilder = new CharacterDefinitionBuilder();
    fs.readFileSync(DIC_DIR + "char.def", "utf-8").split("\n").forEach((line) => {
      cdBuilder.putLine(line);
    });
    charDef = cdBuilder.build();
  });

  test("lookup by space, return SPACE class", () => {
    expect(charDef.lookup(" ").className).toBe("SPACE");
  });
  test("lookup by 日, return KANJI class", () => {
    expect(charDef.lookup("日").className).toBe("KANJI");
  });
  test("lookup by !, return SYMBOL class", () => {
    expect(charDef.lookup("!").className).toBe("SYMBOL");
  });
  test("lookup by 1, return NUMERIC class", () => {
    expect(charDef.lookup("1").className).toBe("NUMERIC");
  });
  test("lookup by A, return ALPHA class", () => {
    expect(charDef.lookup("A").className).toBe("ALPHA");
  });
  test("lookup by あ, return HIRAGANA class", () => {
    expect(charDef.lookup("あ").className).toBe("HIRAGANA");
  });
  test("lookup by ア, return KATAKANA class", () => {
    expect(charDef.lookup("ア").className).toBe("KATAKANA");
  });
  test("lookup by 一, return KANJINUMERIC class", () => {
    expect(charDef.lookup("一").className).toBe("KANJINUMERIC");
  });
  test("lookup by surrogate pair character, return DEFAULT class", () => {
    expect(charDef.lookup("𠮷").className).toBe("DEFAULT");
  });

  test("lookup by 一, return KANJI class as compatible category", () => {
    expect(charDef.lookupCompatibleCategory("一")[0].className).toBe("KANJI");
  });
  test("lookup by 0x3007, return KANJINUMERIC class as compatible category", () => {
    expect(charDef.lookupCompatibleCategory(String.fromCharCode(0x3007))[0].className).toBe("KANJINUMERIC");
  });

  test("SPACE class definition of INVOKE: false, GROUP: true, LENGTH: 0", () => {
    expect(charDef.lookup(" ").isAlwaysInvoke).toBe(false);
    expect(charDef.lookup(" ").isGrouping).toBe(true);
    expect(charDef.lookup(" ").maxLength).toBe(0);
  });
  test("KANJI class definition of INVOKE: false, GROUP: false, LENGTH: 2", () => {
    expect(charDef.lookup("日").isAlwaysInvoke).toBe(false);
    expect(charDef.lookup("日").isGrouping).toBe(false);
    expect(charDef.lookup("日").maxLength).toBe(2);
  });
  test("SYMBOL class definition of INVOKE: true, GROUP: true, LENGTH: 0", () => {
    expect(charDef.lookup("!").isAlwaysInvoke).toBe(true);
    expect(charDef.lookup("!").isGrouping).toBe(true);
    expect(charDef.lookup("!").maxLength).toBe(0);
  });
  test("NUMERIC class definition of INVOKE: true, GROUP: true, LENGTH: 0", () => {
    expect(charDef.lookup("1").isAlwaysInvoke).toBe(true);
    expect(charDef.lookup("1").isGrouping).toBe(true);
    expect(charDef.lookup("1").maxLength).toBe(0);
  });
  test("ALPHA class definition of INVOKE: true, GROUP: true, LENGTH: 0", () => {
    expect(charDef.lookup("A").isAlwaysInvoke).toBe(true);
    expect(charDef.lookup("A").isGrouping).toBe(true);
    expect(charDef.lookup("A").maxLength).toBe(0);
  });
  test("HIRAGANA class definition of INVOKE: false, GROUP: true, LENGTH: 2", () => {
    expect(charDef.lookup("あ").isAlwaysInvoke).toBe(false);
    expect(charDef.lookup("あ").isGrouping).toBe(true);
    expect(charDef.lookup("あ").maxLength).toBe(2);
  });
  test("KATAKANA class definition of INVOKE: true, GROUP: true, LENGTH: 2", () => {
    expect(charDef.lookup("ア").isAlwaysInvoke).toBe(true);
    expect(charDef.lookup("ア").isGrouping).toBe(true);
    expect(charDef.lookup("ア").maxLength).toBe(2);
  });
  test("KANJINUMERIC class definition of INVOKE: true, GROUP: true, LENGTH: 0", () => {
    expect(charDef.lookup("一").isAlwaysInvoke).toBe(true);
    expect(charDef.lookup("一").isGrouping).toBe(true);
    expect(charDef.lookup("一").maxLength).toBe(0);
  });
  test("Save and load", () => {
    const buffer = charDef.invokeDefinitionMap.toBuffer();
    const invokeDef = InvokeDefinitionMap.load(buffer);
    expect(invokeDef.getCharacterClass(0)).toEqual<CharacterClass>({
      classId: 0,
      className: "DEFAULT",
      isAlwaysInvoke: false,
      isGrouping: true,
      maxLength: 0,
    });
    expect(invokeDef.getCharacterClass(10)).toEqual<CharacterClass>({
      classId: 10,
      className: "CYRILLIC",
      isAlwaysInvoke: true,
      isGrouping: true,
      maxLength: 0,
    });
  });
});
