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

import DynamicDictionaries from "../dictionary/DynamicDictionaries.ts";
import TokenInfoDictionary from "../dictionary/TokenInfoDictionary.ts";
import UnknownDictionary from "../dictionary/UnknownDictionary.ts";

import ViterbiBuilder from "../viterbi/ViterbiBuilder.ts";
import ViterbiSearcher from "../viterbi/ViterbiSearcher.ts";
import IpadicFormatter, { type Token } from "../util/IpadicFormatter.ts";

const PUNCTUATION = /、|。/;

export default class Tokenizer {
  tokenInfoDictionary: TokenInfoDictionary;
  unknownDictionary: UnknownDictionary;
  viterbiBuilder: ViterbiBuilder;
  viterbiSearcher: ViterbiSearcher;
  formatter: IpadicFormatter;

  /**
   * Tokenizer
   * @param {DynamicDictionaries} dic Dictionaries used by this tokenizer
   * @constructor
   */
  constructor(dic: DynamicDictionaries) {
    this.tokenInfoDictionary = dic.tokenInfoDictionary;
    this.unknownDictionary = dic.unknownDictionary;
    this.viterbiBuilder = new ViterbiBuilder(dic);
    this.viterbiSearcher = new ViterbiSearcher(dic.connectionCosts);
    this.formatter = new IpadicFormatter();  // TODO Other dictionaries
  }

  /**
   * Split into sentence by punctuation
   * @param {string} input Input text
   * @returns {Array.<string>} Sentences end with punctuation
   */
  static splitByPunctuation(input: string) {
    const sentences: string[] = [];
    let tail = input;
    while (true) {
      if (tail === "") {
        break;
      }
      const index = tail.search(PUNCTUATION);
      if (index < 0) {
        sentences.push(tail);
        break;
      }
      sentences.push(tail.substring(0, index + 1));
      tail = tail.substring(index + 1);
    }
    return sentences;
  }

  /**
   * Tokenize text
   * @param {string} text Input text to analyze
   * @returns {Array} Tokens
   */
  tokenize(text: string) {
    const sentences = Tokenizer.splitByPunctuation(text);
    const tokens: Token[] = [];
    sentences.forEach((sentence) => {
      this.tokenizeForSentence(sentence, tokens);
    });
    return tokens;
  }

  tokenizeForSentence(sentence: string, tokens: Token[]) {
    const lattice = this.getLattice(sentence);
    const bestPath = this.viterbiSearcher.search(lattice);
    const lastPos = (tokens.length > 0) ? tokens[tokens.length - 1].wordPosition : 0;

    bestPath.forEach((node) => {
      let token: Token;
      if (node.type === "KNOWN") {
        const featuresLine = this.tokenInfoDictionary.getFeatures(node.name);
        const features = featuresLine.split(",");
        token = this.formatter.formatEntry(parseInt(node.name), lastPos + node.startPos, node.type, features);
      } else if (node.type === "UNKNOWN") {
        // Unknown word
        const featuresLine = this.unknownDictionary.getFeatures(node.name);
        const features = featuresLine.split(",");
        token = this.formatter.formatUnknownEntry(parseInt(node.name), lastPos + node.startPos, node.type, features, node.surfaceForm);
      } else {
        // TODO User dictionary
        token = this.formatter.formatEntry(parseInt(node.name), lastPos + node.startPos, node.type, []);
      }

      tokens.push(token);
    });

    return tokens;
  }

  /**
   * Build word lattice
   * @param {string} text Input text to analyze
   * @returns {ViterbiLattice} Word lattice
   */
  getLattice(text: string) {
    return this.viterbiBuilder.build(text);
  }
}
