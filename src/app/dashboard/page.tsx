import { requireUser } from "@/lib/require-user";
import { getDashboardDataAction } from "@/lib/dashboard/actions";

export default async function DashboardPage() {
  await requireUser();
  const dashboardData = await getDashboardDataAction();

  if (!dashboardData) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-slate-700">No practice sessions yet. Start practicing to see your progress!</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>

      {/* Stats Section */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Overview Stats</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Total Sessions</div>
            <div className="text-2xl font-bold">{dashboardData.stats.totalSessions}</div>
          </div>
          <div className="rounded border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Questions Attempted</div>
            <div className="text-2xl font-bold">{dashboardData.stats.totalQuestionsAttempted}</div>
          </div>
          <div className="rounded border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Average Score</div>
            <div className="text-2xl font-bold">{dashboardData.stats.averageScore.toFixed(1)}/5</div>
          </div>
          <div className="rounded border border-slate-200 p-4">
            <div className="text-sm text-slate-600">Current Streak</div>
            <div className="text-2xl font-bold">{dashboardData.stats.currentStreak} days</div>
          </div>
        </div>
      </section>

      {/* Score Breakdown Section */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Score Breakdown (All Metrics)</h2>
        <div className="rounded border border-slate-200 p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Relevance:</span>
              <span className="font-semibold">{dashboardData.scoreBreakdown.relevance.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between">
              <span>Clarity:</span>
              <span className="font-semibold">{dashboardData.scoreBreakdown.clarity.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between">
              <span>Depth:</span>
              <span className="font-semibold">{dashboardData.scoreBreakdown.depth.toFixed(1)}/5</span>
            </div>
            <div className="flex justify-between">
              <span>Communication:</span>
              <span className="font-semibold">{dashboardData.scoreBreakdown.communication.toFixed(1)}/5</span>
            </div>
          </div>
        </div>
      </section>

      {/* Weakest Category */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Focus Area</h2>
        <div className="rounded border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-800">
            Your weakest area is <strong>{dashboardData.weakestCategory.category}</strong> with an average
            score of <strong>{dashboardData.weakestCategory.score.toFixed(1)}/5</strong>. Keep practicing this area!
          </p>
        </div>
      </section>

      {/* Performance by Question Type */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Performance by Question Type</h2>
        <div className="space-y-3">
          {dashboardData.performanceByType.map((perf) => (
            <div key={perf.type} className="rounded border border-slate-200 p-4">
              <h3 className="font-semibold">{perf.type}</h3>
              <div className="mt-2 text-sm text-slate-600">Questions: {perf.count}</div>
              <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Avg Score:</span>
                  <span className="font-semibold">{perf.averageScore.toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between">
                  <span>Relevance:</span>
                  <span>{perf.averageRelevance.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Clarity:</span>
                  <span>{perf.averageClarity.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Depth:</span>
                  <span>{perf.averageDepth.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Communication:</span>
                  <span>{perf.averageCommunication.toFixed(1)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STAR Completion */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">STAR Completion (Behavioral Questions)</h2>
        <div className="rounded border border-slate-200 p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Overall Complete:</span>
              <span className="font-semibold">{dashboardData.starCompletion.percentage}%</span>
            </div>
            <div className="mt-3 space-y-1 border-t pt-3 text-sm">
              <div className="flex justify-between">
                <span>Situation:</span>
                <span>{dashboardData.starCompletion.situationCompletion}%</span>
              </div>
              <div className="flex justify-between">
                <span>Task:</span>
                <span>{dashboardData.starCompletion.taskCompletion}%</span>
              </div>
              <div className="flex justify-between">
                <span>Action:</span>
                <span>{dashboardData.starCompletion.actionCompletion}%</span>
              </div>
              <div className="flex justify-between">
                <span>Result:</span>
                <span>{dashboardData.starCompletion.resultCompletion}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Score Trends */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Score Trends (Last 30 Days)</h2>
        <div className="rounded border border-slate-200 p-4">
          {dashboardData.scoreTrends.length === 0 ? (
            <p className="text-sm text-slate-600">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {dashboardData.scoreTrends.map((trend) => (
                <div key={trend.date} className="flex justify-between text-sm">
                  <span className="text-slate-600">{trend.date}</span>
                  <span className="font-semibold">{trend.averageScore.toFixed(1)}/5</span>
                  <span className="text-xs text-slate-500">({trend.sessionCount} session{trend.sessionCount > 1 ? "s" : ""})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Sessions */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Recent Practice Sessions</h2>
        <div className="space-y-2">
          {dashboardData.recentSessions.length === 0 ? (
            <p className="text-sm text-slate-600">No sessions yet.</p>
          ) : (
            dashboardData.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm">
                <span className="text-slate-600">{session.createdAt.toLocaleDateString()}</span>
                <span>
                  {session.completedCount}/{session.questionCount} completed
                </span>
                <span className="font-semibold">{session.averageScore.toFixed(1)}/5</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Top Coaching Tips */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Top Coaching Tips</h2>
        <div className="space-y-2">
          {dashboardData.topCoachingTips.length === 0 ? (
            <p className="text-sm text-slate-600">No coaching tips yet.</p>
          ) : (
            dashboardData.topCoachingTips.map((tip, idx) => (
              <div key={idx} className="rounded border border-slate-200 p-3 text-sm">
                <div className="flex items-start justify-between">
                  <p className="flex-1">{tip.tip}</p>
                  <span className="ml-2 text-xs text-slate-500">×{tip.count}</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">From: {tip.fromProvider}</div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
