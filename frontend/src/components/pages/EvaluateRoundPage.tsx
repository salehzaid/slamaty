import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import EnhancedEvaluationPage from '@/components/forms/EnhancedEvaluationPage'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const EvaluateRoundPage: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  useAuth() // keep auth for side-effects; user not needed here

  // Get the previous page from location state, default to rounds list
  const previousPage = (location.state as any)?.from || '/rounds/list'

  const handleSubmit = async (payload: any) => {
    try {
      console.log('Evaluation completed:', payload)

      // Check for failing items to create CAPA automatically
      const failing = payload.evaluations?.filter((e: any) =>
        e.status === 'not_applied' || e.status === 'partial' || e.status === 'low_partial'
      ) || []

      if (failing.length > 0) {
        // Forward failing items to the CAPA Management page
        const roundResponse = await apiClient.getRound(parseInt(roundId!))
        const roundObj = (roundResponse as any)?.data || (roundResponse as any)

        navigate('/capa-dashboard', {
          state: {
            message: 'تم إرسال التقييم بنجاح. يوجد عناصر غير مكتملة تحتاج إلى خطة تصحيحية',
            success: true,
            failingItems: failing,
            round: roundObj
          }
        })
      } else {
        // All items passed, no CAPA needed - return to previous page
        navigate(previousPage, {
          state: {
            message: 'تم إرسال التقييم بنجاح - جميع العناصر مطبقة',
            success: true
          }
        })
      }
    } catch (error) {
      console.error('Failed to process evaluation:', error)
      alert('حدث خطأ. يرجى المحاولة مرة أخرى.')
    }
  }

  const handleCancel = () => {
    // Return to the page the user came from
    navigate(previousPage)
  }

  if (!roundId) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-4">معرف الجولة غير صحيح</h1>
          <button
            onClick={() => navigate(previousPage)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة إلى الجولات
          </button>
        </div>
      </div>
    )
  }

  return (
    <EnhancedEvaluationPage
      roundId={parseInt(roundId)}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  )
}

export default EvaluateRoundPage
