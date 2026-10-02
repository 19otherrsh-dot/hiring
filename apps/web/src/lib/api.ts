const API_BASE = 'http://localhost:3001';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('hireflow_token', token);
    } else {
      localStorage.removeItem('hireflow_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('hireflow_token');
    }
    return this.token;
  }

  private async request(path: string, options: RequestInit = {}) {
    const headers: any = { 'Content-Type': 'application/json', ...options.headers };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  // ─── Auth ───────────────────────────────────────────────────
  register(email: string, password: string, name: string, role: string) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role }),
    });
  }

  login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request('/api/auth/me');
  }

  // ─── Profiles ───────────────────────────────────────────────
  getProfile() {
    return this.request('/api/profiles/me');
  }

  updateProfile(data: any) {
    return this.request('/api/profiles', { method: 'POST', body: JSON.stringify(data) });
  }

  parseResume(resumeText: string) {
    return this.request('/api/profiles/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    });
  }

  // ─── Jobs ───────────────────────────────────────────────────
  getJobs(params?: { search?: string; location?: string; page?: number; skills?: string; seniority?: string; industry?: string }) {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.location) qs.set('location', params.location);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.skills) qs.set('skills', params.skills);
    if (params?.seniority) qs.set('seniority', params.seniority);
    if (params?.industry) qs.set('industry', params.industry);
    return this.request(`/api/jobs?${qs.toString()}`);
  }

  getJob(jobId: string) {
    return this.request(`/api/jobs/${jobId}`);
  }

  getMyJobs() {
    return this.request('/api/jobs/mine');
  }

  createJob(data: any) {
    return this.request('/api/jobs', { method: 'POST', body: JSON.stringify(data) });
  }

  getJobCandidates(jobId: string) {
    return this.request(`/api/jobs/${jobId}/candidates`);
  }

  // ─── Applications ───────────────────────────────────────────
  applyToJob(jobId: string) {
    return this.request(`/api/jobs/${jobId}/apply`, { method: 'POST' });
  }

  getMyApplications() {
    return this.request('/api/applications/mine');
  }

  updateApplicationStatus(appId: string, status: string) {
    return this.request(`/api/applications/${appId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ─── Interviews ─────────────────────────────────────────────
  getMyInterviews() {
    return this.request('/api/interviews/mine');
  }

  createInterview(data: {
    applicationId: string;
    scheduledAt: string;
    durationMinutes?: number;
    type?: string;
    meetingLink?: string;
    notes?: string;
  }) {
    return this.request('/api/interviews', { method: 'POST', body: JSON.stringify(data) });
  }

  updateInterview(interviewId: string, data: any) {
    return this.request(`/api/interviews/${interviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ─── Notifications ──────────────────────────────────────────
  getNotifications() {
    return this.request('/api/notifications');
  }

  getUnreadCount() {
    return this.request('/api/notifications/unread-count');
  }

  markNotificationRead(notifId: string) {
    return this.request(`/api/notifications/${notifId}/read`, { method: 'PATCH' });
  }

  markAllNotificationsRead() {
    return this.request('/api/notifications/read-all', { method: 'PATCH' });
  }

  // ─── Analytics ──────────────────────────────────────────────
  getAnalyticsDashboard() {
    return this.request('/api/analytics/dashboard');
  }

  // ─── Settings ───────────────────────────────────────────────
  updateSettings(data: { name?: string; companyName?: string; companyWebsite?: string; companyDesc?: string }) {
    return this.request('/api/settings/profile', { method: 'PATCH', body: JSON.stringify(data) });
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.request('/api/settings/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // ─── Phase 3A: Resume Upload ────────────────────────────────
  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const headers: any = {};
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/api/profiles/upload-resume`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  }

  // ─── Phase 3A: Scorecards ──────────────────────────────────
  submitScorecard(data: {
    interviewId: string;
    technicalScore?: number;
    communicationScore?: number;
    problemSolvingScore?: number;
    cultureFitScore?: number;
    overallScore?: number;
    strengths?: string;
    weaknesses?: string;
    recommendation?: string;
    notes?: string;
  }) {
    return this.request('/api/scorecards', { method: 'POST', body: JSON.stringify(data) });
  }

  getScorecards(interviewId: string) {
    return this.request(`/api/scorecards/${interviewId}`);
  }

  // ─── Phase 3A: Activity Log ────────────────────────────────
  getActivities(applicationId: string) {
    return this.request(`/api/activities/${applicationId}`);
  }

  addNote(applicationId: string, title: string, description?: string) {
    return this.request('/api/activities', {
      method: 'POST',
      body: JSON.stringify({ applicationId, title, description }),
    });
  }

  // ─── Phase 3A: Pipeline Stages ─────────────────────────────
  getPipelineStages(jobId: string) {
    return this.request(`/api/pipeline-stages/${jobId}`);
  }

  createPipelineStage(data: { jobId: string; name: string; color?: string; order?: number }) {
    return this.request('/api/pipeline-stages', { method: 'POST', body: JSON.stringify(data) });
  }

  updatePipelineStage(stageId: string, data: { name?: string; color?: string; order?: number }) {
    return this.request(`/api/pipeline-stages/${stageId}`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  deletePipelineStage(stageId: string) {
    return this.request(`/api/pipeline-stages/${stageId}`, { method: 'DELETE' });
  }

  reorderPipelineStages(jobId: string, stages: { id: string; order: number }[]) {
    return this.request(`/api/pipeline-stages/${jobId}/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ stages }),
    });
  }

  // ─── Phase 3B: Referrals ──────────────────────────────────
  submitReferral(data: { jobId: string; candidateName: string; candidateEmail: string; notes?: string }) {
    return this.request('/api/referrals', { method: 'POST', body: JSON.stringify(data) });
  }

  getMyReferrals() {
    return this.request('/api/referrals/mine');
  }

  getReferralStats() {
    return this.request('/api/referrals/stats');
  }

  updateReferralStatus(id: string, status: string) {
    return this.request(`/api/referrals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // ─── Phase 3B: Offers ─────────────────────────────────────
  createOffer(data: {
    applicationId: string;
    salary: number;
    currency?: string;
    startDate: string;
    expiresAt: string;
    benefits?: string;
    jobTitle: string;
  }) {
    return this.request('/api/offers', { method: 'POST', body: JSON.stringify(data) });
  }

  getMyOffers() {
    return this.request('/api/offers/mine');
  }

  getOffer(offerId: string) {
    return this.request(`/api/offers/${offerId}`);
  }

  approveOffer(offerId: string) {
    return this.request(`/api/offers/${offerId}/approve`, { method: 'PATCH' });
  }

  sendOffer(offerId: string) {
    return this.request(`/api/offers/${offerId}/send`, { method: 'PATCH' });
  }

  respondToOffer(offerId: string, response: 'ACCEPTED' | 'DECLINED', candidateNotes?: string) {
    return this.request(`/api/offers/${offerId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ response, candidateNotes }),
    });
  }

  // ─── Phase 3B: DEI & Compliance ───────────────────────────
  submitDemographics(data: {
    applicationId: string;
    gender?: string;
    ethnicity?: string;
    veteranStatus?: string;
    disabilityStatus?: string;
  }) {
    return this.request('/api/demographics', { method: 'POST', body: JSON.stringify(data) });
  }

  getDeiAnalytics() {
    return this.request('/api/analytics/dei');
  }

  toggleBlindScreening(jobId: string, enabled: boolean) {
    return this.request(`/api/jobs/${jobId}/blind-screening`, {
      method: 'PATCH',
      body: JSON.stringify({ enabled }),
    });
  }

  // ─── Phase 3B: Nurture Sequences ──────────────────────────
  createSequence(data: { name: string; description?: string }) {
    return this.request('/api/nurture-sequences', { method: 'POST', body: JSON.stringify(data) });
  }

  getSequences() {
    return this.request('/api/nurture-sequences');
  }

  getSequence(seqId: string) {
    return this.request(`/api/nurture-sequences/${seqId}`);
  }

  addSequenceStep(seqId: string, data: { subject: string; body: string; delayDays?: number; order?: number }) {
    return this.request(`/api/nurture-sequences/${seqId}/steps`, { method: 'POST', body: JSON.stringify(data) });
  }

  deleteSequenceStep(stepId: string) {
    return this.request(`/api/nurture-steps/${stepId}`, { method: 'DELETE' });
  }

  enrollCandidate(seqId: string, data: { candidateEmail: string; candidateName?: string }) {
    return this.request(`/api/nurture-sequences/${seqId}/enroll`, { method: 'POST', body: JSON.stringify(data) });
  }

  toggleSequence(seqId: string) {
    return this.request(`/api/nurture-sequences/${seqId}/toggle`, { method: 'PATCH' });
  }

  // ─── Interview AI Copilot ─────────────────────────────────
  generateInterviewQuestions(jobId: string, candidateId?: string) {
    return this.request('/api/interviews/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ jobId, candidateId }),
    });
  }

  // ─── Public Career Site ───────────────────────────────────
  getPublicJobs(params?: { company?: string; search?: string; location?: string }) {
    const qs = new URLSearchParams();
    if (params?.company) qs.set('company', params.company);
    if (params?.search) qs.set('search', params.search);
    if (params?.location) qs.set('location', params.location);
    return this.request(`/api/public/jobs?${qs.toString()}`);
  }

  getPublicJob(jobId: string) {
    return this.request(`/api/public/jobs/${jobId}`);
  }

  getPublicOrganization(orgId: string) {
    return this.request(`/api/public/organization/${orgId}`);
  }

  // ─── Phase 4: Organization & Workflow ───────────────────────
  getMyOrganization() {
    return this.request('/api/organization');
  }

  updateOrganizationSettings(settings: any) {
    return this.request('/api/organization/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    });
  }

  createDepartment(name: string) {
    return this.request('/api/organization/departments', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  inviteUser(data: { email: string; name: string; role: string; departmentId?: string }) {
    return this.request('/api/organization/invite', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  getJobTriggers(jobId: string) {
    return this.request(`/api/jobs/${jobId}/triggers`);
  }

  createJobTrigger(jobId: string, data: any) {
    return this.request(`/api/jobs/${jobId}/triggers`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  deleteTrigger(triggerId: string) {
    return this.request(`/api/triggers/${triggerId}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();


