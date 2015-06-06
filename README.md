team.densan.info
================

[![Code Climate][codeclimate-img]][codeclimate-url] [![Dependency Status][gemnasium-img]][gemnasium-url]

北海道科学大学 電子計算機研究部 部員専用サイト

Requirements
------------
* [Node.js v0.12](https://nodejs.org/download/)
* [MongoDB v3.0](https://www.mongodb.org/downloads)

Setup
-----
1. [Google Developer Console](https://console.developers.google.com/) から、新しいプロジェクトを登録
1. API と認証 -> API から、 `Google+ API` を有効化
1. API と認証 -> 同意画面から、サービス名を登録
1. API と認証 -> 認証情報から、新しいクライアント ID を作成
1. 入手した `クライアント ID`, `クライアント シークレット`, `リダイレクト URI` を設定ファイルに記載する

How to start
------------
1. 設定ファイル `config/default.yml` を `config/development.yml` にコピー
1. 設定ファイル `config/development.yml` を正しく設定
1. プロジェクトディレクトリの直下で `npm install` を実行
1. db ディレクトリの中で `mongod -f db/mongod.conf` を(別の端末で)実行
1. プロジェクトディレクトリの直下で `node boot development` を実行
1. ブラウザで [localhost:3000](http://localhost:3000/) を開く

Notice
------
Nginx で動かす場合は、設定サンプルが [nginx/team.densan.info](nginx/team.densan.info) にあるので参考にする。

[codeclimate-url]: https://codeclimate.com/github/densan/team.densan.info
[codeclimate-img]: https://codeclimate.com/github/densan/team.densan.info/badges/gpa.svg
[gemnasium-url]: https://gemnasium.com/densan/team.densan.info
[gemnasium-img]: https://gemnasium.com/densan/team.densan.info.svg
