'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import CoursePlaylistManager from './CoursePlaylistManager';

const CATEGORIES = [
  'Foundation',
  'Athlete Development',
  'Community',
  'General Fitness',
  'Specialized Programs',
];

export default function CourseForm({ initialData = null, isEdit = false }) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    tagline: initialData?.tagline || '',
    description: initialData?.description || '',
    category: initialData?.category || 'Foundation',
    badge: initialData?.badge || 'FOUNDATION',
    badgeColor: initialData?.badgeColor || '#f07c20',
    accessType: initialData?.accessType || 'free',
    price: initialData?.price !== undefined ? initialData.price : 0,
    duration: initialData?.duration || '4 Weeks',
    schedule: initialData?.schedule || '3 Sessions per Week',
    icon: initialData?.icon || '🏋️',
    thumbnail: initialData?.thumbnail || '',
    sortOrder: initialData?.sortOrder !== undefined ? initialData.sortOrder : 1,
    published: initialData?.published !== undefined ? initialData.published : true,
    learningObjectives: initialData?.learningObjectives?.length
      ? initialData.learningObjectives
      : [''],
  });

  const [autoSlug, setAutoSlug] = useState(!isEdit);
  const [newObjective, setNewObjective] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle title change and auto-slug
  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData((prev) => {
      const next = { ...prev, title };
      if (autoSlug) {
        next.slug = title
          .toLowerCase()
          .trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-]+/g, '')
          .replace(/\-\-+/g, '-');
      }
      return next;
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  };

  // Thumbnail upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('type', 'thumbnail');
      data.append('courseSlug', formData.slug || 'course');

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Upload failed.');

      setFormData((prev) => ({ ...prev, thumbnail: json.fileUrl }));
    } catch (err) {
      setError(err.message || 'Image upload failed.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Learning Objectives
  const addObjective = () => {
    if (!newObjective.trim()) return;
    setFormData((prev) => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives.filter((o) => o.trim()), newObjective.trim()],
    }));
    setNewObjective('');
  };

  const removeObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Course title is required.');
      return;
    }

    if (formData.accessType === 'paid' && parseFloat(formData.price) <= 0) {
      setError('Paid programs require a price greater than 0.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isEdit ? `/api/admin/courses/${initialData.id}` : '/api/admin/courses';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save course.');

      setSuccess(isEdit ? 'Course updated successfully!' : 'Course created successfully!');
      setTimeout(() => {
        router.push('/admin/courses');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err.message || 'Error saving course.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '960px' }}>
      {error && (
        <div
          role="alert"
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#fca5a5',
            padding: '14px 18px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '0.9rem',
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#6ee7b7',
            padding: '14px 18px',
            borderRadius: '6px',
            marginBottom: '24px',
            fontSize: '0.9rem',
          }}
        >
          ✓ {success}
        </div>
      )}

      {/* Basic Metadata Card */}
      <div className="admin-card">
        <h2 className="admin-card-title">Program Identity &amp; Classification</h2>

        <div className="admin-grid-2">
          {/* Title */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-title">
              Course Title *
            </label>
            <input
              id="course-title"
              type="text"
              name="title"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="e.g. FI7 Elevate"
              value={formData.title}
              onChange={handleTitleChange}
              required
            />
          </div>

          {/* Slug */}
          <div className="admin-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="admin-label" htmlFor="course-slug" style={{ marginBottom: 0 }}>
                URL Slug *
              </label>
              <button
                type="button"
                onClick={() => setAutoSlug((p) => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: autoSlug ? 'var(--orange, #f07c20)' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                {autoSlug ? '🔒 Auto-Sync' : '✏️ Manual'}
              </button>
            </div>
            <input
              id="course-slug"
              type="text"
              name="slug"
              className="admin-input"
              style={{ width: '100%', fontFamily: 'monospace' }}
              placeholder="e.g. fi7-elevate"
              value={formData.slug}
              onChange={(e) => {
                setAutoSlug(false);
                handleChange(e);
              }}
              required
            />
            <div className="admin-hint">Public URL: /courses/{formData.slug || '...'}</div>
          </div>
        </div>

        {/* Tagline */}
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="course-tagline">
            Tagline / Subheading
          </label>
          <input
            id="course-tagline"
            type="text"
            name="tagline"
            className="admin-input"
            style={{ width: '100%' }}
            placeholder="e.g. Strength &amp; Progressive Training System"
            value={formData.tagline}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div className="admin-form-group">
          <label className="admin-label" htmlFor="course-desc">
            Full Description
          </label>
          <textarea
            id="course-desc"
            name="description"
            rows={4}
            className="admin-textarea"
            style={{ width: '100%', resize: 'vertical' }}
            placeholder="Comprehensive overview of the course methodology, requirements, and outcomes."
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* Category, Badge & Icon */}
        <div className="admin-grid-3">
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-category">
              Category
            </label>
            <select
              id="course-category"
              name="category"
              className="admin-select"
              style={{ width: '100%' }}
              value={formData.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-badge">
              Badge Label
            </label>
            <input
              id="course-badge"
              type="text"
              name="badge"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="e.g. ELITE"
              value={formData.badge}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-icon">
              Emoji Icon
            </label>
            <input
              id="course-icon"
              type="text"
              name="icon"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="🏋️"
              value={formData.icon}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Pricing & Scheduling Card */}
      <div className="admin-card">
        <h2 className="admin-card-title">Access &amp; Pricing Architecture</h2>

        <div className="admin-grid-3">
          {/* Access Type */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-access">
              Access Type
            </label>
            <select
              id="course-access"
              name="accessType"
              className="admin-select"
              style={{ width: '100%' }}
              value={formData.accessType}
              onChange={handleChange}
            >
              <option value="free">Free (Instant Athlete Enrollment)</option>
              <option value="paid">Paid Program</option>
            </select>
          </div>

          {/* Price */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-price">
              Price (INR ₹)
            </label>
            <input
              id="course-price"
              type="number"
              name="price"
              min="0"
              step="1"
              className="admin-input"
              style={{ width: '100%' }}
              disabled={formData.accessType === 'free'}
              value={formData.accessType === 'free' ? 0 : formData.price}
              onChange={handleChange}
            />
          </div>

          {/* Sort Order */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-order">
              Display Sort Order
            </label>
            <input
              id="course-order"
              type="number"
              name="sortOrder"
              className="admin-input"
              style={{ width: '100%' }}
              value={formData.sortOrder}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="admin-grid-2">
          {/* Duration */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-duration">
              Program Duration
            </label>
            <input
              id="course-duration"
              type="text"
              name="duration"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="e.g. 12 Weeks"
              value={formData.duration}
              onChange={handleChange}
            />
          </div>

          {/* Schedule */}
          <div className="admin-form-group">
            <label className="admin-label" htmlFor="course-schedule">
              Training Schedule
            </label>
            <input
              id="course-schedule"
              type="text"
              name="schedule"
              className="admin-input"
              style={{ width: '100%' }}
              placeholder="e.g. 3 Sessions per Week"
              value={formData.schedule}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Publication Checkbox */}
        <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            id="course-published"
            type="checkbox"
            name="published"
            checked={formData.published}
            onChange={handleChange}
            style={{ accentColor: 'var(--orange, #f07c20)', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="course-published" style={{ color: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
            Publish to Course Catalog (visible to public athletes)
          </label>
        </div>
      </div>

      {/* Media & Thumbnail Upload */}
      <div className="admin-card">
        <h2 className="admin-card-title">Cover Media &amp; Thumbnail</h2>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label className="admin-label">Upload Program Cover / Thumbnail</label>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleThumbnailUpload}
              className="admin-input"
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <div className="admin-hint">
              Supported formats: JPEG, PNG, WebP (Max 10MB). Image is automatically processed and saved to public storage.
            </div>
            {uploadingImage && (
              <div style={{ color: 'var(--orange, #f07c20)', fontSize: '0.85rem', marginTop: '6px' }}>
                Uploading image...
              </div>
            )}
          </div>

          {formData.thumbnail && (
            <div
              style={{
                width: '160px',
                height: '110px',
                position: 'relative',
                borderRadius: '6px',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Image
                src={formData.thumbnail}
                alt="Course preview"
                fill
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* COURSE PLAYLIST & VIDEO LESSONS */}
      {isEdit && (
        <CoursePlaylistManager
          courseId={initialData?.id || initialData?._id}
          courseSlug={formData.slug || initialData?.slug}
          courseTitle={formData.title || initialData?.title}
          initialModules={initialData?.modules || []}
        />
      )}

      {/* Learning Objectives */}
      <div className="admin-card">
        <h2 className="admin-card-title">Curriculum Learning Objectives</h2>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>
          Key athletic and movement competencies developed in this program.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
          <input
            type="text"
            className="admin-input"
            style={{ flex: 1 }}
            placeholder="e.g. Master progressive barbell squat mechanics with neutral spine"
            value={newObjective}
            onChange={(e) => setNewObjective(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addObjective();
              }
            }}
          />
          <button type="button" onClick={addObjective} className="btn-admin-secondary">
            + Add
          </button>
        </div>

        <ul style={{ listStyle: 'none', padding: 0 }}>
          {formData.learningObjectives.map((obj, idx) => (
            <li
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '4px',
                marginBottom: '8px',
                fontSize: '0.88rem',
              }}
            >
              <span>● {obj}</span>
              <button
                type="button"
                onClick={() => removeObjective(idx)}
                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1rem' }}
                title="Remove objective"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '14px', marginTop: '28px' }}>
        <button type="submit" className="btn-admin-primary" disabled={submitting}>
          {submitting ? 'Saving Course...' : isEdit ? 'Update Course' : 'Create Course'}
        </button>
        <button
          type="button"
          className="btn-admin-secondary"
          onClick={() => router.push('/admin/courses')}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
