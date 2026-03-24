const PHONE_MAX_DIGITS = 11
const PHONE_SEGMENT_LENGTHS = [3, 4, 4] as const

export type PhoneSegments = [string, string, string]

export function extractPhoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, PHONE_MAX_DIGITS)
}

export function parsePhoneToSegments(value: string): PhoneSegments {
  const digits = extractPhoneDigits(value)
  const [len1, len2] = PHONE_SEGMENT_LENGTHS
  return [digits.slice(0, len1), digits.slice(len1, len1 + len2), digits.slice(len1 + len2)]
}

export function updatePhoneSegment(
  segments: PhoneSegments,
  index: 0 | 1 | 2,
  nextValue: string,
): PhoneSegments {
  const next = [...segments] as PhoneSegments
  next[index] = nextValue.replace(/\D/g, "").slice(0, PHONE_SEGMENT_LENGTHS[index])
  return next
}

export function joinPhoneSegments(segments: PhoneSegments) {
  const [part1, part2, part3] = segments
  return [part1, part2, part3].filter((part) => part.length > 0).join("-")
}

export function isCompletePhoneSegments(segments: PhoneSegments) {
  return PHONE_SEGMENT_LENGTHS.every((length, index) => segments[index].length === length)
}
