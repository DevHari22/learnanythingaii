"use client";

import React, { useState, useEffect, useRef } from "react";
import LandingPage from "./components/LandingPage";

const API = process.env.NEXT_PUBLIC_API_URL || "${API}";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  timestamp: string;
}

interface QuizQuestion {
  id: string;
  type: "mcq" | "true-false";
  question: string;
  options?: string[];
  correctAnswer: any;
  explanation: string;
}

interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedTime: string;
  requirements: string[];
  functionName?: string;
  testCases?: { input: any; expected: any }[];
}

interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  quiz?: Quiz;
  assignment?: Assignment;
}

interface Classroom {
  course: {
    title: string;
    source: string;
    duration: string;
    totalLessons: number;
    difficulty: string;
    tags: string[];
    skills: string[];
    learningObjectives?: string[];
  };
  modules: Module[];
}

interface ClassroomRecord {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  classroom: Classroom;
  completedLessons: string[];
  lastLessonId: string | null;
  lastTimestamp: number;
  quizResults: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

interface UserPreferences {
  domains: string[];
  skills: string[];
  level: string;
}

interface RecommendedVideo {
  videoId: string;
  url: string;
  title: string;
  channel: string;
  verified: boolean;
  views: number;
  viewsText: string;
  duration: number;
  durationText: string;
  published: string;
  thumbnail: string;
  query: string;
  reason?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ReviewStats {
  due: number;
  total: number;
  reviewedToday: number;
  streak: number;
}

interface ReviewItem {
  videoId: string;
  videoTitle: string | null;
  questionId: string;
  question: QuizQuestion;
}

interface ConceptMastery {
  slug: string;
  name: string;
  correct: number;
  total: number;
  accuracy: number;
  mastery: number;
  level: "strong" | "average" | "weak" | "building";
  needsReview: boolean;
  lastReviewedAt: string | null;
}

interface KnowledgeProfile {
  concepts: ConceptMastery[];
  summary: {
    headline: string;
    counts: { strong: number; average: number; weak: number; building: number; total: number };
    strong: string[];
    average: string[];
    weak: string[];
    review: string[];
  };
}

export default function DashboardPage() {
  const [email, setEmail] = useState<string>("");
  const [classrooms, setClassrooms] = useState<ClassroomRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "completed">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Workspace / split-screen states
  const [selectedClassroom, setSelectedClassroom] = useState<ClassroomRecord | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"syllabus" | "chat" | "notes" | "quiz" | "assignment">("syllabus");
  const [playerUrl, setPlayerUrl] = useState<string>("");
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Notes states
  const [noteText, setNoteText] = useState<string>("");
  const [noteStatus, setNoteStatus] = useState<string>("");
  const [savingNote, setSavingNote] = useState<boolean>(false);

  // Interest profile + personalized video suggestions
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [recsLoading, setRecsLoading] = useState<boolean>(false);
  const [recsError, setRecsError] = useState<string | null>(null);
  // Which chosen interest (skill/domain) the recommendation feed is filtered to ("all" = every group).
  const [recFilter, setRecFilter] = useState<string>("all");
  // Top-level page: dashboard home, "My Classrooms", Analytics, or Knowledge profile.
  const [view, setView] = useState<"home" | "classrooms" | "analytics" | "knowledge">("home");
  const [activity, setActivity] = useState<{ date: string; count: number }[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeProfile | null>(null);
  const [conceptRecs, setConceptRecs] = useState<{ concept: string; videos: RecommendedVideo[] }[]>([]);
  const [conceptRecsLoading, setConceptRecsLoading] = useState<boolean>(false);

  const [dashboardReport, setDashboardReport] = useState<any>(null);
  const [dashboardTimeline, setDashboardTimeline] = useState<any>(null);
  const [dashboardNextStep, setDashboardNextStep] = useState<any>(null);
  const [nextStepLoading, setNextStepLoading] = useState(false);

  // Resume recap ("welcome back") state.
  const [recapOpen, setRecapOpen] = useState<boolean>(false);
  const [recapText, setRecapText] = useState<string>("");
  const [recapLoading, setRecapLoading] = useState<boolean>(false);
  const [recapQuestions, setRecapQuestions] = useState<ReviewItem[]>([]);

  // Spaced-repetition "Daily Review" state.
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [dueReviews, setDueReviews] = useState<ReviewItem[]>([]);
  const [reviewOpen, setReviewOpen] = useState<boolean>(false);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState<boolean>(false);

  const fetchClassrooms = async (userEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API}/api/classrooms?email=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) {
        throw new Error("Failed to load your progress data. Please try again.");
      }
      const body = await res.json();
      if (body.success && Array.isArray(body.data)) {
        setClassrooms(body.data);
      } else {
        setClassrooms([]);
      }
    } catch (err: any) {
      setError(err.message || "Could not retrieve classrooms from backend.");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async (userEmail: string, refresh: boolean = false) => {
    setRecsLoading(true);
    setRecsError(null);
    try {
      const res = await fetch(
        `${API}/api/recommendations?email=${encodeURIComponent(userEmail)}${refresh ? "&refresh=true" : ""}`
      );
      const body = await res.json();
      if (res.ok && body.success && Array.isArray(body.videos)) {
        setRecommendations(body.videos);
      } else {
        setRecsError(body.detail?.message || "Could not load video suggestions.");
      }
    } catch {
      setRecsError("Could not reach the backend for video suggestions.");
    } finally {
      setRecsLoading(false);
    }
  };

  const loadKnowledge = async (userEmail: string) => {
    try {
      const res = await fetch(
        `${API}/api/concepts/profile?email=${encodeURIComponent(userEmail)}`
      );
      const body = await res.json();
      if (res.ok && body.success && body.summary) {
        setKnowledge({ concepts: body.concepts || [], summary: body.summary });
      }
    } catch {
      // Non-fatal: the Knowledge page just shows its empty state.
    }
  };

  const loadConceptRecs = async (userEmail: string) => {
    setConceptRecsLoading(true);
    try {
      const res = await fetch(
        `${API}/api/concepts/recommendations?email=${encodeURIComponent(userEmail)}`
      );
      const body = await res.json();
      if (res.ok && body.success && Array.isArray(body.groups)) {
        setConceptRecs(body.groups);
      }
    } catch {
      // Non-fatal: the "recommended to improve" section just stays empty.
    } finally {
      setConceptRecsLoading(false);
    }
  };

  const loadActivity = async (userEmail: string) => {
    try {
      const res = await fetch(
        `${API}/api/reviews/activity?email=${encodeURIComponent(userEmail)}&days=30`
      );
      const body = await res.json();
      if (res.ok && body.success && Array.isArray(body.activity)) {
        setActivity(body.activity);
      }
    } catch {
      // Non-fatal: the activity chart just stays empty.
    }
  };

  const fetchDashboard = (userEmail: string) => {
    Promise.all([
      fetch(`${API}/api/dashboard/weekly-report?email=${encodeURIComponent(userEmail)}`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/dashboard/timeline?email=${encodeURIComponent(userEmail)}`).then(r => r.json()).catch(() => null),
    ]).then(([report, timeline]) => {
      setDashboardReport(report);
      setDashboardTimeline(timeline);
    });
    setNextStepLoading(true);
    setDashboardNextStep(null);
    fetch(`${API}/api/dashboard/next-step?email=${encodeURIComponent(userEmail)}`)
      .then(r => r.json())
      .then(data => setDashboardNextStep(data))
      .catch(() => {})
      .finally(() => setNextStepLoading(false));
  };

  const loadReviewStats = async (userEmail: string) => {
    try {
      const res = await fetch(
        `${API}/api/reviews/stats?email=${encodeURIComponent(userEmail)}`
      );
      const body = await res.json();
      if (res.ok && body.success && body.stats) {
        setReviewStats(body.stats);
      }
    } catch {
      // Non-fatal: the Daily Review card just won't show counts.
    }
  };

  // Record an answered question into the spaced-repetition schedule.
  const gradeReview = async (
    videoId: string,
    questionId: string,
    correct: boolean,
    question?: QuizQuestion,
    videoTitle?: string | null
  ) => {
    try {
      await fetch("${API}/api/reviews/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, videoId, questionId, correct, question, videoTitle }),
      });
    } catch (err) {
      console.warn("Failed to schedule review item:", err);
    }
  };

  const startReview = async () => {
    if (!email) return;
    setReviewLoading(true);
    try {
      const res = await fetch(
        `${API}/api/reviews/due?email=${encodeURIComponent(email)}`
      );
      const body = await res.json();
      if (res.ok && body.success && Array.isArray(body.items) && body.items.length > 0) {
        setDueReviews(body.items);
        setReviewOpen(true);
      } else {
        setDueReviews([]);
        setReviewOpen(true);
      }
    } catch {
      setDueReviews([]);
      setReviewOpen(true);
    } finally {
      setReviewLoading(false);
    }
  };

  const loadPreferences = async (userEmail: string) => {
    try {
      const res = await fetch(
        `${API}/api/users/preferences?email=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) return;
      const body = await res.json();
      if (body.needsOnboarding) {
        // First time here: ask for interests before suggesting anything.
        setShowOnboarding(true);
      } else if (body.preferences) {
        setPreferences(body.preferences);
        loadRecommendations(userEmail);
      }
    } catch (err) {
      console.warn("Failed to load preferences:", err);
    }
  };

  const savePreferences = async (prefs: UserPreferences) => {
    const res = await fetch("${API}/api/users/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...prefs }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body.detail?.message || "Failed to save your interests.");
    }
    setPreferences(prefs);
    setShowOnboarding(false);
    loadRecommendations(email);
  };

  useEffect(() => {
    if (email) {
      loadPreferences(email);
      loadReviewStats(email);
      loadKnowledge(email);
      fetchDashboard(email);
    }
  }, [email]);

  // Refresh analytics data whenever the user opens the Analytics page.
  useEffect(() => {
    if (email && view === "analytics") {
      loadActivity(email);
      loadReviewStats(email);
      fetchDashboard(email);
    }
    if (email && view === "knowledge") {
      loadKnowledge(email);
      loadConceptRecs(email);
    }
  }, [view, email]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
      localStorage.setItem("lai_dashboard_email", emailParam);
      fetchClassrooms(emailParam);
    } else {
      const stored = localStorage.getItem("lai_dashboard_email");
      if (stored) {
        setEmail(stored);
        fetchClassrooms(stored);
      }
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const signInWithEmail = (addr: string) => {
    const clean = addr.trim();
    if (!clean) return;
    setEmail(clean);
    localStorage.setItem("lai_dashboard_email", clean);
    fetchClassrooms(clean);
  };

  const handleSignOut = () => {
    setEmail("");
    setClassrooms([]);
    localStorage.removeItem("lai_dashboard_email");
    setSelectedClassroom(null);
    setPreferences(null);
    setShowOnboarding(false);
    setRecommendations([]);
    setRecsError(null);
    window.history.pushState({}, document.title, window.location.pathname);
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedIds(next);
  };

  // Duration parser helper
  const parseDurationToSeconds = (durationStr: string): number => {
    if (!durationStr || typeof durationStr !== "string") return 0;
    
    if (durationStr.includes(":")) {
      const parts = durationStr.split(":").map(Number);
      if (parts.length === 3) {
        return (isNaN(parts[0]) ? 0 : parts[0] * 3600) +
               (isNaN(parts[1]) ? 0 : parts[1] * 60) +
               (isNaN(parts[2]) ? 0 : parts[2]);
      }
      if (parts.length === 2) {
        return (isNaN(parts[0]) ? 0 : parts[0] * 60) +
               (isNaN(parts[1]) ? 0 : parts[1]);
      }
      return isNaN(parts[0]) ? 0 : parts[0];
    }
    
    const numericOnly = durationStr.replace(/[^0-9]/g, "");
    const parsed = parseInt(numericOnly, 10);
    if (!isNaN(parsed)) {
      return parsed * 60;
    }
    return 0;
  };

  const playerRef = useRef<any>(null);
  const selectedClassroomRef = useRef<ClassroomRecord | null>(null);

  // Keep reference up to date for the background polling interval
  useEffect(() => {
    selectedClassroomRef.current = selectedClassroom;
  }, [selectedClassroom]);

  // Load YouTube Player API on mount
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }
  }, []);

  // Track player time and update progress
  useEffect(() => {
    if (!selectedClassroom) {
      playerRef.current = null;
      setActiveLessonId(null);
      return;
    }

    let intervalId: any;

    // Create a local timeline map
    const timeline: { id: string; start: number; end: number }[] = [];
    selectedClassroom.classroom.modules.forEach((mod) => {
      mod.lessons?.forEach((l) => {
        const start = parseDurationToSeconds(l.timestamp);
        const duration = parseDurationToSeconds(l.duration);
        timeline.push({ id: l.id, start, end: start + duration });
      });
    });
    timeline.sort((a, b) => a.start - b.start);

    const saveCompletedLessons = async (completedList: string[]) => {
      const current = selectedClassroomRef.current;
      if (!current) return;

      const updatedRecord: ClassroomRecord = {
        ...current,
        completedLessons: completedList,
      };

      setSelectedClassroom(updatedRecord);
      setClassrooms((prev) =>
        prev.map((c) => (c.videoId === current.videoId ? updatedRecord : c))
      );

      try {
        await fetch("${API}/api/classrooms/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            videoId: current.videoId,
            videoTitle: current.videoTitle,
            videoUrl: current.videoUrl,
            classroom: current.classroom,
            completedLessons: completedList,
            lastLessonId: current.lastLessonId,
            lastTimestamp: current.lastTimestamp,
            quizResults: current.quizResults,
          }),
        });
      } catch (err) {
        console.warn("Failed to sync auto-completed lesson progress:", err);
      }
    };

    const checkProgress = (currentTime: number) => {
      const match = timeline.find((item) => currentTime >= item.start && currentTime < item.end);
      if (match) {
        setActiveLessonId(match.id);
      }

      // Auto-check completed lessons
      const current = selectedClassroomRef.current;
      if (current) {
        let updated = false;
        const nextCompleted = new Set(current.completedLessons || []);
        
        timeline.forEach((item) => {
          if (currentTime >= item.end && !nextCompleted.has(item.id)) {
            nextCompleted.add(item.id);
            updated = true;
          }
        });

        if (updated) {
          saveCompletedLessons(Array.from(nextCompleted));
        }
      }
    };

    const saveProgressToDb = async (secs: number) => {
      const current = selectedClassroomRef.current;
      if (!current) return;
      try {
        await fetch("${API}/api/classrooms/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            videoId: current.videoId,
            videoTitle: current.videoTitle,
            videoUrl: current.videoUrl,
            classroom: current.classroom,
            completedLessons: current.completedLessons,
            lastLessonId: activeLessonId,
            lastTimestamp: secs,
            quizResults: current.quizResults,
          }),
        });
      } catch (err) {
        console.warn("Failed to auto-save progress:", err);
      }
    };

    let lastSavedTime = 0;

    const setupPlayer = () => {
      const win = window as any;
      if (win.YT && win.YT.Player) {
        playerRef.current = new win.YT.Player("youtube-player", {
          events: {
            onStateChange: (event: any) => {
              if (event.data === win.YT.PlayerState.PLAYING) {
                intervalId = setInterval(async () => {
                  if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                    const secs = Math.floor(playerRef.current.getCurrentTime());
                    checkProgress(secs);
                    
                    if (Math.abs(secs - lastSavedTime) >= 5) {
                      lastSavedTime = secs;
                      await saveProgressToDb(secs);
                    }
                  }
                }, 1000);
              } else {
                clearInterval(intervalId);
              }
            }
          }
        });
      }
    };

    const win = window as any;
    if (win.YT && win.YT.Player) {
      setupPlayer();
    } else {
      const checkYT = setInterval(() => {
        if (win.YT && win.YT.Player) {
          setupPlayer();
          clearInterval(checkYT);
        }
      }, 500);
      return () => {
        clearInterval(checkYT);
        clearInterval(intervalId);
      };
    }

    return () => {
      clearInterval(intervalId);
    };
  }, [selectedClassroom?.videoId]);

  const getCourseStats = (record: ClassroomRecord) => {
    const lessons = record.classroom?.modules?.flatMap((m) => m.lessons || []) || [];
    const total = lessons.length || 1;
    const completed = record.completedLessons?.length || 0;
    const progress = Math.min(100, Math.round((completed / total) * 100));

    let totalSeconds = 0;
    let completedSeconds = 0;

    lessons.forEach((l) => {
      const sec = parseDurationToSeconds(l.duration);
      totalSeconds += sec;
      if (record.completedLessons?.includes(l.id)) {
        completedSeconds += sec;
      }
    });

    const totalMinutes = Math.round(totalSeconds / 60);
    const completedMinutes = Math.round(completedSeconds / 60);

    return {
      total,
      completed,
      pending: Math.max(0, total - completed),
      progress,
      isCompleted: progress === 100,
      totalMinutes,
      completedMinutes,
    };
  };

  // Load notes for a course
  const loadNotesForCourse = async (vidId: string) => {
    try {
      const res = await fetch(
        `${API}/api/notes/load?email=${encodeURIComponent(email)}&videoId=${encodeURIComponent(vidId)}`
      );
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.data) {
          setNoteText(body.data.noteText || "");
        } else {
          setNoteText("");
        }
      }
    } catch (err) {
      console.warn("Failed to load notes:", err);
    }
  };

  // Save notes for a course
  const saveNotesForCourse = async () => {
    if (!selectedClassroom) return;
    setSavingNote(true);
    setNoteStatus("Saving...");
    try {
      const res = await fetch("${API}/api/notes/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          videoId: selectedClassroom.videoId,
          noteText,
        }),
      });
      if (res.ok) {
        setNoteStatus("Saved!");
        setTimeout(() => setNoteStatus(""), 2000);
      } else {
        setNoteStatus("Failed to save note");
      }
    } catch (err) {
      console.error("Notes save failed:", err);
      setNoteStatus("Failed to save note");
    } finally {
      setSavingNote(false);
    }
  };

  // Open full learning split-screen player
  const openClassroomWorkspace = (record: ClassroomRecord) => {
    setSelectedClassroom(record);
    setWorkspaceTab("syllabus");
    setChatMessages([]);
    setNoteText("");
    setNoteStatus("");
    
    // Set initial YouTube iframe source
    const startSec = record.lastTimestamp > 0 ? record.lastTimestamp : 0;
    setPlayerUrl(
      `https://www.youtube.com/embed/${record.videoId}?enablejsapi=1&autoplay=1&start=${startSec}`
    );

    // Fetch saved notes for this course
    loadNotesForCourse(record.videoId);

    // Make sure this course's quiz questions are tagged with concepts (idempotent;
    // the server skips if already tagged) so graded answers feed the learner model.
    fetch("${API}/api/concepts/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, videoId: record.videoId }),
    }).catch(() => {});

    // If there's prior progress, greet the learner with a recap of what they covered.
    const hasPriorProgress =
      (record.completedLessons?.length || 0) > 0 || record.lastTimestamp > 0;
    if (hasPriorProgress) {
      setRecapQuestions(buildRecapQuestions(record));
      fetchRecap(record);
    }
  };

  // Pull a few quiz questions from the modules the learner has already started,
  // so the recap can actively test what they covered last time.
  const buildRecapQuestions = (record: ClassroomRecord): ReviewItem[] => {
    const fromStarted: ReviewItem[] = [];
    const all: ReviewItem[] = [];
    (record.classroom?.modules || []).forEach((mod) => {
      const lessonIds = (mod.lessons || []).map((l) => l.id);
      const started = lessonIds.some((id) => record.completedLessons?.includes(id));
      (mod.quiz?.questions || []).forEach((q) => {
        if (!q.id) return;
        const item: ReviewItem = {
          videoId: record.videoId,
          videoTitle: record.videoTitle,
          questionId: q.id,
          question: q,
        };
        all.push(item);
        if (started) fromStarted.push(item);
      });
    });
    const pool = fromStarted.length > 0 ? fromStarted : all;
    return pool.slice(0, 5);
  };

  // Build a "welcome back" recap of previously completed lessons.
  const fetchRecap = async (record: ClassroomRecord) => {
    const lessons = record.classroom?.modules?.flatMap((m) => m.lessons || []) || [];
    const completedTitles = lessons
      .filter((l) => record.completedLessons?.includes(l.id))
      .map((l) => l.title);
    const nextLesson = lessons.find((l) => !record.completedLessons?.includes(l.id))?.title || null;
    const stats = getCourseStats(record);

    setRecapText("");
    setRecapLoading(true);
    setRecapOpen(true);
    try {
      const res = await fetch("${API}/api/recap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: record.videoTitle,
          completedLessons: completedTitles,
          nextLesson,
          progress: stats.progress,
        }),
      });
      const body = await res.json();
      setRecapText(body.recap || "Welcome back! Let's pick up where you left off.");
    } catch {
      setRecapText("Welcome back! Let's pick up where you left off.");
    } finally {
      setRecapLoading(false);
    }
  };

  // Seek video to specific timestamp segment
  const seekVideoSeconds = (seconds: number) => {
    if (!selectedClassroom) return;
    setPlayerUrl(
      `https://www.youtube.com/embed/${selectedClassroom.videoId}?enablejsapi=1&autoplay=1&start=${seconds}`
    );
  };

  // Toggling completed status in the split screen syllabus
  const toggleWorkspaceLessonComplete = async (lessonId: string) => {
    if (!selectedClassroom) return;
    const completed = new Set(selectedClassroom.completedLessons);
    if (completed.has(lessonId)) {
      completed.delete(lessonId);
    } else {
      completed.add(lessonId);
    }

    const updatedRecord: ClassroomRecord = {
      ...selectedClassroom,
      completedLessons: Array.from(completed),
    };

    setSelectedClassroom(updatedRecord);
    setClassrooms((prev) =>
      prev.map((c) => (c.videoId === selectedClassroom.videoId ? updatedRecord : c))
    );

    // Save update to backend
    try {
      await fetch("${API}/api/classrooms/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          videoId: selectedClassroom.videoId,
          videoTitle: selectedClassroom.videoTitle,
          videoUrl: selectedClassroom.videoUrl,
          classroom: selectedClassroom.classroom,
          completedLessons: updatedRecord.completedLessons,
          lastLessonId: selectedClassroom.lastLessonId,
          lastTimestamp: selectedClassroom.lastTimestamp,
          quizResults: selectedClassroom.quizResults,
        }),
      });
    } catch (err) {
      console.warn("Failed to sync progress update:", err);
    }
  };

  // Saving quiz performance updates
  const handleSaveQuizResult = async (questionId: string, correct: boolean, question?: QuizQuestion) => {
    if (!selectedClassroom) return;
    const nextResults = { ...selectedClassroom.quizResults, [questionId]: correct };

    // Seed/advance the spaced-repetition schedule for this question.
    gradeReview(
      selectedClassroom.videoId,
      questionId,
      correct,
      question,
      selectedClassroom.videoTitle
    ).then(() => loadReviewStats(email));
    
    const updatedRecord: ClassroomRecord = {
      ...selectedClassroom,
      quizResults: nextResults,
    };

    setSelectedClassroom(updatedRecord);
    setClassrooms((prev) =>
      prev.map((c) => (c.videoId === selectedClassroom.videoId ? updatedRecord : c))
    );

    // Save update to backend
    try {
      await fetch("${API}/api/classrooms/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          videoId: selectedClassroom.videoId,
          videoTitle: selectedClassroom.videoTitle,
          videoUrl: selectedClassroom.videoUrl,
          classroom: selectedClassroom.classroom,
          completedLessons: selectedClassroom.completedLessons,
          lastLessonId: selectedClassroom.lastLessonId,
          lastTimestamp: selectedClassroom.lastTimestamp,
          quizResults: nextResults,
        }),
      });
    } catch (err) {
      console.warn("Failed to sync quiz progress:", err);
    }
  };

  // Send AI Chatbot query
  const sendChatQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = chatInput.trim();
    if (!query || !selectedClassroom) return;

    const userMessage: ChatMessage = { role: "user", content: query };
    const nextMessages = [...chatMessages, userMessage];
    
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("${API}/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: chatMessages,
          courseOutline: selectedClassroom.classroom,
        }),
      });
      if (res.ok) {
        const body = await res.json();
        if (body.success && body.response) {
          setChatMessages([
            ...nextMessages,
            { role: "assistant", content: body.response },
          ]);
        }
      } else {
        setChatMessages([
          ...nextMessages,
          { role: "assistant", content: "Sorry, I had trouble reaching the study server. Please check your backend connection." },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages([
        ...nextMessages,
        { role: "assistant", content: "I encountered a network error while generating an answer." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const filteredClassrooms = classrooms.filter((c) => {
    const matchesSearch = c.videoTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const stats = getCourseStats(c);
    if (activeTab === "completed") {
      return matchesSearch && stats.isCompleted;
    }
    if (activeTab === "pending") {
      return matchesSearch && !stats.isCompleted;
    }
    return matchesSearch;
  });

  const totalCourses = classrooms.length;
  const completedCourses = classrooms.filter((c) => getCourseStats(c).isCompleted).length;
  const pendingCourses = totalCourses - completedCourses;
  
  const totalMinutesCompleted = classrooms.reduce(
    (sum, c) => sum + getCourseStats(c).completedMinutes,
    0
  );

  // --- RECOMMENDATIONS: group the feed by the user's chosen interests ---
  // The user's interest profile, skills first (more specific) then domains.
  const interestOptions: string[] = [
    ...(preferences?.skills || []),
    ...(preferences?.domains || []),
  ];

  // Break an interest like "UI/UX Design" into matchable keyword tokens so a
  // video doesn't have to contain the interest name verbatim to be attributed.
  const REC_STOPWORDS = new Set(["and", "the", "for", "with", "your", "you", "of", "to", "in", "a", "an"]);
  const interestTokens = (interest: string): string[] =>
    interest
      .toLowerCase()
      .split(/[^a-z0-9+#]+/)
      .filter((t) => t && t.length >= 2 && !REC_STOPWORDS.has(t));

  // How strongly a video matches an interest = number of interest keywords that
  // appear in the search query it came from or in its title.
  const interestMatchScore = (video: RecommendedVideo, interest: string): number => {
    const haystack = `${video.query || ""} ${video.title || ""}`.toLowerCase();
    const tokens = interestTokens(interest);
    if (tokens.length === 0) return 0;
    return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
  };

  // Assign every recommended video to its best-matching chosen interest so each
  // video appears under exactly one of the interests the user picked. Only the
  // (rare) videos that match nothing fall into a "More picks" group.
  const recommendationGroups: { interest: string; videos: RecommendedVideo[] }[] = (() => {
    const groups = interestOptions.map((interest) => ({
      interest,
      videos: [] as RecommendedVideo[],
    }));
    const leftovers: RecommendedVideo[] = [];

    recommendations.forEach((video) => {
      // interestOptions is skills-first, so ties naturally prefer specific skills.
      let bestIndex = -1;
      let bestScore = 0;
      groups.forEach((group, idx) => {
        const score = interestMatchScore(video, group.interest);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = idx;
        }
        
      });

      if (bestIndex >= 0) {
        groups[bestIndex].videos.push(video);
      } else {
        leftovers.push(video);
      }

    });

    const result = groups.filter((g) => g.videos.length > 0);
    if (leftovers.length > 0) {
      result.push({ interest: "More picks for you", videos: leftovers });
    }
    return result;
  })();

  const visibleRecommendationGroups =
    recFilter === "all"
      ? recommendationGroups
      : recommendationGroups.filter((g) => g.interest === recFilter);

  // --- LANDING PAGE (unauthenticated) ---
  if (!email) {
    return <LandingPage onSignIn={signInWithEmail} />;
  }

  // --- SPLIT SCREEN LEARNING WORKSPACE VIEW ---
  if (selectedClassroom) {
    const stats = getCourseStats(selectedClassroom);

    return (
      <div className="flex flex-col h-screen bg-zinc-50 font-sans text-zinc-800 overflow-hidden">
        {/* Workspace Header */}
        <header className="border-b border-zinc-200 bg-white px-4 py-3 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedClassroom(null)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
            <div className="h-4 w-[1px] bg-zinc-200" />
            <h1 className="text-sm font-bold text-zinc-900 line-clamp-1 max-w-[500px]">
              {selectedClassroom.videoTitle}
            </h1>
          </div>
          <div className="text-xs text-zinc-400 font-medium">
            Progress: {stats.progress}% ({stats.completedMinutes}m / {stats.totalMinutes}m)
          </div>
        </header>

        {/* Split screen body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left panel: Embedded Video and Details */}
          <div className="flex-1 p-6 flex flex-col overflow-y-auto min-h-0 bg-white">
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-200 bg-black shadow-md">
              <iframe
                id="youtube-player"
                src={playerUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                {selectedClassroom.classroom?.course?.difficulty && (
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[10px] font-semibold text-indigo-600 border border-indigo-100">
                    {selectedClassroom.classroom.course.difficulty}
                  </span>
                )}
                {selectedClassroom.classroom?.course?.tags?.slice(0, 3).map((tag, tagIdx) => (
                  <span key={tagIdx} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600">
                    #{tag}
                  </span>
                ))}
              </div>
              <h2 className="text-xl font-extrabold text-zinc-900 leading-snug">
                {selectedClassroom.videoTitle}
              </h2>
              <p className="mt-2 text-xs text-zinc-400">
                Source URL: <a href={selectedClassroom.videoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">{selectedClassroom.videoUrl}</a>
              </p>
              
              {selectedClassroom.classroom?.course?.learningObjectives && (
                <div className="mt-6 rounded-2xl bg-zinc-50 border border-zinc-200/60 p-5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Learning Objectives</h4>
                  <ul className="mt-3 space-y-2 text-xs text-zinc-600 font-medium">
                    {selectedClassroom.classroom.course.learningObjectives.map((obj, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Tabbed syllabus checklist, Chatbot, Notes */}
          <div className="w-full md:w-[440px] border-t md:border-t-0 md:border-l border-zinc-200 bg-zinc-50 flex flex-col flex-shrink-0 min-h-0 h-full">
            {/* Right Tabs */}
            <div className="flex border-b border-zinc-200 bg-white p-2 gap-1 flex-shrink-0 flex-wrap">
              <button
                onClick={() => setWorkspaceTab("syllabus")}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all min-w-[65px] ${
                  workspaceTab === "syllabus"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                Syllabus
              </button>
              <button
                onClick={() => setWorkspaceTab("chat")}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all min-w-[65px] ${
                  workspaceTab === "chat"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                AI Chat
              </button>
              <button
                onClick={() => setWorkspaceTab("notes")}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all min-w-[65px] ${
                  workspaceTab === "notes"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                Notes
              </button>
              <button
                onClick={() => setWorkspaceTab("quiz")}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all min-w-[65px] ${
                  workspaceTab === "quiz"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                Quiz
              </button>
              <button
                onClick={() => setWorkspaceTab("assignment")}
                className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all min-w-[85px] ${
                  workspaceTab === "assignment"
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                Assignment
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              
              {/* TAB 1: Syllabus Checklist */}
              {workspaceTab === "syllabus" && (
                <div className="space-y-6 pb-6">
                  {selectedClassroom.classroom?.modules?.map((mod, modIdx) => (
                    <div key={mod.id || modIdx} className="space-y-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded bg-indigo-50 text-[10px] font-bold text-indigo-600 border border-indigo-100">
                          {modIdx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-zinc-900 leading-snug line-clamp-1">{mod.title}</h4>
                      </div>
                      
                      <div className="space-y-2 mt-2">
                        {mod.lessons?.map((les) => {
                          const isCompleted = selectedClassroom.completedLessons?.includes(les.id);
                          const isActive = activeLessonId === les.id;
                          
                          const seekSeconds = (() => {
                            const parts = les.timestamp?.split(":").map(Number) || [];
                            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
                            if (parts.length === 2) return parts[0] * 60 + parts[1];
                            return parts[0] || 0;
                          })();

                          return (
                            <div
                              key={les.id}
                              className={`flex items-center justify-between rounded-xl border p-2.5 transition-all text-xs ${
                                isCompleted
                                  ? "border-emerald-200 bg-emerald-50/20 text-zinc-700 font-medium"
                                  : isActive
                                  ? "border-indigo-400 bg-indigo-50/30 text-indigo-950 font-bold shadow-sm"
                                  : "border-zinc-100 bg-zinc-50/50 text-zinc-500 hover:border-zinc-200"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  onClick={() => toggleWorkspaceLessonComplete(les.id)}
                                  className={`h-4.5 w-4.5 flex-shrink-0 flex items-center justify-center rounded border border-zinc-300 transition-all ${
                                    isCompleted ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white"
                                  }`}
                                >
                                  {isCompleted && (
                                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                      <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                  )}
                                </button>
                                <span className="font-semibold text-zinc-800 truncate" title={les.title}>{les.title}</span>
                              </div>

                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <span className="text-[10px] text-zinc-400 font-mono">{les.duration}</span>
                                {les.timestamp && (
                                  <button
                                    onClick={() => seekVideoSeconds(seekSeconds)}
                                    className="rounded bg-zinc-200 hover:bg-zinc-300 px-1.5 py-0.5 text-[9px] font-bold text-indigo-700 font-mono"
                                    title="Jump to timeline"
                                  >
                                    {les.timestamp}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: AI Chatbot */}
              {workspaceTab === "chat" && (
                <div className="flex flex-col h-[calc(100vh-130px)] bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Messages list */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-0 scrollbar-thin">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                        <span className="text-3xl">🤖</span>
                        <h4 className="mt-2 text-xs font-bold text-zinc-800">LearnAnythingAI Study Assistant</h4>
                        <p className="mt-1 text-[11px] text-zinc-500 max-w-[240px]">
                          Ask questions about any concepts, code implementations, or modules in this course.
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => {
                        const isUser = msg.role === "user";
                        return (
                          <div
                            key={index}
                            className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                                isUser
                                  ? "bg-indigo-600 text-white rounded-br-none"
                                  : "bg-zinc-100 text-zinc-850 rounded-bl-none"
                              }`}
                            >
                              <p className="whitespace-pre-line">{msg.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-100 text-zinc-500 rounded-2xl rounded-bl-none px-3.5 py-2.5 text-xs shadow-sm flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Message Input form */}
                  <form onSubmit={sendChatQuery} className="border-t border-zinc-200 p-2.5 flex items-center gap-2 bg-zinc-50 flex-shrink-0">
                    <input
                      type="text"
                      placeholder="Ask the AI study assistant..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:border-indigo-400"
                    />
                    <button
                      type="submit"
                      disabled={chatLoading}
                      className="h-8 w-8 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex-shrink-0"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: Notes Notepad */}
              {workspaceTab === "notes" && (
                <div className="flex flex-col h-[calc(100vh-130px)] bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="flex-1 p-3 flex flex-col min-h-0">
                    <textarea
                      placeholder="Type your study notes here... Your notes are automatically saved to your account database."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="flex-1 w-full p-2.5 text-xs text-zinc-800 placeholder-zinc-400 resize-none outline-none font-medium leading-relaxed bg-white border-0"
                    />
                  </div>
                  
                  <div className="border-t border-zinc-200 px-4 py-2.5 bg-zinc-50 flex items-center justify-between flex-shrink-0">
                    <span className="text-[10px] font-semibold text-zinc-500 font-mono">
                      {noteStatus || (savingNote ? "Saving..." : "")}
                    </span>
                    <button
                      onClick={saveNotesForCourse}
                      disabled={savingNote}
                      className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all"
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: Quiz */}
              {workspaceTab === "quiz" && (
                <QuizTabPanel
                  classroomData={selectedClassroom.classroom}
                  quizResults={selectedClassroom.quizResults}
                  onSaveQuizResult={handleSaveQuizResult}
                />
              )}

              {/* TAB 5: Assignment */}
              {workspaceTab === "assignment" && (
                <AssignmentTabPanel
                  classroomData={selectedClassroom.classroom}
                  email={email}
                  videoId={selectedClassroom.videoId}
                />
              )}

            </div>
          </div>
        </div>

        {recapOpen && (
          <RecapModal
            loading={recapLoading}
            recap={recapText}
            questions={recapQuestions}
            onGrade={(item, correct) =>
              gradeReview(item.videoId, item.questionId, correct, item.question, item.videoTitle)
            }
            onClose={() => {
              setRecapOpen(false);
              loadReviewStats(email);
              loadKnowledge(email);
            }}
          />
        )}
      </div>
    );
  }

  // --- STANDARD GRID DASHBOARD MAIN VIEW ---
  const displayName = email ? email.split("@")[0] : "there";
  const rs: ReviewStats = reviewStats ?? { due: 0, total: 0, reviewedToday: 0, streak: 0 };

  const navBtn = (target: "home" | "classrooms" | "analytics" | "knowledge", label: string) => (
    <button
      onClick={() => setView(target)}
      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
        view === target ? "bg-indigo-600 text-white shadow-sm" : "text-zinc-600 hover:bg-zinc-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-[1760px] items-center justify-between px-4 py-3.5 sm:px-6 lg:px-10">
          <button onClick={() => setView("home")} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 shadow-sm">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-5 w-5 text-white"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
              </svg>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-zinc-950">
              LearnAnything<span className="text-indigo-600">AI</span>
            </span>
          </button>

          {/* Page navigation: Dashboard <-> My Classrooms */}
          <nav className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-1">
            {navBtn("home", "Dashboard")}
            {navBtn("classrooms", "My Classrooms")}
            {navBtn("analytics", "Analytics")}
            {navBtn("knowledge", "Knowledge")}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 rounded-full border border-zinc-200 bg-white py-1 pl-1 pr-3 lg:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold uppercase text-white">
                {(email || "?").charAt(0)}
              </div>
              <span className="max-w-[160px] truncate text-xs font-semibold text-zinc-600">{email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-zinc-200 bg-white hover:bg-zinc-100 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-all active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1760px] px-4 py-8 sm:px-6 lg:px-10">
        {/* Loading / Error banner */}
        {loading && (
          <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 py-4 text-sm text-indigo-700">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            Synchronizing data from MySQL database...
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {view === "classrooms" ? (
          <MyClassroomsPage
            classrooms={classrooms}
            filteredClassrooms={filteredClassrooms}
            totalCourses={totalCourses}
            completedCourses={completedCourses}
            pendingCourses={pendingCourses}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            expandedIds={expandedIds}
            toggleExpand={toggleExpand}
            getCourseStats={getCourseStats}
            openClassroomWorkspace={openClassroomWorkspace}
            onBack={() => setView("home")}
          />
        ) : view === "analytics" ? (
          <AnalyticsPage
            classrooms={classrooms}
            getCourseStats={getCourseStats}
            reviewStats={reviewStats}
            activity={activity}
            openClassroomWorkspace={openClassroomWorkspace}
            onBack={() => setView("home")}
            dashboardReport={dashboardReport}
            dashboardTimeline={dashboardTimeline}
            dashboardNextStep={dashboardNextStep}
            nextStepLoading={nextStepLoading}
          />
        ) : view === "knowledge" ? (
          <KnowledgePage
            knowledge={knowledge}
            conceptRecs={conceptRecs}
            conceptRecsLoading={conceptRecsLoading}
            onBack={() => setView("home")}
          />
        ) : (
        <>
        {/* Greeting hero */}
        <section className="mb-8">
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
            Welcome back, <span className="capitalize text-indigo-600">{displayName}</span> 👋
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Pick up where you left off, or explore fresh videos picked for your interests.
          </p>
        </section>

        {/* Daily Review (spaced repetition) */}
        {/* <section className="mb-10 flex flex-col gap-4 overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
              🧠
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">Daily Review</h3>
                {rs.streak > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    🔥 {rs.streak}-day streak
                  </span>
                )}
                {rs.total > 0 && (
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                    {rs.total} in deck
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-zinc-600">
                {rs.total === 0
                  ? "Answer quiz questions in your courses to start building your spaced-repetition deck."
                  : rs.due > 0
                  ? `${rs.due} ${rs.due === 1 ? "concept is" : "concepts are"} due to keep them in memory.`
                  : rs.reviewedToday > 0
                  ? `All caught up — ${rs.reviewedToday} reviewed today. Nice work!`
                  : "You're all caught up. Check back tomorrow for more reviews."}
              </p>
            </div>
          </div>
          <button
            onClick={rs.total === 0 ? () => setView("classrooms") : startReview}
            disabled={reviewLoading || (rs.total > 0 && rs.due === 0)}
            className={`flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all active:scale-95 ${
              rs.total === 0 || rs.due > 0
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "cursor-not-allowed bg-zinc-200 text-zinc-400"
            }`}
          >
            {reviewLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : rs.total === 0 ? (
              "Browse courses"
            ) : rs.due > 0 ? (
              <>
                Start Review ({rs.due})
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </>
            ) : (
              "Caught up ✓"
            )}
          </button>
        </section> */}

        {/* Knowledge snapshot — compact icon pill */}
        {knowledge && knowledge.summary.counts.total > 0 && (
          <>
            <div className="mb-6 flex items-center gap-2">
              <button
                onClick={() => setShowKnowledgeModal(true)}
                className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95"
              >
                <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span>Knowledge Snapshot</span>
                {knowledge.summary.weak.length > 0 && (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                    {knowledge.summary.weak.length} to improve
                  </span>
                )}
                {knowledge.summary.strong.length > 0 && knowledge.summary.weak.length === 0 && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">All strong</span>
                )}
                <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {knowledge.summary.weak.length > 0 && (
                <button
                  onClick={startReview}
                  disabled={reviewLoading}
                  className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-1.5 text-xs font-semibold text-rose-600 transition-all hover:bg-rose-100 active:scale-95"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Quick review
                </button>
              )}
            </div>

            {/* Knowledge detail modal */}
            {showKnowledgeModal && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => { if (e.target === e.currentTarget) setShowKnowledgeModal(false); }}
              >
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowKnowledgeModal(false)} />
                <div className="relative flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                  {/* Header */}
                  <div className="border-b border-zinc-100 px-6 pb-5 pt-6">
                    <button
                      onClick={() => setShowKnowledgeModal(false)}
                      className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition-all hover:bg-zinc-200"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50">
                      <svg className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-extrabold text-zinc-900">Your Learning Intelligence</h2>
                    <p className="mt-1 text-sm text-zinc-500">
                      {knowledge.summary.counts.strong >= knowledge.summary.counts.weak
                        ? "You're ahead of the curve — keep the momentum going!"
                        : "Every expert was once a beginner. You're growing fast!"}
                    </p>
                    {/* Mini stat row */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {[
                        { label: "Strong", value: knowledge.summary.counts.strong, color: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" },
                        { label: "Building", value: (knowledge.summary.counts.average ?? 0) + (knowledge.summary.counts.building ?? 0), color: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
                        { label: "Needs Work", value: knowledge.summary.counts.weak, color: "bg-rose-50 text-rose-700 ring-1 ring-rose-200" },
                      ].map((s) => (
                        <div key={s.label} className={`rounded-xl px-3 py-2.5 text-center ${s.color}`}>
                          <p className="text-xl font-extrabold">{s.value}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Scrollable body */}
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Strengths */}
                    {knowledge.summary.strong.length > 0 && (
                      <div>
                        <div className="mb-2.5 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                            <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <h3 className="text-sm font-bold text-zinc-900">What you've mastered</h3>
                        </div>
                        <p className="mb-2.5 text-xs text-zinc-500">You're consistently getting these right — great work! Keep revisiting them occasionally to maintain mastery.</p>
                        <div className="flex flex-wrap gap-1.5">
                          {knowledge.summary.strong.map((n) => (
                            <span key={n} className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Growth opportunities */}
                    {knowledge.summary.weak.length > 0 && (
                      <div>
                        <div className="mb-2.5 flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100">
                            <svg className="h-3.5 w-3.5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <h3 className="text-sm font-bold text-zinc-900">Your growth opportunities</h3>
                        </div>
                        <p className="mb-3 text-xs text-zinc-500">These topics need more practice. The good news? Targeted review sessions will sharpen these quickly.</p>
                        <div className="space-y-2">
                          {knowledge.summary.weak.map((n, i) => (
                            <div key={n} className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/60 px-3.5 py-2.5">
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-200 text-[10px] font-extrabold text-rose-700">{i + 1}</span>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-zinc-800">{n}</p>
                                <p className="text-[11px] text-zinc-500">Answer more quiz questions on this topic to boost your score</p>
                              </div>
                              <svg className="h-4 w-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action plan */}
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">Your 3-step action plan</h3>
                      <ol className="space-y-2.5">
                        {[
                          knowledge.summary.weak.length > 0
                            ? `Do a review session focused on ${knowledge.summary.weak[0]}${knowledge.summary.weak.length > 1 ? ` and ${knowledge.summary.weak[1]}` : ""}`
                            : "Keep taking quizzes to reinforce what you know",
                          "Complete at least one lesson per day to maintain your streak",
                          knowledge.summary.strong.length > 0
                            ? `Celebrate your strength in ${knowledge.summary.strong[0]} — you've earned it!`
                            : "Visit the Knowledge page to see your full concept map",
                        ].map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-zinc-700">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-200 text-[10px] font-extrabold text-indigo-700">{i + 1}</span>
                            <span className="pt-0.5">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Footer CTAs */}
                  <div className="flex gap-2 border-t border-zinc-100 px-6 py-4">
                    {knowledge.summary.review.length > 0 && (
                      <button
                        onClick={() => { setShowKnowledgeModal(false); startReview(); }}
                        disabled={reviewLoading}
                        className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-indigo-700 active:scale-95"
                      >
                        Start Review Session
                      </button>
                    )}
                    <button
                      onClick={() => { setShowKnowledgeModal(false); setView("knowledge"); }}
                      className="flex-1 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-700 transition-all hover:bg-zinc-50 active:scale-95"
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Global Metrics Summary Grid */}
        <section className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total Courses",
              value: totalCourses,
              unit: "",
              tint: "bg-indigo-50 text-indigo-600",
              accent: "bg-indigo-600",
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              ),
            },
            {
              label: "Completed",
              value: completedCourses,
              unit: "",
              tint: "bg-emerald-50 text-emerald-600",
              accent: "bg-emerald-500",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
            {
              label: "In Progress",
              value: pendingCourses,
              unit: "",
              tint: "bg-amber-50 text-amber-600",
              accent: "bg-amber-500",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
            },
            {
              label: "Minutes Learned",
              value: totalMinutesCompleted,
              unit: "min",
              tint: "bg-zinc-100 text-zinc-700",
              accent: "bg-zinc-700",
              icon: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`absolute inset-y-0 left-0 w-1 ${stat.accent}`} />
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${stat.tint} transition-transform group-hover:scale-105`}>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  {stat.icon}
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="text-2xl font-extrabold leading-none tracking-tight text-zinc-900">
                  {stat.value}
                  {stat.unit && <span className="ml-1 text-sm font-bold text-zinc-400">{stat.unit}</span>}
                </h3>
                <p className="mt-1.5 text-xs font-semibold text-zinc-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* My Classrooms entry button */}
        {/* <button
          onClick={() => setView("classrooms")}
          className="mb-10 flex w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">My Classrooms</h3>
              <p className="text-xs text-zinc-500">
                {totalCourses} {totalCourses === 1 ? "course" : "courses"} • {completedCourses} completed • {pendingCourses} in progress
              </p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">
            Open
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </button> */}

        {/* Personalized Video Recommendations */}
        <section className="mb-10 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-zinc-900">
                Recommended for you
                <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  AI picks
                </span>
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {preferences
                  ? "High-quality YouTube videos, grouped by each interest you chose."
                  : "Tell us what you want to learn and we'll suggest high-quality videos."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Interest filter dropdown — choose which chosen skill/interest to view */}
              {preferences && recommendationGroups.length > 0 && (
                <div className="relative">
                  <select
                    value={recFilter}
                    onChange={(e) => setRecFilter(e.target.value)}
                    className="appearance-none rounded-full border border-indigo-200 bg-white py-2 pl-4 pr-9 text-xs font-semibold text-zinc-700 shadow-sm outline-none transition-all hover:border-indigo-300 focus:border-indigo-400"
                  >
                    <option value="all">All interests ({recommendations.length})</option>
                    {recommendationGroups.map((g) => (
                      <option key={g.interest} value={g.interest}>
                        {g.interest} ({g.videos.length})
                      </option>
                    ))}
                  </select>
                  <svg
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              )}
              <button
                onClick={() => setShowOnboarding(true)}
                className="rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-700 transition-all active:scale-95"
              >
                Edit Interests
              </button>
              {preferences && (
                <button
                  onClick={() => loadRecommendations(email, true)}
                  disabled={recsLoading}
                  className="flex items-center gap-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
                >
                  <svg className={`h-3.5 w-3.5 ${recsLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              )}
            </div>
          </div>

          {/* Quick interest chips (also drive the same filter) */}
          {preferences && recommendationGroups.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-2">
              <button
                onClick={() => setRecFilter("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  recFilter === "all"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                }`}
              >
                All
              </button>
              {recommendationGroups.map((g) => (
                <button
                  key={g.interest}
                  onClick={() => setRecFilter(g.interest)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    recFilter === g.interest
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                  }`}
                >
                  {g.interest}
                </button>
              ))}
            </div>
          )}

          {recsLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-indigo-100 bg-white/70 py-12 text-sm text-indigo-700">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
              Finding the best professional videos for you...
            </div>
          ) : recsError ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-4 text-sm text-amber-700">
              {recsError}
            </div>
          ) : visibleRecommendationGroups.length > 0 ? (
            // Each chosen interest gets its OWN separated section of videos.
            <div className="space-y-8">
              {visibleRecommendationGroups.map((group) => (
                <div key={group.interest}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-5 w-1.5 rounded-full bg-indigo-600" />
                    <h3 className="text-sm font-bold capitalize text-zinc-900">{group.interest}</h3>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                      {group.videos.length} {group.videos.length === 1 ? "video" : "videos"}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {group.videos.map((video) => (
                      <a
                        key={video.videoId}
                        href={video.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                          {video.thumbnail && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg">
                              <svg className="ml-0.5 h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M6.3 2.8A1 1 0 005 3.7v12.6a1 1 0 001.5.9l10-6.3a1 1 0 000-1.7l-10-6.4z" />
                              </svg>
                            </span>
                          </span>
                          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {video.durationText}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <h4 className="line-clamp-2 text-sm font-bold leading-snug text-zinc-900 group-hover:text-indigo-700">
                            {video.title}
                          </h4>
                          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-zinc-600">
                            <span className="line-clamp-1">{video.channel}</span>
                            {video.verified && (
                              <svg className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2l2.4 2.4 3.4-.5.5 3.4L21 9.6 19.6 12 21 14.4l-2.7 2.3-.5 3.4-3.4-.5L12 22l-2.4-2.4-3.4.5-.5-3.4L3 14.4 4.4 12 3 9.6l2.7-2.3.5-3.4 3.4.5L12 2zm-1.2 13.5l5-5-1.4-1.4-3.6 3.6-1.6-1.6-1.4 1.4 3 3z" />
                              </svg>
                            )}
                          </div>
                          <p className="mt-1 text-[11px] text-zinc-400">
                            {video.viewsText} • {video.published}
                          </p>
                          {video.reason && (
                            <p className="mt-auto pt-2 text-[11px] italic leading-snug text-indigo-500/80">
                              {video.reason}
                            </p>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-4 py-10 text-center text-sm text-zinc-500">
              No videos matched "{recFilter}". Try another interest.
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-indigo-200 bg-white/60 py-12 text-center">
              <span className="text-4xl">🎯</span>
              <h3 className="mt-4 text-base font-semibold text-zinc-700">No suggestions yet</h3>
              <p className="mt-1 max-w-xs text-sm text-zinc-500">
                Pick the domains you're interested in and the skills you want to learn, and we'll
                suggest high-quality professional YouTube videos.
              </p>
              <button
                onClick={() => setShowOnboarding(true)}
                className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all"
              >
                Choose My Interests
              </button>
            </div>
          )}
        </section>
        </>
        )}
      </main>

      {showOnboarding && (
        <OnboardingModal
          initial={preferences}
          onSave={savePreferences}
          onClose={() => setShowOnboarding(false)}
        />
      )}

      {reviewOpen && (
        <DailyReviewModal
          items={dueReviews}
          onGrade={(item, correct) =>
            gradeReview(item.videoId, item.questionId, correct, item.question, item.videoTitle)
          }
          onClose={() => {
            setReviewOpen(false);
            loadReviewStats(email);
          }}
        />
      )}

      {recapOpen && (
        <RecapModal
          loading={recapLoading}
          recap={recapText}
          questions={recapQuestions}
          onGrade={(item, correct) =>
            gradeReview(item.videoId, item.questionId, correct, item.question, item.videoTitle)
          }
          onClose={() => {
            setRecapOpen(false);
            loadReviewStats(email);
            loadKnowledge(email);
          }}
        />
      )}
    </div>
  );
}

interface CourseStats {
  total: number;
  completed: number;
  pending: number;
  progress: number;
  isCompleted: boolean;
  totalMinutes: number;
  completedMinutes: number;
}

interface MyClassroomsPageProps {
  classrooms: ClassroomRecord[];
  filteredClassrooms: ClassroomRecord[];
  totalCourses: number;
  completedCourses: number;
  pendingCourses: number;
  activeTab: "all" | "pending" | "completed";
  setActiveTab: (tab: "all" | "pending" | "completed") => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  expandedIds: Set<string>;
  toggleExpand: (id: string) => void;
  getCourseStats: (record: ClassroomRecord) => CourseStats;
  openClassroomWorkspace: (record: ClassroomRecord) => void;
  onBack: () => void;
}

function MyClassroomsPage({
  classrooms,
  filteredClassrooms,
  totalCourses,
  completedCourses,
  pendingCourses,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  expandedIds,
  toggleExpand,
  getCourseStats,
  openClassroomWorkspace,
  onBack,
}: MyClassroomsPageProps) {
  const tabs = [
    { key: "all", label: "All", count: totalCourses },
    { key: "pending", label: "In Progress", count: pendingCourses },
    { key: "completed", label: "Completed", count: completedCourses },
  ] as const;

  return (
    <div>
      {/* Page header */}
      <section className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:bg-zinc-100 active:scale-95"
          aria-label="Back to dashboard"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">My Classrooms</h1>
          <p className="text-sm text-zinc-500">
            {totalCourses} {totalCourses === 1 ? "course" : "courses"} • {completedCourses} completed • {pendingCourses} in progress
          </p>
        </div>
      </section>

      {/* Toolbar: tabs + search */}
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-2xl border border-zinc-200 bg-white p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  activeTab === tab.key ? "bg-white/25 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search classrooms by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pr-4 pl-10 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Classroom cards grid */}
      {filteredClassrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <span className="text-4xl">📚</span>
          <h3 className="mt-4 text-base font-semibold text-zinc-700">No classrooms found</h3>
          <p className="mt-1 max-w-xs text-sm text-zinc-500">
            {classrooms.length === 0
              ? "Use the LearnAnythingAI extension while watching a YouTube video to build your first AI-generated course outline."
              : "No classrooms match the active search query or status filter."}
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {filteredClassrooms.map((record) => {
            const stats = getCourseStats(record);
            const isExpanded = expandedIds.has(record.videoId);

            return (
              <div key={record.videoId} className="group flex flex-col">
                {/* Clickable course tile (whole card resumes the course) */}
                <button
                  onClick={() => openClassroomWorkspace(record)}
                  className="block text-left"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                    <img
                      src={`https://img.youtube.com/vi/${record.videoId}/mqdefault.jpg`}
                      alt={record.videoTitle}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/25 group-hover:opacity-100">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg">
                        <svg className="ml-0.5 h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M6.3 2.8A1 1 0 005 3.7v12.6a1 1 0 001.5.9l10-6.3a1 1 0 000-1.7l-10-6.4z" />
                        </svg>
                      </span>
                    </span>
                    {stats.isCompleted && (
                      <span className="absolute left-1.5 top-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
                        ✓ Completed
                      </span>
                    )}
                    {/* Progress bar pinned to the bottom of the thumbnail */}
                    {stats.progress > 0 && !stats.isCompleted && (
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/30">
                        <div className="h-full bg-indigo-500" style={{ width: `${stats.progress}%` }} />
                      </div>
                    )}
                  </div>

                  {/* Text block */}
                  <h4
                    className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-zinc-900 group-hover:text-indigo-700"
                    title={record.videoTitle}
                  >
                    {record.videoTitle}
                  </h4>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {record.classroom?.course?.difficulty && (
                      <span className="capitalize">{record.classroom.course.difficulty}</span>
                    )}
                    {record.classroom?.course?.difficulty && " · "}
                    {stats.total} {stats.total === 1 ? "lesson" : "lessons"} · {stats.totalMinutes}m
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-200">
                      <div
                        className={`h-full rounded-full ${stats.isCompleted ? "bg-emerald-500" : "bg-indigo-600"}`}
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-zinc-500">{stats.progress}%</span>
                  </div>
                </button>

                {/* Slim syllabus toggle */}
                <button
                  onClick={() => toggleExpand(record.videoId)}
                  className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-zinc-500 transition-colors hover:text-indigo-600"
                >
                  {isExpanded ? "Hide syllabus" : "View syllabus"}
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expandable syllabus */}
                {isExpanded && (
                  <div className="mt-2 space-y-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                    {record.classroom?.modules?.map((mod, modIdx) => (
                      <div key={mod.id || modIdx} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="flex h-4 w-4 items-center justify-center rounded border border-indigo-100 bg-indigo-50 text-[9px] font-bold text-indigo-600">
                            {modIdx + 1}
                          </span>
                          <h5 className="truncate text-[11px] font-bold text-zinc-800">{mod.title}</h5>
                        </div>
                        <ul className="space-y-1 pl-1">
                          {mod.lessons?.map((les) => {
                            const isCompleted = record.completedLessons?.includes(les.id);
                            return (
                              <li key={les.id} className="flex items-center gap-1.5">
                                {isCompleted ? (
                                  <svg className="h-3 w-3 flex-shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full border-2 border-zinc-300" />
                                )}
                                <span className="truncate text-[11px] text-zinc-600">{les.title}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

interface DailyReviewModalProps {
  items: ReviewItem[];
  onGrade: (item: ReviewItem, correct: boolean) => void | Promise<void>;
  onClose: () => void;
}

function DailyReviewModal({ items, onGrade, onClose }: DailyReviewModalProps) {
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<any>(undefined);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const total = items.length;
  const current = items[index];
  const letters = ["A", "B", "C", "D"];

  const checkAnswer = () => {
    if (selection === undefined || !current) return;
    const isCorrect = selection === current.question.correctAnswer;
    setChecked(true);
    if (isCorrect) setCorrectCount((c) => c + 1);
    onGrade(current, isCorrect);
  };

  const next = () => {
    if (index + 1 >= total) {
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelection(undefined);
      setChecked(false);
    }
  };

  const isCorrectSoFar = checked && selection === current?.question.correctAnswer;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧠</span>
            <h2 className="text-base font-extrabold tracking-tight text-zinc-900">Daily Review</h2>
            {total > 0 && !finished && (
              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
                {index + 1} / {total}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress bar */}
        {total > 0 && !finished && (
          <div className="h-1 w-full bg-zinc-100">
            <div
              className="h-full bg-indigo-600 transition-all"
              style={{ width: `${(index / total) * 100}%` }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {total === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl">✅</span>
              <h3 className="mt-3 text-base font-semibold text-zinc-800">No reviews due</h3>
              <p className="mt-1 max-w-xs text-sm text-zinc-500">
                You're all caught up. Answer quiz questions in your courses to build your review deck,
                and check back tomorrow.
              </p>
            </div>
          ) : finished ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="text-4xl">🎉</span>
              <h3 className="mt-3 text-lg font-bold text-zinc-900">Review complete!</h3>
              <p className="mt-1 text-sm text-zinc-500">
                You got <span className="font-bold text-indigo-600">{correctCount}</span> of {total} correct.
                Items you missed will come back sooner.
              </p>
            </div>
          ) : current ? (
            <div className="space-y-4">
              {current.videoTitle && (
                <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                  From: {current.videoTitle}
                </p>
              )}
              <p className="text-sm font-bold leading-relaxed text-zinc-900">{current.question.question}</p>

              {/* MCQ */}
              {current.question.type === "mcq" && current.question.options && (
                <div className="space-y-2">
                  {current.question.options.map((opt, oi) => {
                    const isSelected = selection === oi;
                    const isOptionCorrect = current.question.correctAnswer === oi;
                    let cls = "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition-all ";
                    if (checked) {
                      if (isOptionCorrect) cls += "border-emerald-500 bg-emerald-50/40 text-emerald-800";
                      else if (isSelected) cls += "border-rose-500 bg-rose-50/40 text-rose-800";
                      else cls += "border-zinc-100 bg-zinc-50/50 text-zinc-400";
                    } else if (isSelected) {
                      cls += "border-indigo-500 bg-indigo-50/40 text-indigo-950";
                    } else {
                      cls += "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";
                    }
                    return (
                      <button key={oi} onClick={() => !checked && setSelection(oi)} disabled={checked} className={cls}>
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-current text-[10px] font-bold">
                          {letters[oi]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* True / False */}
              {current.question.type === "true-false" && (
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val, vi) => {
                    const isSelected = selection === val;
                    const isValCorrect = current.question.correctAnswer === val;
                    let cls = "rounded-xl border p-3 text-center text-sm font-bold transition-all ";
                    if (checked) {
                      if (isValCorrect) cls += "border-emerald-500 bg-emerald-50/40 text-emerald-800";
                      else if (isSelected) cls += "border-rose-500 bg-rose-50/40 text-rose-800";
                      else cls += "border-zinc-100 bg-zinc-50/50 text-zinc-400";
                    } else if (isSelected) {
                      cls += "border-indigo-500 bg-indigo-50/40 text-indigo-950";
                    } else {
                      cls += "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";
                    }
                    return (
                      <button key={vi} onClick={() => !checked && setSelection(val)} disabled={checked} className={cls}>
                        {val ? "True" : "False"}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Explanation */}
              {checked && (
                <div
                  className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                    isCorrectSoFar
                      ? "border-emerald-100 bg-emerald-50/50 text-emerald-900"
                      : "border-indigo-100 bg-indigo-50/50 text-indigo-900"
                  }`}
                >
                  <span className="mr-1 font-bold">
                    {isCorrectSoFar ? "✓ Correct." : "✗ Not quite."}
                  </span>
                  {current.question.explanation}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        {total > 0 && (
          <div className="border-t border-zinc-100 p-4">
            {finished ? (
              <button
                onClick={onClose}
                className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95"
              >
                Done
              </button>
            ) : !checked ? (
              <button
                onClick={checkAnswer}
                disabled={selection === undefined}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  selection === undefined
                    ? "cursor-not-allowed bg-zinc-100 text-zinc-400"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                }`}
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={next}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95"
              >
                {index + 1 >= total ? "Finish" : "Next"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Analytics page ----------------------------------------------------------

// ---- Shared tooltip for all charts ------------------------------------------

type TipState = { x: number; y: number; lines: string[] } | null;

function ChartTooltip({ tip }: { tip: TipState }) {
  if (!tip) return null;
  return (
    <div
      className="pointer-events-none fixed z-[9999] rounded-xl bg-zinc-900 px-3 py-2 shadow-2xl"
      style={{ left: tip.x + 14, top: tip.y - 10 }}
    >
      {tip.lines.map((l, i) => (
        <p key={i} className={`whitespace-nowrap text-xs ${i === 0 ? "font-bold text-white" : "text-zinc-400"}`}>{l}</p>
      ))}
    </div>
  );
}

// ---- Ring chart --------------------------------------------------------------

function Ring({
  value,
  size = 128,
  stroke = 12,
  color = "#4f46e5",
  caption,
  tooltipLabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  caption?: string;
  tooltipLabel?: string;
}) {
  const [tip, setTip] = useState<TipState>(null);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <>
      <ChartTooltip tip={tip} />
      <div
        className="relative cursor-default"
        style={{ width: size, height: size }}
        onMouseMove={(e) =>
          setTip({
            x: e.clientX,
            y: e.clientY,
            lines: [
              tooltipLabel ?? (caption ? caption.charAt(0).toUpperCase() + caption.slice(1) : "Progress"),
              `${value}% achieved`,
              `${100 - value}% remaining`,
            ],
          })
        }
        onMouseLeave={() => setTip(null)}
      >
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e4e4e7" strokeWidth={stroke} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-zinc-900">{value}%</span>
          {caption && <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{caption}</span>}
        </div>
      </div>
    </>
  );
}

interface CourseStatsLite {
  total: number;
  completed: number;
  pending: number;
  progress: number;
  isCompleted: boolean;
  totalMinutes: number;
  completedMinutes: number;
}

interface AnalyticsPageProps {
  classrooms: ClassroomRecord[];
  getCourseStats: (record: ClassroomRecord) => CourseStatsLite;
  reviewStats: ReviewStats | null;
  activity: { date: string; count: number }[];
  openClassroomWorkspace: (record: ClassroomRecord) => void;
  onBack: () => void;
  dashboardReport: any;
  dashboardTimeline: any;
  dashboardNextStep: any;
  nextStepLoading: boolean;
}

function AnalyticsPage({
  classrooms,
  getCourseStats,
  reviewStats,
  activity,
  openClassroomWorkspace,
  onBack,
  dashboardReport,
  dashboardTimeline,
  dashboardNextStep,
  nextStepLoading,
}: AnalyticsPageProps) {
  const courseStats = classrooms.map((c) => ({ record: c, stats: getCourseStats(c) }));

  let lessonsCompleted = 0;
  let lessonsTotal = 0;
  let minutes = 0;
  let correct = 0;
  let answered = 0;
  courseStats.forEach(({ record, stats }) => {
    lessonsCompleted += stats.completed;
    lessonsTotal += stats.total;
    minutes += stats.completedMinutes;
    Object.values(record.quizResults || {}).forEach((v) => {
      answered += 1;
      if (v) correct += 1;
    });
  });
  const overallPct = lessonsTotal ? Math.round((lessonsCompleted / lessonsTotal) * 100) : 0;
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;

  const skillMap = new Map<string, { completed: number; total: number; courses: number }>();
  courseStats.forEach(({ record, stats }) => {
    const course = record.classroom?.course;
    const skillList = (course?.skills && course.skills.length ? course.skills : course?.tags) || [];
    skillList.forEach((skill) => {
      const e = skillMap.get(skill) || { completed: 0, total: 0, courses: 0 };
      e.completed += stats.completed;
      e.total += stats.total;
      e.courses += 1;
      skillMap.set(skill, e);
    });
  });
  const skills = Array.from(skillMap.entries())
    .map(([name, e]) => ({ name, pct: e.total ? Math.round((e.completed / e.total) * 100) : 0, courses: e.courses }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  const topCourses = [...courseStats].sort((a, b) => b.stats.progress - a.stats.progress).slice(0, 5);
  const maxAct = Math.max(1, ...activity.map((a) => a.count));
  const totalReviews = activity.reduce((s, a) => s + a.count, 0);

  const [chartTip, setChartTip] = useState<TipState>(null);

  const tiles = [
    {
      label: "Lessons Done",
      value: `${lessonsCompleted}`,
      sub: `of ${lessonsTotal}`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      iconBg: "bg-indigo-100 text-indigo-600",
      valueColor: "text-indigo-600",
    },
    {
      label: "Minutes Learned",
      value: `${minutes}`,
      sub: "total watch time",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: "bg-emerald-100 text-emerald-600",
      valueColor: "text-emerald-600",
    },
    {
      label: "Quiz Accuracy",
      value: answered ? `${accuracy}%` : "—",
      sub: `${answered} questions answered`,
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      iconBg: "bg-amber-100 text-amber-600",
      valueColor: "text-amber-600",
    },
    {
      label: "Review Streak",
      value: `${reviewStats?.streak ?? 0}`,
      sub: "days in a row",
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
        </svg>
      ),
      iconBg: "bg-rose-100 text-rose-600",
      valueColor: "text-rose-600",
    },
  ];

  const hasIntelligence = nextStepLoading || dashboardNextStep?.course || dashboardReport?.hasData || (dashboardTimeline?.months?.length > 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-all hover:bg-zinc-50 hover:text-zinc-800 active:scale-95 shadow-sm"
          aria-label="Back to dashboard"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Analytics</h1>
          <p className="text-sm text-zinc-500">Your learning progress, skills, and AI-powered insights.</p>
        </div>
      </section>

      {/* Stat tiles */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="group relative overflow-hidden rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{t.label}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <h3 className={`text-3xl font-extrabold tracking-tight ${t.valueColor}`}>{t.value}</h3>
                </div>
                <p className="mt-0.5 text-xs text-zinc-400">{t.sub}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.iconBg}`}>
                {t.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* AI Intelligence Section */}
      {hasIntelligence && (
        <section>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </span>
            <h2 className="text-sm font-bold text-zinc-900">Learning Intelligence</h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-600">AI</span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Your Next Step */}
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-200">Your Next Step</p>
                {nextStepLoading && (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
              </div>
              {nextStepLoading ? (
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-4 w-3/4 animate-pulse rounded-md bg-white/20" />
                  <div className="h-3 w-1/2 animate-pulse rounded-md bg-white/10" />
                  <div className="mt-auto pt-6 space-y-2">
                    <div className="h-3 w-full animate-pulse rounded-md bg-white/10" />
                    <div className="h-3 w-4/5 animate-pulse rounded-md bg-white/10" />
                  </div>
                  <p className="mt-1 text-[11px] text-indigo-300">Searching for best course...</p>
                </div>
              ) : dashboardNextStep?.course ? (
                <div className="flex flex-1 flex-col">
                  {dashboardNextStep.course.thumbnail && (
                    <img
                      src={dashboardNextStep.course.thumbnail}
                      alt={dashboardNextStep.course.title}
                      className="mb-3 h-28 w-full rounded-xl object-cover opacity-90"
                    />
                  )}
                  <a
                    href={dashboardNextStep.course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-2 text-sm font-bold leading-snug text-white hover:text-indigo-200 hover:underline"
                  >
                    {dashboardNextStep.course.title}
                  </a>
                  {dashboardNextStep.course.channel && (
                    <p className="mt-1 text-[11px] text-indigo-300">
                      {dashboardNextStep.course.channel}
                      {dashboardNextStep.course.durationText ? ` · ${dashboardNextStep.course.durationText}` : ""}
                    </p>
                  )}
                  {dashboardNextStep.impact?.length > 0 && (
                    <div className="mt-4 rounded-xl bg-white/10 p-3">
                      <p className="mb-2 text-[9px] font-extrabold uppercase tracking-widest text-indigo-200">Expected Skill Boost</p>
                      <div className="space-y-1.5">
                        {dashboardNextStep.impact.map((item: any, i: number) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="min-w-[36px] rounded-md bg-emerald-400/20 px-1.5 py-0.5 text-center text-[11px] font-extrabold text-emerald-300">
                              +{item.delta}%
                            </span>
                            <span className="text-[11px] text-indigo-100">{item.concept}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <a
                    href={dashboardNextStep.course.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 transition-opacity hover:opacity-90"
                  >
                    Start Learning
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </a>
                </div>
              ) : (
                <p className="text-sm text-indigo-300">Complete some quizzes to get a personalised next step.</p>
              )}
            </div>

            {/* Weekly Report */}
            <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
              {/* Header band */}
              <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100">
                    <svg className="h-3.5 w-3.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-violet-700">This Week</p>
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-bold text-zinc-500 shadow-sm">Last 7 days</span>
              </div>

              <div className="flex flex-1 flex-col p-5">
                {/* Big stat */}
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-violet-600 shadow-md shadow-violet-200">
                    <span className="text-2xl font-extrabold text-white">
                      {dashboardReport?.hasData ? `+${dashboardReport.conceptsImproved}` : "0"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xl font-extrabold leading-tight text-zinc-900">Concepts</p>
                    <p className="text-xl font-extrabold leading-tight text-zinc-900">Improved</p>
                    <p className="mt-0.5 text-[11px] text-zinc-400">
                      {dashboardReport?.hasData
                        ? dashboardReport.conceptsImproved > 0
                          ? "Great progress this week 🎉"
                          : "Keep going — keep practicing!"
                        : "No activity yet this week"}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="mb-4 h-px bg-zinc-100" />

                {/* 3 Insight rows — always shown */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50">
                      <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Strongest Concept</p>
                      <p className="truncate text-xs font-bold text-zinc-800">
                        {dashboardReport?.strongest || <span className="font-normal italic text-zinc-300">Answer quizzes to unlock</span>}
                      </p>
                    </div>
                    {dashboardReport?.strongest && (
                      <span className="flex-shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600">Top</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50">
                      <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Needs Work</p>
                      <p className="truncate text-xs font-bold text-zinc-800">
                        {dashboardReport?.weakest || <span className="font-normal italic text-zinc-300">No weak spots yet</span>}
                      </p>
                    </div>
                    {dashboardReport?.weakest && (
                      <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600">Focus</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                      <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Recommended Next</p>
                      <p className="truncate text-xs font-bold text-zinc-800">
                        {dashboardReport?.recommendedNext || <span className="font-normal italic text-zinc-300">Complete lessons to get a tip</span>}
                      </p>
                    </div>
                    {dashboardReport?.recommendedNext && (
                      <span className="flex-shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">Next</span>
                    )}
                  </div>
                </div>

                {/* Streak footer */}
                {(reviewStats?.streak ?? 0) > 0 && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2">
                    <span className="text-base">🔥</span>
                    <p className="text-xs font-bold text-rose-700">{reviewStats!.streak}-day review streak — keep it up!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Learning Timeline */}
            <div className="flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">Learning Timeline</p>
                {dashboardTimeline?.months?.length > 0 && (
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500">
                    {dashboardTimeline.months.reduce((s: number, m: any) => s + m.classrooms.length, 0)} courses
                  </span>
                )}
              </div>
              {dashboardTimeline?.months?.length > 0 ? (
                <div className="flex-1 overflow-y-auto pr-1" style={{ maxHeight: "18rem" }}>
                  <div className="relative space-y-5">
                    <div className="absolute left-[7px] top-0 bottom-0 w-px bg-zinc-100" />
                    {dashboardTimeline.months.map((month: any, mi: number) => (
                      <div key={mi}>
                        <p className="mb-2 pl-5 text-[10px] font-extrabold uppercase tracking-widest text-zinc-400">{month.label}</p>
                        <div className="space-y-2">
                          {month.classrooms.map((c: any, ci: number) => (
                            <div key={ci} className="relative flex items-start gap-3 pl-5">
                              <span className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${
                                c.status === "learned" ? "bg-emerald-500" : "bg-indigo-400"
                              }`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                                    c.status === "learned"
                                      ? "bg-emerald-50 text-emerald-600"
                                      : "bg-indigo-50 text-indigo-600"
                                  }`}>
                                    {c.status === "learned" ? "Learned" : "In Progress"}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-[11px] font-semibold leading-snug text-zinc-700 line-clamp-2">{c.title}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50">
                    <svg className="h-6 w-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-zinc-400">No timeline yet</p>
                  <p className="mt-1 text-[11px] text-zinc-300">Generate classrooms to start tracking your journey.</p>
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* Skills + Overall Rings */}
      <ChartTooltip tip={chartTip} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900">Skill Progress</h3>
            {skills.length > 0 && (
              <span className="text-[11px] font-semibold text-zinc-400">{skills.length} skills tracked</span>
            )}
          </div>
          {skills.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-50">
                <svg className="h-6 w-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-zinc-400">No skills tracked yet</p>
              <p className="mt-1 text-xs text-zinc-300">Skills are extracted from course tags and progress.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {skills.map((s) => (
                <div
                  key={s.name}
                  className="cursor-default"
                  onMouseEnter={(e) => setChartTip({
                    x: e.clientX, y: e.clientY,
                    lines: [
                      s.name.charAt(0).toUpperCase() + s.name.slice(1),
                      `Progress: ${s.pct}%`,
                      `${s.courses} course${s.courses !== 1 ? "s" : ""}`,
                      s.pct >= 80 ? "Level: Strong" : s.pct >= 50 ? "Level: Average" : "Level: Needs work",
                    ],
                  })}
                  onMouseMove={(e) => setChartTip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                  onMouseLeave={() => setChartTip(null)}
                >
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold capitalize text-zinc-700">{s.name}</span>
                      <span className="text-zinc-400">{s.courses} course{s.courses !== 1 ? "s" : ""}</span>
                    </div>
                    <span className={`font-bold ${s.pct >= 80 ? "text-emerald-600" : s.pct >= 50 ? "text-indigo-600" : "text-amber-600"}`}>
                      {s.pct}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className={`h-full rounded-full transition-all ${s.pct >= 80 ? "bg-emerald-500" : s.pct >= 50 ? "bg-indigo-500" : "bg-amber-400"}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-bold text-zinc-900">Overall Performance</h3>
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-around gap-4 w-full">
              <div className="flex flex-col items-center gap-2">
                <Ring value={overallPct} caption="complete" color="#4f46e5" tooltipLabel="Course Completion" />
                <span className="text-xs font-semibold text-zinc-500">Completion</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Ring value={accuracy} caption="correct" color="#059669" tooltipLabel="Quiz Accuracy" />
                <span className="text-xs font-semibold text-zinc-500">Quiz Accuracy</span>
              </div>
            </div>
            <div className="w-full rounded-xl bg-zinc-50 p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Courses started</span>
                <span className="font-bold text-zinc-800">{classrooms.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Courses finished</span>
                <span className="font-bold text-emerald-600">{courseStats.filter(c => c.stats.isCompleted).length}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Review streak</span>
                <span className="font-bold text-rose-500">{reviewStats?.streak ?? 0} days 🔥</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Course Progress */}
      {/* {topCourses.length > 0 && (
        <section className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-bold text-zinc-900">Course Progress</h3>
          <div className="space-y-3">
            {topCourses.map(({ record, stats }) => (
              <button
                key={record.videoId}
                onClick={() => openClassroomWorkspace(record)}
                className="flex w-full items-center gap-3 rounded-xl border border-zinc-100 p-3 text-left transition-all hover:border-indigo-100 hover:bg-indigo-50/30 active:scale-[0.99]"
              >
                <img
                  src={`https://img.youtube.com/vi/${record.videoId}/mqdefault.jpg`}
                  alt={record.videoTitle}
                  className="h-12 w-20 flex-shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-xs font-bold text-zinc-800">{record.videoTitle}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
                      <div
                        className={`h-full rounded-full ${stats.isCompleted ? "bg-emerald-500" : "bg-indigo-500"}`}
                        style={{ width: `${stats.progress}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${stats.isCompleted ? "text-emerald-600" : "text-zinc-500"}`}>
                      {stats.progress}%
                    </span>
                  </div>
                </div>
                <div className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  stats.isCompleted
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-zinc-50 text-zinc-500"
                }`}>
                  {stats.isCompleted ? "Done" : `${stats.completed}/${stats.total}`}
                </div>
              </button>
            ))}
          </div>
        </section>
      )} */}

      {/* Activity chart */}
      <section className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Review Activity</h3>
              <p className="text-xs text-zinc-400">Last 30 days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-indigo-600">{totalReviews}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Total Reviews</p>
          </div>
        </div>
        <div className="px-6 pb-5 pt-4">
          {totalReviews === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm font-semibold text-zinc-400">No reviews yet</p>
              <p className="mt-1 text-xs text-zinc-300">Complete lessons to start tracking your review activity</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {/* Y-axis labels */}
                <div className="flex h-40 w-5 shrink-0 flex-col justify-between">
                  {[maxAct, Math.round(maxAct / 2), 0].map((v, i) => (
                    <span key={i} className="block text-right text-[9px] leading-none text-zinc-300">{v}</span>
                  ))}
                </div>
                {/* Chart column */}
                <div className="flex-1">
                  <div className="flex h-40 items-end gap-1">
                    {activity.map((a) => {
                      const isPeak = a.count > 0 && a.count === maxAct;
                      return (
                        <div
                          key={a.date}
                          className={`flex-1 cursor-default rounded-t-md transition-all hover:brightness-110 ${
                            a.count > 0
                              ? isPeak
                                ? "bg-gradient-to-t from-violet-600 to-fuchsia-400"
                                : "bg-gradient-to-t from-indigo-600 to-indigo-400"
                              : "bg-zinc-100"
                          }`}
                          style={{ height: `${Math.max(3, (a.count / maxAct) * 100)}%` }}
                          onMouseEnter={(e) => setChartTip({
                            x: e.clientX, y: e.clientY,
                            lines: [
                              new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
                              a.count > 0 ? `${a.count} review${a.count !== 1 ? "s" : ""}` : "No reviews",
                              ...(isPeak ? ["Peak day"] : []),
                            ],
                          })}
                          onMouseMove={(e) => setChartTip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                          onMouseLeave={() => setChartTip(null)}
                        />
                      );
                    })}
                  </div>
                  {/* X-axis date labels */}
                  <div className="mt-1.5 flex gap-1">
                    {activity.map((a, i) => (
                      <div key={a.date} className="flex-1 overflow-hidden text-center">
                        {i % 7 === 0 && (
                          <span className="block truncate text-[9px] text-zinc-400">
                            {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Footer stats */}
              <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-100 rounded-xl bg-zinc-50 py-3">
                <div className="px-4 text-center">
                  <p className="text-sm font-extrabold text-violet-600">{maxAct}</p>
                  <p className="text-[10px] text-zinc-400">Peak day</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-extrabold text-indigo-600">
                    {activity.filter((a) => a.count > 0).length > 0
                      ? (totalReviews / activity.filter((a) => a.count > 0).length).toFixed(1)
                      : "0"}
                  </p>
                  <p className="text-[10px] text-zinc-400">Avg / active day</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-sm font-extrabold text-emerald-600">{activity.filter((a) => a.count > 0).length}</p>
                  <p className="text-[10px] text-zinc-400">Active days</p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {classrooms.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-white shadow-sm">
            <svg className="h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-zinc-700">No data yet</h3>
          <p className="mt-1 max-w-xs text-sm text-zinc-400">Generate a classroom and complete some lessons to see your analytics here.</p>
        </div>
      )}
    </div>
  );
}

// ---- Knowledge profile page --------------------------------------------------

function RadarChart({ data, size = 280 }: { data: { label: string; value: number }[]; size?: number }) {
  const [tip, setTip] = useState<TipState>(null);
  const padX = 104;
  const padY = 40;
  const w = size + padX * 2;
  const h = size + padY * 2;
  const cx = w / 2;
  const cy = h / 2;
  const radius = size / 2;
  const n = data.length;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const coord = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleFor(i)),
    y: cy + r * Math.sin(angleFor(i)),
  });
  const polyAt = (frac: number) =>
    data.map((_, i) => { const p = coord(i, frac * radius); return `${p.x},${p.y}`; }).join(" ");
  const dataPoly = data
    .map((d, i) => { const p = coord(i, (Math.max(0, Math.min(100, d.value)) / 100) * radius); return `${p.x},${p.y}`; })
    .join(" ");

  const labelFor = (s: string) => (s.length > 16 ? s.slice(0, 15) + "…" : s);
  const level = (v: number) => v >= 70 ? "Strong" : v >= 40 ? "Average" : v > 0 ? "Needs work" : "Not started";

  return (
    <>
      <ChartTooltip tip={tip} />
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon key={f} points={polyAt(f)} fill="none" stroke="#e4e4e7" strokeWidth="1" />
        ))}
        {/* Grid scale labels */}
        {[25, 50, 75, 100].map((t) => {
          const p = coord(0, (t / 100) * radius);
          return (
            <text key={t} x={p.x + 4} y={p.y} fontSize="9" fill="#d4d4d8" dominantBaseline="middle">{t}</text>
          );
        })}
        {data.map((_, i) => {
          const p = coord(i, radius);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e4e4e7" strokeWidth="1" />;
        })}
        <polygon points={dataPoly} fill="rgba(79,70,229,0.15)" stroke="#4f46e5" strokeWidth="2" />
        {data.map((d, i) => {
          const p = coord(i, (Math.max(0, Math.min(100, d.value)) / 100) * radius);
          return (
            <circle
              key={i}
              cx={p.x} cy={p.y} r="6"
              fill="#4f46e5"
              className="cursor-pointer"
              onMouseEnter={(e) => setTip({
                x: e.clientX, y: e.clientY,
                lines: [d.label, `Mastery: ${d.value}%`, level(d.value)],
              })}
              onMouseMove={(e) => setTip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}
        {/* Invisible larger hit area for each dot */}
        {data.map((d, i) => {
          const p = coord(i, (Math.max(0, Math.min(100, d.value)) / 100) * radius);
          return (
            <circle key={`hit-${i}`} cx={p.x} cy={p.y} r="12" fill="transparent"
              className="cursor-pointer"
              onMouseEnter={(e) => setTip({ x: e.clientX, y: e.clientY, lines: [d.label, `Mastery: ${d.value}%`, level(d.value)] })}
              onMouseMove={(e) => setTip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
              onMouseLeave={() => setTip(null)}
            />
          );
        })}
        {data.map((d, i) => {
          const p = coord(i, radius + 18);
          const dx = p.x - cx;
          const anchor = Math.abs(dx) < 4 ? "middle" : dx > 0 ? "start" : "end";
          return (
            <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle" fontSize="11" fontWeight="600" fill="#71717a">
              {labelFor(d.label)}
            </text>
          );
        })}
      </svg>
    </>
  );
}

function DonutChart({
  segments,
  size = 170,
  stroke = 24,
  centerValue,
  centerLabel,
}: {
  segments: { value: number; color: string; label?: string }[];
  size?: number;
  stroke?: number;
  centerValue: string | number;
  centerLabel?: string;
}) {
  const [tip, setTip] = useState<TipState>(null);
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + size / 2);
    const dy = e.clientY - (rect.top + size / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const innerR = r - stroke / 2 - 2;
    const outerR = r + stroke / 2 + 2;
    if (dist < innerR || dist > outerR) { setTip(null); return; }
    // Compute angle (0 = top, clockwise). SVG is rotated -90deg so add that back.
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    let cum = 0;
    for (const seg of segments) {
      if (seg.value <= 0) continue;
      const span = (seg.value / total) * 360;
      if (angle <= cum + span) {
        const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
        setTip({
          x: e.clientX, y: e.clientY,
          lines: [seg.label ?? "Segment", `${seg.value} concepts (${pct}%)`],
        });
        return;
      }
      cum += span;
    }
    setTip(null);
  };

  let acc = 0;
  return (
    <>
      <ChartTooltip tip={tip} />
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size} height={size} className="-rotate-90 cursor-default"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTip(null)}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f4f4f5" strokeWidth={stroke} />
          {total > 0 &&
            segments.map((seg, i) => {
              if (seg.value <= 0) return null;
              const len = (seg.value / total) * circ;
              const el = (
                <circle
                  key={i}
                  cx={size / 2} cy={size / 2} r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={stroke}
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-extrabold text-zinc-900">{centerValue}</span>
          {centerLabel && <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{centerLabel}</span>}
        </div>
      </div>
    </>
  );
}

function KnowledgePage({
  knowledge,
  conceptRecs,
  conceptRecsLoading,
  onBack,
}: {
  knowledge: KnowledgeProfile | null;
  conceptRecs: { concept: string; videos: RecommendedVideo[] }[];
  conceptRecsLoading: boolean;
  onBack: () => void;
}) {
  const [knowledgeTip, setKnowledgeTip] = useState<TipState>(null);
  const concepts = knowledge?.concepts || [];
  const summary = knowledge?.summary;

  const levelMeta: Record<string, { bar: string; text: string; dot: string; label: string }> = {
    strong: { bar: "bg-emerald-500", text: "text-emerald-600", dot: "bg-emerald-500", label: "Strong" },
    average: { bar: "bg-indigo-500", text: "text-indigo-600", dot: "bg-indigo-500", label: "Average" },
    weak: { bar: "bg-rose-500", text: "text-rose-600", dot: "bg-rose-500", label: "Needs work" },
    building: { bar: "bg-zinc-300", text: "text-zinc-400", dot: "bg-zinc-300", label: "Building" },
  };

  const order: Record<string, number> = { weak: 0, average: 1, strong: 2, building: 3 };
  const sorted = [...concepts].sort(
    (a, b) => (order[a.level] - order[b.level]) || (a.mastery - b.mastery)
  );

  const avgMastery = concepts.length
    ? Math.round(concepts.reduce((s, c) => s + c.mastery, 0) / concepts.length)
    : 0;

  // Radar uses up to 8 concepts with the most evidence (clearest shape).
  const radarData = [...concepts]
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
    .map((c) => ({ label: c.name, value: c.mastery }));

  const donutSegments = [
    { value: summary?.counts.strong ?? 0, color: "#10b981", label: "Strong" },
    { value: summary?.counts.average ?? 0, color: "#6366f1", label: "Average" },
    { value: summary?.counts.weak ?? 0, color: "#f43f5e", label: "Needs work" },
    { value: summary?.counts.building ?? 0, color: "#d4d4d8", label: "Building" },
  ];
  const legend = [
    { label: "Strong", value: summary?.counts.strong ?? 0, color: "bg-emerald-500" },
    { label: "Average", value: summary?.counts.average ?? 0, color: "bg-indigo-500" },
    { label: "Needs work", value: summary?.counts.weak ?? 0, color: "bg-rose-500" },
    { label: "Building", value: summary?.counts.building ?? 0, color: "bg-zinc-300" },
  ];

  return (
    <div>
      {/* Header */}
      <section className="mb-6 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-all hover:bg-zinc-100 active:scale-95"
          aria-label="Back to dashboard"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Knowledge Profile</h1>
          <p className="text-sm text-zinc-500">What you know, how well, and what to review — across all your courses.</p>
        </div>
      </section>

      {concepts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white py-16 text-center">
          <svg className="h-9 w-9 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-4 text-base font-semibold text-zinc-700">No concept data yet</h3>
          <p className="mt-1 max-w-sm text-sm text-zinc-500">
            Open a course and answer its quiz questions (or do your Daily Review). Each answer maps
            to a concept and builds your mastery profile here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Headline */}
          {summary && (
            <section className="rounded-2xl border border-zinc-200 bg-white px-6 py-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Summary</p>
              <p className="mt-1.5 text-lg font-bold leading-snug text-zinc-900">{summary.headline}</p>
            </section>
          )}

          {/* Charts: mastery radar + distribution donut */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-2 text-sm font-bold text-zinc-900">Mastery map</h3>
              {radarData.length >= 3 ? (
                <div className="mx-auto max-w-xl px-4">
                  <RadarChart data={radarData} />
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-zinc-400">
                  Track at least 3 concepts to see your mastery map.
                </p>
              )}
            </section>

            <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="mb-2 text-sm font-bold text-zinc-900">Distribution</h3>
              <div className="flex flex-1 flex-col items-center justify-center gap-5">
                <DonutChart segments={donutSegments} centerValue={avgMastery + "%"} centerLabel="avg mastery" />
                <div className="grid w-full grid-cols-2 gap-x-4 gap-y-2">
                  {legend.map((l) => (
                    <div key={l.label} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                      <span className="text-xs text-zinc-500">{l.label}</span>
                      <span className="ml-auto text-xs font-bold tabular-nums text-zinc-700">{l.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Mastery-by-concept bar chart */}
          <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
              <h3 className="text-sm font-bold text-zinc-900">Mastery by concept</h3>
              <span className="text-xs font-medium text-zinc-400">{concepts.length} tracked</span>
            </div>
            <div className="px-6 py-5">
              {/* scale */}
              <div className="mb-3 flex items-center gap-4">
                <div className="hidden w-44 flex-shrink-0 sm:block" />
                <div className="relative h-4 flex-1">
                  {[0, 25, 50, 75, 100].map((t) => (
                    <span
                      key={t}
                      className="absolute top-0 text-[10px] text-zinc-300"
                      style={{ left: `${t}%`, transform: "translateX(-50%)" }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <div className="w-11 flex-shrink-0" />
              </div>
              {/* rows */}
              <ChartTooltip tip={knowledgeTip} />
              <div className="space-y-3.5">
                {sorted.map((c) => {
                  const m = levelMeta[c.level];
                  return (
                    <div
                      key={c.slug}
                      className="flex cursor-default flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4"
                      onMouseEnter={(e) => setKnowledgeTip({
                        x: e.clientX, y: e.clientY,
                        lines: [
                          c.name.charAt(0).toUpperCase() + c.name.slice(1),
                          `Mastery: ${c.mastery}%`,
                          `Level: ${m.label}`,
                          `Answers: ${c.correct} correct / ${c.total} total`,
                          c.needsReview ? "⏰ Due for review" : "",
                        ].filter(Boolean),
                      })}
                      onMouseMove={(e) => setKnowledgeTip((t) => t ? { ...t, x: e.clientX, y: e.clientY } : null)}
                      onMouseLeave={() => setKnowledgeTip(null)}
                    >
                      <div className="w-44 flex-shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold capitalize text-zinc-800">{c.name}</span>
                          {c.needsReview && (
                            <svg className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-label="Due for review">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`text-[10px] font-semibold uppercase tracking-wide ${m.text}`}>{m.label}</span>
                          <span className="text-[10px] text-zinc-300">·</span>
                          <span className="text-[10px] text-zinc-400">{c.correct}/{c.total}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative h-5 flex-1 rounded bg-zinc-50">
                          {[25, 50, 75].map((t) => (
                            <span key={t} className="absolute inset-y-0 w-px bg-zinc-100" style={{ left: `${t}%` }} />
                          ))}
                          <div
                            className={`absolute inset-y-[3px] left-0 rounded-r ${m.bar}`}
                            style={{ width: `${Math.max(2, c.mastery)}%` }}
                          />
                        </div>
                        <span className="w-11 flex-shrink-0 text-right text-sm font-bold tabular-nums text-zinc-900">
                          {c.mastery}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Recommended videos to strengthen weak / due concepts */}
          {(conceptRecsLoading || conceptRecs.length > 0) && (
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-6 py-4">
                <h3 className="text-sm font-bold text-zinc-900">Recommended to improve</h3>
                <p className="mt-0.5 text-xs text-zinc-500">Targeted videos for the areas you're weakest in.</p>
              </div>
              <div className="p-6">
                {conceptRecsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                    Finding videos for your weak concepts...
                  </div>
                ) : (
                  <div className="space-y-7">
                    {conceptRecs.map((group) => (
                      <div key={group.concept}>
                        <div className="mb-3 flex items-center gap-2">
                          <span className="h-4 w-1 rounded-full bg-rose-500" />
                          <h4 className="text-sm font-bold capitalize text-zinc-900">{group.concept}</h4>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {group.videos.map((video) => (
                            <a
                              key={video.videoId}
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-indigo-200 hover:shadow-md"
                            >
                              <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                                {video.thumbnail && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  />
                                )}
                                <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  {video.durationText}
                                </span>
                              </div>
                              <div className="flex flex-1 flex-col p-3">
                                <h5 className="line-clamp-2 text-xs font-bold leading-snug text-zinc-900 group-hover:text-indigo-700">
                                  {video.title}
                                </h5>
                                <p className="mt-1 text-[11px] text-zinc-500">
                                  {video.channel} · {video.viewsText}
                                </p>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Resume recap modal ------------------------------------------------------

function RecapModal({
  loading,
  recap,
  questions,
  onGrade,
  onClose,
}: {
  loading: boolean;
  recap: string;
  questions: ReviewItem[];
  onGrade: (item: ReviewItem, correct: boolean) => void | Promise<void>;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"intro" | "quiz" | "done">("intro");
  const [index, setIndex] = useState(0);
  const [selection, setSelection] = useState<any>(undefined);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const total = questions.length;
  const current = questions[index];
  const letters = ["A", "B", "C", "D"];
  const isCorrect = checked && current && selection === current.question.correctAnswer;

  const check = () => {
    if (selection === undefined || !current) return;
    const ok = selection === current.question.correctAnswer;
    setChecked(true);
    if (ok) setCorrectCount((c) => c + 1);
    onGrade(current, ok);
  };
  const next = () => {
    if (index + 1 >= total) {
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
      setSelection(undefined);
      setChecked(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <h2 className="text-base font-extrabold tracking-tight text-zinc-900">
            {phase === "quiz" ? "Recap quiz" : phase === "done" ? "Recap complete" : "Welcome back"}
          </h2>
          {phase === "quiz" && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
              {index + 1} / {total}
            </span>
          )}
        </div>

        {/* Progress bar during quiz */}
        {phase === "quiz" && (
          <div className="h-1 w-full bg-zinc-100">
            <div className="h-full bg-indigo-600 transition-all" style={{ width: `${(index / total) * 100}%` }} />
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* INTRO: AI recap text */}
          {phase === "intro" && (
            <>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-indigo-500">Quick recap</p>
              {loading ? (
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-zinc-100" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-zinc-100" />
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-zinc-700">{recap}</p>
              )}
            </>
          )}

          {/* QUIZ */}
          {phase === "quiz" && current && (
            <div className="space-y-4">
              <p className="text-sm font-bold leading-relaxed text-zinc-900">{current.question.question}</p>

              {current.question.type === "mcq" && current.question.options && (
                <div className="space-y-2">
                  {current.question.options.map((opt, oi) => {
                    const sel = selection === oi;
                    const ok = current.question.correctAnswer === oi;
                    let cls = "flex w-full items-start gap-2.5 rounded-xl border p-3 text-left text-sm transition-all ";
                    if (checked) {
                      if (ok) cls += "border-emerald-500 bg-emerald-50/40 text-emerald-800";
                      else if (sel) cls += "border-rose-500 bg-rose-50/40 text-rose-800";
                      else cls += "border-zinc-100 bg-zinc-50/50 text-zinc-400";
                    } else if (sel) cls += "border-indigo-500 bg-indigo-50/40 text-indigo-950";
                    else cls += "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";
                    return (
                      <button key={oi} onClick={() => !checked && setSelection(oi)} disabled={checked} className={cls}>
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border border-current text-[10px] font-bold">
                          {letters[oi]}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {current.question.type === "true-false" && (
                <div className="grid grid-cols-2 gap-3">
                  {[true, false].map((val, vi) => {
                    const sel = selection === val;
                    const ok = current.question.correctAnswer === val;
                    let cls = "rounded-xl border p-3 text-center text-sm font-bold transition-all ";
                    if (checked) {
                      if (ok) cls += "border-emerald-500 bg-emerald-50/40 text-emerald-800";
                      else if (sel) cls += "border-rose-500 bg-rose-50/40 text-rose-800";
                      else cls += "border-zinc-100 bg-zinc-50/50 text-zinc-400";
                    } else if (sel) cls += "border-indigo-500 bg-indigo-50/40 text-indigo-950";
                    else cls += "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50";
                    return (
                      <button key={vi} onClick={() => !checked && setSelection(val)} disabled={checked} className={cls}>
                        {val ? "True" : "False"}
                      </button>
                    );
                  })}
                </div>
              )}

              {checked && (
                <div
                  className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
                    isCorrect ? "border-emerald-100 bg-emerald-50/50 text-emerald-900" : "border-indigo-100 bg-indigo-50/50 text-indigo-900"
                  }`}
                >
                  <span className="mr-1 font-bold">{isCorrect ? "Correct." : "Not quite."}</span>
                  {current.question.explanation}
                </div>
              )}
            </div>
          )}

          {/* DONE */}
          {phase === "done" && (
            <div className="py-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
                <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Refreshed!</h3>
              <p className="mt-1 text-sm text-zinc-500">
                You scored <span className="font-bold text-indigo-600">{correctCount}</span> / {total} on the recap. Now pick up where you left off.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-100 p-4">
          {phase === "intro" ? (
            total > 0 ? (
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-zinc-50"
                >
                  Skip
                </button>
                <button
                  onClick={() => setPhase("quiz")}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
                >
                  Start recap quiz ({total})
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                disabled={loading}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-60"
              >
                Continue learning
              </button>
            )
          ) : phase === "quiz" ? (
            !checked ? (
              <button
                onClick={check}
                disabled={selection === undefined}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${
                  selection === undefined ? "cursor-not-allowed bg-zinc-100 text-zinc-400" : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95"
                }`}
              >
                Check answer
              </button>
            ) : (
              <button
                onClick={next}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-95"
              >
                {index + 1 >= total ? "Finish" : "Next"}
              </button>
            )
          ) : (
            <button
              onClick={onClose}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95"
            >
              Continue learning
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

const DOMAIN_OPTIONS = [
  "Web Development",
  "Data Science",
  "AI & Machine Learning",
  "Mobile Development",
  "Cloud & DevOps",
  "Cybersecurity",
  "UI/UX Design",
  "Game Development",
  "Programming Languages",
  "Business & Finance",
  "Digital Marketing",
  "Mathematics",
];

const LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner", hint: "Just starting out" },
  { value: "intermediate", label: "Intermediate", hint: "Know the basics" },
  { value: "advanced", label: "Advanced", hint: "Going deep" },
];

interface OnboardingModalProps {
  initial: UserPreferences | null;
  onSave: (prefs: UserPreferences) => Promise<void>;
  onClose: () => void;
}

function OnboardingModal({ initial, onSave, onClose }: OnboardingModalProps) {
  const [domains, setDomains] = useState<string[]>(initial?.domains || []);
  const [skills, setSkills] = useState<string[]>(initial?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [level, setLevel] = useState(initial?.level || "beginner");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const toggleDomain = (domain: string) => {
    setDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (!skill) return;
    if (!skills.some((s) => s.toLowerCase() === skill.toLowerCase())) {
      setSkills([...skills, skill]);
    }
    setSkillInput("");
  };

  const handleSave = async () => {
    if (domains.length === 0 && skills.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ domains, skills, level });
    } catch (err: any) {
      setSaveError(err.message || "Failed to save your interests.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Modal header */}
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">
              Personalize your learning 🎯
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Tell us what you're interested in and we'll suggest high-quality professional
              YouTube videos for you.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-all hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {/* Domains */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Which domains interest you?
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {DOMAIN_OPTIONS.map((domain) => {
                const active = domains.includes(domain);
                return (
                  <button
                    key={domain}
                    onClick={() => toggleDomain(domain)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    {domain}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Which skills do you want to learn?
            </h3>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="e.g. React, Python, Figma, SQL..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-indigo-400"
              />
              <button
                onClick={addSkill}
                className="rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-zinc-700"
              >
                Add
              </button>
            </div>
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700"
                  >
                    {skill}
                    <button
                      onClick={() => setSkills(skills.filter((s) => s !== skill))}
                      className="text-indigo-400 transition-all hover:text-indigo-700"
                      aria-label={`Remove ${skill}`}
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Experience level */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Your experience level
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {LEVEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setLevel(option.value)}
                  className={`rounded-xl border px-3 py-3 text-left transition-all ${
                    level === option.value
                      ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                      : "border-zinc-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <span className={`block text-sm font-bold ${level === option.value ? "text-indigo-700" : "text-zinc-800"}`}>
                    {option.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-zinc-400">{option.hint}</span>
                </button>
              ))}
            </div>
          </div>

          {saveError && (
            <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-700">
              {saveError}
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/60 px-6 py-4">
          <span className="text-xs text-zinc-400">
            {domains.length} domain{domains.length === 1 ? "" : "s"} • {skills.length} skill{skills.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-all hover:bg-zinc-100"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={saving || (domains.length === 0 && skills.length === 0)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving && (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              {saving ? "Saving..." : "Save & Get Suggestions"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface QuizProps {
  classroomData: Classroom;
  quizResults: Record<string, boolean>;
  onSaveQuizResult: (questionId: string, correct: boolean, question?: QuizQuestion) => void;
}

function QuizTabPanel({ classroomData, quizResults, onSaveQuizResult }: QuizProps) {
  const { modules } = classroomData;
  const quizModules = modules.filter((m) => m.quiz);

  if (quizModules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm mt-4">
        <span className="text-4xl mb-2">📝</span>
        <h4 className="text-sm font-bold text-zinc-800">No Quizzes Available</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">
          This course does not have quizzes generated.
        </p>
      </div>
    );
  }

  const [activeModuleIdx, setActiveModuleIdx] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Pre-populate from saved quizResults so previously answered questions render correctly.
  const [checkedQuestions, setCheckedQuestions] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    Object.keys(quizResults).forEach((id) => { init[id] = true; });
    return init;
  });
  const [selections, setSelections] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    quizModules.forEach((mod) => {
      (mod.quiz?.questions || []).forEach((q) => {
        if (quizResults[q.id] === true) {
          // Correctly answered: highlight the correct option
          init[q.id] = q.correctAnswer;
        }
        // Incorrectly answered: leave selection empty so correct answer
        // is still highlighted green without fabricating the wrong pick.
      });
    });
    return init;
  });

  const activeModule = quizModules[activeModuleIdx];
  const quiz = activeModule.quiz!;
  const questions = quiz.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = parseInt(e.target.value, 10);
    setActiveModuleIdx(idx);
    setCurrentQuestionIndex(0);
  };

  const handleSelectOption = (questionId: string, index: number) => {
    if (checkedQuestions[questionId]) return;
    setSelections((prev) => ({ ...prev, [questionId]: index }));
  };

  const handleSelectTrueFalse = (questionId: string, value: boolean) => {
    if (checkedQuestions[questionId]) return;
    setSelections((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleCheckAnswer = (questionId: string, correctAnswer: any) => {
    const userSelection = selections[questionId];
    if (userSelection === undefined) return;

    let isCorrect = userSelection === correctAnswer;
    setCheckedQuestions((prev) => ({ ...prev, [questionId]: true }));
    onSaveQuizResult(questionId, isCorrect, currentQuestion);
  };

  const goPrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const letters = ["A", "B", "C", "D"];

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Module Quizzes</h3>
      </div>

      {/* Module Selector */}
      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wide mb-1.5">Select Module:</label>
        <select
          value={activeModuleIdx}
          onChange={handleModuleChange}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50/50 p-2 text-xs font-semibold text-zinc-800 outline-none focus:border-indigo-400"
        >
          {quizModules.map((m, idx) => (
            <option key={m.id} value={idx}>
              {m.title}
            </option>
          ))}
        </select>
      </div>

      {currentQuestion ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
          {/* Card Header */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-650 flex-shrink-0 text-sm">
              ❓
            </div>
            <div>
              <h4 className="text-xs font-bold text-zinc-950 line-clamp-1">{quiz.title}</h4>
              <p className="text-[10px] font-medium text-zinc-400 line-clamp-1">{activeModule.title}</p>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4 space-y-3">
            <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              Question {currentQuestionIndex + 1} of {questions.length}
            </div>
            <p className="text-xs font-bold text-zinc-850 leading-relaxed">
              {currentQuestion.question}
            </p>

            {/* MCQ Options */}
            {currentQuestion.type === "mcq" && currentQuestion.options && (
              <div className="space-y-2 mt-2">
                {currentQuestion.options.map((opt: string, oi: number) => {
                  const isSelected = selections[currentQuestion.id] === oi;
                  const isAnswered = checkedQuestions[currentQuestion.id];
                  const isOptionCorrect = currentQuestion.correctAnswer === oi;

                  let btnClass = "w-full text-left rounded-xl border p-3 text-xs font-medium flex items-start gap-2.5 transition-all ";
                  if (isAnswered) {
                    if (isOptionCorrect) {
                      btnClass += "border-emerald-500 bg-emerald-50/30 text-emerald-800";
                    } else if (isSelected) {
                      btnClass += "border-rose-500 bg-rose-50/30 text-rose-800";
                    } else {
                      btnClass += "border-zinc-100 bg-zinc-50/50 text-zinc-400 cursor-not-allowed";
                    }
                  } else if (isSelected) {
                    btnClass += "border-indigo-500 bg-indigo-50/30 text-indigo-950 shadow-sm";
                  } else {
                    btnClass += "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300";
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelectOption(currentQuestion.id, oi)}
                      disabled={isAnswered}
                      className={btnClass}
                    >
                      <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold border flex-shrink-0 ${
                        isAnswered && isOptionCorrect ? "border-emerald-400 bg-emerald-105 text-emerald-800" :
                        isAnswered && isSelected ? "border-rose-400 bg-rose-105 text-rose-800" :
                        isSelected ? "border-indigo-400 bg-indigo-105 text-indigo-950" :
                        "border-zinc-200 bg-zinc-55 text-zinc-500"
                      }`}>
                        {letters[oi]}
                      </span>
                      <span className="leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* True/False Options */}
            {currentQuestion.type === "true-false" && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {[true, false].map((val, vi) => {
                  const label = val ? "True" : "False";
                  const isSelected = selections[currentQuestion.id] === val;
                  const isAnswered = checkedQuestions[currentQuestion.id];
                  const isValCorrect = currentQuestion.correctAnswer === val;

                  let btnClass = "w-full rounded-xl border p-3 text-xs font-bold text-center transition-all ";
                  if (isAnswered) {
                    if (isValCorrect) {
                      btnClass += "border-emerald-500 bg-emerald-50/30 text-emerald-800";
                    } else if (isSelected) {
                      btnClass += "border-rose-500 bg-rose-50/30 text-rose-800";
                    } else {
                      btnClass += "border-zinc-100 bg-zinc-50/50 text-zinc-400 cursor-not-allowed";
                    }
                  } else if (isSelected) {
                    btnClass += "border-indigo-500 bg-indigo-50/30 text-indigo-950 shadow-sm";
                  } else {
                    btnClass += "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300";
                  }

                  return (
                    <button
                      key={vi}
                      onClick={() => handleSelectTrueFalse(currentQuestion.id, val)}
                      disabled={isAnswered}
                      className={btnClass}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Explanation box */}
            {checkedQuestions[currentQuestion.id] && (
              <div className="rounded-xl bg-indigo-50/50 border border-indigo-100 p-3.5 text-xs text-indigo-900 leading-relaxed shadow-inner">
                <span className="font-bold mr-1">💡 Explanation:</span>
                {currentQuestion.explanation}
              </div>
            )}

            {/* Check Answer Button */}
            <button
              onClick={() => handleCheckAnswer(currentQuestion.id, currentQuestion.correctAnswer)}
              disabled={checkedQuestions[currentQuestion.id] || selections[currentQuestion.id] === undefined}
              className={`w-full rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm ${
                checkedQuestions[currentQuestion.id]
                  ? "bg-zinc-100 text-zinc-400 cursor-not-allowed shadow-none"
                  : selections[currentQuestion.id] === undefined
                  ? "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
              }`}
            >
              {checkedQuestions[currentQuestion.id] ? "✓ Answered" : "Check Answer"}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
            <button
              onClick={goPrev}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:text-zinc-500 transition-all"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            <span className="text-xs font-bold text-zinc-400 font-mono">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
            <button
              onClick={goNext}
              disabled={currentQuestionIndex === questions.length - 1}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:text-zinc-500 transition-all"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center p-8 bg-zinc-100/50 rounded-2xl text-xs text-zinc-400">
          No questions in this quiz.
        </div>
      )}
    </div>
  );
}

interface AssignmentTabPanelProps {
  classroomData: Classroom;
  email: string;
  videoId: string;
}

function AssignmentTabPanel({ classroomData, email, videoId }: AssignmentTabPanelProps) {
  const { modules } = classroomData;
  const assignments = modules
    .filter((m) => m.assignment)
    .map((m) => ({ assignment: m.assignment!, moduleTitle: m.title, moduleId: m.id }));
  const count = assignments.length;

  if (count === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-zinc-200 shadow-sm mt-4">
        <span className="text-4xl mb-2">📋</span>
        <h4 className="text-sm font-bold text-zinc-800">No Assignments Available</h4>
        <p className="text-xs text-zinc-500 mt-1 max-w-[250px]">
          This course does not have practice assignments generated.
        </p>
      </div>
    );
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = assignments[currentIndex];

  const isPython = !!(
    classroomData.course.title?.toLowerCase().includes("python") ||
    classroomData.course.skills?.some((s) => /python/i.test(s)) ||
    classroomData.course.tags?.some((t) => /python/i.test(t))
  );

  const isCodingCourse = isPython || !!(
    classroomData.course.skills?.some((s) => /code|program|develop|script|java|rust|c\+\+|html|css|react|node|api/i.test(s)) ||
    classroomData.course.tags?.some((t) => /code|program|develop|script|java|rust|c\+\+|html|css|react|node|api/i.test(t))
  );

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const goNext = () => {
    if (currentIndex < count - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Practice Assignments</h3>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3.5 shadow-sm">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Active Module:</span>
        <span className="text-xs font-bold text-zinc-800 block mt-0.5 line-clamp-1">{currentItem.moduleTitle}</span>
      </div>

      <div className="space-y-4">
        <AssignmentCardComponent
          assignment={currentItem.assignment}
          isCodingCourse={isCodingCourse}
          isPython={isPython}
          email={email}
          videoId={videoId}
          moduleId={currentItem.moduleId}
        />

        {/* Pagination */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 px-4 py-3 shadow-sm">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:text-zinc-500 transition-all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-xs font-bold text-zinc-400 font-mono">
            {currentIndex + 1} / {count}
          </span>
          <button
            onClick={goNext}
            disabled={currentIndex === count - 1}
            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-800 disabled:opacity-40 disabled:hover:text-zinc-500 transition-all"
          >
            Next
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface AssignmentCardComponentProps {
  assignment: Assignment;
  isCodingCourse: boolean;
  isPython: boolean;
  email: string;
  videoId: string;
  moduleId: string;
}

function AssignmentCardComponent({ assignment, isCodingCourse, isPython, email, videoId, moduleId }: AssignmentCardComponentProps) {
  const fnName = assignment.functionName || "solution";

  const getInitialCode = () => {
    if (isPython) {
      const argsStr = assignment.testCases?.[0]
        ? (Array.isArray(assignment.testCases[0].input)
            ? assignment.testCases[0].input.map((_, i) => `arg${i+1}`).join(", ")
            : "val")
        : "";
      return `# Write your Python solution here\ndef ${fnName}(${argsStr}):\n    # Your logic goes here\n    return None\n`;
    } else {
      const argsStr = assignment.testCases?.[0]
        ? (Array.isArray(assignment.testCases[0].input)
            ? assignment.testCases[0].input.map((_, i) => `arg${i+1}`).join(", ")
            : "val")
        : "";
      return `// Write your JS solution here\nfunction ${fnName}(${argsStr}) {\n  // Your logic goes here\n  return null;\n}\n`;
    }
  };

  const [code, setCode] = useState("");
  const [consoleOutput, setConsoleOutput] = useState("");
  const [testResults, setTestResults] = useState<any>(null);
  const [showCompiler, setShowCompiler] = useState(isCodingCourse);
  const [compilerTab, setCompilerTab] = useState<"code" | "tests" | "output">("code");
  const [isExecuting, setIsExecuting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveSolution = async (currentCode: string, passedVal: boolean = false) => {
    if (!email || !videoId || !moduleId) return;
    setIsSaving(true);
    setSaveStatus("Saving...");
    try {
      const res = await fetch("${API}/api/assignments/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          videoId,
          moduleId,
          code: currentCode,
          passed: passedVal
        })
      });
      if (res.ok) {
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } else {
        setSaveStatus("Save failed");
      }
    } catch (err) {
      setSaveStatus("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    const fetchSolution = async () => {
      if (!email || !videoId || !moduleId) {
        setCode(getInitialCode());
        return;
      }
      setSaveStatus("Loading solution...");
      try {
        const url = `${API}/api/assignments/solution?email=${encodeURIComponent(email)}&videoId=${encodeURIComponent(videoId)}&moduleId=${encodeURIComponent(moduleId)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Load failed");
        const body = await res.json();
        if (active) {
          if (body.success && body.data && body.data.code) {
            setCode(body.data.code);
            setSaveStatus("Loaded");
            setTimeout(() => setSaveStatus(""), 2000);
          } else {
            setCode(getInitialCode());
            setSaveStatus("");
          }
        }
      } catch (err) {
        if (active) {
          setCode(getInitialCode());
          setSaveStatus("Failed to load");
        }
      }
    };

    fetchSolution();
    setConsoleOutput("");
    setTestResults(null);
    setCompilerTab("code");
    
    return () => {
      active = false;
    };
  }, [assignment, email, videoId, moduleId, isPython]);

  // Debounced auto-save
  useEffect(() => {
    if (!code || code === getInitialCode()) return;
    const timer = setTimeout(() => {
      saveSolution(code, false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [code]);

  const runCode = async () => {
    setIsExecuting(true);
    setCompilerTab("output");
    setConsoleOutput("Running code & evaluating test cases...");
    setTestResults(null);

    let codePassed = false;
    if (isPython) {
      try {
        const res = await fetch("${API}/api/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            language: "python",
            functionName: fnName,
            testCases: assignment.testCases || [],
          }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            setConsoleOutput(resData.output || "");
            setTestResults(resData.testResults || null);
            if (resData.testResults && resData.testResults.tests) {
              codePassed = resData.testResults.tests.every((t: any) => t.passed);
            }
          } else {
            setConsoleOutput(`Execution Error: ${resData.error}`);
          }
        } else {
          setConsoleOutput("Failed to connect to execution server.");
        }
      } catch (err: any) {
        setConsoleOutput(`Execution error: ${err.message}`);
      } finally {
        setIsExecuting(false);
      }
    } else {
      // JavaScript frontend runner
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
      };

      let results: any = null;
      try {
        const runWrapper = new Function(code + `\nreturn typeof ${fnName} !== 'undefined' ? ${fnName} : null;`);
        const userFn = runWrapper();

        if (!userFn) {
          throw new Error(`Function '${fnName}' not found. Make sure it is defined.`);
        }

        if (assignment.testCases && assignment.testCases.length > 0) {
          const tests = [];
          for (let i = 0; i < assignment.testCases.length; i++) {
            const tc = assignment.testCases[i];
            const args = Array.isArray(tc.input) ? tc.input : [tc.input];
            const expected = tc.expected;

            const actual = userFn(...args);
            const passed = JSON.stringify(actual) === JSON.stringify(expected);
            tests.push({
              testCase: i + 1,
              input: args,
              expected,
              actual,
              passed,
            });
          }
          results = { success: true, tests };
          codePassed = tests.every((t: any) => t.passed);
        } else {
          const result = new Function(code)();
          if (result !== undefined) {
            logs.push(`Returned: ${typeof result === 'object' ? JSON.stringify(result) : String(result)}`);
          }
          codePassed = true;
        }
      } catch (err: any) {
        results = { success: false, error: err.message };
      } finally {
        console.log = originalLog;
      }

      setConsoleOutput(logs.join('\n'));
      setTestResults(results);
      setIsExecuting(false);
    }
    
    // Save solution with pass/fail evaluation
    await saveSolution(code, codePassed);
  };

  const getTestsSummary = () => {
    if (!testResults || !testResults.tests) return null;
    const passedCount = testResults.tests.filter((t: any) => t.passed).length;
    const totalCount = testResults.tests.length;
    const allPassed = passedCount === totalCount;
    return { passedCount, totalCount, allPassed };
  };

  const summary = getTestsSummary();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm space-y-4">
      {/* Title block */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-650 flex-shrink-0 text-sm">
            📝
          </div>
          <div>
            <h4 className="text-xs font-bold text-zinc-950 leading-snug">{assignment.title}</h4>
            {/* Meta row */}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center gap-1 rounded bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-650">
                Difficulty: {assignment.difficulty || "N/A"}
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-zinc-50 border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold text-zinc-650">
                Time: {assignment.estimatedTime || "N/A"}
              </span>
              {saveStatus && (
                <span className="inline-flex items-center gap-1 rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[9px] font-bold text-indigo-650 animate-pulse transition-all">
                  ● {saveStatus}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowCompiler(!showCompiler)}
          className={`flex-shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all border ${
            showCompiler
              ? "bg-zinc-50 border-zinc-300 text-zinc-700"
              : "bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
          }`}
        >
          {showCompiler ? "Close Editor" : "Open Code Space"}
        </button>
      </div>

      <div className="border-t border-zinc-100 pt-3 space-y-2">
        <p className="text-xs text-zinc-600 leading-relaxed font-medium">
          {assignment.description}
        </p>

        {assignment.requirements && assignment.requirements.length > 0 && (
          <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block mb-1">Requirements:</span>
            {assignment.requirements.map((req, ri) => (
              <div key={ri} className="flex items-start gap-2 text-xs text-zinc-650 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                <span>{req}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compiler Panel */}
      {showCompiler && (
        <div className="rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950 flex flex-col shadow-lg mt-3">
          {/* Header toolbar */}
          <div className="flex items-center justify-between bg-zinc-900 border-b border-zinc-800 p-2 flex-wrap gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCompilerTab("code")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  compilerTab === "code" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Code
              </button>
              <button
                onClick={() => setCompilerTab("tests")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 ${
                  compilerTab === "tests" ? "bg-zinc-850 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Test Cases
                <span className="bg-zinc-800 text-zinc-400 px-1 rounded-full text-[9px]">
                  {assignment.testCases?.length || 0}
                </span>
              </button>
              <button
                onClick={() => setCompilerTab("output")}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  compilerTab === "output" ? "bg-zinc-850 text-white" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Output
                {summary && (
                  <span className={`h-1.5 w-1.5 rounded-full ${summary.allPassed ? "bg-emerald-500" : "bg-rose-500"}`} />
                )}
              </button>
            </div>

            <button
              onClick={runCode}
              disabled={isExecuting}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-550 disabled:bg-zinc-800 text-white disabled:text-zinc-550 px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95"
            >
              {isExecuting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>

          {/* Editor Body */}
          <div className="min-h-[200px] flex flex-col">
            {compilerTab === "code" && (
              <div className="flex-1 flex bg-zinc-950 font-mono text-[11px] text-zinc-100 p-2.5">
                <div className="text-zinc-650 select-none text-right pr-3.5 border-r border-zinc-850/60 leading-relaxed font-semibold">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck={false}
                  className="flex-1 bg-transparent resize-none border-0 outline-none pl-3.5 leading-relaxed h-[220px] focus:ring-0 text-zinc-100 font-mono"
                />
              </div>
            )}

            {/* Test Cases Tab */}
            {compilerTab === "tests" && (
              <div className="p-4 bg-zinc-900/40 text-zinc-300 font-mono text-xs overflow-y-auto max-h-[250px] space-y-3">
                {assignment.testCases && assignment.testCases.length > 0 ? (
                  <div className="space-y-3">
                    {assignment.testCases.map((tc, idx) => (
                      <div key={idx} className="border border-zinc-800 rounded-lg p-3 bg-zinc-950/60">
                        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">Test Case {idx + 1}</div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-zinc-500 mr-2">Call:</span>
                            <code className="text-zinc-200">
                              {fnName}({Array.isArray(tc.input) ? tc.input.map(x => JSON.stringify(x)).join(", ") : JSON.stringify(tc.input)})
                            </code>
                          </div>
                          <div>
                            <span className="text-zinc-500 mr-2">Expected:</span>
                            <code className="text-emerald-400 font-bold">{JSON.stringify(tc.expected)}</code>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    No explicit test cases generated. Use standard print statements or execution logs.
                  </div>
                )}
              </div>
            )}

            {/* Output Tab */}
            {compilerTab === "output" && (
              <div className="p-4 bg-zinc-900/40 text-zinc-250 font-mono text-xs overflow-y-auto max-h-[250px] space-y-3">
                {summary && (
                  <div className={`border rounded-lg p-3 flex items-start gap-2.5 ${
                    summary.allPassed ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-rose-500 bg-rose-500/10 text-rose-300"
                  }`}>
                    <span className="text-lg">{summary.allPassed ? "✓" : "✗"}</span>
                    <div>
                      <div className="font-bold text-xs">
                        {summary.allPassed ? "All Test Cases Passed!" : "Test Cases Failed"}
                      </div>
                      <div className="text-[10px] opacity-80 mt-0.5">
                        Passed {summary.passedCount} / {summary.totalCount} tests.
                      </div>
                    </div>
                  </div>
                )}

                {testResults && !testResults.success && (
                  <div className="border border-rose-500 bg-rose-500/10 text-rose-300 rounded-lg p-3">
                    <strong className="text-xs block">Execution Error:</strong>
                    <pre className="mt-1 text-[11px] leading-relaxed whitespace-pre-wrap">{testResults.error}</pre>
                  </div>
                )}

                {testResults && testResults.tests && (
                  <div className="space-y-2.5">
                    {testResults.tests.map((t: any) => (
                      <div key={t.testCase} className={`border rounded-lg p-3 bg-zinc-950/40 ${t.passed ? "border-emerald-500/30" : "border-rose-500/30"}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                            {t.passed ? "PASSED" : "FAILED"}
                          </span>
                          <span className="font-bold text-xs text-zinc-300">Test Case {t.testCase}</span>
                        </div>
                        <div className="space-y-0.5 text-[11px] leading-relaxed">
                          <div><span className="text-zinc-500">Call:</span> <code>{fnName}({t.input.map((x: any) => JSON.stringify(x)).join(", ")})</code></div>
                          <div><span className="text-zinc-500">Expected:</span> <code className="text-emerald-400">{JSON.stringify(t.expected)}</code></div>
                          <div><span className="text-zinc-500">Actual:</span> <code className={t.passed ? "text-emerald-400" : "text-rose-400"}>{JSON.stringify(t.actual)}</code></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {consoleOutput && (
                  <div className="bg-zinc-955 border border-zinc-800 rounded-lg p-3">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide block mb-1">Console Output (stdout):</span>
                    <pre className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-wrap">{consoleOutput}</pre>
                  </div>
                )}

                {!consoleOutput && !testResults && (
                  <div className="text-center py-6 text-zinc-500 text-xs">
                    No run logs captured. Click Run Code above to run compiler.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
