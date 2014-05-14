team.densan.info
================

北海道科学大学 電子計算機研究部 部員専用サイト

Requirements
------------
* [Node.js v0.10](http://nodejs.jp/nodejs.org_ja/docs/v0.10/)
* [MongoDB v2.6](http://www.mongodb.org/downloads/)

How to start
------------
1. プロジェクトディレクトリの直下で `npm install` を実行
1. db ディレクトリの中で `mongod -f db/mongod.conf` を(別の端末で)実行
1. プロジェクトディレクトリの直下で `node boot development` を実行
1. ブラウザで [localhost:3000](http://localhost:3000/) を開く
