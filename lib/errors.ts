import type { PostgrestError } from '@supabase/supabase-js'

export function getDbErrorMessage(error: PostgrestError): string {
  switch (error.code) {
    case '23505':
      return 'A record with this name already exists.'
    case '23503':
      return "This record can't be deleted because it's in use elsewhere."
    case '23502':
      return 'A required field is missing.'
    case '42501':
      return "You don't have permission to do that."
    case 'PGRST116':
      return 'Record not found.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
