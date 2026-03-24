/**
 * core-llm/retrieval/chunker.ts
 * Splits long text into overlapping chunks for retrieval.
 * Used when ingesting documents or large context blocks.
 *
 * For seed packs, seeds are already granular enough — chunker is used
 * for uploaded documents, permit docs, and large context strings.
 */

export interface TextChunk {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
}

export interface ChunkerOptions {
  /** Max characters per chunk */
  chunkSize?: number;
  /** Overlap between consecutive chunks */
  overlap?: number;
  /** Split on sentence boundaries when possible */
  sentenceAware?: boolean;
}

/**
 * Split a long text into overlapping chunks.
 * Default: 800 chars per chunk, 150 char overlap.
 */
export function chunkText(text: string, options: ChunkerOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? 800;
  const overlap = options.overlap ?? 150;
  const chunks: TextChunk[] = [];

  if (!text || text.trim().length === 0) return chunks;
  if (text.length <= chunkSize) {
    return [{ index: 0, text, startChar: 0, endChar: text.length }];
  }

  let pos = 0;
  let chunkIndex = 0;

  while (pos < text.length) {
    let end = Math.min(pos + chunkSize, text.length);

    // Try to snap to a sentence boundary within the last 100 chars
    if (options.sentenceAware !== false && end < text.length) {
      const sentenceEnd = text.lastIndexOf(". ", end);
      if (sentenceEnd > pos + chunkSize * 0.6) {
        end = sentenceEnd + 2; // include the period and space
      }
    }

    chunks.push({
      index: chunkIndex++,
      text: text.slice(pos, end).trim(),
      startChar: pos,
      endChar: end,
    });

    pos = end - overlap;
    if (pos <= 0) break;
  }

  return chunks;
}

/**
 * Estimate token count (rough: 1 token ≈ 4 chars for English text)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
