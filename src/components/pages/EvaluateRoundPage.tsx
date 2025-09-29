import React from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import EvaluateRoundForm from '@/components/forms/EvaluateRoundForm'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const EvaluateRoundPage: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const handleSubmit = async (payload: any) => {
    try {
      console.log('Submitting evaluation:', payload)
      
      // Finalize evaluations to backend
      const response = await apiClient.finalizeEvaluation(parseInt(roundId!), {
        evaluations: payload.evaluations,
        notes: payload.notes
      })
      
      console.log('Evaluation submitted successfully:', response)
      
      // Check for failing items to create CAPA automatically
      const failing = payload.evaluations.filter((e: any) => e.status === 'not_applied' || e.status === 'partial')
      
      if (failing && failing.length > 0) {
      // prepare failing items and round info

      // Instead of creating a single CAPA automatically, forward failing items
      // to the Enhanced CAPA Management page so the responsible department can
      // create one CAPA per evaluation item (or draft plans for each).
      const roundResponse = await apiClient.getRound(parseInt(roundId!))
      const roundObj = (roundResponse as any)?.data || (roundResponse as any)

      navigate('/capa-enhanced', {
        state: {
          message: 'تم إرسال التقييم بنجاح. يوجد عناصر غير مكتملة تحتاج إلى خطة تصحيحية',
          success: true,
          failingItems: failing,
          round: roundObj
        }
      })
      } else {
        // All items passed, no CAPA needed
        navigate('/rounds/my-rounds', { 
          state: { 
            message: 'تم إرسال التقييم بنجاح - جميع العناصر مطبقة',
            success: true 
          }
        })
      }
    } catch (error) {
      console.error('Failed to submit evaluation:', error)
      alert('حدث خطأ في إرسال التقييم. يرجى المحاولة مرة أخرى.')
    }
  }

  const handleCancel = () => {
    navigate('/rounds/my-rounds')
  }

  if (!roundId) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h1 className="text-xl font-bold text-gray-900 mb-4">معرف الجولة غير صحيح</h1>
          <button 
            onClick={() => navigate('/rounds/my-rounds')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            العودة إلى جولاتي
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6">
        <EvaluateRoundForm
          roundId={parseInt(roundId)}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}

export default EvaluateRoundPage
