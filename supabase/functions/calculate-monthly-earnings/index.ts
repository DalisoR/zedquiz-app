import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Placeholder for fetching monthly revenue. In a real app, this would come from a billing system.
const getMonthlyRevenue = async () => {
  // For demonstration, returning a fixed amount.
  return 10000; // $10,000
};

// The percentage of revenue that goes into the tutor payout pool.
const TUTOR_PAYOUT_POOL_PERCENTAGE = 0.4; // 40%

Deno.serve(async (req) => {
  // This function should be protected and only callable by a trusted source (e.g., a cron job).
  // For simplicity, we are not adding auth checks here, but they are critical for production.

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const monthlyRevenue = await getMonthlyRevenue();
    const tutorPayoutPool = monthlyRevenue * TUTOR_PAYOUT_POOL_PERCENTAGE;

    // 1. Get all tutors and their contribution scores
    const { data: tutors, error: tutorsError } = await supabase
      .from('profiles')
      .select('id, contribution_score')
      .eq('role', 'teacher');

    if (tutorsError) throw tutorsError;

    // 2. Calculate the total contribution score across all tutors
    const totalContributionScore = tutors.reduce((sum, tutor) => sum + (tutor.contribution_score || 0), 0);

    if (totalContributionScore === 0) {
      return new Response(JSON.stringify({ message: 'No contributions to process.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Calculate and distribute earnings for each tutor
    const earningsPromises = tutors.map(async (tutor) => {
      const contributionShare = (tutor.contribution_score || 0) / totalContributionScore;
      const earnings = tutorPayoutPool * contributionShare;

      if (earnings > 0) {
        // Update the tutor's total earnings
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ total_earnings: supabase.sql(`total_earnings + ${earnings}`) })
          .eq('id', tutor.id);
        
        if (updateError) {
            console.error(`Failed to update earnings for tutor ${tutor.id}:`, updateError);
            // Decide on error handling: continue, or stop and rollback?
            // For now, we log and continue.
        }
      }
    });

    await Promise.all(earningsPromises);

    // Optional: After distribution, you might want to reset contribution scores for the next cycle
    // This depends on the business logic (e.g., if scores are monthly or rolling).
    // For now, we will not reset them.

    return new Response(JSON.stringify({ message: 'Tutor earnings calculated and distributed successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
