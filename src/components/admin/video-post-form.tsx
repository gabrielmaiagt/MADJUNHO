
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { VideoPost } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import { PlusCircle, Trash2 } from "lucide-react";

const videoPostSchema = z.object({
  user: z.object({
    name: z.string().min(1, "O nome de usuário é obrigatório."),
    avatarUrl: z.string().url("A URL do avatar deve ser válida."),
  }),
  videoUrl: z.string().url("A URL do vídeo deve ser válida."),
  caption: z.string().min(1, "A legenda é obrigatória."),
  likes: z.preprocess(
    (a) => parseInt(String(a), 10),
    z.number().min(0, "As curtidas devem ser um número não negativo.")
  ),
  comments: z.array(z.object({
    id: z.string(),
    user: z.object({
      name: z.string().min(1),
      avatarUrl: z.string().url(),
    }),
    text: z.string().min(1),
    date: z.string().min(1),
    likes: z.preprocess((a) => parseInt(String(a), 10), z.number().min(0)),
    isPinned: z.boolean().optional(),
    replies: z.array(z.object({
        user: z.object({
            name: z.string().min(1),
            avatarUrl: z.string().url(),
        }),
        text: z.string().min(1),
        date: z.string().min(1),
        likes: z.preprocess((a) => parseInt(String(a), 10), z.number().min(0).optional()),
    })).optional(),
  })).optional(),
});

type VideoPostFormValues = z.infer<typeof videoPostSchema>;

type VideoPostFormProps = {
  videoPost?: VideoPost | null;
  onSubmit: (values: Omit<VideoPost, 'id'>) => void;
  onCancel: () => void;
};

export function VideoPostForm({ videoPost, onSubmit, onCancel }: VideoPostFormProps) {
  const form = useForm<VideoPostFormValues>({
    resolver: zodResolver(videoPostSchema),
    defaultValues: {
      user: {
        name: videoPost?.user.name || "",
        avatarUrl: videoPost?.user.avatarUrl || "",
      },
      videoUrl: videoPost?.videoUrl || "",
      caption: videoPost?.caption || "",
      likes: videoPost?.likes || 0,
      comments: videoPost?.comments || [],
    },
  });

  const { fields: commentFields, append: appendComment, remove: removeComment } = useFieldArray({
    control: form.control,
    name: "comments",
  });

  function handleFormSubmit(values: VideoPostFormValues) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="user.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: @patricia.oficial" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="user.avatarUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Avatar do Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL do Vídeo</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Legenda</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Escreva a legenda do vídeo aqui..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="likes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Curtidas Iniciais</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="12300" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
                <FormLabel>Comentários</FormLabel>
                <div className="space-y-4 mt-2">
                {commentFields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                        <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeComment(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <FormField
                            control={form.control}
                            name={`comments.${index}.user.name`}
                            render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`comments.${index}.user.avatarUrl`}
                            render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Avatar</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`comments.${index}.text`}
                            render={({ field }) => (
                                <FormItem><FormLabel className="text-xs">Comentário</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                            )}
                        />
                        {/* More fields for replies can be added here if needed */}
                    </div>
                ))}
                </div>
                 <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendComment({ id: `c-${Date.now()}`, user: { name: '', avatarUrl: ''}, text: '', date: '1h', likes: 0, replies: [] })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Comentário
                </Button>
            </div>


          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar Vídeo</Button>
        </div>
      </form>
    </Form>
  );
}

    