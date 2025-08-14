-- Create a function to handle point transactions
CREATE OR REPLACE FUNCTION add_points(
  user_id UUID,
  points_amount INTEGER,
  points_source TEXT,
  source_id UUID DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_points INTEGER;
  new_balance INTEGER;
  transaction_id UUID;
  result JSONB;
BEGIN
  -- Begin transaction
  BEGIN
    -- Check if user has a points record, create if not
    INSERT INTO user_points (user_id, points, total_earned)
    VALUES (user_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update user's points
    UPDATE user_points
    SET 
      points = points + points_amount,
      total_earned = total_earned + GREATEST(points_amount, 0),
      updated_at = NOW()
    WHERE user_points.user_id = add_points.user_id
    RETURNING points INTO current_points;
    
    -- Record the transaction
    INSERT INTO point_transactions (
      user_id,
      points,
      source,
      source_id
    ) VALUES (
      user_id,
      points_amount,
      points_source,
      source_id
    )
    RETURNING id INTO transaction_id;
    
    -- Set the result
    result := jsonb_build_object(
      'success', true,
      'points_added', points_amount,
      'new_balance', current_points,
      'transaction_id', transaction_id
    );
    
    -- Commit the transaction
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback the transaction on error
    result := jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN result;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_points(UUID, INTEGER, TEXT, UUID) TO authenticated;
