import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import sanitizeHtml from "sanitize-html";
import { createTranslator } from "next-intl";
import { auth } from "@/auth";
import { PrismaUserRepository } from "@/modules/auth/infrastructure/prisma-user-repository";
import { listCoursesForTeacher } from "@/modules/courses/application/list-courses-for-teacher";
import { PrismaCourseRepository } from "@/modules/courses/infrastructure/prisma-course-repository";
import { listLevels } from "@/modules/levels/application/list-levels";
import { PrismaLevelRepository } from "@/modules/levels/infrastructure/prisma-level-repository";
import { listSemestersForCourse } from "@/modules/semesters/application/list-semesters-for-course";
import { PrismaSemesterRepository } from "@/modules/semesters/infrastructure/prisma-semester-repository";
import { PrismaEnrollmentRepository } from "@/modules/enrollments/infrastructure/prisma-enrollment-repository";
import { Badge } from "@/components/ui/badge";
import { BookingFlow } from "@/app/t/[teacherId]/booking-flow";
import { NextIntlClientProvider } from "next-intl";
import { BookOpen, Monitor, MapPin, Star } from "lucide-react";
import { CollapsibleSection } from "@/app/t/[teacherId]/collapsible-section";
import { BookNowButton } from "@/app/t/[teacherId]/book-now-button";

const userRepository = new PrismaUserRepository();
const courseRepository = new PrismaCourseRepository();
const levelRepository = new PrismaLevelRepository();
const semesterRepository = new PrismaSemesterRepository();
const enrollmentRepository = new PrismaEnrollmentRepository();

type PageProps = {
  readonly params: Promise<{ teacherId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { teacherId } = await params;
  const teacher = await userRepository.findById(teacherId);
  if (!teacher || teacher.role !== "TEACHER") return {};
  return {
    title: `${teacher.name} — OpenClass`,
    description: teacher.bio
      ? sanitizeHtml(teacher.bio, { allowedTags: [] }).slice(0, 160)
      : `Book a course with ${teacher.name} on OpenClass.`,
  };
}

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "h2", "h3", "u", "s", "iframe", "figure", "figcaption",
  ],
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    "*": ["class", "style"],
    iframe: ["src", "frameborder", "allowfullscreen", "width", "height"],
  },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
};

export default async function TeacherBookingPage({ params }: PageProps) {
  const { teacherId } = await params;
  const teacher = await userRepository.findById(teacherId);

  if (!teacher || teacher.role !== "TEACHER") notFound();

  const locale = (teacher.locale === "ar" ? "ar" : "en") as "ar" | "en";
  const dir = locale === "ar" ? "rtl" : "ltr";

  const [courses, levels, messages, session] = await Promise.all([
    listCoursesForTeacher({ courseRepository }, teacherId),
    listLevels({ levelRepository }),
    import(`../../../../messages/${locale}.json`),
    auth(),
  ]);

  // Fetch semesters for all courses in parallel
  const semesterLists = await Promise.all(
    courses.map((c) => listSemestersForCourse({ semesterRepository }, c.id)),
  );
  const semestersByCourse: Record<string, { id: string; courseId: string; startDate: string; endDate: string }[]> = {};
  courses.forEach((c, i) => {
    semestersByCourse[c.id] = (semesterLists[i] ?? []).map((s) => ({
      id: s.id,
      courseId: s.courseId,
      startDate: s.startDate.toISOString(),
      endDate: s.endDate.toISOString(),
    }));
  });

  // Build semesterId → courseId map for enrollment lookup
  const semesterToCourse: Record<string, string> = {};
  for (const [courseId, sems] of Object.entries(semestersByCourse)) {
    for (const s of sems) semesterToCourse[s.id] = courseId;
  }

  // Fetch enrolled course IDs for logged-in student
  const enrolledCourseIds: string[] = [];
  if (session?.user.id) {
    const enrollments = await enrollmentRepository.findByStudent(session.user.id);
    for (const e of enrollments) {
      const courseId = semesterToCourse[e.semesterId];
      if (courseId && !enrolledCourseIds.includes(courseId)) {
        enrolledCourseIds.push(courseId);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allMessages = messages.default as any;
  const t = createTranslator({ locale, messages: allMessages["publicProfile"] });

  const accent = teacher.accentColor ?? "#6366f1";
  const cleanBio = teacher.bio ? sanitizeHtml(teacher.bio, SANITIZE_OPTIONS) : null;
  const cleanPaymentDetails = teacher.paymentDetails
    ? sanitizeHtml(teacher.paymentDetails, SANITIZE_OPTIONS)
    : null;

  const onlineCourses = courses.filter((c) => c.sessionType === "ONLINE").length;
  const offlineCourses = courses.filter((c) => c.sessionType === "OFFLINE").length;

  return (
    <div dir={dir} lang={locale} style={{ "--accent": accent } as React.CSSProperties}>
      {/* Cover */}
      <div className="relative h-52 sm:h-64 w-full overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900">
        {teacher.coverUrl ? (
          <Image
            src={teacher.coverUrl}
            alt="Cover"
            fill
            className="object-cover"
            style={{ objectPosition: `center ${teacher.coverOffsetY ?? 50}%` }}
            priority
            unoptimized
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${accent}cc 0%, ${accent}44 100%)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-8">
        {/* Avatar only overlaps cover — name stays on page background */}
        <div className="-mt-14 mb-4">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-background shadow-xl bg-muted">
            {teacher.photoUrl ? (
              <Image
                src={teacher.photoUrl}
                alt={teacher.name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-4xl font-bold text-white"
                style={{ background: accent }}
              >
                {teacher.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name + badges — always on page background */}
        <div className="mb-6 flex flex-col gap-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{teacher.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className="text-white text-xs font-semibold"
              style={{ backgroundColor: accent }}
            >
              {t("teacherBadge")}
            </Badge>
            {courses.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {t("courseCount", { count: courses.length })}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            {/* Stats row */}
            {courses.length > 0 && (
              <div className="flex flex-wrap gap-6 py-4 border-y">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} style={{ color: accent }} />
                  <span className="text-sm font-medium">
                    {t("statCourses", { count: courses.length })}
                  </span>
                </div>
                {onlineCourses > 0 && (
                  <div className="flex items-center gap-2">
                    <Monitor size={16} style={{ color: accent }} />
                    <span className="text-sm font-medium">
                      {t("statOnline", { count: onlineCourses })}
                    </span>
                  </div>
                )}
                {offlineCourses > 0 && (
                  <div className="flex items-center gap-2">
                    <MapPin size={16} style={{ color: accent }} />
                    <span className="text-sm font-medium">
                      {t("statOffline", { count: offlineCourses })}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {cleanBio && (
              <CollapsibleSection heading={t("aboutSection")} accent={accent}>
                <div
                  className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: cleanBio }}
                />
              </CollapsibleSection>
            )}

            {/* Courses + booking flow (client component) */}
            <div id="courses">
              <NextIntlClientProvider locale={locale} messages={{ booking: allMessages.booking }}>
                <BookingFlow
                  courses={courses}
                  levels={levels}
                  semestersByCourse={semestersByCourse}
                  accent={accent}
                  teacherLocale={locale}
                  teacherId={teacherId}
                  isLoggedIn={!!session}
                  enrolledCourseIds={enrolledCourseIds}
                  paymentDetails={teacher.paymentDetails}
                />
              </NextIntlClientProvider>
            </div>

            {/* Payment details */}
            {cleanPaymentDetails && (
              <div className="mb-16">
                <CollapsibleSection heading={t("paymentDetailsLabel")} accent={accent}>
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: cleanPaymentDetails }}
                  />
                </CollapsibleSection>
              </div>
            )}
          </div>

          {/* Sidebar CTA */}
          <aside className="lg:col-span-1">
            <div className="sticky top-6 rounded-2xl border bg-card p-6 shadow-sm flex flex-col items-center gap-5 text-center">
              <div
                className="relative h-20 w-20 overflow-hidden rounded-full border-2 bg-muted"
                style={{ borderColor: accent }}
              >
                {teacher.photoUrl ? (
                  <Image
                    src={teacher.photoUrl}
                    alt={teacher.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-2xl font-bold text-white"
                    style={{ background: accent }}
                  >
                    {teacher.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div>
                <p className="font-semibold text-base">{teacher.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("ctaAvailable", { count: courses.length })}
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} style={{ color: accent }} fill={accent} />
                ))}
                <span className="ml-1">{t("teacherBadge")}</span>
              </div>

              <BookNowButton label={t("ctaBook")} accent={accent} />

              <p className="text-xs text-muted-foreground leading-snug">
                {t("ctaNote", { name: teacher.name.split(" ")[0] ?? teacher.name })}
              </p>

            </div>
          </aside>
        </div>

      </div>
    </div>
  );
}
