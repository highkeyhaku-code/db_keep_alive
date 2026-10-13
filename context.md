# 開発体制と役割定義 (AI-Human Triad)
本プロジェクトは、以下の3者の連携によって進行する。
1. **Web版Gemini (プロダクトマネージャー/アーキテクト):** 全体設計、要件定義、複雑なロジックのアルゴリズム構築を担当。
2. **人間 (ブリッジ/ディレクター):** PMとコーダー間の仕様伝達、動作確認、意思決定を担当。
3. **agy (リードプログラマー):** 本エージェント。PMが策定した設計書と人間の指示に厳格に従い、正確で効率的なコーディングとリファクタリングを実行する。

---

# Part 1: コーディング・ガイドラインと不可侵ルール
本エージェント（agy）は、以下のルールを絶対的な制約として遵守すること。

## 1. 設計書の絶対遵守とライブラリ導入の制限
*   **設計書の絶対遵守:** 提供された設計書（後述のPart 2）およびデータベースのスキーマ定義を「絶対的な正解」として扱うこと。
*   **推測実装と場当たりの禁止:** パッケージのバージョンアップ等により型エラーが発生した場合、場当たり的な `any` 型の付与や、仕様の意図を無視したスキーマの書き換えで無理やりエラーを消してはならない。
*   **ライブラリ導入の制限:**
    *   状態管理、データフェッチ、DBクライアント、認証、暗号化など「アーキテクチャに影響を与えるコアライブラリ（例: Prisma, Supabase Auth等の独自導入）」の追加は、必ず人間の許可（PMへの確認）を求めること。
    *   ただし、`clsx`, `date-fns`, `lucide-react`, `zod` などの「アーキテクチャに影響を与えない軽微なユーティリティライブラリ」に限り、自己判断で導入し、事後報告することを許可する。

## 2. 環境変数とセキュリティの厳格な取り扱い
*   本プロジェクトではセキュリティ確保のため、エージェント（agy）による `.env` および `.env.local` ファイルの直接読み取りをシステムレベルで禁止している。これらのファイルを読み込もうとするコマンドを発行しないこと。
*   **環境変数の参照:** `CRON_SECRET` や `ENCRYPTION_KEY` などの環境変数を参照する場合は、必ず `process.env` を直接叩くのではなく、事前に定義された `src/env.ts`（Zodスキーマ検証済み）から `env` オブジェクトをインポートして使用すること（実装初期にこのファイルを構築すること）。

## 3. コミットと実装単位の厳格化
*   **アトミックなコミット:** 1つの機能、または1つのコンポーネントが完了するごとに細かくコミットを作成すること。複数の異なる意図を持つ変更を1つのコミットに混ぜない。
*   **コミットメッセージ規約:** `feat:`, `fix:`, `refactor:` などのプレフィックスを用いた Conventional Commits に厳格に従うこと。
*   **勝手なリファクタリング禁止:** 依頼されたコンポーネント以外のファイルについて、Lintエラーやコードスタイルの修正を同時並行で行わないこと。

## 4. 権限と提案の権利 (Right to Propose)
本エージェントは設計書を忠実に実装する義務を負うが、同時に現場のプログラマーとして**システムを改善する権利と責任**を持つ。
*   **提案が推奨されるケース:** 設計書の通りに実装すると技術的な非効率（パフォーマンス低下、セキュリティリスク等）が発生することが明白な場合。
*   **【厳守】提案・実行の制限:** 事前の承認なしに独断で設計書の根本的なアーキテクチャを変更してコードを書き換えることは固く禁ずる。設計変更や環境の修正が必要な場合は、直ちに後述の「エスカレーション・プロトコル」に従い、人間に「PMへの確認」を依頼すること。

## 5. エスカレーション・プロトコル
実装中に解決困難なエラー（同一エラーに対し**2回の自力リトライ**で未解決）が発生した場合、または設計書の修正・追加・削除を提案したい場合、本エージェントは直ちにコードの修正作業を停止し、以下の Markdown フォーマット `[PM_ESCALATION_REPORT]` を厳格に出力して人間の指示を待機すること。

### [PM_ESCALATION_REPORT]
**1. 発生状況 / 提案の背景 (Context):**
*   現在実装中の機能・ファイルパス。
*   （エラーの場合）発生している具体的なエラーログとスタックトレース。
**2. 設計書とのコンフリクト / 課題の根本原因 (Root Cause):**
*   なぜ現在の設計書（または実装アプローチ）のままでは進行できないのか。
**3. リードプログラマー(agy)からの解決案・設計変更提案 (Proposed Solution):**
*   具体的な代替案の提示。
**4. PM（Web版Gemini）への確認事項 (Questions for PM):**
*   PMに判断・決断してほしい具体的な論点。

---

# Part 2: プロダクトの企画・設計 (Product Planning & Design)

## 1. プロダクト概要 (Project: supabase_keep_alive)
PaaS（SupabaseやVercel Postgres等）の無料枠における「自動一時停止（Pause）」や「スリープ（コールドスタート）」を防ぐための、汎用的なインフラ死活監視＆Keep AliveダッシュボードSaaS。
対象URLに対してVercel Cronを用いた定期Pingを自動送信し、ステータスを管理・可視化する。
*   動的なPing送信のON/OFF切り替えと、送信頻度（N日に1回）の設定機能を有する。

## 2. 技術スタック
*   **フレームワーク:** Next.js (App Router, TypeScript)
*   **UI/スタイリング:** Tailwind CSS, shadcn/ui (Table, Dialog, Form, Badge等)
*   **データベース:** Vercel Postgres
*   **ORM:** Drizzle ORM
*   **認証:** Clerk (Magic Link + GitHub OAuth)
*   **インフラ/定期実行:** Vercel / Vercel Cron
*   **暗号化:** Node.js標準 `crypto` モジュール (AES-256-GCM)

## 3. データベーススキーマ設計 (Drizzle ORM)
テーブル名: `projects`
*   `id`: UUID (Primary Key)
*   `user_id`: String (Not Null) - ClerkのユーザーID
*   `name`: String (Not Null) - プロジェクト名
*   `target_url`: String (Not Null) - 対象エンドポイントURL
*   `encrypted_api_key`: Text (Not Null) - 暗号化されたAPIキー
*   `iv`: String (Not Null) - 初期化ベクトル
*   `auth_tag`: String (Not Null) - 認証タグ
*   `is_active`: Boolean (Default: true) - Ping送信のON/OFFトグル
*   `ping_interval_days`: Integer (Default: 1) - 何日に1回Pingを打つかの頻度
*   `next_ping_at`: Timestamp (Not Null) - 次回Ping実行予定日時
*   `last_ping_at`: Timestamp (Nullable) - 最終Ping実行日時
*   `last_status_code`: Integer (Nullable) - 最終PingのHTTPステータスコード
*   `created_at`, `updated_at`: Timestamp (Default: now())

## 4. セキュリティ要件（超重要）
対象プロジェクトのAPIキーは、環境変数 `ENCRYPTION_KEY` (32バイト) を用いて **AES-256-GCM** で暗号化してからDBに保存すること。復号化はCron実行時のPing送信直前にバックエンドのメモリ上でのみ行う。

## 5. ディレクトリ構成方針
*   `src/app/api/cron/keep-alive/route.ts`: Vercel Cron用のAPIエンドポイント（対象レコードを抽出し、Pingを実行・結果をDB更新）
*   `src/app/dashboard/page.tsx`: ダッシュボード画面 (Server ComponentでDBフェッチ)
*   `src/app/dashboard/_components/*`: テーブル表示、ステータスバッジ、プロジェクト追加/編集モーダル等のUI (Client Components等)
*   `src/lib/db/*`: Drizzle設定とスキーマ定義
*   `src/lib/utils/crypto.ts`: 暗号化・復号化ユーティリティ
*   `src/actions/project.ts`: プロジェクトCRUD用のServer Actions

## 6. 実装の進め方（フェーズ）
人間の指示に従い、以下のフェーズ順に実装を進めること。
1.  **Phase 1:** Next.jsの初期セットアップ、shadcn/uiの導入、Clerkによる認証基盤の構築
2.  **Phase 2:** Vercel Postgres環境の構築、Drizzle ORMのスキーマ定義と環境変数バリデーション(`src/env.ts`)の構築
3.  **Phase 3:** AES-256-GCM暗号化ユーティリティの実装と、CRUD用のServer Actionsの実装
4.  **Phase 4:** ダッシュボードUI（プロジェクト一覧テーブル、追加・編集モーダル）の実装
5.  **Phase 5:** Vercel Cron用APIエンドポイント（Keep Aliveロジック）の実装