import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Define the structure of the performance data we'll analyze
interface QuizAttempt {
  subject: string;
  score: number;
  total_questions: number;
}

// Define the structure of the final report
interface ReportData {
  overallAverage: number;
  totalQuizzes: number;
  strengths: { subject: string; average: number }[];
  weaknesses: { subject: string; average: number }[];
  improvementSuggestions: string[];
}

// Main function to handle the request
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // This function should be protected by a secret or cron job key
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    });

    // 1. Get all students with approved parent links
    const { data: relationships, error: relError } = await supabase
      .from('parent_child_relationships')
      .select('child_id')
      .eq('status', 'approved');

    if (relError) throw relError;

    const studentIds = [...new Set(relationships.map(r => r.child_id))];

    // 2. For each student, generate a report for the last week
    for (const studentId of studentIds) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: quizHistory, error: historyError } = await supabase
        .from('quiz_history')
        .select('subject, score, total_questions')
        .eq('user_id', studentId)
        .gte('created_at', oneWeekAgo.toISOString());

      if (historyError) {
        console.error(`Error fetching history for student ${studentId}:`, historyError);
        continue; // Skip to next student on error
      }

      if (!quizHistory || quizHistory.length === 0) {
        console.log(`No recent quiz history for student ${studentId}.`);
        continue;
      }

      // 3. Analyze the data
      const report = analyzePerformance(quizHistory as QuizAttempt[]);

      // 4. Save the report to the database
      const { error: insertError } = await supabase.from('performance_reports').insert({
        student_id: studentId,
        report_data: report,
        start_date: oneWeekAgo.toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        report_type: 'weekly',
      });

      if (insertError) {
        console.error(`Error saving report for student ${studentId}:`, insertError);
      }
    }

    return new Response(JSON.stringify({ message: `Generated reports for ${studentIds.length} students.` }), {
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

// Helper function to analyze performance
function analyzePerformance(attempts: QuizAttempt[]): ReportData {
  const subjectStats: { [key: string]: { totalScore: number; count: number } } = {};

  for (const attempt of attempts) {
    if (!subjectStats[attempt.subject]) {
      subjectStats[attempt.subject] = { totalScore: 0, count: 0 };
    }
    const percentage = (attempt.score / attempt.total_questions) * 100;
    subjectStats[attempt.subject].totalScore += percentage;
    subjectStats[attempt.subject].count++;
  }

  const subjectAverages = Object.entries(subjectStats).map(([subject, stats]) => ({
    subject,
    average: stats.totalScore / stats.count,
  }));

  const overallAverage = subjectAverages.reduce((acc, s) => acc + s.average, 0) / subjectAverages.length;

  const strengths = subjectAverages.filter(s => s.average >= 80).sort((a, b) => b.average - a.average);
  const weaknesses = subjectAverages.filter(s => s.average < 60).sort((a, b) => a.average - b.average);

  const improvementSuggestions: string[] = [];
  if (weaknesses.length > 0) {
    improvementSuggestions.push(`Focus on these subjects: ${weaknesses.map(w => w.subject).join(', ')}.`);
    improvementSuggestions.push('Try re-taking quizzes on these topics or seeking help from a tutor.');
  }
  if (strengths.length > 0) {
    improvementSuggestions.push(`Great work in ${strengths.map(s => s.subject).join(', ')}! Keep it up.`);
  }

  return {
    overallAverage: Math.round(overallAverage),
    totalQuizzes: attempts.length,
    strengths,
    weaknesses,
    improvementSuggestions,
  };
}
