"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { FileAudio, FileImage, Upload, X } from "lucide-react";

interface MediaUploaderProps {
  type: "image" | "audio";
  disabled?: boolean;
}

export default function MediaUploader({
  type,
  disabled = false,
}: MediaUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile) {
      setFile(selectedFile);

      if (type === "image") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(selectedFile.name);
      }
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="bg-muted rounded-full p-4">
            {type === "image" ? (
              <FileImage className="h-8 w-8 text-muted-foreground" />
            ) : (
              <FileAudio className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base font-medium">
              {type === "image"
                ? "Enviar uma imagem"
                : "Enviar um arquivo de áudio"}
            </p>
            <p className="text-sm text-muted-foreground mt-1"></p>
            <p className="text-sm text-muted-foreground mt-2">
              {type === "image"
                ? "JPG, PNG ou GIF até 5MB"
                : "MP3 ou WAV até 10MB"}
            </p>
          </div>
          <label htmlFor="file-upload">
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={disabled}
            >
              <Upload className="mr-2 h-4 w-4" />
              Selecionar Arquivo
            </Button>
            <input
              id="file-upload"
              type="file"
              accept={type === "image" ? "image/*" : "audio/*"}
              className="hidden"
              onChange={handleFileChange}
              disabled={disabled}
            />
          </label>
        </div>
      ) : (
        <div className="border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-base font-medium">Arquivo Selecionado</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFile}
              disabled={disabled}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Remover arquivo</span>
            </Button>
          </div>

          {type === "image" && preview ? (
            <Image
              src={preview || "/placeholder.svg"}
              alt="Pré-visualização"
              className="object-contain w-full h-full"
              layout="fill"
              objectFit="contain"
            />
          ) : (
            <div className="flex items-center gap-3 text-sm p-3 bg-muted/30 rounded-md">
              <FileAudio className="h-5 w-5 text-muted-foreground" />
              {file.name}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
