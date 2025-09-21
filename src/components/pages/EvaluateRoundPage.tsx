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
        // Get round details to prefill department/title
        const r = await apiClient.getRound(parseInt(roundId!))
        const round = (r as any)?.data || (r as any)
        const title = `خطة تصحيحية - ${round?.title || ''}`
        const description = `نتج عن تقييم الجولة ${round?.title || ''} العناصر التالية بحاجة لتصحيح:\n` + 
          failing.map((f: any) => `- عنصر ID ${f.item_id} (${f.status})`).join('\n')

        const defaultTarget = new Date()
        defaultTarget.setDate(defaultTarget.getDate() + 7)

        const capaPayload = {
          title,
          description,
          round_id: parseInt(roundId!),
          department: round?.department || '',
          priority: 'medium',
          assigned_to: user?.first_name + ' ' + user?.last_name || '',
          target_date: defaultTarget.toISOString(),
          risk_score: 3
        }

        try {
          const createdCapa = await apiClient.createCapa(capaPayload)
          console.log('CAPA created automatically:', createdCapa)
          
          // Navigate back with CAPA info
          navigate('/rounds/my-rounds', { 
            state: { 
              message: 'تم إرسال التقييم وإنشاء خطة تصحيحية تلقائياً',
              success: true,
              capaCreated: true,
              capaId: (createdCapa as any)?.id || (createdCapa as any)?.data?.id
            }
          })
        } catch (capaError) {
          console.error('Failed to create CAPA automatically:', capaError)
          
          // Navigate back with info about evaluation success but CAPA creation failure
          navigate('/rounds/my-rounds', { 
            state: { 
              message: 'تم إرسال التقييم بنجاح. يرجى إنشاء خطة تصحيحية يدوياً للعناصر غير المطبقة.',
              success: true,
              capaNeeded: true,
              roundId: parseInt(roundId!)
            }
          })
        }
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
