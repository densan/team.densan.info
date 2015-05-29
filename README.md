team.densan.info
================

[![Code Climate][codeclimate-img]][codeclimate-url] [![Dependency Status][gemnasium-img]][gemnasium-url]

北海道科学大学 電子計算機研究部 部員専用サイト

Requirements
------------
* [Node.js v0.12](https://nodejs.org/download/)
* [MongoDB v3.0](https://www.mongodb.org/downloads)

How to start
------------
1. 設定ファイル `config/default.yml` を `config/development.yml` にコピー
1. 設定ファイル `config/development.yml` を正しく設定
1. プロジェクトディレクトリの直下で `npm install` を実行
1. db ディレクトリの中で `mongod -f db/mongod.conf` を(別の端末で)実行
1. プロジェクトディレクトリの直下で `node boot development` を実行
1. ブラウザで [localhost:3000](http://localhost:3000/) を開く

[codeclimate-url]: https://codeclimate.com/github/densan/team.densan.info
[codeclimate-img]: https://codeclimate.com/github/densan/team.densan.info/badges/gpa.svg
[gemnasium-url]: https://gemnasium.com/densan/team.densan.info
[gemnasium-img]: https://gemnasium.com/densan/team.densan.info.svg
