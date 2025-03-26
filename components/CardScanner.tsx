'use client'
import { useDropzone } from 'react-dropzone'
import { useState } from 'react'
import axios from 'axios'

export default function CardScanner() {
  const [loading, setLoading] = useState(false)
  const [cardData, setCardData] = useState(null)
  const [darkMode, setDarkMode] = useState(false)

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const onDrop = async (acceptedFiles: File[]) => {
    setLoading(true)
    const formData = new FormData()
    formData.append('cardImage', acceptedFiles[0])

    try {
      const { data } = await axios.post('/api/scan', formData)
      setCardData(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  return (
    <div className={`${darkMode ? 'dark' : ''} p-6`}>
      <button
        onClick={toggleDarkMode}
        className="mb-4 px-3 py-1 rounded bg-gray-300 dark:bg-gray-700"
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      {!cardData && !loading && (
        <div
          {...getRootProps()}
          className="border-2 border-dashed rounded p-10 cursor-pointer text-center"
        >
          <input {...getInputProps()} />
          <p>Drag & Drop your card image here, or click to browse</p>
        </div>
      )}

      {loading && <div className="text-center">⏳ Loading your card data...</div>}

      {cardData && !loading && (
        <div className="mt-4 p-4 rounded shadow-md bg-white dark:bg-gray-800">
          <h3 className="text-lg font-bold">{cardData.name}</h3>
          <p>Valuation: ${cardData.value}</p>
          <p>
            AI Recommendation: <strong>{cardData.recommendation}</strong>
          </p>
          <button
            onClick={() => setCardData(null)}
            className="mt-4 px-3 py-1 bg-red-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
}

