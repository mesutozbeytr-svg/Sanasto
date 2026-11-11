/*
# Create bulk insert function for word_library

Creates a SECURITY DEFINER function that accepts a JSON array of word records
and inserts them into the word_library table. This allows bulk data loading
via execute_sql with JSON payloads instead of raw INSERT statements.
*/

CREATE OR REPLACE FUNCTION bulk_insert_word_library(p_data json)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count integer;
BEGIN
  INSERT INTO word_library (finnish, turkish, word_type, level, level_verified, frequency_rank, frequency_count, has_kotus_validation, source, license)
  SELECT
    elem->>'finnish',
    elem->>'turkish',
    elem->>'word_type',
    NULLIF(elem->>'level', '')::text,
    COALESCE((elem->>'level_verified')::boolean, false),
    NULLIF(elem->>'frequency_rank', '')::integer,
    NULLIF(elem->>'frequency_count', '')::integer,
    COALESCE((elem->>'has_kotus_validation')::boolean, false),
    elem->>'source',
    COALESCE(elem->>'license', 'CC BY-SA 3.0')
  FROM json_array_elements(p_data) AS elem
  ON CONFLICT DO NOTHING;
  
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  RETURN inserted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION bulk_insert_word_library(json) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION bulk_insert_word_library(json) TO authenticated;
