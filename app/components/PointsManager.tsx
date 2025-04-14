'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';

interface PointsManagerProps {
  userId: string;
  currentPoints: number;
  onPointsUpdated?: (newPoints: number) => void;
}

export default function PointsManager({ userId, currentPoints, onPointsUpdated }: PointsManagerProps) {
  const [points, setPoints] = useState<number>(0);
  const [action, setAction] = useState<'add' | 'subtract' | 'set'>('add');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (points < 0) {
      toast.error('Puanlar negatif olamaz');
      return;
    }

    try {
      setLoading(true);
      
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
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Puanlar güncellenemedi');
      }
      
      const data = await response.json();
      
      toast.success('Puanlar başarıyla güncellendi');
      
      // Reset the form
      setPoints(0);
      setReason('');
      
      // Notify parent component about the update
      if (onPointsUpdated) {
        onPointsUpdated(data.user.points);
      }
    } catch (error: any) {
      toast.error(error.message || 'Puanlar güncellenemedi');
      console.error('Points update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Puan Güncelle</CardTitle>
        <CardDescription>
          Mevcut puanlar: <span className="font-medium">{currentPoints}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Select
                value={action}
                onValueChange={(value) => setAction(value as 'add' | 'subtract' | 'set')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İşlem seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Puan Ekle</SelectItem>
                  <SelectItem value="subtract">Puan Çıkar</SelectItem>
                  <SelectItem value="set">Puan Belirle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                min="0"
                placeholder="Puan"
              />
            </div>
          </div>
          
          <div>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Neden (isteğe bağlı)"
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          type="submit" 
          onClick={handleSubmit}
          disabled={loading || points <= 0}
          className="w-full sm:w-auto"
        >
          {loading ? 'Güncelleniyor...' : 'Puanları Güncelle'}
        </Button>
      </CardFooter>
    </Card>
  );
} 