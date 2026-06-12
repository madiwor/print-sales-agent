import { supabase } from './client'

interface TokenUsage {
  converterId:     string
  inputTokens:     number
  outputTokens:    number
  cacheReadTokens: number
  cacheWriteTokens: number
}

export async function trackTokenUsage(usage: TokenUsage): Promise<void> {
  const { error } = await supabase.rpc('increment_token_usage', {
    p_converter_id:  usage.converterId,
    p_input_tokens:  usage.inputTokens,
    p_output_tokens: usage.outputTokens,
    p_cache_read:    usage.cacheReadTokens,
    p_cache_write:   usage.cacheWriteTokens,
  })
  if (error) console.error('[trackTokenUsage] Error (non-fatal):', error)
}
