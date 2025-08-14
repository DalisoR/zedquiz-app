-- Function to get leaderboard data
CREATE OR REPLACE FUNCTION get_leaderboard(
  from_date TIMESTAMPTZ DEFAULT '1970-01-01 00:00:00+00',
  limit_count INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  points BIGINT,
  quiz_count BIGINT,
  is_current_user BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_points AS (
    SELECT 
      up.user_id,
      up.points,
      COUNT(qa.id) as quiz_count,
      ROW_NUMBER() OVER (ORDER BY up.points DESC) as rank
    FROM 
      user_points up
    LEFT JOIN 
      quiz_attempts qa ON qa.user_id = up.user_id 
        AND qa.completed_at >= from_date
    GROUP BY 
      up.user_id, up.points
    ORDER BY 
      up.points DESC
    LIMIT 
      limit_count
  )
  SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'full_name', u.email) as name,
    up.points,
    up.quiz_count,
    (u.id = auth.uid()) as is_current_user
  FROM 
    user_points up
  JOIN 
    auth.users u ON u.id = up.user_id
  ORDER BY 
    up.points DESC;
END;
$$;

-- Function to get a specific user's rank
CREATE OR REPLACE FUNCTION get_user_rank(
  user_id UUID,
  from_date TIMESTAMPTZ DEFAULT '1970-01-01 00:00:00+00'
)
RETURNS TABLE (
  rank BIGINT,
  points BIGINT,
  user_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ranked_users AS (
    SELECT 
      up.user_id,
      up.points,
      ROW_NUMBER() OVER (ORDER BY up.points DESC) as rank
    FROM 
      user_points up
    WHERE 
      EXISTS (
        SELECT 1 
        FROM quiz_attempts qa 
        WHERE qa.user_id = up.user_id 
        AND qa.completed_at >= from_date
      )
      OR up.user_id = user_id
  )
  SELECT 
    COALESCE(ru.rank, 0) as rank,
    COALESCE(ru.points, 0) as points,
    (SELECT COUNT(DISTINCT user_id) FROM ranked_users) as user_count
  FROM 
    ranked_users ru
  WHERE 
    ru.user_id = get_user_rank.user_id
  OR 
    ru.rank IS NULL;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_leaderboard(TIMESTAMPTZ, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_rank(UUID, TIMESTAMPTZ) TO authenticated;
