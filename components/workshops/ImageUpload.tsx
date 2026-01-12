"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

interface ImageUploadProps {
    value: string;
    onChange: (url: string) => void;
    onRemove: () => void;
    disabled?: boolean;
}

export function ImageUpload({
    value,
    onChange,
    onRemove,
    disabled
}: ImageUploadProps) {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Upload failed');
            }

            const data = await res.json();
            onChange(data.url);
            toast.success("Görsel başarıyla yüklendi.");
        } catch (error: any) {
            toast.error(error.message || "Görsel yüklenirken bir sorun oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 w-full flex flex-col items-center justify-center">
            <div className="flex items-center gap-4">
                {value ? (
                    <div className="relative w-[200px] h-[200px] rounded-md overflow-hidden border border-amber-200">
                        <div className="z-10 absolute top-2 right-2">
                            <Button
                                type="button"
                                onClick={onRemove}
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <Image
                            fill
                            className="object-cover"
                            alt="Workshop image"
                            src={value}
                        />
                    </div>
                ) : (
                    <div
                        onClick={() => !disabled && fileInputRef.current?.click()}
                        className="w-[200px] h-[200px] rounded-md border-2 border-dashed border-amber-200 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 transition-colors bg-white/50"
                    >
                        {loading ? (
                            <Loader2 className="h-10 w-10 text-amber-600 animate-spin" />
                        ) : (
                            <>
                                <ImageIcon className="h-10 w-10 text-amber-400 mb-2" />
                                <span className="text-xs text-amber-600 font-medium">Görsel Yükle</span>
                            </>
                        )}
                    </div>
                )}
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onUpload}
                accept="image/*"
                className="hidden"
                disabled={disabled || loading}
            />
            {!value && !loading && (
                <p className="text-xs text-gray-500">
                    JPG, PNG veya WebP (Max 5MB)
                </p>
            )}
        </div>
    );
}
