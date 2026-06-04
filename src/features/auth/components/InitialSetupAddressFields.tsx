import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getMunicipalitiesForPrefecture } from "@/features/auth/data/japaneseMunicipalities"
import { JAPANESE_PREFECTURES } from "@/features/auth/data/japanesePrefectures"

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"

export type InitialSetupAddressValue = {
  prefecture: string
  municipality: string
  street: string
  building: string
}

type InitialSetupAddressFieldsProps = {
  value: InitialSetupAddressValue
  onChange: (next: InitialSetupAddressValue) => void
  disabled?: boolean
}

function RequiredMark() {
  return (
    <span className="ml-0.5 text-destructive" title="必須" aria-hidden>
      ※
    </span>
  )
}

export function InitialSetupAddressFields({
  value,
  onChange,
  disabled = false,
}: InitialSetupAddressFieldsProps) {
  const municipalities = useMemo(
    () => getMunicipalitiesForPrefecture(value.prefecture),
    [value.prefecture],
  )

  const municipalityDisabled = disabled || !value.prefecture

  return (
    <fieldset className="space-y-4" disabled={disabled}>
      <legend className="text-sm font-medium leading-none">
        住所
        <RequiredMark />
      </legend>

      <div className="space-y-2">
        <Label htmlFor="initial-address-prefecture">
          県
          <RequiredMark />
        </Label>
        <select
          id="initial-address-prefecture"
          name="addressPrefecture"
          required
          value={value.prefecture}
          onChange={(e) => {
            onChange({
              ...value,
              prefecture: e.target.value,
              municipality: "",
            })
          }}
          className={SELECT_CLASS}
        >
          <option value="">選択してください</option>
          {JAPANESE_PREFECTURES.map((pref) => (
            <option key={pref} value={pref}>
              {pref}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initial-address-municipality">
          市町村
          <RequiredMark />
        </Label>
        <select
          id="initial-address-municipality"
          name="addressMunicipality"
          required
          value={value.municipality}
          disabled={municipalityDisabled}
          onChange={(e) => onChange({ ...value, municipality: e.target.value })}
          className={SELECT_CLASS}
        >
          <option value="">
            {value.prefecture ? "選択してください" : "先に県を選択してください"}
          </option>
          {municipalities.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="initial-address-street">
          町名・番地
          <RequiredMark />
        </Label>
        <Input
          id="initial-address-street"
          name="addressStreet"
          required
          maxLength={200}
          value={value.street}
          onChange={(e) => onChange({ ...value, street: e.target.value })}
          placeholder="例: 神南1-2-3"
          autoComplete="address-line1"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="initial-address-building">マンション名</Label>
        <Input
          id="initial-address-building"
          name="addressBuilding"
          maxLength={200}
          value={value.building}
          onChange={(e) => onChange({ ...value, building: e.target.value })}
          placeholder="例: ○○マンション 101号室"
          autoComplete="address-line2"
        />
        <p className="text-xs text-muted-foreground">任意入力</p>
      </div>
    </fieldset>
  )
}
