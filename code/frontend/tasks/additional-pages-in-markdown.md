# feature/frontend/additional-pages-in-markdown
## 改修内容
### コンテンツページ表示ボタンの追加
- ボタンの仕様
  - button#settings-buttonと同じサイズ／スタイル
  - アイコン: `fa-brands fa-readme`
  - 追加位置: button#settings-button の左
- クリックした場合のアクション
  - モーダルウィンドウを表示
    - [about.md](../docs/about.md)の内容を`markdown-it`でレンダリングしたHTML