import type { ReactNode } from "react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/constants/routes"

const PENDING = "登記後に記載"

export function PrivacyDraftPage() {
  return (
    <LegalShell title="プライバシーポリシー（下書き）">
      <p>
        この文面は、法人の登記が終わる前の下書きです。販売業者名・本店所在地・代表者は空欄のままにしています。お客様のカルテや決済情報を法人の本番データベースで預かり始めるのは、登記が終わってからです。
      </p>
      <h2>事業者</h2>
      <dl>
        <Row label="販売業者" value={PENDING} />
        <Row label="所在地" value={PENDING} />
        <Row label="代表者" value={PENDING} />
        <Row label="問い合わせ" value="structsaas@gmail.com" />
      </dl>
      <h2>いま取得しうる情報</h2>
      <p>
        予約に使う氏名、連絡先、希望するメニュー、来店日時です。カルテには髪質、好み、アレルギー、施術メモ、写真が入ります。デモとして開いている画面では、これらは見ているブラウザの中だけに残り、別の端末とは共有されません。
      </p>
      <h2>本番で預かり始めるとき</h2>
      <p>
        登記後の本番では、予約・カルテ・売上を API サーバーとデータベースに保存します。カード番号は Stripe が扱い、このアプリのサーバーには置きません。写真はブラウザへ埋め込まず、オブジェクトストレージに置きます。
      </p>
      <h2>第三者へ渡す範囲</h2>
      <p>
        決済を始めるときは Stripe、送信メールは Resend を使います。ホットペッパーの管理画面から予約を取り出すことはしません。言語モデルへカルテ全文は送りません。
      </p>
      <h2>預かり期間</h2>
      <p>保存期間と削除の申し出先は、登記後にこのページへ追記します。</p>
    </LegalShell>
  )
}

export function CommerceDraftPage() {
  return (
    <LegalShell title="特定商取引法に基づく表記（下書き）">
      <p>
        代金を受け取る本番公開の前の下書きです。法人名・本店・代表者・電話番号が確定するまで、この表記では販売をしません。
      </p>
      <dl>
        <Row label="販売業者" value={PENDING} />
        <Row label="運営統括責任者" value={PENDING} />
        <Row label="所在地" value={PENDING} />
        <Row label="電話番号" value={PENDING} />
        <Row label="メールアドレス" value="structsaas@gmail.com" />
        <Row label="販売価格" value="各サロンがメニューごとに表示する税込価格" />
        <Row label="商品代金以外の必要料金" value="通信料はお客様の負担です。来店時の追加施術はサロンの料金に従います。" />
        <Row label="支払い方法" value="予約時の前払い（カード / PayPay）と、当日払い。本番の決済は登記後に接続します。" />
        <Row label="役務の提供時期" value="予約した来店日時" />
        <Row label="キャンセル" value="各サロンの予約ルールに従います。前払いの返金条件は、決済を接続するときにこの欄へ追記します。" />
      </dl>
    </LegalShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border py-3 sm:grid-cols-[11rem_1fr]">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  )
}

function LegalShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-medium tracking-[0.22em] text-primary">DRAFT</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <article className="mt-8 space-y-4 rounded-[1.75rem] border border-border bg-card px-6 py-6 text-sm leading-relaxed shadow-sm [&_h2]:pt-2 [&_h2]:text-base [&_h2]:font-semibold">
        {children}
      </article>
      <p className="mt-6 flex flex-wrap gap-4 text-sm">
        <Link className="text-primary underline" to={ROUTES.privacy}>
          プライバシーポリシー
        </Link>
        <Link className="text-primary underline" to={ROUTES.commerce}>
          特定商取引法に基づく表記
        </Link>
        <Link className="text-primary underline" to={ROUTES.landing}>
          トップへ戻る
        </Link>
      </p>
    </main>
  )
}
