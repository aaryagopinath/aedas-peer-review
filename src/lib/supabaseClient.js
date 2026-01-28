import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vuqvcfjxevuolfyxcwrp.supabase.co'
const supabaseKey = 'sb_publishable_YfPeJoeYaULQXRaMaFxL1g_Jx_u2V1B'

export const supabase = createClient(supabaseUrl, supabaseKey)