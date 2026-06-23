# wordle-search
## 概要
[Wordle](https://www.nytimes.com/games/wordle/index.html)を解くときにお世話になってた単語検索サイトが実質的に潰れてしまったので、バイブコーディングの勉強がてら自分用の検索ツールを作ってみよう、と言うことで作ってみました。
## デプロイについて
基本的にSPAとして作っているので、検索自体はだいたいどこのホスティングにでもデプロイできるとは思いますが、
過去問を取り込んで辞書をメンテナンスする機能はCloudFlare Workersにデプロイする前提で作っています。
[ドキュメント](./docs/00-deployment.md)を分離しました。


https://github.com/open-dict-data/wikidict-wordlist/raw/refs/heads/master/data/en-wordlist_wiki-00.txt
https://github.com/open-dict-data/wikidict-wordlist/raw/refs/heads/master/data/en-wordlist_wiki-01.txt