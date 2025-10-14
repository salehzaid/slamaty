import { test, expect } from '@playwright/test'

test('E2E CAPA flow: evaluate -> mark needs CAPA -> create CAPA -> verify in dashboard', async ({ request }) => {
  // Assumes backend running on localhost:8000 and SUPER_ADMIN token available via env
  const backend = process.env.BACKEND_URL || 'http://127.0.0.1:8000'
  const token = process.env.SUPER_ADMIN_TOKEN
  if (!token) {
    test.skip('No SUPER_ADMIN_TOKEN provided')
  }

  const headers = { Authorization: `Bearer ${token}` }

  // 1) Fetch items needing CAPA for round 100
  const resItems = await request.get(`${backend}/api/rounds/100/items-needing-capa`, { headers })
  expect(resItems.ok()).toBeTruthy()
  const itemsJson = await resItems.json()
  const items = itemsJson.items || []
  if (items.length === 0) {
    test.skip('No items needing CAPA found for round 100')
  }

  const first = items[0]

  // 2) Mark evaluation result as needs CAPA if not already
  if (!first.needs_capa) {
    const mark = await request.post(`${backend}/api/evaluation-results/${first.evaluation_result_id}/mark-needs-capa`, { headers, data: { needs_capa: true, capa_note: 'E2E test' } })
    expect(mark.ok()).toBeTruthy()
  }

  // 3) Create CAPA via legacy endpoint
  const payload = {
    title: `E2E CAPA: ${first.item_title || first.item_code}`,
    description: first.capa_note || first.comments || 'Created by E2E test',
    round_id: 100,
    evaluation_item_id: first.item_id,
    department: first.category_name || 'عام',
    sla_days: 14
  }

  const create = await request.post(`${backend}/api/capa/`, { headers, data: payload })
  expect(create.ok()).toBeTruthy()
  const createJson = await create.json()
  expect(createJson.capa_id).toBeTruthy()

  // 4) Verify CAPA appears in list
  const list = await request.get(`${backend}/api/capas/`, { headers })
  expect(list.ok()).toBeTruthy()
  const listJson = await list.json()
  expect(listJson.capas.some((c: any) => c.title === payload.title)).toBeTruthy()
})


