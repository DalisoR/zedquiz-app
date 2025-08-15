-- Migration to add database functions and triggers for tutor rewards system.

-- 1. Function and Trigger to update followers_count on the profiles table

CREATE OR REPLACE FUNCTION update_tutor_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE profiles
        SET followers_count = followers_count + 1
        WHERE id = NEW.tutor_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE profiles
        SET followers_count = followers_count - 1
        WHERE id = OLD.tutor_id;
    END IF;
    RETURN NULL; -- result is ignored since this is an AFTER trigger
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_student_follow_change ON student_follows;
CREATE TRIGGER on_student_follow_change
AFTER INSERT OR DELETE ON student_follows
FOR EACH ROW EXECUTE FUNCTION update_tutor_followers_count();

-- 2. Function and Trigger to update average_rating on the profiles table

CREATE OR REPLACE FUNCTION update_tutor_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    new_avg_rating REAL;
BEGIN
    -- Recalculate the average rating for the tutor
    SELECT AVG(rating) INTO new_avg_rating
    FROM content_ratings
    WHERE tutor_id = NEW.tutor_id;

    -- Update the profiles table
    UPDATE profiles
    SET average_rating = new_avg_rating
    WHERE id = NEW.tutor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_rating ON content_ratings;
CREATE TRIGGER on_new_rating
AFTER INSERT ON content_ratings
FOR EACH ROW EXECUTE FUNCTION update_tutor_average_rating();

-- 3. Function and Trigger to update contribution_score on the profiles table

CREATE OR REPLACE FUNCTION update_tutor_contribution_score()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET contribution_score = contribution_score + NEW.points_awarded
    WHERE id = NEW.tutor_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_contribution ON tutor_contribution_log;
CREATE TRIGGER on_new_contribution
AFTER INSERT ON tutor_contribution_log
FOR EACH ROW EXECUTE FUNCTION update_tutor_contribution_score();
