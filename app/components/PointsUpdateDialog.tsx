'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/app/contexts/AuthContext'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PointsUpdateDialogProps {
  userId: string
  currentPoints: number
  onPointsUpdated?: (newPoints: number) => void
  triggerComponent?: React.ReactNode
}

export default function PointsUpdateDialog({ 
  userId, 
  currentPoints, 
  onPointsUpdated,
  triggerComponent 
}: PointsUpdateDialogProps) {
  const { checkAuth } = useAuth()
  const [open, setOpen] = useState(false)
  // Use string type for the input to allow clearing the field
  const [pointsInput, setPointsInput] = useState<string>('')
  const [action, setAction] = useState<'add' | 'subtract' | 'set'>('add')
  const [reason, setReason] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleSubmit = async () => {
    const points = parseInt(pointsInput) || 0;
    
    if (points <= 0) {
      toast.error('Puanlar sıfırdan büyük olmalıdır')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch(`/api/users/${userId}/points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          points,
          action,
          reason
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Puanlar güncellenemedi')
      }
      
      toast.success('Puanlar başarıyla güncellendi')
      
      // Reset the form
      resetForm()
      setOpen(false)
      
      // Notify parent component about the update
      if (onPointsUpdated) {
        onPointsUpdated(data.user.points)
      }

      // Refresh auth context to update user data
      await checkAuth()
    } catch (error: any) {
      toast.error(error.message || 'Puanlar güncellenemedi')
      console.error('Points update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setPointsInput('')
    setAction('add')
    setReason('')
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen)
      if (!newOpen) resetForm()
    }}>
      <DialogTrigger asChild>
        {triggerComponent || (
          <Button 
            variant="outline"
            size="sm"
            className="ml-2"
          >
            Puan Güncelle
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-w-[90vw] p-0 gap-0 overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-gray-200 relative">
          <button 
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close dialog"
          >
        
          </button>
          <DialogTitle className="text-xl font-medium">Puan Güncelle</DialogTitle>
          <DialogDescription className="pt-1 text-gray-500">
            Mevcut puanlar: <span className="font-medium">{currentPoints}</span>
          </DialogDescription>
        </div>
        <div className="px-6 py-4 space-y-4">
          <div>
            <Select
              defaultValue="add"
              value={action}
              onValueChange={(value) => setAction(value as 'add' | 'subtract' | 'set')}
            >
              <SelectTrigger className="border border-gray-300 rounded-md h-11">
                <SelectValue placeholder="İşlem seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Puan Ekle</SelectItem>
                <SelectItem value="subtract">Puan Çıkar</SelectItem>
                <SelectItem value="set">Puan Belirle</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pointsInput}
              onChange={(e) => setPointsInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Puan"
              className="border border-gray-300 rounded-md h-11"
              autoFocus
            />
          </div>
          <div>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Neden (isteğe bağlı)"
              className="border border-gray-300 rounded-md h-11"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading || !pointsInput || parseInt(pointsInput) <= 0}
            className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Güncelleniyor...' : 'Puanları Güncelle'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 