import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Attachment } from '../lib/supabase'
import { Upload, FileText, Download, Trash2, Loader } from 'lucide-react'

type FileAttachmentsProps = {
  relatedType: string
  relatedId: string
}

export default function FileAttachments({ relatedType, relatedId }: FileAttachmentsProps) {
  const { user } = useAuth()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAttachments()
  }, [relatedId])

  async function loadAttachments() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('related_type', relatedType)
        .eq('related_id', relatedId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAttachments(data || [])
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setUploading(true)

      // Convert file to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string

          // Call edge function to upload
          const { data, error } = await supabase.functions.invoke('upload-file', {
            body: {
              fileData: base64Data,
              fileName: file.name,
              relatedType,
              relatedId,
            },
          })

          if (error) throw error

          if (data.error) {
            throw new Error(data.error.message)
          }

          loadAttachments()
        } catch (err: any) {
          console.error('Upload error:', err)
          alert(`Upload failed: ${err.message}`)
        } finally {
          setUploading(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('File read error:', error)
      alert(`Failed to read file: ${error.message}`)
      setUploading(false)
    }
  }

  async function handleDelete(attachmentId: string, filePath: string) {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('crm-attachments')
        .remove([filePath])

      if (storageError) {
        console.error('Storage delete error:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId)
        .eq('user_id', user?.id)

      if (dbError) throw dbError

      loadAttachments()
    } catch (error) {
      console.error('Error deleting attachment:', error)
      alert('Failed to delete file')
    }
  }

  function formatFileSize(bytes?: number) {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="bg-surface rounded-lg p-6 shadow-card border border-neutral-200 dark:border-neutral-dark-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Attachments</h3>
        <label className="h-10 px-4 bg-primary-500 text-white rounded-md font-semibold btn-hover flex items-center gap-2 cursor-pointer">
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
          />
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <Loader className="animate-spin mx-auto mb-2" size={24} />
          <p className="text-secondary text-sm">Loading attachments...</p>
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-secondary text-center py-8">No attachments yet. Upload your first file!</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-3 bg-page dark:bg-neutral-dark-900 rounded-md hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileText className="text-primary-500 flex-shrink-0" size={20} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{attachment.file_name}</p>
                  <p className="text-xs text-secondary">
                    {formatFileSize(attachment.file_size)} • {new Date(attachment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`${supabase.storage.from('crm-attachments').getPublicUrl(attachment.file_path).data.publicUrl}`}
                  download={attachment.file_name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md text-primary-500"
                  title="Download"
                >
                  <Download size={18} />
                </a>
                <button
                  onClick={() => handleDelete(attachment.id, attachment.file_path)}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-dark-800 rounded-md text-error-500"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
