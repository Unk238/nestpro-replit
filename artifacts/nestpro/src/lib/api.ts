const API_BASE = '/api';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? res.statusText);
  }
  return res.json();
}

export const api = {
  // Properties
  getProperties: () => apiFetch<any[]>('/properties'),
  getProperty: (id: number) => apiFetch<any>(`/properties/${id}`),
  createProperty: (data: any) => apiFetch<any>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id: number, data: any) => apiFetch<any>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProperty: (id: number) => apiFetch<any>(`/properties/${id}`, { method: 'DELETE' }),
  getPropertyBeds: (propertyId: number) => apiFetch<any[]>(`/properties/${propertyId}/beds`),

  // Buildings
  getBuildings: (propertyId: number) => apiFetch<any[]>(`/properties/${propertyId}/buildings`),
  createBuilding: (propertyId: number, data: any) => apiFetch<any>(`/properties/${propertyId}/buildings`, { method: 'POST', body: JSON.stringify(data) }),
  updateBuilding: (id: number, data: any) => apiFetch<any>(`/buildings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBuilding: (id: number) => apiFetch<any>(`/buildings/${id}`, { method: 'DELETE' }),

  // Floors
  getFloors: (buildingId: number) => apiFetch<any[]>(`/buildings/${buildingId}/floors`),
  createFloor: (buildingId: number, data: any) => apiFetch<any>(`/buildings/${buildingId}/floors`, { method: 'POST', body: JSON.stringify(data) }),
  updateFloor: (id: number, data: any) => apiFetch<any>(`/floors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFloor: (id: number) => apiFetch<any>(`/floors/${id}`, { method: 'DELETE' }),

  // Rooms
  getRooms: (floorId: number) => apiFetch<any[]>(`/floors/${floorId}/rooms`),
  createRoom: (floorId: number, data: any) => apiFetch<any>(`/floors/${floorId}/rooms`, { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: number, data: any) => apiFetch<any>(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRoom: (id: number) => apiFetch<any>(`/rooms/${id}`, { method: 'DELETE' }),

  // Beds
  getBeds: (roomId: number) => apiFetch<any[]>(`/rooms/${roomId}/beds`),
  createBed: (roomId: number, data: any) => apiFetch<any>(`/rooms/${roomId}/beds`, { method: 'POST', body: JSON.stringify(data) }),
  updateBed: (id: number, data: any) => apiFetch<any>(`/beds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBed: (id: number) => apiFetch<any>(`/beds/${id}`, { method: 'DELETE' }),

  // Guests
  getGuests: (params?: { propertyId?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.propertyId) qs.set('propertyId', String(params.propertyId));
    if (params?.status) qs.set('status', params.status);
    return apiFetch<any[]>(`/guests${qs.toString() ? '?' + qs : ''}`);
  },
  getGuest: (id: number) => apiFetch<any>(`/guests/${id}`),
  createGuest: (data: any) => apiFetch<any>('/guests', { method: 'POST', body: JSON.stringify(data) }),
  updateGuest: (id: number, data: any) => apiFetch<any>(`/guests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  checkoutGuest: (id: number) => apiFetch<any>(`/guests/${id}/checkout`, { method: 'POST' }),

  // Payments
  getPayments: (params?: { propertyId?: number; status?: string; guestId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.propertyId) qs.set('propertyId', String(params.propertyId));
    if (params?.status) qs.set('status', params.status);
    if (params?.guestId) qs.set('guestId', String(params.guestId));
    return apiFetch<any[]>(`/payments${qs.toString() ? '?' + qs : ''}`);
  },
  getOverduePayments: () => apiFetch<any[]>('/payments/overdue'),
  createPayment: (data: any) => apiFetch<any>('/payments', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id: number, data: any) => apiFetch<any>(`/payments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Complaints
  getComplaints: (params?: { propertyId?: number; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.propertyId) qs.set('propertyId', String(params.propertyId));
    if (params?.status) qs.set('status', params.status);
    return apiFetch<any[]>(`/complaints${qs.toString() ? '?' + qs : ''}`);
  },
  createComplaint: (data: any) => apiFetch<any>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: number, data: any) => apiFetch<any>(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Staff
  getStaff: () => apiFetch<any[]>('/staff'),
  createStaff: (data: any) => apiFetch<any>('/staff', { method: 'POST', body: JSON.stringify(data) }),
  updateStaff: (id: number, data: any) => apiFetch<any>(`/staff/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteStaff: (id: number) => apiFetch<any>(`/staff/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboardSummary: (propertyId?: number) =>
    apiFetch<any>(`/dashboard/summary${propertyId ? '?propertyId=' + propertyId : ''}`),
  getRevenue: (propertyId?: number) =>
    apiFetch<any[]>(`/dashboard/revenue${propertyId ? '?propertyId=' + propertyId : ''}`),
  getOccupancy: (propertyId?: number) =>
    apiFetch<any[]>(`/dashboard/occupancy${propertyId ? '?propertyId=' + propertyId : ''}`),
  getRecentActivity: (propertyId?: number) =>
    apiFetch<any[]>(`/dashboard/recent-activity${propertyId ? '?propertyId=' + propertyId : ''}`),

  // Activity
  getActivity: (params?: { propertyId?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.propertyId) qs.set('propertyId', String(params.propertyId));
    if (params?.limit) qs.set('limit', String(params.limit));
    return apiFetch<any[]>(`/activity${qs.toString() ? '?' + qs : ''}`);
  },

  // Check-in tokens
  generateCheckinToken: (data: { propertyId: number; bedId?: number }) =>
    apiFetch<any>('/checkin/generate', { method: 'POST', body: JSON.stringify(data) }),
  getCheckinSubmissions: () => apiFetch<any[]>('/checkin/submissions'),
  getCheckinToken: (token: string) => apiFetch<any>(`/checkin/${token}`),
  submitCheckin: (token: string, data: any) =>
    apiFetch<any>(`/checkin/${token}/submit`, { method: 'POST', body: JSON.stringify(data) }),
  approveCheckin: (id: number) =>
    apiFetch<any>(`/checkin/submissions/${id}/approve`, { method: 'POST' }),
  rejectCheckin: (id: number, notes?: string) =>
    apiFetch<any>(`/checkin/submissions/${id}/reject`, { method: 'POST', body: JSON.stringify({ notes }) }),

  // AI
  chat: (message: string, propertyId?: number) =>
    apiFetch<{ message: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, propertyId }),
    }),
};
