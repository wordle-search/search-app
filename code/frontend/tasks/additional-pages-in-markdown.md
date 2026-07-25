# feature/frontend/additional-pages-in-markdown
## 改修内容
### コンテンツページ表示ボタンの追加
- ボタンの仕様
  - button#settings-buttonと同じサイズ／スタイル
  - アイコン: `fa-solid fa-ellipsis-vertical`
  - 追加位置: button#settings-button の左
- クリックした場合のアクション
  - モーダルウィンドウを表示
    - 右上にcloseボタン
      - アイコン: `fa-solid fa-x`
    - 言語モードが`JA`: [about.md](../docs/ja/about.md)の内容を`markdown-it`でレンダリングしたHTMLを埋め込む
    - 言語モードが`EN`: [about.md](../docs/en/about.md)の内容を`markdown-it`でレンダリングしたHTMLを埋め込む
      - サブディレクトリ[images](./images)に画像を追加していく想定なのでビルド後はdist/images/に画像ファイルがまとめられるようにしてください