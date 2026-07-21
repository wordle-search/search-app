# frontend改修指示
## feature/frontend/wikipedia-words
### 改修内容
- 設定モーダル追加
  - `div.hero-header`の右上にボタンを配置し、クリックで展開
    - ボタンの仕様
      - ラベル: `fa-solid fa-gear`
      - サイズ(px): 60x60
  - 仮に`setting-modal`というパネル名とする
  - パネル外をクリックすると閉じる
  - 各トグルスイッチの状態をCookieに保存
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
        - JA/EN共通: ON / OFF
        - ID: wikipedia-dictionary
      - ラベル
        - JA: Wikipediaのタイトル
        - EN: Wikipedia titles

- 追加辞書対応
  - [main.ts](./src/main.ts)
    - 単語リストを読み込む`loadDictionary()`はasyncであるため、複数リソースの並行／並列取得ではコールバックが深くなって可読性が落ちそですし、
      設定パネルでのON/OFFに支障ありそうなので、 `loadWikipedia()`のような別関数にしてもいいです。
      - トグルスイッチの`wikipedia-dictionary`がONであれば`normalizeDictionary()`でのフィルタリングで `loadWikipedia()`の結果も
        検索対象にするかどうかを判定してください。



