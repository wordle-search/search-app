# feature/feontend/wikipedia-words
## 改修内容
### code/backend/index.js
#### 更新対象ファイルの追加（場合によっては処理フローの更新）
  - 現状では環境変数`ANSWERS_KEY`で指定されたkeyのR2上のオブジェクト（単語リストJSON）を取得し、
    それをキャストした`removeAnswer()`でAPIで取得したJSONのキー`solution`と一致する要素を
    指定したキーのR2オブジェクトとしてアップロードする流れとなっていますが、
    これを次のセクションのように改修したいです。
#### 改修後の処理の流れ
- 指定したR2オブジェクト(JSON)をfetchし、配列に格納する
  - bucket名はWorkerにバインドされているので省略します
  - 格納先の配列
    - base: 環境変数`WORDS_KEY`で指定しているか`assets/words.json.gz`
    - wikipedia: 環境変数`WIKIPEDIA_KEY`で指定しているか`assets/wikipedia.json.gz`
- `removeAnswers()`
  - 渡された`base`,`wikipedia`それぞれの配列に対して、`fetchSolution()`で取得したAPI取得結果のキー`solution`と一致する要素を除去し、
    JSONにパースし、Gzip圧縮してから元のKeyにアップロードする。
- 処理結果を`broadcastProcessingResult()`に渡してLINE MessageingAPIに送信
- 手動でScheduled Handlerを実行するためのエンドポイントは維持してください。
