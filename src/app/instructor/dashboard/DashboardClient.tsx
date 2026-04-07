"use client";

import { useState } from "react";
import InviteCodeBanner from "./InviteCodeBanner";
import StudentTable from "./StudentTable";
import LiveFeed from "./LiveFeed";
import AlertPanel from "./AlertPanel";
import ClassAnalytics from "./ClassAnalytics";
import CreateClassModal from "./CreateClassModal";
import MessageComposer from "./MessageComposer";
import WelcomeSlideshow from "./WelcomeSlideshow";
import type { StudentRow } from "./StudentTable";
import type { FeedItem } from "./LiveFeed";
import type { AnalyticsData } from "./ClassAnalytics";
import FollowUpPanel from "./FollowUpPanel";
import ClassSettings from "./ClassSettings";
import type { TeacherAlert } from "@/lib/types";

export interface ClassFlag {
  id: string;
  student_id: string;
  priority: string;
  note: string | null;
  due_date: string | null;
  created_at: string;
  profiles: { full_name: string | null; business_idea: { name: string } | null } | null;
}

export interface ClassData {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string | null;
  students: StudentRow[];
  feedItems: FeedItem[];
  alerts: (TeacherAlert & { student_name: string })[];
  analytics: AnalyticsData;
  flags: ClassFlag[];
  streaksEnabled: boolean;
  voiceEnabled: boolean;
}

interface DashboardClientProps {
  classes: ClassData[];
  totalLessons: number;
}

type SubTab = "students" | "feed" | "alerts" | "followups" | "analytics" | "settings";

export default function DashboardClient({ classes, totalLessons }: DashboardClientProps) {
  const [activeClassIdx, setActiveClassIdx] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("students");
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [welcomeKey, setWelcomeKey] = useState(0); // increment to trigger reopen
  const [messageTarget, setMessageTarget] = useState<{
    classId: string;
    className: string;
    studentId: string | null;
    studentName: string | null;
    studentCount: number;
  } | null>(null);

  const activeClass = classes[activeClassIdx] ?? null;
  const totalStudents = classes.reduce((sum, c) => sum + c.students.length, 0);
  const totalAlerts = classes.reduce((sum, c) => sum + c.alerts.length, 0);

  const activeFlags = activeClass?.flags ?? [];
  const subTabs: { key: SubTab; label: string; count?: number }[] = [
    { key: "students", label: "Students", count: activeClass?.students.length },
    { key: "feed", label: "Live Feed" },
    { key: "alerts", label: "Alerts", count: activeClass?.alerts.length },
    { key: "followups", label: "Follow-ups", count: activeFlags.length },
    { key: "analytics", label: "Analytics" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <>
      <WelcomeSlideshow key={welcomeKey} />

      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--primary)]">
            Adaptable
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Instructor Dashboard
          </span>
          <div className="ml-auto flex items-center gap-4">
            <a
              href="/standards"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              Curriculum Standards
            </a>
            <button
              onClick={() => {
                localStorage.removeItem("adaptable_instructor_welcomed");
                setWelcomeKey((k) => k + 1);
              }}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
            >
              How it works
            </button>
            <form action="/auth/signout" method="POST">
              <button className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
              Your Classes
            </h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {totalStudents} student{totalStudents !== 1 ? "s" : ""} across{" "}
              {classes.length} class{classes.length !== 1 ? "es" : ""}
              {totalAlerts > 0 && (
                <span className="ml-2 text-[var(--warning)]">
                  {totalAlerts} alert{totalAlerts !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowCreateClass(true)}
            className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors"
          >
            + New class
          </button>
        </div>

        {/* Class tabs */}
        {classes.length === 0 ? (
          <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-12 text-center">
            <p className="text-lg font-medium text-[var(--text-primary)]">
              No classes yet
            </p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Create your first class to get started. Students will join using an invite code.
            </p>
            <button
              onClick={() => setShowCreateClass(true)}
              className="mt-4 rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--primary-light)] transition-colors"
            >
              Create your first class
            </button>
          </div>
        ) : (
          <>
            {/* Class selector tabs */}
            {classes.length > 1 && (
              <div className="mt-6 flex items-center gap-1 border-b border-[var(--border)]">
                {classes.map((cls, idx) => (
                  <button
                    key={cls.id}
                    onClick={() => {
                      setActiveClassIdx(idx);
                      setActiveSubTab("students");
                    }}
                    className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                      idx === activeClassIdx
                        ? "text-[var(--primary)]"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {cls.name}
                    {cls.alerts.length > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--warning)] px-1 text-[10px] font-bold text-white">
                        {cls.alerts.length}
                      </span>
                    )}
                    {idx === activeClassIdx && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--primary)]" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Active class content */}
            {activeClass && (
              <div className="mt-6 space-y-6">
                {/* Invite code banner */}
                <InviteCodeBanner
                  inviteCode={activeClass.inviteCode}
                  className={activeClass.name}
                  studentCount={activeClass.students.length}
                />

                {/* Sub-tabs */}
                <div className="flex items-center gap-1">
                  {subTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveSubTab(tab.key)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeSubTab === tab.key
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      {tab.label}
                      {tab.count !== undefined && tab.count > 0 && (
                        <span
                          className={`ml-1.5 text-xs ${
                            activeSubTab === tab.key
                              ? "text-white/80"
                              : "text-[var(--text-muted)]"
                          }`}
                        >
                          ({tab.count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Sub-tab content */}
                {activeSubTab === "students" && (
                  <StudentTable
                    students={activeClass.students}
                    classId={activeClass.id}
                    className={activeClass.name}
                    totalLessons={totalLessons}
                  />
                )}

                {activeSubTab === "feed" && (
                  <LiveFeed items={activeClass.feedItems} />
                )}

                {activeSubTab === "alerts" && (
                  <AlertPanel
                    alerts={activeClass.alerts}
                    classIds={[activeClass.id]}
                    onMessageStudent={(studentId, studentName) =>
                      setMessageTarget({
                        classId: activeClass.id,
                        className: activeClass.name,
                        studentId,
                        studentName,
                        studentCount: activeClass.students.length,
                      })
                    }
                  />
                )}

                {activeSubTab === "followups" && (
                  <FollowUpPanel flags={activeFlags as ClassFlag[]} />
                )}

                {activeSubTab === "analytics" && (
                  <ClassAnalytics data={activeClass.analytics} />
                )}

                {activeSubTab === "settings" && (
                  <ClassSettings
                    classId={activeClass.id}
                    className={activeClass.name}
                    initialStreaksEnabled={activeClass.streaksEnabled}
                    initialVoiceEnabled={activeClass.voiceEnabled}
                  />
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateClass && (
        <CreateClassModal onClose={() => setShowCreateClass(false)} />
      )}

      {/* Message Composer Modal */}
      {messageTarget && (
        <MessageComposer
          classId={messageTarget.classId}
          className={messageTarget.className}
          studentId={messageTarget.studentId}
          studentName={messageTarget.studentName}
          studentCount={messageTarget.studentCount}
          onClose={() => setMessageTarget(null)}
        />
      )}
    </>
  );
}
