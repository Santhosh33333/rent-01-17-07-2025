import { useState } from 'react'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

export function VerifyGovIdPage() {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setUploading(false)
    toast.success('Government ID uploaded successfully')
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Government ID Verification</h2>
      <div className="card p-6">
        <p className="text-sm text-gray-600 mb-4">Upload a clear image of your government-issued ID (passport, driver's license, etc.).</p>
        <div className="mt-4">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        {uploading && <p className="mt-2 text-sm text-gray-500">Uploading...</p>}
        <div className="mt-6">
          <Link to="/verification" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Verification
          </Link>
        </div>
      </div>
    </div>
  )
}
