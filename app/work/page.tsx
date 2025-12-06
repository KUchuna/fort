import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { clients, timeEntries, workTasks, workTodos } from "@/lib/auth-schema";
import { redirect } from "next/navigation";
import { eq, and, isNull, desc } from "drizzle-orm";
import FocusTimer from "@/components/Work/FocusTimer";
import { LayoutDashboard, History, Users } from "lucide-react";
import TaskBoard from "@/components/Work/TaskBoard";
import QuickTaskFab from "@/components/Work/QuickTaskFab";
import TodoList from "@/components/Work/TodoList";
import EngagementStats from "@/components/Work/EngagementStats"; 
import ClientManager from "@/components/Work/ClientManager";

export default async function WorkDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/wishlist/login");

  if (session?.user.role !== "admin") {
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

  // --- DATA FETCHING ---
  const activeTimerData = await db.query.timeEntries.findFirst({
    where: and(
        eq(timeEntries.userId, session.user.id), 
        isNull(timeEntries.endTime)
    ),
    with: {
        client: true,
    }
  });

  const recentLogs = await db.query.timeEntries.findMany({
    where: eq(timeEntries.userId, session.user.id),
    orderBy: [desc(timeEntries.createdAt)],
    limit: 5
  });

  const allClients = await db.select().from(clients).where(eq(clients.userId, session.user.id));

  const tasksData = await db.query.workTasks.findMany({
      where: eq(workTasks.userId, session.user.id),
      with: { client: true }
  });

  const todosData = await db.query.workTodos.findMany({
      where: eq(workTodos.userId, session.user.id),
      with: { client: true },
      orderBy: [desc(workTodos.createdAt)]
  });

    const formattedTasks = tasksData.map(t => ({ ...t, clientName: t.client?.name || "Unknown" }));
    const formattedTodos = todosData.map(t => ({ ...t, clientName: t.client?.name || "Personal" }));
    const formattedActiveTimer = activeTimerData ? {
        ...activeTimerData,
        clientName: activeTimerData.client?.name || "Unknown Client"
    } : null;

  return (
    <main className="min-h-screen bg-[#F9F1F0] pt-24 px-6 md:px-12 pb-24">
      <div className="max-w-[1600px] mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/20">
                <LayoutDashboard className="w-6 h-6" />
            </div>
            <div>
                <h1 className="text-3xl font-bold font-gilroy text-black">Audit Hub</h1>
                <p className="text-gray-500 text-sm">Welcome back, {session.user.name}</p>
            </div>
          </div>
        </header>

        {/* --- 1. STATS ROW --- */}
        <EngagementStats tasks={formattedTasks} />

        {/* --- 2. MAIN WORKSPACE (Active Work) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-6">
            
            {/* LEFT: Focus & Todos (4 Columns) */}
            <div className="xl:col-span-4 flex flex-col gap-6 h-[800px]">
                {/* Timer (Fixed Height) */}
                <div className="flex-shrink-0">
                    <FocusTimer 
                    activeTimer={formattedActiveTimer} 
                    clients={allClients} 
                />
                </div>
                
                {/* To-Do List (Flex Grow - Takes remaining height) */}
                <div className="flex-1 min-h-0">
                    <TodoList initialTodos={formattedTodos} />
                </div>
            </div>
        
            {/* RIGHT: Kanban Board (8 Columns) */}
            <div className="xl:col-span-8 md:h-[800px]">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#FADCD9] h-full overflow-hidden">
                    <TaskBoard initialTasks={formattedTasks} clients={allClients} />
                </div>
            </div>

        </div>

        {/* --- 3. BOTTOM DRAWER (Management & History) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Client Manager */}
            <ClientManager clients={allClients} />

            {/* Recent Logs (Moved here to clear space) */}
            <div className="bg-white rounded-3xl p-6 border border-[#FADCD9] shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-gray-400 uppercase text-xs font-bold tracking-widest">
                    <History className="w-4 h-4" /> Recent Time Logs
                </div>
                <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2">
                    {recentLogs.map(log => (
                        <div key={log.id} className="flex justify-between items-center text-sm p-3 bg-gray-50 rounded-xl">
                            <div>
                                {/* 👇 FIXED LINE */}
                                <div className="font-bold text-black">
                                    {allClients.find(c => c.id === log.clientId)?.name || "Unknown Client"}
                                </div>
                                
                                <div className="text-gray-400 text-xs break-words">{log.description?.slice(0,100) || "No description"}</div>
                            </div>
                            <div className="font-mono font-bold text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-100 shadow-sm">
                                {log.duration ? `${Math.floor(log.duration / 60)}m` : 'Running'}
                            </div>
                        </div>
                    ))}
                    {recentLogs.length === 0 && <div className="text-gray-400 text-sm italic">No time logged yet.</div>}
                </div>
            </div>

        </div>
      </div>
      
      <QuickTaskFab clients={allClients}/>
    </main>
  );
}