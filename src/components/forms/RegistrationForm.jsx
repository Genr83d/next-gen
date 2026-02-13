import { useEffect, useMemo, useState } from 'react';
import { courses, genderOptions, scheduleOptions } from '../../data/courses';
import { getApplicationByAuthUid, submitApplication, uploadStudentPhoto } from '../../services/applicationService';
import {
  observeAuthState,
  sendVerificationEmail,
  signInWithGoogle,
  signOutUser,
} from '../../services/authService';
import { ensureUserProfile } from '../../services/userService';
import { generateRegistrationPdf } from '../../utils/generateRegistrationPdf';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import SignaturePad from './SignaturePad';

const initialForm = {
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  address: '',
  phone: '',
  email: '',
  school: '',
  courses: [],
  schedule: '',
  emergencyName: '',
  emergencyPhone: '',
  guardianName: '',
  signatureTyped: '',
  signatureDrawn: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedGenderValues = new Set(['female', 'male']);
const namePattern = /^(?=.*[\p{L}])[\p{L}\p{M}'’ -]+$/u;
const addressPattern = /^(?=.*[\p{L}\p{M}0-9])[\p{L}\p{M}0-9\s.,#'’\-\/]+$/u;
const schoolPattern = /^(?=.*[\p{L}\p{M}0-9])[\p{L}\p{M}0-9\s.&'’\-(),\/]+$/u;
const signaturePattern = /^(?=.*[\p{L}])[\p{L}\p{M}.'’ -]+$/u;
const nameFields = new Set(['firstName', 'lastName', 'emergencyName', 'guardianName']);
const phoneDigitsPattern = /^\d+$/;
const maxPhoneDigits = 15;
const minAge = 15;
const maxPhotoSizeBytes = 512 * 1024;
const allowedPhotoTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

const toDigitsOnly = (value) => value.replace(/\D/g, '').slice(0, maxPhoneDigits);
const toNameValue = (value) => value.replace(/[^\p{L}\p{M}'’ -]/gu, '');

const validatePhotoFile = (file) => {
  if (!file) return 'Student photo is required.';
  if (!allowedPhotoTypes.has(file.type)) {
    return 'Upload a PNG, JPG, or WebP image file.';
  }
  if (file.size > maxPhotoSizeBytes) {
    return 'Image must be 512KB or smaller.';
  }
  return '';
};

const getAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
};

const RegistrationForm = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('');
  const [status, setStatus] = useState({ state: 'idle', message: '' });
  const [lastPayload, setLastPayload] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [authAction, setAuthAction] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
  const [existingApplicationLoading, setExistingApplicationLoading] = useState(false);

  const age = useMemo(() => getAge(formData.dob), [formData.dob]);
  const maxDob = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - minAge);
    return d.toISOString().split('T')[0];
  }, []);
  const requiresGuardian = age !== null && age < 18;
  const hasThirdPartyProvider = useMemo(
    () =>
      Boolean(
        authUser?.providerData?.some((provider) => provider.providerId !== 'password')
      ),
    [authUser]
  );
  const isVerifiedUser = Boolean(
    authUser && (authUser.emailVerified || hasThirdPartyProvider || authUser.phoneNumber)
  );
  const isFormLocked = authLoading || !isVerifiedUser || existingApplicationLoading || Boolean(existingApplication);

  useEffect(() => {
    let isMounted = true;
    const handleAuthChange = async (user) => {
      if (!isMounted) return;
      setAuthUser(user);
      setAuthLoading(false);
      setAuthError('');
      setVerificationSent(false);

      if (user) {
        try {
          await ensureUserProfile(user);
        } catch (error) {
          if (isMounted) {
            setAuthError(error?.message || 'Unable to create user profile.');
          }
        }
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
    return () => {
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl);
      }
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!isVerifiedUser || !authUser) {
      setExistingApplication(null);
      return undefined;
    }
    let isMounted = true;
    setExistingApplicationLoading(true);
    getApplicationByAuthUid(authUser.uid)
      .then((application) => {
        if (isMounted) {
          setExistingApplication(application);
          setExistingApplicationLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setExistingApplicationLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [authUser, isVerifiedUser]);

  const updateField = (event) => {
    const { name } = event.target;
    const rawValue = event.target.value;
    const nextValue =
      name === 'phone' || name === 'emergencyPhone'
        ? toDigitsOnly(rawValue)
        : nameFields.has(name)
          ? toNameValue(rawValue)
          : rawValue;

    setFormData((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoFile(null);
      setPhotoPreviewUrl('');
      return;
    }

    const errorMessage = validatePhotoFile(file);
    if (errorMessage) {
      setPhotoFile(null);
      setPhotoPreviewUrl('');
      setErrors((prev) => ({ ...prev, studentPhoto: errorMessage }));
      event.target.value = '';
      return;
    }

    setErrors((prev) => {
      if (!prev.studentPhoto) return prev;
      const next = { ...prev };
      delete next.studentPhoto;
      return next;
    });
    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));
  };

  const toggleCourse = (courseId) => {
    setFormData((prev) => {
      const exists = prev.courses.includes(courseId);
      const nextCourses = exists
        ? prev.courses.filter((id) => id !== courseId)
        : [...prev.courses, courseId];
      return { ...prev, courses: nextCourses };
    });
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthAction(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      setAuthError(error?.message || 'Unable to sign in. Please try again.');
    } finally {
      setAuthAction(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    setAuthAction(true);
    try {
      await signOutUser();
    } catch (error) {
      setAuthError(error?.message || 'Unable to sign out. Please try again.');
    } finally {
      setAuthAction(false);
    }
  };

  const handleResendVerification = async () => {
    if (!authUser) return;
    setAuthError('');
    setAuthAction(true);
    try {
      await sendVerificationEmail(authUser);
      setVerificationSent(true);
    } catch (error) {
      setAuthError(error?.message || 'Unable to send verification email.');
    } finally {
      setAuthAction(false);
    }
  };

  const validate = () => {
    const nextErrors = {};

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const address = formData.address.trim();
    const school = formData.school.trim();
    const signatureTyped = formData.signatureTyped.trim();
    const emergencyName = formData.emergencyName.trim();
    const guardianName = formData.guardianName.trim();

    if (!firstName) {
      nextErrors.firstName = 'First name is required.';
    } else if (!namePattern.test(firstName)) {
      nextErrors.firstName = 'Use letters, spaces, hyphens, and apostrophes only.';
    }

    if (!lastName) {
      nextErrors.lastName = 'Last name is required.';
    } else if (!namePattern.test(lastName)) {
      nextErrors.lastName = 'Use letters, spaces, hyphens, and apostrophes only.';
    }

    if (!formData.dob) {
      nextErrors.dob = 'Date of birth is required.';
    } else if (age !== null && age < minAge) {
      nextErrors.dob = `Student must be at least ${minAge} years old.`;
    }
    if (!formData.gender) {
      nextErrors.gender = 'Gender is required.';
    } else if (!allowedGenderValues.has(formData.gender)) {
      nextErrors.gender = 'Please select either Female or Male.';
    }
    if (!address) {
      nextErrors.address = 'Address is required.';
    } else if (!addressPattern.test(address)) {
      nextErrors.address =
        'Use letters, numbers, spaces, and common punctuation only.';
    }
    if (!formData.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!phoneDigitsPattern.test(formData.phone)) {
      nextErrors.phone = 'Phone number can only contain numbers.';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!emailPattern.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (formData.courses.length === 0) nextErrors.courses = 'Select at least one course.';
    if (!formData.schedule) nextErrors.schedule = 'Choose a preferred schedule.';
    const photoError = validatePhotoFile(photoFile);
    if (photoError) nextErrors.studentPhoto = photoError;
    if (school && !schoolPattern.test(school)) {
      nextErrors.school = 'Use letters, numbers, and common punctuation only.';
    }
    if (!emergencyName) {
      nextErrors.emergencyName = 'Emergency contact name is required.';
    } else if (!namePattern.test(emergencyName)) {
      nextErrors.emergencyName = 'Use letters, spaces, hyphens, and apostrophes only.';
    }
    if (!formData.emergencyPhone.trim()) {
      nextErrors.emergencyPhone = 'Emergency contact phone is required.';
    } else if (!phoneDigitsPattern.test(formData.emergencyPhone)) {
      nextErrors.emergencyPhone = 'Emergency contact phone can only contain numbers.';
    }
    if (requiresGuardian && !guardianName) {
      nextErrors.guardianName = 'Guardian name is required for minors.';
    } else if (guardianName && !namePattern.test(guardianName)) {
      nextErrors.guardianName = 'Use letters, spaces, hyphens, and apostrophes only.';
    }
    if (signatureTyped && !signaturePattern.test(signatureTyped)) {
      nextErrors.signatureTyped =
        'Use letters, spaces, periods, hyphens, and apostrophes only.';
    }

    return nextErrors;
  };

  const buildPayload = () => {
    const selectedCourses = courses
      .filter((course) => formData.courses.includes(course.id))
      .map((course) => ({ id: course.id, title: course.title }));

    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const address = formData.address.trim();
    const school = formData.school.trim();
    const signatureTyped = formData.signatureTyped.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const genderLabel = genderOptions.find((option) => option.value === formData.gender)?.label;
    const scheduleLabel = scheduleOptions.find((option) => option.value === formData.schedule)?.label;
    const authMeta = authUser
      ? {
          authUid: authUser.uid,
          authEmail: authUser.email || '',
          authProvider: authUser.providerData?.[0]?.providerId || 'unknown',
          authVerified: isVerifiedUser,
        }
      : {};

    return {
      ...formData,
      firstName,
      lastName,
      address,
      school,
      signatureTyped,
      fullName,
      ...authMeta,
      genderLabel: genderLabel || 'Not specified',
      scheduleLabel: scheduleLabel || 'Not selected',
      courses: selectedCourses,
      age,
      isMinor: requiresGuardian,
      submittedAt: new Date().toISOString(),
    };
  };

  const downloadPdf = async (payload) => {
    const doc = await generateRegistrationPdf(payload);
    const nameSource =
      payload.fullName?.trim() ||
      [payload.firstName, payload.lastName].filter(Boolean).join(' ');
    const safeName = nameSource?.trim()
      ? nameSource.trim().toLowerCase().replace(/\s+/g, '-')
      : 'student';
    const fileName = `next-gen-registration-${safeName}.pdf`;
    doc.save(fileName);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (authLoading) {
      setStatus({
        state: 'error',
        message: 'Checking verification status. Please wait a moment.',
      });
      return;
    }
    if (!isVerifiedUser) {
      setStatus({
        state: 'error',
        message: 'Please sign in and verify your account before submitting.',
      });
      return;
    }
    if (existingApplication) {
      setStatus({
        state: 'error',
        message: 'A registration has already been submitted for this account.',
      });
      return;
    }

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setStatus({ state: 'error', message: 'Please correct the highlighted fields.' });
      return;
    }

    const payload = buildPayload();
    if (!photoFile) {
      setErrors((prev) => ({ ...prev, studentPhoto: 'Student photo is required.' }));
      setStatus({ state: 'error', message: 'Please upload a student photo.' });
      return;
    }

    setStatus({ state: 'submitting', message: 'Processing student photo...' });
    let studentPhoto = null;

    try {
      studentPhoto = await uploadStudentPhoto(photoFile);
    } catch (error) {
      setStatus({
        state: 'error',
        message: error?.message || 'Unable to upload the student photo. Please try again.',
      });
      return;
    }

    const submissionPayload = {
      ...payload,
      studentPhoto,
    };
    setStatus({ state: 'submitting', message: 'Submitting registration...' });

    try {
      await submitApplication(submissionPayload);
      setExistingApplication(submissionPayload);
      setLastPayload(submissionPayload);
      await downloadPdf(submissionPayload);
      setStatus({
        state: 'success',
        message: 'Registration submitted. Your PDF form has been downloaded.',
      });
    } catch (error) {
      setStatus({
        state: 'error',
        message: error.message || 'Unable to submit registration. Please try again.',
      });
    }
  };

  const statusStyles = {
    success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    error: 'border-red-500/40 bg-red-500/10 text-red-200',
    submitting: 'border-sky-500/40 bg-sky-500/10 text-sky-200',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8" noValidate>
      {status.state !== 'idle' && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            statusStyles[status.state]
          }`}
          aria-live="polite"
        >
          {status.message}
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-sm text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Verification required</p>
            {authLoading && (
              <p className="text-xs text-slate-300">Checking your verification status...</p>
            )}
            {!authLoading && !authUser && (
              <p className="text-xs text-slate-300">
                Sign in to unlock the registration form and prevent spam submissions.
              </p>
            )}
            {!authLoading && authUser && !isVerifiedUser && (
              <p className="text-xs text-slate-300">
                Verify your account to continue. Check your inbox for a verification email.
              </p>
            )}
            {!authLoading && authUser && isVerifiedUser && (
              <p className="text-xs text-emerald-200">
                Verified as {authUser.email || 'authenticated user'}.
              </p>
            )}
            {verificationSent && (
              <p className="text-xs text-emerald-200">Verification email sent.</p>
            )}
            {authError && (
              <p className="text-xs text-red-300" role="alert">
                {authError}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            {!authLoading && !authUser && (
              <Button type="button" size="sm" variant="dark" onClick={handleGoogleSignIn} disabled={authAction}>
                Continue with Google
              </Button>
            )}
            {!authLoading && authUser && !isVerifiedUser && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleResendVerification}
                disabled={authAction}
              >
                Resend verification email
              </Button>
            )}
            {!authLoading && authUser && (
              <Button type="button" size="sm" variant="ghost" onClick={handleSignOut} disabled={authAction}>
                Sign out
              </Button>
            )}
          </div>
        </div>
      </div>

      {existingApplicationLoading && (
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
          Checking for existing registration...
        </div>
      )}

      {existingApplication && (
        <div className="rounded-2xl border border-electric-orange/50 bg-electric-orange/10 px-4 py-4 text-sm">
          <p className="font-semibold text-white">Registration already submitted</p>
          <p className="mt-1 text-slate-300">
            An application for{' '}
            <span className="text-white">
              {existingApplication.fullName ||
                [existingApplication.firstName, existingApplication.lastName]
                  .filter(Boolean)
                  .join(' ') ||
                'this account'}
            </span>{' '}
            has already been submitted.
          </p>
          <p className="mt-1 text-slate-400">
            Status:{' '}
            <span className="capitalize text-white">
              {existingApplication.status || 'submitted'}
            </span>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Each account may only submit one registration. Contact the program administrators if
            you need to make changes.
          </p>
        </div>
      )}

      <div
        className={`space-y-8 ${isFormLocked ? 'pointer-events-none opacity-60' : ''}`}
        aria-disabled={isFormLocked}
      >
        <div className="grid gap-6 md:grid-cols-2">
        <FormField label="Student First Name" labelFor="firstName" required error={errors.firstName}>
          {({ errorId }) => (
            <input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.firstName ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>

        <FormField label="Student Last Name" labelFor="lastName" required error={errors.lastName}>
          {({ errorId }) => (
            <input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.lastName ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>

        <FormField label="Date of Birth" labelFor="dob" required error={errors.dob}>
          {({ errorId }) => (
            <input
              id="dob"
              name="dob"
              type="date"
              max={maxDob}
              value={formData.dob}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.dob ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.dob)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>

        <FormField label="Gender" labelFor="gender" required error={errors.gender}>
          {({ errorId }) => (
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.gender ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.gender)}
              aria-describedby={errorId}
              required
            >
              <option value="">Select a gender</option>
              {genderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </FormField>

        <FormField label="Phone Number" labelFor="phone" required error={errors.phone}>
          {({ errorId }) => (
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={updateField}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={maxPhoneDigits}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.phone ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>
      </div>

      <FormField label="Address" labelFor="address" required error={errors.address}>
        {({ errorId }) => (
          <textarea
            id="address"
            name="address"
            rows={3}
            value={formData.address}
            onChange={updateField}
            className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
              errors.address ? 'border-red-500/60' : 'border-white/10'
            }`}
            aria-invalid={Boolean(errors.address)}
            aria-describedby={errorId}
            required
          />
        )}
      </FormField>

      <FormField
        label="Student Photo"
        labelFor="studentPhoto"
        required
        hint="PNG, JPG, or WebP (max 5MB)"
        error={errors.studentPhoto}
      >
        {({ errorId }) => (
          <div className="space-y-3">
            <input
              id="studentPhoto"
              name="studentPhoto"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="user"
              onChange={handlePhotoChange}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-electric-orange file:px-4 file:py-2 file:text-xs file:font-semibold file:text-charcoal hover:file:bg-electric-orange-dark ${
                errors.studentPhoto ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.studentPhoto)}
              aria-describedby={errorId}
              required
              disabled={isFormLocked}
            />
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {photoPreviewUrl ? (
                  <img
                    src={photoPreviewUrl}
                    alt="Student preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No photo yet</span>
                )}
              </div>
              <div className="space-y-1 text-xs text-slate-400">
                <p>Upload a clear headshot of the student.</p>
                {photoFile && <p className="text-slate-300">{photoFile.name}</p>}
              </div>
            </div>
          </div>
        )}
      </FormField>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField label="Email Address" labelFor="email" required error={errors.email}>
          {({ errorId }) => (
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.email ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>

        <FormField label="School" labelFor="school" hint="Optional" error={errors.school}>
          {({ errorId }) => (
            <input
              id="school"
              name="school"
              type="text"
              value={formData.school}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.school ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.school)}
              aria-describedby={errorId}
            />
          )}
        </FormField>
      </div>

      <div className="space-y-4">
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-slate-200">
            Course Selection <span className="text-electric-orange">*</span>
          </legend>
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <label
                key={course.id}
                className={`flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-4 text-sm transition ${
                  formData.courses.includes(course.id)
                    ? 'border-electric-orange bg-electric-orange/10'
                    : 'border-white/10 bg-black/30 hover:border-white/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{course.title}</span>
                  <input
                    type="checkbox"
                    name="courses"
                    value={course.id}
                    checked={formData.courses.includes(course.id)}
                    onChange={() => toggleCourse(course.id)}
                    className="h-4 w-4 rounded border-white/20 bg-black/40 text-electric-orange focus:ring-electric-orange"
                  />
                </div>
                <span className="text-xs text-slate-400">{course.summary}</span>
              </label>
            ))}
          </div>
          {errors.courses && (
            <p className="text-xs text-red-400" role="alert">
              {errors.courses}
            </p>
          )}
        </fieldset>

        <FormField label="Preferred Class Schedule" labelFor="schedule" required error={errors.schedule}>
          {({ errorId }) => (
            <select
              id="schedule"
              name="schedule"
              value={formData.schedule}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.schedule ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.schedule)}
              aria-describedby={errorId}
              required
            >
              <option value="">Select a schedule</option>
              {scheduleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <FormField
          label="Emergency Contact Name"
          labelFor="emergencyName"
          required
          error={errors.emergencyName}
        >
          {({ errorId }) => (
            <input
              id="emergencyName"
              name="emergencyName"
              type="text"
              value={formData.emergencyName}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.emergencyName ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.emergencyName)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>

        <FormField
          label="Emergency Contact Phone"
          labelFor="emergencyPhone"
          required
          error={errors.emergencyPhone}
        >
          {({ errorId }) => (
            <input
              id="emergencyPhone"
              name="emergencyPhone"
              type="tel"
              value={formData.emergencyPhone}
              onChange={updateField}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={maxPhoneDigits}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.emergencyPhone ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.emergencyPhone)}
              aria-describedby={errorId}
              required
            />
          )}
        </FormField>
      </div>

      <FormField
        label="Guardian Name"
        labelFor="guardianName"
        required={requiresGuardian}
        hint={requiresGuardian ? 'Required for students under 18' : 'Only required for minors'}
        error={errors.guardianName}
      >
        {({ errorId }) => (
          <input
            id="guardianName"
            name="guardianName"
            type="text"
            value={formData.guardianName}
            onChange={updateField}
            className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
              errors.guardianName ? 'border-red-500/60' : 'border-white/10'
            }`}
            aria-invalid={Boolean(errors.guardianName)}
            aria-describedby={errorId}
            required={requiresGuardian}
          />
        )}
      </FormField>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <FormField
          label="Typed Signature"
          labelFor="signatureTyped"
          hint="Optional"
          error={errors.signatureTyped}
        >
          {({ errorId }) => (
            <input
              id="signatureTyped"
              name="signatureTyped"
              type="text"
              value={formData.signatureTyped}
              onChange={updateField}
              className={`w-full rounded-xl border bg-black/30 px-4 py-3 text-sm text-white outline-none transition focus:border-electric-orange ${
                errors.signatureTyped ? 'border-red-500/60' : 'border-white/10'
              }`}
              aria-invalid={Boolean(errors.signatureTyped)}
              aria-describedby={errorId}
            />
          )}
        </FormField>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-slate-200">Drawn Signature (optional)</p>
          <SignaturePad
            value={formData.signatureDrawn}
            onChange={(value) => setFormData((prev) => ({ ...prev, signatureDrawn: value }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button
          type="submit"
          size="lg"
          disabled={status.state === 'submitting' || isFormLocked}
        >
          {status.state === 'submitting' ? 'Submitting...' : 'Submit Registration'}
        </Button>
        {status.state === 'success' && lastPayload && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => downloadPdf(lastPayload)}
          >
            Download PDF Again
          </Button>
        )}
      </div>
      </div>
    </form>
  );
};

export default RegistrationForm;
