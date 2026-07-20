# frontend改修指示
## feature/frontend/add-favicon
### 改修内容
- Faviconの追加
  - [favicon.ico](../../../search-app/code/frontend/src/favicon.ico)をビルド後はアセット用フォルダに格納し、
    `<link />`タグを使って読み込むようにしてください
## feature/frontend/wikipedia-words
### 改修内容
- 設定モーダル追加
  - `div.hero-header`の右上にボタンを配置し、クリックで展開
    - ボタンの仕様
      - ラベル: `fa-regular fa-gear`
      - サイズ(px): 60x60
  - 仮に`setting-modal`というパネル名とする
  - パネル外をクリックすると閉じる
  - 配置する項目
    - 各要素のレイアウト
      - ラベルの位置: 左揃え
      - スイッチの位置: 中央揃え
    - 配色
      - トグルスイッチ
        - ID: color-mode
        - JA: ライトモード / ダークモード
        - EN: Light mode / Dark mode
      - ラベル
        - JA: 配色
        - EN: Color     
    - 言語 
      - label.language-toggle を移設
      - ラベル
        - JA: 言語
        - EN: Language
    - Wikipedia辞書
      - ON/OFFトグル
        - ID: wikipedia-dictionary
      - ラベル
        - JA: Wikipediaのタイトル
        - EN: Wikipedia titles

- 追加辞書対応
  - [main.ts](./src/main.ts)
    - `loadDictionary()`
      - 環境変数`VITE_WIKIPEDIA_URL`で指定されたURLからfetchした単語リストも
        dictionaryに含めるようにしてください
      - この関数はasyncであるため、複数リソースの並行／並列取得ではコールバックが深くなって可読性が落ちそうなので、
        `loadWikipedia()`のような別関数にしてもいいです。



