import { inquiryEmail, inquiryHref } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-sm text-muted sm:px-8">
        <p>
          問い合わせは{" "}
          <a
            className="text-ink underline decoration-line underline-offset-4 hover:text-seal"
            href={inquiryHref("サイトについての問い合わせ")}
          >
            {inquiryEmail}
          </a>{" "}
          のみです。送信フォームは置いていません。
        </p>
        <p>正式な会社名、所在地、代表者、法務情報は、確認できるまで載せていません。</p>
      </div>
    </footer>
  );
}
