import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import CapaForm from '@/components/forms/CapaForm'
import { useCapas } from '@/hooks/useCapas'
import { useCreateCapa, useUpdateCapa } from '@/hooks/useCapas'
import { CapaCreateForm } from '@/lib/validations'

const CapaFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: capas, refetch } = useCapas()
  const [initialData, setInitialData] = useState<any>(undefined)
  const createMutation = useCreateCapa()
  const updateMutation = useUpdateCapa()

  useEffect(() => {
    if (id && capas) {
      // Editing existing CAPA
      const found = (capas as any[]).find(c => c.id === parseInt(id))
      if (found) setInitialData(found)
    } else {
      // Creating new CAPA - check for URL parameters from evaluation
      const itemId = searchParams.get('itemId')
      const itemTitle = searchParams.get('itemTitle')
      const itemComment = searchParams.get('itemComment')
      const itemCode = searchParams.get('itemCode')
      const roundId = searchParams.get('roundId')
      const department = searchParams.get('department')
      const status = searchParams.get('status')

      if (itemTitle) {
        // Pre-fill form with evaluation data
        const prefillData = {
          title: itemTitle, // Use item title directly as requested
          description: itemComment || '', // Use evaluator's comment as description
        }
        setInitialData(prefillData)
      }
    }
  }, [id, capas, searchParams])

  const handleSubmit = async (data: CapaCreateForm) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id: parseInt(id), data })
      } else {
        await createMutation.mutateAsync(data)
      }
      await refetch()
      navigate('/capa')
    } catch (err) {
      console.error('Failed to save CAPA', err)
      alert('فشل في حفظ الخطة. يرجى المحاولة لاحقاً.')
    }
  }

  return (
    <div className="p-6">
      <CapaForm
        onSubmit={handleSubmit}
        initialData={initialData}
        onCancel={() => navigate('/capa')}
      />
    </div>
  )
}

export default CapaFormPage


