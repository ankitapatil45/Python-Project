import axios from 'axios'

// Use relative baseURL so vite proxy works
const api = axios.create({
  baseURL: '/', // match /auth and /tickets directly
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

// Auth
export const login = (email, password) => {
  return api.post('/auth/login', { email, password })
}

// Tickets
export const fetchTickets = () => {
  return api.get('/tickets')
}

export const createTicket = (ticketData) => {
  return api.post('/tickets', ticketData)
}

export const uploadAttachment = (ticketId, file) => {
  const formData = new FormData()
  formData.append('file', file)

  return api.post(`/tickets/${ticketId}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default api
