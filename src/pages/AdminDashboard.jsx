import { useEffect, useMemo, useState } from 'react';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { courses, scheduleOptions } from '../data/courses';
import {
  deleteApplication,
  listenToApplications,
  updateApplicationNotes,
  updateApplicationStatus,
} from '../services/applicationService';
import { observeAuthState, signInWithGoogle, signOutUser } from '../services/authService';
import { getUserProfile } from '../services/userService';
import { generateRegistrationPdf } from '../utils/generateRegistrationPdf';

const statusStyles = {
  submitted: 'border-electric-orange/50 bg-electric-orange/10 text-electric-orange',
  approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  rejected: 'border-red-500/40 bg-red-500/10 text-red-200',
};

const formatTimestamp = (value) => {
  if (!value) return 'N/A';
  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return 'N/A';
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
};

const buildSafeName = (application) => {
  const nameSource = application.fullName?.trim() ||
    [application.firstName, application.lastName].filter(Boolean).join(' ');
  return nameSource?.trim()
    ? nameSource.trim().toLowerCase().replace(/\s+/g, '-')
    : 'student';
};

const matchesSearch = (application, searchValue) => {
  if (!searchValue) return true;
  const haystack = [
    application.fullName,
    application.firstName,
    application.lastName,
    application.email,
    application.phone,
    application.school,
    application.address,
    application.guardianName,
    application.emergencyName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(searchValue.toLowerCase());
};

const matchesDateRange = (application, rangeValue) => {
  if (rangeValue === 'all') return true;
  const createdAt = application.createdAt?.toDate?.() || new Date(application.submittedAt || 0);
  if (Number.isNaN(createdAt.getTime())) return false;

  const now = new Date();
  const rangeDays = Number(rangeValue);
  if (!rangeDays) return true;
  const cutoff = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
  return createdAt >= cutoff;
};

const AdminDashboard = () => {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [applications, setApplications] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState('');
  const [actionState, setActionState] = useState({
    updatingId: null,
    savingNotesId: null,
    deletingId: null,
  });
  const [notesDrafts, setNotesDrafts] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    course: 'all',
    schedule: 'all',
    status: 'all',
    minor: 'all',
    dateRange: 'all',
  });

  useEffect(() => {
    let isMounted = true;

    const handleAuthChange = async (user) => {
      if (!isMounted) return;
      setAuthUser(user);
      setAuthError('');
      setAuthLoading(true);

      if (!user) {
        setIsAdmin(false);
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);
        if (!isMounted) return;
        const role = profile?.role;
        setIsAdmin(String(role || '').toLowerCase() === 'admin');
        if (!profile) {
          setAuthError('No user profile found for this account.');
        }
      } catch (error) {
        if (isMounted) {
          setIsAdmin(false);
          setAuthError(error?.message || 'Unable to verify admin access.');
        }
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    const unsubscribe = observeAuthState((user) => {
      void handleAuthChange(user);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isAdmin) return undefined;
    setDataLoading(true);
    setDataError('');

    const unsubscribe = listenToApplications(
      (apps) => {
        setApplications(apps);
        setDataLoading(false);
      },
      (error) => {
        setDataError(error?.message || 'Unable to load applications.');
        setDataLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    setNotesDrafts((prev) => {
      const next = { ...prev };
      applications.forEach((application) => {
        if (next[application.id] === undefined) {
          next[application.id] = application.adminNotes || '';
        }
      });
      return next;
    });
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const statusValue = application.status || 'submitted';
      const scheduleValue = application.schedule || 'unknown';
      const matchesCourse =
        filters.course === 'all' ||
        application.courses?.some((course) => course.id === filters.course);
      const matchesSchedule =
        filters.schedule === 'all' || filters.schedule === scheduleValue;
      const matchesStatus = filters.status === 'all' || filters.status === statusValue;
      const matchesMinor =
        filters.minor === 'all' ||
        (filters.minor === 'minor' ? application.isMinor : !application.isMinor);

      return (
        matchesCourse &&
        matchesSchedule &&
        matchesStatus &&
        matchesMinor &&
        matchesSearch(application, filters.search) &&
        matchesDateRange(application, filters.dateRange)
      );
    });
  }, [applications, filters]);

  const stats = useMemo(() => {
    const total = applications.length;
    const minors = applications.filter((application) => application.isMinor).length;
    const approved = applications.filter((application) => application.status === 'approved').length;
    const rejected = applications.filter((application) => application.status === 'rejected').length;
    const pending = total - approved - rejected;

    return { total, minors, approved, rejected, pending };
  }, [applications]);

  const handleDownloadPdf = async (application) => {
    const doc = await generateRegistrationPdf(application);
    const safeName = buildSafeName(application);
    doc.save(`next-gen-registration-${safeName}.pdf`);
  };

  const handleStatusUpdate = async (applicationId, status) => {
    if (!authUser) return;
    setActionState((prev) => ({ ...prev, updatingId: applicationId }));
    try {
      await updateApplicationStatus(applicationId, status, {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || '',
      });
    } catch (error) {
      setDataError(error?.message || 'Unable to update status.');
    } finally {
      setActionState((prev) => ({ ...prev, updatingId: null }));
    }
  };

  const handleNotesSave = async (applicationId) => {
    if (!authUser) return;
    setActionState((prev) => ({ ...prev, savingNotesId: applicationId }));
    try {
      await updateApplicationNotes(applicationId, notesDrafts[applicationId] || '', {
        uid: authUser.uid,
        email: authUser.email || '',
        displayName: authUser.displayName || '',
      });
    } catch (error) {
      setDataError(error?.message || 'Unable to save notes.');
    } finally {
      setActionState((prev) => ({ ...prev, savingNotesId: null }));
    }
  };

  const handleDelete = async (applicationId, photoPath) => {
    if (!window.confirm('Delete this application? This cannot be undone.')) return;
    setActionState((prev) => ({ ...prev, deletingId: applicationId }));
    try {
      await deleteApplication(applicationId, photoPath);
    } catch (error) {
      setDataError(error?.message || 'Unable to delete application.');
    } finally {
      setActionState((prev) => ({ ...prev, deletingId: null }));
    }
  };

  const handleExportCsv = () => {
    if (!filteredApplications.length) return;
    const rows = filteredApplications.map((application) => ({
      id: application.id,
      submittedAt: formatTimestamp(application.createdAt || application.submittedAt),
      fullName: application.fullName || '',
      firstName: application.firstName || '',
      lastName: application.lastName || '',
      dob: application.dob || '',
      gender: application.genderLabel || application.gender || '',
      address: application.address || '',
      phone: application.phone || '',
      email: application.email || '',
      school: application.school || '',
      schedule: application.scheduleLabel || application.schedule || '',
      courses: application.courses?.map((course) => course.title).join(', ') || '',
      emergencyName: application.emergencyName || '',
      emergencyPhone: application.emergencyPhone || '',
      guardianName: application.guardianName || '',
      status: application.status || 'submitted',
      studentPhotoUrl: application.studentPhoto?.dataUrl || application.studentPhoto?.url || '',
      studentPhotoType: application.studentPhoto?.contentType || '',
      studentPhotoSize: application.studentPhoto?.size || '',
      adminNotes: application.adminNotes || '',
    }));

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const raw = row[header] ?? '';
            const escaped = String(raw).replace(/"/g, '""');
            return `"${escaped}"`;
          })
          .join(',')
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `next-gen-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading) {
    return (
      <section className="bg-charcoal pb-20 pt-16">
        <Container>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 text-sm text-slate-300">
            Checking admin access...
          </div>
        </Container>
      </section>
    );
  }

  if (!authUser) {
    return (
      <section className="bg-charcoal pb-20 pt-16">
        <Container>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              Sign in with a Google account that has admin access to view registrations.
            </p>
            {authError && <p className="mt-3 text-sm text-red-300">{authError}</p>}
            <div className="mt-5">
              <Button onClick={signInWithGoogle}>Continue with Google</Button>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  if (!isAdmin) {
    return (
      <section className="bg-charcoal pb-20 pt-16">
        <Container>
          <div className="rounded-3xl border border-white/10 bg-black/30 p-6">
            <h1 className="text-2xl font-semibold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">
              This account does not have admin privileges. Ask a system administrator to set the
              <span className="text-white"> role</span> field to <span className="text-white">admin</span> in the
              users collection.
            </p>
            {authError && <p className="mt-3 text-sm text-red-300">{authError}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Button variant="ghost" onClick={signOutUser}>
                Sign out
              </Button>
            </div>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-charcoal pb-20 pt-12">
      <div className="pointer-events-none absolute inset-0 opacity-60 section-grid" />
      <Container className="relative">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-electric-orange">
              Admin Dashboard
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Registration Control Center
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Review student submissions, manage approvals, and export enrollment data.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleExportCsv}
              disabled={!filteredApplications.length}
            >
              Export CSV
            </Button>
            <Button variant="dark" onClick={signOutUser}>
              Sign out
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total submissions</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.total}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Pending review</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Approved</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-200">{stats.approved}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Minors</p>
            <p className="mt-2 text-2xl font-semibold text-white">{stats.minors}</p>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={filters.search}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, search: event.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange md:col-span-2"
            />
            <select
              value={filters.course}
              onChange={(event) => setFilters((prev) => ({ ...prev, course: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange"
            >
              <option value="all">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <select
              value={filters.schedule}
              onChange={(event) => setFilters((prev) => ({ ...prev, schedule: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange"
            >
              <option value="all">All schedules</option>
              {scheduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange"
            >
              <option value="all">All statuses</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={filters.minor}
              onChange={(event) => setFilters((prev) => ({ ...prev, minor: event.target.value }))}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange"
            >
              <option value="all">All ages</option>
              <option value="minor">Minors only</option>
              <option value="adult">Adults only</option>
            </select>
            <select
              value={filters.dateRange}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, dateRange: event.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange"
            >
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Showing {filteredApplications.length} of {applications.length} applications.
          </div>
        </div>

        {dataError && (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {dataError}
          </div>
        )}

        {dataLoading ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-4 py-6 text-sm text-slate-300">
            Loading applications...
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {filteredApplications.map((application) => {
              const statusValue = application.status || 'submitted';
              const signatureStatus = application.signatureDrawn
                ? 'Drawn signature'
                : application.signatureTyped
                  ? 'Typed signature'
                  : 'No signature';
              const photoMeta = application.studentPhoto;
              const photoUrl = photoMeta?.dataUrl || photoMeta?.url || '';
              const createdAtText = formatTimestamp(
                application.createdAt || application.submittedAt
              );

              return (
                <div
                  key={application.id}
                  className="rounded-3xl border border-white/10 bg-charcoal-soft p-6 shadow-card"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Submitted {createdAtText}</p>
                      <h2 className="mt-2 text-xl font-semibold text-white">
                        {application.fullName ||
                          [application.firstName, application.lastName].filter(Boolean).join(' ')}
                      </h2>
                      <p className="mt-1 text-sm text-slate-300">
                        {application.email || 'No email'} · {application.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          statusStyles[statusValue] || statusStyles.submitted
                        }`}
                      >
                        {statusValue}
                      </span>
                      {application.isMinor && (
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-200">
                          Minor
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-6 lg:grid-cols-[140px_1fr]">
                    <div className="space-y-3">
                      <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt="Student"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No photo</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        <p>{photoMeta?.contentType || 'No file type'}</p>
                        <p>{formatFileSize(photoMeta?.size)}</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Contact</p>
                        <p className="mt-2">{application.address || 'No address provided'}</p>
                        <p className="mt-2 text-xs text-slate-400">School</p>
                        <p>{application.school || 'Not provided'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Courses</p>
                        <p className="mt-2">
                          {application.courses?.length
                            ? application.courses.map((course) => course.title).join(', ')
                            : 'No courses selected'}
                        </p>
                        <p className="mt-2 text-xs text-slate-400">Schedule</p>
                        <p>{application.scheduleLabel || application.schedule || 'Not selected'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Emergency Contact</p>
                        <p className="mt-2">{application.emergencyName || 'N/A'}</p>
                        <p className="mt-1 text-xs text-slate-400">{application.emergencyPhone || 'N/A'}</p>
                        <p className="mt-2 text-xs text-slate-400">Guardian</p>
                        <p>{application.guardianName || 'Not required'}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-slate-300">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Verification</p>
                        <p className="mt-2">{application.authVerified ? 'Verified' : 'Not verified'}</p>
                        <p className="mt-2 text-xs text-slate-400">Signature</p>
                        <p>{signatureStatus}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(application.id, 'approved')}
                      disabled={actionState.updatingId === application.id}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStatusUpdate(application.id, 'rejected')}
                      disabled={actionState.updatingId === application.id}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="dark"
                      onClick={() => handleDownloadPdf(application)}
                    >
                      Download PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(application.id, photoMeta?.path)}
                      disabled={actionState.deletingId === application.id}
                      className="border-red-500/40 text-red-300 hover:border-red-400 hover:text-red-200"
                    >
                      Delete
                    </Button>
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Admin Notes
                    </label>
                    <textarea
                      rows={3}
                      value={notesDrafts[application.id] || ''}
                      onChange={(event) =>
                        setNotesDrafts((prev) => ({
                          ...prev,
                          [application.id]: event.target.value,
                        }))
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span>Last update: {formatTimestamp(application.notesUpdatedAt)}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleNotesSave(application.id)}
                        disabled={actionState.savingNotesId === application.id}
                      >
                        Save notes
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}

            {!filteredApplications.length && (
              <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-6 text-sm text-slate-300">
                No applications match these filters yet.
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
};

export default AdminDashboard;
