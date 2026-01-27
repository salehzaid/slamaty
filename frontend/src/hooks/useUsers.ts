import { useState, useEffect } from 'react'
import { User } from '@/types'
import { apiClient } from '@/lib/api'

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔄 useUsers: Fetching users...')
      const response = await apiClient.getUsers()
      console.log('📊 useUsers: Raw response:', response)
      
      // Handle different response formats
      let data = []
      if (Array.isArray(response)) {
        data = response
      } else if (response && response.data && Array.isArray(response.data)) {
        data = response.data
      } else if (response && Array.isArray(response)) {
        data = response
      }
      
      console.log('📊 useUsers: Processed data:', data)
      setUsers(data)
    } catch (err) {
      setError('فشل في تحميل المستخدمين')
      console.error('❌ useUsers: Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: any) => {
    try {
      const response = await apiClient.createUser(userData)
      setUsers(prev => [...prev, response.data])
      return response.data
    } catch (err) {
      setError('فشل في إنشاء المستخدم')
      throw err
    }
  }

  const updateUser = async (userId: number, userData: any) => {
    try {
      const response = await apiClient.updateUser(userId, userData)
      setUsers(prev => prev.map(user => 
        user.id === userId ? response.data : user
      ))
      return response.data
    } catch (err) {
      setError('فشل في تحديث المستخدم')
      throw err
    }
  }

  const deleteUser = async (userId: number) => {
    try {
      const response = await apiClient.deleteUser(userId)
      console.log('Delete user API response:', response)
      
      // تحديث قائمة المستخدمين بعد الحذف الناجح
      setUsers(prev => prev.filter(user => user.id !== userId))
      setError(null) // مسح أي أخطاء سابقة
      
      // إرجاع رسالة النجاح
      return response.data || response
    } catch (err: any) {
      console.error('Delete user error:', err)
      const errorMessage = err.message || 'فشل في حذف المستخدم'
      setError(errorMessage)
      throw err
    }
  }

  const sendWelcomeEmail = async (userId: number) => {
    try {
      await apiClient.sendWelcomeEmail(userId)
    } catch (err) {
      setError('فشل في إرسال الإيميل الترحيبي')
      throw err
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    sendWelcomeEmail
  }
}
