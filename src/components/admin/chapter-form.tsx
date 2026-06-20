
"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Chapter } from "@/lib/types";
import { ScrollArea } from "../ui/scroll-area";
import { PlusCircle, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { icons } from "lucide-react";

const contentSchema = z.object({
  type: z.enum(["paragraph", "heading", "list", "quote", "hack", "tip"]),
  text: z.string().min(1, "O conteúdo não pode estar vazio."),
  icon: z.string().optional(),
});

const chapterSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres."),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  imageUrl: z.string().url("Deve ser uma URL de imagem válida."),
  content: z.array(contentSchema).min(1, "O capítulo deve ter pelo menos uma seção de conteúdo."),
});

type ChapterFormValues = z.infer<typeof chapterSchema>;

type ChapterFormProps = {
  chapter?: Chapter | null;
  onSubmit: (values: Omit<Chapter, 'id' | 'href'>) => void;
  onCancel: () => void;
};

const iconNames = Object.keys(icons);

export function ChapterForm({ chapter, onSubmit, onCancel }: ChapterFormProps) {
  const form = useForm<ChapterFormValues>({
    resolver: zodResolver(chapterSchema),
    defaultValues: {
      title: chapter?.title || "",
      description: chapter?.description || "",
      imageUrl: chapter?.imageUrl || "",
      content: chapter?.content || [],
    },
  });

  const { fields: contentFields, append: appendContent, remove: removeContent } = useFieldArray({
    control: form.control,
    name: "content",
  });

  function handleFormSubmit(values: ChapterFormValues) {
    onSubmit(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Capítulo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1. Perfil Blindado" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Curta</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o capítulo em uma frase..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL da Imagem de Capa</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Conteúdo do Capítulo</FormLabel>
              <FormDescription>
                Use **texto** para negrito, e para listas, separe os itens com ponto e vírgula (;).
              </FormDescription>
              <div className="space-y-4 mt-2">
                {contentFields.map((field, index) => (
                  <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => removeContent(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                          control={form.control}
                          name={`content.${index}.type`}
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-xs">Tipo</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione o tipo" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="paragraph">Parágrafo</SelectItem>
                                      <SelectItem value="heading">Título</SelectItem>
                                      <SelectItem value="list">Lista</SelectItem>
                                      <SelectItem value="quote">Citação</SelectItem>
                                      <SelectItem value="hack">Hack Psicológico</SelectItem>
                                      <SelectItem value="tip">Dica Avançada</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                       <FormField
                          control={form.control}
                          name={`content.${index}.icon`}
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel className="text-xs">Ícone (Opcional)</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione um ícone" />
                                      </SelectTrigger>
                                    </FormControl>
                                     <SelectContent>
                                      <ScrollArea className="h-72">
                                        {iconNames.map(iconName => (
                                            <SelectItem key={iconName} value={iconName}>{iconName}</SelectItem>
                                        ))}
                                      </ScrollArea>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name={`content.${index}.text`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Texto</FormLabel>
                          <FormControl><Textarea placeholder="Escreva o conteúdo aqui..." {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => appendContent({ type: 'paragraph', text: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Seção
              </Button>
            </div>
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 pt-6">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Salvar Capítulo</Button>
        </div>
      </form>
    </Form>
  );
}
