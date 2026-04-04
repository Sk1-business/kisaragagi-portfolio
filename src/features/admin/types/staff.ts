export interface Staff {
  id: string
  name: string
  /** カレンダー表示用の色（hex） */
  color: string
  /** 自己紹介（API `description`、任意） */
  description?: string
}
