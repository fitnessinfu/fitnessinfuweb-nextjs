'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function CoursePlaylistManager({
  courseId,
  courseSlug,
  courseTitle,
  initialModules = [],
}) {
  const [modules, setModules] = useState(initialModules);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModal, setEditModal] = useState({ open: false, lesson: null, title: '', duration: '', preview: false });
  const [replaceModal, setReplaceModal] = useState({ open: false, lesson: null });
  const [previewModal, setPreviewModal] = useState({ open: false, lesson: null, error: null });

  // Upload state for Add / Replace
  const [uploadState, setUploadState] = useState({
    file: null,
    fileName: '',
    fileSizeFormatted: '',
    progress: 0,
    uploading: false,
    error: '',
    success: false,
  });

  // New lesson form state
  const [newLessonForm, setNewLessonForm] = useState({
    title: '',
    duration: '20 min',
    preview: false,
    moduleId: '',
  });

  // Flattened playlist with sequence numbers
  const playlist = modules.flatMap((mod) =>
    (mod.lessons || []).map((les) => ({
      ...les,
      moduleId: mod.id,
      moduleTitle: mod.title,
    }))
  );

  // Auto-clear alert after 5s
  useEffect(() => {
    if (alertMsg.text) {
      const timer = setTimeout(() => setAlertMsg({ type: '', text: '' }), 6000);
      return () => clearTimeout(timer);
    }
  }, [alertMsg]);

  // Refresh course playlist from server
  const refreshPlaylist = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      const data = await res.json();
      if (data.success && data.course) {
        setModules(data.course.modules || []);
      }
    } catch (err) {
      console.error('Failed to refresh playlist:', err);
    }
  }, [courseId]);

  // Initial fetch on mount to ensure fresh media info
  useEffect(() => {
    let ignore = false;
    const fetchLatest = async () => {
      if (!courseId) return;
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`);
        const data = await res.json();
        if (!ignore && data.success && data.course) {
          setModules(data.course.modules || []);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchLatest();
    return () => {
      ignore = true;
    };
  }, [courseId]);

  // Format bytes helper
  const formatBytes = (bytes) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // ----------------------------------------------------
  // Actions: Reordering (Move Up / Move Down)
  // ----------------------------------------------------
  const handleMoveLesson = async (currentIndex, direction) => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= playlist.length) return;

    const newOrder = [...playlist];
    const temp = newOrder[currentIndex];
    newOrder[currentIndex] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    // Optimistically update UI
    const orderedIds = newOrder.map((l) => l.id);

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedLessonIds: orderedIds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order.');
      setAlertMsg({ type: 'success', text: 'Lesson order updated successfully.' });
      await refreshPlaylist();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message });
      await refreshPlaylist();
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Edit Lesson Title & Details
  // ----------------------------------------------------
  const openEditModal = (lesson) => {
    setEditModal({
      open: true,
      lesson,
      title: lesson.title,
      duration: lesson.duration || '20 min',
      preview: Boolean(lesson.preview),
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.title.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${editModal.lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editModal.title.trim(),
          duration: editModal.duration.trim(),
          preview: editModal.preview,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update lesson.');

      setAlertMsg({ type: 'success', text: `Lesson "${editModal.title}" updated successfully.` });
      setEditModal({ open: false, lesson: null, title: '', duration: '', preview: false });
      await refreshPlaylist();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Delete Lesson
  // ----------------------------------------------------
  const handleDeleteLesson = async (lesson) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete this lesson and its associated video?\n\nLesson: "${lesson.title}"`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lesson.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete lesson.');

      setAlertMsg({ type: 'success', text: data.message || 'Lesson deleted successfully.' });
      await refreshPlaylist();
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // Actions: Add New Lesson with Video Upload
  // ----------------------------------------------------
  const openAddModal = () => {
    setNewLessonForm({
      title: '',
      duration: '20 min',
      preview: false,
      moduleId: modules[0]?.id || '',
    });
    setUploadState({
      file: null,
      fileName: '',
      fileSizeFormatted: '',
      progress: 0,
      uploading: false,
      error: '',
      success: false,
    });
    setAddModalOpen(true);
  };

  const handleVideoFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSizeMb = 500;
    if (file.size > maxSizeMb * 1024 * 1024) {
      setUploadState((prev) => ({
        ...prev,
        error: `Selected video exceeds ${maxSizeMb}MB size limit (${formatBytes(file.size)}).`,
      }));
      return;
    }

    setUploadState({
      file,
      fileName: file.name,
      fileSizeFormatted: formatBytes(file.size),
      progress: 0,
      uploading: false,
      error: '',
      success: false,
    });
  };

  const handleUploadNewLesson = () => {
    if (!newLessonForm.title.trim()) {
      setUploadState((prev) => ({ ...prev, error: 'Please enter a lesson title.' }));
      return;
    }
    if (!uploadState.file) {
      setUploadState((prev) => ({ ...prev, error: 'Please select a video file to upload.' }));
      return;
    }

    setUploadState((prev) => ({ ...prev, uploading: true, error: '', progress: 1 }));

    const formData = new FormData();
    formData.append('file', uploadState.file);
    formData.append('type', 'video');
    formData.append('courseId', courseId);
    formData.append('courseSlug', courseSlug);
    formData.append('title', newLessonForm.title.trim());
    formData.append('duration', newLessonForm.duration || '20 min');
    formData.append('preview', String(newLessonForm.preview));
    if (newLessonForm.moduleId) {
      formData.append('moduleId', newLessonForm.moduleId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadState((prev) => ({ ...prev, progress: percent }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadState((prev) => ({ ...prev, progress: 100, uploading: false, success: true }));
        setAlertMsg({ type: 'success', text: `New lesson "${newLessonForm.title}" added to course playlist.` });
        await refreshPlaylist();
        setTimeout(() => {
          setAddModalOpen(false);
        }, 1200);
      } else {
        let errMessage = 'Upload failed. Please try again.';
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp.error) errMessage = resp.error;
        } catch (e) {
          // ignore json parse error
        }
        setUploadState((prev) => ({ ...prev, uploading: false, error: errMessage }));
      }
    };

    xhr.onerror = () => {
      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        error: 'Network connection error during upload. Please check your connection and retry.',
      }));
    };

    xhr.send(formData);
  };

  // ----------------------------------------------------
  // Actions: Replace Existing Video
  // ----------------------------------------------------
  const openReplaceModal = (lesson) => {
    setReplaceModal({ open: true, lesson });
    setUploadState({
      file: null,
      fileName: '',
      fileSizeFormatted: '',
      progress: 0,
      uploading: false,
      error: '',
      success: false,
    });
  };

  const handleUploadReplacement = () => {
    if (!uploadState.file) {
      setUploadState((prev) => ({ ...prev, error: 'Please select a replacement video file.' }));
      return;
    }

    setUploadState((prev) => ({ ...prev, uploading: true, error: '', progress: 1 }));

    const formData = new FormData();
    formData.append('file', uploadState.file);
    formData.append('type', 'video');
    formData.append('courseId', courseId);
    formData.append('courseSlug', courseSlug);
    formData.append('lessonId', replaceModal.lesson.id);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/admin/media/upload');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
        setUploadState((prev) => ({ ...prev, progress: percent }));
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setUploadState((prev) => ({ ...prev, progress: 100, uploading: false, success: true }));
        setAlertMsg({ type: 'success', text: `Video replaced successfully for "${replaceModal.lesson.title}".` });
        await refreshPlaylist();
        setTimeout(() => {
          setReplaceModal({ open: false, lesson: null });
        }, 1200);
      } else {
        let errMessage = 'Video replacement failed.';
        try {
          const resp = JSON.parse(xhr.responseText);
          if (resp.error) errMessage = resp.error;
        } catch (e) {
          // ignore
        }
        setUploadState((prev) => ({ ...prev, uploading: false, error: errMessage }));
      }
    };

    xhr.onerror = () => {
      setUploadState((prev) => ({
        ...prev,
        uploading: false,
        error: 'Network connection error. Please retry replacement.',
      }));
    };

    xhr.send(formData);
  };

  // ----------------------------------------------------
  // Actions: Preview Video in Admin Player Modal
  // ----------------------------------------------------
  const openPreviewModal = (lesson) => {
    setPreviewModal({
      open: true,
      lesson,
      error: !lesson.hasVideo && !lesson.videoFileName ? 'No video file is currently linked to this lesson.' : null,
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({ open: false, lesson: null, error: null });
  };

  const totalVideosAvailable = playlist.filter((l) => l.hasVideo).length;

  return (
    <div className="admin-card playlist-manager-card" id="admin-course-playlist" style={{ marginTop: '24px' }}>
      {/* ── Section Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '20px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 className="admin-card-title" style={{ margin: 0, fontSize: '1.25rem', letterSpacing: '0.8px' }}>
              COURSE PLAYLIST &amp; VIDEO LESSONS
            </h2>
            <span
              style={{
                background: 'rgba(240, 124, 32, 0.15)',
                color: 'var(--orange, #f07c20)',
                border: '1px solid rgba(240, 124, 32, 0.3)',
                padding: '2px 8px',
                fontSize: '0.72rem',
                fontWeight: '700',
                borderRadius: '3px',
              }}
            >
              {playlist.length} {playlist.length === 1 ? 'Lesson' : 'Lessons'}
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px', marginBottom: 0 }}>
            Every lesson below appears directly in the student course player. Preview, reorder, replace, or upload new
            videos.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', textAlign: 'right' }}>
            <span>{totalVideosAvailable} of {playlist.length} Videos Available</span>
          </div>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={openAddModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
          >
            <span>+</span> ADD NEW LESSON
          </button>
        </div>
      </div>

      {/* Global Alerts inside section */}
      {alertMsg.text && (
        <div
          className={`admin-alert ${alertMsg.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}`}
          style={{ marginBottom: '18px' }}
        >
          {alertMsg.text}
        </div>
      )}

      {/* ── Playlist Rows ── */}
      {playlist.length === 0 ? (
        <div
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '6px',
            border: '1px dashed rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎬</div>
          <h3 style={{ fontFamily: 'Bebas Neue', fontSize: '1.4rem', color: '#fff', letterSpacing: '0.8px' }}>
            No Lessons in Course Playlist Yet
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', maxWidth: '420px', margin: '6px auto 18px' }}>
            Get started by adding your first video lesson. Students will see lessons in the exact order configured here.
          </p>
          <button type="button" className="btn-admin-primary" onClick={openAddModal}>
            + Add Your First Lesson
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {playlist.map((lesson, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === playlist.length - 1;
            const hasVideo = Boolean(lesson.hasVideo);

            return (
              <div
                key={lesson.id || idx}
                style={{
                  background: 'rgba(11, 21, 40, 0.75)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '6px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                  transition: 'border-color 0.15s ease',
                }}
              >
                {/* Left: Reorder arrows & Sequence index */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '85px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <button
                      type="button"
                      onClick={() => handleMoveLesson(idx, 'up')}
                      disabled={isFirst || loading}
                      title="Move lesson up"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: isFirst ? 'rgba(255,255,255,0.2)' : '#fff',
                        cursor: isFirst ? 'not-allowed' : 'pointer',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        borderRadius: '3px',
                        lineHeight: '1',
                      }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveLesson(idx, 'down')}
                      disabled={isLast || loading}
                      title="Move lesson down"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: isLast ? 'rgba(255,255,255,0.2)' : '#fff',
                        cursor: isLast ? 'not-allowed' : 'pointer',
                        padding: '2px 6px',
                        fontSize: '0.7rem',
                        borderRadius: '3px',
                        lineHeight: '1',
                      }}
                    >
                      ▼
                    </button>
                  </div>

                  <span
                    style={{
                      fontFamily: 'Bebas Neue',
                      fontSize: '1.3rem',
                      color: 'var(--orange, #f07c20)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    #{idx + 1}
                  </span>
                </div>

                {/* Middle: Lesson Details & Media Metadata */}
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: '1.02rem',
                        fontWeight: '600',
                        color: '#fff',
                        cursor: 'pointer',
                      }}
                      onClick={() => openEditModal(lesson)}
                      title="Click to edit title"
                    >
                      {lesson.title}
                    </h3>

                    {lesson.preview ? (
                      <span
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          border: '1px solid #10b981',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          padding: '1px 6px',
                          borderRadius: '2px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Free Preview
                      </span>
                    ) : (
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.1)',
                          color: 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontSize: '0.65rem',
                          fontWeight: '600',
                          padding: '1px 6px',
                          borderRadius: '2px',
                          textTransform: 'uppercase',
                        }}
                      >
                        Protected
                      </span>
                    )}

                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                      ⏱ {lesson.duration || '20 min'}
                    </span>
                  </div>

                  {/* Video & Media Status Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                    {hasVideo ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#34d399' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                        <strong>Video:</strong> {lesson.videoFileName || 'Linked Video'}{' '}
                        {lesson.videoFileSize && `(${lesson.videoFileSize})`}
                      </span>
                    ) : (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#fbbf24' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span>
                        <span>No Video File Attached</span>
                      </span>
                    )}

                    {lesson.moduleTitle && (
                      <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        [{lesson.moduleTitle}]
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Actions Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* PREVIEW BUTTON */}
                  <button
                    type="button"
                    className="btn-admin-secondary btn-admin-sm"
                    onClick={() => openPreviewModal(lesson)}
                    style={{
                      background: hasVideo ? 'rgba(240, 124, 32, 0.15)' : 'rgba(255,255,255,0.05)',
                      borderColor: hasVideo ? 'rgba(240, 124, 32, 0.4)' : 'rgba(255,255,255,0.1)',
                      color: hasVideo ? 'var(--orange, #f07c20)' : 'rgba(255,255,255,0.4)',
                    }}
                    title={hasVideo ? 'Play and inspect video in admin preview' : 'Video missing'}
                  >
                    ▶ PREVIEW
                  </button>

                  {/* EDIT TITLE BUTTON */}
                  <button
                    type="button"
                    className="btn-admin-secondary btn-admin-sm"
                    onClick={() => openEditModal(lesson)}
                    title="Change lesson title or settings"
                  >
                    ✏ EDIT TITLE
                  </button>

                  {/* REPLACE VIDEO BUTTON */}
                  <button
                    type="button"
                    className="btn-admin-secondary btn-admin-sm"
                    onClick={() => openReplaceModal(lesson)}
                    title="Upload replacement video file for this lesson"
                  >
                    🔄 REPLACE VIDEO
                  </button>

                  {/* DELETE LESSON BUTTON */}
                  <button
                    type="button"
                    className="btn-admin-danger btn-admin-sm"
                    onClick={() => handleDeleteLesson(lesson)}
                    title="Delete this lesson and remove from playlist"
                  >
                    🗑 DELETE
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Obvious Bottom "+ ADD NEW LESSON" Button */}
      {playlist.length > 0 && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            type="button"
            className="btn-admin-primary"
            onClick={openAddModal}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>+</span> ADD NEW LESSON
          </button>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: PREVIEW VIDEO MODAL                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {previewModal.open && previewModal.lesson && (
        <div className="admin-modal-backdrop" onClick={closePreviewModal}>
          <div
            className="admin-modal-box"
            style={{ maxWidth: '820px', width: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--orange, #f07c20)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ADMIN VIDEO PREVIEW · {courseTitle || courseSlug}
                </span>
                <h3 className="admin-modal-title" style={{ marginTop: '2px', fontSize: '1.25rem' }}>
                  {previewModal.lesson.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePreviewModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.6rem',
                  cursor: 'pointer',
                  lineHeight: '1',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {previewModal.error ? (
                <div
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                  }}
                >
                  <div style={{ fontSize: '2.4rem', marginBottom: '10px' }}>⚠️</div>
                  <h4 style={{ color: '#fca5a5', margin: '0 0 6px', fontSize: '1.1rem' }}>Video File Missing or Unavailable</h4>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', maxWidth: '460px', margin: '0 auto 16px' }}>
                    {previewModal.error}
                  </p>
                  <button
                    type="button"
                    className="btn-admin-primary"
                    onClick={() => {
                      const les = previewModal.lesson;
                      closePreviewModal();
                      openReplaceModal(les);
                    }}
                  >
                    Upload / Replace Video Now
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '16 / 9',
                      background: '#000',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <video
                      key={previewModal.lesson.id}
                      controls
                      autoPlay
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      src={`/api/admin/courses/${courseId}/lessons/${previewModal.lesson.id}/video`}
                      onError={() => {
                        setPreviewModal((prev) => ({
                          ...prev,
                          error: 'Video file could not be loaded from storage. It may have been moved or deleted.',
                        }));
                      }}
                    >
                      Your browser does not support HTML5 video preview.
                    </video>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '12px',
                      fontSize: '0.8rem',
                      color: 'rgba(255,255,255,0.6)',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <span>
                      <strong>Media File:</strong> {previewModal.lesson.videoFileName || 'Dynamic Asset'}{' '}
                      {previewModal.lesson.videoFileSize && `(${previewModal.lesson.videoFileSize})`}
                    </span>
                    <span>
                      Access: {previewModal.lesson.preview ? 'Free Preview' : 'Protected Curriculum'}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="admin-modal-actions" style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button type="button" className="btn-admin-secondary" onClick={closePreviewModal}>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: + ADD NEW LESSON MODAL                                  */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {addModalOpen && (
        <div className="admin-modal-backdrop" onClick={() => !uploadState.uploading && setAddModalOpen(false)}>
          <div className="admin-modal-box" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Add New Lesson &amp; Upload Video</h3>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {uploadState.error && (
                <div className="admin-alert admin-alert-error" style={{ marginBottom: '14px' }}>
                  {uploadState.error}
                </div>
              )}

              {uploadState.success && (
                <div className="admin-alert admin-alert-success" style={{ marginBottom: '14px' }}>
                  ✓ Lesson and video successfully added!
                </div>
              )}

              <div style={{ marginBottom: '14px' }}>
                <label className="admin-label">Lesson Title *</label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Core Bracing &amp; Diaphragmatic Breathwork"
                  value={newLessonForm.title}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, title: e.target.value })}
                  disabled={uploadState.uploading || uploadState.success}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label className="admin-label">Duration</label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%' }}
                    placeholder="e.g. 24 min"
                    value={newLessonForm.duration}
                    onChange={(e) => setNewLessonForm({ ...newLessonForm, duration: e.target.value })}
                    disabled={uploadState.uploading || uploadState.success}
                  />
                </div>

                {modules.length > 1 && (
                  <div>
                    <label className="admin-label">Assign Module</label>
                    <select
                      className="admin-select"
                      style={{ width: '100%' }}
                      value={newLessonForm.moduleId}
                      onChange={(e) => setNewLessonForm({ ...newLessonForm, moduleId: e.target.value })}
                      disabled={uploadState.uploading || uploadState.success}
                    >
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Free Preview Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                <input
                  type="checkbox"
                  id="new-lesson-preview"
                  checked={newLessonForm.preview}
                  onChange={(e) => setNewLessonForm({ ...newLessonForm, preview: e.target.checked })}
                  disabled={uploadState.uploading || uploadState.success}
                />
                <label htmlFor="new-lesson-preview" style={{ color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                  Allow Free Preview (students can watch before enrolling)
                </label>
              </div>

              {/* Video File Picker */}
              <div
                style={{
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.2)',
                  marginBottom: '14px',
                }}
              >
                <label className="admin-label" style={{ marginBottom: '8px' }}>
                  Select Video File (Required: MP4, WebM) *
                </label>
                <input
                  type="file"
                  accept="video/mp4, video/webm, video/quicktime"
                  onChange={handleVideoFileSelect}
                  disabled={uploadState.uploading || uploadState.success}
                  className="admin-input"
                  style={{ width: '100%' }}
                />

                {uploadState.fileName && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>🎬 <strong>{uploadState.fileName}</strong></span>
                    <span style={{ color: 'var(--orange, #f07c20)' }}>{uploadState.fileSizeFormatted}</span>
                  </div>
                )}

                <div className="admin-hint" style={{ marginTop: '8px' }}>
                  Max file size: 500MB. Videos are saved securely in protected storage outside the public folder.
                </div>
              </div>

              {/* Upload Progress Bar */}
              {uploadState.uploading && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: '#fff' }}>Uploading video...</span>
                    <span style={{ color: 'var(--orange, #f07c20)', fontWeight: '700' }}>{uploadState.progress}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadState.progress}%`,
                        height: '100%',
                        background: 'var(--orange, #f07c20)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setAddModalOpen(false)}
                disabled={uploadState.uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={handleUploadNewLesson}
                disabled={uploadState.uploading || uploadState.success}
              >
                {uploadState.uploading ? `Uploading (${uploadState.progress}%)...` : 'Upload & Add Lesson'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: REPLACE VIDEO MODAL                                     */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {replaceModal.open && replaceModal.lesson && (
        <div className="admin-modal-backdrop" onClick={() => !uploadState.uploading && setReplaceModal({ open: false, lesson: null })}>
          <div className="admin-modal-box" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--orange, #f07c20)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  REPLACE LESSON VIDEO
                </span>
                <h3 className="admin-modal-title" style={{ marginTop: '2px' }}>
                  {replaceModal.lesson.title}
                </h3>
              </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {uploadState.error && (
                <div className="admin-alert admin-alert-error" style={{ marginBottom: '14px' }}>
                  {uploadState.error}
                </div>
              )}

              {uploadState.success && (
                <div className="admin-alert admin-alert-success" style={{ marginBottom: '14px' }}>
                  ✓ Video replaced successfully! The student player now streams the new video.
                </div>
              )}

              {/* Current video info */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '0.85rem',
                }}
              >
                <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2px', fontSize: '0.75rem' }}>CURRENT VIDEO:</div>
                <div style={{ color: '#fff', fontWeight: '600' }}>
                  {replaceModal.lesson.videoFileName || 'No current file'}
                  {replaceModal.lesson.videoFileSize && ` (${replaceModal.lesson.videoFileSize})`}
                </div>
              </div>

              {/* New Video File Picker */}
              <div
                style={{
                  border: '1px dashed rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  padding: '16px',
                  background: 'rgba(0,0,0,0.2)',
                  marginBottom: '14px',
                }}
              >
                <label className="admin-label" style={{ marginBottom: '8px' }}>
                  Select Replacement Video (MP4, WebM) *
                </label>
                <input
                  type="file"
                  accept="video/mp4, video/webm, video/quicktime"
                  onChange={handleVideoFileSelect}
                  disabled={uploadState.uploading || uploadState.success}
                  className="admin-input"
                  style={{ width: '100%' }}
                />

                {uploadState.fileName && (
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>🆕 <strong>{uploadState.fileName}</strong></span>
                    <span style={{ color: 'var(--orange, #f07c20)' }}>{uploadState.fileSizeFormatted}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {uploadState.uploading && (
                <div style={{ marginTop: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span style={{ color: '#fff' }}>Replacing video file on server...</span>
                    <span style={{ color: 'var(--orange, #f07c20)', fontWeight: '700' }}>{uploadState.progress}%</span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadState.progress}%`,
                        height: '100%',
                        background: 'var(--orange, #f07c20)',
                        transition: 'width 0.2s ease',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="btn-admin-secondary"
                onClick={() => setReplaceModal({ open: false, lesson: null })}
                disabled={uploadState.uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-primary"
                onClick={handleUploadReplacement}
                disabled={uploadState.uploading || uploadState.success}
              >
                {uploadState.uploading ? `Uploading (${uploadState.progress}%)...` : 'Upload & Replace'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: EDIT TITLE MODAL                                        */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {editModal.open && editModal.lesson && (
        <div className="admin-modal-backdrop" onClick={() => !loading && setEditModal({ open: false, lesson: null, title: '', duration: '', preview: false })}>
          <div className="admin-modal-box" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Edit Lesson Title &amp; Settings</h3>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label className="admin-label">Lesson Title *</label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%' }}
                    value={editModal.title}
                    onChange={(e) => setEditModal({ ...editModal, title: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label className="admin-label">Duration</label>
                  <input
                    type="text"
                    className="admin-input"
                    style={{ width: '100%' }}
                    value={editModal.duration}
                    onChange={(e) => setEditModal({ ...editModal, duration: e.target.value })}
                    disabled={loading}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="edit-lesson-preview"
                    checked={editModal.preview}
                    onChange={(e) => setEditModal({ ...editModal, preview: e.target.checked })}
                    disabled={loading}
                  />
                  <label htmlFor="edit-lesson-preview" style={{ color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                    Free Preview (allow student to watch without purchase)
                  </label>
                </div>
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="btn-admin-secondary"
                  onClick={() => setEditModal({ open: false, lesson: null, title: '', duration: '', preview: false })}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-admin-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Title Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
