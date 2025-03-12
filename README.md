# @nazo-site/kuromoji.ts

日本語形態素解析ライブラリーの[Kuromoji]のJavaScript実装である[kuromoji.js]をTypeScriptで書き直したものです。

## デモ

[デモサイト]で動作を体験できます。

## インストール方法

### Node.js

npmなどで`@nazo-site/kuromoji.ts`パッケージをインストールします。

```shell
% npm install @nazo-site/kuromoji.ts
```

### ブラウザー

dist/index.browser.js(ESM形式)またはdist/index.browser.umd.cjs(CJS形式)をHTMLファイルから読み込める場所に配置します。

## 使用方法

### Node.js

辞書データをファイルシステムから読み込む方法とフェッチAPIで読み込む方法があります。

#### node:fsでの読み込み

`buildFSTokenizer`関数はファイルシステムから辞書データを読み込みます。

```typescript
import { buildFSTokenizer } from "@nazo-site/kuromoji.ts";

const tokenizer = await buildFSTokenizer({ dictionaryPath: "path/to/dictionary/dir/" });
const tokens = tokenizer.tokenize("すもももももももものうち");
console.log(tokens);
```

#### fetchでの読み込み

`buildFetchTokenizer`関数はフェッチAPIで辞書データを読み込みます。

```typescript
import { buildFetchTokenizer } from "@nazo-site/kuromoji.ts";

const tokenizer = await buildFetchTokenizer({ dictionaryPath: "url/to/dictionary/dir/" });
const tokens = tokenizer.tokenize("すもももももももものうち");
console.log(tokens);
```

### ブラウザー

スクリプトをESModule(ESM)形式で読み込む方法とCommonJS(CJS)形式で読み込む方法があります。\
辞書データはフェッチAPIで読み込みます。

#### ESM形式

```html
<script type="module">
  import { buildFetchTokenizer } from "url/to/@nazo-site/kuromoji.ts/index.browser.js";

  const tokenizer = await buildFetchTokenizer({ dictionaryPath: "url/to/dictionary/dir/" });
  const tokens = tokenizer.tokenize("すもももももももものうち");
  console.log(tokens);
</script>
```

#### CJS形式

```html
<script src="url/to/@nazo-site/kuromoji.ts/index.browser.umd.cjs"></script>
<script>
  globalThis["@nazo-site/kuromoji-ts"].buildFetchTokenizer({ dictionaryPath: "url/to/dictionary/dir/" }).then((tokenizer) => {
    const tokens = tokenizer.tokenize("すもももももももものうち");
    console.log(tokens);
  });
</script>
```

## API

`tokenize`関数は下記のようなJSONの配列を返します。\
(この型はsrc/util/IpadicFormatter.tsで定義されています。)

```typescript
[{
  wordId: 509800,           // 辞書内での単語ID
  wordType: "KNOWN",        // 単語タイプ(辞書に登録されている単語ならKNOWN, 未知語ならUNKNOWN)
  wordPosition: 1,          // 単語の開始位置
  surfaceForm: "黒文字",     // 表層形
  pos: "名詞",               // 品詞
  posDetail1: "一般",        // 品詞細分類1
  posDetail2: "*",          // 品詞細分類2
  posDetail3: "*",          // 品詞細分類3
  conjugatedType: "*",      // 活用型
  conjugatedForm: "*",      // 活用形
  basicForm: "黒文字",       // 基本形
  reading: "クロモジ",       // 読み
  pronunciation: "クロモジ", // 発音
}]
```

## ライセンス

* このソフトウェアはApache License 2.0で配布されます。
* このソフトウェアは[kuromoji.js]のソースコードを改変して含んでいます。\
  kuromoji.jsはApache License 2.0で配布されています。
* このソフトウェアはkuromoji.jsの依存先の[doublearray]のソースコードを改変して含んでいます。\
  doublearrayはMITライセンスで配布されています。
* このソフトウェアにはmecab-ipadic-2.7.0-20070801のデータを同梱しています。\
  詳細については[NOTICE.md](NOTICE.md)を参照してください。

[Kuromoji]: https://www.atilika.com/ja/kuromoji/
[kuromoji.js]: https://github.com/takuyaa/kuromoji.js
[doublearray]: https://github.com/takuyaa/doublearray

[デモサイト]: https://nazo-site.github.io/kuromoji.ts/demo/
