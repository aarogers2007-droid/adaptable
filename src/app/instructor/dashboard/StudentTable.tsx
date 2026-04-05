"use client";

import { useState } from "react";
import StudentDetail from "./StudentDetail";
import MessageComposer from "./MessageComposer";
import type { StudentDetailStudent } from "./StudentDetail";
import type { BusinessIdea, IkigaiResult } from "@/lib/types";

export interface StudentRow {
  id: string;
  full_name: string | null;
  email: string | null;
  enrolled_at: string;
  business_idea: BusinessIdea | null;
  ikigai_result: IkigaiResult | null;
  completedLessons: number;
  totalLessons: number;
  lastActive: string | null;
  lessonProgress: {
    lessonTitle: string;
    moduleSequence: number;
    lessonSequence: number;
    status: string;
    completedAt: string | null;
  }[];
  learningProfile?: Record<string, string> | null;
}

interface StudentTableProps {
  students: StudentRow[];
  classId: string;
  className: string;
  totalLessons: number;
}

function getActivityStatus(lastActive: string | null): "active" | "recent" | "inactive" {
  if (!lastActive) return "inactive";
  const diff = Date.now() - new Date(lastActive).getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 1) return "active";
  if (days < 3) return "recent";
  return "inactive";
}

const STATUS_DOT: Record<string, string> = {
  active: "bg-[var(--success)]",
  recent: "bg-[var(--accent)]",
  inactive: "bg-[var(--bg-muted)]",
};

export default function StudentTable({
  students,
  classId,
  className: cls,
  totalLessons,
}: StudentTableProps) {
  const [selectedStudent, setSelectedStudent] = useState<StudentDetailStudent | null>(null);
  const [messageTarget, setMessageTarget] = useState<{
    studentId: string | null;
    studentName: string | null;
  } | null>(null);

  function openStudentDetail(student: StudentRow) {
    setSelectedStudent(student);
  }

  function openMessageForStudent(studentId: string, name: string | null) {
    setMessageTarget({ studentId, studentName: name });
  }

  function openAnnouncement() {
    setMessageTarget({ studentId: null, studentName: null });
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] overflow-hidden">
        {/* Table header actions */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <span className="text-sm text-[var(--text-secondary)]">
            {students.length} student{students.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={openAnnouncement}
            className="rounded-lg border border-[var(--primary)] px-4 py-1.5 text-xs font-medium text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
          >
            Send announcement
          </button>
        </div>

        {students.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[var(--text-secondary)]">No students enrolled yet.</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Share your class invite code to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-subtle)]">
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Last Active</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const status = getActivityStatus(student.lastActive);
                  const pct =
                    totalLessons > 0
                      ? Math.round((student.completedLessons / totalLessons) * 100)
                      : 0;

                  return (
                    <tr
                      key={student.id}
                      className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-subtle)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
                          <div>
                            <button
                              onClick={() => openStudentDetail(student)}
                              className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors text-left"
                            >
                              {student.full_name || "Unnamed"}
                            </button>
                            <p className="text-xs text-[var(--text-muted)]">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {student.business_idea ? (
                          <span className="text-[var(--text-primary)]">
                            {student.business_idea.name}
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">Not started</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-[var(--bg-muted)]">
                            <div
                              className="h-1.5 rounded-full bg-[var(--primary)] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs tabular-nums text-[var(--text-muted)]">
                            {student.completedLessons}/{totalLessons}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                        {student.lastActive
                          ? new Date(student.lastActive).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            openMessageForStudent(student.id, student.full_name)
                          }
                          className="rounded-md px-3 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg-muted)] transition-colors"
                        >
                          Message
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetail
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onMessage={() => {
            setMessageTarget({
              studentId: selectedStudent.id,
              studentName: selectedStudent.full_name,
            });
          }}
        />
      )}

      {/* Message Composer Modal */}
      {messageTarget && (
        <MessageComposer
          classId={classId}
          className={cls}
          studentId={messageTarget.studentId}
          studentName={messageTarget.studentName}
          studentCount={students.length}
          onClose={() => setMessageTarget(null)}
        />
      )}
    </>
  );
}
