export type DescriptionBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }

const BULLET = /^\s*[-*•–]\s+/

/**
 * Splits a free-text description into paragraphs and bullet lists.
 * Consecutive bullet lines ("- ", "* ", "• ", "– ") are grouped into one list.
 */
export function parseDescription(text: string): DescriptionBlock[] {
  const blocks: DescriptionBlock[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    if (BULLET.test(line)) {
      const item = line.replace(BULLET, '').trim()
      if (!item) continue
      const last = blocks[blocks.length - 1]
      if (last?.type === 'bullets') last.items.push(item)
      else blocks.push({ type: 'bullets', items: [item] })
    } else {
      blocks.push({ type: 'paragraph', text: line })
    }
  }
  return blocks
}
