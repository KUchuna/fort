import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { timeEntries, workTasks } from "@/lib/auth-schema";
import { redirect } from "next/navigation";
import { eq, and, isNull, desc } from "drizzle-orm";
import FocusTimer from "@/components/Work/FocusTimer";
import { LayoutDashboard } from "lucide-react";
import TaskBoard from "@/components/Work/TaskBoard";



export default async function WorkDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  if (session.user.role !== "admin") {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-md text-center">
                <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
                <p className="text-gray-500">You do not have permission to view the Audit Hub.</p>
                <a href="/" className="block mt-4 text-black underline">Go Home</a>
            </div>
        </div>
     );
  }
  // 1. Fetch Active Timer (if any)
  const activeTimer = await db.query.timeEntries.findFirst({
    where: and(
        eq(timeEntries.userId, session.user.id), 
        isNull(timeEntries.endTime)
    ),
  });

  // 2. Fetch Recent Logs (Last 5)
  const recentLogs = await db.query.timeEntries.findMany({
    where: eq(timeEntries.userId, session.user.id),
    orderBy: [desc(timeEntries.createdAt)],
    limit: 5
  });

  const tasks = await db.select().from(workTasks).where(eq(workTasks.userId, session.user.id));
  
  return (
    <main className="min-h-screen bg-[#F9F1F0] pt-24 px-6 md:px-12 pb-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex items-center gap-4">
          <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center">
             <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-gilroy text-black">Audit Hub</h1>
            <p className="text-gray-500">Track time and manage client requests.</p>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
          {/* Left Column: Timer Widget (Takes 1 col) */}
          <div className="lg:col-span-1 flex flex-col gap-8">
             <FocusTimer activeTimer={activeTimer as any} />
             
             {/* Mini Recent Log */}
             <div className="bg-white/50 rounded-3xl p-6 border border-[#FADCD9]">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                    {recentLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-center text-sm">
                            <div>
                                <div className="font-bold text-black">{log.clientName}</div>
                                <div className="text-gray-400 text-xs">{log.description}</div>
                            </div>
                            <div className="font-mono text-gray-500">
                                {log.duration ? `${Math.floor(log.duration / 60)}m` : 'Running...'}
                            </div>
                        </div>
                    ))}
                    {recentLogs.length === 0 && <div className="text-gray-400 text-sm">No activity yet.</div>}
                </div>
             </div>
          </div>

          {/* Right Column: Task Board (Placeholder for now) (Takes 2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-[#FADCD9] min-h-[500px]">
                {/* 👇 Pass tasks to the board */}
                <TaskBoard initialTasks={tasks} />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}