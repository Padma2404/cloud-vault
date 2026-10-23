
const pdfParse = require('pdf-parse')

async function extractText(buffer, mimeType) {
  if (
    mimeType === 'text/plain' ||
    mimeType === 'text/csv'
  ) {
    return buffer.toString('utf8')
  }

  if (mimeType === 'application/pdf') {
    try {
      const result = await pdfParse(buffer)
      return result.text || ''
    } catch (error) {
      console.error('PDF text extraction error:', error.message)
      return ''
    }
  }

  return ''
}

module.exports = extractText
