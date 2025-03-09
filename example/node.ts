"use strict";

import { buildFSTokenizer } from "../src/index.ts";

const tokenizer = await buildFSTokenizer({ dictionaryPath: "./dict/" });
const tokens = tokenizer.tokenize("すもももももももものうち");
console.log(tokens);
