import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import CapaForm from '@/components/forms/CapaForm'
import { useCapas } from '@/hooks/useCapas'
import { useCreateCapa, useUpdateCapa } from '@/hooks/useCapas'
import { CapaCreateForm } from '@/lib/validations'
import { apiClient } from '@/lib/api'

const CapaFormPage: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { data: capas, refetch } = useCapas()
  const [initialData, setInitialData] = useState<any>(undefined)
  const [isReadOnly, setIsReadOnly] = useState(false) // New state for read-only title
  const createMutation = useCreateCapa()
  const updateMutation = useUpdateCapa()

  useEffect(() => {
    const loadCapaData = async () => {
      if (id) {
        try {
          // Editing existing CAPA - fetch from API to get evaluation item details
          const response = await apiClient.getCapa(parseInt(id))
          const capaData = response.data || response
          
          if (capaData) {
            // If CAPA is linked to an evaluation item, use its title and make it read-only
            const title = capaData.evaluation_item_title || capaData.title
            const shouldBeReadOnly = !!capaData.evaluation_item_title // Read-only if linked to evaluation item
            
            const formData = {
              ...capaData,
              title: title // Auto-fill title with evaluation item name
            }
            
            setInitialData(formData)
            setIsReadOnly(shouldBeReadOnly)
          }
        } catch (error) {
          console.error('Failed to fetch CAPA details:', error)
          // Fallback to existing method
          if (capas) {
            const found = (capas as any[]).find(c => c.id === parseInt(id))
            if (found) {
              setInitialData(found)
              setIsReadOnly(false) // Default to editable
            }
          }
        }
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
          // Pre-fill form with evaluation data and make title read-only
          const prefillData = {
            title: itemTitle, // Use item title directly as requested
            description: itemComment || '', // Use evaluator's comment as description
          }
          setInitialData(prefillData)
          setIsReadOnly(true) // Read-only for new CAPAs created from evaluation
        } else {
          setIsReadOnly(false) // Editable for manually created CAPAs
        }
      }
    }

    loadCapaData()
  }, [id, capas, searchParams])

  const handleSubmit = async (data: CapaCreateForm) => {
    try {
      console.log('Submitting CAPA data:', data) // Debug log
      
      if (id) {
        console.log('Updating CAPA with ID:', id)
        await updateMutation.mutateAsync({ id: parseInt(id), data })
        console.log('CAPA updated successfully')
      } else {
        console.log('Creating new CAPA')
        await createMutation.mutateAsync(data)
        console.log('CAPA created successfully')
      }
      
      await refetch()
      console.log('Data refetched successfully')
      
      // Show success message and navigate
      alert('تم حفظ الخطة التصحيحية بنجاح!')
      setTimeout(() => {
        navigate('/capa')
      }, 1000) // Small delay to show the success message
    } catch (err) {
      console.error('Failed to save CAPA', err)
      alert(`فشل في حفظ الخطة: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`)
    }
  }

  return (
    <div className="p-6">
      <CapaForm
        onSubmit={handleSubmit}
        initialData={initialData}
        onCancel={() => navigate('/capa')}
        isReadOnlyTitle={isReadOnly}
      />
    </div>
  )
}

export default CapaFormPage


