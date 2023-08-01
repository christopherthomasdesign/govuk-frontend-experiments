import { axe, goToComponent } from 'govuk-frontend-helpers/puppeteer'
import { getExamples } from 'govuk-frontend-lib/files'

describe('/components/select', () => {
  describe('component examples', () => {
    let exampleNames

    beforeAll(async () => {
      exampleNames = Object.keys(await getExamples('select'))
    })

    it('passes accessibility tests', async () => {
      for (const exampleName of exampleNames) {
        // Navigation to example, create report
        await goToComponent(page, 'select', { exampleName })
        await expect(axe(page)).resolves.toHaveNoViolations()
      }
    }, 90000)
  })
})