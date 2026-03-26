import { createClient } from '@supabase/supabase-js';

// Initialize the database connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Agent Memory Service
 * This function lets your AI agent "remember" context by querying Supabase profiles.
 */
export async function getAgentContext(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[Agent Context Error]', error.message);
    return "No user context found.";
  }
  
  return `User ${data.username} is currently working on the ${data.active_project || 'default'} project.`;
}
