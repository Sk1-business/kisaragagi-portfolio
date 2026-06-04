import { BackofficeSignupEmailPage } from "@/features/auth/pages/BackofficeSignupEmailPage"

/**
 * 管理者の新規登録（メール認証フローのエントリポイント）。
 * 旧来のメール+パスワード+ロール入力フォームから、メールアドレス1つだけを
 * 受け取って認証メールを発行する流れに切り替えた。
 */
export function BackofficeSignupPage() {
  return <BackofficeSignupEmailPage />
}
