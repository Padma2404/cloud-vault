import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:5000'

function App() {
  const [isLogin, setIsLogin] = useState(true)
  const [authView, setAuthView] = useState('login')
  const [resetEmail, setResetEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(
    () => localStorage.getItem('token')
  )

  const [files, setFiles] = useState([])
  const [recycleBinFiles, setRecycleBinFiles] = useState([])
const [loadingRecycleBin, setLoadingRecycleBin] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  
  const [activities, setActivities] = useState([])
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [activityError, setActivityError] = useState('')


  const [uploading, setUploading] = useState(false)

  const [message, setMessage] = useState('')

  const [searchTerm, setSearchTerm] = useState('')

const [contentResults, setContentResults] = useState([])
const [contentSearchLoading, setContentSearchLoading] = useState(false)

  const [sortBy, setSortBy] =
    useState('newest')

  const [selectedFolder, setSelectedFolder] =
    useState('All')

  const [activePage, setActivePage] =
    useState('Dashboard')

  const [loadingFiles, setLoadingFiles] =
    useState(false)

  const [viewingFile, setViewingFile] =
    useState(null)

  const [profileEditing, setProfileEditing] =
    useState(false)

  const [profileName, setProfileName] =
    useState('')

  const [profileEmail, setProfileEmail] =
    useState('')

  /* =========================
     LOGIN / REGISTER
  ========================= */

  async function handleAuth(event) {
    event.preventDefault()

    setMessage('')

    if (!isLogin) {
      if (password !== confirmPassword) {
        setMessage(
          '❌ Password and Confirm Password do not match.'
        )
        return
      }
    }

    try {
      const endpoint = isLogin
        ? '/api/auth/login'
        : '/api/auth/register'

      const body = isLogin
        ? {
            email,
            password
          }
        : {
            name,
            email,
            password
          }

      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json'
          },
          body: JSON.stringify(body)
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Something went wrong'
        )
      }

      if (!isLogin) {
        setMessage(
          '✅ Account created successfully. Please login.'
        )

        setIsLogin(true)

        setName('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')

        return
      }

      localStorage.setItem(
        'token',
        data.token
      )

      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      )

      setToken(data.token)
      setUser(data.user)

      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setMessage('')
    } catch (error) {
      setMessage(
        `❌ ${error.message}`
      )
    }
  }

  /* =========================
     FORGOT / RESET PASSWORD
  ========================= */

  async function handleForgotPassword(event) {
    event.preventDefault()
    setMessage('')

    try {
      setResetLoading(true)
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not send OTP.')
      }

      setMessage(data.message || 'OTP sent. Check your email.')
      setAuthView('reset')
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setResetLoading(false)
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault()
    setMessage('')

    if (newPassword.length < 6) {
      setMessage('❌ Your new password must contain at least 6 characters.')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setMessage('❌ The new passwords do not match.')
      return
    }

    try {
      setResetLoading(true)
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: otp.trim(),
          newPassword
        })
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Could not reset password.')
      }

      setAuthView('login')
      setIsLogin(true)
      setEmail(resetEmail.trim())
      setPassword('')
      setOtp('')
      setNewPassword('')
      setConfirmNewPassword('')
      setResetEmail('')
      setMessage(data.message || '✅ Password reset successfully. You can now log in.')
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    } finally {
      setResetLoading(false)
    }
  }

  /* =========================
     PROFILE
  ========================= */

  function handleEditProfile() {
    setProfileName(user?.name || '')
    setProfileEmail(user?.email || '')
    setProfileEditing(true)
    setMessage('')
  }

  function handleSaveProfile() {
    const updatedName = profileName.trim()
    const updatedEmail = profileEmail.trim()

    if (!updatedName || !updatedEmail) {
      setMessage('❌ Name and email cannot be empty.')
      return
    }

    const updatedUser = {
      ...user,
      name: updatedName,
      email: updatedEmail
    }

    localStorage.setItem(
      'user',
      JSON.stringify(updatedUser)
    )

    setUser(updatedUser)
    setProfileEditing(false)
    setMessage('✅ Profile updated successfully.')
  }

  /* =========================
     LOGOUT
  ========================= */

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')

    setToken(null)
    setUser(null)
    setFiles([])

    setName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setRecycleBinFiles([])
setActivities([])
setViewingFile(null)
setMessage('')
  }

  /* =========================
     GET FILES
  ========================= */

  async function fetchFiles() {
    const savedToken =
      localStorage.getItem('token')

    if (!savedToken) {
      return
    }

    try {
      setLoadingFiles(true)

      const response = await fetch(
        `${API_URL}/api/files`,
        {
          headers: {
            Authorization:
              `Bearer ${savedToken}`
          }
        }
      )

      if (response.status === 401) {
        handleLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not retrieve files'
        )
      }

      setFiles(data.files || [])
    } catch (error) {
      console.error(error)

      setMessage(
        `❌ ${error.message}`
      )
    } finally {
      setLoadingFiles(false)
    }
  }
  
  async function fetchActivities() {
    const savedToken = localStorage.getItem('token')

    if (!savedToken) {
      return
    }

    try {
      setLoadingActivity(true)
      setActivityError('')

      const response = await fetch(
        `${API_URL}/api/files/activity`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not load activity history'
        )
      }

      setActivities(data.activities || [])
    } catch (error) {
      console.error('Activity history error:', error)
      setActivityError(error.message)
    } finally {
      setLoadingActivity(false)
    }
  }
    /* =========================
     RECYCLE BIN
  ========================= */

  async function fetchRecycleBin() {
    const savedToken = localStorage.getItem('token')

    if (!savedToken) return

    try {
      setLoadingRecycleBin(true)

      const response = await fetch(
        `${API_URL}/api/files/recycle-bin`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not load Recycle Bin'
        )
      }

      setRecycleBinFiles(data.files || [])
    } catch (error) {
      console.error('Recycle Bin error:', error)
      setMessage(`❌ ${error.message}`)
    } finally {
      setLoadingRecycleBin(false)
    }
  }

  async function handleRestoreFile(fileId, fileName) {
    const savedToken = localStorage.getItem('token')

    if (!savedToken) {
      setMessage('Please login again.')
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/files/${fileId}/restore`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not restore file'
        )
      }

      setRecycleBinFiles(current =>
        current.filter(file => file._id !== fileId)
      )

      await fetchFiles()

      setMessage(`✅ ${fileName} restored successfully!`)
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }
  }

  async function handlePermanentDelete(fileId, fileName) {
    const savedToken = localStorage.getItem('token')

    if (!savedToken) {
      setMessage('Please login again.')
      return
    }

    const confirmed = window.confirm(
      `Permanently delete "${fileName}"? This cannot be undone.`
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_URL}/api/files/${fileId}/permanent`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not permanently delete file'
        )
      }

      setRecycleBinFiles(current =>
        current.filter(file => file._id !== fileId)
      )

      setMessage(`✅ ${fileName} permanently deleted.`)
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }
  }

  async function handleEmptyRecycleBin() {
    const savedToken = localStorage.getItem('token')

    if (!savedToken) {
      setMessage('Please login again.')
      return
    }

    if (recycleBinFiles.length === 0) {
      setMessage('Recycle Bin is already empty.')
      return
    }

    const confirmed = window.confirm(
      'Permanently delete every file in the Recycle Bin? This cannot be undone.'
    )

    if (!confirmed) return

    try {
      const response = await fetch(
        `${API_URL}/api/files/recycle-bin/empty`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not empty Recycle Bin'
        )
      }

      setRecycleBinFiles([])
      await fetchFiles()

      setMessage('✅ Recycle Bin emptied successfully.')
    } catch (error) {
      setMessage(`❌ ${error.message}`)
    }
  }
    async function searchFileContents(query) {
    if (!query.trim()) {
      setContentResults([])
      return
    }

    const savedToken = localStorage.getItem('token')

    if (!savedToken) {
      return
    }

    try {
      setContentSearchLoading(true)

      const response = await fetch(
        `${API_URL}/api/files/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${savedToken}`
          }
        }
      )

      if (response.status === 401) {
        handleLogout()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Search failed')
      }

      setContentResults(data.results || [])
    } catch (error) {
      console.error('Content search error:', error)
      setContentResults([])
    } finally {
      setContentSearchLoading(false)
    }
  }


  useEffect(() => {
    if (token) {
      fetchFiles()
    }
  }, [token])
  useEffect(() => {
  if (token && activePage === 'Activity History') {
    fetchActivities()
  }
}, [token, activePage])
useEffect(() => {
  if (token && activePage === 'Recycle Bin') {
    fetchRecycleBin()
  }
}, [token, activePage])

  /* =========================
     FILE SELECT
  ========================= */

  function handleFileChange(event) {
    const file =
      event.target.files?.[0]

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      alert(
        'File is too large. Maximum size is 10 MB.'
      )

      event.target.value = ''
      setSelectedFile(null)

      return
    }

    setSelectedFile(file)
    setMessage('')
  }

  /* =========================
     UPLOAD
  ========================= */

  async function handleUpload(event) {
    event.preventDefault()

    if (!selectedFile) {
      setMessage(
        'Please select a file first.'
      )
      return
    }

    const savedToken =
      localStorage.getItem('token')

    if (!savedToken) {
      setMessage(
        'Please login again.'
      )
      return
    }

    try {
      setUploading(true)

      setMessage(
        `Uploading ${selectedFile.name}...`
      )

      const formData =
        new FormData()

      formData.append(
        'file',
        selectedFile
      )

      const response =
        await fetch(
          `${API_URL}/api/files/upload`,
          {
            method: 'POST',
            headers: {
              Authorization:
                `Bearer ${savedToken}`
            },
            body: formData
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Upload failed'
        )
      }

      setMessage(
        `✅ ${selectedFile.name} uploaded successfully!`
      )

      setSelectedFile(null)

      const fileInput =
        document.getElementById(
          'file-input'
        )

      if (fileInput) {
        fileInput.value = ''
      }

      await fetchFiles()

      setActivePage('My Files')
    } catch (error) {
      console.error(error)

      setMessage(
        `❌ ${error.message}`
      )
    } finally {
      setUploading(false)
    }
  }

  /* =========================
     OPEN FILE
  ========================= */

  function handleOpenFile(file) {
    if (!file || !file.fileUrl) {
      alert(
        'File URL is not available.'
      )
      return
    }

    setViewingFile(file)
    setActivePage('View File')
    setMessage('')
  }

  /* =========================
     DOWNLOAD FILE
  ========================= */

  async function handleDownloadFile(
    fileId,
    fileName
  ) {
    const savedToken =
      localStorage.getItem('token')

    if (!savedToken) {
      alert(
        'Please login again.'
      )
      return
    }

    try {
      setMessage(
        `Downloading ${fileName}...`
      )

      const response =
        await fetch(
          `${API_URL}/api/files/download/${fileId}`,
          {
            method: 'GET',
            headers: {
              Authorization:
                `Bearer ${savedToken}`
            }
          }
        )

      if (!response.ok) {
        let errorMessage =
          'Download failed'

        try {
          const data =
            await response.json()

          errorMessage =
            data.message ||
            errorMessage
        } catch {
          // ignore
        }

        throw new Error(
          errorMessage
        )
      }

      const blob =
        await response.blob()

      const blobUrl =
        window.URL.createObjectURL(
          blob
        )

      const link =
        document.createElement('a')

      link.href = blobUrl

      link.download =
        fileName || 'download'

      link.style.display = 'none'

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)

      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        )
      }, 1000)

      setMessage(
        `✅ ${fileName} downloaded successfully!`
      )
    } catch (error) {
      console.error(error)

      setMessage(
        `❌ ${error.message}`
      )
    }
  }

  /* =========================
     DELETE FILE
  ========================= */

  async function handleDeleteFile(
    fileId,
    fileName
  ) {
    const savedToken =
      localStorage.getItem('token')

    if (!savedToken) {
      alert(
        'Please login again.'
      )
      return
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${fileName}"?`
      )

    if (!confirmed) {
      return
    }

    try {
      setMessage(
        `Deleting ${fileName}...`
      )

      const response =
        await fetch(
          `${API_URL}/api/files/${fileId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization:
                `Bearer ${savedToken}`
            }
          }
        )

      const data =
        await response.json()

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Could not delete file'
        )
      }

      setFiles(
        currentFiles =>
          currentFiles.filter(
            file =>
              file._id !== fileId
          )
      )

      setMessage(
        `✅ ${fileName} deleted successfully!`
      )
    } catch (error) {
      console.error(error)

      setMessage(
        `❌ ${error.message}`
      )
    }
  }

  /* =========================
     FOLDER FILTER
  ========================= */

  const folders = [
    'All',
    'Images',
    'Documents',
    'Videos',
    'Other'
  ]

  /* =========================
     FILTER FILES
  ========================= */

  const filteredFiles =
    useMemo(() => {
      let result = [...files]

      if (
        selectedFolder !== 'All'
      ) {
        result =
          result.filter(
            file =>
              (file.folder ||
                'Other') ===
              selectedFolder
          )
      }

      
      if (searchTerm.trim()) {
        const search = searchTerm.trim().toLowerCase()

        const contentMatchedIds = new Set(
          contentResults.map(file => String(file.id))
        )

        result = result.filter(file => {
          const nameMatches = file.originalName
            ?.toLowerCase()
            .includes(search)

          const contentMatches = contentMatchedIds.has(
            String(file._id)
          )

          return nameMatches || contentMatches
        })
      }

      if (
        sortBy === 'newest'
      ) {
        result.sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
      }

      if (
        sortBy === 'oldest'
      ) {
        result.sort(
          (a, b) =>
            new Date(a.createdAt) -
            new Date(b.createdAt)
        )
      }

      if (
        sortBy === 'name-asc'
      ) {
        result.sort(
          (a, b) =>
            a.originalName.localeCompare(
              b.originalName
            )
        )
      }

      if (
        sortBy === 'name-desc'
      ) {
        result.sort(
          (a, b) =>
            b.originalName.localeCompare(
              a.originalName
            )
        )
      }

      if (
        sortBy === 'size-big'
      ) {
        result.sort(
          (a, b) =>
            b.fileSize -
            a.fileSize
        )
      }

      if (
        sortBy === 'size-small'
      ) {
        result.sort(
          (a, b) =>
            a.fileSize -
            b.fileSize
        )
      }

      return result
    }, [
      files,
      selectedFolder,
      searchTerm,
      sortBy,
      contentResults
    ])

  /* =========================
     STATS
  ========================= */

  const totalFiles =
    files.length

  const totalSize =
    files.reduce(
      (total, file) =>
        total +
        (file.fileSize || 0),
      0
    )

  const totalSizeMB =
    totalSize /
    (1024 * 1024)

  const imageCount =
    files.filter(
      file =>
        (file.folder ||
          'Other') ===
        'Images'
    ).length

  const documentCount =
    files.filter(
      file =>
        (file.folder ||
          'Other') ===
        'Documents'
    ).length

  const videoCount =
    files.filter(
      file =>
        (file.folder ||
          'Other') ===
        'Videos'
    ).length

  /* =========================
     HELPERS
  ========================= */

  function formatFileSize(size) {
    if (!size) {
      return '0 B'
    }

    if (size < 1024) {
      return `${size} B`
    }

    if (
      size <
      1024 * 1024
    ) {
      return `${(
        size / 1024
      ).toFixed(1)} KB`
    }

    if (
      size <
      1024 *
        1024 *
        1024
    ) {
      return `${(
        size /
        (1024 * 1024)
      ).toFixed(2)} MB`
    }

    return `${(
      size /
      (1024 *
        1024 *
        1024)
    ).toFixed(2)} GB`
  }

  function formatDate(date) {
    if (!date) {
      return '-'
    }

    return new Date(
      date
    ).toLocaleDateString(
      undefined,
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    )
  }

  function isImage(file) {
    return (
      file.fileType?.startsWith(
        'image/'
      ) ||
      [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'bmp'
      ].some(
        extension =>
          file.originalName
            ?.toLowerCase()
            .endsWith(
              `.${extension}`
            )
      )
    )
  }

  /* =========================
     PAGE NAVIGATION
  ========================= */

  function openPage(page) {
    setActivePage(page)

    if (page === 'My Files') {
      setSelectedFolder('All')
    }

    if (page === 'Images') {
      setSelectedFolder('Images')
    }

    if (page === 'Documents') {
      setSelectedFolder('Documents')
    }

    if (page === 'Videos') {
      setSelectedFolder('Videos')
    }
  }

  /* =========================
     AUTH PAGE
  ========================= */

  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">☁️</div>
          <h1>Cloud Vault</h1>
          <p className="auth-subtitle">Secure cloud storage for your files</p>

          {authView === 'forgot' ? (
            <>
              <h2 className="forgot-heading">Forgot Password?</h2>
              <p className="auth-subtitle">Enter your registered email address to receive a reset code.</p>
              <form className="auth-form" onSubmit={handleForgotPassword}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => setResetEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                  />
                </div>
                <button type="submit" className="auth-button" disabled={resetLoading}>
                  {resetLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
              {message && <div className="message">{message}</div>}
              <button type="button" className="forgot-back-button" onClick={() => { setAuthView('login'); setMessage('') }}>
                ← Back to Login
              </button>
            </>
          ) : authView === 'reset' ? (
            <>
              <h2 className="forgot-heading">Reset Password</h2>
              <p className="auth-subtitle">Enter the OTP sent to your email and choose a new password.</p>
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email OTP</label>
                  <input type="text" value={otp} onChange={e => setOtp(e.target.value)} placeholder="Enter the OTP" autoComplete="one-time-code" required />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter your new password" minLength={6} autoComplete="new-password" required />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input type="password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="Confirm your new password" minLength={6} autoComplete="new-password" required />
                </div>
                <button type="submit" className="auth-button" disabled={resetLoading}>
                  {resetLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
              {message && <div className="message">{message}</div>}
              <button type="button" className="forgot-back-button" onClick={() => { setAuthView('forgot'); setMessage('') }}>
                ← Back
              </button>
            </>
          ) : (
            <>
              <div className="auth-tabs">
                <button type="button" className={isLogin ? 'active' : ''} onClick={() => { setIsLogin(true); setAuthView('login'); setMessage(''); setPassword(''); setConfirmPassword('') }}>
                  Login
                </button>
                <button type="button" className={!isLogin ? 'active' : ''} onClick={() => { setIsLogin(false); setAuthView('login'); setMessage(''); setPassword(''); setConfirmPassword('') }}>
                  Create Account
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuth}>
                {!isLogin && (
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" required />
                  </div>
                )}

                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" required />
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" minLength={6} required />
                </div>

                {isLogin && (
                  <div className="forgot-password-row">
                    <button type="button" className="forgot-password-link" onClick={() => { setResetEmail(email); setAuthView('forgot'); setMessage('') }}>
                      Forgot Password?
                    </button>
                  </div>
                )}

                {!isLogin && (
                  <div className="form-group">
                    <label>Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm your password" minLength={6} required />
                  </div>
                )}

                <button type="submit" className="auth-button">
                  {isLogin ? 'Login' : 'Create Account'}
                </button>
              </form>

              {message && <div className="message">{message}</div>}
              <p className="auth-footer">Your files are securely stored in the cloud.</p>
            </>
          )}
        </div>
      </div>
    )
  }

  /* =========================
     DASHBOARD PAGE
  ========================= */

  return (
    <div className="dashboard-layout">

      <style>{`
        .file-actions {
          display: grid !important;
          grid-template-columns: 1fr 1fr 1fr !important;
          gap: 8px !important;
          margin-top: 14px !important;
        }

        .file-actions button {
          min-height: 38px !important;
          border-radius: 10px !important;
          border: 1px solid transparent !important;
          font-size: 13px !important;
          font-weight: 700 !important;
          cursor: pointer !important;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease !important;
        }

        .file-actions button:hover {
          transform: translateY(-1px) !important;
        }

        .file-actions .open-button {
          background: #eef4ff !important;
          color: #2563eb !important;
          border-color: #dbe7ff !important;
        }

        .file-actions .open-button:hover {
          background: #e0ebff !important;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.12) !important;
        }

        .file-actions .download-button {
          background: #2563eb !important;
          color: white !important;
          border-color: #2563eb !important;
          box-shadow: 0 5px 14px rgba(37, 99, 235, 0.18) !important;
        }

        .file-actions .download-button:hover {
          background: #1d4ed8 !important;
          box-shadow: 0 7px 18px rgba(37, 99, 235, 0.25) !important;
        }

        .file-actions .delete-button {
          background: #fff1f2 !important;
          color: #dc2626 !important;
          border-color: #ffe0e3 !important;
        }

        .file-actions .delete-button:hover {
          background: #ffe4e6 !important;
          box-shadow: 0 5px 14px rgba(220, 38, 38, 0.10) !important;
        }

        .viewer-page {
          width: 100%;
          min-width: 0;
        }

        .viewer-topbar {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 22px;
          margin-bottom: 20px;
          padding: 16px 18px;
          background: #ffffff;
          border: 1px solid #e7edf5;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .viewer-back-button,
        .viewer-download-button {
          border: 0;
          cursor: pointer;
          font-family: inherit;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.18s ease;
        }

        .viewer-back-button {
          min-height: 42px;
          padding: 0 14px;
          border-radius: 10px;
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #e2e8f0;
          white-space: nowrap;
        }

        .viewer-back-button:hover {
          background: #e8eef5;
          transform: translateX(-2px);
        }

        .viewer-back-icon {
          font-size: 21px;
          line-height: 1;
        }

        .viewer-title-wrap {
          min-width: 0;
        }

        .viewer-label {
          display: block;
          margin-bottom: 3px;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
        }

        .viewer-title-wrap h2 {
          margin: 0;
          color: #0f172a;
          font-size: 20px;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .viewer-download-button {
          min-height: 44px;
          padding: 0 18px;
          border-radius: 10px;
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 7px 18px rgba(37, 99, 235, 0.20);
          white-space: nowrap;
        }

        .viewer-download-button span {
          font-size: 20px;
          line-height: 1;
          font-weight: 500;
        }

        .viewer-download-button:hover {
          background: #1d4ed8;
          transform: translateY(-1px);
          box-shadow: 0 9px 22px rgba(37, 99, 235, 0.28);
        }

        .viewer-content-card {
          background: #ffffff;
          border: 1px solid #e7edf5;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .viewer-file-info {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 4px 4px 16px;
        }

        .viewer-file-icon {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: #eff6ff;
          font-size: 22px;
        }

        .viewer-file-info strong,
        .viewer-file-info span {
          display: block;
        }

        .viewer-file-info strong {
          max-width: 600px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #1e293b;
          font-size: 14px;
        }

        .viewer-file-info span {
          margin-top: 4px;
          color: #64748b;
          font-size: 12px;
        }

        .viewer-preview-area {
          min-height: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 22px;
          overflow: hidden;
          background: #f8fafc;
          border: 1px solid #e5eaf1;
          border-radius: 14px;
        }

        .viewer-image {
          display: block;
          max-width: 100%;
          max-height: 650px;
          object-fit: contain;
          border-radius: 10px;
          box-shadow: 0 8px 25px rgba(15, 23, 42, 0.10);
        }

        .viewer-video {
          display: block;
          width: min(100%, 900px);
          max-height: 650px;
          border-radius: 10px;
          background: #000000;
        }

        .viewer-document {
          width: 100%;
          height: 650px;
          border: 0;
          border-radius: 10px;
          background: #ffffff;
        }

        .viewer-unavailable {
          width: min(520px, 100%);
          text-align: center;
          padding: 55px 25px;
        }

        .viewer-unavailable-icon {
          width: 76px;
          height: 76px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 20px;
          background: #eef4ff;
          font-size: 38px;
        }

        .viewer-unavailable h3 {
          margin: 0 0 8px;
          color: #1e293b;
          font-size: 20px;
        }

        .viewer-unavailable p {
          margin: 0 auto 22px;
          max-width: 420px;
          color: #64748b;
          line-height: 1.6;
        }

        .viewer-download-center {
          margin: 0 auto;
        }

        @media (max-width: 800px) {
          .file-actions {
            grid-template-columns: 1fr !important;
          }

          .viewer-topbar {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .viewer-title-wrap h2 {
            white-space: normal;
            overflow: visible;
            text-overflow: clip;
          }

          .viewer-download-button,
          .viewer-back-button {
            width: 100%;
          }

          .viewer-preview-area {
            min-height: 380px;
            padding: 12px;
          }

          .viewer-document {
            height: 520px;
          }
        }

        .profile-page {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .profile-card {
          background: #ffffff;
          border: 1px solid #e7edf5;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .profile-cover {
          height: 130px;
          background: linear-gradient(135deg, #2563eb, #6366f1);
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .profile-big-avatar {
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: #ffffff;
          color: #2563eb;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          font-weight: 800;
          border: 5px solid #ffffff;
          transform: translateY(45px);
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
        }

        .profile-info {
          text-align: center;
          padding: 58px 20px 25px;
        }

        .profile-info h2 {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
        }

        .profile-info p {
          margin: 7px 0 12px;
          color: #64748b;
          font-size: 14px;
        }

        .profile-badge {
          display: inline-block;
          padding: 7px 13px;
          background: #eff6ff;
          color: #2563eb;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .profile-stat-card {
          background: #ffffff;
          border: 1px solid #e7edf5;
          border-radius: 14px;
          padding: 18px;
          display: flex;
          align-items: center;
          gap: 13px;
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
        }

        .profile-stat-icon {
          width: 45px;
          height: 45px;
          border-radius: 12px;
          background: #eef4ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
        }

        .profile-stat-card span {
          display: block;
          color: #64748b;
          font-size: 12px;
          margin-bottom: 5px;
        }

        .profile-stat-card strong {
          color: #0f172a;
          font-size: 18px;
        }

        .profile-details-card {
          background: #ffffff;
          border: 1px solid #e7edf5;
          border-radius: 18px;
          padding: 25px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
        }

        .profile-detail-row {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 17px 0;
          border-bottom: 1px solid #eef2f7;
        }

        .profile-detail-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
        }

        .profile-detail-row span {
          display: block;
          color: #64748b;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .profile-detail-row strong {
          display: block;
          color: #1e293b;
          font-size: 14px;
        }

        .profile-logout-button {
          margin-top: 22px;
          width: 100%;
          min-height: 45px;
          border: 0;
          border-radius: 10px;
          background: #fff1f2;
          color: #dc2626;
          font-weight: 700;
          cursor: pointer;
          transition: 0.2s ease;
        }

        .profile-logout-button:hover {
          background: #ffe4e6;
        }

        @media (max-width: 900px) {
          .profile-stats {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .profile-stats {
            grid-template-columns: 1fr;
          }

          .profile-details-card {
            padding: 18px;
          }
        }

        .profile-details-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .profile-edit-button {
          border: 0;
          border-radius: 10px;
          padding: 10px 16px;
          background: #2563eb;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .profile-edit-button:hover {
          background: #1d4ed8;
        }

        .profile-edit-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 18px;
        }

        .profile-edit-form label {
          color: #475569;
          font-size: 13px;
          font-weight: 700;
        }

        .profile-edit-form input {
          width: 100%;
          box-sizing: border-box;
          margin-top: 5px;
          padding: 11px 12px;
          border: 1px solid #dbe3ee;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
        }

        .profile-edit-form input:focus {
          border-color: #2563eb;
        }

        .profile-edit-actions {
          display: flex;
          gap: 10px;
          margin-top: 5px;
        }

        .profile-save-button,
        .profile-cancel-button {
          border: 0;
          border-radius: 10px;
          padding: 10px 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .profile-save-button {
          background: #2563eb;
          color: #ffffff;
        }

        .profile-cancel-button {
          background: #f1f5f9;
          color: #475569;
        }

      `}</style>

      {/* =====================
          LEFT SIDEBAR
      ===================== */}

      <aside className="sidebar">

        <div className="sidebar-top">

          <div className="sidebar-brand">

            <div className="sidebar-logo">
              ☁️
            </div>

            <div>
              <h2>
                Cloud Vault
              </h2>

              <span>
                Cloud Storage
              </span>
            </div>

          </div>


          <div className="sidebar-menu">

            <p className="menu-label">
              MAIN MENU
            </p>

            <button
              className={
                activePage ===
                'Dashboard'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage('Dashboard')
              }
            >
              <span className="menu-icon">
                🏠
              </span>

              Dashboard
            </button>

            <button
              className={
                activePage ===
                'My Files'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage('My Files')
              }
            >
              <span className="menu-icon">
                📁
              </span>

              My Files
            </button>

            <button
              className={
                activePage ===
                'Upload File'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage(
                  'Upload File'
                )
              }
            >
              <span className="menu-icon">
                ⬆️
              </span>

              Upload File
            </button>


            
            <button
              className={
              activePage === 'Activity History'
              ? 'sidebar-link active'
              : 'sidebar-link'
              }
              onClick={() => openPage('Activity History')}
            >
            <span className="menu-icon">🛡️</span>
              Activity History
            </button>
             <button
  className={
    activePage === 'Recycle Bin'
      ? 'sidebar-link active'
      : 'sidebar-link'
  }
  onClick={() => openPage('Recycle Bin')}
>
  <span className="menu-icon">
    🗑️
  </span>
  Recycle Bin
</button>
<button
              className={
                activePage === 'Profile'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage('Profile')
              }
            >
              <span className="menu-icon">
                👤
              </span>

              Profile
            </button>


            <p className="menu-label folder-label">
              CATEGORIES
            </p>

            <button
              className={
                activePage ===
                'Images'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage('Images')
              }
            >
              <span className="menu-icon">
                🖼️
              </span>
              


              Images
            </button>

            <button
              className={
                activePage ===
                'Documents'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage(
                  'Documents'
                )
              }
            >
              <span className="menu-icon">
                📄
              </span>

              Documents
            </button>

            <button
              className={
                activePage ===
                'Videos'
                  ? 'sidebar-link active'
                  : 'sidebar-link'
              }
              onClick={() =>
                openPage('Videos')
              }
            >
              <span className="menu-icon">
                🎬
              </span>

              Videos
            </button>

          </div>

        </div>


        <div className="sidebar-bottom">

          <div className="sidebar-user">

            <div className="avatar">
              {user.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="sidebar-user-details">

              <strong>
                {user.name}
              </strong>

              <span>
                {user.email}
              </span>

            </div>

          </div>
         


          <button
            className="sidebar-logout"
            onClick={handleLogout}
          >
            <span>
              🚪
            </span>

            Logout
          </button>

        </div>

      </aside>


      {/* =====================
          RIGHT CONTENT
      ===================== */}

      <main className="dashboard-content">

        {/* TOP HEADER */}

        <header className="dashboard-header">

          <div>

            <span className="header-small">
              CLOUD VAULT
            </span>

            <h1>
              {activePage}
            </h1>

          </div>

          <div className="header-user">

            <div className="header-user-text">

              <strong>
                {user.name}
              </strong>

              <span>
                Personal Cloud
              </span>

            </div>

            <div className="header-avatar">
              {user.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>


        {/* =====================
            DASHBOARD HOME
        ===================== */}

        {activePage ===
          'Dashboard' && (
          <>

            <section className="welcome-card">

              <div>

                <span>
                  Welcome back 👋
                </span>

                <h2>
                  Hello, {user.name}
                </h2>

                <p>
                  Manage your files
                  securely from one
                  place.
                </p>

              </div>

              <div className="welcome-cloud">
                ☁️
              </div>

            </section>


            {/* STATS */}

            <section className="stats-grid">

              <div className="stat-card">

                <div className="stat-icon blue">
                  📁
                </div>

                <div>
                  <span>
                    Total Files
                  </span>

                  <strong>
                    {totalFiles}
                  </strong>
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon purple">
                  💾
                </div>

                <div>
                  <span>
                    Storage Used
                  </span>

                  <strong>
                    {totalSizeMB.toFixed(
                      2
                    )}{' '}
                    MB
                  </strong>
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon green">
                  🖼️
                </div>

                <div>
                  <span>
                    Images
                  </span>

                  <strong>
                    {imageCount}
                  </strong>
                </div>

              </div>


              <div className="stat-card">

                <div className="stat-icon orange">
                  📄
                </div>

                <div>
                  <span>
                    Documents
                  </span>

                  <strong>
                    {documentCount}
                  </strong>
                </div>

              </div>

            </section>


            {/* QUICK UPLOAD */}

            <section className="dashboard-upload-card">

              <div className="content-title">

                <div>
                  <span>
                    STORAGE
                  </span>

                  <h2>
                    Upload a File
                  </h2>

                  <p>
                    Securely store your
                    files in Cloud Vault.
                  </p>
                </div>

              </div>

              <form
                onSubmit={handleUpload}
                className="upload-form"
              >

                <label
                  htmlFor="file-input"
                  className="file-picker"
                >

                  <div className="big-upload-icon">
                    ☁️
                  </div>

                  <strong>
                    {selectedFile
                      ? selectedFile.name
                      : 'Choose a file'}
                  </strong>

                  <small>
                    Maximum file size:
                    10 MB
                  </small>

                </label>

                <input
                  id="file-input"
                  type="file"
                  hidden
                  onChange={
                    handleFileChange
                  }
                />

                <button
                  type="submit"
                  className="upload-button"
                  disabled={
                    uploading ||
                    !selectedFile
                  }
                >
                  {uploading
                    ? 'Uploading...'
                    : 'Upload File'}
                </button>

              </form>

              {message && (
                <div className="message">
                  {message}
                </div>
              )}

            </section>


            {/* RECENT FILES */}

            <section className="files-section">

              <div className="content-title-row">

                <div>
                  <span>
                    YOUR STORAGE
                  </span>

                  <h2>
                    Recent Files
                  </h2>
                </div>

                <button
                  className="view-all-button"
                  onClick={() =>
                    openPage(
                      'My Files'
                    )
                  }
                >
                  View All →
                </button>

              </div>

              <FileGrid
                files={
                  filteredFiles.slice(
                    0,
                    6
                  )
                }
                loading={
                  loadingFiles
                }
                formatFileSize={
                  formatFileSize
                }
                formatDate={
                  formatDate
                }
                isImage={isImage}
                handleOpenFile={
                  handleOpenFile
                }
                handleDownloadFile={
                  handleDownloadFile
                }
                handleDeleteFile={
                  handleDeleteFile
                }
              />

            </section>

          </>
        )}


        {/* =====================
            PROFILE PAGE
        ===================== */}

        {activePage === 'Profile' && (
          <section className="profile-page">

            <div className="profile-card">

              <div className="profile-cover">
                <div className="profile-big-avatar">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="profile-info">
                <h2>{user.name}</h2>
                <p>{user.email}</p>
                <span className="profile-badge">
                  ☁️ CloudVault User
                </span>
              </div>

            </div>

            <div className="profile-stats">

              <div className="profile-stat-card">
                <div className="profile-stat-icon">📁</div>
                <div>
                  <span>Total Files</span>
                  <strong>{totalFiles}</strong>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-icon">💾</div>
                <div>
                  <span>Storage Used</span>
                  <strong>{totalSizeMB.toFixed(2)} MB</strong>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-icon">🖼️</div>
                <div>
                  <span>Images</span>
                  <strong>{imageCount}</strong>
                </div>
              </div>

              <div className="profile-stat-card">
                <div className="profile-stat-icon">📄</div>
                <div>
                  <span>Documents</span>
                  <strong>{documentCount}</strong>
                </div>
              </div>

            </div>

            <div className="profile-details-card">

              <div className="profile-details-header">
                <div className="page-title">
                  <span>ACCOUNT INFORMATION</span>
                  <h2>Profile Details</h2>
                  <p>Your CloudVault account information.</p>
                </div>

                {!profileEditing && (
                  <button
                    type="button"
                    className="profile-edit-button"
                    onClick={handleEditProfile}
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>

              {profileEditing ? (
                <div className="profile-edit-form">

                  <label>
                    Full Name
                    <input
                      type="text"
                      value={profileName}
                      onChange={event =>
                        setProfileName(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={event =>
                        setProfileEmail(event.target.value)
                      }
                    />
                  </label>

                  <div className="profile-edit-actions">
                    <button
                      type="button"
                      className="profile-save-button"
                      onClick={handleSaveProfile}
                    >
                      💾 Save Changes
                    </button>

                    <button
                      type="button"
                      className="profile-cancel-button"
                      onClick={() => setProfileEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>

                </div>
              ) : (
                <>
                  <div className="profile-detail-row">
                    <div className="profile-detail-icon">👤</div>
                    <div>
                      <span>Full Name</span>
                      <strong>{user.name}</strong>
                    </div>
                  </div>

                  <div className="profile-detail-row">
                    <div className="profile-detail-icon">📧</div>
                    <div>
                      <span>Email Address</span>
                      <strong>{user.email}</strong>
                    </div>
                  </div>

                  <div className="profile-detail-row">
                    <div className="profile-detail-icon">🔐</div>
                    <div>
                      <span>Account Security</span>
                      <strong>Password Protected</strong>
                    </div>
                  </div>
                </>
              )}

              <button
                type="button"
                className="profile-logout-button"
                onClick={handleLogout}
              >
                🚪 Logout from CloudVault
              </button>

            </div>

          </section>
        )}


        {/* =====================
            FILE VIEWER PAGE
        ===================== */}

        {activePage === 'View File' && viewingFile && (
          <section className="viewer-page">

            <div className="viewer-topbar">

              <button
                type="button"
                className="viewer-back-button"
                onClick={() => {
                  setViewingFile(null)
                  openPage('My Files')
                }}
              >
                <span className="viewer-back-icon">←</span>
                <span>Back to My Files</span>
              </button>

              <div className="viewer-title-wrap">
                <span className="viewer-label">
                  FILE PREVIEW
                </span>

                <h2 title={viewingFile.originalName}>
                  {viewingFile.originalName}
                </h2>
              </div>

              <button
                type="button"
                className="viewer-download-button"
                onClick={() =>
                  handleDownloadFile(
                    viewingFile._id,
                    viewingFile.originalName
                  )
                }
              >
                <span>↓</span>
                Download
              </button>

            </div>

            <div className="viewer-content-card">

              <div className="viewer-file-info">
                <div className="viewer-file-icon">
                  {viewingFile.folder === 'Images'
                    ? '🖼️'
                    : viewingFile.folder === 'Videos'
                    ? '🎬'
                    : viewingFile.folder === 'Documents'
                    ? '📄'
                    : '📦'}
                </div>

                <div>
                  <strong>{viewingFile.originalName}</strong>
                  <span>
                    {formatFileSize(viewingFile.fileSize)}
                    {' • '}
                    {viewingFile.folder || 'Other'}
                  </span>
                </div>
              </div>

              <div className="viewer-preview-area">

                {viewingFile.fileType?.startsWith('image/') ? (
                  <img
                    className="viewer-image"
                    src={viewingFile.fileUrl}
                    alt={viewingFile.originalName}
                  />
                ) : viewingFile.fileType === 'application/pdf' ? (
                  <iframe
                    className="viewer-document"
                    src={viewingFile.fileUrl}
                    title={viewingFile.originalName}
                  />
                ) : viewingFile.fileType?.startsWith('video/') ? (
                  <video
                    className="viewer-video"
                    controls
                    src={viewingFile.fileUrl}
                  >
                    Your browser does not support video playback.
                  </video>
                ) : viewingFile.fileType?.startsWith('text/') ? (
                  <iframe
                    className="viewer-document"
                    src={viewingFile.fileUrl}
                    title={viewingFile.originalName}
                  />
                ) : (
                  <div className="viewer-unavailable">
                    <div className="viewer-unavailable-icon">
                      📄
                    </div>

                    <h3>
                      Preview is not available
                    </h3>

                    <p>
                      This file type cannot be previewed inside Cloud Vault.
                    </p>

                    <button
                      type="button"
                      className="viewer-download-button viewer-download-center"
                      onClick={() =>
                        handleDownloadFile(
                          viewingFile._id,
                          viewingFile.originalName
                        )
                      }
                    >
                      <span>↓</span>
                      Download File
                    </button>
                  </div>
                )}

              </div>

            </div>

          </section>
        )}

        {/* =====================
            UPLOAD PAGE
        ===================== */}

        {activePage ===
          'Upload File' && (
          <section className="page-card">

            <div className="page-title">

              <span>
                FILE MANAGEMENT
              </span>

              <h2>
                Upload File
              </h2>

              <p>
                Upload and securely
                store a file in your
                cloud vault.
              </p>

            </div>

            <form
              onSubmit={handleUpload}
              className="large-upload-area"
            >

              <label
                htmlFor="file-input-page"
                className="large-file-picker"
              >

                <div className="large-upload-icon">
                  ☁️
                </div>

                <h3>
                  {selectedFile
                    ? selectedFile.name
                    : 'Select a file'}
                </h3>

                <p>
                  Click here to browse
                  your computer
                </p>

                <span>
                  Maximum size: 10 MB
                </span>

              </label>

              <input
                id="file-input-page"
                type="file"
                hidden
                onChange={
                  handleFileChange
                }
              />

              <button
                type="submit"
                className="upload-button large-button"
                disabled={uploading}
                onClick={(event) => {
                  if (!selectedFile) {
                    event.preventDefault()

                    document
                      .getElementById('file-input-page')
                      ?.click()
                  }
                }}
              >
                {uploading
                  ? 'Uploading...'
                  : selectedFile
                  ? 'Upload File'
                  : 'Choose File'}
              </button>

            </form>

            {message && (
              <div className="message">
                {message}
              </div>
            )}

          </section>
        )}


        {/* =====================
            FILE PAGES
        ===================== */}

        {[
          'My Files',
          'Images',
          'Documents',
          'Videos'
        ].includes(
          activePage
        ) && (
          <section className="files-section">

            <div className="content-title-row">

            </div>


            <div className="file-toolbar">

             
<div className="search-box">
  <span>🔍</span>
  <input
    type="text"
    placeholder="Search files by name..."
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
  />
</div>


              <select
                value={sortBy}
                onChange={e =>
                  setSortBy(
                    e.target.value
                  )
                }
              >

                <option value="newest">
                  Newest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

                <option value="name-asc">
                  Name A-Z
                </option>

                <option value="name-desc">
                  Name Z-A
                </option>

                <option value="size-big">
                  Largest First
                </option>

                <option value="size-small">
                  Smallest First
                </option>

              </select>

            </div>


            {activePage ===
              'My Files' && (
              <div className="folder-list">

                {folders.map(
                  folder => (
                    <button
                      key={folder}
                      className={
                        selectedFolder ===
                        folder
                          ? 'folder-button active'
                          : 'folder-button'
                      }
                      onClick={() =>
                        setSelectedFolder(
                          folder
                        )
                      }
                    >

                      {folder ===
                        'All' &&
                        '📁'}

                      {folder ===
                        'Images' &&
                        '🖼️'}

                      {folder ===
                        'Documents' &&
                        '📄'}

                      {folder ===
                        'Videos' &&
                        '🎬'}

                      {folder ===
                        'Other' &&
                        '📦'}

                      {folder}

                    </button>
                  )
                )}

              </div>
            )}


            <FileGrid
              files={
                filteredFiles
              }
              loading={
                loadingFiles
              }
              formatFileSize={
                formatFileSize
              }
              formatDate={
                formatDate
              }
              isImage={isImage}
              handleOpenFile={
                handleOpenFile
              }
              handleDownloadFile={
                handleDownloadFile
              }
              handleDeleteFile={
                handleDeleteFile
              }
            />

          </section>
        )}
        
        {activePage === 'Activity History' && (
          <section className="files-section">
            <div className="content-title-row">
              <h2>🛡️ Activity History</h2>

              <button
                className="upload-button"
                onClick={fetchActivities}
                disabled={loadingActivity}
              >
                {loadingActivity ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <p>Track recent actions in your Cloud Vault.</p>

            {activityError && (
              <div className="message">
                {activityError}
              </div>
            )}

            {loadingActivity ? (
              <div className="empty-state">
                <h3>Loading activity...</h3>
              </div>
            ) : activities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🛡️</div>
                <h3>No activity yet</h3>
                <p>Your recent file activity will appear here.</p>
              </div>
            ) : (
              <div className="file-toolbar">
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px' }}>Action</th>
                      <th style={{ padding: '12px' }}>Details</th>
                      <th style={{ padding: '12px' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => (
                      <tr key={activity._id}>
                        <td style={{ padding: '12px' }}>
                          {activity.action.replaceAll('_', ' ')}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {activity.details || '—'}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {new Date(activity.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
                {/* =====================
            RECYCLE BIN PAGE
        ===================== */}

        {activePage === 'Recycle Bin' && (
          <section className="files-section">
            <div className="content-title-row">
              <div>
                <h2>🗑️ Recycle Bin</h2>
                <p>
                  Restore deleted files or permanently remove them.
                </p>
              </div>

              <div style={{
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap'
              }}>
                <button
                  type="button"
                  className="upload-button"
                  onClick={fetchRecycleBin}
                  disabled={loadingRecycleBin}
                >
                  {loadingRecycleBin ? 'Refreshing...' : 'Refresh'}
                </button>

                <button
                  type="button"
                  className="delete-button"
                  onClick={handleEmptyRecycleBin}
                  disabled={
                    loadingRecycleBin ||
                    recycleBinFiles.length === 0
                  }
                >
                  Empty Recycle Bin
                </button>
              </div>
            </div>

            {message && (
              <div className="message">{message}</div>
            )}

            {loadingRecycleBin ? (
              <div className="empty-state">
                <div className="empty-icon">⏳</div>
                <h3>Loading Recycle Bin...</h3>
              </div>
            ) : recycleBinFiles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🗑️</div>
                <h3>Recycle Bin is empty</h3>
                <p>Files you delete will appear here.</p>
              </div>
            ) : (
              <div className="file-grid">
                {recycleBinFiles.map(file => (
                  <div className="file-card" key={file._id}>
                    <div className="file-preview">
                      {isImage(file) ? (
                        <img
                          src={file.fileUrl}
                          alt={file.originalName}
                        />
                      ) : (
                        <div className="file-type-icon">
                          {file.folder === 'Videos'
                            ? '🎬'
                            : file.folder === 'Documents'
                            ? '📄'
                            : '📦'}
                        </div>
                      )}
                    </div>

                    <div className="file-details">
                      <h3 title={file.originalName}>
                        {file.originalName}
                      </h3>

                      <div className="file-meta">
                        <span>
                          {formatFileSize(file.fileSize)}
                        </span>
                        <span>
                          Deleted: {formatDate(file.deletedAt)}
                        </span>
                      </div>

                      <div className="file-folder">
                        {file.folder || 'Other'}
                      </div>
                    </div>

                    <div
                      className="file-actions"
                      style={{
                        gridTemplateColumns: '1fr 1fr'
                      }}
                    >
                      <button
                        type="button"
                        className="open-button"
                        onClick={() =>
                          handleRestoreFile(
                            file._id,
                            file.originalName
                          )
                        }
                      >
                        ♻️ Restore
                      </button>

                      <button
                        type="button"
                        className="delete-button"
                        onClick={() =>
                          handlePermanentDelete(
                            file._id,
                            file.originalName
                          )
                        }
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}


      </main>

    </div>
  )
}


/* =========================
   FILE GRID COMPONENT
========================= */

function FileGrid({
  files,
  loading,
  formatFileSize,
  formatDate,
  isImage,
  handleOpenFile,
  handleDownloadFile,
  handleDeleteFile
}) {
  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-icon">
          ⏳
        </div>

        <h3>
          Loading files...
        </h3>
      </div>
    )
  }

  if (!files.length) {
    return (
      <div className="empty-state">

        <div className="empty-icon">
          📂
        </div>

        <h3>
          No files found
        </h3>

        <p>
          Upload a file to get
          started.
        </p>

      </div>
    )
  }

  return (
    <div className="file-grid">

      {files.map(file => (
        <div
          className="file-card"
          key={file._id}
        >

          <div className="file-preview">

            {isImage(file) ? (
              <img
                src={file.fileUrl}
                alt={file.originalName}
              />
            ) : (
              <div className="file-type-icon">

                {file.folder ===
                'Videos'
                  ? '🎬'
                  : file.folder ===
                    'Documents'
                  ? '📄'
                  : '📦'}

              </div>
            )}

          </div>


          <div className="file-details">

            <h3
              title={
                file.originalName
              }
            >
              {file.originalName}
            </h3>

            <div className="file-meta">

              <span>
                {formatFileSize(
                  file.fileSize
                )}
              </span>

              <span>
                {formatDate(
                  file.createdAt
                )}
              </span>

            </div>

            <div className="file-folder">
              {file.folder ||
                'Other'}
            </div>

          </div>


          <div className="file-actions">

            <button
              type="button"
              className="open-button"
              onClick={() =>
                handleOpenFile(
                  file
                )
              }
            >
              Open
            </button>

            <button
              type="button"
              className="download-button"
              onClick={() =>
                handleDownloadFile(
                  file._id,
                  file.originalName
                )
              }
            >
              Download
            </button>

            <button
              type="button"
              className="delete-button"
              onClick={() =>
                handleDeleteFile(
                  file._id,
                  file.originalName
                )
              }
            >
              Delete
            </button>

          </div>

        </div>
      ))}

    </div>
  )
}

export default App